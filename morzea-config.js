/*
 * MORZÉA — Firebase + AI public configuration
 * ------------------------------------------------------------
 * IMPORTANT:
 * - Firebase Web config is public by design, but Firestore access
 *   MUST be protected by Authentication + Security Rules.
 * - NEVER place your OpenAI secret key in this file.
 * - The OpenAI secret key belongs only in Google Apps Script
 *   Project Settings > Script properties.
 */
window.MORZEA_CONFIG = Object.freeze({
  firebase: {
    apiKey: "PASTE_FIREBASE_API_KEY",
    authDomain: "ex-experience.firebaseapp.com",
    projectId: "ex-experience",
    storageBucket: "PASTE_FIREBASE_STORAGE_BUCKET",
    messagingSenderId: "PASTE_FIREBASE_MESSAGING_SENDER_ID",
    appId: "PASTE_FIREBASE_APP_ID"
  },

  agent: {
    enabled: true,
    endpoint: "PASTE_APPS_SCRIPT_WEB_APP_EXEC_URL",
    siteId: "morzea-web-v1",
    maxHistoryMessages: 8,
    maxMessageChars: 2500
  },

  telemetry: {
    enabled: true,
    collectionPrefix: "MORZEA",
    consentVersion: "2026-08-29"
  }
});
