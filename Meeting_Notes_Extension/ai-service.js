// AI Service for Premium Features
// Uses OpenAI API for AI-powered note processing

class AIService {
  constructor() {
    this.apiKey = null;
    this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
    this.model = 'gpt-4o-mini'; // Cost-effective model
  }

  /**
   * Initialize AI service with API key
   */
  async initialize() {
    const result = await chrome.storage.local.get(['openai_api_key']);
    this.apiKey = result.openai_api_key;
    return !!this.apiKey;
  }

  /**
   * Save API key to storage
   */
  async saveApiKey(apiKey) {
    await chrome.storage.local.set({ openai_api_key: apiKey });
    this.apiKey = apiKey;
  }

  /**
   * Make API call to OpenAI
   */
  async callOpenAI(messages, temperature = 0.7) {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API call failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * AI Feature 1: Summarize meeting notes
   */
  async summarizeNotes(notes) {
    const messages = [
      {
        role: 'system',
        content: 'You are a professional meeting notes summarizer. Create concise, clear summaries that capture the key points, decisions, and outcomes of meetings.'
      },
      {
        role: 'user',
        content: `Please summarize these meeting notes into 3-5 key bullet points:\n\n${notes}`
      }
    ];

    return await this.callOpenAI(messages, 0.5);
  }

  /**
   * AI Feature 2: Extract action items
   */
  async extractActionItems(notes) {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert at identifying action items from meeting notes. Extract clear, actionable tasks with owners and deadlines when mentioned.'
      },
      {
        role: 'user',
        content: `Extract all action items from these meeting notes. Format as a checklist:\n\n${notes}`
      }
    ];

    return await this.callOpenAI(messages, 0.3);
  }

  /**
   * AI Feature 3: Format notes professionally
   */
  async formatNotes(notes) {
    const messages = [
      {
        role: 'system',
        content: 'You are a professional document formatter. Transform raw meeting notes into well-structured, professionally formatted documents with clear headings, sections, and bullet points.'
      },
      {
        role: 'user',
        content: `Format these meeting notes professionally with clear sections, headings, and structure:\n\n${notes}`
      }
    ];

    return await this.callOpenAI(messages, 0.4);
  }

  /**
   * AI Feature 4: Generate follow-up email
   */
  async generateFollowUpEmail(notes) {
    const messages = [
      {
        role: 'system',
        content: 'You are a professional business communication expert. Write clear, concise follow-up emails that summarize meeting outcomes and next steps.'
      },
      {
        role: 'user',
        content: `Write a professional follow-up email based on these meeting notes:\n\n${notes}\n\nInclude: greeting, summary, action items, and closing.`
      }
    ];

    return await this.callOpenAI(messages, 0.6);
  }

  /**
   * AI Feature 5: Format voice transcript into structured notes
   */
  async formatVoiceTranscript(transcript) {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert at formatting voice transcriptions into clear, structured notes. Detect intent (action items, decisions, notes) and format accordingly. Use proper capitalization, punctuation, and formatting.'
      },
      {
        role: 'user',
        content: `Format this voice transcript into clear notes:\n\n${transcript}\n\nIf it mentions "action item", format as: ☐ [Owner]: [Task]\nIf it's a decision, format as: ✓ Decision: [text]\nOtherwise, format as clear bullet points.`
      }
    ];

    return await this.callOpenAI(messages, 0.4);
  }

  /**
   * AI Feature 6: Detect meeting type from title and context
   */
  async detectMeetingType(title, attendeeCount, timeOfDay, description = '') {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert at categorizing meetings. Return ONLY one of these exact types: standup, 1on1, sprint-planning, retrospective, client-call, all-hands, general'
      },
      {
        role: 'user',
        content: `Meeting Title: ${title}\nAttendees: ${attendeeCount}\nTime: ${timeOfDay}\nDescription: ${description}\n\nWhat type of meeting is this?`
      }
    ];

    const result = await this.callOpenAI(messages, 0.2);
    return result.trim().toLowerCase();
  }

  /**
   * AI Feature 7: Auto-tag meeting notes with topics
   */
  async extractTags(notes) {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert at extracting key topics and themes from text. Return 3-7 relevant hashtags (e.g., #budget, #hiring, #Q1-goals). Be specific and relevant.'
      },
      {
        role: 'user',
        content: `Extract key topics as hashtags from these meeting notes:\n\n${notes}`
      }
    ];

    return await this.callOpenAI(messages, 0.3);
  }

  /**
   * AI Feature 8: Compare recurring meetings and show changes
   */
  async compareRecurringMeetings(previousNotes, currentNotes) {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert at comparing meeting notes to identify changes, progress, and persistent issues. Create a clear summary showing what changed, what progressed, and what remains unchanged.'
      },
      {
        role: 'user',
        content: `Previous Meeting:\n${previousNotes}\n\nCurrent Meeting:\n${currentNotes}\n\nSummarize: NEW this week, UNCHANGED issues, PROGRESS made.`
      }
    ];

    return await this.callOpenAI(messages, 0.5);
  }

  /**
   * AI Feature 9: Translate notes to another language
   */
  async translateNotes(notes, targetLanguage) {
    const messages = [
      {
        role: 'system',
        content: `You are a professional translator. Translate meeting notes to ${targetLanguage} while preserving formatting, structure, and tone.`
      },
      {
        role: 'user',
        content: `Translate these meeting notes to ${targetLanguage}:\n\n${notes}`
      }
    ];

    return await this.callOpenAI(messages, 0.3);
  }

  /**
   * AI Feature 10: Generate meeting insights and analytics
   */
  async generateMeetingInsights(allMeetingNotes) {
    const messages = [
      {
        role: 'system',
        content: 'You are a meeting analytics expert. Analyze patterns, recurring themes, productivity indicators, and provide actionable insights.'
      },
      {
        role: 'user',
        content: `Analyze these meeting notes and provide insights about:\n- Common topics\n- Action item completion trends\n- Meeting effectiveness\n- Recommendations\n\nNotes:\n${allMeetingNotes}`
      }
    ];

    return await this.callOpenAI(messages, 0.6);
  }
}

// Export singleton instance
const aiService = new AIService();
