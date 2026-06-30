"""Generate the bundled three-speaker MP3 pack for 聆听训练.

This uses edge-tts, which does not require Azure account secrets. It reads the
fixed local scenario catalog and writes deterministic file paths consumed by
the PWA and iOS wrapper.
"""

from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

import edge_tts


SPEAKERS = {
    "lin_xiao": {
        "voice": "zh-CN-XiaoxiaoNeural",
        "rate": "+0%",
        "pitch": "+0Hz",
    },
    "chen_yu": {
        "voice": "zh-CN-YunxiNeural",
        "rate": "+0%",
        "pitch": "-2Hz",
    },
    "su_ning": {
        "voice": "zh-CN-XiaoyiNeural",
        "rate": "-2%",
        "pitch": "+1Hz",
    },
}


async def generate_one(text: str, speaker_id: str, output_path: Path) -> None:
    profile = SPEAKERS[speaker_id]
    output_path.parent.mkdir(parents=True, exist_ok=True)
    communicate = edge_tts.Communicate(
        text=text,
        voice=profile["voice"],
        rate=profile["rate"],
        pitch=profile["pitch"],
    )
    await communicate.save(str(output_path))


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="Regenerate existing MP3 files.")
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    scenarios = json.loads((root / "data" / "scenarios.json").read_text(encoding="utf-8"))["scenarios"]
    manifest = json.loads((root / "data" / "audio-manifest.json").read_text(encoding="utf-8"))
    expected_ids = set(manifest["scenarios"])
    actual_ids = {item["id"] for item in scenarios}
    missing = sorted(expected_ids - actual_ids)
    extra = sorted(actual_ids - expected_ids)
    if missing or extra:
        raise SystemExit(f"audio manifest mismatch; missing={missing}; extra={extra}")

    generated = 0
    skipped = 0
    for scenario in scenarios:
        text = scenario["text"].strip()
        for speaker_id in manifest["speakers"]:
            output_path = root / "audio" / "scenarios" / speaker_id / f"{scenario['id']}.mp3"
            if output_path.exists() and not args.force:
                skipped += 1
                continue
            await generate_one(text, speaker_id, output_path)
            generated += 1
            print(f"generated {output_path.relative_to(root)}")

    print(f"done: generated={generated}, skipped={skipped}")


if __name__ == "__main__":
    asyncio.run(main())
