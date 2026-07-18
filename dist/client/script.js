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
const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const heroProduct = document.querySelector("[data-hero-product]");
const tiltCard = document.querySelector("[data-tilt-card]");

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

function resetPointerEffect(element, variables, activeClass) {
  element.classList.remove(activeClass);

  Object.entries(variables).forEach(([name, value]) => {
    element.style.setProperty(name, value);
  });
}

function enablePointerEffect(element, options) {
  if (!element) return;

  let frameId = 0;
  let pointerX = 0.5;
  let pointerY = 0.5;

  const reset = () => {
    window.cancelAnimationFrame(frameId);
    frameId = 0;
    resetPointerEffect(element, options.reset, options.activeClass);
  };

  const render = () => {
    frameId = 0;

    if (!finePointerQuery.matches || reducedMotionQuery.matches) {
      reset();
      return;
    }

    const rotateX = (0.5 - pointerY) * options.maxRotateX;
    const rotateY = (pointerX - 0.5) * options.maxRotateY;
    const shiftX = (pointerX - 0.5) * options.maxShiftX;
    const shiftY = (pointerY - 0.5) * options.maxShiftY;

    element.classList.add(options.activeClass);
    element.style.setProperty(options.rotateXVariable, `${rotateX.toFixed(2)}deg`);
    element.style.setProperty(options.rotateYVariable, `${rotateY.toFixed(2)}deg`);

    if (options.shiftXVariable) {
      element.style.setProperty(options.shiftXVariable, `${shiftX.toFixed(2)}px`);
      element.style.setProperty(options.shiftYVariable, `${shiftY.toFixed(2)}px`);
    }

    element.style.setProperty(options.glowXVariable, `${(pointerX * 100).toFixed(1)}%`);
    element.style.setProperty(options.glowYVariable, `${(pointerY * 100).toFixed(1)}%`);
  };

  element.addEventListener("pointermove", (event) => {
    if (!finePointerQuery.matches || reducedMotionQuery.matches) return;

    const rect = element.getBoundingClientRect();
    pointerX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    pointerY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));

    if (!frameId) {
      frameId = window.requestAnimationFrame(render);
    }
  });

  element.addEventListener("pointerleave", reset);
  reducedMotionQuery.addEventListener("change", reset);
  finePointerQuery.addEventListener("change", reset);
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

enablePointerEffect(heroProduct, {
  activeClass: "is-hovering",
  maxRotateX: 7,
  maxRotateY: 10,
  maxShiftX: 16,
  maxShiftY: 10,
  rotateXVariable: "--product-tilt-x",
  rotateYVariable: "--product-tilt-y",
  shiftXVariable: "--product-shift-x",
  shiftYVariable: "--product-shift-y",
  glowXVariable: "--product-glow-x",
  glowYVariable: "--product-glow-y",
  reset: {
    "--product-tilt-x": "0deg",
    "--product-tilt-y": "0deg",
    "--product-shift-x": "0px",
    "--product-shift-y": "0px",
    "--product-glow-x": "50%",
    "--product-glow-y": "50%"
  }
});

enablePointerEffect(tiltCard, {
  activeClass: "is-tilting",
  maxRotateX: 12,
  maxRotateY: 14,
  maxShiftX: 0,
  maxShiftY: 0,
  rotateXVariable: "--card-tilt-x",
  rotateYVariable: "--card-tilt-y",
  glowXVariable: "--card-glow-x",
  glowYVariable: "--card-glow-y",
  reset: {
    "--card-tilt-x": "0deg",
    "--card-tilt-y": "0deg",
    "--card-glow-x": "50%",
    "--card-glow-y": "50%"
  }
});

year.textContent = String(new Date().getFullYear());
setMenuState(false);
