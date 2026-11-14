import { NEUTRAL_QUIZ } from "@brainee/core";
import { AccountError, signupFromQuiz } from "@brainee/db";
import { type NextRequest, NextResponse } from "next/server";
import { withAccessCookie } from "@/lib/server/access-cookie";
import { demoApi, readDemoJson } from "@/lib/server/demo-api";

export const runtime = "nodejs";

/** D-24: quiz answers + parent/child details → new family with the quiz-based Brainy. */
export async function POST(request: NextRequest) {
  return demoApi(request, async (db, now) => {
    try {
      const raw = await readDemoJson(request);
      const created = await signupFromQuiz(
        db,
        {
          ...(raw && typeof raw === "object" ? raw : {}),
          answers: NEUTRAL_QUIZ,
        },
        now,
      );
      return withAccessCookie(request, { child: created.child }, created, 201);
    } catch (error) {
      if (error instanceof AccountError)
        return NextResponse.json(
          { error: error.reason },
          { status: error.reason === "email-taken" ? 409 : 400 },
        );
      throw error;
    }
  });
}
