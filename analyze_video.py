#!/usr/bin/env python3
"""Analyze video file and create promo video"""

import subprocess
import json
import os
from pathlib import Path

# Find the video file
downloads = Path.home() / "Downloads"
video_files = list(downloads.glob("Screen Recording 2025-10-25*.mov"))

if not video_files:
    print("❌ No video file found")
    exit(1)

video_path = video_files[0]
print(f"📹 Found video: {video_path}")
print(f"📊 Size: {video_path.stat().st_size / 1024 / 1024:.1f} MB")

# Get video info
cmd = [
    'ffprobe',
    '-v', 'quiet',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    str(video_path)
]

result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    info = json.loads(result.stdout)

    # Extract key info
    duration = float(info['format']['duration'])
    print(f"⏱️  Duration: {duration:.1f} seconds ({duration/60:.1f} minutes)")

    for stream in info['streams']:
        if stream['codec_type'] == 'video':
            print(f"📐 Resolution: {stream['width']}x{stream['height']}")
            print(f"🎬 Codec: {stream['codec_name']}")
            print(f"📊 Frame rate: {stream.get('r_frame_rate', 'unknown')}")
            break
else:
    print("❌ Could not analyze video")
    print(result.stderr)
