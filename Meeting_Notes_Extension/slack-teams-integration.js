/**
 * Slack & Microsoft Teams Integration Service
 * Post meeting notes directly to Slack channels and Teams channels
 */

class SlackTeamsIntegrationService {
  constructor() {
    this.slackTokenKey = 'slack_access_token';
    this.teamsTokenKey = 'teams_access_token';
    this.favoriteChannelsKey = 'favorite_channels';
  }

  // ======================
  // SLACK INTEGRATION
  // ======================

  /**
   * Authenticate with Slack workspace
   */
  async authenticateSlack() {
    // Slack OAuth flow
    const clientId = 'YOUR_SLACK_CLIENT_ID'; // User needs to configure this
    const scopes = ['chat:write', 'channels:read'];
    const redirectUri = chrome.identity.getRedirectURL('slack');

    const authUrl = `https://slack.com/oauth/v2/authorize?` +
      `client_id=${clientId}&` +
      `scope=${scopes.join(',')}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}`;

    try {
      const responseUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
      });

      const params = new URL(responseUrl).searchParams;
      const code = params.get('code');

      // Exchange code for access token (requires backend)
      // For now, store code and let user complete setup
      await chrome.storage.local.set({
        slack_auth_code: code
      });

      return true;
    } catch (error) {
      console.error('Slack authentication failed:', error);
      throw error;
    }
  }

  /**
   * Check if Slack is connected
   */
  async isSlackConnected() {
    const result = await chrome.storage.local.get(this.slackTokenKey);
    return !!result[this.slackTokenKey];
  }

  /**
   * Get list of Slack channels
   */
  async getSlackChannels() {
    const result = await chrome.storage.local.get(this.slackTokenKey);
    const token = result[this.slackTokenKey];

    if (!token) {
      throw new Error('Slack not connected');
    }

    try {
      const response = await fetch('https://slack.com/api/conversations.list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch channels');
      }

      return data.channels.map(channel => ({
        id: channel.id,
        name: channel.name,
        isPrivate: channel.is_private
      }));
    } catch (error) {
      console.error('Failed to get Slack channels:', error);
      throw error;
    }
  }

  /**
   * Post notes to Slack channel
   */
  async postToSlack(channelId, notes, meetingInfo = {}) {
    const result = await chrome.storage.local.get(this.slackTokenKey);
    const token = result[this.slackTokenKey];

    if (!token) {
      throw new Error('Slack not connected');
    }

    // Format notes as Slack markdown
    const slackMessage = this.formatForSlack(notes, meetingInfo);

    try {
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: channelId,
          text: slackMessage,
          unfurl_links: false,
          unfurl_media: false
        })
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to post to Slack');
      }

      return data;
    } catch (error) {
      console.error('Failed to post to Slack:', error);
      throw error;
    }
  }

  /**
   * Format notes for Slack markdown
   */
  formatForSlack(notes, meetingInfo) {
    const title = meetingInfo.title || 'Meeting Notes';
    const date = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });

    let message = `*${title}*\n`;
    message += `_${date}_\n\n`;

    // Convert HTML to Slack markdown
    message += notes
      .replace(/<h1>(.*?)<\/h1>/g, '*$1*\n')
      .replace(/<h2>(.*?)<\/h2>/g, '*$1*\n')
      .replace(/<h3>(.*?)<\/h3>/g, '*$1*\n')
      .replace(/<strong>(.*?)<\/strong>/g, '*$1*')
      .replace(/<em>(.*?)<\/em>/g, '_$1_')
      .replace(/<ul>/g, '')
      .replace(/<\/ul>/g, '')
      .replace(/<li>(.*?)<\/li>/g, '• $1\n')
      .replace(/<p>(.*?)<\/p>/g, '$1\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]+>/g, ''); // Remove remaining HTML tags

    message += `\n\n_Posted from MeetingNotes extension_`;

    return message;
  }

  /**
   * Disconnect Slack
   */
  async disconnectSlack() {
    await chrome.storage.local.remove([this.slackTokenKey, 'slack_auth_code']);
  }

  // ======================
  // MICROSOFT TEAMS INTEGRATION
  // ======================

  /**
   * Authenticate with Microsoft Teams
   */
  async authenticateTeams() {
    // Microsoft Graph API OAuth flow
    const clientId = 'YOUR_TEAMS_CLIENT_ID'; // User needs to configure this
    const scopes = ['ChannelMessage.Send', 'Channel.ReadBasic.All'];
    const redirectUri = chrome.identity.getRedirectURL('teams');

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes.join(' '))}`;

    try {
      const responseUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
      });

      const params = new URL(responseUrl).searchParams;
      const code = params.get('code');

      // Exchange code for access token (requires backend)
      await chrome.storage.local.set({
        teams_auth_code: code
      });

      return true;
    } catch (error) {
      console.error('Teams authentication failed:', error);
      throw error;
    }
  }

  /**
   * Check if Teams is connected
   */
  async isTeamsConnected() {
    const result = await chrome.storage.local.get(this.teamsTokenKey);
    return !!result[this.teamsTokenKey];
  }

  /**
   * Get list of Teams and their channels
   */
  async getTeamsChannels() {
    const result = await chrome.storage.local.get(this.teamsTokenKey);
    const token = result[this.teamsTokenKey];

    if (!token) {
      throw new Error('Teams not connected');
    }

    try {
      // Get list of joined teams
      const teamsResponse = await fetch('https://graph.microsoft.com/v1.0/me/joinedTeams', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const teamsData = await teamsResponse.json();

      if (!teamsData.value) {
        throw new Error('Failed to fetch teams');
      }

      // Get channels for each team
      const teamsWithChannels = await Promise.all(
        teamsData.value.map(async team => {
          const channelsResponse = await fetch(
            `https://graph.microsoft.com/v1.0/teams/${team.id}/channels`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          const channelsData = await channelsResponse.json();

          return {
            id: team.id,
            name: team.displayName,
            channels: channelsData.value ? channelsData.value.map(channel => ({
              id: channel.id,
              name: channel.displayName
            })) : []
          };
        })
      );

      return teamsWithChannels;
    } catch (error) {
      console.error('Failed to get Teams channels:', error);
      throw error;
    }
  }

  /**
   * Post notes to Teams channel
   */
  async postToTeams(teamId, channelId, notes, meetingInfo = {}) {
    const result = await chrome.storage.local.get(this.teamsTokenKey);
    const token = result[this.teamsTokenKey];

    if (!token) {
      throw new Error('Teams not connected');
    }

    // Create adaptive card for Teams
    const adaptiveCard = this.createTeamsAdaptiveCard(notes, meetingInfo);

    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            body: {
              contentType: 'html',
              content: adaptiveCard
            }
          })
        }
      );

      const data = await response.json();

      if (response.status !== 201) {
        throw new Error('Failed to post to Teams');
      }

      return data;
    } catch (error) {
      console.error('Failed to post to Teams:', error);
      throw error;
    }
  }

  /**
   * Create Teams adaptive card
   */
  createTeamsAdaptiveCard(notes, meetingInfo) {
    const title = meetingInfo.title || 'Meeting Notes';
    const date = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });

    // Convert to HTML format
    let htmlContent = `<h2>${title}</h2>`;
    htmlContent += `<p><em>${date}</em></p>`;
    htmlContent += `<div>${notes}</div>`;
    htmlContent += `<p><small>Posted from MeetingNotes extension</small></p>`;

    return htmlContent;
  }

  /**
   * Disconnect Teams
   */
  async disconnectTeams() {
    await chrome.storage.local.remove([this.teamsTokenKey, 'teams_auth_code']);
  }

  // ======================
  // FAVORITE CHANNELS
  // ======================

  /**
   * Get favorite channels
   */
  async getFavoriteChannels() {
    const result = await chrome.storage.local.get(this.favoriteChannelsKey);
    return result[this.favoriteChannelsKey] || [];
  }

  /**
   * Add favorite channel
   */
  async addFavoriteChannel(platform, channelId, channelName, teamId = null, teamName = null) {
    const favorites = await this.getFavoriteChannels();

    const newFavorite = {
      platform, // 'slack' or 'teams'
      channelId,
      channelName,
      teamId,
      teamName,
      addedAt: new Date().toISOString()
    };

    favorites.push(newFavorite);

    await chrome.storage.local.set({
      [this.favoriteChannelsKey]: favorites
    });

    return newFavorite;
  }

  /**
   * Remove favorite channel
   */
  async removeFavoriteChannel(platform, channelId) {
    const favorites = await this.getFavoriteChannels();
    const filtered = favorites.filter(
      fav => !(fav.platform === platform && fav.channelId === channelId)
    );

    await chrome.storage.local.set({
      [this.favoriteChannelsKey]: filtered
    });
  }

  /**
   * Post to platform (unified method)
   */
  async postToPlatform(platform, teamId, channelId, notes, meetingInfo) {
    if (platform === 'slack') {
      return await this.postToSlack(channelId, notes, meetingInfo);
    } else if (platform === 'teams') {
      return await this.postToTeams(teamId, channelId, notes, meetingInfo);
    } else {
      throw new Error('Unknown platform: ' + platform);
    }
  }

  /**
   * Get connection status for all platforms
   */
  async getConnectionStatus() {
    return {
      slack: await this.isSlackConnected(),
      teams: await this.isTeamsConnected()
    };
  }
}

// Export singleton instance
const slackTeamsIntegrationService = new SlackTeamsIntegrationService();
