/*
 * MORZÉA — Firebase + AI public configuration
 * Firebase Web configuration is public by design.
 * NEVER place the OpenAI secret key in this file.
 */

window.MORZEA_CONFIG = Object.freeze({

 firebase: {
  apiKey: "AIzaSyCs-gBedeVDKUs5ZxNheiQTrDsBehNbB6Y",
  authDomain: "ex-experience-morzea.firebaseapp.com",
  projectId: "ex-experience-morzea",
  storageBucket: "ex-experience-morzea.firebasestorage.app",
  messagingSenderId: "208965841703",
  appId: "1:208965841703:web:e84ed83392a0ccd88fa02",
  measurementId: "G-CT98FYFHQI",

  databaseId: "default"
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
