#!/usr/bin/env python3
"""Turn a podcast mp3 into a draft interactive film (mp3 + JSON script).

Spec and workflow: docs/dev/films.md.

    uv run --python 3.12 --with faster-whisper scripts/films/make_film.py \
        videos/audio/<file>.mp3 --id ocean --title "Тайны океана" --engine whisper

Writes apps/web/public/media/films/<id>.mp3 and <id>.json (captions with timestamps,
question stubs from phrases ending in "?", one scene). The draft is meant to fail
`pnpm check:films` until a person or agent fills the questions and scenes.
The ElevenLabs engine reads ELEVENLABS_API_KEY from the environment only.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import shutil
import subprocess
import sys
import urllib.request
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "apps/web/public/media/films"
MAX_BYTES = 15 * 1024 * 1024
ID_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
SENTENCE_END = re.compile(r"[.!?…]$")


def duration_of(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return round(float(out.stdout.strip()), 2)


def whisper_captions(path: Path, lang: str | None, model: str) -> tuple[list[dict], str]:
    import numpy as np  # imported lazily: only this engine needs them
    from faster_whisper import WhisperModel

    # Decode with system ffmpeg: faster-whisper's PyAV path breaks on newer PyAV releases.
    pcm = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
        check=True,
        capture_output=True,
    ).stdout
    whisper = WhisperModel(model, device="auto", compute_type="int8")
    segments, info = whisper.transcribe(
        np.frombuffer(pcm, dtype=np.float32),
        language=lang,
        vad_filter=True,
        beam_size=5,
        word_timestamps=True,  # segment-level times drift by ~1 s on long audio
    )
    print(f"  language: {info.language} ({info.language_probability:.0%})", file=sys.stderr)
    captions = []
    for seg in segments:
        text = seg.text.strip()
        words = seg.words or []
        start = words[0].start if words else seg.start
        end = words[-1].end if words else seg.end
        if text:
            captions.append({"t": round(start, 2), "end": round(end, 2), "text": text})
            print(f"  {start:7.2f}  {text}", file=sys.stderr)
    return captions, info.language


def multipart(fields: dict[str, str], file_field: str, path: Path) -> tuple[bytes, str]:
    boundary = uuid.uuid4().hex
    parts = []
    for name, value in fields.items():
        parts.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode()
        )
    parts.append(
        (
            f'--{boundary}\r\nContent-Disposition: form-data; name="{file_field}"; '
            f'filename="audio.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n'
        ).encode()
        + path.read_bytes()
        + b"\r\n"
    )
    parts.append(f"--{boundary}--\r\n".encode())
    return b"".join(parts), f"multipart/form-data; boundary={boundary}"


def elevenlabs_captions(path: Path, lang: str, diarize: bool) -> list[dict]:
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        sys.exit("ELEVENLABS_API_KEY is not set; use --engine whisper.")
    fields = {"model_id": "scribe_v1", "language_code": lang, "timestamps_granularity": "word"}
    if diarize:
        fields["diarize"] = "true"
    body, content_type = multipart(fields, "file", path)
    request = urllib.request.Request(
        "https://api.elevenlabs.io/v1/speech-to-text",
        data=body,
        headers={"xi-api-key": key, "Content-Type": content_type},
    )
    with urllib.request.urlopen(request, timeout=600) as response:
        words = [w for w in json.load(response).get("words", []) if w.get("type") != "audio_event"]
    # Group words into phrases: break on sentence punctuation, a speaker change or a 1 s gap.
    speakers: list[str] = []
    captions: list[dict] = []
    current: dict | None = None
    for word in words:
        speaker = word.get("speaker_id") or "speaker_0"
        if speaker not in speakers:
            speakers.append(speaker)
        who = "brainy" if speakers.index(speaker) == 0 else "guest"
        if word.get("type") == "spacing":
            if current:
                current["text"] += " "
            continue
        gap = current and word["start"] - current["end"] > 1.0
        if current is None or current["who"] != who or gap:
            if current:
                captions.append(current)
            current = {"t": word["start"], "end": word["end"], "text": "", "who": who}
        current["text"] += word["text"]
        current["end"] = word["end"]
        if SENTENCE_END.search(word["text"]):
            captions.append(current)
            current = None
    if current:
        captions.append(current)
    for caption in captions:
        caption["t"] = round(caption["t"], 2)
        caption["end"] = round(caption["end"], 2)
        caption["text"] = caption["text"].strip()
        if not diarize:
            caption.pop("who", None)
    return [c for c in captions if c["text"]]


def draft(film_id: str, title: str, lang: str, duration: float, captions: list[dict]) -> dict:
    questions = []
    for i, caption in enumerate(captions):
        if caption["text"].endswith("?"):
            following = captions[i + 1]["t"] if i + 1 < len(captions) else caption["t"]
            questions.append(
                {
                    "t": round(caption["end"] + 0.3, 2),
                    "q": caption["text"][:60],
                    "options": ["TODO", "TODO", "TODO"],
                    "answer": 0,
                    "hint": "TODO",
                    "praise": "TODO",
                    "replayFrom": following,
                }
            )
    return {
        "id": film_id,
        "title": title,
        "lang": lang,
        "skill": "attention",
        "duration": duration,
        "audio": f"/media/films/{film_id}.mp3",
        "scenes": [{"t": 0, "bg": "meadow", "props": [], "brainy": "left"}],
        "questions": questions,
        "captions": captions,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    parser.add_argument("mp3", type=Path)
    parser.add_argument("--id", required=True, help="latin, digits and dashes, e.g. bees-life")
    parser.add_argument("--title", required=True, help="title a child reads")
    parser.add_argument("--engine", choices=["whisper", "elevenlabs"], default="whisper")
    parser.add_argument(
        "--lang", default=None, help="whisper: ru/kk/en (default: detect); elevenlabs: rus/kaz/eng"
    )
    parser.add_argument("--model", default="small", help="whisper model (small, medium, large-v3)")
    parser.add_argument("--diarize", action="store_true", help="elevenlabs only: two voices")
    parser.add_argument("--force", action="store_true", help="overwrite an existing script")
    args = parser.parse_args()

    if not ID_RE.match(args.id):
        sys.exit(f"Bad id {args.id!r}: use latin letters, digits and dashes.")
    if not args.mp3.is_file():
        sys.exit(f"No such file: {args.mp3}")
    script_path = OUT_DIR / f"{args.id}.json"
    if script_path.exists() and not args.force:
        sys.exit(f"{script_path} exists (it may hold manual edits). Pass --force to overwrite.")
    if args.diarize and args.engine != "elevenlabs":
        sys.exit("--diarize needs --engine elevenlabs.")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    audio_path = OUT_DIR / f"{args.id}.mp3"
    if args.mp3.stat().st_size > MAX_BYTES:
        print(f"{args.mp3.name} is over 15 MB: re-encoding to mono 64 kbps.", file=sys.stderr)
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(args.mp3), "-ac", "1", "-b:a", "64k", str(audio_path)],
            check=True,
        )
    else:
        shutil.copyfile(args.mp3, audio_path)
    duration = duration_of(audio_path)

    print(f"Transcribing {math.ceil(duration / 60)} min with {args.engine}…", file=sys.stderr)
    if args.engine == "whisper":
        captions, lang = whisper_captions(audio_path, args.lang, args.model)
    else:
        lang = args.lang or "rus"
        captions = elevenlabs_captions(audio_path, lang, args.diarize)
    lang = {"rus": "ru", "kaz": "kk", "eng": "en"}.get(lang, lang)

    script = draft(args.id, args.title, lang, duration, captions)
    script_path.write_text(json.dumps(script, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"Wrote {audio_path.relative_to(ROOT)} and {script_path.relative_to(ROOT)}: "
        f"{len(captions)} captions, {len(script['questions'])} question stubs.\n"
        "Next: fix captions, fill questions and scenes, add the science entry to "
        "packages/db/src/showcase-seed.ts, then run `pnpm check:films`.",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
