(() => {
  "use strict";

  const config = window.MORZEA_CONFIG?.agent || {};
  const endpoint = String(config.endpoint || "");
  const allowedEndpoint =
    /^https:\/\/[a-z0-9]+\.supabase\.co\/functions\/v1\/chat$/.test(endpoint);

  if (config.enabled === false || !allowedEndpoint) {
    console.info("[MORZÉA Agent] Backend is not configured.");
    return;
  }

  const root = document.createElement("div");
  root.className = "morzea-ai";
  root.innerHTML = `
    <button class="morzea-ai__launcher" type="button"
      aria-label="فتح مساعد MORZÉA"
      aria-expanded="false">
      <span class="morzea-ai__mark">M</span>
      <span class="morzea-ai__launcher-copy">
        <b>MORZÉA CONCIERGE</b>
        <small>Ritual · Origin · Products</small>
      </span>
      <span class="morzea-ai__status" aria-hidden="true"></span>
    </button>

    <section class="morzea-ai__panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="morzea-agent-title"
      aria-hidden="true">

      <header class="morzea-ai__head">
        <div>
          <span class="morzea-ai__eyebrow">
            MORZÉA / INTELLIGENT CONCIERGE
          </span>
          <h2 id="morzea-agent-title">MORZÉA</h2>
          <p>Origin. Ritual. Product knowledge.</p>
        </div>
        <button class="morzea-ai__close" type="button"
          aria-label="إغلاق المساعد">×</button>
      </header>

      <div class="morzea-ai__messages"
        role="log"
        aria-live="polite"
        aria-relevant="additions"></div>

      <div class="morzea-ai__quick"></div>

      <form class="morzea-ai__form">
        <label class="morzea-ai__sr-only" for="morzea-agent-input">
          اكتب رسالتك
        </label>
        <textarea id="morzea-agent-input"
          class="morzea-ai__input"
          rows="1"
          maxlength="1000"
          autocomplete="off"
          placeholder="اسأل عن منتجات MORZÉA"></textarea>

        <button class="morzea-ai__send" type="submit"
          aria-label="إرسال">
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <p class="morzea-ai__privacy">
        معلومات المنتجات إرشادية ولا تمثل تشخيصاً أو نصيحة طبية.
      </p>
    </section>
  `;

  document.body.appendChild(root);

  const launcher = root.querySelector(".morzea-ai__launcher");
  const panel = root.querySelector(".morzea-ai__panel");
  const closeButton = root.querySelector(".morzea-ai__close");
  const messages = root.querySelector(".morzea-ai__messages");
  const quick = root.querySelector(".morzea-ai__quick");
  const form = root.querySelector(".morzea-ai__form");
  const input = root.querySelector(".morzea-ai__input");
  const send = root.querySelector(".morzea-ai__send");

  const storageKey = "morzea-agent-session-v2";
  let history = [];

  try {
    history = JSON.parse(sessionStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(history)) history = [];
    history = history.slice(-8);
  } catch {
    history = [];
  }

  function isArabic() {
    return document.documentElement.lang === "ar";
  }

  function text() {
    return isArabic()
      ? {
          welcome:
            "مرحباً بك في MORZÉA. اسألني عن زيت الأركان أو الصابون البلدي أو الليفة المغربية الفاخرة.",
          error:
            "تعذر الوصول إلى المساعد مؤقتاً. يرجى المحاولة مرة أخرى.",
          timeout:
            "استغرق الرد وقتاً أطول من المتوقع. حاول مجدداً.",
          thinking: "جارٍ تحضير الإجابة…",
          placeholder: "اسأل عن منتجات MORZÉA",
          quick: [
            "ما سعر زيت الأركان؟",
            "كيف أستخدم الصابون البلدي والليفة؟",
            "ما هو طقس MORZÉA المغربي؟"
          ]
        }
      : {
          welcome:
            "Welcome to MORZÉA. Ask about argan oil, Moroccan black soap, or the luxury Kessa.",
          error:
            "The concierge is temporarily unavailable. Please try again.",
          timeout:
            "The response took too long. Please try again.",
          thinking: "Preparing the answer…",
          placeholder: "Ask about MORZÉA products",
          quick: [
            "What is the price of argan oil?",
            "How do I use black soap and Kessa?",
            "What is the MORZÉA ritual?"
          ]
        };
  }

  function saveHistory() {
    history = history.slice(-8);
    sessionStorage.setItem(storageKey, JSON.stringify(history));
  }

  function addMessage(role, value, save = true) {
    const item = document.createElement("div");
    item.className = `morzea-ai__message morzea-ai__message--${role}`;
    item.textContent = value;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;

    if (save) {
      history.push({ role, text: value });
      saveHistory();
    }

    return item;
  }

  function refreshLanguage() {
    const content = text();
    input.placeholder = content.placeholder;
    root.dir = isArabic() ? "rtl" : "ltr";
    quick.replaceChildren();

    content.quick.forEach(label => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", () => {
        input.value = label;
        input.focus();
      });
      quick.appendChild(button);
    });
  }

  function openPanel() {
    root.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    launcher.setAttribute("aria-expanded", "true");
    document.body.classList.add("morzea-agent-open");
    setTimeout(() => input.focus(), 50);
  }

  function closePanel() {
    root.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    launcher.setAttribute("aria-expanded", "false");
    document.body.classList.remove("morzea-agent-open");
    launcher.focus();
  }

  async function requestReply(message, attempt = 0) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        signal: controller.signal
      });

      if (response.status >= 500 && attempt === 0) {
        await new Promise(resolve => setTimeout(resolve, 900));
        return requestReply(message, 1);
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (!data.reply || typeof data.reply !== "string") {
        throw new Error("Empty response");
      }

      return data.reply.trim();
    } catch (error) {
      if (error.name === "AbortError" && attempt === 0) {
        return requestReply(message, 1);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  launcher.addEventListener("click", openPanel);
  closeButton.addEventListener("click", closePanel);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && root.classList.contains("is-open")) {
      closePanel();
    }
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const message = input.value.trim();
    if (!message || send.disabled) return;

    addMessage("user", message);
    input.value = "";
    input.disabled = true;
    send.disabled = true;
    panel.setAttribute("aria-busy", "true");

    const thinking = addMessage("assistant", text().thinking, false);

    try {
      const reply = await requestReply(message);
      thinking.remove();
      addMessage("assistant", reply);
    } catch (error) {
      thinking.remove();
      addMessage(
        "assistant",
        error.name === "AbortError" ? text().timeout : text().error
      );
    } finally {
      input.disabled = false;
      send.disabled = false;
      panel.removeAttribute("aria-busy");
      input.focus();
    }
  });

  history.forEach(item => addMessage(item.role, item.text, false));

  if (!history.length) {
    addMessage("assistant", text().welcome);
  }

  refreshLanguage();

  new MutationObserver(refreshLanguage).observe(
    document.documentElement,
    { attributes: true, attributeFilter: ["lang", "dir"] }
  );
})();