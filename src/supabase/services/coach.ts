import { supabase } from '../lib/client';
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

export async function sendCoachMessage(history: ChatMessage[]): Promise<CoachReply> {
  const messages: CoachMessage[] = history.map((m) => ({
    role: m.role,
    content: m.text,
  }));

  const apiUrl = process.env.EXPO_PUBLIC_COACH_API_URL;

  if (apiUrl) {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    const data = (await res.json().catch(() => null)) as
      | { reply?: string; error?: string }
      | null;
    if (!res.ok || data?.error) {
      throw new Error(data?.error ?? `Coach API ${res.status}`);
    }
    if (!data?.reply) throw new Error('Empty response from coach');
    return parseReply(data.reply);
  }

  const { data, error } = await supabase.functions.invoke<{ reply: string; error?: string }>(
    'coach',
    { body: { messages } },
  );

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  if (!data?.reply) throw new Error('Empty response from coach');
  return parseReply(data.reply);
}
