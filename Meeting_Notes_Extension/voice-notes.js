// Voice-to-Text Notes Feature
// Uses Web Speech API for real-time transcription

class VoiceNotesService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isPaused = false;
    this.transcript = '';
    this.interimTranscript = '';
    this.onTranscriptCallback = null;
    this.onStatusChangeCallback = null;
    this.initRecognition();
  }

  /**
   * Initialize Web Speech API
   */
  initRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Web Speech API not supported in this browser');
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    // Configuration
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    // Event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      this.notifyStatusChange('listening');
      console.log('Voice recognition started');
    };

    this.recognition.onend = () => {
      // Auto-restart if not manually stopped
      if (this.isListening && !this.isPaused) {
        this.recognition.start();
      } else {
        this.isListening = false;
        this.notifyStatusChange('stopped');
        console.log('Voice recognition ended');
      }
    };

    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (final) {
        this.transcript += final;
        this.notifyTranscript(final, 'final');
      }

      if (interim) {
        this.interimTranscript = interim;
        this.notifyTranscript(interim, 'interim');
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);

      if (event.error === 'no-speech') {
        // No speech detected, keep listening
        return;
      }

      if (event.error === 'aborted') {
        // Aborted, might be user action
        this.isListening = false;
        this.notifyStatusChange('stopped');
      }

      this.notifyStatusChange('error', event.error);
    };

    return true;
  }

  /**
   * Start voice recognition
   */
  start() {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported');
    }

    if (this.isListening) {
      console.warn('Already listening');
      return;
    }

    try {
      this.transcript = '';
      this.interimTranscript = '';
      this.isPaused = false;
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      throw error;
    }
  }

  /**
   * Stop voice recognition
   */
  stop() {
    if (!this.recognition || !this.isListening) {
      return;
    }

    this.isPaused = true;
    this.isListening = false;
    this.recognition.stop();
    this.notifyStatusChange('stopped');
  }

  /**
   * Pause voice recognition temporarily
   */
  pause() {
    if (!this.recognition || !this.isListening) {
      return;
    }

    this.isPaused = true;
    this.recognition.stop();
    this.notifyStatusChange('paused');
  }

  /**
   * Resume voice recognition
   */
  resume() {
    if (!this.recognition || this.isListening) {
      return;
    }

    this.isPaused = false;
    this.isListening = true;
    this.recognition.start();
    this.notifyStatusChange('listening');
  }

  /**
   * Get current transcript
   */
  getTranscript() {
    return this.transcript;
  }

  /**
   * Clear transcript
   */
  clearTranscript() {
    this.transcript = '';
    this.interimTranscript = '';
  }

  /**
   * Set callback for transcript updates
   */
  onTranscript(callback) {
    this.onTranscriptCallback = callback;
  }

  /**
   * Set callback for status changes
   */
  onStatusChange(callback) {
    this.onStatusChangeCallback = callback;
  }

  /**
   * Notify transcript callback
   */
  notifyTranscript(text, type) {
    if (this.onTranscriptCallback) {
      this.onTranscriptCallback(text, type);
    }
  }

  /**
   * Notify status change callback
   */
  notifyStatusChange(status, error = null) {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(status, error);
    }
  }

  /**
   * Check if browser supports Web Speech API
   */
  static isSupported() {
    return ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
  }

  /**
   * Format transcript with AI (premium feature)
   */
  async formatWithAI(transcript) {
    if (!aiService || !aiService.apiKey) {
      throw new Error('AI service not configured');
    }

    return await aiService.formatVoiceTranscript(transcript);
  }
}

// Export singleton instance
const voiceNotesService = new VoiceNotesService();
