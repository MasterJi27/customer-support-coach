from src.core.models import KnowledgeItem
from src.rag.knowledge_base import knowledge_base
from src.core.llm import llm_chat
from src.core.prompts import KNOWLEDGE_RECOMMENDATION_SYSTEM_PROMPT


class KnowledgeRecommendationAgent:
    def __init__(self):
        self._faq_fallback = [
            KnowledgeItem(
                title="How to reset password",
                content="Go to Settings > Account > Reset Password. Enter your registered email and follow the link sent to your inbox.",
                relevance_score=0.7,
                source="built-in faq",
            ),
            KnowledgeItem(
                title="Subscription billing cycle",
                content="Subscriptions renew automatically on the same date each month. You can view your billing history under Account > Billing.",
                relevance_score=0.65,
                source="built-in faq",
            ),
            KnowledgeItem(
                title="Contact support",
                content="If you need further assistance, reach out to our support team via live chat or email support@company.com.",
                relevance_score=0.6,
                source="built-in faq",
            ),
        ]

    def recommend(self, conversation_context: str, top_k: int = 3) -> list[KnowledgeItem]:
        # Step 1: Retrieval
        kb_results = knowledge_base.search(conversation_context, top_k=top_k)

        if not kb_results:
            kb_results = self._faq_fallback[:top_k]
            
        # Step 2: Agentic Synthesis (LLM)
        # Check if top retrieval relevance is low (KB Gap Detection)
        max_relevance = max([item.relevance_score for item in kb_results]) if kb_results else 0.0
        kb_gap_item = None
        if max_relevance < 0.45:
            kb_gap_item = KnowledgeItem(
                title="⚠️ Knowledge Base Gap Detected",
                content="No highly relevant support articles found in Knowledge Base for this topic (Relevance < 45%). Consider indexing new FAQ docs for this query.",
                relevance_score=0.99,
                source="kb-gap-alert"
            )

        context_str = "\n".join([f"Source: {item.title}\n{item.content}" for item in kb_results])
        
        system_prompt = KNOWLEDGE_RECOMMENDATION_SYSTEM_PROMPT
        
        user_prompt = (
            f"Conversation Context:\n{conversation_context}\n\n"
            f"Retrieved Knowledge:\n{context_str}\n\n"
            "Synthesize a brief, actionable recommendation for the support agent."
        )
        
        try:
            synthesis = llm_chat(system_prompt, user_prompt)
        except Exception:
            synthesis = None
            
        final_items = []
        if kb_gap_item:
            final_items.append(kb_gap_item)

        if synthesis and synthesis.strip():
            # Prepend the synthesized AI recommendation as a highly relevant item
            ai_item = KnowledgeItem(
                title="✨ Agentic RAG Synthesis",
                content=synthesis.strip(),
                relevance_score=1.0,
                source="ai-synthesis"
            )
            final_items.append(ai_item)

        return final_items + kb_results
