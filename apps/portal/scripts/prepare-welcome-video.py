#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = ["faster-whisper==1.2.1", "numpy"]
# ///
"""Turns a screen recording into the two files of a welcome video (ROADMAP E39).

    uv run apps/portal/scripts/prepare-welcome-video.py <recording> [--words "Fur-Ever Friends, Jane"]

Writes <recording>-welcome.mp4 and <recording>-welcome.vtt beside it, the pair
the operator's Welcome videos card takes, and lists the captions holding a word
the transcription was unsure of, to check by ear before uploading. Read the
rest too: a word heard wrongly with confidence isn't listed ("editors" for
the Editor). Give `--words` the site's web address and the people named, or
Whisper spells them as it likes.

- The sound is brought to -16 LUFS in two passes, so a quiet recording plays
  at the level of a phone's own videos, and made mono.
- The picture is made small: H.264 at CRF 28, at most 1920 wide and 30 frames
  a second, which keeps a screen's text sharp (Jane's 1:54 went from 17 MB to
  under 4).
- The captions are transcribed on this machine by Whisper, cut at sentences
  into cues of two lines at most. The portal's own words (Quick Edit, Canopy
  Sites) are given to it, and `--words` adds the client's: names, a web address.

Needs ffmpeg, ffprobe, and uv on this machine. The first run fetches Whisper's
model (about 1.5 GB) into ~/.cache/huggingface; it runs on the CPU, about a
minute for two minutes of speech.
"""

import argparse
import json
import math
import re
import shutil
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

# What the operator's upload takes, the two files together (src/lib/welcome-video-limits.ts).
UPLOAD_MAX_BYTES = 100_000_000
LOUDNESS = "I=-16:TP=-1.5:LRA=11"
# The portal's words, so they come out spelled as its screens spell them.
PORTAL_WORDS = ["Canopy Sites", "Quick Edit", "Editor", "Forms", "Stats", "Preview", "Publish", "Discard"]
# A word heard with less confidence than this is listed to check.
UNSURE = 0.6

MAX_CHARS = 84
LINE_CHARS = 42
MAX_SECONDS = 6.5
PAUSE = 0.9


def fail(message: str) -> None:
    print(f"error: {message}", file=sys.stderr)
    sys.exit(1)


def run(args: list[str]) -> subprocess.CompletedProcess:
    done = subprocess.run(args, capture_output=True, text=True)
    if done.returncode != 0:
        fail(f"{args[0]} failed:\n{done.stderr[-2000:]}")
    return done


def clock(seconds: float) -> str:
    whole = int(seconds)
    return f"{whole // 60}:{whole % 60:02d}"


def stamp(t: float) -> str:
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def megabytes(path: Path) -> str:
    return f"{path.stat().st_size / 1_000_000:.1f} MB"


# --- Sound and picture -------------------------------------------------------


def probe(recording: Path) -> tuple[float, set[str]]:
    out = run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type", "-of", "json", str(recording)])
    info = json.loads(out.stdout)
    return float(info["format"]["duration"]), {s["codec_type"] for s in info.get("streams", [])}


def measure_loudness(recording: Path) -> dict:
    """loudnorm's first pass: how loud the recording is, for the second to correct exactly."""
    out = run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(recording), "-vn",
               "-af", f"aformat=channel_layouts=mono,loudnorm={LOUDNESS}:print_format=json", "-f", "null", "-"])
    return json.loads(out.stderr[out.stderr.rindex("{"):out.stderr.rindex("}") + 1])


def encode(recording: Path, measured: dict, target: Path) -> None:
    applied = (f"loudnorm={LOUDNESS}:measured_I={measured['input_i']}:measured_TP={measured['input_tp']}"
               f":measured_LRA={measured['input_lra']}:measured_thresh={measured['input_thresh']}"
               f":offset={measured['target_offset']}:linear=true")
    run(["ffmpeg", "-hide_banner", "-nostats", "-y", "-i", str(recording),
         # At most 1920 wide, never enlarged, both sides even, which H.264 needs.
         "-vf", "scale='trunc(min(1920,iw)/2)*2':-2:flags=lanczos", "-fpsmax", "30",
         "-c:v", "libx264", "-preset", "slow", "-crf", "28", "-pix_fmt", "yuv420p",
         "-af", f"aformat=channel_layouts=mono,{applied}", "-ar", "48000", "-c:a", "aac", "-b:a", "64k",
         # The index up front, so the player starts before the whole file has come.
         "-movflags", "+faststart", str(target)])


# --- Captions ----------------------------------------------------------------


def transcribe(video: Path, model_name: str, words: list[str], scratch: Path) -> list[dict]:
    import numpy as np
    from faster_whisper import WhisperModel

    # Whisper hears 16 kHz mono, handed over as samples: the decoder it brings
    # (PyAV) no longer takes the arguments faster-whisper passes it.
    audio_path = scratch / "audio.wav"
    run(["ffmpeg", "-hide_banner", "-nostats", "-y", "-i", str(video), "-vn", "-ac", "1", "-ar", "16000",
         "-c:a", "pcm_s16le", str(audio_path)])
    with wave.open(str(audio_path), "rb") as w:
        audio = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0

    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    segments, _info = model.transcribe(
        audio,
        language="en",
        word_timestamps=True,
        vad_filter=True,
        initial_prompt=". ".join(PORTAL_WORDS + words) + ".",
    )
    return [
        {"word": w.word, "start": w.start, "end": w.end, "p": w.probability}
        for segment in segments
        for w in (segment.words or [])
    ]


def text_of(words: list[dict]) -> str:
    return "".join(w["word"] for w in words).strip()


def wrap(text: str) -> str:
    """One line, or two of about equal length: what the picture shows in full screen."""
    if len(text) <= LINE_CHARS:
        return text
    parts = text.split()
    best = min(
        ((" ".join(parts[:i]), " ".join(parts[i:])) for i in range(1, len(parts))),
        key=lambda pair: abs(len(pair[0]) - len(pair[1])),
    )
    return "\n".join(best)


def split_long(words: list[dict]) -> list[list[dict]]:
    """A sentence too long for one cue, cut into parts at commas where it can be."""
    total = len(text_of(words))
    parts = math.ceil(total / MAX_CHARS)
    if parts <= 1 or len(words) < 4:
        return [words]
    target = total / parts
    best = None
    for i in range(2, len(words) - 1):
        left = len(text_of(words[:i]))
        if left > MAX_CHARS:
            break
        comma = words[i - 1]["word"].strip().endswith((",", ";", ":"))
        score = abs(left - target) - (25 if comma else 0)
        if best is None or score < best[0]:
            best = (score, i)
    if best is None:
        return [words]
    return [words[: best[1]]] + split_long(words[best[1]:])


def cues_of(words: list[dict]) -> list[list[dict]]:
    """Sentences (a long pause ends one too), cut where long; short neighbours spoken together share a cue."""
    sentences, current = [], []
    for i, w in enumerate(words):
        current.append(w)
        last = i == len(words) - 1
        ends = w["word"].strip().endswith((".", "?", "!"))
        pause = not last and words[i + 1]["start"] - w["end"] > PAUSE
        if last or ends or pause:
            sentences.append(current)
            current = []

    cues: list[list[dict]] = []
    for chunk in (part for s in sentences for part in split_long(s)):
        if cues:
            prev = cues[-1]
            gap = chunk[0]["start"] - prev[-1]["end"]
            joined = len(text_of(prev)) + 1 + len(text_of(chunk))
            span = chunk[-1]["end"] - prev[0]["start"]
            if gap <= 0.6 and joined <= MAX_CHARS and span <= MAX_SECONDS:
                prev.extend(chunk)
                continue
        cues.append(list(chunk))
    return cues


def spelled(text: str, words: list[str]) -> str:
    """The portal's and the client's words of more than one part spelled as given, whatever case Whisper chose."""
    for term in words:
        if re.search(r"[\s-]", term):
            text = re.sub(rf"(?<!\w){re.escape(term)}(?!\w)", term, text, flags=re.IGNORECASE)
    return text


def write_vtt(cues: list[list[dict]], words: list[str], target: Path) -> None:
    with target.open("w", encoding="utf-8") as f:
        f.write("WEBVTT\n\n")
        for n, cue in enumerate(cues, 1):
            text = wrap(spelled(text_of(cue), PORTAL_WORDS + words))
            text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            f.write(f"{n}\n{stamp(cue[0]['start'])} --> {stamp(cue[-1]['end'])}\n{text}\n\n")


# --- The command -------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(description="Make a welcome video's MP4 and captions from a recording.")
    parser.add_argument("recording", type=Path)
    parser.add_argument("--words", default="", help='the client\'s words, comma-separated: "Fur-Ever Friends, Jane"')
    parser.add_argument("--model", default="medium.en", help="Whisper model (small.en is faster and hears less)")
    args = parser.parse_args()

    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            fail(f"{tool} isn't on this machine's PATH")
    recording: Path = args.recording.expanduser().resolve()
    if not recording.is_file():
        fail(f"no file at {recording}")
    words = [w.strip() for w in args.words.split(",") if w.strip()]
    video = recording.with_name(f"{recording.stem}-welcome.mp4")
    captions = recording.with_name(f"{recording.stem}-welcome.vtt")
    if video == recording:
        fail("the recording already has the name this would write; rename it first")

    duration, streams = probe(recording)
    if "video" not in streams or "audio" not in streams:
        fail("the recording needs both a picture and sound")
    print(f"{recording.name}: {clock(duration)}, {megabytes(recording)}")

    with tempfile.TemporaryDirectory(prefix="welcome-video-") as tmp:
        scratch = Path(tmp)
        print("Measuring the sound...", flush=True)
        measured = measure_loudness(recording)
        print("Encoding the picture and sound...", flush=True)
        encoded = scratch / video.name
        encode(recording, measured, encoded)
        print(f"Transcribing with Whisper ({args.model})...", flush=True)
        heard = transcribe(encoded, args.model, words, scratch)
        if not heard:
            fail("Whisper heard no speech in the recording")
        cues = cues_of(heard)
        write_vtt(cues, words, scratch / captions.name)
        shutil.move(encoded, video)
        shutil.move(scratch / captions.name, captions)

    total = video.stat().st_size + captions.stat().st_size
    print()
    print(f"{video}  {megabytes(video)}, sound {float(measured['input_i']):.1f} LUFS brought to -16")
    print(f"{captions}  {len(cues)} captions")
    doubtful = [(cue, [w["word"].strip(" ,.;:!?") for w in cue if w["p"] < UNSURE]) for cue in cues]
    doubtful = [(cue, unsure) for cue, unsure in doubtful if unsure]
    if doubtful:
        print("\nCaptions with a word heard unsurely (in brackets); check them by ear and correct the .vtt:")
        for cue, unsure in doubtful:
            print(f"  {clock(cue[0]['start']):>5}  {spelled(text_of(cue), PORTAL_WORDS + words)}  [{', '.join(unsure)}]")
    if total > UPLOAD_MAX_BYTES:
        fail(f"the two files come to {total / 1_000_000:.0f} MB, over the upload's 100 MB: record it shorter")


if __name__ == "__main__":
    main()
