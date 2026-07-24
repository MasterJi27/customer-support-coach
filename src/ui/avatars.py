from src.core.models import SentimentLabel

def get_customer_avatar_html(sentiment: SentimentLabel | str, name: str = "Customer") -> str:
    """
    Renders an expressive SVG/Emoji avatar card corresponding to the customer's live emotion.
    """
    if isinstance(sentiment, SentimentLabel):
        s_val = sentiment.value.lower()
    else:
        s_val = str(sentiment).lower()

    if s_val == "angry":
        emoji = "😡"
        bg_color = "linear-gradient(135deg, #ef4444 0%, #991b1b 100%)"
        status_text = "ANGRY (CRITICAL)"
        border_glow = "0 0 15px rgba(239, 68, 68, 0.6)"
    elif s_val in ("frustrated", "negative"):
        emoji = "😤"
        bg_color = "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)"
        status_text = "FRUSTRATED"
        border_glow = "0 0 12px rgba(245, 158, 11, 0.5)"
    elif s_val in ("satisfied", "positive"):
        emoji = "😊"
        bg_color = "linear-gradient(135deg, #10b981 0%, #047857 100%)"
        status_text = "SATISFIED"
        border_glow = "0 0 12px rgba(16, 185, 129, 0.5)"
    else:
        emoji = "😐"
        bg_color = "linear-gradient(135deg, #64748b 0%, #334155 100%)"
        status_text = "NEUTRAL"
        border_glow = "0 0 8px rgba(100, 116, 139, 0.3)"

    return f"""
    <div style="
        display: flex;
        align-items: center;
        gap: 12px;
        background: {bg_color};
        padding: 10px 16px;
        border-radius: 12px;
        color: white;
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: {border_glow};
        margin-bottom: 10px;
    ">
        <div style="font-size: 2.2rem; line-height: 1;">{emoji}</div>
        <div>
            <div style="font-weight: 700; font-size: 1.05rem; letter-spacing: 0.5px;">{name}</div>
            <div style="font-size: 0.75rem; text-transform: uppercase; opacity: 0.9; font-weight: 600;">Mood: {status_text}</div>
        </div>
    </div>
    """
