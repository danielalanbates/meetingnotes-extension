# MeetPad

> Your meeting notepad, always by your side. AI-powered notes with voice-to-text and auto-email. Persistent side panel for Zoom, Teams, Google Meet, and Webex.

## Features

- **Universal Platform Support**: Works seamlessly with Zoom, Google Meet, Microsoft Teams, and Webex
- **Smart Templates**: Pre-built templates for general meetings, standups, retrospectives, 1-on-1s, and custom notes
- **Auto-Save**: Automatic saving ensures you never lose your notes
- **Rich Text Editor**: Simple formatting tools for bold, italic, bullets, and task lists
- **Multiple Export Formats**: Export to Plain Text, Markdown, HTML, or JSON
- **Meeting Detection**: Automatically detects when you're in a meeting
- **Notes History**: Access your previous meeting notes anytime
- **Keyboard Shortcuts**: Quick access with Ctrl/Cmd + Shift + N

## Installation

### From Source

1. Clone or download this repository
2. Open Chrome/Edge and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the extension directory

### From Chrome Web Store

*Coming soon!*

## Usage

### Taking Notes

1. Join a meeting on any supported platform (Zoom, Teams, Google Meet, Webex)
2. Click the MeetPad extension icon in your browser toolbar
3. Choose a template from the dropdown or start with a blank note
4. Start typing your notes - they auto-save automatically
5. Use the toolbar buttons for formatting:
   - **B** - Bold text
   - **I** - Italic text
   - **•** - Bullet list
   - **☑** - Task checkbox
   - **✨** - AI assist (coming soon)

### Saving & Exporting

- **Auto-Save**: Enabled by default, saves your notes every second after you stop typing
- **Manual Save**: Click "Save Notes" to save to your history
- **Export**: Click "Export" and choose your preferred format:
  - Plain Text (.txt)
  - Markdown (.md)
  - HTML (.html)
  - JSON (.json)

### Templates

Choose from pre-built templates:

- **General Meeting**: Standard meeting notes with agenda, discussion points, and action items
- **Daily Standup**: Yesterday, today, blockers format
- **Retrospective**: What went well, what didn't, action items
- **1-on-1**: Check-in, topics, feedback, goals
- **Custom**: Start from scratch

### Keyboard Shortcuts

- `Ctrl/Cmd + Shift + N`: Open notes popup quickly

## Supported Platforms

| Platform | Status | Features |
|----------|--------|----------|
| Zoom | ✅ Supported | Meeting detection, participant list |
| Google Meet | ✅ Supported | Meeting detection, meeting code |
| Microsoft Teams | ✅ Supported | Meeting detection |
| Webex | ✅ Supported | Meeting detection |

## Privacy & Security

- **Local Storage**: All notes are stored locally on your device
- **No External Servers**: Your notes never leave your browser
- **No Account Required**: Works completely offline after installation
- **No Tracking**: We don't collect any usage data or analytics

## Development

### Project Structure

```
meeting-notes-extension/
├── manifest.json           # Extension configuration
├── background.js           # Service worker for background tasks
├── content.js             # Injected into meeting platforms
├── popup.html             # Main UI
├── popup.js               # UI logic
├── styles.css             # Styling
├── welcome.html           # Onboarding page
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # Documentation
```

### File Descriptions

- **manifest.json**: Chrome extension manifest v3 configuration
- **background.js**: Service worker handling installation, meeting tracking, notifications, and badge updates
- **content.js**: Content script injected into meeting platforms for detection and data extraction
- **popup.html/js**: Main extension popup interface and logic
- **styles.css**: All styling for the popup interface
- **welcome.html**: First-time installation welcome page

### Building

This extension is pure JavaScript and doesn't require a build step. Simply load it as an unpacked extension in Chrome.

### Testing

1. Load the extension in developer mode
2. Navigate to any supported meeting platform
3. Verify the extension indicator appears
4. Open the popup and test all features

## Roadmap

### Upcoming Features

- [ ] AI-powered note summarization
- [ ] Action item extraction
- [ ] Participant auto-detection
- [ ] Cloud sync (optional)
- [ ] Custom template creation
- [ ] Dark mode
- [ ] Calendar integration
- [ ] Meeting transcription integration
- [ ] Collaborative notes
- [ ] Browser notification improvements

## Troubleshooting

### Extension not detecting meeting

- Ensure you're on a supported platform URL
- Refresh the page after installing the extension
- Check that the extension has permission for the site

### Notes not saving

- Check browser storage permissions
- Verify you're not in incognito mode (unless extension is enabled for incognito)
- Try clearing extension storage and restarting

### Export not working

- Ensure download permissions are granted
- Check browser download settings
- Try a different export format

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

## Acknowledgments

- Icons and design inspired by modern productivity tools
- Built with vanilla JavaScript for maximum performance
- Thanks to all beta testers and early adopters

---

**Version**: 1.0.0
**Last Updated**: October 2024
**Made with ❤️ by BatesAI**
