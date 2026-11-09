# CV AI analysis

The browser extracts text locally and asks for consent before sending the reduced text. The `analyze-cv` Edge Function validates the Supabase session and candidate role, then calls Cloudflare Workers AI with the `@cf/zai-org/glm-4.7-flash` model. The CV file is never uploaded, and the function does not log or store CV text.

## Add Cloudflare credentials to Supabase

1. In Cloudflare, open **Workers AI → Use REST API**. Create a Workers AI API token with only the required Workers AI access and copy the account ID shown there.
2. In the Supabase Dashboard, open **Edge Function Secrets** for this project.
3. Add these keys there:
   - `CLOUDFLARE_API_TOKEN` — the Cloudflare API token. Keep it secret.
   - `CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account ID.

Do not put the Cloudflare token in the browser, Replit's `VITE_*` variables, or chat. The model ID is already set in the function and is not a secret. Supabase supplies its project URL and publishable/anon key to Edge Functions.

## Deploy

Deploy the function with the Supabase CLI while linked to this project's Supabase project:

```sh
supabase functions deploy analyze-cv --project-ref <PROJECT_REF>
```

Keep JWT verification enabled. The function also checks the user's Supabase session and verifies that their profile role is `candidate`.

After deployment and adding both Supabase secrets, set `VITE_CV_AI_ENABLED=true` in the frontend build environment. For the Replit preview, set it in the Replit environment and restart the app. For Firebase Hosting, set it in the environment used for the frontend build, then rebuild and redeploy the frontend. It is a public feature flag, not a secret.

## Free-use limit

Keep the Cloudflare account on **Workers Free** and do not enable Workers Paid or AI Gateway credits. Workers AI currently includes 10,000 Neurons per account per day on Workers Free; when the free limit is reached, Cloudflare rejects further requests rather than charging for overage. The Edge Function returns a quota message and local extraction remains available.

The exact model pricing and daily quota can change; check Cloudflare's [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) before launch.
