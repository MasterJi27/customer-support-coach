export const landingFeatures = [
  {
    icon: 'Brain',
    color: 'emerald',
    title: 'Live Sentiment & Intent',
    description: 'Every customer message is analyzed in real time — sentiment, frustration level, and intent before you reply.',
  },
  {
    icon: 'BookOpen',
    color: 'cyan',
    title: 'Instant KB Guidance',
    description: 'The matching knowledge-base article and a synthesized coaching tip surface automatically at the right moment.',
  },
  {
    icon: 'MessageSquareText',
    color: 'violet',
    title: 'Reply Suggestions',
    description: 'Draft a better reply with tone and clarity feedback, or rewrite a rough draft with one click.',
  },
  {
    icon: 'ShieldAlert',
    color: 'orange',
    title: 'Escalation Radar',
    description: 'Escalation risk, churn threat, CSAT forecast, and compliance flags — before the conversation goes sideways.',
  },
  {
    icon: 'BarChart3',
    color: 'pink',
    title: 'Post-Session Reports',
    description: 'After each session: sentiment journey, resolution quality, coaching tips, and an ISO-style audit.',
  },
  {
    icon: 'Trophy',
    color: 'emerald',
    title: 'Practice & Compete',
    description: 'Simulator, replay mode, survival arcade, and a live agent floor leaderboard to sharpen your skills.',
  },
]

export const howItWorks = [
  {
    step: '01',
    title: 'Set the scene',
    description: 'Pick a scenario, a real transcript, or type a live customer message. Choose the mode that fits your practice.',
  },
  {
    step: '02',
    title: 'Respond with a copilot',
    description: 'The coach analyzes each turn — sentiment, KB article, suggested reply, risk scores — and whispers guidance.',
  },
  {
    step: '03',
    title: 'Get your report card',
    description: 'At session end, review your resolution score, sentiment journey, compliance audit, and coaching tips.',
  },
]

export const quickActions = [
  { label: 'Start Coaching Session', to: '/setup', icon: 'Play', color: 'emerald' },
  { label: 'Live Coaching Console', to: '/dashboard', icon: 'Headphones', color: 'cyan' },
  { label: 'View Analytics', to: '/analytics', icon: 'BarChart3', color: 'violet' },
  { label: 'Browse Knowledge Base', to: '/knowledge', icon: 'BookOpen', color: 'orange' },
]

export const modes = [
  {
    id: 'simulator',
    title: 'Simulator',
    description: 'Practice against an AI customer persona that reacts to your replies, emotion by emotion.',
    icon: 'Bot',
    color: 'emerald',
  },
  {
    id: 'manual',
    title: 'Manual Input',
    description: 'Type a real customer message and get full live coaching on that exact turn.',
    icon: 'Keyboard',
    color: 'cyan',
  },
  {
    id: 'replay',
    title: 'Replay Transcript',
    description: 'Step through a real recorded transcript turn by turn and answer like the agent on duty.',
    icon: 'History',
    color: 'violet',
  },
]

export const scenarios = [
  {
    id: 'order_not_received',
    title: 'Zomato: Missing Items in Food Delivery',
    product: 'Zomato — Food Delivery App',
    persona: 'Hangry customer who waited 45 minutes for their dinner, only to find the main course missing.',
    emotion: 'angry',
    difficulty: 'Hard',
    problem: 'missing food',
    context: 'Customer ordered a family meal from a premium restaurant via Zomato for Rs 1200. The delivery arrived after 45 minutes, but the main course items (worth Rs 700) are missing from the sealed bag. Customer wants an immediate redelivery or full refund, not just a partial refund coupon.',
    resolution: 'Apologize + issue instant refund to source for missing items + add Rs 100 goodwill credit',
  },
  {
    id: 'wrong_order',
    title: 'AWS: Billing Double Charge on EC2 Upgrades',
    product: 'Amazon Web Services (AWS) — Cloud Infrastructure',
    persona: 'Professional DevOps engineer. Upgraded their EC2 instances but was charged twice on their corporate credit card.',
    emotion: 'frustrated',
    difficulty: 'Medium',
    problem: 'billing',
    context: 'Customer upgraded their AWS account EC2 instances. Their corporate credit card was charged twice (totaling $3,000 instead of $1,500). Their billing dashboard still shows pending. They have screenshots of the bank SMS. Needs excess charge refunded immediately to avoid accounting issues.',
    resolution: 'Apologize + manually sync billing dashboard + initiate $1,500 refund trace + escalate to billing team',
  },
  {
    id: 'payment_failed_deducted',
    title: 'Stripe: API Payment Failed But Money Deducted',
    product: 'Stripe — Payment Gateway',
    persona: 'Anxious e-commerce store owner using Stripe. A customer tried to pay, the API returned an error, but the customer bank account was deducted.',
    emotion: 'frustrated',
    difficulty: 'Hard',
    problem: 'payment',
    context: 'Store owner reports that their Stripe API integration showed a "Payment Failed" (HTTP 402) error for a $500 transaction. However, the end-user bank account was debited. The end-user is threatening the store owner with legal action.',
    resolution: 'Verify failed intent in logs + confirm it is an authorization hold (reverses in 3-5 days) + provide official ARN for end-user',
  },
  {
    id: 'production_404',
    title: 'Vercel: Production Deployment Failing (404)',
    product: 'Vercel — Frontend Cloud Platform',
    persona: 'Stressed frontend developer who pushed a critical hotfix to Vercel, but the production build is returning 404 for all users.',
    emotion: 'angry',
    difficulty: 'Hard',
    problem: 'deployment',
    context: 'Customer deployed a Next.js app to Vercel. The build logs show success, but the production URL returns a 404. The site is down for 10,000 active users. They are on the Pro plan and demand immediate rollback or edge caching fix.',
    resolution: 'Verify edge deployment status + rollback to previous successful build + clear edge cache + verify with curl across regions',
  },
  {
    id: 'cancel_retention',
    title: 'Spotify: Premium Cancel + Retention Offer',
    product: 'Spotify — Music Streaming',
    persona: 'Long-time subscriber who hit a billing dispute and now wants to cancel the family plan.',
    emotion: 'neutral',
    difficulty: 'Medium',
    problem: 'cancellation',
    context: 'Customer has been on Premium for 4 years on a family plan. A duplicate charge on the credit card triggered a dispute and now they want to cancel everything. They respond well to empathy and a retention offer.',
    resolution: 'Acknowledge billing error + refund duplicate + offer 3 months at 50% + keep family plan intact',
  },
]

export const transcripts = [
  { id: 'billing_dispute', label: 'Billing Dispute Resolution', turns: 8 },
  { id: 'video_not_rendering', label: 'Campaign Video Not Rendering', turns: 11 },
  { id: 'password_reset', label: 'Password Reset Success', turns: 6 },
  { id: 'double_deducted', label: 'Payment Double Deducted', turns: 9 },
]

export const liveTurns = [
  {
    role: 'customer',
    name: 'Rahul K.',
    text: 'I ordered a family meal worth Rs 1200 from your app and the main course is missing! Waited 45 minutes for this. I want a full refund right now.',
    time: '10:24 AM',
  },
  {
    role: 'coach',
    title: 'Coaching Signal',
    entries: [
      { key: 'Sentiment', value: 'Negative', tone: 'red' },
      { key: 'Frustration', value: '87%', tone: 'red' },
      { key: 'Intent', value: 'Refund request', tone: 'orange' },
      { key: 'Escalation risk', value: '78%', tone: 'red' },
      { key: 'Predicted CSAT', value: '1.8 / 5', tone: 'orange' },
      { key: 'Churn risk', value: '64%', tone: 'orange' },
    ],
  },
  {
    role: 'agent',
    name: 'You',
    text: "I'm really sorry about that Rahul. Let me check what happened with your order and get this sorted immediately. I can see the missing items are worth Rs 700.",
    time: '10:25 AM',
  },
  {
    role: 'coach',
    title: 'Coaching Signal',
    entries: [
      { key: 'Tone', value: 'Empathetic ✓', tone: 'emerald' },
      { key: 'Clarity', value: 'Good', tone: 'emerald' },
      { key: 'Compliance', value: 'Pass', tone: 'emerald' },
      { key: 'KB article', value: 'missing_items_refund_policy', tone: 'cyan' },
      { key: 'Suggested reply', value: 'Offer instant refund + Rs 100 goodwill credit', tone: 'violet' },
    ],
  },
  {
    role: 'customer',
    name: 'Rahul K.',
    text: 'A partial coupon is not acceptable. I want the full Rs 1200 back or a complete redelivery. This is ridiculous.',
    time: '10:26 AM',
  },
  {
    role: 'coach',
    title: 'Coaching Signal',
    entries: [
      { key: 'Frustration', value: '92% (rising)', tone: 'red' },
      { key: 'Escalation risk', value: '91%', tone: 'red' },
      { key: 'Supervisor', value: 'Whisper suggested: authorise full refund now', tone: 'orange' },
      { key: 'Viral threat', value: 'High — may post publicly', tone: 'red' },
      { key: 'Recommended action', value: 'Full refund + goodwill credit now', tone: 'emerald' },
    ],
  },
]

export const kbDocuments = [
  {
    id: 1,
    title: 'Missing Items Refund Policy',
    category: 'Refunds & Billing',
    keywords: ['missing items', 'sealed bag', 'partial refund', 'goodwill credit'],
    content: 'When items are missing from a sealed delivery, offer an instant refund to source for the value of missing items plus a Rs 100 goodwill credit. A full order refund is authorised when the customer refuses a partial refund after escalating once.',
    status: 'Active',
  },
  {
    id: 2,
    title: 'Payment Double Charge Escalation',
    category: 'Payments',
    keywords: ['double charge', 'refund trace', 'billing sync', 'corporate card'],
    content: 'Verify the failed intent in gateway logs. Confirm whether it is an authorization hold (reverses in 3-5 business days). If already captured, initiate a refund trace immediately and sync the customer dashboard.',
    status: 'Active',
  },
  {
    id: 3,
    title: 'Production 404 After Deploy',
    category: 'Deployment',
    keywords: ['404', 'rollback', 'edge cache', 'vercel'],
    content: 'Check edge deployment status first. Rollback to the previous successful build, clear the edge cache, then verify the URL with curl from multiple regions before closing the ticket.',
    status: 'Active',
  },
  {
    id: 4,
    title: 'Retention Offer Matrix',
    category: 'Retention',
    keywords: ['cancel', 'retention offer', 'discount', 'family plan'],
    content: 'For subscribers with 12+ months tenure who raise a billing dispute, offer 3 months at 50% after resolving the root cause. Never apply a retention offer before the actual issue is fixed.',
    status: 'Active',
  },
  {
    id: 5,
    title: 'Refund Dispute Legal Threats',
    category: 'Escalation',
    keywords: ['legal action', 'chargeback', 'official ARN', 'merchant support'],
    content: 'When an end-user threatens legal action, stay calm, provide the official ARN / reference number, and hand over to merchant support. Never admit liability on a live chat without manager approval.',
    status: 'Pending Review',
  },
]

export const leaderboard = [
  { rank: 1, name: 'Priya S.', team: 'Billing', sessions: 42, avgScore: 94, trend: '+6' },
  { rank: 2, name: 'Arjun M.', team: 'Complaints', sessions: 38, avgScore: 91, trend: '+3' },
  { rank: 3, name: 'Sneha R.', team: 'Payments', sessions: 35, avgScore: 89, trend: '+2' },
  { rank: 4, name: 'Vikram T.', team: 'Refunds', sessions: 40, avgScore: 86, trend: '-1' },
  { rank: 5, name: 'Neha K.', team: 'Retention', sessions: 31, avgScore: 84, trend: '+4' },
  { rank: 6, name: 'Rohit D.', team: 'Tech Support', sessions: 29, avgScore: 81, trend: '0' },
]

export const scoreTrend = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  values: [78, 82, 80, 86, 89, 92, 90],
}

export const escalationTriggers = [
  { label: 'Partial refund rejected', count: 14 },
  { label: 'Compensation demanded', count: 11 },
  { label: 'Chargeback threat', count: 8 },
  { label: 'No response > 2 min', count: 6 },
]

export const improvementAreas = [
  'Open replies with an apology, not a policy statement',
  'Offer the refund amount before asking questions',
  'Avoid the word "unfortunately" in the first sentence',
]

export const knowledgeGaps = [
  'Refund policy for tampered sealed bags',
  'AR handling for foreign-currency transactions',
]

export const hallOfFame = [
  { id: 'HOF-9360', title: 'Masterclass De-escalation (95%)', score: 0.95, summary: 'Agent handled high customer frustration perfectly, followed policy, and restored satisfaction.', date: '2026-07-24' },
  { id: 'HOF-5130', title: 'Masterclass De-escalation (95%)', score: 0.95, summary: 'Agent handled high customer frustration perfectly, followed policy, and restored satisfaction.', date: '2026-07-24' },
  { id: 'HOF-4417', title: 'Textbook Refund Flow (93%)', score: 0.93, summary: 'Instant refund to source, goodwill credit, and a warm close. Zero escalation risk by the end.', date: '2026-07-22' },
  { id: 'HOF-3982', title: 'Retention Save (91%)', score: 0.91, summary: 'Turned a cancellation request into a 3-month 50% retention with the family plan intact.', date: '2026-07-18' },
]

export const hallOfShame = [
  { id: 'HOS-2211', title: 'Policy Wall (38%)', score: 0.38, summary: 'Replied with a wall of policy text while frustration was at 90%. Customer rage-quit the chat.', date: '2026-07-20' },
  { id: 'HOS-1876', title: 'Dead Silence (31%)', score: 0.31, summary: 'No acknowledgment for 4+ minutes while the customer threatened a chargeback.', date: '2026-07-15' },
]

export const reportSample = {
  sessionId: 'SESS-88d3f2',
  date: '2026-07-25 19:21',
  scenario: 'Zomato: Missing Items in Food Delivery',
  overallScore: 86,
  resolution: 'Resolved — full refund + goodwill credit',
  duration: '8 min 42 sec',
  turns: 7,
  sentimentJourney: [
    { label: 'Open', value: 1.5 },
    { label: 'Mid', value: 2.1 },
    { label: 'Close', value: 4.2 },
  ],
  flags: [
    { severity: 'info', text: 'Frustration peaked at 92% after the partial coupon offer' },
    { severity: 'warning', text: 'Agent used "unfortunately" twice in the first reply' },
    { severity: 'success', text: 'Full refund authorised before the customer asked for escalation' },
  ],
  coachingTips: [
    'Lead with the refund amount in the first sentence for refund scenarios',
    'Mirror the customer emotion word ("I completely get the frustration")',
    'Offer the goodwill credit before they ask, not as a last resort',
  ],
  kbUsed: ['missing_items_refund_policy'],
}

export const summaryStats = [
  { label: 'Sessions Today', value: '12', sub: '+3 vs yesterday', icon: 'Headphones', color: 'emerald' },
  { label: 'Avg Resolution Score', value: '86%', sub: '+4% this week', icon: 'TrendingUp', color: 'cyan' },
  { label: 'Escalation Rate', value: '11%', sub: '-2% this week', icon: 'ShieldAlert', color: 'orange' },
  { label: 'Predicted CSAT', value: '4.3', sub: '+0.2 this week', icon: 'Star', color: 'violet' },
]

export const navConfig = {
  items: [
    { to: '/dashboard', label: 'Coaching Console', icon: 'LayoutDashboard', color: 'emerald' },
    { to: '/setup', label: 'Session Setup', icon: 'SlidersHorizontal', color: 'cyan' },
    { to: '/analytics', label: 'Analytics', icon: 'BarChart3', color: 'violet' },
    { to: '/reports', label: 'Reports', icon: 'FileText', color: 'orange' },
    { to: '/knowledge', label: 'Knowledge Base', icon: 'BookOpen', color: 'cyan' },
    { to: '/hall-of-fame', label: 'Hall of Fame', icon: 'Trophy', color: 'pink' },
    { to: '/settings', label: 'Settings', icon: 'Settings', color: 'slate' },
  ],
}
