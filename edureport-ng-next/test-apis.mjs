import fs from 'fs';

let envFile = '';
try {
  envFile = fs.readFileSync('.dev.vars', 'utf8');
} catch(e) {}
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)="?(.*)"?$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
  }
});

async function testGroq() {
  if (!env.GROQ_API_KEY) return { status: 'skipped', reason: 'No API Key' };
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.GROQ_API_KEY}` },
      body: JSON.stringify({ model: "llama-3.1-70b-versatile", messages: [{ role: 'user', content: 'Say hello' }] })
    });
    if (res.ok) return { status: 'success', statusCode: res.status };
    return { status: 'error', statusCode: res.status, reason: await res.text() };
  } catch (e) { return { status: 'error', reason: e.message }; }
}

async function testOpenRouter() {
  if (!env.OPENROUTER_API_KEY) return { status: 'skipped', reason: 'No API Key' };
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.OPENROUTER_API_KEY}` },
      body: JSON.stringify({ model: "meta-llama/llama-3.1-8b-instruct:free", messages: [{ role: 'user', content: 'Say hello' }] })
    });
    if (res.ok) return { status: 'success', statusCode: res.status };
    return { status: 'error', statusCode: res.status, reason: await res.text() };
  } catch (e) { return { status: 'error', reason: e.message }; }
}

async function testGemini() {
  if (!env.GEMINI_API_KEY) return { status: 'skipped', reason: 'No API Key' };
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Say hello' }] }] })
    });
    if (res.ok) return { status: 'success', statusCode: res.status };
    return { status: 'error', statusCode: res.status, reason: await res.text() };
  } catch (e) { return { status: 'error', reason: e.message }; }
}

async function testAlibaba() {
  if (!env.ALIBABA_API_KEY) return { status: 'skipped', reason: 'No API Key' };
  try {
    const res = await fetch("https://ws-2sa9nwqlr3hajnpb.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.ALIBABA_API_KEY}` },
      body: JSON.stringify({ model: "qwen-turbo", messages: [{ role: 'user', content: 'Say hello' }] })
    });
    if (res.ok) return { status: 'success', statusCode: res.status };
    return { status: 'error', statusCode: res.status, reason: await res.text() };
  } catch (e) { return { status: 'error', reason: e.message }; }
}

async function runTests() {
  const results = {
    Groq: await testGroq(),
    OpenRouter: await testOpenRouter(),
    Gemini: await testGemini(),
    Alibaba: await testAlibaba()
  };
  console.log(JSON.stringify(results, null, 2));
}

runTests();
