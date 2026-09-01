(() => {
  "use strict";

  const launcher = document.querySelector("#morzea-chat-launcher");
  const dialog = document.querySelector("#morzea-chat-dialog");
  const closeButton = document.querySelector("#morzea-chat-close");
  const form = document.querySelector("#morzea-chat-form");
  const input = document.querySelector("#morzea-chat-input");
  const submit = document.querySelector("#morzea-chat-submit");
  const log = document.querySelector("#morzea-chat-log");

  if (!launcher || !dialog || !form || !input || !submit || !log) return;

  const storageKey = "morzea-chat-history-v1";
  let history = [];

  try {
    history = JSON.parse(sessionStorage.getItem(storageKey) || "[]").slice(-12);
  } catch {
    history = [];
  }

  function addMessage(role, text, save = true) {
    const item = document.createElement("div");
    item.className = `morzea-chat-message ${role}`;
    item.textContent = text;
    log.appendChild(item);
    log.scrollTop = log.scrollHeight;

    if (save) {
      history.push({ role, text });
      history = history.slice(-12);
      sessionStorage.setItem(storageKey, JSON.stringify(history));
    }
  }

  history.forEach(item => addMessage(item.role, item.text, false));

  if (!history.length) {
    addMessage(
      "assistant",
      "مرحباً! أنا مساعد MORZÉA. اسألني عن زيت الأركان أو الصابون البلدي أو الليفة المغربية."
    );
  }

  launcher.addEventListener("click", () => {
    dialog.showModal();
    input.focus();
  });

  closeButton.addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const message = input.value.trim();
    if (!message || message.length > 1000) return;

    const functionUrl = window.MORZEA_CHAT_CONFIG?.functionUrl;
    if (!functionUrl) {
      addMessage("assistant", "المساعد غير مهيأ حالياً.");
      return;
    }

    addMessage("user", message);
    input.value = "";
    input.disabled = true;
    submit.disabled = true;
    submit.textContent = "…";
    log.setAttribute("aria-busy", "true");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);

    try {
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        signal: controller.signal
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      addMessage("assistant", data.reply || "لم يصل رد حالياً.");
    } catch (error) {
      addMessage(
        "assistant",
        error.name === "AbortError"
          ? "انتهت مهلة الطلب. حاول مجدداً."
          : "تعذر الاتصال بالمساعد. حاول لاحقاً."
      );
    } finally {
      clearTimeout(timeout);
      input.disabled = false;
      submit.disabled = false;
      submit.textContent = "إرسال";
      log.removeAttribute("aria-busy");
      input.focus();
    }
  });
})();