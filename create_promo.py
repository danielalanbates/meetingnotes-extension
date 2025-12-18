#!/usr/bin/env python3
"""
MeetingNotes YouTube Promo Video Creator
Creates a polished 40-second promo from raw screen recording
"""

import subprocess
from pathlib import Path
import json

# Configuration
downloads = Path.home() / "Downloads"
video_files = list(downloads.glob("Screen Recording 2025-10-25*.mov"))
INPUT_VIDEO = str(video_files[0])
OUTPUT_DIR = Path("/Users/daniel/Documents/aicode/17-Meeting_Tools/Simple_MeetingNotes/promo_output")
OUTPUT_DIR.mkdir(exist_ok=True)

OUTPUT_VIDEO = str(OUTPUT_DIR / "MeetingNotes_Promo.mp4")
TEMP_DIR = OUTPUT_DIR / "temp"
TEMP_DIR.mkdir(exist_ok=True)

# Video editing plan - timestamps for best moments
# These will be extracted from the 3-minute footage
CLIPS = [
    # Format: (start_time, duration, description)
    ("0:00", 3, "Opening - Extension UI"),
    ("0:10", 3, "Template selection"),
    ("0:25", 4, "Typing notes with template"),
    ("0:40", 3, "Theme switching (light/dark)"),
    ("0:55", 3, "Export menu showcase"),
    ("1:10", 4, "Email export demonstration"),
    ("1:25", 3, "Different template switch"),
    ("1:40", 3, "Settings panel"),
    ("2:00", 3, "Platform detection indicator"),
    ("2:15", 2, "Final UI shot"),
]

# Text overlays for each section
TEXT_OVERLAYS = [
    (0, 3, "Tired of messy meeting notes?", 60, "white", "bold"),
    (3, 5, "Introducing MeetingNotes", 72, "#2563eb", "bold"),
    (8, 4, "Beautiful Templates", 54, "white", "normal"),
    (12, 4, "Light & Dark Themes", 54, "white", "normal"),
    (16, 5, "7 Export Options", 54, "white", "normal"),
    (21, 6, "One-Click Email Export", 60, "#10B981", "bold"),
    (27, 4, "Auto-Detects Video Calls", 54, "white", "normal"),
    (31, 4, "Works on 15+ Platforms", 54, "white", "normal"),
    (35, 5, "Get MeetingNotes FREE", 66, "#2563eb", "bold"),
]

print("🎬 Creating MeetingNotes Promo Video")
print(f"📹 Source: {INPUT_VIDEO}")
print(f"📊 Output: {OUTPUT_VIDEO}")
print()

# Step 1: Extract and trim clips
print("✂️  Step 1: Extracting key clips...")
clip_files = []

for i, (start, duration, desc) in enumerate(CLIPS):
    clip_output = TEMP_DIR / f"clip_{i:02d}.mp4"
    clip_files.append(str(clip_output))

    print(f"  Clip {i+1}/10: {desc} ({start}, {duration}s)")

    cmd = [
        'ffmpeg', '-y',
        '-ss', start,
        '-i', INPUT_VIDEO,
        '-t', str(duration),
        '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '18',
        '-an',  # Remove audio for now
        str(clip_output)
    ]

    result = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if result.returncode != 0:
        print(f"    ❌ Failed to extract clip {i+1}")
    else:
        print(f"    ✅ Extracted")

# Step 2: Create concat file
print("\n🔗 Step 2: Concatenating clips...")
concat_file = TEMP_DIR / "concat.txt"
with open(concat_file, 'w') as f:
    for clip in clip_files:
        f.write(f"file '{clip}'\n")

# Concatenate all clips
concat_output = TEMP_DIR / "concatenated.mp4"
cmd = [
    'ffmpeg', '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', str(concat_file),
    '-c', 'copy',
    str(concat_output)
]

result = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
if result.returncode == 0:
    print("  ✅ Clips concatenated")
else:
    print("  ❌ Failed to concatenate")
    exit(1)

# Step 3: Add text overlays with ffmpeg drawtext
print("\n📝 Step 3: Adding text overlays and effects...")

# Build complex filter for text overlays
filter_parts = []
for i, (start, duration, text, fontsize, color, weight) in enumerate(TEXT_OVERLAYS):
    # Convert color
    if color.startswith('#'):
        color = color.lstrip('#')

    # Font weight
    fontfile = "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if weight == "bold" else "/System/Library/Fonts/Supplemental/Arial.ttf"

    # Add fade in/out effects
    fade_duration = 0.3

    filter_parts.append(
        f"drawtext=fontfile='{fontfile}':"
        f"text='{text}':"
        f"fontsize={fontsize}:"
        f"fontcolor={color}:"
        f"x=(w-text_w)/2:"
        f"y=h-150:"
        f"enable='between(t,{start},{start+duration})':"
        f"alpha='if(lt(t,{start+fade_duration}),(t-{start})/{fade_duration},if(gt(t,{start+duration-fade_duration}),({start+duration}-t)/{fade_duration},1))'"
    )

# Combine all filters with comma
video_filter = ",".join(filter_parts)

# Also add subtle zoom effect for visual interest
video_filter = f"zoompan=z='if(lte(zoom,1.0),1.05,max(1.0,zoom-0.0015))':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080,{video_filter}"

cmd = [
    'ffmpeg', '-y',
    '-i', str(concat_output),
    '-vf', video_filter,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-an',
    OUTPUT_VIDEO
]

print("  Processing (this may take a minute)...")
result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    print("  ✅ Text overlays added")
else:
    print("  ❌ Failed to add text overlays")
    print(result.stderr[-500:])
    exit(1)

# Get final video info
print(f"\n✅ PROMO VIDEO CREATED!")
print(f"📍 Location: {OUTPUT_VIDEO}")

size_mb = Path(OUTPUT_VIDEO).stat().st_size / 1024 / 1024
print(f"📊 Size: {size_mb:.1f} MB")

# Get duration
cmd = ['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format', OUTPUT_VIDEO]
result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    info = json.loads(result.stdout)
    duration = float(info['format']['duration'])
    print(f"⏱️  Duration: {duration:.1f} seconds")

print(f"\n🎥 Open video: open '{OUTPUT_VIDEO}'")
print(f"🗑️  Clean up temp files: rm -rf '{TEMP_DIR}'")
