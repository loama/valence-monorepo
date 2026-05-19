import cors from "cors";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import dotenv from "dotenv";
import express from "express";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

dotenv.config({ quiet: true });

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(
  express.json({
    verify: (request, _response, buffer) => {
      (request as typeof request & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
    }
  })
);

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
  api_key?: string;
  conversation?: {
    business_scoped_user_id?: string;
    parent_business_scoped_user_id?: string;
    phone_number?: string;
    phone_number_id?: string;
    username?: string;
  };
  data?: {
    conversation?: KapsoWebhookPayload["conversation"];
    direction?: string;
    event?: string;
    from?: string;
    message?: {
      direction?: string;
      from?: string;
      kapso?: {
        content?: string;
        direction?: string;
        status?: string;
      };
      text?: string | { body?: string };
    };
    phone?: string;
    phone_number?: string;
    phone_number_id?: string;
    reply_url?: string;
    secret?: string;
    type?: string;
  };
  direction?: string;
  event?: string;
  event_type?: string;
  key?: string;
  from?: string;
  messages?: Array<{
    direction?: string;
    from?: string;
    kapso?: {
      content?: string;
      direction?: string;
      status?: string;
    };
    text?: string | { body?: string };
    type?: string;
  }>;
  phone?: string;
  phone_number?: string;
  phone_number_id?: string;
  reply_url?: string;
  secret?: string;
  statuses?: unknown[];
  text?: string;
  type?: string;
  message?: {
    direction?: string;
    from?: string;
    kapso?: {
      content?: string;
      direction?: string;
      status?: string;
    };
    text?: string | { body?: string };
    type?: string;
  };
};

type KapsoEnvironment = "development" | "production";

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

app.post("/webhooks/kapso-whatsapp", handleKapsoWhatsAppWebhook);
app.post("/webhooks/whatsapp", handleKapsoWhatsAppWebhook);

async function handleKapsoWhatsAppWebhook(
  request: express.Request,
  response: express.Response
) {
  const auth = getKapsoWebhookAuth(request);

  if (!auth) {
    response.status(401).json({ error: "Invalid Kapso key." });
    return;
  }

  const payloads = getKapsoWebhookPayloads(request.body);
  const results = [];

  for (const payload of payloads) {
    results.push(await processKapsoWhatsAppPayload({ auth, payload, request }));
  }

  response.json({
    ok: true,
    results
  });
}

function getKapsoWebhookPayloads(body: unknown) {
  if (Array.isArray(body)) {
    return body as KapsoWebhookPayload[];
  }

  if (body && typeof body === "object" && "events" in body) {
    const events = (body as { events?: unknown }).events;

    if (Array.isArray(events)) {
      return events as KapsoWebhookPayload[];
    }
  }

  return [body as KapsoWebhookPayload];
}

async function processKapsoWhatsAppPayload({
  auth,
  payload,
  request
}: {
  auth: { environment: KapsoEnvironment; method: string };
  payload: KapsoWebhookPayload;
  request: express.Request;
}) {
  const recipient = getKapsoInboundRecipient(payload);
  const shouldReply = isKapsoInboundMessageEvent(payload, request);
  const reply = `hello, this will work soon ${new Date().toISOString()}`;
  const eventName = getKapsoEventName(payload, request);
  const direction = getKapsoMessageDirection(payload);

  console.info("kapso whatsapp webhook", {
    auth: auth.method,
    direction,
    environment: auth.environment,
    eventName,
    hasRecipient: Boolean(recipient),
    hasText: Boolean(getKapsoText(payload)),
    path: request.path,
    shouldReply
  });

  if (!shouldReply) {
    return {
      ignored: true,
      reason: "non_inbound_message_event"
    };
  }

  const delivery = recipient
    ? await sendKapsoWhatsAppReply({
        environment: auth.environment,
        payload,
        recipient,
        reply
      })
    : { skipped: "missing_recipient" };

  if ("ok" in delivery && !delivery.ok) {
    console.warn("kapso whatsapp reply failed", {
      environment: auth.environment,
      status: delivery.status,
      via: delivery.via
    });
  }

  return {
    delivery,
    reply
  };
}

function getKapsoInboundRecipient(payload: KapsoWebhookPayload) {
  return (
    payload.from ??
    payload.phone ??
    payload.phone_number ??
    payload.message?.from ??
    payload.messages?.[0]?.from ??
    payload.conversation?.phone_number ??
    payload.data?.from ??
    payload.data?.phone ??
    payload.data?.phone_number ??
    payload.data?.conversation?.phone_number ??
    payload.data?.message?.from
  );
}

function getKapsoText(payload: KapsoWebhookPayload) {
  const text =
    payload.text ??
    payload.message?.text ??
    payload.message?.kapso?.content ??
    payload.messages?.[0]?.text ??
    payload.messages?.[0]?.kapso?.content ??
    payload.data?.message?.text ??
    payload.data?.message?.kapso?.content;

  if (typeof text === "string") {
    return text.trim();
  }

  return text?.body?.trim() ?? "";
}

function normalizeKapsoValue(value: string | undefined) {
  return value?.trim().toLowerCase().replaceAll(" ", "_") ?? "";
}

function getKapsoEventName(payload: KapsoWebhookPayload, request?: express.Request) {
  return normalizeKapsoValue(
    request?.header("x-webhook-event") ??
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
      payload.message?.kapso?.direction ??
      payload.messages?.[0]?.direction ??
      payload.messages?.[0]?.kapso?.direction ??
      payload.data?.direction ??
      payload.data?.message?.direction ??
      payload.data?.message?.kapso?.direction
  );
}

function isKapsoInboundMessageEvent(payload: KapsoWebhookPayload, request?: express.Request) {
  const eventName = getKapsoEventName(payload, request);
  const direction = getKapsoMessageDirection(payload);

  if (
    direction === "outbound" ||
    direction === "sent" ||
    eventName.includes("whatsapp_message_sent") ||
    eventName.includes("whatsapp.message.sent") ||
    eventName.includes("message_sent") ||
    eventName.includes("whatsapp_message_delivered") ||
    eventName.includes("whatsapp.message.delivered") ||
    eventName.includes("message_delivered") ||
    eventName.includes("whatsapp_message_read") ||
    eventName.includes("whatsapp.message.read") ||
    eventName.includes("message_read") ||
    eventName.includes("whatsapp_message_failed") ||
    eventName.includes("whatsapp.message.failed") ||
    eventName.includes("message_failed") ||
    eventName.includes("whatsapp_conversation_inactive") ||
    eventName.includes("whatsapp.conversation.inactive") ||
    eventName.includes("conversation_inactive") ||
    eventName.includes("whatsapp_conversation_ended") ||
    eventName.includes("whatsapp.conversation.ended") ||
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
        eventName.includes("whatsapp_message_received") ||
        eventName.includes("whatsapp.message.received") ||
        eventName === "message")
    );
  }

  return hasRecipient && hasMessageText;
}

function getKapsoRequestKey(request: express.Request) {
  const authorization = request.header("authorization");
  const queryKey = request.query.key ?? request.query.token;
  const body = request.body as KapsoWebhookPayload;

  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice("bearer ".length).trim();
  }

  return (
    request.header("x-api-key") ??
    request.header("x-kapso-api-key") ??
    request.header("x-kapso-key") ??
    (typeof queryKey === "string" ? queryKey : undefined) ??
    body.key ??
    body.api_key ??
    body.secret ??
    body.data?.secret ??
    ""
  );
}

function getKapsoWebhookAuth(request: express.Request) {
  const key = getKapsoRequestKey(request);

  if (key && key === process.env.KAPSO_PRODUCTION_API_KEY) {
    return { environment: "production" as const, method: "api_key" };
  }

  if (key && key === process.env.KAPSO_DEVELOPMENT_API_KEY) {
    return { environment: "development" as const, method: "api_key" };
  }

  const signature = request.header("x-webhook-signature");

  if (signature) {
    if (verifyKapsoSignature(request, signature, process.env.KAPSO_PRODUCTION_WEBHOOK_SECRET)) {
      return { environment: "production" as const, method: "signature" };
    }

    if (verifyKapsoSignature(request, signature, process.env.KAPSO_DEVELOPMENT_WEBHOOK_SECRET)) {
      return { environment: "development" as const, method: "signature" };
    }

    if (verifyKapsoSignature(request, signature, process.env.KAPSO_WEBHOOK_SECRET)) {
      return {
        environment: getKapsoEnvironmentFromPayload(request.body as KapsoWebhookPayload),
        method: "signature"
      };
    }
  }

  return null;
}

function verifyKapsoSignature(
  request: express.Request,
  signature: string,
  secret: string | undefined
) {
  if (!secret) {
    return false;
  }

  const rawBody = (request as typeof request & { rawBody?: Buffer }).rawBody;
  const signedPayload = rawBody ?? Buffer.from(JSON.stringify(request.body));
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");

  return safeEqualHex(signature, expected);
}

function safeEqualHex(received: string, expected: string) {
  const normalizedReceived = received.trim().replace(/^sha256=/i, "");
  const receivedBuffer = Buffer.from(normalizedReceived, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

function getKapsoEnvironmentFromPayload(payload: KapsoWebhookPayload): KapsoEnvironment {
  const phoneNumberId = getKapsoPhoneNumberId(payload);

  if (
    phoneNumberId &&
    phoneNumberId === process.env.KAPSO_DEVELOPMENT_PHONE_NUMBER_ID
  ) {
    return "development";
  }

  return "production";
}

function getKapsoPhoneNumberId(payload: KapsoWebhookPayload) {
  return (
    payload.phone_number_id ??
    payload.conversation?.phone_number_id ??
    payload.data?.phone_number_id ??
    payload.data?.conversation?.phone_number_id
  );
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
  const replyUrl = payload.reply_url ?? payload.data?.reply_url ?? process.env.KAPSO_REPLY_URL;
  const apiKey =
    environment === "production"
      ? process.env.KAPSO_PRODUCTION_API_KEY
      : process.env.KAPSO_DEVELOPMENT_API_KEY;
  const phoneNumberId =
    getKapsoPhoneNumberId(payload) ??
    (environment === "production"
      ? process.env.KAPSO_PRODUCTION_PHONE_NUMBER_ID
      : process.env.KAPSO_DEVELOPMENT_PHONE_NUMBER_ID);

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
      `https://api.kapso.ai/meta/whatsapp/v24.0/${encodeURIComponent(phoneNumberId)}/messages`,
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
