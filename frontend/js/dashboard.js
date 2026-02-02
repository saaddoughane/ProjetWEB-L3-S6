const SESSION_KEY = "gw_currentUser";

function getCurrentUser() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

// Guard: require login
const user = getCurrentUser();
const guard = document.querySelector("[data-auth-guard]");

if (!user) {
  if (guard) guard.style.display = "block";
  setTimeout(() => window.location.href = "auth.html", 700);
} else {
  if (guard) guard.style.display = "none";
}

/* Scores: on remplira plus tard */
function fillEmpty(tbodyId) {
  const tb = document.getElementById(tbodyId);
  if (!tb) return;
  tb.innerHTML = `<tr><td colspan="3" style="color:rgba(0,0,0,.55)">—</td></tr>`;
}
fillEmpty("t-memory");
fillEmpty("t-typing");
fillEmpty("t-geo");

// global a 3 colonnes (colspan 3 aussi ok)
const tg = document.getElementById("t-global");
if (tg) tg.innerHTML = `<tr><td colspan="3" style="color:rgba(0,0,0,.55)">—</td></tr>`;
