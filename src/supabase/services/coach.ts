import { apiPost } from '../../api/client';
import type { ChatMessage, CoachReply, VenueCard } from '../../types/coach';

type CoachMessage = { role: 'user' | 'assistant'; content: string };

function parseReply(raw: string): CoachReply {
  // Strip markdown code fences if the AI wrapped the JSON in ```json ... ```
  const stripped = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  // Find the outermost JSON object anywhere in the response
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(stripped.slice(start, end + 1));
      if (parsed.type === 'venues' && Array.isArray(parsed.venues) && parsed.venues.length > 0) {
        return {
          text: String(parsed.intro ?? 'Here are some options for you:'),
          venueCards: parsed.venues as VenueCard[],
          searchQuery: parsed.searchQuery ? String(parsed.searchQuery) : undefined,
        };
      }
    } catch (_e) {
      console.warn('[Coach] JSON parse failed:', _e);
    }
  }
  return { text: raw };
}

// POST /api/v1/coach on the LifePass backend (same endpoint as iOS) —
// Supabase bearer auth, server-side rate limiting, and the Anthropic key
// never leaves the server. Contract:
//   POST { messages: [{ role, content }] } → { ok, data: { reply } }
// The backend drops leading assistant messages (the greeting) itself.
export async function sendCoachMessage(history: ChatMessage[]): Promise<CoachReply> {
  const messages: CoachMessage[] = history.map((m) => ({
    role: m.role,
    content: m.text,
  }));

  const { reply } = await apiPost<{ reply: string }>('/coach', { messages });
  if (!reply) throw new Error('Empty response from coach');
  return parseReply(reply);
}
