(() => {
  "use strict";

  const html = document.documentElement;

  function synchronizeDirection() {
    const language = (html.lang || "en").toLowerCase();
    html.dir = language.startsWith("ar") ? "rtl" : "ltr";
  }

  synchronizeDirection();

  new MutationObserver(synchronizeDirection).observe(html, {
    attributes: true,
    attributeFilter: ["lang"]
  });

  document.querySelectorAll("img").forEach((image, index) => {
    image.decoding = "async";

    if (index > 0 && !image.hasAttribute("loading")) {
      image.loading = "lazy";
    }
  });

  document.querySelectorAll("video").forEach(video => {
    video.preload = "metadata";
    video.playsInline = true;
  });

  document.querySelectorAll('a[target="_blank"]').forEach(link => {
    link.rel = "noopener noreferrer";
  });

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  function handleMotionPreference(event) {
    if (!event.matches) return;

    document.querySelectorAll("video[autoplay]").forEach(video => {
      video.pause();
      video.removeAttribute("autoplay");
    });
  }

  handleMotionPreference(reducedMotion);
  reducedMotion.addEventListener?.("change", handleMotionPreference);
})();