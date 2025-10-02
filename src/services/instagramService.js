const axios = require('axios');

class InstagramService {
  constructor() {
    this.clientId = process.env.INSTAGRAM_CLIENT_ID;
    this.clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    this.redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
    this.baseUrl = 'https://graph.instagram.com/v12.0';
  }

  getAuthUrl() {
    const scopes = [
      'user_profile',
      'user_media',
      'instagram_basic',
      'instagram_content_publish'
    ].join(',');

    return `https://api.instagram.com/oauth/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&scope=${scopes}&response_type=code`;
  }

  async getAccessToken(code) {
    try {
      const response = await axios.post('https://api.instagram.com/oauth/access_token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
        code
      });

      return response.data;
    } catch (error) {
      console.error('Error getting Instagram access token:', error.response?.data || error.message);
      throw new Error('Failed to get Instagram access token');
    }
  }

  async getLongLivedToken(shortLivedToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/oauth/access_token`, {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: this.clientSecret,
          access_token: shortLivedToken
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting long-lived token:', error.response?.data || error.message);
      throw new Error('Failed to get long-lived token');
    }
  }

  async getUserProfile(accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/me`, {
        params: {
          fields: 'id,username,account_type,media_count',
          access_token: accessToken
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting Instagram profile:', error.response?.data || error.message);
      throw new Error('Failed to get Instagram profile');
    }
  }

  async getAccountAnalytics(accessToken) {
    try {
      // Get basic account metrics
      const profile = await this.getUserProfile(accessToken);
      
      // Get media insights
      const mediaResponse = await axios.get(`${this.baseUrl}/me/media`, {
        params: {
          fields: 'id,caption,media_type,timestamp,permalink,thumbnail_url',
          access_token: accessToken
        }
      });

      // Calculate engagement metrics
      const posts = mediaResponse.data.data;
      const totalLikes = posts.reduce((sum, post) => sum + (post.like_count || 0), 0);
      const totalComments = posts.reduce((sum, post) => sum + (post.comments_count || 0), 0);

      return {
        username: profile.username,
        followers: profile.followers_count || 0,
        following: profile.follows_count || 0,
        totalPosts: profile.media_count,
        engagement: {
          totalLikes,
          totalComments,
          averageEngagement: posts.length ? (totalLikes + totalComments) / posts.length : 0
        },
        recentPosts: posts.slice(0, 5) // Last 5 posts
      };
    } catch (error) {
      console.error('Error getting Instagram analytics:', error.response?.data || error.message);
      throw new Error('Failed to get Instagram analytics');
    }
  }
}

module.exports = new InstagramService(); 