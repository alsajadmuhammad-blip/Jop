Supabase Edge Functions — CORS-ready template and tests

Use this template inside your Supabase Edge Function (Deno) so the function responds to OPTIONS preflight and returns the required CORS headers.

Example (Deno):

```ts
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

addEventListener('fetch', (event) => {
  event.respondWith(handle(event.request));
});

async function handle(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: CORS_HEADERS });
  }

  try {
    const body = await request.text();
    // Your function logic here — parse JSON, perform DB ops, etc.
    const result = { success: true, body: body ? JSON.parse(body) : null };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
}
```

Quick tests (run from your machine):

1) OPTIONS preflight

```bash
curl -i -X OPTIONS "https://<project>.supabase.co/functions/v1/<fn>" \
  -H "Origin: https://your-frontend.example" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type, authorization, apikey"
```

Expected: 200 OK and `Access-Control-Allow-*` headers present.

2) POST

```bash
curl -i -X POST "https://<project>.supabase.co/functions/v1/<fn>" \
  -H "Origin: https://your-frontend.example" \
  -H "Content-Type: application/json" \
  -d '{}'
```

If you see `UNAUTHORIZED_NO_AUTH_HEADER` on POST, your call is missing the `Authorization` or `apikey` header — from browser calls include the anon key via the Supabase JS client, or set headers manually for direct fetch.

Security note:
- Do NOT embed `SERVICE_ROLE` keys in frontend code. Rotate any keys that may have been committed.
- Keep function source code in a private repo or a separate functions repo if you prefer not to keep them alongside the static frontend.
