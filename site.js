"use strict";

(() => {
  const nav = document.querySelector("[data-nav]");
  const toggle = document.querySelector("[data-nav-toggle]");
  if (!nav || !toggle) return;

  const mobile = window.matchMedia("(max-width: 800px)");
  const closeNav = (restoreFocus = false) => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "Menu";
    if (restoreFocus) toggle.focus();
  };
  const openNav = () => {
    nav.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.textContent = "Close";
  };

  toggle.addEventListener("click", () => {
    if (toggle.getAttribute("aria-expanded") === "true") closeNav();
    else openNav();
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeNav();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      closeNav(true);
    }
  });

  document.addEventListener("click", (event) => {
    if (!nav.contains(event.target) && !toggle.contains(event.target)) closeNav();
  });

  document.addEventListener("focusin", (event) => {
    if (!nav.contains(event.target) && !toggle.contains(event.target)) closeNav();
  });

  mobile.addEventListener("change", () => closeNav());
  closeNav();
  document.documentElement.classList.add("js");
})();
