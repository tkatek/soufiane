const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#site-navigation");

if (header) {
  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

if (menuToggle && navigation) {
  const closeMenu = () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    navigation.classList.remove("is-open");
  };

  menuToggle.addEventListener("click", () => {
    const open = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!open));
    menuToggle.setAttribute("aria-label", open ? "Open navigation" : "Close navigation");
    navigation.classList.toggle("is-open", !open);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

const projectGrid = document.querySelector("#project-grid");
const showAllProjectsButton = document.querySelector("#show-all-projects");
const projectTiles = projectGrid ? [...projectGrid.querySelectorAll(".project-tile")] : [];

if (showAllProjectsButton && projectTiles.length > 8) {
  projectTiles.slice(8).forEach((tile) => {
    tile.hidden = true;
  });
  showAllProjectsButton.hidden = false;
  showAllProjectsButton.addEventListener("click", () => {
    projectTiles.slice(8).forEach((tile) => {
      tile.hidden = false;
    });
    showAllProjectsButton.hidden = true;
  });
}

const contributionGrid = document.querySelector("#github-chart-grid");
const contributionMonths = document.querySelector("#github-chart-months");

if (contributionGrid && contributionMonths) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay());

  const chartStart = new Date(currentWeekStart);
  chartStart.setDate(currentWeekStart.getDate() - 52 * 7);

  const chartEnd = new Date(currentWeekStart);
  chartEnd.setDate(chartEnd.getDate() + 6);

  const chartFragment = document.createDocumentFragment();
  const monthFragment = document.createDocumentFragment();
  const monthColumns = new Set();
  const monthKeys = new Set();
  const dayCount = Math.round((chartEnd - chartStart) / 86_400_000) + 1;

  for (let dayIndex = 0; dayIndex < dayCount; dayIndex += 1) {
    const date = new Date(chartStart);
    date.setDate(chartStart.getDate() + dayIndex);
    const week = Math.floor(dayIndex / 7);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

    if ((date.getDate() === 1 || dayIndex === 0) && !monthKeys.has(monthKey) && !monthColumns.has(week)) {
      const month = document.createElement("span");
      monthKeys.add(monthKey);
      monthColumns.add(week);
      month.textContent = date.toLocaleString("en", { month: "short" });
      month.style.gridColumn = String(week + 1);
      month.style.gridRow = "1";
      monthFragment.append(month);
    }

    const tile = document.createElement("span");
    const value = Math.abs(Math.sin((dayIndex + 1) * 12.9898) * 43_758.5453) % 1;
    const level = value < 0.56 ? 0 : value < 0.73 ? 1 : value < 0.86 ? 2 : value < 0.96 ? 3 : 4;
    tile.dataset.level = String(level);
    chartFragment.append(tile);
  }

  contributionGrid.append(chartFragment);
  contributionMonths.append(monthFragment);
}

const revealItems = [...document.querySelectorAll("[data-reveal]")];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealTargetSelectors = {
  "hero__copy": ".hero__availability, :scope > .hero__title, .hero__description, .hero__actions > *",
  "experience__heading": ":scope > *",
  "experience__story": ".experience__journey > li, .experience__principle, .experience__sketch",
  "experience__build-card": ".experience__build-label, :scope > h3, .experience__build-steps > li, .experience__build-footer",
  "experience__group": ".experience__group-heading, .experience__timeline > li, .experience__tech-group > h4, .experience__technologies > li",
  "experience__footer": ":scope > *",
  "projects__heading": ":scope > *",
  "projects__toolbar": ":scope > *",
  "project-tile": ".project-tile__visual, .project-tile__info > div > *, .project-tile__open",
  "projects__footer": ":scope > *",
  "blog__heading": ":scope > *",
  "blog__statement": ":scope > *",
  "blog__topic": ".blog__topic-index, .blog__topic > div > *, .blog__topic-type",
  "blog__note": ":self",
  "blog__github": ":scope > *",
  "contact__heading": ":scope > *",
  "contact__portrait": "img, figcaption > *",
  "contact__content": ".contact__kicker, :scope > h2, .contact__message, .contact__email > *, .contact__links > a, .contact__availability",
  "site-footer__cta": ".site-footer__cta-copy > *, .site-footer__cta-link > *",
};

if (revealItems.length && !reduceMotion && "IntersectionObserver" in window) {
  const getRevealTargets = (item) => {
    const revealClass = Object.keys(revealTargetSelectors).find((className) => item.classList.contains(className));
    const selector = revealClass ? revealTargetSelectors[revealClass] : ":scope > *";
    const targets = selector === ":self" ? [item] : [...item.querySelectorAll(selector)];
    return targets.length ? targets : [item];
  };

  const revealTargetsByItem = new Map(
    revealItems.map((item) => [item, getRevealTargets(item)]),
  );

  revealTargetsByItem.forEach((targets) => {
    targets.forEach((target, index) => {
      target.classList.add("reveal-item");
      target.style.setProperty("--reveal-delay", `${Math.min(index, 5) * 90}ms`);
    });
  });

  document.documentElement.classList.add("js-reveal");

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealTargetsByItem.get(entry.target)?.forEach((target) => target.classList.add("is-visible"));
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.16, rootMargin: "0px 0px -7% 0px" });

  revealItems.forEach((item) => revealObserver.observe(item));
}

const navigationLinks = [...document.querySelectorAll(".site-navigation__link")];
const navigableSections = navigationLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter((section) => section instanceof HTMLElement);

if (navigableSections.length && "IntersectionObserver" in window) {
  const activeSectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navigationLinks.forEach((link) => {
        const active = link.hash === `#${entry.target.id}`;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-40% 0px -50% 0px" });

  navigableSections.forEach((section) => activeSectionObserver.observe(section));
}