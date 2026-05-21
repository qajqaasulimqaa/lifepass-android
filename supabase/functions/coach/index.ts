// LifePass Coach — Supabase Edge Function (Deno runtime).
//
// Proxies the Anthropic Messages API so the ANTHROPIC_API_KEY never leaves
// the server.  The mobile client invokes this via
// `supabase.functions.invoke('coach', { body: { messages } })`.
//
// ── Setup ────────────────────────────────────────────────────────────────────
// 1. Set the secret on your Supabase project:
//      supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// 2. Deploy:
//      supabase functions deploy coach
// 3. Logs:
//      supabase functions logs coach --tail
//
// ── Request shape ────────────────────────────────────────────────────────────
//   POST  { messages: [{ role: 'user' | 'assistant', content: string }, ...] }
//
// ── Response shape ───────────────────────────────────────────────────────────
//   200   { reply: string }
//   4xx/5xx { error: string }
// ────────────────────────────────────────────────────────────────────────────

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 1024;

const SYSTEM_PROMPT = `You are LifePass Coach — an AI wellness companion inside an Icelandic wellness app.

Members use credits (the app's currency) to access gyms, lagoons, yoga studios, swimming pools, and recovery spaces around Reykjavík. Most classes cost 1 credit; luxury venues (lagoons, premium spas) typically cost 3.

How you help:
- Plan members' weeks across strength, mobility, and recovery.
- Suggest types of venues for a given goal (e.g. "a yoga studio downtown for a slow start").
- Build recovery routines around training days.
- Help members spend remaining credits before they expire.

Style:
- Concise and warm. Bullet points over walls of text.
- Concrete and practical. Numbers, durations, credit costs when relevant.
- Do not invent specific venue names you cannot verify — describe the type of place instead.
- Never claim to have made a booking — you can suggest, but booking happens in the app.`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type CoachMessage = { role: 'user' | 'assistant'; content: string };

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return json(
        { error: 'ANTHROPIC_API_KEY is not configured on this Supabase project' },
        500,
      );
    }

    const body = await req.json().catch(() => null);
    const messages = body?.messages as CoachMessage[] | undefined;
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'messages must be a non-empty array' }, 400);
    }

    // Forward to Anthropic
    const upstream = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return json({ error: `Anthropic API ${upstream.status}: ${text}` }, upstream.status);
    }

    const data = await upstream.json();
    // Anthropic returns { content: [{ type: 'text', text: '...' }], ... }
    const reply: string =
      Array.isArray(data?.content) && data.content[0]?.type === 'text'
        ? data.content[0].text
        : '';

    if (!reply) {
      return json({ error: 'Empty content from Anthropic' }, 502);
    }

    return json({ reply });
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      500,
    );
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
  });
}
