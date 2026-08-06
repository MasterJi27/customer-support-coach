import { useQuery } from '@tanstack/react-query'
import api from './api'
import { reportSample } from '../data'

export const queryKeys = {
  analytics: ['analytics'],
  reports: ['reports'],
  hallOfFame: ['hall-of-fame'],
}

export function useAnalyticsQuery() {
  return useQuery({
    queryKey: queryKeys.analytics,
    queryFn: () => api.analytics(),
    staleTime: 30_000,
  })
}

export function useReportsQuery() {
  return useQuery({
    queryKey: queryKeys.reports,
    queryFn: () => api.reports(),
    staleTime: 30_000,
  })
}

export function useHallOfFameQuery() {
  return useQuery({
    queryKey: queryKeys.hallOfFame,
    queryFn: () => api.hallOfFame(),
    staleTime: 60_000,
  })
}

export function mapReport(raw) {
  const rq = raw.resolution_quality || null
  const resolutionLabel = rq
    ? rq.issue_resolved
      ? 'Resolved'
      : rq.escalation_needed
        ? 'Escalated'
        : 'In progress'
    : 'Completed'
  const journey = (raw.sentiment_journey || []).map((p) => ({
    label: `Turn ${p.turn ?? ''}`.trim(),
    value: Math.max(1, Math.min(5, 5 - (p.frustration ?? 0) * 4)),
  }))
  const flags = [
    ...(raw.escalation_triggers || []).map((t) => ({ severity: 'warning', text: t })),
    ...(raw.knowledge_gaps || []).map((t) => ({ severity: 'info', text: `Knowledge gap — ${t}` })),
  ]
  return {
    sessionId: raw.session_id || 'SESS-?',
    date: raw.generated_at || new Date().toISOString().slice(0, 16).replace('T', ' '),
    scenario: raw.agent_name ? `${raw.agent_name} · ${raw.interaction_mode || 'session'}` : 'CoachAI Session',
    overallScore: Math.round((raw.overall_score ?? 0.86) * 100),
    resolution: resolutionLabel,
    duration: '—',
    turns: raw.total_turns || 0,
    sentimentJourney: journey.length ? journey : reportSample.sentimentJourney,
    flags: flags.length ? flags : reportSample.flags,
    coachingTips: raw.coaching_recommendations?.length ? raw.coaching_recommendations : reportSample.coachingTips,
    kbUsed: raw.kb_articles_used?.length ? raw.kb_articles_used : reportSample.kbUsed,
  }
}

export function mapHallEntry(e) {
  return {
    id: e.entry_id || `HOF-${Math.random().toString(36).slice(2, 6)}`,
    title: e.title || 'Archived session',
    date: e.archived_at || e.created_at || '',
    summary: e.summary || '',
    score: e.overall_score ?? 0.5,
    transcript: e.transcript || [],
  }
}
