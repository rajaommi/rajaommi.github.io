const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const pageRegions = [document.querySelector("main"), document.querySelector("footer"), document.querySelector(".brand")].filter(Boolean);

if (header) {
  const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 20);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

if (nav && navToggle) {
  const setPageInert = (isInert) => {
    pageRegions.forEach((region) => {
      if (isInert) region.setAttribute("inert", "");
      else region.removeAttribute("inert");
    });
  };

  const closeNav = (restoreFocus = false) => {
    nav.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    setPageInert(false);
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");
    if (restoreFocus) navToggle.focus();
  };

  const openNav = () => {
    nav.classList.add("is-open");
    document.body.classList.add("nav-open");
    setPageInert(true);
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close navigation");
    requestAnimationFrame(() => nav.querySelector("a")?.focus());
  };

  navToggle.addEventListener("click", () => {
    if (nav.classList.contains("is-open")) closeNav(true);
    else openNav();
  });

  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => closeNav()));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) closeNav(true);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeNav();
  });
}
