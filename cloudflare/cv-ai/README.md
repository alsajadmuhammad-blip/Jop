# Cloudflare CV analyzer

This Worker receives only section text extracted in the browser. It does not receive the uploaded PDF/DOCX file, write content to storage, or log request bodies.

## Free-plan setup

1. Keep the Cloudflare account on **Workers Free**. Workers AI includes 10,000 Neurons per day on that plan; exceeding the free allocation fails rather than charging overage. Do not switch to Workers Paid or configure AI Gateway credits.
2. From this directory, log in and deploy:

   ```sh
   npx wrangler@4 login
   npx wrangler@4 deploy
   ```

3. Edit `wrangler.jsonc` before deployment:
   - Replace `SUPABASE_URL` with the app's Supabase project URL.
   - Replace `YOUR_APP_DOMAIN` with the exact website origin. Keep `http://localhost:5000` for local development. Separate multiple origins with commas; do not use `*`.
4. Add the Supabase publishable/anon key to the Worker as a secret. Do not commit it or paste it in chat:

   ```sh
   npx wrangler@4 secret put SUPABASE_ANON_KEY
   ```

   Paste the value when Wrangler prompts. The Worker uses this key only to verify the signed-in user and read that user's role from `profiles`; it does not send CV text to Supabase.
5. In Cloudflare Worker settings, verify that the Workers AI binding is named `AI`. This is declared in `wrangler.jsonc`.
6. Copy the deployed Worker URL into the Replit environment variable `VITE_CV_AI_WORKER_URL`, then rebuild/redeploy the website.

The app's local PDF/DOCX extraction remains available if the Worker URL is unset or the daily AI quota is exhausted. The browser asks for consent before sending the redacted section text to the Worker, and still requires a separate confirmation before adding fields to the profile.

The free daily Neuron allocation is account-wide and resets at 00:00 UTC (03:00 Baghdad time). Other Workers AI usage in the same Cloudflare account shares that allocation.
