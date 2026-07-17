const body = document.body;
const header = document.querySelector("[data-header]");
const nav = document.querySelector(".site-nav");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = [...document.querySelectorAll("[data-nav-link]")];
const sections = [...document.querySelectorAll("[data-section]")];
const productCards = [...document.querySelectorAll("[data-product-card]")];
const cartButton = document.querySelector("[data-cart-button]");
const cartCount = document.querySelector("[data-cart-count]");
const toast = document.querySelector("[data-toast]");
const year = document.querySelector("[data-current-year]");
const mobileQuery = window.matchMedia("(max-width: 960px)");

let selectedCard = null;
let toastTimer;

function setMenuState(isOpen) {
  body.classList.toggle("menu-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");

  if (mobileQuery.matches) {
    nav.setAttribute("aria-hidden", String(!isOpen));
    nav.toggleAttribute("inert", !isOpen);
  } else {
    nav.removeAttribute("aria-hidden");
    nav.removeAttribute("inert");
  }
}

function closeMenu() {
  setMenuState(false);
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");

  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2800);
}

function updateCart(count, productName = "") {
  cartCount.textContent = String(count);
  cartButton.setAttribute(
    "aria-label",
    count === 0
      ? "Carrinho, nenhum item"
      : `Carrinho, ${count} item: ${productName}`
  );
}

function selectProduct(card) {
  const button = card.querySelector("[data-select-product]");
  const productName = card.dataset.product;
  const isAlreadySelected = selectedCard === card;

  productCards.forEach((item) => {
    item.classList.remove("is-selected");
    item.querySelector("[data-select-product]").setAttribute("aria-pressed", "false");
    item.querySelector("[data-select-product]").textContent = "Escolher modelo";
  });

  if (isAlreadySelected) {
    selectedCard = null;
    updateCart(0);
    showToast(`${productName} removida da seleção.`);
    return;
  }

  selectedCard = card;
  card.classList.add("is-selected");
  button.setAttribute("aria-pressed", "true");
  button.textContent = "Modelo selecionado";
  updateCart(1, productName);
  showToast(`${productName} selecionada. Agora você pode personalizar.`);
}

function handleBreakpointChange() {
  closeMenu();
}

navToggle.addEventListener("click", () => {
  const isOpen = navToggle.getAttribute("aria-expanded") !== "true";
  setMenuState(isOpen);
});

navLinks.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && body.classList.contains("menu-open")) {
    closeMenu();
    navToggle.focus();
  }
});

document.addEventListener("click", (event) => {
  if (
    body.classList.contains("menu-open") &&
    !nav.contains(event.target) &&
    !navToggle.contains(event.target)
  ) {
    closeMenu();
  }
});

mobileQuery.addEventListener("change", handleBreakpointChange);

window.addEventListener(
  "scroll",
  () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  },
  { passive: true }
);

const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visibleSection = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visibleSection) return;

    navLinks.forEach((link) => {
      const targetId = link.getAttribute("href").slice(1);
      link.classList.toggle("is-active", targetId === visibleSection.target.id);
    });
  },
  {
    rootMargin: "-20% 0px -65% 0px",
    threshold: [0.05, 0.25, 0.5]
  }
);

sections.forEach((section) => sectionObserver.observe(section));

document.querySelectorAll(".swatch").forEach((swatch) => {
  swatch.addEventListener("click", () => {
    const card = swatch.closest("[data-product-card]");
    const cardSwatches = card.querySelectorAll(".swatch");
    const colorName = swatch.dataset.colorName;

    cardSwatches.forEach((item) => {
      item.classList.remove("is-selected");
      item.setAttribute("aria-pressed", "false");
    });

    swatch.classList.add("is-selected");
    swatch.setAttribute("aria-pressed", "true");
    card.style.setProperty("--shirt-color", swatch.dataset.shirtColor);
    card.style.setProperty("--shirt-accent", swatch.dataset.shirtAccent);
    showToast(`Cor ${colorName} aplicada em ${card.dataset.product}.`);
  });
});

document.querySelectorAll("[data-select-product]").forEach((button) => {
  button.addEventListener("click", () => {
    selectProduct(button.closest("[data-product-card]"));
  });
});

document.querySelectorAll(".favorite-button").forEach((button) => {
  button.addEventListener("click", () => {
    const isFavorite = button.getAttribute("aria-pressed") === "true";
    const productName = button.closest("[data-product-card]").dataset.product;

    button.setAttribute("aria-pressed", String(!isFavorite));
    button.textContent = isFavorite ? "♡" : "♥";
    button.setAttribute(
      "aria-label",
      `${isFavorite ? "Favoritar" : "Remover dos favoritos"} ${productName}`
    );
    showToast(
      isFavorite
        ? `${productName} removida dos favoritos.`
        : `${productName} adicionada aos favoritos.`
    );
  });
});

cartButton.addEventListener("click", () => {
  if (!selectedCard) {
    showToast("Seu carrinho está vazio. Escolha um modelo para começar.");
    document.querySelector("#modelos").scrollIntoView({ behavior: "smooth" });
    return;
  }

  selectedCard.scrollIntoView({ behavior: "smooth", block: "center" });
  showToast(`${selectedCard.dataset.product} está pronta para personalizar.`);
});

year.textContent = String(new Date().getFullYear());
setMenuState(false);
