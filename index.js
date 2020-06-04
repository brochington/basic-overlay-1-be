require("dotenv").config();
const WebSocket = require("ws");
const api = require('./src/TwitchAPI');
// const qs = require("qs");

const TwitchHooks = require("./src/TwitchHooks");
const twitchAPI = require("./src/TwitchAPI");

const hooks = new TwitchHooks({
  login: "brochington",
  secretKey: process.env.TWITCH_HUB_SECRET,
});

// hooks.on('follow', () => {
//   console.log('yo!!');
// });

// hooks.on('user_changed', (json) => {
//   console.log('user has changed stuff!!!', json);
// });

function createPayload(type, data) {
  return JSON.stringify({
    type,
    data,
  });
}

class OverlayWS {
  constructor() {
    this.wss = new WebSocket.Server({ port: process.env.PORT || 9123 });

    this.wss.on("connection", (ws) => {
      console.log("connection");

      const createHook = (type) => {
        hooks.on(type, (data) => ws.send(createPayload(type, data)));
      };

      createHook("user_changed");
      createHook("follow");

      // Send connection confirmation
      ws.send(JSON.stringify({ type: 'connection', data: 'connected' }));
    });
  }
}

const overlayWS = new OverlayWS();