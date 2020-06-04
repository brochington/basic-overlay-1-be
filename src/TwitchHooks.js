const crypto = require("crypto");
const fetch = require("node-fetch");
const express = require("express");
const morgan = require("morgan");

const auth = require("./Auth");
const api = require('./TwitchAPI');

/* 
supported events:
  follow
  user_changed
*/

async function subscribe(body) {
  const fullBody = {
    "hub.mode": "subscribe",
    "hub.lease_seconds": "864000",
    ...body,
  };

  const token = await auth.getAccesToken();

  const a = await fetch("https://api.twitch.tv/helix/webhooks/hub", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Client-ID": process.env.TWITCH_CLIENT_ID,
    },
    body: JSON.stringify(fullBody),
  });

  if (!a.ok) {
    throw new Error(`Unable to subscribe to webhook: ${JSON.stringify(fullBody)}`)
  }
}

module.exports = class TwitchHooks {
  constructor(config) {
    this.login = config.login; // username, like brochington;
    this.user = null;
    this.secretKey = config.secretKey; // maybe best to have random number here?
    this.app = express();
    this.handlers = {
      follow: [],
      user_changed: [],
    };

    this.app.use(express.json()) // for parsing application/json
    this.app.use(morgan("combined"));

    this.app.get('/alive', (req, res) => {
      res.send('This is working!');
    });

    this.app.get("/twitch-hooks/hook/*", (req, res) => {
      if (req.query["hub.challenge"]) {
        // TODO: Need to verify this hub.challange
        res.send(req.query["hub.challenge"]);
      }
    });

    this.app.post(`/twitch-hooks/hook/follow`, (req, res) => {
      console.log("get a follow!", req.body.data);
      this.handlers.follow.forEach((handler) => {
        handler(req.body.data);
      });

      res.sendStatus(200);
    });

    this.app.post(`/twitch-hooks/hook/user-changed`, (req, res) => {
      console.log('user_changed', req.body);
      this.handlers.user_changed.forEach((handler) => {
        handler(req.body.data);
      });
      
      res.sendStatus(200);
    });

    this.app.listen(process.env.PORT || 80, () => {
      console.log("TwitchHooks has started!");
    });
  }

  getSecret(topic) {
    return crypto
      .createHmac("sha256", this.secretKey)
      .update(topic)
      .digest("hex");
  }

  async on(eventType, callback) {
    console.log("on?????", eventType);
    if (Array.isArray(this.handlers[eventType])) {
      this.handlers[eventType].push(callback);

      switch (eventType) {
        case "follow":
          {
            console.log("follow summit");
            // summit
            const topic =
              "https://api.twitch.tv/helix/users/follows?first=1&to_id=26490481";

            // const topic = // brochington
            //   "https://api.twitch.tv/helix/users/follows?first=1&to_id=172490237";
            await subscribe({
              "hub.topic": topic,
              "hub.callback": `${process.env.TWITCH_HUB_CALLBACK_URI}/twitch-hooks/hook/follow`,
              "hub.secret": this.getSecret(topic),
            });
          }
          break;

        case "user_changed":
          {
            if (!this.user) {
              this.user = await api.getUsers();
            }

            const topic = `https://api.twitch.tv/helix/users?id=${this.user.id}`;
            await subscribe({
              "hub.topic": topic,
              "hub.callback": `${process.env.TWITCH_HUB_CALLBACK_URI}/twitch-hooks/hook/user-changed`,
              "hub.secret": this.getSecret(topic),
            });
          }
          break;

        default:
          break;
      }
    } else {
      throw new Error(`${eventType} is not a valid twitch event`);
    }
  }
};
