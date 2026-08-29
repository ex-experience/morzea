/*
 * MORZÉA — Firebase / Firestore Telemetry
 * ========================================
 *
 * Responsibilities:
 *
 * - Initialize Firebase
 * - Anonymous Firebase Authentication
 * - Connect explicitly to Firestore database "default"
 * - Register visitors
 * - Register page views
 * - Register product interactions
 * - Register cart interactions
 * - Register AI interactions
 * - Register newsletter leads
 * - Register frontend errors
 *
 * No OpenAI secret key exists in this file.
 */


/* ============================================================
   FIREBASE IMPORTS
   ============================================================ */

import {
  initializeApp,
  getApps
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";


import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";



/* ============================================================
   CONFIG
   ============================================================ */

const CONFIG =
  window.MORZEA_CONFIG || {};


const firebaseCfg =
  CONFIG.firebase || {};


const telemetryCfg =
  CONFIG.telemetry || {};


const PREFIX =
  telemetryCfg.collectionPrefix || "MORZEA";


const SESSION_KEY =
  "morzea-session-id";


const SESSION_START_KEY =
  "morzea-session-start";



/* ============================================================
   CONFIG VALIDATION
   ============================================================ */

function isFirebaseConfigured() {

  const requiredValues = [

    firebaseCfg.apiKey,

    firebaseCfg.authDomain,

    firebaseCfg.projectId,

    firebaseCfg.appId

  ];


  return (

    telemetryCfg.enabled !== false &&

    requiredValues.every(value =>

      typeof value === "string" &&

      value.length > 0 &&

      !value.startsWith("PASTE_")

    )

  );

}



/* ============================================================
   HELPERS
   ============================================================ */

function createRandomId() {

  if (
    window.crypto &&
    typeof window.crypto.randomUUID === "function"
  ) {

    return window.crypto.randomUUID();

  }


  return (

    "morzea_" +

    Date.now().toString(36) +

    "_" +

    Math.random()
      .toString(36)
      .slice(2)

  );

}



function getSessionId() {

  let sessionId =
    localStorage.getItem(SESSION_KEY);


  if (!sessionId) {

    sessionId =
      createRandomId();


    localStorage.setItem(
      SESSION_KEY,
      sessionId
    );

  }


  return sessionId;

}



function getSessionStart() {

  let startedAt =
    Number(
      sessionStorage.getItem(
        SESSION_START_KEY
      ) || 0
    );


  if (!startedAt) {

    startedAt =
      Date.now();


    sessionStorage.setItem(
      SESSION_START_KEY,
      String(startedAt)
    );

  }


  return startedAt;

}



function cleanString(
  value,
  maxLength = 500
) {

  if (value === null ||
      value === undefined) {

    return "";

  }


  return String(value)

    .replace(/\s+/g, " ")

    .trim()

    .slice(0, maxLength);

}



function sanitizeData(input = {}) {

  const output = {};


  Object.entries(input)
    .forEach(([key, value]) => {

      if (
        value === undefined ||
        typeof value === "function"
      ) {

        return;

      }


      if (

        value === null ||

        typeof value === "number" ||

        typeof value === "boolean"

      ) {

        output[key] = value;

        return;

      }


      if (
        typeof value === "string"
      ) {

        output[key] =
          cleanString(
            value,
            1500
          );

        return;

      }


      try {

        output[key] =
          JSON.parse(
            JSON.stringify(value)
          );

      }

      catch (error) {

        output[key] =
          cleanString(
            value,
            500
          );

      }

    });


  return output;

}



function detectDeviceType() {

  const width =
    Math.max(

      window.innerWidth || 0,

      window.screen?.width || 0

    );


  if (width <= 767) {

    return "mobile";

  }


  if (width <= 1100) {

    return "tablet";

  }


  return "desktop";

}



function getCampaignData() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  return {

    utm_source:
      cleanString(
        params.get("utm_source") || "",
        120
      ),

    utm_medium:
      cleanString(
        params.get("utm_medium") || "",
        120
      ),

    utm_campaign:
      cleanString(
        params.get("utm_campaign") || "",
        160
      ),

    utm_content:
      cleanString(
        params.get("utm_content") || "",
        160
      ),

    utm_term:
      cleanString(
        params.get("utm_term") || "",
        160
      )

  };

}



/* ============================================================
   STATE
   ============================================================ */

const state = {

  configured:
    isFirebaseConfigured(),

  ready:
    false,

  app:
    null,

  auth:
    null,

  db:
    null,

  uid:
    null,

  sessionId:
    getSessionId(),

  sessionStart:
    getSessionStart(),

  queue:
    []

};



/* ============================================================
   EVENT TRACKING
   ============================================================ */

async function trackEvent(
  eventName,
  data = {}
) {

  /*
   * Firebase may still be loading when an event happens.
   * Store event temporarily and send it later.
   */

  if (
    !state.ready ||
    !state.db ||
    !state.uid
  ) {

    state.queue.push([
      eventName,
      data
    ]);


    if (
      state.queue.length > 100
    ) {

      state.queue.shift();

    }


    return;

  }


  try {

    await addDoc(

      collection(
        state.db,
        `${PREFIX}_Events`
      ),

      {

        eventName:
          cleanString(
            eventName,
            80
          ),

        sessionId:
          state.sessionId,

        uid:
          state.uid,

        path:
          window.location.pathname,

        language:
          document.documentElement.lang ||
          navigator.language ||
          "en",

        data:
          sanitizeData(data),

        createdAt:
          serverTimestamp()

      }

    );


    console.log(
      "[MORZÉA Firebase] Event:",
      eventName
    );

  }

  catch (error) {

    console.error(

      "[MORZÉA Firebase] Event write FAILED:",

      error.code,

      error.message,

      error

    );

  }

}



/* ============================================================
   LEADS
   ============================================================ */

async function registerLead(
  type,
  data = {}
) {

  if (
    !state.ready ||
    !state.db ||
    !state.uid
  ) {

    return;

  }


  try {

    await addDoc(

      collection(
        state.db,
        `${PREFIX}_Leads`
      ),

      {

        type:
          cleanString(
            type,
            60
          ),

        sessionId:
          state.sessionId,

        uid:
          state.uid,

        language:
          document.documentElement.lang ||
          navigator.language ||
          "en",

        ...sanitizeData(data),

        createdAt:
          serverTimestamp()

      }

    );


    console.log(
      "[MORZÉA Firebase] Lead saved:",
      type
    );

  }

  catch (error) {

    console.error(

      "[MORZÉA Firebase] Lead write FAILED:",

      error.code,

      error.message,

      error

    );

  }

}



/* ============================================================
   AI MESSAGE LOGGING
   ============================================================ */

async function registerAIMessage(
  role,
  content,
  extra = {}
) {

  if (
    !state.ready ||
    !state.db ||
    !state.uid
  ) {

    return;

  }


  try {

    /*
     * Individual AI message
     */

    await addDoc(

      collection(
        state.db,
        `${PREFIX}_AI_Messages`
      ),

      {

        sessionId:
          state.sessionId,

        uid:
          state.uid,

        role:
          cleanString(
            role,
            20
          ),

        content:
          cleanString(
            content,
            8000
          ),

        language:
          document.documentElement.lang ||
          navigator.language ||
          "en",

        ...sanitizeData(extra),

        createdAt:
          serverTimestamp()

      }

    );


    /*
     * AI session summary
     */

    await setDoc(

      doc(

        state.db,

        `${PREFIX}_AI_Sessions`,

        state.sessionId

      ),

      {

        sessionId:
          state.sessionId,

        uid:
          state.uid,

        lastRole:
          cleanString(
            role,
            20
          ),

        lastMessagePreview:
          cleanString(
            content,
            220
          ),

        language:
          document.documentElement.lang ||
          navigator.language ||
          "en",

        updatedAt:
          serverTimestamp()

      },

      {
        merge: true
      }

    );


    console.log(
      "[MORZÉA Firebase] AI message saved"
    );

  }

  catch (error) {

    console.error(

      "[MORZÉA Firebase] AI log FAILED:",

      error.code,

      error.message,

      error

    );

  }

}



/* ============================================================
   PUBLIC TELEMETRY API
   ============================================================ */

window.MORZEA_TELEMETRY = {

  get ready() {

    return state.ready;

  },


  get uid() {

    return state.uid;

  },


  get sessionId() {

    return state.sessionId;

  },


  track:
    trackEvent,


  lead:
    registerLead,


  aiMessage:
    registerAIMessage

};



/* ============================================================
   REGISTER VISITOR
   ============================================================ */

async function registerVisitor(user) {

  const campaign =
    getCampaignData();


  const visitorData = {

    sessionId:
      state.sessionId,

    uid:
      user.uid,

    firstPath:
      window.location.pathname,

    lastPath:
      window.location.pathname,

    referrer:
      cleanString(
        document.referrer,
        500
      ),

    language:

      document.documentElement.lang ||

      navigator.language ||

      "en",

    timezone:

      Intl
        .DateTimeFormat()
        .resolvedOptions()
        .timeZone || "",

    deviceType:
      detectDeviceType(),

    viewport:

      `${window.innerWidth}x${window.innerHeight}`,

    screen:

      `${window.screen?.width || 0}x${window.screen?.height || 0}`,

    userAgent:

      cleanString(
        navigator.userAgent,
        700
      ),

    platform:

      cleanString(
        navigator.platform || "",
        150
      ),

    campaign:
      campaign,

    consentVersion:

      telemetryCfg.consentVersion || "",

    lastSeenAt:
      serverTimestamp(),

    pageViews:
      increment(1)

  };


  try {

    await setDoc(

      doc(

        state.db,

        `${PREFIX}_Visitors`,

        state.sessionId

      ),

      visitorData,

      {
        merge: true
      }

    );


    console.log(

      "[MORZÉA Firebase] Visitor saved successfully:",

      state.sessionId

    );


    return true;

  }

  catch (error) {

    console.error(

      "[MORZÉA Firebase] Visitor write FAILED:",

      error.code,

      error.message,

      error

    );


    return false;

  }

}



/* ============================================================
   FLUSH QUEUED EVENTS
   ============================================================ */

async function flushEventQueue() {

  if (
    !state.ready ||
    state.queue.length === 0
  ) {

    return;

  }


  const events =
    state.queue.splice(0);


  for (
    const [eventName, payload]
    of events
  ) {

    await trackEvent(
      eventName,
      payload
    );

  }

}



/* ============================================================
   FIREBASE INITIALIZATION
   ============================================================ */

async function initializeMorzeaFirebase() {

  if (!state.configured) {

    console.error(
      "[MORZÉA Firebase] Firebase configuration is missing or invalid."
    );

    return;

  }


  try {

    /*
     * Initialize app once.
     */

    state.app =

      getApps().length

        ? getApps()[0]

        : initializeApp(
            firebaseCfg
          );


    /*
     * IMPORTANT:
     *
     * Your Firestore database ID is:
     *
     * default
     *
     * Therefore connect explicitly to it.
     */

    state.db =

      firebaseCfg.databaseId

        ? getFirestore(
            state.app,
            firebaseCfg.databaseId
          )

        : getFirestore(
            state.app
          );


    /*
     * Authentication
     */

    state.auth =
      getAuth(
        state.app
      );


    console.log(
      "[MORZÉA Firebase] Firebase initialized."
    );


    console.log(

      "[MORZÉA Firebase] Firestore database:",

      firebaseCfg.databaseId ||
      "(default)"

    );


    /*
     * Listen for login state.
     */

    onAuthStateChanged(

      state.auth,

      async user => {

        if (!user) {

          console.log(
            "[MORZÉA Firebase] Waiting for anonymous authentication..."
          );

          return;

        }


        state.uid =
          user.uid;


        state.ready =
          true;


        console.log(

          "[MORZÉA Firebase] Authenticated:",

          user.uid

        );


        /*
         * Register / update visitor.
         */

        const visitorSaved =
          await registerVisitor(user);


        if (!visitorSaved) {

          /*
           * Keep Firebase loaded,
           * but expose the write error in Console.
           */

          return;

        }


        /*
         * Register current page view.
         */

        await trackEvent(

          "page_view",

          {

            title:
              document.title,

            url:
              window.location.href,

            referrer:
              document.referrer,

            ...getCampaignData()

          }

        );


        /*
         * Flush any interactions that happened
         * before Firebase became ready.
         */

        await flushEventQueue();


        /*
         * Notify other MORZÉA modules.
         */

        window.dispatchEvent(

          new CustomEvent(

            "morzea:firebase-ready",

            {

              detail: {

                uid:
                  state.uid,

                sessionId:
                  state.sessionId

              }

            }

          )

        );


        console.log(
          "[MORZÉA Firebase] Ready."
        );

      }

    );


    /*
     * Create anonymous Firebase user when necessary.
     */

    if (!state.auth.currentUser) {

      console.log(
        "[MORZÉA Firebase] Starting anonymous authentication..."
      );


      await signInAnonymously(
        state.auth
      );

    }

  }

  catch (error) {

    console.error(

      "[MORZÉA Firebase] Initialization FAILED:",

      error.code,

      error.message,

      error

    );

  }

}



/* ============================================================
   PRODUCT VISIBILITY
   ============================================================ */

function setupProductVisibilityTracking() {

  if (
    !("IntersectionObserver" in window)
  ) {

    return;

  }


  const alreadySeen =
    new Set();


  const observer =
    new IntersectionObserver(

      entries => {

        entries.forEach(entry => {

          if (!entry.isIntersecting) {

            return;

          }


          const card =
            entry.target;


          const productId =

            card.getAttribute(
              "data-product-card"
            );


          if (
            !productId ||
            alreadySeen.has(productId)
          ) {

            return;

          }


          alreadySeen.add(
            productId
          );


          trackEvent(

            "product_card_view",

            {
              productId:
                productId
            }

          );

        });

      },

      {
        threshold: 0.55
      }

    );


  function observeProductCards() {

    document
      .querySelectorAll(
        "[data-product-card]"
      )
      .forEach(card => {

        observer.observe(card);

      });

  }


  observeProductCards();


  /*
   * Product cards may be rendered dynamically by app.js.
   */

  setTimeout(
    observeProductCards,
    900
  );

}



/* ============================================================
   INTERACTION TRACKING
   ============================================================ */

function setupInteractionTracking() {

  document.addEventListener(

    "click",

    event => {

      const element =
        event.target.closest(
          "button,a"
        );


      if (!element) {

        return;

      }


      /*
       * Product gallery thumbnail
       */

      if (
        element.matches(
          "[data-product-thumb]"
        )
      ) {

        trackEvent(

          "product_gallery_image",

          {

            productId:

              element.dataset
                .productThumb || "",

            imageIndex:

              Number(
                element.dataset
                  .imageIndex || 0
              )

          }

        );


        return;

      }


      /*
       * Determine current product card.
       */

      const productCard =

        element.closest(
          "[data-product-card]"
        );


      const productId =

        productCard?.dataset
          .productCard || "";


      const inlineHandler =

        element.getAttribute(
          "onclick"
        ) || "";


      /*
       * Add to bag
       */

      if (
        inlineHandler.includes(
          "add("
        )
      ) {

        const match =
          inlineHandler.match(
            /add\(['"]([^'"]+)/
          );


        trackEvent(

          "add_to_bag",

          {

            productId:

              match?.[1] ||
              productId

          }

        );


        return;

      }


      /*
       * Remove from bag
       */

      if (
        inlineHandler.includes(
          "removeItem("
        )
      ) {

        const match =
          inlineHandler.match(
            /removeItem\(['"]([^'"]+)/
          );


        trackEvent(

          "remove_from_bag",

          {
            productId:
              match?.[1] || ""
          }

        );


        return;

      }


      /*
       * Product modal
       */

      if (
        inlineHandler.includes(
          "openProduct("
        )
      ) {

        const match =
          inlineHandler.match(
            /openProduct\(['"]([^'"]+)/
          );


        trackEvent(

          "product_detail_open",

          {

            productId:

              match?.[1] ||
              productId

          }

        );


        return;

      }


      /*
       * Bag
       */

      if (
        element.matches(
          "[data-cart]"
        )
      ) {

        trackEvent(
          "bag_open"
        );


        return;

      }


      /*
       * Hero film
       */

      if (
        element.id ===
        "heroFilmControl"
      ) {

        trackEvent(
          "hero_film_restart"
        );


        return;

      }


      /*
       * Language
       */

      if (
        element.classList.contains(
          "lang"
        )
      ) {

        trackEvent(

          "language_switch",

          {

            from:

              document.documentElement
                .lang || "en"

          }

        );


        return;

      }


      /*
       * Checkout
       */

      if (
        element.matches(
          "[data-t='checkout']"
        )
      ) {

        trackEvent(
          "checkout_preview"
        );


        return;

      }

    },

    true

  );



  /*
   * Newsletter
   */

  document.addEventListener(

    "submit",

    event => {

      if (
        event.target?.id !==
        "news"
      ) {

        return;

      }


      const input =

        event.target.querySelector(
          "input[type='email']"
        );


      const email =

        cleanString(
          input?.value || "",
          320
        );


      if (!email) {

        return;

      }


      registerLead(

        "newsletter",

        {
          email:
            email
        }

      );


      trackEvent(

        "newsletter_submit",

        {
          hasEmail:
            true
        }

      );

    },

    true

  );

}



/* ============================================================
   FRONT-END ERROR TRACKING
   ============================================================ */

function setupErrorTracking() {

  window.addEventListener(

    "error",

    async event => {

      if (
        !state.ready ||
        !state.db ||
        !state.uid
      ) {

        return;

      }


      try {

        await addDoc(

          collection(
            state.db,
            `${PREFIX}_Errors`
          ),

          {

            sessionId:
              state.sessionId,

            uid:
              state.uid,

            message:

              cleanString(
                event.message,
                1200
              ),

            source:

              cleanString(
                event.filename,
                700
              ),

            line:
              event.lineno || 0,

            column:
              event.colno || 0,

            createdAt:
              serverTimestamp()

          }

        );

      }

      catch (error) {

        console.warn(
          "[MORZÉA Firebase] Error log failed",
          error
        );

      }

    }

  );


  window.addEventListener(

    "unhandledrejection",

    async event => {

      if (
        !state.ready ||
        !state.db ||
        !state.uid
      ) {

        return;

      }


      try {

        await addDoc(

          collection(
            state.db,
            `${PREFIX}_Errors`
          ),

          {

            sessionId:
              state.sessionId,

            uid:
              state.uid,

            message:

              cleanString(

                event.reason?.message ||

                event.reason ||

                "Unhandled promise rejection",

                1200

              ),

            source:
              "unhandledrejection",

            createdAt:
              serverTimestamp()

          }

        );

      }

      catch (error) {

        console.warn(
          "[MORZÉA Firebase] Promise error logging failed",
          error
        );

      }

    }

  );

}



/* ============================================================
   ENGAGEMENT
   ============================================================ */

function setupEngagementTracking() {

  const milestones = [
    30,
    60,
    180
  ];


  milestones.forEach(seconds => {

    setTimeout(

      () => {

        trackEvent(

          "engagement_milestone",

          {

            seconds:
              seconds,

            sessionAgeSeconds:

              Math.round(

                (
                  Date.now() -
                  state.sessionStart
                ) / 1000

              )

          }

        );

      },

      seconds * 1000

    );

  });

}



/* ============================================================
   START MORZÉA FIREBASE
   ============================================================ */

setupProductVisibilityTracking();

setupInteractionTracking();

setupErrorTracking();

setupEngagementTracking();

initializeMorzeaFirebase();
