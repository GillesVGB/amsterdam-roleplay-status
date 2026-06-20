import express from "express";

const app = express();

const FIVEM_DYNAMIC_URL = "http://185.229.35.13:30120/dynamic.json";

app.get("/", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");

  try {
    const response = await fetch(FIVEM_DYNAMIC_URL);
    const data = await response.json();

    res.json({
      online: true,
      players: Number(data.clients) || 0,
      maxPlayers: Number(data.sv_maxclients) || 0,
      status: "online",
      serverName: data.hostname || "Amsterdam Roleplay",
      join: "https://cfx.re/join/8emey4v"
    });
  } catch (error) {
    res.json({
      online: false,
      players: 0,
      maxPlayers: 0,
      status: "offline",
      error: error.message
    });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Status API running on port ${port}`);
});
