// Recurring Meeting Intelligence Service
// Compares recurring meetings and tracks progress

class RecurringMeetingService {
  constructor() {
    this.storageKey = 'recurring_meetings';
  }

  /**
   * Save meeting notes with metadata for future comparison
   */
  async saveMeetingNotes(meetingHash, notes, meetingInfo) {
    const existingData = await this.getMeetingHistory(meetingHash);

    const meetingRecord = {
      hash: meetingHash,
      timestamp: new Date().toISOString(),
      notes,
      meetingInfo: {
        title: meetingInfo.title || 'Untitled Meeting',
        platform: meetingInfo.platform || 'unknown',
        attendeeCount: meetingInfo.attendeeCount || 0,
        url: meetingInfo.url || ''
      },
      tags: [], // Will be populated by AI
      actionItems: [] // Will be extracted by AI
    };

    // Extract tags and action items if AI is available
    if (aiService && aiService.apiKey) {
      try {
        const [tags, actionItems] = await Promise.all([
          aiService.extractTags(notes),
          aiService.extractActionItems(notes)
        ]);
        meetingRecord.tags = this.parseTags(tags);
        meetingRecord.actionItems = this.parseActionItems(actionItems);
      } catch (error) {
        console.error('Failed to extract AI metadata:', error);
      }
    }

    // Keep last 10 meetings for this recurring meeting
    const history = [meetingRecord, ...existingData.history.slice(0, 9)];

    const updatedData = {
      ...existingData,
      hash: meetingHash,
      lastMeeting: meetingRecord,
      history,
      totalMeetings: (existingData.totalMeetings || 0) + 1,
      firstMeeting: existingData.firstMeeting || meetingRecord.timestamp
    };

    await chrome.storage.local.set({
      [this.getStorageKey(meetingHash)]: updatedData
    });

    return updatedData;
  }

  /**
   * Get meeting history for a recurring meeting
   */
  async getMeetingHistory(meetingHash) {
    const storageKey = this.getStorageKey(meetingHash);
    const result = await chrome.storage.local.get(storageKey);

    return result[storageKey] || {
      hash: meetingHash,
      history: [],
      totalMeetings: 0,
      firstMeeting: null,
      lastMeeting: null
    };
  }

  /**
   * Check if this is a recurring meeting
   */
  async isRecurringMeeting(meetingHash) {
    const history = await this.getMeetingHistory(meetingHash);
    return history.totalMeetings > 0;
  }

  /**
   * Compare current meeting with previous meeting
   */
  async compareWithPrevious(meetingHash, currentNotes) {
    const history = await this.getMeetingHistory(meetingHash);

    if (!history.lastMeeting) {
      return {
        isFirstMeeting: true,
        comparison: null
      };
    }

    const previousNotes = history.lastMeeting.notes;

    // Use AI to compare if available
    if (aiService && aiService.apiKey) {
      try {
        const comparison = await aiService.compareRecurringMeetings(
          previousNotes,
          currentNotes
        );

        return {
          isFirstMeeting: false,
          previousMeeting: history.lastMeeting,
          comparison,
          actionItemsFromLast: history.lastMeeting.actionItems || []
        };
      } catch (error) {
        console.error('AI comparison failed:', error);
      }
    }

    // Fallback: simple text comparison
    return {
      isFirstMeeting: false,
      previousMeeting: history.lastMeeting,
      comparison: this.simpleComparison(previousNotes, currentNotes),
      actionItemsFromLast: history.lastMeeting.actionItems || []
    };
  }

  /**
   * Simple text comparison fallback
   */
  simpleComparison(previousNotes, currentNotes) {
    const prevLines = previousNotes.split('\n').filter(line => line.trim());
    const currLines = currentNotes.split('\n').filter(line => line.trim());

    const newLines = currLines.filter(line => !prevLines.includes(line));
    const unchangedLines = currLines.filter(line => prevLines.includes(line));

    return `
### NEW This Week:
${newLines.slice(0, 5).map(line => `• ${line}`).join('\n') || '• No significant changes detected'}

### UNCHANGED:
${unchangedLines.slice(0, 5).map(line => `• ${line}`).join('\n') || '• No unchanged items'}

_Upgrade to Premium for AI-powered comparison with progress tracking!_
    `.trim();
  }

  /**
   * Get action items status from previous meeting
   */
  async checkActionItemsStatus(meetingHash) {
    const history = await this.getMeetingHistory(meetingHash);

    if (!history.lastMeeting || !history.lastMeeting.actionItems) {
      return {
        hasActionItems: false,
        items: []
      };
    }

    const actionItems = history.lastMeeting.actionItems;
    const daysSince = this.getDaysSince(history.lastMeeting.timestamp);

    return {
      hasActionItems: actionItems.length > 0,
      items: actionItems.map(item => ({
        ...item,
        daysSince,
        isOverdue: item.dueDate && new Date(item.dueDate) < new Date()
      })),
      totalCount: actionItems.length,
      daysSinceLastMeeting: daysSince
    };
  }

  /**
   * Parse tags from AI response
   */
  parseTags(tagsString) {
    if (!tagsString) return [];

    // Extract hashtags
    const hashtagRegex = /#[\w-]+/g;
    const matches = tagsString.match(hashtagRegex) || [];

    return matches.map(tag => tag.toLowerCase());
  }

  /**
   * Parse action items from AI response
   */
  parseActionItems(actionItemsString) {
    if (!actionItemsString) return [];

    const lines = actionItemsString.split('\n').filter(line => line.trim());
    const items = [];

    lines.forEach(line => {
      // Match patterns like: ☐ John: Deploy by Friday
      const checkboxMatch = line.match(/[☐✓-]\s*(.+?):\s*(.+?)(?:\s+by\s+(.+))?$/i);

      if (checkboxMatch) {
        const [, owner, task, dueDate] = checkboxMatch;
        items.push({
          owner: owner.trim(),
          task: task.trim(),
          dueDate: dueDate ? dueDate.trim() : null,
          completed: line.includes('✓')
        });
      } else if (line.includes(':')) {
        // Fallback: simple owner:task pattern
        const parts = line.split(':');
        if (parts.length >= 2) {
          items.push({
            owner: parts[0].trim().replace(/[☐✓-]/g, '').trim(),
            task: parts.slice(1).join(':').trim(),
            dueDate: null,
            completed: line.includes('✓')
          });
        }
      }
    });

    return items;
  }

  /**
   * Get days since a timestamp
   */
  getDaysSince(timestamp) {
    const then = new Date(timestamp);
    const now = new Date();
    const diffMs = now - then;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Get storage key for a meeting hash
   */
  getStorageKey(meetingHash) {
    return `${this.storageKey}_${meetingHash}`;
  }

  /**
   * Search meetings by tag
   */
  async searchByTag(tag) {
    const normalizedTag = tag.toLowerCase().startsWith('#') ? tag.toLowerCase() : `#${tag.toLowerCase()}`;

    // Get all recurring meetings
    const allKeys = await chrome.storage.local.get(null);
    const recurringMeetings = Object.entries(allKeys)
      .filter(([key]) => key.startsWith(this.storageKey))
      .map(([, data]) => data);

    // Search through history
    const results = [];
    recurringMeetings.forEach(meeting => {
      meeting.history.forEach(record => {
        if (record.tags && record.tags.includes(normalizedTag)) {
          results.push({
            ...record,
            meetingTitle: meeting.lastMeeting?.meetingInfo?.title || 'Untitled'
          });
        }
      });
    });

    // Sort by timestamp (newest first)
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return results;
  }

  /**
   * Get meeting analytics
   */
  async getMeetingAnalytics(timeRange = 'week') {
    const now = new Date();
    let cutoffDate;

    switch (timeRange) {
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get all meetings within time range
    const allKeys = await chrome.storage.local.get(null);
    const meetings = Object.entries(allKeys)
      .filter(([key]) => key.startsWith(this.storageKey))
      .map(([, data]) => data);

    const recentMeetings = [];
    const tagCounts = {};
    let totalActionItems = 0;
    let completedActionItems = 0;

    meetings.forEach(meeting => {
      meeting.history.forEach(record => {
        const recordDate = new Date(record.timestamp);
        if (recordDate >= cutoffDate) {
          recentMeetings.push(record);

          // Count tags
          if (record.tags) {
            record.tags.forEach(tag => {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
          }

          // Count action items
          if (record.actionItems) {
            totalActionItems += record.actionItems.length;
            completedActionItems += record.actionItems.filter(item => item.completed).length;
          }
        }
      });
    });

    // Sort tags by frequency
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    return {
      timeRange,
      totalMeetings: recentMeetings.length,
      totalActionItems,
      completedActionItems,
      completionRate: totalActionItems > 0 ? (completedActionItems / totalActionItems * 100).toFixed(1) : 0,
      topTags,
      avgMeetingsPerWeek: (recentMeetings.length / (this.getDaysSince(cutoffDate.toISOString()) / 7)).toFixed(1)
    };
  }

  /**
   * Generate meeting insights using AI
   */
  async generateInsights(timeRange = 'week') {
    if (!aiService || !aiService.apiKey) {
      throw new Error('AI service not configured');
    }

    const analytics = await this.getMeetingAnalytics(timeRange);

    // Get all meeting notes from the time range
    const allKeys = await chrome.storage.local.get(null);
    const meetings = Object.entries(allKeys)
      .filter(([key]) => key.startsWith(this.storageKey))
      .map(([, data]) => data);

    const cutoffDate = new Date(new Date().getTime() - (timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90) * 24 * 60 * 60 * 1000);

    const recentNotes = [];
    meetings.forEach(meeting => {
      meeting.history.forEach(record => {
        if (new Date(record.timestamp) >= cutoffDate) {
          recentNotes.push(`[${record.meetingInfo.title}] ${record.notes}`);
        }
      });
    });

    const combinedNotes = recentNotes.join('\n\n---\n\n');

    // Generate AI insights
    const insights = await aiService.generateMeetingInsights(combinedNotes);

    return {
      analytics,
      insights
    };
  }
}

// Export singleton instance
const recurringMeetingService = new RecurringMeetingService();
