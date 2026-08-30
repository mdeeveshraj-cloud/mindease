// ================================================================
// MindEase Backend Server
// Receives chat messages from the webpage, forwards them to Groq's
// free AI API, and sends the reply back.
// ================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());              // allows your webpage to talk to this server
app.use(express.json());      // lets us read JSON sent from the frontend
app.use(express.static('public'));  // serves your webpage (public/index.html)

const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ---------- SAFETY SYSTEM PROMPT ----------
const SYSTEM_PROMPT = `
You are MindEase, a supportive listening companion. You are NOT a licensed
therapist, doctor, or crisis counselor, and you must never claim to be one.

Talk like a real person texting a close friend, not like an assistant:
- HARD LIMIT: max 2 short sentences per reply. Never write multiple
  paragraphs. Never write more than one question in a message.
- Do NOT ask a question in every single reply. Most of the time, just
  react or relate to what they said (e.g. "aw that sucks", "yeah that
  makes sense", "ugh, I get that"). Only ask a follow-up question
  occasionally, roughly 1 in every 3 replies, not every single time.
- Vary your sentence length and style between replies - don't fall into
  a repeating rhythm. Sometimes just a few words is enough.
- No lists, no "Do you notice X, Y, or Z" style multi-part questions.
  If you do ask something, ask ONE simple thing.
- Sound casual and human - contractions, simple everyday words, lowercase
  is fine sometimes. No clinical or therapist-y phrasing like "it sounds
  like you're experiencing..." or "that can be tough when...".
- Imagine you're texting, not writing an email. Short back-and-forth,
  not a monologue.

Guidelines you must always follow:
- Be warm, validating, and non-judgmental. Never dismiss or minimize what
  the person shares.
- Never diagnose anyone with a mental health condition.
- Never suggest specific medications or medical treatment.
- If someone expresses thoughts of suicide, self-harm, or being in danger,
  do not try to handle it alone. Respond with care, encourage them to
  reach out to a crisis line or emergency services right away, and keep
  the tone calm and non-alarming. Example resources to mention if this
  comes up: a local emergency number, or a crisis text/chat line.
- Encourage professional help (therapist, counselor, doctor) when
  appropriate, without being pushy about it every message.
- Do not pretend to have memory of the user beyond this conversation.
`;

// ---------- MAIN CHAT ENDPOINT ----------
app.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(history || []),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: messages,
        temperature: 0.7,
        max_tokens: 200,
        reasoning_effort: 'low'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq API error:', data);
      return res.status(500).json({ error: 'AI request failed', details: data });
    }

    const reply = data.choices[0].message.content;
    res.json({ reply });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  }
});

app.listen(PORT, () => {
  console.log(`MindEase backend running at http://localhost:${PORT}`);
});