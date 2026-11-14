import { describe, expect, it } from "vitest";
import {
  checkFilm,
  type FilmScript,
  filmCaptionAt,
  filmMinutes,
  filmQuestionCrossed,
  filmSceneAt,
} from "./film";

const art = { bg: ["sea", "sky"], props: ["fish", "whale", "question", "star"] };

const film = (patch: Partial<FilmScript> = {}): FilmScript => ({
  id: "ocean",
  title: "Ocean Secrets",
  lang: "en",
  skill: "attention",
  duration: 150,
  audio: "/media/films/ocean.mp3",
  captions: [
    { t: 0, end: 4, text: "Hi! Today we dive into the ocean." },
    { t: 5, end: 9, text: "Who is the biggest animal in the ocean?" },
    { t: 12, end: 16, text: "It's the blue whale!" },
    { t: 60, end: 64, text: "And where do fish live?" },
    { t: 66, end: 70, text: "Fish live in water." },
  ],
  scenes: [
    { t: 0, bg: "sea", props: ["fish", "star"], brainy: "left" },
    { t: 6, bg: "sea", props: ["question", "whale"], brainy: "center" },
    { t: 12, bg: "sea", props: ["whale", "fish"], brainy: "right" },
    { t: 25, bg: "sky", props: ["star", "fish"], brainy: "left" },
    { t: 45, bg: "sea", props: ["fish", "whale"], brainy: "left" },
    { t: 61, bg: "sea", props: ["question", "fish"], brainy: "center" },
    { t: 66, bg: "sea", props: ["fish", "star"], brainy: "left" },
    { t: 85, bg: "sky", props: ["star", "whale"], brainy: "right" },
    { t: 104, bg: "sea", props: ["whale", "fish"], brainy: "center" },
    { t: 124, bg: "sky", props: ["fish", "star"], brainy: "left" },
    { t: 144, bg: "sea", props: ["whale", "star"], brainy: "center" },
  ],
  questions: [
    {
      t: 9.3,
      q: "Who is the biggest in the ocean?",
      options: ["Shark", "Blue whale", "Octopus"],
      answer: 1,
      hint: "Almost! Think of who is bigger than a bus",
      praise: "Right! A blue whale is bigger than a bus",
      replayFrom: 0,
    },
    {
      t: 64.3,
      q: "Where do fish live?",
      options: ["In water", "In a tree", "In the sand"],
      answer: 0,
      hint: "Think about where they swim",
      praise: "Right! Fish live in water",
      replayFrom: 12,
    },
  ],
  ...patch,
});

const messages = (script: unknown) => checkFilm(script, art).map((i) => `${i.where}: ${i.message}`);

describe("checkFilm", () => {
  it("accepts a well-formed script without warnings", () => {
    expect(checkFilm(film(), art)).toEqual([]);
  });

  it("rejects unknown art, placeholders and broken ids", () => {
    const script = film({
      id: "Ocean!",
      scenes: [{ t: 0, bg: "volcano", props: ["dragon", "fish"], brainy: "left" }],
    });
    script.questions[0] = { ...(script.questions[0] as FilmScript["questions"][0]), hint: "TODO" };
    const found = messages(script);
    expect(found).toContain("id: latin, digits and dashes only");
    expect(found).toContain('scenes[0]: unknown bg "volcano"');
    expect(found).toContain('scenes[0]: unknown prop "dragon"');
    expect(found).toContain("questions[0]: still has TODO placeholders");
  });

  it("refuses a pause that cuts a phrase", () => {
    const script = film();
    script.questions[0] = { ...(script.questions[0] as FilmScript["questions"][0]), t: 7 };
    expect(messages(script)).toContain("questions[0]: pauses mid-phrase (5–9 s)");
  });

  it("enforces option and question shape", () => {
    const script = film();
    script.questions[1] = {
      ...(script.questions[1] as FilmScript["questions"][0]),
      options: ["In water", "All answers are correct"],
      answer: 3,
    };
    const found = messages(script);
    expect(found).toContain("questions[1]: exactly 3 options");
    expect(found).toContain("questions[1]: answer: index 0–2");
    expect(found).toContain("questions[1]: no “all of the above” style options");
  });

  it("warns when the question scene is missing or the answer never moves", () => {
    const script = film({
      scenes: film().scenes.filter((scene) => !scene.props.includes("question")),
    });
    expect(messages(script)).toContain(
      'questions[0]: add a "question" scene with brainy: center 3–4 s before',
    );
    const same = film();
    same.questions.push({ ...(same.questions[1] as FilmScript["questions"][0]), t: 100 });
    for (const q of same.questions) q.answer = 0;
    expect(messages(same)).toContain(
      "questions: the right answer is always in the same place; shuffle it",
    );
  });
});

describe("film timeline", () => {
  const script = film();
  it("finds the scene and the spoken caption", () => {
    expect(filmSceneAt(script, 0).props).toEqual(["fish", "star"]);
    expect(filmSceneAt(script, 13).brainy).toBe("right");
    expect(filmCaptionAt(script, 6)?.text).toContain("biggest");
    expect(filmCaptionAt(script, 10)).toBeUndefined();
  });

  it("stops only on questions crossed during playback", () => {
    expect(filmQuestionCrossed(script, 9, 9.4)).toBe(0);
    expect(filmQuestionCrossed(script, 9.3, 20)).toBeUndefined();
    expect(filmQuestionCrossed(script, 30, 65)).toBe(1);
    expect(filmMinutes(script)).toBe(3);
  });
});
