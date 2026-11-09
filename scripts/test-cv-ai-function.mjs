import assert from "node:assert/strict";
import { handleCvAiRequest } from "../supabase/functions/analyze-cv/handler.js";

const originalFetch = globalThis.fetch;
let authenticated = true;
let profileRole = "candidate";
let providerStatus = 200;
let providerPayload;
let inferenceCalls = 0;

const expectedResult = {
  profile: {
    headline: "مهندس مدني",
    specialization: "هندسة مدنية",
    experience_years: 4,
    skills: ["AutoCAD"],
    summary: "خبرة مهنية مثبتة.",
  },
  experiences: [
    {
      title: "مهندس موقع",
      company: "شركة النور",
      location: "",
      startMonth: "2021-04",
      endMonth: "",
      isCurrent: true,
      legacyPeriod: "",
      description: "إشراف على مواقع العمل.",
    },
  ],
  education: [],
  languages: [{ name: "العربية", level: "اللغة الأم" }],
};

const env = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "test-publishable-key",
  CLOUDFLARE_ACCOUNT_ID: "test-account",
  CLOUDFLARE_API_TOKEN: "test-cloudflare-token",
};

globalThis.fetch = async (input, init = {}) => {
  const url = String(input);

  if (url.endsWith("/auth/v1/user")) {
    return new Response(JSON.stringify(authenticated ? { id: "candidate-1" } : {}), {
      status: authenticated ? 200 : 401,
      headers: { "content-type": "application/json" },
    });
  }

  if (url.includes("/rest/v1/profiles")) {
    return new Response(JSON.stringify([{ role: profileRole }]), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  if (url.includes("/ai/run/@cf/zai-org/glm-4.7-flash")) {
    inferenceCalls += 1;
    assert.equal(init.method, "POST");
    assert.equal(new Headers(init.headers).get("authorization"), "Bearer test-cloudflare-token");

    const requestBody = JSON.parse(init.body);
    assert.match(requestBody.messages[1].content, /خبرات/);
    assert.equal(requestBody.store, false);
    assert.equal(requestBody.tools[0].function.name, "extract_candidate_cv");
    assert.equal(requestBody.tools[0].function.strict, true);
    assert.equal(requestBody.tool_choice.function.name, "extract_candidate_cv");

    return new Response(JSON.stringify(providerPayload), {
      status: providerStatus,
      headers: { "content-type": "application/json" },
    });
  }

  throw new Error(`Unexpected test request: ${url}`);
};

function makeRequest({
  authorization = "Bearer valid-token",
  text = "خبرات عملية ومهارات مهنية مناسبة لتحليل السيرة.",
  method = "POST",
} = {}) {
  return new Request("https://supabase.example/functions/v1/analyze-cv", {
    method,
    headers: {
      authorization,
      "content-type": "application/json",
    },
    body: method === "POST" ? JSON.stringify({ text }) : undefined,
  });
}

try {
  providerPayload = {
    success: true,
    result: {
      choices: [{
        message: {
          tool_calls: [{
            function: {
              name: "extract_candidate_cv",
              arguments: JSON.stringify(expectedResult),
            },
          }],
        },
      }],
    },
  };

  const success = await handleCvAiRequest(makeRequest(), env);
  assert.equal(success.status, 200);
  assert.equal(success.headers.get("cache-control"), "no-store");
  assert.equal((await success.json()).data.profile.headline, "مهندس مدني");
  assert.equal(inferenceCalls, 1);

  const preflight = await handleCvAiRequest(makeRequest({ method: "OPTIONS" }), env);
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), "*");

  const unauthenticated = await handleCvAiRequest(makeRequest({ authorization: "" }), env);
  assert.equal(unauthenticated.status, 401);
  assert.equal(inferenceCalls, 1);

  authenticated = false;
  const invalidSession = await handleCvAiRequest(makeRequest(), env);
  assert.equal(invalidSession.status, 401);
  assert.equal(inferenceCalls, 1);
  authenticated = true;

  profileRole = "hr";
  const wrongRole = await handleCvAiRequest(makeRequest(), env);
  assert.equal(wrongRole.status, 403);
  assert.equal(inferenceCalls, 1);
  profileRole = "candidate";

  const tooLong = await handleCvAiRequest(
    makeRequest({ text: "س".repeat(12_001) }),
    env,
  );
  assert.equal(tooLong.status, 413);
  assert.equal(inferenceCalls, 1);

  providerStatus = 429;
  providerPayload = { success: false, errors: [{ message: "Daily neuron quota exceeded" }] };
  const quota = await handleCvAiRequest(makeRequest(), env);
  assert.equal(quota.status, 429);
  assert.equal((await quota.json()).code, "AI_DAILY_QUOTA_EXHAUSTED");

  providerStatus = 200;
  providerPayload = {
    success: true,
    result: { choices: [{ message: { tool_calls: [] } }] },
  };
  const malformed = await handleCvAiRequest(makeRequest(), env);
  assert.equal(malformed.status, 502);
  assert.equal((await malformed.json()).code, "INVALID_MODEL_RESPONSE");
} finally {
  globalThis.fetch = originalFetch;
}

console.log("Supabase CV AI function checks passed: candidate auth, role check, Cloudflare model call, output validation, and quota stop.");
