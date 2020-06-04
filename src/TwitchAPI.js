const fetch = require("node-fetch");

const auth = require("./Auth");

async function twitchReq(url) {
  const token = await auth.getAccesToken();

  const resp = await fetch(
    url,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Client-ID": process.env.TWITCH_CLIENT_ID,
      },
    }
  );

  const { data } = await resp.json();

  return data;
}

async function getUsers() {
  const data = await twitchReq(
    // "https://api.twitch.tv/helix/users?login=summit1g"
    "https://api.twitch.tv/helix/users?login=brochington"
  );

  return data[0];
}

async function getWebhookSubscriptions() {
  const data = await twitchReq(
    "https://api.twitch.tv/helix/webhooks/subscriptions"
  );

  return data;
}

module.exports = {
  getUsers,
  getWebhookSubscriptions,
};