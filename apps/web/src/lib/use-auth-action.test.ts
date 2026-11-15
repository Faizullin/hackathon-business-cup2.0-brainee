import { expect, it } from "vitest";
import { AuthActionError, requireAuthResponse } from "./use-auth-action";

it.each([
  [400, "invalid"],
  [422, "invalid"],
  [401, "wrong"],
  [403, "wrong"],
  [409, "conflict"],
  [500, "unavailable"],
  [503, "unavailable"],
])("classifies HTTP %s as %s", (status, kind) => {
  expect(() => requireAuthResponse(new Response(null, { status: Number(status) }))).toThrow(
    new AuthActionError(String(kind) as AuthActionError["kind"]),
  );
});
it("preserves a successful response for its caller", () => {
  const response = new Response(null, { status: 201 });
  expect(requireAuthResponse(response)).toBe(response);
});
