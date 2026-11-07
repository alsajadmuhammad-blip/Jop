import assert from "node:assert/strict";

const { default: worker } = await import("../cloudflare/cv-ai/src/index.js");
const originalFetch = globalThis.fetch;
let authenticated = true;
let aiCalls = 0;

globalThis.fetch = async (input) => {
  const url = String(input);
  if (url.endsWith("/auth/v1/user")) {
    return new Response(JSON.stringify(authenticated ? { id: "candidate-1" } : {}), {
      status: authenticated ? 200 : 401,
      headers: { "content-type": "application/json" },
    });
  }
  if (url.includes("/rest/v1/profiles")) {
    return new Response(JSON.stringify([{ role: "candidate" }]), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  throw new Error(`Unexpected test request: ${url}`);
};

const env = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "test-publishable-key",
  ALLOWED_ORIGINS: "http://localhost:5000",
  AI: {
    async run(model, input) {
      aiCalls += 1;
      assert.equal(model, "@cf/meta/llama-3.1-8b-instruct");
      assert.equal(input.response_format.type, "json_schema");
      assert.match(input.messages[1].content, /خبرات/);
      return {
        response: {
          profile: {
            headline: "مهندس مدني",
            specialization: "هندسة مدنية",
            experience_years: 4,
            skills: ["AutoCAD"],
            summary: "مهندس مدني بخبرة عملية.",
          },
          experiences: [],
          education: [],
          languages: [],
        },
      };
    },
  },
};

function makeRequest({ origin = "http://localhost:5000", authorization = "Bearer valid-token", text = "خبرات عملية ومهارات مهنية كافية للتحليل." } = {}) {
  return new Request("https://worker.example/", {
    method: "POST",
    headers: {
      Origin: origin,
      Authorization: authorization,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
}

try {
  const success = await worker.fetch(makeRequest(), env);
  assert.equal(success.status, 200);
  assert.equal((await success.json()).data.profile.headline, "مهندس مدني");
  assert.equal(aiCalls, 1);

  authenticated = false;
  const unauthorized = await worker.fetch(makeRequest(), env);
  assert.equal(unauthorized.status, 403);
  assert.equal(aiCalls, 1, "unauthenticated requests must not call Workers AI");
  authenticated = true;

  const rejectedOrigin = await worker.fetch(makeRequest({ origin: "https://unexpected.example" }), env);
  assert.equal(rejectedOrigin.status, 403);
  assert.equal(aiCalls, 1, "requests from unapproved origins must not call Workers AI");

  const quotaEnv = {
    ...env,
    AI: {
      async run() {
        throw new Error("Daily neuron limit exceeded");
      },
    },
  };
  const quotaResponse = await worker.fetch(makeRequest(), quotaEnv);
  assert.equal(quotaResponse.status, 429);
  assert.equal((await quotaResponse.json()).code, "AI_DAILY_QUOTA_EXHAUSTED");
} finally {
  globalThis.fetch = originalFetch;
}

console.log("Cloudflare CV Worker checks passed: candidate auth, CORS, structured response, daily quota stop.");
