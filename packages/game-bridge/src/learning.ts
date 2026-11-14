import { z } from "zod";
import { createEventValidator } from "./host";

const count = z.number().int().nonnegative();
export const learningEvents = {
  round: z.object({ correct: z.boolean(), afterMistake: z.boolean() }),
  finish: z.object({
    gameId: z.string(),
    level: count.min(1),
    rounds: count.min(1),
    mistakes: count,
    corrections: count,
    durationMs: count,
  }),
};
export const validateLearningEvent = createEventValidator(learningEvents);
