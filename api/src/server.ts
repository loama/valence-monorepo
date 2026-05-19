import cors from "cors";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import express from "express";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

dotenv.config({ quiet: true });

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

type SupabaseUser = {
  id: string;
};

type ConversationParticipant = {
  user_id: string;
};

type DeviceRow = {
  push_token: string | null;
};

type NotificationPayload = {
  conversationId?: string;
  messageId?: string;
  senderUserId?: string;
};

type KapsoWebhookPayload = {
  data?: {
    direction?: string;
    event?: string;
    from?: string;
    message?: {
      direction?: string;
      from?: string;
      text?: string | { body?: string };
    };
    phone?: string;
    phone_number?: string;
    type?: string;
  };
  direction?: string;
  event?: string;
  event_type?: string;
  from?: string;
  messages?: Array<{
    direction?: string;
    from?: string;
    text?: string | { body?: string };
    type?: string;
  }>;
  phone?: string;
  phone_number?: string;
  reply_url?: string;
  statuses?: unknown[];
  text?: string;
  type?: string;
  message?: {
    direction?: string;
    from?: string;
    text?: string | { body?: string };
    type?: string;
  };
};

function getSupabaseServiceConfig() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  return { isConfigured: Boolean(url && secretKey), secretKey, url };
}

async function supabaseRest<T>({
  body,
  method = "GET",
  path,
  query = ""
}: {
  body?: unknown;
  method?: "GET" | "POST" | "PATCH";
  path: string;
  query?: string;
}) {
  const { isConfigured, secretKey, url } = getSupabaseServiceConfig();

  if (!isConfigured || !secretKey || !url) {
    throw new Error("Supabase service credentials are not configured.");
  }

  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${path}${query}`, {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json"
    },
    method
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as T;
}

function getFirebaseMessaging() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    return null;
  }

  if (getApps().length === 0) {
    initializeApp({
      credential: cert(JSON.parse(serviceAccountJson))
    });
  }

  return getMessaging();
}

async function sendPushToUserDevices({
  body,
  data,
  title,
  userId
}: {
  body: string;
  data: Record<string, string>;
  title: string;
  userId: string;
}) {
  const devices = await supabaseRest<DeviceRow[]>({
    path: "devices",
    query: `?user_id=eq.${encodeURIComponent(userId)}&push_token=not.is.null&select=push_token`
  });
  const tokens = devices
    .map((device) => device.push_token)
    .filter((token): token is string => Boolean(token));

  if (tokens.length === 0) {
    return { sent: 0, skipped: "no_tokens" };
  }

  const messaging = getFirebaseMessaging();

  if (!messaging) {
    return { sent: 0, skipped: "firebase_not_configured", tokens: tokens.length };
  }

  const result = await messaging.sendEachForMulticast({
    apns: {
      payload: {
        aps: {
          badge: 1,
          sound: "default"
        }
      }
    },
    data,
    notification: {
      body,
      title
    },
    tokens
  });

  return { failed: result.failureCount, sent: result.successCount };
}

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

      const tokenResponse = await createDailyMeetingToken({
        dailyApiKey,
        displayName,
        expiresAt,
        roomName: existingRoom.name
      });

      response.json({
        displayName,
        expiresAt,
        name: existingRoom.name,
        url: tokenResponse?.token
          ? `${existingRoom.url}?t=${tokenResponse.token}`
          : existingRoom.url
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

  const tokenResponse = await createDailyMeetingToken({
    dailyApiKey,
    displayName,
    expiresAt,
    roomName: room.name
  });

  response.json({
    displayName,
    expiresAt,
    name: room.name,
    url: tokenResponse?.token ? `${room.url}?t=${tokenResponse.token}` : room.url
  });
});

async function createDailyMeetingToken({
  dailyApiKey,
  displayName,
  expiresAt,
  roomName
}: {
  dailyApiKey: string;
  displayName: string;
  expiresAt: number;
  roomName: string;
}) {
  const tokenResponse = await fetch("https://api.daily.co/v1/meeting-tokens", {
    body: JSON.stringify({
      properties: {
        exp: expiresAt,
        is_owner: true,
        room_name: roomName,
        user_name: displayName
      }
    }),
    headers: {
      Authorization: `Bearer ${dailyApiKey}`,
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  if (!tokenResponse.ok) {
    return null;
  }

  const token = (await tokenResponse.json()) as { token?: string };

  if (!token.token) {
    return null;
  }

  return {
    token: token.token
  };
}

app.post("/notifications/message", async (request, response) => {
  const payload = request.body as NotificationPayload;

  if (!payload.conversationId || !payload.senderUserId) {
    response.status(400).json({
      error: "conversationId and senderUserId are required."
    });
    return;
  }

  try {
    const participants = await supabaseRest<ConversationParticipant[]>({
      path: "conversation_participants",
      query: `?conversation_id=eq.${encodeURIComponent(payload.conversationId)}&select=user_id`
    });
    const recipients = participants.filter(
      (participant) => participant.user_id !== payload.senderUserId
    );
    const results = await Promise.all(
      recipients.map((recipient) =>
        sendPushToUserDevices({
          body: "You have a new care message.",
          data: {
            conversationId: payload.conversationId ?? "",
            messageId: payload.messageId ?? "",
            url: "/app"
          },
          title: "New message",
          userId: recipient.user_id
        })
      )
    );

    response.json({
      ok: true,
      recipients: recipients.length,
      results
    });
  } catch (error) {
    response.status(500).json({
      error: "Could not send message notifications.",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

app.post("/webhooks/kapso-whatsapp", async (request, response) => {
  const key = getKapsoRequestKey(request);
  const environment = getKapsoEnvironment(key);

  if (!environment) {
    response.status(401).json({ error: "Invalid Kapso key." });
    return;
  }

  const payload = request.body as KapsoWebhookPayload;
  const recipient = getKapsoInboundRecipient(payload);
  const shouldReply = isKapsoInboundMessageEvent(payload);
  const reply = `hello, this will work soon ${new Date().toISOString()}`;

  if (!shouldReply) {
    response.json({
      ok: true,
      ignored: true,
      reason: "non_inbound_message_event"
    });
    return;
  }

  const delivery = recipient
    ? await sendKapsoWhatsAppReply({
        environment,
        payload,
        recipient,
        reply
      })
    : { skipped: "missing_recipient" };

  response.json({
    ok: true,
    delivery,
    reply
  });
});

function getKapsoInboundRecipient(payload: KapsoWebhookPayload) {
  return (
    payload.from ??
    payload.phone ??
    payload.phone_number ??
    payload.message?.from ??
    payload.messages?.[0]?.from ??
    payload.data?.from ??
    payload.data?.phone ??
    payload.data?.phone_number ??
    payload.data?.message?.from
  );
}

function getKapsoText(payload: KapsoWebhookPayload) {
  const text =
    payload.text ??
    payload.message?.text ??
    payload.messages?.[0]?.text ??
    payload.data?.message?.text;

  if (typeof text === "string") {
    return text.trim();
  }

  return text?.body?.trim() ?? "";
}

function normalizeKapsoValue(value: string | undefined) {
  return value?.trim().toLowerCase().replaceAll(" ", "_") ?? "";
}

function getKapsoEventName(payload: KapsoWebhookPayload) {
  return normalizeKapsoValue(
    payload.event ??
      payload.event_type ??
      payload.type ??
      payload.data?.event ??
      payload.data?.type
  );
}

function getKapsoMessageDirection(payload: KapsoWebhookPayload) {
  return normalizeKapsoValue(
    payload.direction ??
      payload.message?.direction ??
      payload.messages?.[0]?.direction ??
      payload.data?.direction ??
      payload.data?.message?.direction
  );
}

function isKapsoInboundMessageEvent(payload: KapsoWebhookPayload) {
  const eventName = getKapsoEventName(payload);
  const direction = getKapsoMessageDirection(payload);

  if (
    direction === "outbound" ||
    direction === "sent" ||
    eventName.includes("message_sent") ||
    eventName.includes("message_delivered") ||
    eventName.includes("message_read") ||
    eventName.includes("message_failed") ||
    eventName.includes("conversation_inactive") ||
    eventName.includes("conversation_ended") ||
    payload.statuses
  ) {
    return false;
  }

  const hasRecipient = Boolean(getKapsoInboundRecipient(payload));
  const hasMessageText = Boolean(getKapsoText(payload));

  if (eventName) {
    return (
      hasRecipient &&
      hasMessageText &&
      (eventName.includes("message_received") ||
        eventName.includes("message.received") ||
        eventName === "message")
    );
  }

  return hasRecipient && hasMessageText;
}

function getKapsoRequestKey(request: express.Request) {
  const authorization = request.header("authorization");

  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice("bearer ".length).trim();
  }

  return (
    request.header("x-api-key") ??
    request.header("x-kapso-api-key") ??
    request.header("x-kapso-key") ??
    ""
  );
}

function getKapsoEnvironment(key: string) {
  if (key && key === process.env.KAPSO_PRODUCTION_API_KEY) {
    return "production" as const;
  }

  if (key && key === process.env.KAPSO_DEVELOPMENT_API_KEY) {
    return "development" as const;
  }

  return null;
}

async function sendKapsoWhatsAppReply({
  environment,
  payload,
  recipient,
  reply
}: {
  environment: "development" | "production";
  payload: KapsoWebhookPayload;
  recipient: string;
  reply: string;
}) {
  const replyUrl = payload.reply_url ?? process.env.KAPSO_REPLY_URL;
  const apiKey =
    environment === "production"
      ? process.env.KAPSO_PRODUCTION_API_KEY
      : process.env.KAPSO_DEVELOPMENT_API_KEY;
  const phoneNumberId =
    environment === "production"
      ? process.env.KAPSO_PRODUCTION_PHONE_NUMBER_ID
      : process.env.KAPSO_DEVELOPMENT_PHONE_NUMBER_ID;

  if (replyUrl) {
    try {
      const replyResponse = await fetch(replyUrl, {
        body: JSON.stringify({ body: reply, text: reply, to: recipient }),
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "X-API-Key": apiKey } : {})
        },
        method: "POST"
      });

      return {
        ok: replyResponse.ok,
        status: replyResponse.status,
        via: "reply_url"
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
        ok: false,
        via: "reply_url"
      };
    }
  }

  if (!apiKey || !phoneNumberId) {
    return { skipped: "missing_kapso_phone_number_id" };
  }

  try {
    const kapsoResponse = await fetch(
      `https://api.kapso.ai/api/v1/meta/whatsapp/messages/${encodeURIComponent(phoneNumberId)}`,
      {
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          text: {
            body: reply,
            preview_url: false
          },
          to: recipient,
          type: "text"
        }),
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey
        },
        method: "POST"
      }
    );

    return {
      ok: kapsoResponse.ok,
      status: kapsoResponse.status,
      via: "kapso"
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      ok: false,
      via: "kapso"
    };
  }
}

app.listen(port, () => {
  console.log(`Valence API listening on port ${port}`);
});
