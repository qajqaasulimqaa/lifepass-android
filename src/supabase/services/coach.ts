import { supabase } from '../lib/client';
import type { ChatMessage } from '../../types/coach';

/** Shape Anthropic expects — { role, content }. We map from our ChatMessage. */
type CoachMessage = { role: 'user' | 'assistant'; content: string };

/**
 * Send the chat history to the Coach backend, which proxies Claude.
 *
 * There are two backends we support, picked at runtime by env var:
 *
 *   - If `EXPO_PUBLIC_COACH_API_URL` is set → POSTs directly to that URL
 *     (currently used for the lifepass-api Next.js project running
 *     locally at http://localhost:3001/api/coach).
 *
 *   - Otherwise → calls the Supabase Edge Function named `coach`
 *     (source in `supabase/functions/coach/index.ts`, deployed via
 *     `supabase functions deploy coach`).
 *
 * Either way, the ANTHROPIC_API_KEY lives on the server and never reaches
 * the mobile bundle.
 *
 * To switch backends, edit `.env` and restart Expo (env vars are only
 * read at startup).
 */
export async function sendCoachMessage(history: ChatMessage[]): Promise<string> {
  const messages: CoachMessage[] = history.map((m) => ({
    role: m.role,
    content: m.text,
  }));

  const apiUrl = process.env.EXPO_PUBLIC_COACH_API_URL;

  if (apiUrl) {
    // Path A — direct fetch to a custom API endpoint (Next.js, etc.)
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
    return data.reply;
  }

  // Path B — Supabase Edge Function
  const { data, error } = await supabase.functions.invoke<{ reply: string; error?: string }>(
    'coach',
    { body: { messages } },
  );

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  if (!data?.reply) throw new Error('Empty response from coach');
  return data.reply;
}
