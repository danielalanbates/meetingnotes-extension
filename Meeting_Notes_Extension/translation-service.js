/**
 * Multi-Language Translation Service
 * Translate meeting notes to 30+ languages using OpenAI
 */

class TranslationService {
  constructor() {
    this.supportedLanguages = {
      // European Languages
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'pl': 'Polish',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'da': 'Danish',
      'no': 'Norwegian',
      'fi': 'Finnish',

      // Asian Languages
      'zh': 'Chinese (Simplified)',
      'zh-TW': 'Chinese (Traditional)',
      'ja': 'Japanese',
      'ko': 'Korean',
      'hi': 'Hindi',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'id': 'Indonesian',
      'ms': 'Malay',
      'tl': 'Filipino',

      // Middle Eastern
      'ar': 'Arabic',
      'he': 'Hebrew',
      'tr': 'Turkish',
      'fa': 'Persian',

      // Other
      'uk': 'Ukrainian',
      'cs': 'Czech',
      'ro': 'Romanian',
      'el': 'Greek'
    };

    this.technicalTerms = [
      'API', 'OAuth', 'JWT', 'REST', 'GraphQL', 'SQL', 'NoSQL',
      'CI/CD', 'DevOps', 'HTTP', 'HTTPS', 'URL', 'JSON', 'XML',
      'Git', 'GitHub', 'Docker', 'Kubernetes', 'AWS', 'Azure',
      'CPU', 'RAM', 'SSD', 'GPU', 'UI', 'UX', 'CSS', 'HTML',
      'JavaScript', 'Python', 'React', 'Vue', 'Angular', 'Node.js',
      'frontend', 'backend', 'fullstack', 'database', 'server'
    ];
  }

  /**
   * Translate notes to target language
   */
  async translateNotes(notes, targetLanguage, options = {}) {
    const {
      preserveFormatting = true,
      preserveTechnicalTerms = true,
      sourceLanguage = 'auto' // Auto-detect source language
    } = options;

    if (!aiService || !aiService.apiKey) {
      throw new Error('AI service not configured. Please set your OpenAI API key.');
    }

    // Build translation prompt
    const prompt = this.buildTranslationPrompt(
      notes,
      targetLanguage,
      preserveFormatting,
      preserveTechnicalTerms,
      sourceLanguage
    );

    try {
      const response = await aiService.callOpenAI(
        prompt,
        {
          model: 'gpt-4o-mini',
          temperature: 0.3, // Low temperature for accurate translation
          max_tokens: 4000
        }
      );

      return response;
    } catch (error) {
      console.error('Translation failed:', error);
      throw new Error('Translation failed: ' + error.message);
    }
  }

  /**
   * Build translation prompt
   */
  buildTranslationPrompt(notes, targetLanguage, preserveFormatting, preserveTechnicalTerms, sourceLanguage) {
    const languageName = this.supportedLanguages[targetLanguage] || targetLanguage;

    let prompt = `Translate the following meeting notes to ${languageName}.\n\n`;

    if (preserveFormatting) {
      prompt += `IMPORTANT: Preserve all formatting including:\n`;
      prompt += `- Markdown headings (# ## ###)\n`;
      prompt += `- Bullet points and numbered lists\n`;
      prompt += `- Bold and italic text\n`;
      prompt += `- Line breaks and paragraph structure\n`;
      prompt += `- Checkboxes (☐ ✓)\n\n`;
    }

    if (preserveTechnicalTerms) {
      prompt += `Keep technical terms in English: ${this.technicalTerms.join(', ')}\n\n`;
    }

    if (sourceLanguage !== 'auto') {
      const sourceLangName = this.supportedLanguages[sourceLanguage] || sourceLanguage;
      prompt += `Source language: ${sourceLangName}\n\n`;
    }

    prompt += `Meeting Notes:\n\n${notes}\n\n`;
    prompt += `Translated Notes (in ${languageName}):`;

    return prompt;
  }

  /**
   * Detect language of text
   */
  async detectLanguage(text) {
    if (!aiService || !aiService.apiKey) {
      throw new Error('AI service not configured');
    }

    const prompt = `Detect the language of this text and return ONLY the ISO 639-1 language code (e.g., 'en', 'es', 'fr'):\n\n${text.substring(0, 500)}`;

    try {
      const response = await aiService.callOpenAI(
        prompt,
        {
          model: 'gpt-4o-mini',
          temperature: 0,
          max_tokens: 10
        }
      );

      const languageCode = response.trim().toLowerCase();

      return languageCode;
    } catch (error) {
      console.error('Language detection failed:', error);
      return 'unknown';
    }
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages() {
    return Object.entries(this.supportedLanguages).map(([code, name]) => ({
      code,
      name
    }));
  }

  /**
   * Get language name by code
   */
  getLanguageName(code) {
    return this.supportedLanguages[code] || code;
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(code) {
    return code in this.supportedLanguages;
  }

  /**
   * Translate to multiple languages at once
   */
  async translateToMultipleLanguages(notes, targetLanguages, options = {}) {
    const translations = {};

    for (const lang of targetLanguages) {
      try {
        translations[lang] = await this.translateNotes(notes, lang, options);
      } catch (error) {
        console.error(`Translation to ${lang} failed:`, error);
        translations[lang] = {
          error: error.message
        };
      }
    }

    return translations;
  }

  /**
   * Save translation preferences
   */
  async savePreferences(preferences) {
    await chrome.storage.local.set({
      translation_preferences: preferences
    });
  }

  /**
   * Get translation preferences
   */
  async getPreferences() {
    const result = await chrome.storage.local.get('translation_preferences');
    return result.translation_preferences || {
      defaultTargetLanguage: 'es',
      preserveFormatting: true,
      preserveTechnicalTerms: true
    };
  }

  /**
   * Get translation history
   */
  async getTranslationHistory() {
    const result = await chrome.storage.local.get('translation_history');
    return result.translation_history || [];
  }

  /**
   * Save translation to history
   */
  async saveToHistory(originalNotes, translatedNotes, sourceLanguage, targetLanguage) {
    const history = await this.getTranslationHistory();

    const entry = {
      id: Date.now().toString(),
      originalNotes: originalNotes.substring(0, 500), // Save snippet
      translatedNotes: translatedNotes.substring(0, 500),
      sourceLanguage,
      targetLanguage,
      timestamp: new Date().toISOString()
    };

    history.unshift(entry);

    // Keep last 50 translations
    const trimmed = history.slice(0, 50);

    await chrome.storage.local.set({
      translation_history: trimmed
    });
  }

  /**
   * Real-time translation (for typing)
   */
  async translateRealTime(text, targetLanguage, debounceMs = 1000) {
    // Debounce logic for real-time translation
    if (this.translationTimeout) {
      clearTimeout(this.translationTimeout);
    }

    return new Promise((resolve, reject) => {
      this.translationTimeout = setTimeout(async () => {
        try {
          const translated = await this.translateNotes(text, targetLanguage, {
            preserveFormatting: true,
            preserveTechnicalTerms: true
          });
          resolve(translated);
        } catch (error) {
          reject(error);
        }
      }, debounceMs);
    });
  }

  /**
   * Get popular language pairs
   */
  getPopularLanguagePairs() {
    return [
      { source: 'en', target: 'es', label: 'English → Spanish' },
      { source: 'en', target: 'fr', label: 'English → French' },
      { source: 'en', target: 'de', label: 'English → German' },
      { source: 'en', target: 'zh', label: 'English → Chinese' },
      { source: 'en', target: 'ja', label: 'English → Japanese' },
      { source: 'en', target: 'ko', label: 'English → Korean' },
      { source: 'en', target: 'pt', label: 'English → Portuguese' },
      { source: 'en', target: 'ru', label: 'English → Russian' },
      { source: 'en', target: 'ar', label: 'English → Arabic' },
      { source: 'en', target: 'hi', label: 'English → Hindi' }
    ];
  }

  /**
   * Estimate translation cost
   */
  estimateCost(textLength, targetLanguages = 1) {
    // Rough estimate: ~$0.0005 per 500 characters with gpt-4o-mini
    const charactersPerRequest = textLength;
    const costPerRequest = (charactersPerRequest / 500) * 0.0005;
    const totalCost = costPerRequest * targetLanguages;

    return {
      costPerLanguage: costPerRequest,
      totalCost,
      characterCount: textLength,
      languageCount: targetLanguages
    };
  }

  /**
   * Format translation for email
   */
  formatTranslationForEmail(originalNotes, translatedNotes, sourceLanguage, targetLanguage) {
    const sourceLangName = this.getLanguageName(sourceLanguage);
    const targetLangName = this.getLanguageName(targetLanguage);

    return `
<h2>Meeting Notes (Translated)</h2>
<p><strong>Original Language:</strong> ${sourceLangName}</p>
<p><strong>Translated to:</strong> ${targetLangName}</p>

<hr>

<h3>${targetLangName} Translation:</h3>
${translatedNotes}

<hr>

<h3>Original (${sourceLangName}):</h3>
${originalNotes}

<p><em>Translated using MeetingNotes Extension</em></p>
    `.trim();
  }
}

// Export singleton instance
const translationService = new TranslationService();
