import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { handleIncomingMessage } from "./handlers/message-handler";

// Initialize Firebase Admin only if it hasn't been initialized
if (!admin.apps.length) {
  admin.initializeApp({
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

// WhatsApp webhook endpoint
export const whatsappWebhook = functions.https.onRequest(
  async (request, response) => {
    try {
      if (request.method === "GET") {
        // Handle verification request
        const mode = request.query["hub.mode"];
        const token = request.query["hub.verify_token"];
        const challenge = request.query["hub.challenge"];

        const verifyToken =
          process.env.WHATSAPP_VERIFY_TOKEN || "your-verify-token";

        if (mode === "subscribe" && token === verifyToken) {
          console.log("Webhook verified");
          response.status(200).send(challenge);
        } else {
          console.error("Webhook verification failed");
          response.status(403).send("Verification failed");
        }
      } else if (request.method === "POST") {
        // Handle incoming messages
        const body = request.body;

        if (body.object === "whatsapp_business_account") {
          for (const entry of body.entry) {
            for (const change of entry.changes) {
              if (change.field === "messages") {
                for (const message of change.value.messages || []) {
                  // Extract message data
                  const from = message.from;
                  let messageText = "";
                  let buttonId = undefined;

                  if (message.type === "text" && message.text) {
                    messageText = message.text.body;
                  } else if (message.type === "button" && message.button) {
                    buttonId = message.button.payload;
                    messageText = message.button.text;
                  } else if (
                    message.type === "interactive" &&
                    message.interactive
                  ) {
                    // Handle buttons and list responses
                    if (message.interactive.button_reply) {
                      buttonId = message.interactive.button_reply.id;
                      messageText = message.interactive.button_reply.title;
                    } else if (message.interactive.list_reply) {
                      buttonId = message.interactive.list_reply.id;
                      messageText = message.interactive.list_reply.title;
                    }
                  }

                  if (from && (messageText || buttonId)) {
                    // Process the message
                    await handleIncomingMessage(from, messageText, buttonId);
                  }
                }
              }
            }
          }
        }

        // Return a 200 response to acknowledge receipt of the event
        response.status(200).send("EVENT_RECEIVED");
      } else {
        // Unsupported method
        response.status(405).send("Method Not Allowed");
      }
    } catch (error) {
      console.error("Error processing webhook:", error);
      response.status(500).send("Internal Server Error");
    }
  }
);
