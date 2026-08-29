const cfg = window.MORZEA_CONFIG || {};
const agentCfg = cfg.agent || {};
const telemetry = () => window.MORZEA_TELEMETRY;

function isConfigured() {
  return agentCfg.enabled !== false &&
    typeof agentCfg.endpoint === "string" &&
    agentCfg.endpoint.startsWith("https://script.google.com/macros/s/") &&
    agentCfg.endpoint.endsWith("/exec");
}

if (!isConfigured()) {
  console.info("[MORZÉA Agent] Waiting for deployed Apps Script /exec URL.");
} else {
  boot();
}

function boot() {
  const root = document.createElement("div");
  root.className = "morzea-ai";
  root.innerHTML = `
    <button class="morzea-ai__launcher" type="button" aria-label="Open MORZÉA concierge" aria-expanded="false">
      <span class="morzea-ai__mark">M</span>
      <span class="morzea-ai__launcher-copy">
        <b>MORZÉA CONCIERGE</b>
        <small>Ritual · Origin · Products</small>
      </span>
      <span class="morzea-ai__status" aria-hidden="true"></span>
    </button>

    <section class="morzea-ai__panel" aria-label="MORZÉA intelligent concierge" aria-hidden="true">
      <header class="morzea-ai__head">
        <div>
          <span class="morzea-ai__eyebrow">MORZÉA / INTELLIGENT CONCIERGE</span>
          <h2>MORZÉA</h2>
          <p>Origin. Ritual. Product knowledge.</p>
        </div>
        <button class="morzea-ai__close" type="button" aria-label="Close">×</button>
      </header>

      <div class="morzea-ai__messages" role="log" aria-live="polite"></div>

      <div class="morzea-ai__quick"></div>

      <form class="morzea-ai__form">
        <textarea
          class="morzea-ai__input"
          rows="1"
          maxlength="${Number(agentCfg.maxMessageChars || 2500)}"
          placeholder="Ask about MORZÉA, Moroccan ritual, argan, black soap or Kessa..."
          aria-label="Message"
        ></textarea>
        <button class="morzea-ai__send" type="submit" aria-label="Send">
          <span>→</span>
        </button>
      </form>

      <p class="morzea-ai__privacy">
        Conversations may be recorded in MORZÉA service logs to improve support.
        Product-origin, organic and efficacy claims remain subject to final documentation.
      </p>
    </section>
  `;

  document.body.appendChild(root);

  const launcher = root.querySelector(".morzea-ai__launcher");
  const panel = root.querySelector(".morzea-ai__panel");
  const close = root.querySelector(".morzea-ai__close");
  const messages = root.querySelector(".morzea-ai__messages");
  const form = root.querySelector(".morzea-ai__form");
  const input = root.querySelector(".morzea-ai__input");
  const send = root.querySelector(".morzea-ai__send");
  const quick = root.querySelector(".morzea-ai__quick");

  const historyKey = "morzea-ai-history-v1";
  let history = loadHistory();

  function lang() {
    return document.documentElement.lang === "ar" ? "ar" : "en";
  }

  function texts() {
    if (lang() === "ar") {
      return {
        welcome: "مرحبًا بك في MORZÉA. اسألني عن الطقس المغربي، منتجات الدار، الأرجان، الصابون البلدي أو الليفة، وسأميز بوضوح بين قصة العلامة والحقائق التي تتطلب مصدرًا أو توثيقًا.",
        placeholder: "اسأل عن MORZÉA أو الطقس المغربي أو المنتجات...",
        quick: [
          "ما هو طقس MORZÉA من 3 خطوات؟",
          "ما الفرق بين زيت الأرجان التجميلي والغذائي؟",
          "كيف أستخدم الصابون والليفة معًا؟"
        ],
        error: "تعذر الوصول إلى المساعد الآن. حاول مرة أخرى بعد لحظات.",
        thinking: "أتحقق من المعلومة…"
      };
    }
    return {
      welcome: "Welcome to MORZÉA. Ask about the Moroccan ritual, the house, argan oil, black soap or Kessa. I distinguish brand narrative from facts that require evidence.",
      placeholder: "Ask about MORZÉA, Moroccan ritual or products...",
      quick: [
        "What is the 3-step MORZÉA ritual?",
        "Cosmetic vs culinary argan oil?",
        "How do I use black soap with Kessa?"
      ],
      error: "The concierge is temporarily unavailable. Please try again shortly.",
      thinking: "Checking the evidence…"
    };
  }

  function refreshLanguage() {
    const t = texts();
    input.placeholder = t.placeholder;
    quick.innerHTML = "";
    t.quick.forEach(label => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.addEventListener("click", () => {
        input.value = label;
        input.focus();
      });
      quick.appendChild(btn);
    });
  }

  function loadHistory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(historyKey) || "[]");
      return Array.isArray(parsed) ? parsed.slice(-Number(agentCfg.maxHistoryMessages || 8)) : [];
    } catch (_) {
      return [];
    }
  }

  function saveHistory() {
    const max = Number(agentCfg.maxHistoryMessages || 8);
    history = history.slice(-max);
    localStorage.setItem(historyKey, JSON.stringify(history));
  }

  function openPanel() {
    root.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    launcher.setAttribute("aria-expanded", "true");
    telemetry()?.track?.("ai_open");
    input.focus();
  }

  function closePanel() {
    root.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    launcher.setAttribute("aria-expanded", "false");
    telemetry()?.track?.("ai_close");
  }

  function message(role, text, sources = []) {
    const item = document.createElement("article");
    item.className = `morzea-ai__message morzea-ai__message--${role}`;

    const body = document.createElement("div");
    body.className = "morzea-ai__bubble";
    body.textContent = text;
    item.appendChild(body);

    if (Array.isArray(sources) && sources.length) {
      const sourceBox = document.createElement("div");
      sourceBox.className = "morzea-ai__sources";

      const title = document.createElement("span");
      title.textContent = lang() === "ar" ? "المصادر" : "Sources";
      sourceBox.appendChild(title);

      sources.slice(0, 6).forEach(source => {
        if (!source?.url) return;
        const a = document.createElement("a");
        a.href = source.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = source.title || new URL(source.url).hostname;
        sourceBox.appendChild(a);
      });

      item.appendChild(sourceBox);
    }

    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
    return item;
  }

  async function ask(text) {
    const t = texts();
    const cleaned = String(text || "").trim().slice(0, Number(agentCfg.maxMessageChars || 2500));
    if (!cleaned) return;

    input.value = "";
    message("user", cleaned);
    telemetry()?.track?.("ai_question", { chars: cleaned.length });
    telemetry()?.aiMessage?.("user", cleaned);

    const waiting = message("assistant", t.thinking);
    waiting.classList.add("is-thinking");

    send.disabled = true;
    input.disabled = true;

    try {
      const requestHistory = history.slice(-Number(agentCfg.maxHistoryMessages || 8));

      const response = await fetch(agentCfg.endpoint, {
        method: "POST",
        redirect: "follow",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          site: agentCfg.siteId || "morzea-web-v1",
          message: cleaned,
          lang: lang(),
          sessionId: telemetry()?.sessionId || localStorage.getItem("morzea-session-id") || "",
          history: requestHistory,
          page: {
            title: document.title,
            url: location.href,
            path: location.pathname
          }
        })
      });

      const data = await response.json();

      if (!response.ok || !data.ok || !data.answer) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      waiting.remove();
      message("assistant", data.answer, data.sources || []);

      history.push({ role: "user", content: cleaned });
      history.push({ role: "assistant", content: data.answer });
      saveHistory();

      telemetry()?.aiMessage?.("assistant", data.answer, {
        model: data.model || "",
        sourceCount: Array.isArray(data.sources) ? data.sources.length : 0
      });
      telemetry()?.track?.("ai_answer", {
        model: data.model || "",
        sourceCount: Array.isArray(data.sources) ? data.sources.length : 0
      });
    } catch (err) {
      console.error("[MORZÉA Agent]", err);
      waiting.remove();
      message("assistant", t.error);
      telemetry()?.track?.("ai_error", { message: err.message || String(err) });
    } finally {
      send.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }

  launcher.addEventListener("click", () => {
    root.classList.contains("is-open") ? closePanel() : openPanel();
  });

  close.addEventListener("click", closePanel);

  form.addEventListener("submit", event => {
    event.preventDefault();
    ask(input.value);
  });

  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  const observer = new MutationObserver(refreshLanguage);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  refreshLanguage();

  if (!history.length) {
    message("assistant", texts().welcome);
  } else {
    history.slice(-6).forEach(item => message(item.role === "user" ? "user" : "assistant", item.content));
  }
}
