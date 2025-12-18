// Action Item Tracking Service
// Track action items across meetings with reminders

class ActionItemsService {
  constructor() {
    this.storageKey = 'action_items';
    this.reminderKey = 'action_item_reminders';
  }

  /**
   * Extract and save action items from meeting notes
   */
  async extractAndSave(notes, meetingInfo) {
    if (!aiService || !aiService.apiKey) {
      // Fallback: simple extraction
      return this.simpleExtraction(notes, meetingInfo);
    }

    try {
      // Use AI to extract action items
      const actionItemsText = await aiService.extractActionItems(notes);
      const actionItems = this.parseActionItems(actionItemsText, meetingInfo);

      // Save to storage
      await this.saveActionItems(actionItems, meetingInfo);

      // Set up reminders
      await this.scheduleReminders(actionItems);

      return actionItems;
    } catch (error) {
      console.error('AI extraction failed, using fallback:', error);
      return this.simpleExtraction(notes, meetingInfo);
    }
  }

  /**
   * Parse action items from AI response
   */
  parseActionItems(actionItemsText, meetingInfo) {
    const lines = actionItemsText.split('\n').filter(line => line.trim());
    const items = [];

    lines.forEach(line => {
      // Match patterns like:
      // ☐ John: Deploy by Friday
      // - Sarah: Review PR by EOD
      // * Mike: Update docs
      const patterns = [
        /^[☐✓✗-*]\s*([^:]+):\s*(.+?)(?:\s+by\s+(.+))?$/i,
        /^([^:]+):\s*(.+?)(?:\s+by\s+(.+))?$/i
      ];

      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          const [, owner, task, dueDate] = match;

          const item = {
            id: this.generateId(),
            owner: owner.trim().replace(/[☐✓✗-*]/g, '').trim(),
            task: task.trim(),
            dueDate: dueDate ? this.parseDueDate(dueDate.trim()) : null,
            completed: line.includes('✓') || line.includes('✗'),
            createdAt: new Date().toISOString(),
            meetingInfo: {
              title: meetingInfo.title || 'Untitled Meeting',
              timestamp: meetingInfo.timestamp || new Date().toISOString(),
              url: meetingInfo.url || '',
              platform: meetingInfo.platform || 'unknown'
            }
          };

          items.push(item);
          break;
        }
      }
    });

    return items;
  }

  /**
   * Simple extraction fallback (without AI)
   */
  simpleExtraction(notes, meetingInfo) {
    const lines = notes.split('\n');
    const items = [];

    const actionKeywords = ['action', 'todo', 'task', 'follow up', 'followup'];

    lines.forEach(line => {
      const lowerLine = line.toLowerCase();

      // Check if line contains action keywords
      const hasActionKeyword = actionKeywords.some(keyword =>
        lowerLine.includes(keyword)
      );

      // Or starts with checkbox/bullet
      const hasCheckbox = /^[\s]*[☐✓✗-*]/.test(line);

      if (hasActionKeyword || hasCheckbox) {
        // Try to extract owner and task
        const ownerMatch = line.match(/([A-Z][a-z]+)\s*:/);
        const owner = ownerMatch ? ownerMatch[1] : 'Unassigned';

        const taskText = line
          .replace(/^[\s]*[☐✓✗-*]/, '')
          .replace(/([A-Z][a-z]+)\s*:/, '')
          .trim();

        if (taskText) {
          items.push({
            id: this.generateId(),
            owner,
            task: taskText,
            dueDate: null,
            completed: line.includes('✓') || line.includes('✗'),
            createdAt: new Date().toISOString(),
            meetingInfo: {
              title: meetingInfo.title || 'Untitled Meeting',
              timestamp: meetingInfo.timestamp || new Date().toISOString(),
              url: meetingInfo.url || '',
              platform: meetingInfo.platform || 'unknown'
            }
          });
        }
      }
    });

    return items;
  }

  /**
   * Save action items to storage
   */
  async saveActionItems(newItems, meetingInfo) {
    const existing = await this.getAllActionItems();

    // Add new items
    const allItems = [...newItems, ...existing];

    // Keep only last 500 items
    const trimmed = allItems.slice(0, 500);

    await chrome.storage.local.set({
      [this.storageKey]: trimmed
    });

    return trimmed;
  }

  /**
   * Get all action items
   */
  async getAllActionItems() {
    const result = await chrome.storage.local.get(this.storageKey);
    return result[this.storageKey] || [];
  }

  /**
   * Get pending action items
   */
  async getPendingActionItems() {
    const allItems = await this.getAllActionItems();
    return allItems.filter(item => !item.completed);
  }

  /**
   * Get overdue action items
   */
  async getOverdueActionItems() {
    const pending = await this.getPendingActionItems();
    const now = new Date();

    return pending.filter(item => {
      if (!item.dueDate) return false;
      return new Date(item.dueDate) < now;
    });
  }

  /**
   * Get action items due soon (within next 2 days)
   */
  async getActionItemsDueSoon() {
    const pending = await this.getPendingActionItems();
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    return pending.filter(item => {
      if (!item.dueDate) return false;
      const dueDate = new Date(item.dueDate);
      return dueDate >= now && dueDate <= twoDaysFromNow;
    });
  }

  /**
   * Mark action item as completed
   */
  async markCompleted(itemId) {
    const allItems = await this.getAllActionItems();

    const updatedItems = allItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          completed: true,
          completedAt: new Date().toISOString()
        };
      }
      return item;
    });

    await chrome.storage.local.set({
      [this.storageKey]: updatedItems
    });

    return updatedItems.find(item => item.id === itemId);
  }

  /**
   * Delete action item
   */
  async deleteActionItem(itemId) {
    const allItems = await this.getAllActionItems();
    const filtered = allItems.filter(item => item.id !== itemId);

    await chrome.storage.local.set({
      [this.storageKey]: filtered
    });
  }

  /**
   * Schedule reminders for action items
   */
  async scheduleReminders(actionItems) {
    const itemsWithDueDates = actionItems.filter(item =>
      item.dueDate && !item.completed
    );

    for (const item of itemsWithDueDates) {
      const dueDate = new Date(item.dueDate);
      const now = new Date();

      // Schedule reminder 1 day before due date
      const reminderDate = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000);

      if (reminderDate > now) {
        const delayMs = reminderDate.getTime() - now.getTime();

        // Chrome alarms API (more reliable than setTimeout for long delays)
        const alarmName = `action_item_reminder_${item.id}`;

        await chrome.alarms.create(alarmName, {
          when: reminderDate.getTime()
        });

        // Store reminder info
        await this.saveReminder(item.id, alarmName, reminderDate);
      }
    }
  }

  /**
   * Save reminder info
   */
  async saveReminder(itemId, alarmName, reminderDate) {
    const result = await chrome.storage.local.get(this.reminderKey);
    const reminders = result[this.reminderKey] || {};

    reminders[itemId] = {
      alarmName,
      reminderDate: reminderDate.toISOString(),
      sent: false
    };

    await chrome.storage.local.set({
      [this.reminderKey]: reminders
    });
  }

  /**
   * Handle alarm/reminder trigger
   */
  async handleReminder(alarmName) {
    // Find the action item for this alarm
    const result = await chrome.storage.local.get(this.reminderKey);
    const reminders = result[this.reminderKey] || {};

    const itemId = Object.keys(reminders).find(id =>
      reminders[id].alarmName === alarmName
    );

    if (!itemId) return;

    const allItems = await this.getAllActionItems();
    const item = allItems.find(i => i.id === itemId);

    if (!item || item.completed) {
      // Item completed or deleted, mark reminder as sent
      reminders[itemId].sent = true;
      await chrome.storage.local.set({ [this.reminderKey]: reminders });
      return;
    }

    // Send notification
    await this.sendReminderNotification(item);

    // Mark reminder as sent
    reminders[itemId].sent = true;
    await chrome.storage.local.set({ [this.reminderKey]: reminders });
  }

  /**
   * Send reminder notification
   */
  async sendReminderNotification(item) {
    const dueDate = item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'soon';

    await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Action Item Due Soon',
      message: `${item.owner}: ${item.task}\nDue: ${dueDate}`,
      buttons: [
        { title: 'Mark Complete' },
        { title: 'View Details' }
      ],
      requireInteraction: true
    });
  }

  /**
   * Parse due date from text
   */
  parseDueDate(dateText) {
    const lowerText = dateText.toLowerCase();
    const now = new Date();

    // Handle relative dates
    if (lowerText.includes('today') || lowerText.includes('eod')) {
      return new Date(now.setHours(17, 0, 0, 0)).toISOString();
    }

    if (lowerText.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(17, 0, 0, 0);
      return tomorrow.toISOString();
    }

    // Days of week
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = daysOfWeek.findIndex(day => lowerText.includes(day));

    if (dayIndex !== -1) {
      const targetDay = new Date(now);
      const currentDay = targetDay.getDay();
      const daysUntilTarget = (dayIndex - currentDay + 7) % 7 || 7;
      targetDay.setDate(targetDay.getDate() + daysUntilTarget);
      targetDay.setHours(17, 0, 0, 0);
      return targetDay.toISOString();
    }

    // Try to parse as date (MM/DD or MM-DD)
    const dateMatch = dateText.match(/(\d{1,2})[\/\-](\d{1,2})/);
    if (dateMatch) {
      const [, month, day] = dateMatch;
      const year = now.getFullYear();
      const parsed = new Date(year, parseInt(month) - 1, parseInt(day), 17, 0, 0, 0);

      // If date is in the past, assume next year
      if (parsed < now) {
        parsed.setFullYear(year + 1);
      }

      return parsed.toISOString();
    }

    // Fallback: try Date.parse
    try {
      const parsed = new Date(dateText);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    } catch (error) {
      console.error('Failed to parse date:', dateText);
    }

    // Default: 7 days from now
    const defaultDue = new Date(now);
    defaultDue.setDate(defaultDue.getDate() + 7);
    defaultDue.setHours(17, 0, 0, 0);
    return defaultDue.toISOString();
  }

  /**
   * Generate unique ID for action item
   */
  generateId() {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get completion statistics
   */
  async getStatistics(timeRange = 'week') {
    const allItems = await this.getAllActionItems();
    const now = new Date();

    let cutoffDate;
    switch (timeRange) {
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        cutoffDate = new Date(0); // Beginning of time
    }

    const filteredItems = allItems.filter(item =>
      new Date(item.createdAt) >= cutoffDate
    );

    const completed = filteredItems.filter(item => item.completed);
    const pending = filteredItems.filter(item => !item.completed);
    const overdue = pending.filter(item =>
      item.dueDate && new Date(item.dueDate) < now
    );

    // Group by owner
    const byOwner = {};
    filteredItems.forEach(item => {
      if (!byOwner[item.owner]) {
        byOwner[item.owner] = { total: 0, completed: 0, pending: 0, overdue: 0 };
      }

      byOwner[item.owner].total++;

      if (item.completed) {
        byOwner[item.owner].completed++;
      } else {
        byOwner[item.owner].pending++;
        if (item.dueDate && new Date(item.dueDate) < now) {
          byOwner[item.owner].overdue++;
        }
      }
    });

    return {
      timeRange,
      total: filteredItems.length,
      completed: completed.length,
      pending: pending.length,
      overdue: overdue.length,
      completionRate: filteredItems.length > 0
        ? (completed.length / filteredItems.length * 100).toFixed(1)
        : 0,
      byOwner
    };
  }
}

// Export singleton instance
const actionItemsService = new ActionItemsService();
