#!/bin/bash
# MeetingNotes Chrome Extension Installer
# https://github.com/danielalanbates/meetingnotes-extension

set -e

REPO="danielalanbates/meetingnotes-extension"
APP_NAME="MeetingNotes Extension"

echo "📝 Installing $APP_NAME..."
echo ""

# Create install directory
INSTALL_DIR="$HOME/Extensions/MeetingNotes"
mkdir -p "$INSTALL_DIR"

echo "📥 Downloading latest version..."
curl -L -o "$INSTALL_DIR/extension.zip" "https://github.com/$REPO/archive/refs/heads/main.zip"

echo "📦 Extracting..."
cd "$INSTALL_DIR"
unzip -o extension.zip
mv meetingnotes-extension-main/* . 2>/dev/null || true
rm -rf meetingnotes-extension-main extension.zip

echo ""
echo "✅ $APP_NAME downloaded successfully!"
echo "📍 Location: $INSTALL_DIR"
echo ""
echo "To install in Chrome:"
echo "  1. Open chrome://extensions/"
echo "  2. Enable 'Developer mode' (top right)"
echo "  3. Click 'Load unpacked'"
echo "  4. Select: $INSTALL_DIR"
echo ""
echo "Opening Chrome extensions page..."
open "chrome://extensions/" 2>/dev/null || echo "Please open chrome://extensions/ manually"
