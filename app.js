const products = [
  {
    id: "soap",
    order: "01",
    badge: "RITUAL 01 · SOFTEN",
    title: "Moroccan Black Soap",
    subtitle: "Authentic Moroccan beldi soap · 200 g",
    price: 110,
    description:
      "A premium visual presentation of MORZÉA Moroccan Black Soap with multiple still-life and usage images that highlight the jar, texture, finish, and ritual context.",
    images: [
      {
        src: "assets/img/morzea-soap-01.jpg",
        alt: "MORZÉA Moroccan Black Soap hero packshot"
      },
      {
        src: "assets/img/morzea-soap-02.jpg",
        alt: "MORZÉA Moroccan Black Soap open texture view"
      },
      {
        src: "assets/img/morzea-soap-03.jpg",
        alt: "Model using MORZÉA Moroccan Black Soap"
      }
    ],
    pills: ["3 Views", "Packshot", "Texture", "Usage"]
  },
  {
    id: "kessa",
    order: "02",
    badge: "RITUAL 02 · REVEAL",
    title: "Moroccan Kessa",
    subtitle: "Premium exfoliating Kessa · 1 glove",
    price: 65,
    description:
      "A refined multi-angle presentation of the MORZÉA Kessa glove showing the box, the textile detail, embroidered finish, and a ritual usage image with model.",
    images: [
      {
        src: "assets/img/morzea-kessa-01.jpg",
        alt: "MORZÉA Moroccan Kessa hero packshot"
      },
      {
        src: "assets/img/morzea-kessa-02.jpg",
        alt: "MORZÉA Moroccan Kessa detailed product view"
      },
      {
        src: "assets/img/morzea-kessa-03.jpg",
        alt: "Model using MORZÉA Moroccan Kessa"
      }
    ],
    pills: ["3 Views", "Packaging", "Texture", "Usage"]
  },
  {
    id: "argan",
    order: "03",
    badge: "RITUAL 03 · NOURISH",
    title: "Organic Argan Oil",
    subtitle: "Pure facial argan oil · 30 ml",
    price: 180,
    description:
      "A cinematic gallery for MORZÉA Organic Argan Oil highlighting the bottle design, premium materials, glass detail, dropper application, and luxury skincare ritual usage.",
    images: [
      {
        src: "assets/img/morzea-argan-01.jpg",
        alt: "MORZÉA Organic Argan Oil hero packshot"
      },
      {
        src: "assets/img/morzea-argan-02.jpg",
        alt: "MORZÉA Organic Argan Oil open bottle detailed view"
      },
      {
        src: "assets/img/morzea-argan-03.jpg",
        alt: "Model using MORZÉA Organic Argan Oil"
      }
    ],
    pills: ["3 Views", "Bottle", "Detail", "Usage"]
  }
];

const productsContainer = document.getElementById("products");
const overlay = document.getElementById("overlay");
const productModal = document.getElementById("productModal");
const modalMainImage = document.getElementById("modalMainImage");
const modalBadge = document.getElementById("modalBadge");
const modalTitle = document.getElementById("modalTitle");
const modalSubtitle = document.getElementById("modalSubtitle");
const modalPrice = document.getElementById("modalPrice");
const modalDescription = document.getElementById("modalDescription");
const modalThumbs = document.getElementById("modalThumbs");
const modalClose = document.getElementById("modalClose");
const modalAddBtn = document.getElementById("modalAddBtn");
const heroBagCount = document.getElementById("heroBagCount");
const heroBagBtn = document.getElementById("heroBagBtn");
const toast = document.getElementById("toast");

let cartCount = 0;
let activeProduct = null;
let activeModalImageIndex = 0;

function formatSAR(value) {
  return `${value} SAR`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function updateBagCount() {
  heroBagCount.textContent = cartCount;
}

function addToBag(product) {
  cartCount += 1;
  updateBagCount();
  showToast(`${product.title} added to bag`);
}

function renderProducts() {
  productsContainer.innerHTML = products.map((product) => {
    const thumbs = product.images.map((img, index) => `
      <button
        class="product-thumb ${index === 0 ? "active" : ""}"
        type="button"
        data-product-id="${product.id}"
        data-image-index="${index}"
        aria-label="Show image ${index + 1} for ${product.title}"
      >
        <img src="${img.src}" alt="${img.alt}">
      </button>
    `).join("");

    const pills = product.pills.map(item => `
      <span class="meta-pill">${item}</span>
    `).join("");

    return `
      <article class="product-card" data-card-id="${product.id}">
        <div class="product-card__media">
          <div class="product-order">${product.order}</div>

          <div class="product-card__hero">
            <img
              src="${product.images[0].src}"
              alt="${product.images[0].alt}"
              class="product-main-image"
              data-main-image="${product.id}"
            >
          </div>

          <div class="product-thumbs">
            ${thumbs}
          </div>
        </div>

        <div class="product-card__body">
          <div class="product-badge">${product.badge}</div>
          <h3 class="product-card__title">${product.title}</h3>
          <p class="product-card__subtitle">${product.subtitle}</p>

          <div class="product-card__meta">
            ${pills}
          </div>

          <div class="product-card__footer">
            <div class="product-price">${formatSAR(product.price)}</div>

            <div class="product-card__actions">
              <button
                class="btn btn-dark btn-small"
                type="button"
                data-add-id="${product.id}"
              >
                Add to bag
              </button>

              <button
                class="btn btn-small"
                type="button"
                data-view-id="${product.id}"
              >
                View details
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");

  bindProductEvents();
}

function bindProductEvents() {
  document.querySelectorAll(".product-thumb").forEach((btn) => {
    btn.addEventListener("click", () => {
      const productId = btn.dataset.productId;
      const imageIndex = Number(btn.dataset.imageIndex);
      switchCardImage(productId, imageIndex);
    });
  });

  document.querySelectorAll("[data-add-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const product = products.find(item => item.id === btn.dataset.addId);
      addToBag(product);
    });
  });

  document.querySelectorAll("[data-view-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const product = products.find(item => item.id === btn.dataset.viewId);
      openModal(product, 0);
    });
  });

  document.querySelectorAll("[data-main-image]").forEach((img) => {
    img.addEventListener("click", () => {
      const product = products.find(item => item.id === img.dataset.mainImage);
      openModal(product, 0);
    });
  });
}

function switchCardImage(productId, imageIndex) {
  const product = products.find(item => item.id === productId);
  if (!product) return;

  const card = document.querySelector(`[data-card-id="${productId}"]`);
  if (!card) return;

  const mainImage = card.querySelector(".product-main-image");
  mainImage.src = product.images[imageIndex].src;
  mainImage.alt = product.images[imageIndex].alt;

  card.querySelectorAll(".product-thumb").forEach((thumb) => {
    thumb.classList.toggle("active", Number(thumb.dataset.imageIndex) === imageIndex);
  });
}

function openModal(product, imageIndex = 0) {
  activeProduct = product;
  activeModalImageIndex = imageIndex;

  modalBadge.textContent = product.badge;
  modalTitle.textContent = product.title;
  modalSubtitle.textContent = product.subtitle;
  modalPrice.textContent = formatSAR(product.price);
  modalDescription.textContent = product.description;

  renderModalImage();
  renderModalThumbs();

  overlay.classList.add("open");
  productModal.classList.add("open");
  productModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function renderModalImage() {
  if (!activeProduct) return;
  const img = activeProduct.images[activeModalImageIndex];
  modalMainImage.src = img.src;
  modalMainImage.alt = img.alt;
}

function renderModalThumbs() {
  if (!activeProduct) return;

  modalThumbs.innerHTML = activeProduct.images.map((img, index) => `
    <button
      class="modal-thumb ${index === activeModalImageIndex ? "active" : ""}"
      type="button"
      data-modal-index="${index}"
      aria-label="Show modal image ${index + 1}"
    >
      <img src="${img.src}" alt="${img.alt}">
    </button>
  `).join("");

  modalThumbs.querySelectorAll("[data-modal-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeModalImageIndex = Number(btn.dataset.modalIndex);
      renderModalImage();
      renderModalThumbs();
    });
  });
}

function closeModal() {
  overlay.classList.remove("open");
  productModal.classList.remove("open");
  productModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  activeProduct = null;
}

overlay.addEventListener("click", closeModal);
modalClose.addEventListener("click", closeModal);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && productModal.classList.contains("open")) {
    closeModal();
  }
});

modalAddBtn.addEventListener("click", () => {
  if (!activeProduct) return;
  addToBag(activeProduct);
});

heroBagBtn.addEventListener("click", () => {
  showToast(`Bag items: ${cartCount}`);
});

renderProducts();
updateBagCount();
