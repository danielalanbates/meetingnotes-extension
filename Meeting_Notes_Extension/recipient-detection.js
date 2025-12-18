// Smart Recipient Detection Service
// Auto-detects meeting attendees and suggests recipients for notes

class RecipientDetectionService {
  constructor() {
    this.contactListsKey = 'contact_lists';
    this.frequentRecipientsKey = 'frequent_recipients';
  }

  /**
   * Detect recipients from multiple sources
   */
  async detectRecipients(meetingInfo) {
    const { url, platform, calendarData } = meetingInfo;

    const recipients = [];

    // Source 1: Calendar data (highest priority)
    if (calendarData && calendarData.attendees) {
      recipients.push(...calendarData.attendees.map(email => ({
        email,
        source: 'calendar',
        confidence: 95
      })));
    }

    // Source 2: Parse from meeting URL/DOM
    const urlRecipients = await this.parseFromPlatform(url, platform);
    urlRecipients.forEach(email => {
      if (!recipients.find(r => r.email === email)) {
        recipients.push({
          email,
          source: 'platform',
          confidence: 70
        });
      }
    });

    // Source 3: Frequent recipients (historical data)
    const frequentRecipients = await this.getFrequentRecipients(5);
    frequentRecipients.forEach(({ email, frequency }) => {
      if (!recipients.find(r => r.email === email)) {
        recipients.push({
          email,
          source: 'frequent',
          confidence: Math.min(frequency * 10, 50)
        });
      }
    });

    // Sort by confidence
    recipients.sort((a, b) => b.confidence - a.confidence);

    return recipients;
  }

  /**
   * Parse attendee emails from meeting platform
   */
  async parseFromPlatform(url, platform) {
    const emails = [];

    try {
      // Send message to content script to extract attendees from DOM
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length === 0) return emails;

      const response = await chrome.tabs.sendMessage(tabs[0].id, {
        type: 'EXTRACT_ATTENDEES',
        platform
      });

      if (response && response.attendees) {
        emails.push(...response.attendees);
      }
    } catch (error) {
      console.error('Failed to extract attendees from platform:', error);
    }

    // Fallback: try to extract from URL parameters
    const urlEmails = this.extractEmailsFromUrl(url);
    urlEmails.forEach(email => {
      if (!emails.includes(email)) {
        emails.push(email);
      }
    });

    return emails;
  }

  /**
   * Extract emails from URL parameters
   */
  extractEmailsFromUrl(url) {
    const emails = [];
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    const matches = url.match(emailRegex);
    if (matches) {
      emails.push(...matches);
    }

    return [...new Set(emails)]; // Remove duplicates
  }

  /**
   * Get contact lists
   */
  async getContactLists() {
    const result = await chrome.storage.local.get(this.contactListsKey);
    return result[this.contactListsKey] || [];
  }

  /**
   * Save contact list
   */
  async saveContactList(name, emails) {
    const lists = await this.getContactLists();

    const existingIndex = lists.findIndex(list => list.name === name);
    const newList = {
      name,
      emails,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      lists[existingIndex] = newList;
    } else {
      lists.push(newList);
    }

    await chrome.storage.local.set({
      [this.contactListsKey]: lists
    });

    return newList;
  }

  /**
   * Delete contact list
   */
  async deleteContactList(name) {
    const lists = await this.getContactLists();
    const filtered = lists.filter(list => list.name !== name);

    await chrome.storage.local.set({
      [this.contactListsKey]: filtered
    });
  }

  /**
   * Get frequent recipients based on history
   */
  async getFrequentRecipients(limit = 10) {
    const result = await chrome.storage.local.get(this.frequentRecipientsKey);
    const frequentMap = result[this.frequentRecipientsKey] || {};

    // Convert to array and sort by frequency
    const sorted = Object.entries(frequentMap)
      .map(([email, frequency]) => ({ email, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);

    return sorted;
  }

  /**
   * Track recipient usage
   */
  async trackRecipient(email) {
    const result = await chrome.storage.local.get(this.frequentRecipientsKey);
    const frequentMap = result[this.frequentRecipientsKey] || {};

    frequentMap[email] = (frequentMap[email] || 0) + 1;

    await chrome.storage.local.set({
      [this.frequentRecipientsKey]: frequentMap
    });
  }

  /**
   * Track multiple recipients
   */
  async trackRecipients(emails) {
    const promises = emails.map(email => this.trackRecipient(email));
    await Promise.all(promises);
  }

  /**
   * Suggest recipients with smart ranking
   */
  async suggestRecipients(meetingInfo) {
    const detected = await this.detectRecipients(meetingInfo);
    const lists = await this.getContactLists();

    // Add contact lists as suggestions
    const suggestions = {
      detected: detected.slice(0, 10), // Top 10 detected
      lists: lists.map(list => ({
        name: list.name,
        emails: list.emails,
        count: list.emails.length
      })),
      quickOptions: [
        {
          name: 'Just Me',
          type: 'self',
          emails: [] // Will be populated with user's email
        },
        {
          name: 'Meeting Attendees',
          type: 'attendees',
          emails: detected.filter(r => r.confidence >= 70).map(r => r.email)
        }
      ]
    };

    return suggestions;
  }

  /**
   * Get confidence label for display
   */
  getConfidenceLabel(confidence) {
    if (confidence >= 90) return 'in meeting';
    if (confidence >= 70) return 'detected';
    if (confidence >= 50) return 'frequent';
    if (confidence >= 30) return 'suggested';
    return 'maybe';
  }

  /**
   * Validate email address
   */
  isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Deduplicate and validate email list
   */
  cleanEmailList(emails) {
    const seen = new Set();
    const cleaned = [];

    emails.forEach(email => {
      const normalized = email.toLowerCase().trim();
      if (this.isValidEmail(normalized) && !seen.has(normalized)) {
        seen.add(normalized);
        cleaned.push(normalized);
      }
    });

    return cleaned;
  }

  /**
   * Format recipients for mailto: link
   */
  formatMailtoRecipients(emails) {
    return this.cleanEmailList(emails).join(',');
  }

  /**
   * Get user's own email (if available)
   */
  async getUserEmail() {
    // Try to get from storage
    const result = await chrome.storage.local.get('user_email');
    if (result.user_email) {
      return result.user_email;
    }

    // Try to detect from calendar or other sources
    // This would require calendar integration
    return null;
  }

  /**
   * Set user's email
   */
  async setUserEmail(email) {
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email address');
    }

    await chrome.storage.local.set({
      user_email: email.toLowerCase().trim()
    });
  }
}

// Export singleton instance
const recipientDetectionService = new RecipientDetectionService();
