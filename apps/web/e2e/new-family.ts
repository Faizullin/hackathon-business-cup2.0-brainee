import { randomUUID } from "node:crypto";
import { type APIRequestContext, expect } from "@playwright/test";

/** Bonus tests need a new child, because a fresh cookie must not reset today's reward. */
export async function newFamily(request: APIRequestContext, baseURL: string, age = 6) {
  const credentials = { email: `test-${randomUUID()}@example.com`, password: "secret123" };
  const response = await request.post("/api/onboarding", {
    headers: { origin: baseURL },
    data: {
      ...credentials,
      pin: "1234",
      childName: "Мира",
      birthYear: new Date().getUTCFullYear() - age,
      answers: { hours: 2, content: 2, finish: 2, reaction: 2, reads: 2 },
    },
  });
  expect(response.status()).toBe(201);
  return credentials;
}
