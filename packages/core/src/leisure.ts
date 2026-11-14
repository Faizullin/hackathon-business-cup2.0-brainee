export const FUN_HEARTBEAT_SECONDS = 15;
export function spendPlayTime(remaining: number, elapsedSeconds: number, reportedSeconds: number) {
  if (
    !Number.isFinite(reportedSeconds) ||
    reportedSeconds < 0 ||
    reportedSeconds > FUN_HEARTBEAT_SECONDS
  )
    throw new RangeError("Invalid play time");
  return Math.max(
    0,
    remaining - Math.min(Math.floor(reportedSeconds), Math.max(0, Math.floor(elapsedSeconds))),
  );
}
export const SNAKE_SIZE = 12;
export const SNAKE_TICK_MS = 400;
export type Direction = "up" | "down" | "left" | "right";
export type SnakeState = {
  body: number[];
  food: number;
  direction: Direction;
  score: number;
  over: boolean;
};
export const newSnake = (): SnakeState => ({
  body: [65, 64, 63],
  food: 69,
  direction: "right",
  score: 0,
  over: false,
});
const opposite: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};
export function stepSnake(state: SnakeState, desired: Direction): SnakeState {
  if (state.over) return state;
  const direction = opposite[state.direction] === desired ? state.direction : desired;
  const head = state.body[0] as number,
    x = head % SNAKE_SIZE,
    y = Math.floor(head / SNAKE_SIZE);
  const nx = x + (direction === "right" ? 1 : direction === "left" ? -1 : 0),
    ny = y + (direction === "down" ? 1 : direction === "up" ? -1 : 0);
  const next = ny * SNAKE_SIZE + nx,
    eat = next === state.food;
  const body = eat ? state.body : state.body.slice(0, -1);
  if (nx < 0 || nx >= SNAKE_SIZE || ny < 0 || ny >= SNAKE_SIZE || body.includes(next))
    return { ...state, over: true };
  const moved = [next, ...body];
  const food = eat
    ? Array.from(
        { length: SNAKE_SIZE * SNAKE_SIZE },
        (_, i) => (i * 37 + state.score * 17) % 144,
      ).find((n) => !moved.includes(n))
    : state.food;
  return {
    body: moved,
    food: food ?? -1,
    direction,
    score: state.score + Number(eat),
    over: food === undefined,
  };
}
