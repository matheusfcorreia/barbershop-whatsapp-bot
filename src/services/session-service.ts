import { UserSession } from "../types";
import * as admin from "firebase-admin";

// Initialize Firestore if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const sessionsCollection = db.collection("sessions");

// Session expiration time in milliseconds (30 minutes)
const SESSION_EXPIRATION_TIME = 30 * 60 * 1000;

export const isSessionExpired = (session: UserSession): boolean => {
  if (!session.lastInteractionAt) return true;

  const now = Date.now();
  const lastInteraction = session.lastInteractionAt.toDate().getTime();
  return now - lastInteraction > SESSION_EXPIRATION_TIME;
};

export const getSession = async (
  phoneNumber: string
): Promise<UserSession | undefined> => {
  try {
    const doc = await sessionsCollection.doc(phoneNumber).get();
    if (doc.exists) {
      const session = doc.data() as UserSession;
      if (isSessionExpired(session)) {
        // Delete expired session
        await sessionsCollection.doc(phoneNumber).delete();
        return undefined;
      }
      return session;
    }
    return undefined;
  } catch (error) {
    console.error("Error getting session:", error);
    throw error;
  }
};

export const createSession = async (
  phoneNumber: string
): Promise<UserSession> => {
  try {
    const now = admin.firestore.Timestamp.now();
    const session: UserSession = {
      phoneNumber,
      step: 1,
      createdAt: now,
      updatedAt: now,
      lastInteractionAt: now,
    };

    await sessionsCollection.doc(phoneNumber).set(session);
    return session;
  } catch (error) {
    console.error("Error creating session:", error);
    throw error;
  }
};

export const updateSession = async (
  session: UserSession
): Promise<UserSession> => {
  try {
    const now = admin.firestore.Timestamp.now();
    const updatedSession = {
      ...session,
      updatedAt: now,
      lastInteractionAt: now,
    };

    await sessionsCollection.doc(session.phoneNumber).update(updatedSession);
    return updatedSession;
  } catch (error) {
    console.error("Error updating session:", error);
    throw error;
  }
};

export const getOrCreateSession = async (
  phoneNumber: string
): Promise<UserSession> => {
  try {
    let session = await getSession(phoneNumber);
    if (!session) {
      session = await createSession(phoneNumber);
    }
    return session;
  } catch (error) {
    console.error("Error getting or creating session:", error);
    throw error;
  }
};

export const formatHour = (schedule: number): string => {
  const hours = Math.floor(schedule / 60);
  const minutes = schedule % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};
