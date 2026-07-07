// LifePass Coach — local dev API + Vercel-ready handler.
//
// Proxies the Anthropic Messages API so ANTHROPIC_API_KEY never leaves the
// server. Same request/response contract the iOS app expects:
//
//   POST  { messages: [{ role: 'user' | 'assistant', content: string }, ...] }
//   200   { reply: string }
//   4xx/5xx { error: string }
//
// ── Run locally ──────────────────────────────────────────────────────────────
//   1. Put your key in a git-ignored env file at the repo root:
//        echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env.local
//   2. Start the dev server (Node 20+ for --env-file):
//        node --env-file=.env.local api/coach.mjs
//      → listening on http://127.0.0.1:8787
//
// ── Later: Vercel ────────────────────────────────────────────────────────────
//   Drop this file in a Vercel project's /api folder. The default export below
//   is already a Vercel-style handler; set ANTHROPIC_API_KEY in Vercel env vars
//   and point the iOS COACH_API_URL at https://<project>.vercel.app/api/coach
// ─────────────────────────────────────────────────────────────────────────────

import { readFile, writeFile } from 'node:fs/promises';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5';
const MAX_TOKENS = 2048;

// Per-user daily message cap. Override with COACH_DAILY_LIMIT env if needed.
const DAILY_LIMIT = Number(process.env.COACH_DAILY_LIMIT) || 10;

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

// ── Core: turn a messages array into a reply string ───────────────────────────
async function generateReply(messages) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const e = new Error('ANTHROPIC_API_KEY is not configured on the server');
    e.status = 500;
    throw e;
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    const e = new Error('messages must be a non-empty array');
    e.status = 400;
    throw e;
  }

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
    const e = new Error(`Anthropic API ${upstream.status}: ${text}`);
    e.status = upstream.status;
    throw e;
  }

  const data = await upstream.json();
  const reply =
    Array.isArray(data?.content) && data.content[0]?.type === 'text'
      ? data.content[0].text
      : '';

  if (!reply) {
    const e = new Error('Empty content from Anthropic');
    e.status = 502;
    throw e;
  }
  return reply;
}

// ── Per-user daily usage store ────────────────────────────────────────────────
// Local dev keeps counts in a git-ignored JSON file. On Vercel, swap these four
// functions for a Supabase table or Vercel KV — nothing else has to change.
const USAGE_FILE = new URL('../.coach-usage.json', import.meta.url);

function todayKey() {
  const d = new Date(); // server-local date → "resets at midnight"
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function readUsage() {
  try {
    return JSON.parse(await readFile(USAGE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

async function usedToday(userId) {
  const all = await readUsage();
  const rec = all[userId];
  return rec && rec.day === todayKey() ? rec.count : 0;
}

async function recordUse(userId) {
  const all = await readUsage();
  const day = todayKey();
  const rec = all[userId];
  all[userId] = rec && rec.day === day ? { day, count: rec.count + 1 } : { day, count: 1 };
  try {
    await writeFile(USAGE_FILE, JSON.stringify(all));
  } catch (e) {
    console.error('usage write failed:', e.message);
  }
  return Math.max(0, DAILY_LIMIT - all[userId].count);
}

// ── Request pipeline: identity → limit check → reply → record ─────────────────
async function handleCoachRequest(body) {
  const userId = (body?.userId ?? '').toString().trim();
  if (!userId) return { status: 400, payload: { error: 'Missing userId' } };

  const used = await usedToday(userId);
  if (used >= DAILY_LIMIT) {
    return {
      status: 429,
      payload: {
        error: `You've reached today's limit of ${DAILY_LIMIT} Coach messages. It resets tomorrow.`,
        limit: DAILY_LIMIT,
        remaining: 0,
      },
    };
  }

  try {
    const reply = await generateReply(body?.messages);
    const remaining = await recordUse(userId);
    return { status: 200, payload: { reply, remaining } };
  } catch (e) {
    return { status: e.status || 500, payload: { error: e.message || 'Unknown error' } };
  }
}

// ── Vercel-style default export (used when deployed) ──────────────────────────
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 200;
    return res.end('ok');
  }
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }
  try {
    const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
    const { status, payload } = await handleCoachRequest(body);
    return sendJson(res, status, payload);
  } catch (e) {
    return sendJson(res, e.status || 500, { error: e.message || 'Unknown error' });
  }
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type, apikey');
}

function sendJson(res, status, payload) {
  setCors(res);
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(payload));
}

// ── Local dev server (only when run directly: `node api/coach.mjs`) ───────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const http = await import('node:http');
  const PORT = Number(process.env.PORT) || 8787;

  const server = http.createServer((req, res) => {
    if (req.method === 'OPTIONS') {
      setCors(res);
      res.statusCode = 200;
      return res.end('ok');
    }
    if (req.method !== 'POST') {
      return sendJson(res, 405, { error: 'Method not allowed' });
    }
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', async () => {
      let body;
      try {
        body = JSON.parse(raw || '{}');
      } catch {
        return sendJson(res, 400, { error: 'Invalid JSON body' });
      }
      const { status, payload } = await handleCoachRequest(body);
      if (status === 200) {
        console.log(`→ replied (${payload.reply.length} chars, ${payload.remaining} left for ${body.userId})`);
      } else {
        console.error(`✗ ${status}: ${payload.error}`);
      }
      sendJson(res, status, payload);
    });
  });

  server.listen(PORT, '127.0.0.1', () => {
    const hasKey = !!process.env.ANTHROPIC_API_KEY;
    console.log(`LifePass Coach dev server → http://127.0.0.1:${PORT}`);
    console.log(hasKey ? '✓ ANTHROPIC_API_KEY loaded' : '✗ ANTHROPIC_API_KEY MISSING — set it in .env.local');
  });
}
