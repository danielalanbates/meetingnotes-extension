// Calendar Integration Service
// Google Calendar OAuth integration for auto-populating meeting details

class CalendarIntegrationService {
  constructor() {
    this.clientId = null; // Will be set from settings
    this.accessToken = null;
    this.apiEndpoint = 'https://www.googleapis.com/calendar/v3';
    this.scopes = ['https://www.googleapis.com/auth/calendar.readonly'];
  }

  /**
   * Initialize calendar service
   */
  async initialize() {
    const result = await chrome.storage.local.get(['calendar_client_id', 'calendar_access_token']);

    this.clientId = result.calendar_client_id;
    this.accessToken = result.calendar_access_token;

    return !!(this.clientId && this.accessToken);
  }

  /**
   * Set client ID (from Google Cloud Console)
   */
  async setClientId(clientId) {
    await chrome.storage.local.set({ calendar_client_id: clientId });
    this.clientId = clientId;
  }

  /**
   * Authenticate with Google Calendar
   */
  async authenticate() {
    if (!this.clientId) {
      throw new Error('Client ID not configured. Please set up OAuth credentials.');
    }

    try {
      // Use Chrome Identity API for OAuth
      const token = await chrome.identity.getAuthToken({
        interactive: true,
        scopes: this.scopes
      });

      this.accessToken = token;
      await chrome.storage.local.set({ calendar_access_token: token });

      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw new Error('Failed to authenticate with Google Calendar');
    }
  }

  /**
   * Get current meeting from calendar
   * Looks for events happening now (±5 minutes)
   */
  async getCurrentMeeting() {
    if (!this.accessToken) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Calendar not authenticated');
      }
    }

    const now = new Date();
    const timeMin = new Date(now.getTime() - 5 * 60000).toISOString(); // 5 min ago
    const timeMax = new Date(now.getTime() + 5 * 60000).toISOString(); // 5 min future

    try {
      const response = await fetch(
        `${this.apiEndpoint}/calendars/primary/events?` +
        `timeMin=${encodeURIComponent(timeMin)}&` +
        `timeMax=${encodeURIComponent(timeMax)}&` +
        `singleEvents=true&` +
        `orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, re-authenticate
          await this.refreshToken();
          return this.getCurrentMeeting(); // Retry
        }
        throw new Error(`Calendar API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        return null; // No meeting found
      }

      const meeting = data.items[0];

      return this.parseCalendarEvent(meeting);
    } catch (error) {
      console.error('Failed to fetch current meeting:', error);
      throw error;
    }
  }

  /**
   * Get meeting by time range
   */
  async getMeetingByTime(startTime, endTime) {
    if (!this.accessToken) {
      throw new Error('Calendar not authenticated');
    }

    try {
      const response = await fetch(
        `${this.apiEndpoint}/calendars/primary/events?` +
        `timeMin=${encodeURIComponent(startTime)}&` +
        `timeMax=${encodeURIComponent(endTime)}&` +
        `singleEvents=true&` +
        `orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        return null;
      }

      return this.parseCalendarEvent(data.items[0]);
    } catch (error) {
      console.error('Failed to fetch meeting:', error);
      throw error;
    }
  }

  /**
   * Parse calendar event into meeting info
   */
  parseCalendarEvent(event) {
    const attendees = [];

    if (event.attendees) {
      event.attendees.forEach(attendee => {
        if (attendee.email) {
          attendees.push(attendee.email);
        }
      });
    }

    // Extract meeting URL if available
    let meetingUrl = null;
    if (event.hangoutLink) {
      meetingUrl = event.hangoutLink; // Google Meet link
    } else if (event.location && event.location.startsWith('http')) {
      meetingUrl = event.location; // Zoom/Teams link in location
    } else if (event.description) {
      // Try to extract URL from description
      const urlMatch = event.description.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        meetingUrl = urlMatch[0];
      }
    }

    return {
      id: event.id,
      title: event.summary || 'Untitled Meeting',
      description: event.description || '',
      startTime: event.start.dateTime || event.start.date,
      endTime: event.end.dateTime || event.end.date,
      attendees,
      attendeeCount: attendees.length,
      organizer: event.organizer?.email || '',
      meetingUrl,
      location: event.location || '',
      source: 'google-calendar'
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken() {
    try {
      // Remove cached token
      await chrome.identity.removeCachedAuthToken({ token: this.accessToken });

      // Get new token
      const token = await chrome.identity.getAuthToken({
        interactive: false,
        scopes: this.scopes
      });

      this.accessToken = token;
      await chrome.storage.local.set({ calendar_access_token: token });

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If non-interactive refresh fails, require user to re-auth
      return this.authenticate();
    }
  }

  /**
   * Sign out and revoke access
   */
  async signOut() {
    if (this.accessToken) {
      try {
        // Revoke token
        await chrome.identity.removeCachedAuthToken({ token: this.accessToken });

        // Optional: Revoke on server side
        await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${this.accessToken}`);
      } catch (error) {
        console.error('Sign out error:', error);
      }
    }

    // Clear stored credentials
    await chrome.storage.local.remove(['calendar_access_token']);
    this.accessToken = null;
  }

  /**
   * Check if calendar is connected
   */
  async isConnected() {
    const result = await chrome.storage.local.get('calendar_access_token');
    return !!result.calendar_access_token;
  }

  /**
   * Get upcoming meetings (next 7 days)
   */
  async getUpcomingMeetings(days = 7) {
    if (!this.accessToken) {
      throw new Error('Calendar not authenticated');
    }

    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    try {
      const response = await fetch(
        `${this.apiEndpoint}/calendars/primary/events?` +
        `timeMin=${encodeURIComponent(now.toISOString())}&` +
        `timeMax=${encodeURIComponent(future.toISOString())}&` +
        `singleEvents=true&` +
        `orderBy=startTime&` +
        `maxResults=50`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.items) {
        return [];
      }

      return data.items.map(event => this.parseCalendarEvent(event));
    } catch (error) {
      console.error('Failed to fetch upcoming meetings:', error);
      throw error;
    }
  }

  /**
   * Create calendar event for action item reminder
   */
  async createReminderEvent(actionItem) {
    if (!this.accessToken) {
      throw new Error('Calendar not authenticated');
    }

    const dueDate = new Date(actionItem.dueDate);
    const endDate = new Date(dueDate.getTime() + 15 * 60000); // 15 min event

    const event = {
      summary: `Action Item: ${actionItem.task}`,
      description: `Assigned to: ${actionItem.owner}\n\nFrom meeting: ${actionItem.meetingInfo.title}`,
      start: {
        dateTime: dueDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 }, // 1 hour before
          { method: 'popup', minutes: 1440 } // 1 day before
        ]
      }
    };

    try {
      const response = await fetch(
        `${this.apiEndpoint}/calendars/primary/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create event: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to create reminder event:', error);
      throw error;
    }
  }

  /**
   * Auto-detect meeting from current tab URL
   */
  async autoDetectMeeting(currentUrl) {
    // First try to get from calendar
    const calendarMeeting = await this.getCurrentMeeting();

    if (!calendarMeeting) {
      return null;
    }

    // If calendar meeting has a URL, check if it matches current URL
    if (calendarMeeting.meetingUrl) {
      const calendarDomain = new URL(calendarMeeting.meetingUrl).hostname;
      const currentDomain = new URL(currentUrl).hostname;

      if (calendarDomain === currentDomain) {
        return calendarMeeting; // Perfect match!
      }
    }

    // Fallback: if we're in a meeting platform, return calendar meeting anyway
    const meetingPlatforms = ['zoom.us', 'meet.google.com', 'teams.microsoft.com', 'webex.com'];
    const isOnMeetingPlatform = meetingPlatforms.some(platform =>
      currentUrl.includes(platform)
    );

    if (isOnMeetingPlatform) {
      return calendarMeeting;
    }

    return null;
  }
}

// Export singleton instance
const calendarIntegrationService = new CalendarIntegrationService();
