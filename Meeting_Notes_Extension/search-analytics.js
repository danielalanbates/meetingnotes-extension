// Search and Analytics Service
// Provides search functionality and meeting analytics

class SearchAnalyticsService {
  constructor() {
    this.historyKey = 'notes_history';
  }

  /**
   * Search notes by text query
   */
  async searchNotes(query, options = {}) {
    const {
      caseSensitive = false,
      searchIn = ['title', 'notes', 'tags'], // What fields to search
      limit = 50
    } = options;

    const history = await this.getAllNotes();
    const searchQuery = caseSensitive ? query : query.toLowerCase();

    const results = history.filter(note => {
      // Search in title
      if (searchIn.includes('title') && note.title) {
        const title = caseSensitive ? note.title : note.title.toLowerCase();
        if (title.includes(searchQuery)) return true;
      }

      // Search in notes content
      if (searchIn.includes('notes') && note.notes) {
        const notes = caseSensitive ? note.notes : note.notes.toLowerCase();
        if (notes.includes(searchQuery)) return true;
      }

      // Search in tags
      if (searchIn.includes('tags') && note.tags) {
        const tagsMatch = note.tags.some(tag => {
          const tagText = caseSensitive ? tag : tag.toLowerCase();
          return tagText.includes(searchQuery);
        });
        if (tagsMatch) return true;
      }

      return false;
    });

    // Sort by relevance (most recent first)
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return results.slice(0, limit);
  }

  /**
   * Search by tag
   */
  async searchByTag(tag) {
    const normalizedTag = tag.toLowerCase().startsWith('#')
      ? tag.toLowerCase()
      : `#${tag.toLowerCase()}`;

    const history = await this.getAllNotes();

    return history.filter(note =>
      note.tags && note.tags.some(t => t.toLowerCase() === normalizedTag)
    );
  }

  /**
   * Search by platform
   */
  async searchByPlatform(platform) {
    const history = await this.getAllNotes();
    return history.filter(note => note.platform === platform);
  }

  /**
   * Search by date range
   */
  async searchByDateRange(startDate, endDate) {
    const history = await this.getAllNotes();
    const start = new Date(startDate);
    const end = new Date(endDate);

    return history.filter(note => {
      const noteDate = new Date(note.timestamp);
      return noteDate >= start && noteDate <= end;
    });
  }

  /**
   * Search by template type
   */
  async searchByTemplate(template) {
    const history = await this.getAllNotes();
    return history.filter(note => note.template === template);
  }

  /**
   * Get all notes from history
   */
  async getAllNotes() {
    const result = await chrome.storage.local.get(this.historyKey);
    return result[this.historyKey] || [];
  }

  /**
   * Get meeting analytics
   */
  async getMeetingAnalytics(timeRange = 'week') {
    const history = await this.getAllNotes();
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
      case 'year':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const filteredNotes = history.filter(note =>
      new Date(note.timestamp) >= cutoffDate
    );

    // Platform distribution
    const platformCount = {};
    filteredNotes.forEach(note => {
      platformCount[note.platform] = (platformCount[note.platform] || 0) + 1;
    });

    // Template usage
    const templateCount = {};
    filteredNotes.forEach(note => {
      if (note.template) {
        templateCount[note.template] = (templateCount[note.template] || 0) + 1;
      }
    });

    // Tag frequency
    const tagCount = {};
    filteredNotes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
    });

    // Sort tags by frequency
    const topTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Calculate average notes length
    const totalLength = filteredNotes.reduce((sum, note) =>
      sum + (note.notes?.length || 0), 0
    );
    const avgLength = filteredNotes.length > 0
      ? Math.round(totalLength / filteredNotes.length)
      : 0;

    // Meetings by day of week
    const dayOfWeekCount = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0
    };

    filteredNotes.forEach(note => {
      const date = new Date(note.timestamp);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      dayOfWeekCount[dayName]++;
    });

    // Find busiest day
    const busiestDay = Object.entries(dayOfWeekCount)
      .sort((a, b) => b[1] - a[1])[0];

    // Meetings by hour of day
    const hourCount = new Array(24).fill(0);
    filteredNotes.forEach(note => {
      const hour = new Date(note.timestamp).getHours();
      hourCount[hour]++;
    });

    // Find busiest hour
    const busiestHour = hourCount.reduce((maxIdx, val, idx, arr) =>
      val > arr[maxIdx] ? idx : maxIdx, 0
    );

    return {
      timeRange,
      totalMeetings: filteredNotes.length,
      avgMeetingsPerWeek: this.calculateAvgPerWeek(filteredNotes, cutoffDate),
      platforms: platformCount,
      templates: templateCount,
      topTags,
      avgNotesLength: avgLength,
      dayOfWeekDistribution: dayOfWeekCount,
      busiestDay: { day: busiestDay[0], count: busiestDay[1] },
      hourDistribution: hourCount,
      busiestHour: { hour: busiestHour, count: hourCount[busiestHour] }
    };
  }

  /**
   * Calculate average meetings per week
   */
  calculateAvgPerWeek(notes, cutoffDate) {
    if (notes.length === 0) return 0;

    const now = new Date();
    const diffMs = now - cutoffDate;
    const weeks = diffMs / (1000 * 60 * 60 * 24 * 7);

    return (notes.length / weeks).toFixed(1);
  }

  /**
   * Get productivity insights
   */
  async getProductivityInsights(timeRange = 'week') {
    const analytics = await this.getMeetingAnalytics(timeRange);
    const actionItemStats = await actionItemsService.getStatistics(timeRange);

    const insights = [];

    // Meeting frequency insight
    if (analytics.avgMeetingsPerWeek > 20) {
      insights.push({
        type: 'warning',
        category: 'meeting-load',
        message: `You're averaging ${analytics.avgMeetingsPerWeek} meetings per week. Consider consolidating some meetings.`,
        priority: 'high'
      });
    } else if (analytics.avgMeetingsPerWeek < 5) {
      insights.push({
        type: 'info',
        category: 'meeting-load',
        message: `Light meeting week! You're averaging ${analytics.avgMeetingsPerWeek} meetings per week.`,
        priority: 'low'
      });
    }

    // Action item completion insight
    if (actionItemStats.completionRate < 50) {
      insights.push({
        type: 'warning',
        category: 'action-items',
        message: `Only ${actionItemStats.completionRate}% of action items completed. Focus on follow-through.`,
        priority: 'high'
      });
    } else if (actionItemStats.completionRate > 80) {
      insights.push({
        type: 'success',
        category: 'action-items',
        message: `Excellent! ${actionItemStats.completionRate}% action item completion rate.`,
        priority: 'low'
      });
    }

    // Overdue action items
    if (actionItemStats.overdue > 0) {
      insights.push({
        type: 'error',
        category: 'overdue',
        message: `You have ${actionItemStats.overdue} overdue action item(s). Review and update priorities.`,
        priority: 'critical'
      });
    }

    // Busiest day insight
    if (analytics.busiestDay.count > analytics.totalMeetings * 0.3) {
      insights.push({
        type: 'info',
        category: 'schedule',
        message: `${analytics.busiestDay.day} is your busiest meeting day (${analytics.busiestDay.count} meetings).`,
        priority: 'medium'
      });
    }

    // Meeting time insight
    if (analytics.busiestHour < 9 || analytics.busiestHour > 17) {
      insights.push({
        type: 'warning',
        category: 'work-life-balance',
        message: `Most meetings happen at ${this.formatHour(analytics.busiestHour)}. Consider adjusting meeting times.`,
        priority: 'medium'
      });
    }

    // Tag insights
    if (analytics.topTags.length > 0) {
      const topTag = analytics.topTags[0];
      insights.push({
        type: 'info',
        category: 'topics',
        message: `Top meeting topic: ${topTag.tag} (${topTag.count} mentions)`,
        priority: 'low'
      });
    }

    return insights;
  }

  /**
   * Format hour for display
   */
  formatHour(hour) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  }

  /**
   * Generate insights using AI (premium feature)
   */
  async generateAIInsights(timeRange = 'week') {
    if (!aiService || !aiService.apiKey) {
      throw new Error('AI service not configured');
    }

    const analytics = await this.getMeetingAnalytics(timeRange);
    const actionItemStats = await actionItemsService.getStatistics(timeRange);
    const history = await this.getAllNotes();

    // Get recent notes
    const cutoffDate = this.getCutoffDate(timeRange);
    const recentNotes = history
      .filter(note => new Date(note.timestamp) >= cutoffDate)
      .map(note => note.notes)
      .join('\n\n---\n\n');

    // Combine analytics data for AI
    const analyticsText = `
Meeting Statistics:
- Total meetings: ${analytics.totalMeetings}
- Average per week: ${analytics.avgMeetingsPerWeek}
- Busiest day: ${analytics.busiestDay.day} (${analytics.busiestDay.count} meetings)
- Top platform: ${Object.keys(analytics.platforms)[0]}

Action Items:
- Total: ${actionItemStats.total}
- Completed: ${actionItemStats.completed}
- Pending: ${actionItemStats.pending}
- Overdue: ${actionItemStats.overdue}
- Completion rate: ${actionItemStats.completionRate}%

Recent Meeting Notes:
${recentNotes}
    `;

    const insights = await aiService.generateMeetingInsights(analyticsText);

    return {
      aiInsights: insights,
      analytics,
      actionItemStats
    };
  }

  /**
   * Get cutoff date for time range
   */
  getCutoffDate(timeRange) {
    const now = new Date();

    switch (timeRange) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Export analytics as CSV
   */
  async exportAnalyticsCSV(timeRange = 'week') {
    const analytics = await this.getMeetingAnalytics(timeRange);
    const actionItemStats = await actionItemsService.getStatistics(timeRange);

    const csv = [];

    // Header
    csv.push('MeetingNotes Analytics Report');
    csv.push(`Time Range: ${timeRange}`);
    csv.push(`Generated: ${new Date().toLocaleDateString()}`);
    csv.push('');

    // Meeting stats
    csv.push('Meeting Statistics');
    csv.push('Metric,Value');
    csv.push(`Total Meetings,${analytics.totalMeetings}`);
    csv.push(`Avg Meetings/Week,${analytics.avgMeetingsPerWeek}`);
    csv.push(`Busiest Day,${analytics.busiestDay.day}`);
    csv.push(`Busiest Hour,${this.formatHour(analytics.busiestHour.hour)}`);
    csv.push('');

    // Platform distribution
    csv.push('Platform Distribution');
    csv.push('Platform,Count');
    Object.entries(analytics.platforms).forEach(([platform, count]) => {
      csv.push(`${platform},${count}`);
    });
    csv.push('');

    // Action items
    csv.push('Action Items');
    csv.push('Metric,Value');
    csv.push(`Total,${actionItemStats.total}`);
    csv.push(`Completed,${actionItemStats.completed}`);
    csv.push(`Pending,${actionItemStats.pending}`);
    csv.push(`Overdue,${actionItemStats.overdue}`);
    csv.push(`Completion Rate,${actionItemStats.completionRate}%`);

    return csv.join('\n');
  }
}

// Export singleton instance
const searchAnalyticsService = new SearchAnalyticsService();
