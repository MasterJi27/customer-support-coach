import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf():
    pdf_path = "CoachAI_Standup_Presentation_Report.pdf"
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#cb202d'),
        spaceAfter=8
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#475569'),
        spaceAfter=10
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12.5,
        leading=15,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=10,
        spaceAfter=5
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=4
    )

    bold_body_style = ParagraphStyle(
        'Bold_Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=3
    )

    story = []

    # Title Banner
    story.append(Paragraph("🚀 CoachAI — Exhaustive Master Technical & Feature Report", title_style))
    story.append(Paragraph("<b>Author:</b> Customer Support AI Team | <b>Date:</b> July 24, 2026 | <b>Status:</b> Production Ready", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#cb202d'), spaceAfter=8))

    # Executive Summary
    story.append(Paragraph("📌 Executive Summary", h2_style))
    story.append(Paragraph(
        "<b>CoachAI</b> is an enterprise-grade, real-time AI pair-programming copilot, simulator, quality auditing, and performance analytics platform "
        "for customer support representatives. It solves agent attrition, high onboarding times, manual QA audits, software bug tracking, and customer churn "
        "by delivering <b>turn-by-turn AI coaching, automated Jira bug ticket generation, post-session executive summaries, benchmark training vault archiving (Hall of Fame vs Hall of Shame), zero-dependency pure-Python RAG search, and authentic food delivery chatbot integrations (Swiggy/Zomato style)</b>.", body_style
    ))

    # Metrics Table
    metrics_data = [
        [Paragraph("<b>Metric</b>", bold_body_style), Paragraph("<b>Value / Status</b>", bold_body_style), Paragraph("<b>Technical Details</b>", bold_body_style)],
        [Paragraph("Architecture", body_style), Paragraph("Multi-Agent Decoupled", body_style), Paragraph("23 Specialized AI Agents in total", body_style)],
        [Paragraph("Core Modes", body_style), Paragraph("4 Interactive Modes", body_style), Paragraph("AI Simulator, 4-Ticket Arcade Desk, Manual Queue, Transcript Replay", body_style)],
        [Paragraph("Load Capacity", body_style), Paragraph("3.35 msg/sec", body_style), Paragraph("100% Pass Rate across 5 concurrent sessions", body_style)],
        [Paragraph("RAG Framework", body_style), Paragraph("Zero-LlamaIndex BM25", body_style), Paragraph("Pure-Python TF-IDF Search Engine with Keyword Highlighting", body_style)],
        [Paragraph("LLM Gateway", body_style), Paragraph("Groq & Gemini API", body_style), Paragraph("Llama 3.3 70B Versatile with automatic failover", body_style)],
    ]
    m_table = Table(metrics_data, colWidths=[100, 140, 312])
    m_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(Spacer(1, 4))
    story.append(m_table)
    story.append(Spacer(1, 6))

    # Feature Matrix
    story.append(Paragraph("🌟 Complete 23 AI Agents & Core Features Directory", h2_style))

    features = [
        ("1. Jira Bug Ticket Generator", "Auto-formats Jira engineering bug tickets with Red/Orange priority badges & 1-click Markdown download.", "LLM JSON extraction of summary, component, steps to reproduce, and suggested API fix.", "src/agents/jira_bug_generator.py"),
        ("2. Post-Interaction Summary", "Generates executive session reports with CSAT score, sentiment journey & resolution checklist.", "Post-session transcript analysis generating PerformanceReport models.", "src/agents/post_interaction_summary.py"),
        ("3. Hall of Fame / Shame Vault", "Archives top 1% masterclasses (Hall of Fame) & catastrophic failures (Hall of Shame).", "Persists benchmark training library in data/hall_of_fame.json.", "src/modules/hall_of_fame.py"),
        ("4. Decision Tree Scenario Builder", "Visual UI tool allowing trainers to create custom customer scenarios & decision trees.", "Validates & writes custom scenario configs to data/scenarios.json.", "src/agents/scenario_generator.py"),
        ("5. Auto-KB Draft Generator", "Auto-drafts new policy articles when RAG relevance drops < 45% for manager approval.", "Saves JSON draft cards in data/knowledge_base/pending/.", "src/agents/auto_kb_agent.py"),
        ("6. Customer Mind Reader", "Displays secret internal monologue vs typed chat text.", "Dual LLM prompt chain extracting hidden intent.", "src/agents/customer_mind_reader.py"),
        ("7. Multiverse Simulator", "Simulates parallel alternate choices (Timeline A vs B) with predicted CSAT scores.", "Parallel outcome trajectory computation side-by-side.", "src/agents/multiverse_simulator.py"),
        ("8. 4-Customer Arcade Desk", "Multi-ticket queue with 100 HP health bar, live timers & unlockable power-ups.", "Mathematical quality formula Q and combo multipliers.", "src/modules/survival_game.py"),
        ("9. 1-Click AI Auto-Pilot", "Autonomous copilot drafts perfect empathetic responses.", "Inspects turn analysis & policy cards automatically.", "src/agents/auto_pilot_agent.py"),
        ("10. Competitor Defection Alarm", "Detects threats to switch to Swiggy/UberEats with retention vouchers (STAY15).", "Regex brand scan paired with retention codes.", "src/agents/competitor_defection_agent.py"),
        ("11. Viral Threat Predictor", "Predicts Twitter/X escalation risk & outputs pre-approved PR statements.", "Flags CEO tags & viral keywords.", "src/agents/viral_threat_predictor.py"),
        ("12. Fraud & Scammer Shield", "Flags fake missing item claims & refund abuse patterns.", "Cross-references account telemetry vs fraud heuristics.", "src/agents/fraud_detector.py"),
        ("13. ISO-9001 QA Audit", "Generates official compliance audit scorecards post-session.", "Audits transcript logs against QA benchmarks.", "src/agents/qa_audit_agent.py"),
        ("14. Agent Cognitive Load Radar", "Monitors agent focus score (%) and workload stress levels.", "Evaluates turn velocity & text complexity.", "src/agents/cognitive_load_agent.py"),
        ("15. Customer Patience Clock", "Displays turns remaining before customer hangs up or escalates.", "Computes turn decay based on customer frustration.", "src/agents/patience_clock_agent.py"),
        ("16. Voice Stress Frequency Meter", "Displays real-time pitch variation (Hz) and audio stress levels.", "Pitch frequency spectrum analysis.", "src/ui/voice_stress_widget.py"),
        ("17-23. Zomato Support Suite", "Order card, Rider status, Bot prior chat, Photo proof & 7 support agents.", "Full food delivery chatbot integration.", "src/ui/zomato_widgets.py"),
    ]

    f_data = [[Paragraph("<b>Feature Name</b>", bold_body_style), Paragraph("<b>Business Value & Purpose</b>", bold_body_style), Paragraph("<b>Code Logic & Algorithm</b>", bold_body_style), Paragraph("<b>File Path</b>", bold_body_style)]]
    for name, val, logic, path in features:
        f_data.append([
            Paragraph(f"<b>{name}</b>", body_style),
            Paragraph(val, body_style),
            Paragraph(logic, body_style),
            Paragraph(f"<code>{path}</code>", body_style)
        ])

    f_table = Table(f_data, colWidths=[110, 130, 162, 150])
    f_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f8fafc')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(f_table)
    story.append(Spacer(1, 6))

    # Standup Talking Points Script
    story.append(Paragraph("🎯 Standup / Demo Call Presentation Script (Ready-to-Speak Script)", h2_style))
    story.append(Paragraph(
        "<i>\"Good morning team! Today I am presenting <b>CoachAI</b>, our enterprise customer support coaching and simulation platform.<br/><br/>"
        "Here are the key technical additions we built:<br/>"
        "<b>1. Automated Jira Bug Ticket Generator:</b> Post-session, the AI analyzes transcripts for software glitches (payment gateway 500, rider dispatch lag) and auto-generates engineering Jira tickets with Red/Orange priority badges and a 1-click <b>Download Jira Ticket Markdown</b> button.<br/>"
        "<b>2. Authentic Food Delivery Chatbot UI:</b> Order cards, live rider tracking (Ramesh Kumar • ETA 8 mins), photo proof uploaders, and Zomato Bot prior chat log showing automated option selections before escalation.<br/>"
        "<b>3. 4-Customer Simultaneous Arcade Challenge:</b> Multi-ticket queue under live countdown timers (45s), 100 HP health bars, streak multipliers, and power-ups.<br/>"
        "<b>4. Golden Training Vault (Hall of Fame & Hall of Shame):</b> Archives top 1% masterclasses and catastrophic failure cases to train new hires.<br/>"
        "<b>5. 23 Specialized AI Agents:</b> Mind Reader, Multiverse Branching, Defection Alarms, Fraud Loss Prevention, ISO-9001 QA Audit Certificates, and Auto-KB Drafting.<br/>"
        "<b>6. High Concurrency Performance:</b> 5-session parallel load test with a 100% pass rate and 3.35 messages/sec throughput.\"</i>",
        body_style
    ))

    doc.build(story)
    print(f"Successfully generated PDF report at {os.path.abspath(pdf_path)}")

if __name__ == "__main__":
    generate_pdf()
