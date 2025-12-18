/**
 * Meeting Series Tracking Service
 * Track and link related meetings in a series (e.g., "Q1 Planning" series)
 */

class MeetingSeriesTrackerService {
  constructor() {
    this.storageKey = 'meeting_series';
  }

  /**
   * Create a new meeting series
   */
  async createSeries(name, description = '', settings = {}) {
    const series = {
      id: this.generateSeriesId(),
      name,
      description,
      meetings: [],
      milestones: [],
      status: 'planned', // planned | in_progress | completed | archived
      createdAt: new Date().toISOString(),
      startDate: settings.startDate || null,
      endDate: settings.endDate || null,
      frequency: settings.frequency || 'weekly', // daily | weekly | biweekly | monthly
      tags: settings.tags || [],
      participants: settings.participants || []
    };

    await this.saveSeries(series);

    return series;
  }

  /**
   * Get all series
   */
  async getAllSeries() {
    const result = await chrome.storage.local.get(this.storageKey);
    return result[this.storageKey] || [];
  }

  /**
   * Get series by ID
   */
  async getSeriesById(seriesId) {
    const allSeries = await this.getAllSeries();
    return allSeries.find(s => s.id === seriesId);
  }

  /**
   * Save/update series
   */
  async saveSeries(series) {
    const allSeries = await this.getAllSeries();
    const existingIndex = allSeries.findIndex(s => s.id === series.id);

    if (existingIndex >= 0) {
      allSeries[existingIndex] = series;
    } else {
      allSeries.push(series);
    }

    await chrome.storage.local.set({
      [this.storageKey]: allSeries
    });

    return series;
  }

  /**
   * Delete series
   */
  async deleteSeries(seriesId) {
    const allSeries = await this.getAllSeries();
    const filtered = allSeries.filter(s => s.id !== seriesId);

    await chrome.storage.local.set({
      [this.storageKey]: filtered
    });
  }

  /**
   * Add meeting to series
   */
  async addMeetingToSeries(seriesId, meetingData) {
    const series = await this.getSeriesById(seriesId);

    if (!series) {
      throw new Error('Series not found');
    }

    const meeting = {
      id: this.generateMeetingId(),
      title: meetingData.title,
      date: meetingData.date || new Date().toISOString(),
      notes: meetingData.notes || '',
      notesId: meetingData.notesId || null, // Link to saved notes in history
      duration: meetingData.duration || null,
      attendees: meetingData.attendees || [],
      actionItems: meetingData.actionItems || [],
      tags: meetingData.tags || [],
      sequenceNumber: series.meetings.length + 1 // 1st, 2nd, 3rd meeting, etc.
    };

    series.meetings.push(meeting);

    // Update series status
    if (series.status === 'planned') {
      series.status = 'in_progress';
    }

    // Update startDate if first meeting
    if (series.meetings.length === 1) {
      series.startDate = meeting.date;
    }

    await this.saveSeries(series);

    return meeting;
  }

  /**
   * Remove meeting from series
   */
  async removeMeetingFromSeries(seriesId, meetingId) {
    const series = await this.getSeriesById(seriesId);

    if (!series) {
      throw new Error('Series not found');
    }

    series.meetings = series.meetings.filter(m => m.id !== meetingId);

    // Recalculate sequence numbers
    series.meetings.forEach((meeting, index) => {
      meeting.sequenceNumber = index + 1;
    });

    await this.saveSeries(series);
  }

  /**
   * Update meeting in series
   */
  async updateMeetingInSeries(seriesId, meetingId, updates) {
    const series = await this.getSeriesById(seriesId);

    if (!series) {
      throw new Error('Series not found');
    }

    const meetingIndex = series.meetings.findIndex(m => m.id === meetingId);

    if (meetingIndex < 0) {
      throw new Error('Meeting not found in series');
    }

    series.meetings[meetingIndex] = {
      ...series.meetings[meetingIndex],
      ...updates
    };

    await this.saveSeries(series);

    return series.meetings[meetingIndex];
  }

  /**
   * Add milestone to series
   */
  async addMilestone(seriesId, milestone) {
    const series = await this.getSeriesById(seriesId);

    if (!series) {
      throw new Error('Series not found');
    }

    const newMilestone = {
      id: this.generateMilestoneId(),
      title: milestone.title,
      description: milestone.description || '',
      targetDate: milestone.targetDate || null,
      completedDate: milestone.completedDate || null,
      completed: milestone.completed || false,
      relatedMeetingId: milestone.relatedMeetingId || null
    };

    series.milestones.push(newMilestone);

    await this.saveSeries(series);

    return newMilestone;
  }

  /**
   * Mark milestone as completed
   */
  async completeMilestone(seriesId, milestoneId) {
    const series = await this.getSeriesById(seriesId);

    if (!series) {
      throw new Error('Series not found');
    }

    const milestone = series.milestones.find(m => m.id === milestoneId);

    if (!milestone) {
      throw new Error('Milestone not found');
    }

    milestone.completed = true;
    milestone.completedDate = new Date().toISOString();

    await this.saveSeries(series);

    return milestone;
  }

  /**
   * Get series progress
   */
  getSeriesProgress(series) {
    const totalMeetings = series.meetings.length;
    const totalMilestones = series.milestones.length;
    const completedMilestones = series.milestones.filter(m => m.completed).length;

    // Calculate action items progress
    const allActionItems = series.meetings.flatMap(m => m.actionItems || []);
    const completedActionItems = allActionItems.filter(item => item.completed).length;

    return {
      totalMeetings,
      totalMilestones,
      completedMilestones,
      milestonesProgress: totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0,
      totalActionItems: allActionItems.length,
      completedActionItems,
      actionItemsProgress: allActionItems.length > 0 ? (completedActionItems / allActionItems.length) * 100 : 0
    };
  }

  /**
   * Get series timeline
   */
  getSeriesTimeline(series) {
    const events = [];

    // Add meetings as events
    series.meetings.forEach(meeting => {
      events.push({
        type: 'meeting',
        id: meeting.id,
        title: meeting.title,
        date: meeting.date,
        sequenceNumber: meeting.sequenceNumber
      });
    });

    // Add milestones as events
    series.milestones.forEach(milestone => {
      events.push({
        type: 'milestone',
        id: milestone.id,
        title: milestone.title,
        date: milestone.targetDate || milestone.completedDate,
        completed: milestone.completed
      });
    });

    // Sort by date
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    return events;
  }

  /**
   * Export series as document
   */
  async exportSeries(seriesId, format = 'markdown') {
    const series = await this.getSeriesById(seriesId);

    if (!series) {
      throw new Error('Series not found');
    }

    if (format === 'markdown') {
      return this.exportAsMarkdown(series);
    } else if (format === 'html') {
      return this.exportAsHTML(series);
    } else if (format === 'json') {
      return JSON.stringify(series, null, 2);
    }

    throw new Error('Unsupported export format');
  }

  /**
   * Export series as Markdown
   */
  exportAsMarkdown(series) {
    const progress = this.getSeriesProgress(series);

    let markdown = `# ${series.name}\n\n`;

    if (series.description) {
      markdown += `${series.description}\n\n`;
    }

    markdown += `**Status**: ${series.status}\n`;
    markdown += `**Created**: ${new Date(series.createdAt).toLocaleDateString()}\n`;
    markdown += `**Total Meetings**: ${progress.totalMeetings}\n`;
    markdown += `**Milestones Progress**: ${progress.completedMilestones}/${progress.totalMilestones} (${Math.round(progress.milestonesProgress)}%)\n`;
    markdown += `**Action Items Progress**: ${progress.completedActionItems}/${progress.totalActionItems} (${Math.round(progress.actionItemsProgress)}%)\n\n`;

    markdown += `---\n\n`;

    // Meetings
    markdown += `## Meetings\n\n`;
    series.meetings.forEach(meeting => {
      markdown += `### ${meeting.sequenceNumber}. ${meeting.title}\n`;
      markdown += `**Date**: ${new Date(meeting.date).toLocaleDateString()}\n\n`;

      if (meeting.notes) {
        markdown += `${meeting.notes}\n\n`;
      }

      if (meeting.actionItems && meeting.actionItems.length > 0) {
        markdown += `**Action Items**:\n`;
        meeting.actionItems.forEach(item => {
          const checkbox = item.completed ? '✓' : '☐';
          markdown += `- ${checkbox} ${item.task} (${item.owner})\n`;
        });
        markdown += `\n`;
      }

      markdown += `---\n\n`;
    });

    // Milestones
    if (series.milestones.length > 0) {
      markdown += `## Milestones\n\n`;
      series.milestones.forEach(milestone => {
        const status = milestone.completed ? '✓ COMPLETED' : '☐ PENDING';
        markdown += `- ${status} **${milestone.title}**\n`;

        if (milestone.description) {
          markdown += `  ${milestone.description}\n`;
        }

        if (milestone.targetDate) {
          markdown += `  Target: ${new Date(milestone.targetDate).toLocaleDateString()}\n`;
        }

        if (milestone.completedDate) {
          markdown += `  Completed: ${new Date(milestone.completedDate).toLocaleDateString()}\n`;
        }

        markdown += `\n`;
      });
    }

    return markdown;
  }

  /**
   * Export series as HTML
   */
  exportAsHTML(series) {
    const markdown = this.exportAsMarkdown(series);

    // Convert markdown to HTML (basic conversion)
    let html = markdown
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*?)$/gm, '<li>$1</li>')
      .replace(/---/g, '<hr>')
      .replace(/\n\n/g, '<p></p>');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${series.name}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #4A90E2; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    h3 { color: #666; }
    hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
    li { margin: 5px 0; }
  </style>
</head>
<body>
  ${html}
</body>
</html>
    `.trim();
  }

  /**
   * Suggest series based on recurring meetings
   */
  async suggestSeriesFromRecurringMeetings() {
    // Get recurring meetings from recurring-meeting service
    const recurringMeetings = await recurringMeetingService.getAllRecurringMeetings();

    const suggestions = [];

    recurringMeetings.forEach(meeting => {
      if (meeting.totalMeetings >= 3) {
        suggestions.push({
          suggestedName: meeting.lastMeeting.meetingInfo.title || 'Untitled Series',
          meetingHash: meeting.hash,
          totalMeetings: meeting.totalMeetings,
          firstMeeting: meeting.firstMeeting,
          lastMeeting: meeting.lastMeeting.timestamp,
          frequency: this.detectFrequency(meeting.history)
        });
      }
    });

    return suggestions;
  }

  /**
   * Detect meeting frequency
   */
  detectFrequency(meetingHistory) {
    if (meetingHistory.length < 2) return 'unknown';

    const dates = meetingHistory.map(m => new Date(m.timestamp));
    const intervals = [];

    for (let i = 1; i < dates.length; i++) {
      const daysBetween = Math.floor((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
      intervals.push(daysBetween);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    if (avgInterval <= 2) return 'daily';
    if (avgInterval <= 8) return 'weekly';
    if (avgInterval <= 16) return 'biweekly';
    if (avgInterval <= 35) return 'monthly';

    return 'custom';
  }

  /**
   * Generate unique IDs
   */
  generateSeriesId() {
    return 'series_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generateMeetingId() {
    return 'meeting_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generateMilestoneId() {
    return 'milestone_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// Export singleton instance
const meetingSeriesTrackerService = new MeetingSeriesTrackerService();
