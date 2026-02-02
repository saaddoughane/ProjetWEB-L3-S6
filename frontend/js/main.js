const SESSION_KEY = "gw_currentUser";
const USERS_KEY = "gw_users";

function basePath() {
  return window.location.pathname.includes("/jeux/") ? "../../" : "";
}

function getCurrentUser() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

function setNav() {
  const user = getCurrentUser();
  const accountLink = document.querySelector("[data-account-link]");
  const logoutBtn = document.querySelector("[data-logout-btn]");

  if (!accountLink) return;

  if (user && user.email) {
    accountLink.textContent = `Account (${user.email})`;
    accountLink.setAttribute("href", `${basePath()}dashboard.html`);
    if (logoutBtn) logoutBtn.style.display = "inline-flex";
  } else {
    accountLink.textContent = "Login";
    accountLink.setAttribute("href", `${basePath()}auth.html`);
    if (logoutBtn) logoutBtn.style.display = "none";
  }
}

function attachLogout() {
  const btn = document.querySelector("[data-logout-btn]");
  if (!btn) return;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    sessionStorage.removeItem(SESSION_KEY);
    setNav();
    window.location.href = `${basePath()}index.html`;
  });
}

function initPins() {
  const pins = Array.from(document.querySelectorAll(".pin"));
  if (pins.length === 0) return;

  function closeAll(except = null) {
    pins.forEach(p => { if (p !== except) p.classList.remove("is-open"); });
  }

  pins.forEach(pin => {
    pin.addEventListener("click", (e) => {
      const clickedLink = e.target.closest("a");
      if (clickedLink) return;

      e.preventDefault();
      const willOpen = !pin.classList.contains("is-open");
      closeAll();
      if (willOpen) pin.classList.add("is-open");
    });
  });

  document.addEventListener("click", (e) => {
    const insidePin = e.target.closest(".pin");
    if (!insidePin) closeAll();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });
}

setNav();
attachLogout();
initPins();
