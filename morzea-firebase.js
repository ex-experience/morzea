import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
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

const cfg = window.MORZEA_CONFIG || {};
const firebaseCfg = cfg.firebase || {};
const telemetryCfg = cfg.telemetry || {};

const PREFIX = telemetryCfg.collectionPrefix || "MORZEA";
const SESSION_KEY = "morzea-session-id";
const START_KEY = "morzea-session-start";

function configured() {
  const required = [
    firebaseCfg.apiKey,
    firebaseCfg.authDomain,
    firebaseCfg.projectId,
    firebaseCfg.appId
  ];
  return telemetryCfg.enabled !== false &&
    required.every(v => typeof v === "string" && v && !v.startsWith("PASTE_"));
}

function randomId() {
  if (crypto && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "m_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
}

function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = randomId();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function getSessionStart() {
  let value = Number(sessionStorage.getItem(START_KEY) || 0);
  if (!value) {
    value = Date.now();
    sessionStorage.setItem(START_KEY, String(value));
  }
  return value;
}

function cleanString(value, max = 500) {
  if (value == null) return "";
  return String(value).replace(/\s+/g, " ").trim().slice(0, max);
}

function compactData(input = {}) {
  const out = {};
  Object.entries(input).forEach(([k, v]) => {
    if (v === undefined || typeof v === "function") return;
    if (v === null || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
      return;
    }
    if (typeof v === "string") {
      out[k] = cleanString(v, 1500);
      return;
    }
    try {
      out[k] = JSON.parse(JSON.stringify(v));
    } catch (_) {
      out[k] = cleanString(v, 500);
    }
  });
  return out;
}

function deviceType() {
  const w = Math.max(window.innerWidth || 0, screen.width || 0);
  if (w <= 767) return "mobile";
  if (w <= 1100) return "tablet";
  return "desktop";
}

function campaignData() {
  const p = new URLSearchParams(location.search);
  return {
    utm_source: cleanString(p.get("utm_source") || "", 120),
    utm_medium: cleanString(p.get("utm_medium") || "", 120),
    utm_campaign: cleanString(p.get("utm_campaign") || "", 160),
    utm_content: cleanString(p.get("utm_content") || "", 160),
    utm_term: cleanString(p.get("utm_term") || "", 160)
  };
}

const state = {
  configured: configured(),
  ready: false,
  uid: null,
  db: null,
  auth: null,
  sessionId: getSessionId(),
  sessionStart: getSessionStart(),
  queue: []
};

async function trackNow(eventName, data = {}) {
  if (!state.ready || !state.db || !state.uid) {
    state.queue.push([eventName, data]);
    if (state.queue.length > 100) state.queue.shift();
    return;
  }

  try {
    await addDoc(collection(state.db, `${PREFIX}_Events`), {
      eventName: cleanString(eventName, 80),
      sessionId: state.sessionId,
      uid: state.uid,
      path: location.pathname,
      language: document.documentElement.lang || "en",
      data: compactData(data),
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn("[MORZÉA Firebase] event write failed", err);
  }
}

async function leadNow(type, data = {}) {
  if (!state.ready || !state.db || !state.uid) return;
  try {
    await addDoc(collection(state.db, `${PREFIX}_Leads`), {
      type: cleanString(type, 60),
      sessionId: state.sessionId,
      uid: state.uid,
      language: document.documentElement.lang || "en",
      ...compactData(data),
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn("[MORZÉA Firebase] lead write failed", err);
  }
}

async function aiMessageNow(role, content, extra = {}) {
  if (!state.ready || !state.db || !state.uid) return;

  try {
    await addDoc(collection(state.db, `${PREFIX}_AI_Messages`), {
      sessionId: state.sessionId,
      uid: state.uid,
      role: cleanString(role, 20),
      content: cleanString(content, 8000),
      language: document.documentElement.lang || "en",
      ...compactData(extra),
      createdAt: serverTimestamp()
    });

    await setDoc(doc(state.db, `${PREFIX}_AI_Sessions`, state.sessionId), {
      sessionId: state.sessionId,
      uid: state.uid,
      lastRole: cleanString(role, 20),
      lastMessagePreview: cleanString(content, 220),
      language: document.documentElement.lang || "en",
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn("[MORZÉA Firebase] AI log failed", err);
  }
}

window.MORZEA_TELEMETRY = {
  get ready() { return state.ready; },
  get uid() { return state.uid; },
  get sessionId() { return state.sessionId; },
  track: trackNow,
  lead: leadNow,
  aiMessage: aiMessageNow
};

async function init() {
  if (!state.configured) {
    console.info("[MORZÉA Firebase] Waiting for Firebase web configuration.");
    return;
  }

  try {
  state.db = getFirestore(
    app,
  firebaseCfg.databaseId || "default"
);

    onAuthStateChanged(state.auth, async user => {
      if (!user) return;

      state.uid = user.uid;
      state.ready = true;

      const visitor = {
        sessionId: state.sessionId,
        uid: user.uid,
        firstPath: location.pathname,
        lastPath: location.pathname,
        referrer: cleanString(document.referrer, 500),
        language: document.documentElement.lang || navigator.language || "en",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
        deviceType: deviceType(),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        screen: `${screen.width}x${screen.height}`,
        userAgent: cleanString(navigator.userAgent, 700),
        campaign: campaignData(),
        consentVersion: telemetryCfg.consentVersion || "",
        lastSeenAt: serverTimestamp(),
        pageViews: increment(1)
      };

      await setDoc(doc(state.db, `${PREFIX}_Visitors`, state.sessionId), visitor, { merge: true });

      await trackNow("page_view", {
        title: document.title,
        url: location.href,
        referrer: document.referrer,
        ...campaignData()
      });

      const queued = state.queue.splice(0);
      for (const [name, payload] of queued) {
        await trackNow(name, payload);
      }

      window.dispatchEvent(new CustomEvent("morzea:firebase-ready", {
        detail: { uid: state.uid, sessionId: state.sessionId }
      }));
    });

    if (!state.auth.currentUser) {
      await signInAnonymously(state.auth);
    }
  } catch (err) {
    console.error("[MORZÉA Firebase] init failed", err);
  }
}

// Product visibility once per page
function wireProductVisibility() {
  if (!("IntersectionObserver" in window)) return;

  const seen = new Set();
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const card = entry.target;
      const id = card.getAttribute("data-product-card");
      if (!id || seen.has(id)) return;
      seen.add(id);
      trackNow("product_card_view", { productId: id });
    });
  }, { threshold: 0.55 });

  const observe = () => {
    document.querySelectorAll("[data-product-card]").forEach(el => io.observe(el));
  };

  observe();
  setTimeout(observe, 800);
}

// Capture user actions without changing the existing commerce code.
function wireInteractionCapture() {
  document.addEventListener("click", event => {
    const el = event.target.closest("button,a");
    if (!el) return;

    if (el.matches("[data-product-thumb]")) {
      trackNow("product_gallery_image", {
        productId: el.dataset.productThumb || "",
        imageIndex: Number(el.dataset.imageIndex || 0)
      });
      return;
    }

    const card = el.closest("[data-product-card]");
    const productId = card?.dataset.productCard || "";

    const onclick = el.getAttribute("onclick") || "";

    if (onclick.includes("add(")) {
      const match = onclick.match(/add\(['"]([^'"]+)/);
      trackNow("add_to_bag", { productId: match?.[1] || productId });
      return;
    }

    if (onclick.includes("removeItem(")) {
      const match = onclick.match(/removeItem\(['"]([^'"]+)/);
      trackNow("remove_from_bag", { productId: match?.[1] || "" });
      return;
    }

    if (onclick.includes("openProduct(")) {
      const match = onclick.match(/openProduct\(['"]([^'"]+)/);
      trackNow("product_detail_open", { productId: match?.[1] || productId });
      return;
    }

    if (el.matches("[data-cart]")) {
      trackNow("bag_open");
      return;
    }

    if (el.id === "heroFilmControl") {
      trackNow("hero_film_restart");
      return;
    }

    if (el.classList.contains("lang")) {
      trackNow("language_switch", {
        from: document.documentElement.lang || "en"
      });
      return;
    }

    if (el.matches("[data-t='checkout']")) {
      trackNow("checkout_preview");
      return;
    }
  }, true);

  document.addEventListener("submit", event => {
    if (event.target?.id !== "news") return;
    const input = event.target.querySelector("input[type='email']");
    const email = cleanString(input?.value || "", 320);
    if (email) {
      leadNow("newsletter", { email });
      trackNow("newsletter_submit", { hasEmail: true });
    }
  }, true);
}

function wireErrors() {
  window.addEventListener("error", async event => {
    if (!state.ready || !state.db || !state.uid) return;
    try {
      await addDoc(collection(state.db, `${PREFIX}_Errors`), {
        sessionId: state.sessionId,
        uid: state.uid,
        message: cleanString(event.message, 1200),
        source: cleanString(event.filename, 700),
        line: event.lineno || 0,
        column: event.colno || 0,
        createdAt: serverTimestamp()
      });
    } catch (_) {}
  });

  window.addEventListener("unhandledrejection", async event => {
    if (!state.ready || !state.db || !state.uid) return;
    try {
      await addDoc(collection(state.db, `${PREFIX}_Errors`), {
        sessionId: state.sessionId,
        uid: state.uid,
        message: cleanString(event.reason?.message || event.reason || "Unhandled promise rejection", 1200),
        source: "unhandledrejection",
        createdAt: serverTimestamp()
      });
    } catch (_) {}
  });
}

function wireEngagementMilestones() {
  [30, 60, 180].forEach(seconds => {
    setTimeout(() => {
      trackNow("engagement_milestone", {
        seconds,
        sessionAgeSeconds: Math.round((Date.now() - state.sessionStart) / 1000)
      });
    }, seconds * 1000);
  });
}

wireProductVisibility();
wireInteractionCapture();
wireErrors();
wireEngagementMilestones();
init();
