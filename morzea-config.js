/*
 * MORZÉA — Firebase + AI Public Configuration
 * ============================================
 *
 * Firebase Web configuration is public by design.
 *
 * IMPORTANT:
 * NEVER place the OpenAI secret API key in this file.
 * OpenAI secrets will stay inside Google Apps Script.
 */

window.MORZEA_CONFIG = Object.freeze({

  /*
   * FIREBASE
   * ----------------------------------------------------------
   * Project:
   * ex-experience-morzea
   */
  firebase: {

    apiKey: "AIzaSyCs-gBedeVDKUs5ZxNheiQTrDsBehNbB6Y",

    authDomain:
      "ex-experience-morzea.firebaseapp.com",

    projectId:
      "ex-experience-morzea",

    storageBucket:
      "ex-experience-morzea.firebasestorage.app",

    messagingSenderId:
      "208965841703",

    appId:
      "1:208965841703:web:e84ed83392a0ccd88fa02",

    measurementId:
      "G-CT98FYFHQI",

    /*
     * IMPORTANT
     *
     * Your Firestore database was created with:
     *
     * Database ID = default
     *
     * Therefore morzea-firebase.js will explicitly connect
     * to this database instead of assuming (default).
     */
    databaseId:
      "default"
  },


  /*
   * MORZÉA AI AGENT
   * ----------------------------------------------------------
   *
   * We will replace the endpoint later after deploying
   * Google Apps Script.
   */
  agent: {

    enabled: true,

    endpoint:
      "PASTE_APPS_SCRIPT_WEB_APP_EXEC_URL",

    siteId:
      "morzea-web-v1",

    maxHistoryMessages:
      8,

    maxMessageChars:
      2500
  },


  /*
   * TELEMETRY
   * ----------------------------------------------------------
   */
  telemetry: {

    enabled: true,

    collectionPrefix:
      "MORZEA",

    consentVersion:
      "2026-08-29"
  }

});
