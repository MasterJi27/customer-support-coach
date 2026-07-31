import json

from src.core.config import settings
from src.core.models import ToolCallResult


class ComposioBackendService:
    """
    Real-world tool execution via the Composio platform (v3 API).
    Auto-degrades gracefully: if no API key / no connected account, every call
    returns a ToolCallResult with success=False instead of raising.
    """

    def __init__(self, api_key=None, user_id=None):
        self.api_key = api_key or settings.composio_api_key
        self.user_id = user_id or settings.composio_user_id
        self._client = None
        self._tool_versions = {}

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    @property
    def client(self):
        if self._client is None:
            if not self.api_key:
                raise RuntimeError("COMPOSIO_API_KEY not set")
            from composio import Composio
            self._client = Composio(api_key=self.api_key)
        return self._client

    def _tool_version(self, slug: str):
        if slug not in self._tool_versions:
            meta = self.client.tools.get_raw_composio_tool_by_slug(slug)
            versions = list(getattr(meta, "available_versions", None) or [])
            self._tool_versions[slug] = versions[0] if versions else None
        return self._tool_versions[slug]

    def _execute(self, slug: str, arguments: dict):
        version = self._tool_version(slug)
        if not version:
            raise RuntimeError(f"Could not resolve a toolkit version for {slug}")
        return self.client.tools.execute(
            slug=slug,
            arguments=arguments,
            user_id=self.user_id,
            version=version,
        )

    def _payload(self, resp) -> dict:
        data = getattr(resp, "data", None) or {}
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except Exception:
                data = {}
        if isinstance(data, dict):
            return data
        return {"raw": str(data)}

    def _fail(self, tool_name: str, arguments: dict, error: Exception) -> ToolCallResult:
        message = str(error)
        fix = ""
        if hasattr(error, "message"):
            message = error.message
        if hasattr(error, "suggested_fix"):
            fix = f" | {error.suggested_fix}"
        return ToolCallResult(
            tool_name=tool_name,
            arguments=arguments,
            success=False,
            result_text=f"[COMPOSIO] {message}{fix}",
        )

    def create_jira_ticket(
        self,
        project_key: str,
        summary: str,
        issue_type: str = "Bug",
        priority: str = "High",
        description: str = "",
        components: list[str] | None = None,
        labels: list[str] | None = None,
    ) -> ToolCallResult:
        arguments = {
            "project_key": project_key,
            "summary": summary,
            "issue_type": issue_type,
        }
        if priority:
            arguments["priority"] = priority
        if description:
            arguments["description"] = description
        if components:
            arguments["components"] = components
        if labels:
            arguments["labels"] = labels
        try:
            resp = self._execute("JIRA_CREATE_ISSUE", arguments)
            data = self._payload(resp)
            issue_key = data.get("issue_key") or data.get("key") or str(data or resp)
            return ToolCallResult(
                tool_name="jira_create_issue",
                arguments=arguments,
                success=True,
                result_text=f"{issue_key}",
            )
        except Exception as e:
            return self._fail("jira_create_issue", arguments, e)

    def send_email(self, recipient_email: str, subject: str, body: str, is_html: bool = False) -> ToolCallResult:
        arguments = {
            "recipient_email": recipient_email,
            "subject": subject,
            "body": body,
            "is_html": is_html,
        }
        try:
            resp = self._execute("GMAIL_CREATE_EMAIL_DRAFT", arguments)
            data = self._payload(resp)
            draft_id = data.get("draft_id") or data.get("id") or str(data or resp)
            return ToolCallResult(
                tool_name="gmail_create_email_draft",
                arguments=arguments,
                success=True,
                result_text=f"[COMPOSIO] Email draft created for {recipient_email} (draft id: {draft_id})",
            )
        except Exception as e:
            return self._fail("gmail_create_email_draft", arguments, e)

    def post_slack_message(self, channel: str, text: str) -> ToolCallResult:
        arguments = {
            "channel": channel,
            "text": text,
        }
        try:
            resp = self._execute("SLACK_CHAT_POST_MESSAGE", arguments)
            data = self._payload(resp)
            ts = data.get("ts") or str(data or resp)
            return ToolCallResult(
                tool_name="slack_post_message",
                arguments=arguments,
                success=True,
                result_text=f"[COMPOSIO] Slack message posted to {channel} (ts: {ts})",
            )
        except Exception as e:
            return self._fail("slack_post_message", arguments, e)

    def list_connected_accounts(self) -> list[str]:
        if not self.is_configured:
            return []
        try:
            resp = self.client.connected_accounts.list()
            items = list(getattr(resp, "items", None) or [])
            statuses = {}
            for item in items:
                toolkit = getattr(item, "toolkit", None)
                slug = getattr(toolkit, "slug", None) or str(item)
                status = getattr(item, "status", None) or "UNKNOWN"
                if slug not in statuses or status not in ("INITIALIZING",):
                    statuses[slug] = status
            return [f"{slug} ({status})" for slug, status in statuses.items()]
        except Exception:
            return []

    def get_connect_url(self, toolkit: str) -> str:
        if not self.is_configured:
            return ""
        try:
            configs = self.client.auth_configs.list()
            for item in getattr(configs, "items", None) or []:
                toolkit_meta = getattr(item, "toolkit", None)
                if toolkit_meta and toolkit_meta.slug == toolkit.lower():
                    link = self.client.connected_accounts.link(user_id=self.user_id, auth_config_id=item.id)
                    return getattr(link, "redirect_url", None) or ""
        except Exception:
            pass
        return ""


composio_backend = ComposioBackendService()
