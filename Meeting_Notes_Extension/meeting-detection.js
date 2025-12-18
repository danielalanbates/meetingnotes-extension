// Smart Meeting Detection Service
// Auto-detects meeting type and suggests appropriate templates

class MeetingDetectionService {
  constructor() {
    this.meetingPatterns = {
      standup: {
        keywords: ['standup', 'daily', 'scrum', 'daily scrum', 'morning sync'],
        attendeeRange: [2, 15],
        durationRange: [10, 30], // minutes
        timeOfDay: [7, 12], // 7am-12pm
        template: 'standup',
        confidence: 0
      },
      '1on1': {
        keywords: ['1:1', '1-1', 'one on one', 'one-on-one', 'check-in', 'catch up', 'sync'],
        attendeeRange: [2, 2], // exactly 2 people
        durationRange: [20, 60],
        template: '1on1',
        confidence: 0
      },
      'sprint-planning': {
        keywords: ['sprint', 'planning', 'iteration', 'sprint planning', 'planning poker'],
        attendeeRange: [3, 20],
        durationRange: [60, 240],
        template: 'sprint-planning',
        confidence: 0
      },
      retrospective: {
        keywords: ['retro', 'retrospective', 'sprint retro', 'iteration review', 'post-mortem'],
        attendeeRange: [3, 20],
        durationRange: [45, 120],
        template: 'retrospective',
        confidence: 0
      },
      'client-call': {
        keywords: ['client', 'demo', 'pitch', 'presentation', 'customer', 'prospect'],
        externalDomain: true,
        template: 'general',
        confidence: 0
      },
      'all-hands': {
        keywords: ['all hands', 'all-hands', 'town hall', 'company meeting', 'quarterly'],
        attendeeRange: [15, 1000],
        durationRange: [30, 90],
        template: 'general',
        confidence: 0
      },
      interview: {
        keywords: ['interview', 'candidate', 'screening', 'technical interview'],
        attendeeRange: [2, 5],
        durationRange: [30, 90],
        template: 'general',
        confidence: 0
      }
    };
  }

  /**
   * Detect meeting type based on multiple signals
   * @param {Object} meetingInfo - Meeting metadata
   * @returns {Object} - Detection result with type and confidence
   */
  detectMeetingType(meetingInfo) {
    const {
      title = '',
      attendeeCount = 0,
      startTime = new Date(),
      duration = 60,
      attendeeEmails = [],
      description = ''
    } = meetingInfo;

    // Reset confidence scores
    Object.keys(this.meetingPatterns).forEach(type => {
      this.meetingPatterns[type].confidence = 0;
    });

    const lowerTitle = title.toLowerCase();
    const lowerDescription = description.toLowerCase();
    const timeOfDay = new Date(startTime).getHours();

    // Check each pattern
    for (const [type, pattern] of Object.entries(this.meetingPatterns)) {
      let confidence = 0;

      // Keyword matching in title (highest weight)
      if (pattern.keywords) {
        const titleMatch = pattern.keywords.some(keyword =>
          lowerTitle.includes(keyword.toLowerCase())
        );
        if (titleMatch) confidence += 50;

        // Keyword matching in description
        const descMatch = pattern.keywords.some(keyword =>
          lowerDescription.includes(keyword.toLowerCase())
        );
        if (descMatch) confidence += 20;
      }

      // Attendee count matching
      if (pattern.attendeeRange && attendeeCount > 0) {
        const [min, max] = pattern.attendeeRange;
        if (attendeeCount >= min && attendeeCount <= max) {
          confidence += 15;
        }
      }

      // Duration matching
      if (pattern.durationRange) {
        const [min, max] = pattern.durationRange;
        if (duration >= min && duration <= max) {
          confidence += 10;
        }
      }

      // Time of day matching
      if (pattern.timeOfDay) {
        const [min, max] = pattern.timeOfDay;
        if (timeOfDay >= min && timeOfDay <= max) {
          confidence += 10;
        }
      }

      // External domain detection for client calls
      if (pattern.externalDomain && attendeeEmails.length > 0) {
        const hasExternalDomain = this.hasExternalDomain(attendeeEmails);
        if (hasExternalDomain) {
          confidence += 30;
        }
      }

      this.meetingPatterns[type].confidence = confidence;
    }

    // Find best match
    let bestMatch = { type: 'general', confidence: 0, template: 'general' };

    for (const [type, pattern] of Object.entries(this.meetingPatterns)) {
      if (pattern.confidence > bestMatch.confidence) {
        bestMatch = {
          type,
          confidence: pattern.confidence,
          template: pattern.template
        };
      }
    }

    // Use AI for ambiguous cases (confidence < 30)
    const useAI = bestMatch.confidence < 30 && bestMatch.confidence > 0;

    return {
      type: bestMatch.type,
      template: bestMatch.template,
      confidence: bestMatch.confidence,
      useAI,
      allScores: this.meetingPatterns
    };
  }

  /**
   * Check if attendees include external domains
   */
  hasExternalDomain(emails) {
    if (emails.length === 0) return false;

    // Get primary domain (most common)
    const domains = emails.map(email => {
      const parts = email.split('@');
      return parts.length === 2 ? parts[1] : '';
    }).filter(Boolean);

    if (domains.length === 0) return false;

    const domainCount = {};
    domains.forEach(domain => {
      domainCount[domain] = (domainCount[domain] || 0) + 1;
    });

    // If there are multiple domains, likely external
    return Object.keys(domainCount).length > 1;
  }

  /**
   * Get template suggestion based on detection
   */
  suggestTemplate(meetingInfo) {
    const detection = this.detectMeetingType(meetingInfo);

    return {
      template: detection.template,
      confidence: detection.confidence,
      shouldAsk: detection.confidence < 70, // Ask user if confidence is low
      message: this.getTemplateMessage(detection)
    };
  }

  /**
   * Get user-friendly message for template suggestion
   */
  getTemplateMessage(detection) {
    const { type, confidence, template } = detection;

    if (confidence >= 70) {
      return `This looks like a ${this.formatTypeName(type)}. Loading ${template} template...`;
    } else if (confidence >= 40) {
      return `This might be a ${this.formatTypeName(type)}. Use ${template} template?`;
    } else {
      return `Select a template to get started`;
    }
  }

  /**
   * Format type name for display
   */
  formatTypeName(type) {
    const names = {
      'standup': 'Daily Standup',
      '1on1': '1-on-1 Meeting',
      'sprint-planning': 'Sprint Planning',
      'retrospective': 'Retrospective',
      'client-call': 'Client Call',
      'all-hands': 'All Hands',
      'interview': 'Interview',
      'general': 'General Meeting'
    };

    return names[type] || type;
  }

  /**
   * Detect meeting type using AI (premium feature)
   */
  async detectWithAI(meetingInfo) {
    if (!aiService || !aiService.apiKey) {
      throw new Error('AI service not configured');
    }

    const { title, attendeeCount, startTime, description } = meetingInfo;
    const timeOfDay = new Date(startTime).getHours();

    const detectedType = await aiService.detectMeetingType(
      title,
      attendeeCount,
      timeOfDay,
      description
    );

    // Map AI result to template
    const templateMap = {
      'standup': 'standup',
      '1on1': '1on1',
      'sprint-planning': 'sprint-planning',
      'retrospective': 'retrospective',
      'client-call': 'general',
      'all-hands': 'general',
      'general': 'general'
    };

    return {
      type: detectedType,
      template: templateMap[detectedType] || 'general',
      confidence: 90, // AI detection has high confidence
      source: 'ai'
    };
  }

  /**
   * Get meeting hash for tracking recurring meetings
   */
  getMeetingHash(url) {
    // Extract meaningful parts of URL for consistent hashing
    const urlObj = new URL(url);

    // For Zoom
    if (url.includes('zoom.us')) {
      const match = url.match(/\/j\/(\d+)/);
      return match ? `zoom_${match[1]}` : this.simpleHash(url);
    }

    // For Google Meet
    if (url.includes('meet.google.com')) {
      const parts = urlObj.pathname.split('/');
      return parts.length > 1 ? `meet_${parts[parts.length - 1]}` : this.simpleHash(url);
    }

    // For Teams
    if (url.includes('teams.microsoft.com')) {
      const threadId = urlObj.searchParams.get('threadId');
      return threadId ? `teams_${threadId}` : this.simpleHash(url);
    }

    // For Webex
    if (url.includes('webex.com')) {
      const match = url.match(/\/meet\/([^\/\?]+)/);
      return match ? `webex_${match[1]}` : this.simpleHash(url);
    }

    // Fallback: simple hash
    return this.simpleHash(url);
  }

  /**
   * Simple hash function for URLs
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hash_${Math.abs(hash)}`;
  }
}

// Export singleton instance
const meetingDetectionService = new MeetingDetectionService();
