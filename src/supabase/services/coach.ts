import { supabase } from '../lib/client';
import type { ChatMessage } from '../../types/coach';

/** Shape Anthropic expects — { role, content }. We map from our ChatMessage. */
type CoachMessage = { role: 'user' | 'assistant'; content: string };

/**
 * Send the chat history to the `coach` Edge Function which proxies Claude.
 *
 * The function source lives in `supabase/functions/coach/index.ts`.
 *
 * Setup (run once per Supabase project):
 *   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 *   supabase functions deploy coach
 *
 * The ANTHROPIC_API_KEY stays on the server — it is never exposed to the
 * mobile client.
 */
export async function sendCoachMessage(history: ChatMessage[]): Promise<string> {
  const messages: CoachMessage[] = history.map((m) => ({
    role: m.role,
    content: m.text,
  }));

  const { data, error } = await supabase.functions.invoke<{ reply: string; error?: string }>(
    'coach',
    { body: { messages } },
  );

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  if (!data?.reply) throw new Error('Empty response from coach');
  return data.reply;
}
