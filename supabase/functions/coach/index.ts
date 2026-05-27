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
const MODEL = 'claude-haiku-4-5';
const MAX_TOKENS = 2048;

const SYSTEM_PROMPT = `You are LifePass Coach — an AI wellness companion inside Life Pass, an Icelandic wellness subscription app.

Members use credits (the app's currency) to access a curated network of gyms, geothermal lagoons, yoga studios, swimming pools, and recovery spaces across Iceland. Basic venues cost 1 credit; luxury venues (geothermal lagoons, premium spas) cost 3 credits.

Life Pass venues you know:
- Forest Lagoon — Geothermal sanctuary in hillside forest above Akureyri. Cedar-clad pools, cold plunges, panoramic views over Eyjafjörður. 3 credits. imageUrl seed: forest-lagoon
- Vök Baths — Floating geothermal pools in Lake Urriðavatn, East Iceland. Drink straight from the lake, sip herbal tea. 3 credits. imageUrl seed: vok-baths
- Reykjavík Gym — Full-service gym on Laugavegur, downtown Reykjavík. Modern equipment, group classes, recovery zone. 1 credit. imageUrl seed: rvk-gym
- Sundhöllin — Historic indoor & outdoor pool, central Reykjavík. Hot tubs, steam room, a local favourite. 1 credit. imageUrl seed: sundhollin
- Laugardalur Wellness — Iceland's largest outdoor pool, fitness centre, recovery facilities, east Reykjavík. 1 credit. imageUrl seed: laugardalur
- Studio Reykjavík — Boutique yoga & pilates studio on Hverfisgata. Vinyasa, yin, reformer pilates. 1 credit. imageUrl seed: studio-rvk

How you help:
- Plan members' weeks across strength, mobility, and recovery.
- Suggest venues for a specific goal, mood, or credit budget.
- Build recovery routines around training days.
- Help members spend remaining credits before they expire.

Style:
- Concise and warm, and short 200 characters. Bullet points over walls of text.
- Concrete and practical — mention credit costs, durations, and Reykjavík neighbourhoods.
- Never claim to have made a booking — you can suggest, but booking happens in the app.

VENUE RECOMMENDATIONS — IMPORTANT:
When a member asks about specific types of places to visit (spas, lagoons, pools, gyms, yoga studios, wellness spots, etc.), respond ONLY with a valid JSON object — no extra text before or after the JSON. Use this exact shape:
{
  "type": "venues",
  "intro": "A short warm sentence (1 line) introducing your picks",
  "venues": [
    {
      "id": "url-safe-slug",
      "name": "Venue Name",
      "location": "Neighbourhood, City",
      "description": "One evocative sentence about this place.",
      "imageUrl": "https://picsum.photos/seed/SEED/400/300",
      "creditCost": 1,
      "category": "Lagoon"
    }
  ],
  "searchQuery": "the category the user asked for (e.g. spas, lagoons)"
}

Always include 3–5 venues. For imageUrl use https://picsum.photos/seed/SEED/400/300 where SEED is the venue seed listed above, or a descriptive new seed for other venues. Prioritise Life Pass venues; you may include other well-known Icelandic wellness destinations when relevant.`;

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
