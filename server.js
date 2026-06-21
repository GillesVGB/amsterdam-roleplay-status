import express from "express";

const app = express();

const FIVEM_DYNAMIC_URL = "http://185.229.35.13:30120/dynamic.json";

app.get("/", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(FIVEM_DYNAMIC_URL + "?t=" + Date.now(), {
      cache: "no-store",
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error("FiveM status niet bereikbaar");
    }

    const data = await response.json();

    if (!data || data.clients === undefined || data.sv_maxclients === undefined) {
      throw new Error("Ongeldige FiveM status");
    }

    res.json({
      online: true,
      players: Number(data.clients) || 0,
      maxPlayers: Number(data.sv_maxclients) || 0,
      status: "online",
      serverName: data.hostname || "Amsterdam Roleplay",
      join: "https://cfx.re/join/8emey4v",
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    res.json({
      online: false,
      players: 0,
      maxPlayers: 128,
      status: "offline",
      serverName: "Amsterdam Roleplay",
      join: "https://cfx.re/join/8emey4v",
      error: error.message,
      updatedAt: new Date().toISOString()
    });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Status API running on port ${port}`);
});
