// Simple Express server that proxies chat requests to the OpenAI Chat Completions API.
// Run: npm install express dotenv node-fetch
// Start: node server.js
const express = require('express');
const fetch = require('node-fetch'); // If your Node has global fetch, you can use that instead.
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public')); // optional: serve index.html if you put it in /public

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is missing. Set it in .env before running.');
}

// Simple POST endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body || {};
    if (!message) return res.status(400).json({ error: 'Missing "message" in request body.' });

    // Build messages for OpenAI. Keep a system prompt to control assistant behavior.
    const messages = [
      { role: 'system', content: 'You are a helpful assistant. Keep answers concise and user-friendly.' },
      // Optionally include client-provided history (be careful about size)
      ...(Array.isArray(history) ? history.slice(-10) : []),
      { role: 'user', content: message }
    ];

    // Call OpenAI Chat Completions
    const apiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // change to a model you have access to
        messages,
        max_tokens: 800,
        temperature: 0.7
      })
    });

    if (!apiResp.ok) {
      const text = await apiResp.text();
      return res.status(apiResp.status).json({ error: 'OpenAI error', details: text });
    }

    const result = await apiResp.json();
    // Extract assistant reply (be defensive)
    const reply = result?.choices?.[0]?.message?.content ?? '';
    return res.json({ reply, raw: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// Basic CORS-free on same origin. If frontend served elsewhere, enable CORS.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));