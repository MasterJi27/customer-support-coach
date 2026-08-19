const COMPOSIO_EXECUTE_URL = 'https://backend.composio.dev/api/v3.1/tools/execute/'

async function postComposioTool(url, apiKey, body) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  try {
    return await resp.json()
  } catch {
    return {}
  }
}

// Reusable: the one place that knows how to call a Composio tool, including
// the "server wants an explicit version" retry. Gmail today, Jira/Slack
// tomorrow — they'd all call this instead of re-implementing the retry.
export async function composioExecute(slug, arguments_) {
  const apiKey = process.env.COMPOSIO_API_KEY
  const userId = process.env.COMPOSIO_USER_ID
  if (!apiKey) return { success: false, message: 'COMPOSIO_API_KEY not configured.' }
  const url = COMPOSIO_EXECUTE_URL + slug
  const body = { user_id: userId, arguments: arguments_ }
  try {
    let data = await postComposioTool(url, apiKey, body)
    if (data?.successful === false) {
      const msg = data.error || JSON.stringify(data)
      if (String(msg).match(/version/i) && !body.version) {
        body.version = 'latest'
        data = await postComposioTool(url, apiKey, body)
      }
    }
    const ok = data?.successful !== false && !data?.error
    return { success: ok, message: ok ? 'ok' : (data?.error || JSON.stringify(data)) }
  } catch (e) {
    return { success: false, message: String(e?.message || e) }
  }
}

// Reusable: both the end-of-session report email and the manual "email
// customer" route send the same {recipient, subject, body} shape through
// Gmail — one function instead of two copies of that object literal.
export function sendEmailViaComposio(recipient_email, subject, body) {
  return composioExecute('GMAIL_SEND_EMAIL', { recipient_email, subject, body, is_html: false })
}
