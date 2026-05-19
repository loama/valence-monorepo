import cors from "cors";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import express from "express";

dotenv.config({ quiet: true });

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get("/", (_request, response) => {
  response.json({
    service: "Valence API",
    message: "Hello from the Valence psychology platform API."
  });
});

app.get("/health", (_request, response) => {
  response.json({
    ok: true
  });
});

app.post("/daily/rooms", async (request, response) => {
  const dailyApiKey = process.env.DAILY_API_KEY;

  if (!dailyApiKey) {
    response.status(503).json({
      error: "Daily.co is not configured."
    });
    return;
  }

  const appointmentId =
    typeof request.body?.appointmentId === "string"
      ? request.body.appointmentId
      : randomUUID();
  const displayName =
    typeof request.body?.displayName === "string"
      ? request.body.displayName
      : "Valence session";
  const roomName = `valence-${appointmentId.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 48)}`;
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 4;

  const dailyResponse = await fetch("https://api.daily.co/v1/rooms", {
    body: JSON.stringify({
      name: roomName,
      privacy: "private",
      properties: {
        enable_screenshare: true,
        enable_chat: false,
        exp: expiresAt,
        start_video_off: false,
        start_audio_off: false
      }
    }),
    headers: {
      Authorization: `Bearer ${dailyApiKey}`,
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  if (!dailyResponse.ok && dailyResponse.status === 400) {
    const existingRoomResponse = await fetch(
      `https://api.daily.co/v1/rooms/${encodeURIComponent(roomName)}`,
      {
        headers: {
          Authorization: `Bearer ${dailyApiKey}`
        }
      }
    );

    if (existingRoomResponse.ok) {
      const existingRoom = (await existingRoomResponse.json()) as {
        name: string;
        url: string;
      };

      response.json({
        displayName,
        expiresAt,
        name: existingRoom.name,
        url: existingRoom.url
      });
      return;
    }
  }

  if (!dailyResponse.ok) {
    const details = await dailyResponse.text();

    response.status(dailyResponse.status).json({
      error: "Daily.co room creation failed.",
      details
    });
    return;
  }

  const room = (await dailyResponse.json()) as {
    name: string;
    url: string;
  };

  response.json({
    displayName,
    expiresAt,
    name: room.name,
    url: room.url
  });
});

app.listen(port, () => {
  console.log(`Valence API listening on port ${port}`);
});
