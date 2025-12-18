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
}

// Export singleton instance
const aiService = new AIService();
