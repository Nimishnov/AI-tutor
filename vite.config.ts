import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const taskInstructions: Record<string, string> = {
  notes: `Create concise, faithful study notes from the supplied text. Do not add facts absent from the source. If information is insufficient, say so. Preserve page citations in sourceCitations when provided. Return ONLY a JSON object with this shape: {"title":string,"summary":string,"sections":[{"heading":string,"bullets":string[],"sourceCitations":string[]}],"confusions":string[]}.`,
  tutor: `Explain the requested concept in friendly, clear language for a competitive-exam student. Prioritize the supplied source, distinguish any extra general explanation from source-supported facts, and use steps and one simple example. Return ONLY a JSON object with this shape: {"answer":string,"steps":string[],"example":string,"sourceStatus":string}.`,
  quiz: `Write one fair multiple-choice question grounded in the supplied study text and focused on the named topic. Include exactly four plausible choices and exactly one correct answer. Do not reveal the answer outside the JSON. Return ONLY a JSON object with this shape: {"question":string,"concept":string,"choices":[{"id":"A","text":string},{"id":"B","text":string},{"id":"C","text":string},{"id":"D","text":string}],"correctId":"A|B|C|D","explanation":string,"sourceCitation":string}.`,
  diagnose: `Review the original question, correct answer, selected answer and optional student reasoning. A wrong answer alone does not reveal a student's thought process: describe a possible misconception as a hypothesis, never a fact. Output confidence ONLY as low or medium; choose low if reasoning is absent or the evidence is limited. Be encouraging and reteach with a genuinely different framing/example. Then write a new four-choice question that tests the SAME exact skill and concept as the original question, changing the numbers/context. If the student missed finding acceleration from force and mass, ask for acceleration from force and mass again; do not switch to finding force or to another rearrangement. Keep the follow-up concept label identical to the original concept label. Return ONLY a JSON object with this shape: {"concept":string,"hypothesis":string,"confidence":"low|medium","reteach":string,"example":string,"followup":{"question":string,"concept":string,"choices":[{"id":"A","text":string},{"id":"B","text":string},{"id":"C","text":string},{"id":"D","text":string}],"correctId":"A|B|C|D","explanation":string,"sourceCitation":string}}.`
};

function aiApi(): Plugin {
  return {
    name: 'learnloop-ai-api',
    configureServer(server) {
      server.middlewares.use('/api/ai', (request, response, next) => {
        if (request.method !== 'POST') {
          response.statusCode = 405;
          response.end('Method not allowed');
          return;
        }

        let body = '';
        request.on('data', (chunk: Buffer) => {
          body += chunk.toString();
          if (body.length > 48_000) {
            response.statusCode = 413;
            response.end(JSON.stringify({ error: 'Request is too large. Try a shorter passage.' }));
            request.destroy();
          }
        });
        request.on('end', async () => {
          try {
            const payload = JSON.parse(body) as { task?: string; context?: unknown };
            const instruction = payload.task ? taskInstructions[payload.task] : undefined;
            if (!instruction) {
              response.statusCode = 400;
              response.end(JSON.stringify({ error: 'Unknown tutor action.' }));
              return;
            }

            const apiUrl = process.env.MANUS_API_URL;
            const apiKey = process.env.MANUS_API_KEY;
            if (!apiUrl || !apiKey) {
              response.statusCode = 503;
              response.end(JSON.stringify({ error: 'The managed AI service is not available in this preview.' }));
              return;
            }

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 45_000);
            const upstream = await fetch(new URL('/v1/chat/completions', apiUrl), {
              method: 'POST',
              headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messages: [
                  { role: 'system', content: instruction },
                  { role: 'user', content: JSON.stringify(payload.context ?? {}) }
                ],
                temperature: 0.3
              }),
              signal: controller.signal
            }).finally(() => clearTimeout(timeout));

            const result = await upstream.json() as {
              error?: { message?: string };
              choices?: Array<{ message?: { content?: string } }>;
            };
            if (!upstream.ok || result.error) {
              response.statusCode = upstream.status || 502;
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify({ error: result.error?.message || 'The AI service could not complete that request.' }));
              return;
            }
            const content = result.choices?.[0]?.message?.content;
            if (typeof content !== 'string' || !content.trim()) {
              response.statusCode = 502;
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify({ error: 'The tutor returned an empty response. Please try once more.' }));
              return;
            }
            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify({ content }));
          } catch (error) {
            response.statusCode = 502;
            response.setHeader('Content-Type', 'application/json');
            const message = error instanceof Error && error.name === 'AbortError'
              ? 'The tutor took too long to respond. Your work is still here; please try again.'
              : 'Could not reach the tutor. Please try again.';
            response.end(JSON.stringify({ error: message }));
          }
        });
        request.on('error', next);
      });
    }
  };
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), aiApi()],
  server: { host: '0.0.0.0', port: 3000, strictPort: true },
  preview: { host: '0.0.0.0', port: 3000, strictPort: true }
});
