const fetch = require("node-fetch");
const qs = require("qs");

class Auth {
  constructor() {
    this.accessToken = null;
    this.expiresAt = null;
  }

  async getAccesToken() {
    if (!this.accessToken || !this.expiresAt || this.expiresAt <= Date.now()) {
      const query = {
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        grant_type: "client_credentials",
        scope: "user:read:email", // space-separated list of scopes
      };

      const resp = await fetch(
        `https://id.twitch.tv/oauth2/token?${qs.stringify(query)}`,
        { method: "POST" }
      );

      const json = await resp.json();

      this.accessToken = json.access_token;
      this.expiresAt = Date.now() + json.expires_in * 1000;
    }

    return this.accessToken;
  }
}

module.exports = new Auth();
