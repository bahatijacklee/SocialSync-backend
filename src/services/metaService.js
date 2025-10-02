const axios = require('axios');

class MetaService {
  constructor() {
    this.clientId = process.env.META_APP_ID;
    this.clientSecret = process.env.META_APP_SECRET;
    this.redirectUri = process.env.META_REDIRECT_URI;
    this.baseUrl = 'https://graph.facebook.com/v18.0';
  }

  getAuthUrl(platform) {
    const scopes = [
      'pages_show_list',
      'pages_read_engagement',
      'instagram_basic',
      'instagram_content_publish',
      'pages_manage_posts',
      'business_management'
    ].join(',');

    return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&scope=${scopes}&response_type=code&state=${platform}`;
  }

  async getAccessToken(code) {
    try {
      const response = await axios.get(`${this.baseUrl}/oauth/access_token`, {
        params: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
          code
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting Meta access token:', error.response?.data || error.message);
      throw new Error('Failed to get Meta access token');
    }
  }

  async getLongLivedToken(shortLivedToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          fb_exchange_token: shortLivedToken
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting long-lived token:', error.response?.data || error.message);
      throw new Error('Failed to get long-lived token');
    }
  }

  async getFacebookPages(accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/me/accounts`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,access_token,category'
        }
      });

      return response.data.data;
    } catch (error) {
      console.error('Error getting Facebook pages:', error.response?.data || error.message);
      throw new Error('Failed to get Facebook pages');
    }
  }

  async getInstagramAccounts(pageId, pageAccessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/${pageId}`, {
        params: {
          access_token: pageAccessToken,
          fields: 'instagram_business_account{id,username,profile_picture_url}'
        }
      });

      return response.data.instagram_business_account;
    } catch (error) {
      console.error('Error getting Instagram accounts:', error.response?.data || error.message);
      throw new Error('Failed to get Instagram accounts');
    }
  }

  async getFacebookAnalytics(pageId, pageAccessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/${pageId}/insights`, {
        params: {
          access_token: pageAccessToken,
          metric: 'page_impressions,page_engaged_users,page_post_engagements',
          period: 'day'
        }
      });

      return response.data.data;
    } catch (error) {
      console.error('Error getting Facebook analytics:', error.response?.data || error.message);
      throw new Error('Failed to get Facebook analytics');
    }
  }

  async getInstagramAnalytics(instagramAccountId, accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/${instagramAccountId}/insights`, {
        params: {
          access_token: accessToken,
          metric: 'profile_views,reach,impressions',
          period: 'day'
        }
      });

      return response.data.data;
    } catch (error) {
      console.error('Error getting Instagram analytics:', error.response?.data || error.message);
      throw new Error('Failed to get Instagram analytics');
    }
  }

  async getUnifiedAnalytics(accessToken) {
    try {
      // Get Facebook pages
      const pages = await this.getFacebookPages(accessToken);
      const analytics = {
        facebook: [],
        instagram: []
      };

      // Get analytics for each page and its connected Instagram account
      for (const page of pages) {
        // Get Facebook analytics
        const fbAnalytics = await this.getFacebookAnalytics(page.id, page.access_token);
        analytics.facebook.push({
          pageId: page.id,
          pageName: page.name,
          metrics: fbAnalytics
        });

        // Get connected Instagram account
        const instagramAccount = await this.getInstagramAccounts(page.id, page.access_token);
        if (instagramAccount) {
          const igAnalytics = await this.getInstagramAnalytics(instagramAccount.id, accessToken);
          analytics.instagram.push({
            accountId: instagramAccount.id,
            username: instagramAccount.username,
            metrics: igAnalytics
          });
        }
      }

      return analytics;
    } catch (error) {
      console.error('Error getting unified analytics:', error.response?.data || error.message);
      throw new Error('Failed to get unified analytics');
    }
  }

  async getInstagramProfile(accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/me`, {
        params: {
          fields: 'id,username,account_type',
          access_token: accessToken
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting Instagram profile:', error.response?.data || error.message);
      throw new Error('Failed to get Instagram profile');
    }
  }
}

module.exports = new MetaService(); 