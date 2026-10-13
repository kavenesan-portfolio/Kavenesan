/* Kavenesan Ganapathy — portfolio interactions
   This file uses plain JavaScript. Each section handles one small feature. */

"use strict";

document.documentElement.classList.add("js-ready");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 1. Mobile navigation: open/close the menu and close it after choosing a link.
const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

function closeMobileMenu() {
  if (!menuToggle || !navMenu) return;
  navMenu.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
}

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    navMenu.classList.toggle("open", !isOpen);
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMobileMenu();
  });

  document.addEventListener("click", (event) => {
    const clickedInsideMenu = navMenu.contains(event.target) || menuToggle.contains(event.target);
    if (!clickedInsideMenu) closeMobileMenu();
  });
}

// 2. Highlight the navigation link for the section currently on screen.
const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".nav-link");

if ("IntersectionObserver" in window && sections.length > 0) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        const isCurrent = link.getAttribute("href") === `#${entry.target.id}`;
        link.classList.toggle("active", isCurrent);
        if (isCurrent) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-35% 0px -55% 0px", threshold: 0 });

  sections.forEach((section) => sectionObserver.observe(section));
}

// 3 and 10. Update the scroll progress line and show the back-to-top button.
const scrollProgress = document.getElementById("scrollProgress");
const backToTop = document.getElementById("backToTop");
let scrollUpdatePending = false;

function updateScrollControls() {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;
  if (scrollProgress) scrollProgress.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  if (backToTop) backToTop.classList.toggle("visible", window.scrollY > 450);
  scrollUpdatePending = false;
}

window.addEventListener("scroll", () => {
  if (!scrollUpdatePending) {
    window.requestAnimationFrame(updateScrollControls);
    scrollUpdatePending = true;
  }
}, { passive: true });
updateScrollControls();

if (backToTop) {
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });
}

// 4. Project filtering by topic.
const filterButtons = document.querySelectorAll(".filter-button");
const projectCards = document.querySelectorAll(".project-card");
const projectCount = document.getElementById("projectCount");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedFilter = button.dataset.filter || "all";
    let visibleCount = 0;

    filterButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });

    projectCards.forEach((card) => {
      const shouldShow = selectedFilter === "all" || card.dataset.category === selectedFilter;
      card.hidden = !shouldShow;
      if (shouldShow) visibleCount += 1;
    });

    if (projectCount) {
      projectCount.textContent = `Showing ${visibleCount} ${visibleCount === 1 ? "project" : "projects"}`;
    }
  });
});

// 5. Show extra project information in an accessible dialog.
const projectDialog = document.getElementById("projectDialog");
const dialogTitle = document.getElementById("dialogTitle");
const dialogDescription = document.getElementById("dialogDescription");
const dialogStack = document.getElementById("dialogStack");
const dialogClose = document.getElementById("dialogClose");
const projectDetailButtons = document.querySelectorAll(".project-details");
let lastProjectButton = null;

projectDetailButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!projectDialog || !dialogTitle || !dialogDescription || !dialogStack) return;
    lastProjectButton = button;
    dialogTitle.textContent = button.dataset.title || "Project details";
    dialogDescription.textContent = button.dataset.description || "Add a description for this project.";
    dialogStack.replaceChildren();

    const stackItems = (button.dataset.stack || "").split("|").filter(Boolean);
    stackItems.forEach((item) => {
      const tag = document.createElement("span");
      tag.textContent = item;
      dialogStack.appendChild(tag);
    });

    if (typeof projectDialog.showModal === "function") {
      projectDialog.showModal();
    } else {
      // Basic fallback for browsers without the dialog API.
      projectDialog.setAttribute("open", "");
    }
    if (dialogClose) dialogClose.focus();
  });
});

if (dialogClose && projectDialog) {
  dialogClose.addEventListener("click", () => {
    if (typeof projectDialog.close === "function") projectDialog.close();
    else projectDialog.removeAttribute("open");
    if (lastProjectButton) lastProjectButton.focus();
  });

  projectDialog.addEventListener("click", (event) => {
    if (event.target === projectDialog) {
      if (typeof projectDialog.close === "function") projectDialog.close();
      else projectDialog.removeAttribute("open");
      if (lastProjectButton) lastProjectButton.focus();
    }
  });

  projectDialog.addEventListener("close", () => {
    if (lastProjectButton) lastProjectButton.focus();
  });
}

// 6. Reveal elements as they enter the screen. Content remains visible with reduced motion.
const revealElements = document.querySelectorAll(".reveal");

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  revealElements.forEach((element) => element.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealElements.forEach((element) => revealObserver.observe(element));
}

// 7. Light/dark theme toggle. Save the visitor's choice when storage is available.
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const THEME_STORAGE_KEY = "kavenesan-portfolio-theme";

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-theme", isDark);
  if (themeIcon) themeIcon.textContent = isDark ? "☀" : "☾";
  if (themeToggle) {
    themeToggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
    themeToggle.title = isDark ? "Switch to light theme" : "Switch to dark theme";
  }
}

let savedTheme = "light";
try {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "dark" || storedTheme === "light") savedTheme = storedTheme;
} catch (error) {
  // Storage can be unavailable in some browser settings. The page still works.
}
applyTheme(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const newTheme = document.body.classList.contains("dark-theme") ? "light" : "dark";
    applyTheme(newTheme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      // Theme changes for this visit even if the browser blocks storage.
    }
  });
}

// 8. Validate the contact fields, then prepare a message in the visitor's email app.
const contactForm = document.getElementById("contactForm");
const contactName = document.getElementById("contactName");
const contactEmail = document.getElementById("contactEmail");
const contactMessage = document.getElementById("contactMessage");
const formStatus = document.getElementById("formStatus");

const validationFields = [
  { input: contactName, error: document.getElementById("nameError"), message: "Please enter your name (at least 2 characters)." },
  { input: contactEmail, error: document.getElementById("emailError"), message: "Please enter a valid email address." },
  { input: contactMessage, error: document.getElementById("messageError"), message: "Please enter a message of at least 10 characters." }
];

function validateField(field) {
  if (!field.input || !field.error) return true;
  const input = field.input;
  const trimmedValue = input.value.trim();
  let isValid = false;

  if (input === contactName) {
    isValid = trimmedValue.length >= 2;
  } else if (input === contactEmail) {
    isValid = trimmedValue.length > 0 && input.checkValidity();
  } else if (input === contactMessage) {
    isValid = trimmedValue.length >= 10;
  }

  input.setAttribute("aria-invalid", String(!isValid));
  field.error.textContent = isValid ? "" : field.message;
  return isValid;
}

validationFields.forEach((field) => {
  if (!field.input) return;
  field.input.addEventListener("blur", () => validateField(field));
  field.input.addEventListener("input", () => {
    if (field.input.getAttribute("aria-invalid") === "true") validateField(field);
    if (formStatus) formStatus.textContent = "";
  });
});

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const allValid = validationFields.map(validateField).every(Boolean);
    if (!allValid) {
      const firstInvalid = validationFields.find((field) => field.input && field.input.getAttribute("aria-invalid") === "true");
      if (firstInvalid) firstInvalid.input.focus();
      if (formStatus) formStatus.textContent = "Please check the highlighted fields.";
      return;
    }

    const subject = encodeURIComponent(`Portfolio enquiry from ${contactName.value.trim()}`);
    const body = encodeURIComponent(
      `Name: ${contactName.value.trim()}\nEmail: ${contactEmail.value.trim()}\n\nMessage:\n${contactMessage.value.trim()}`
    );
    const mailtoUrl = `mailto:kavenesangana@gmail.com?subject=${subject}&body=${body}`;

    if (formStatus) formStatus.textContent = "Your email app should open with the message prepared. If it does not, email me directly using the address shown.";
    window.location.href = mailtoUrl;
  });
}

// 9. Copy the email address, with a friendly message if clipboard access is blocked.
const copyEmailButton = document.getElementById("copyEmail");
const copyStatus = document.getElementById("copyStatus");
const emailToCopy = "kavenesangana@gmail.com";

if (copyEmailButton) {
  copyEmailButton.addEventListener("click", async () => {
    if (!copyStatus) return;
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
        throw new Error("Clipboard API is unavailable");
      }
      await navigator.clipboard.writeText(emailToCopy);
      copyStatus.textContent = "Email address copied.";
    } catch (error) {
      copyStatus.textContent = "Copy is not available here. Please select the email address above.";
    }
  });
}

// Extra small detail: keep the footer year current without any external library.
const currentYear = document.getElementById("currentYear");
if (currentYear) currentYear.textContent = String(new Date().getFullYear());
