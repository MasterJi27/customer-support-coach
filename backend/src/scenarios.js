// Reusable: pick one random element. Shared by defaultScenario() below and
// by coaching.js's customerReply() fallback — a one-line utility that would
// otherwise get redefined in both places.
export function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export const SCENARIOS = {
  order_not_received: {
    problem: 'Customer ordered a family meal worth Rs 1200 from Zomato. The delivery arrived after 45 minutes, but the main course items (worth Rs 700) are missing from the sealed bag. Customer wants an immediate redelivery or full refund, not just a partial refund coupon.',
    persona: 'Hangry customer who waited 45 minutes for their dinner, only to find the main course missing.',
    title: 'Zomato: Missing Items in Food Delivery',
    product: 'Zomato — Food Delivery App',
  },
  wrong_order: {
    problem: 'Customer upgraded their AWS account EC2 instances. Their corporate credit card was charged twice (totaling $3,000 instead of $1,500). Their billing dashboard still shows pending. They have screenshots of the bank SMS. Needs excess charge refunded immediately to avoid accounting issues.',
    persona: 'Professional DevOps engineer. Upgraded their EC2 instances but was charged twice on their corporate credit card.',
    title: 'AWS: Billing Double Charge on EC2 Upgrades',
    product: 'Amazon Web Services (AWS) — Cloud Infrastructure',
  },
  payment_failed_deducted: {
    problem: 'Store owner reports that their Stripe API integration showed a "Payment Failed" (HTTP 402) error for a $500 transaction. However, the end-user bank account was debited. The end-user is threatening the store owner with legal action.',
    persona: 'Anxious e-commerce store owner using Stripe. A customer tried to pay, the API returned an error, but the customer bank account was deducted.',
    title: 'Stripe: API Payment Failed But Money Deducted',
    product: 'Stripe — Payment Gateway',
  },
  late_delivery_angry: {
    problem: 'Customer deployed a Next.js app to Vercel. The build logs show success, but the production URL returns a 404. The site is down for 10,000 active users. They are on the Pro plan and demand immediate rollback or edge caching fix.',
    persona: 'Stressed frontend developer who pushed a critical hotfix to Vercel, but the production build is returning 404 for all users.',
    title: 'Vercel: Production Deployment Failing (404)',
    product: 'Vercel — Frontend Cloud Platform',
  },
  cancel_retention: {
    problem: 'Customer has been on Premium for 4 years on a family plan. A duplicate charge on the credit card triggered a dispute and now they want to cancel everything. They respond well to empathy and a retention offer.',
    persona: 'Long-time subscriber who hit a billing dispute and now wants to cancel the family plan.',
    title: 'Spotify: Premium Cancel + Retention Offer',
    product: 'Spotify — Music Streaming',
  },
}

export const SURVIVAL_TICKETS = [
  { title: 'Double Billing Charge', keywords: ['refund', 'double', 'charged', 'money', 'bank'], message: 'You charged my card twice this month. I want my money back immediately.' },
  { title: 'Missing Delivery', keywords: ['order', 'missing', 'never arrived', 'track', 'delivery'], message: 'My order says delivered but I never got it. Where is my food?' },
  { title: 'Wrong Order Received', keywords: ['wrong', 'order', 'replace', 'sent back', 'exchange'], message: 'This is the wrong order. I ordered a burger, you sent a salad. Fix this.' },
  { title: 'Account Hacked', keywords: ['hacked', 'account', 'stolen', 'password', 'security'], message: 'Someone hacked my account and ordered using my card. Help me now!' },
  { title: 'Refund Delay', keywords: ['refund', '10 days', 'processing', 'waiting', 'when'], message: 'You promised a refund 10 days ago and nothing. When exactly will I get it?' },
]

// Reusable: resolves a scenario_choice key (with optional title/persona
// overrides) into the full scenario shape a session needs, including the
// opening customer line. Used by seedSession() and available for anything
// else that needs "build me a scenario" later (e.g. a future scenario picker).
export function defaultScenario(choice, overrides = {}) {
  const s = SCENARIOS[choice] || SCENARIOS.order_not_received
  return {
    title: overrides.title || s.title || `Scenario: ${choice.replace(/_/g, ' ')}`,
    persona: overrides.persona || s.persona,
    problem: s.problem,
    product: s.product,
    opening: `Hi. ${s.problem} ${rand(['I need this fixed right now.', 'This is unacceptable.', 'Please tell me how you will solve this.'])}`,
  }
}

export function seedSession(opts) {
  const id = `sess_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  const scenario = defaultScenario(opts.scenario_choice || 'order_not_received', {
    title: opts.scenario_title,
    persona: opts.scenario_persona,
  })
  return {
    id,
    mode: opts.mode || 'simulator',
    agent_name: opts.agent_name || 'Support Agent',
    product_context: opts.product_context || scenario.product || 'Zomato Food Delivery',
    scenario_choice: opts.scenario_choice || 'order_not_received',
    scenario,
    messages: [],
    created_at: new Date().toISOString(),
    is_active: true,
    user_id: opts.user_id || null,
    config: opts,
  }
}
