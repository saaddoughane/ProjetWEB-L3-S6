const USERS_KEY = "gw_users";
const SESSION_KEY = "gw_currentUser";

function readUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) ?? []; }
  catch { return []; }
}
function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function setSessionUser(email) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email, loginAt: new Date().toISOString() }));
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}
function isValidPassword(pwd) {
  const n = String(pwd).length;
  return n >= 6 && n <= 64;
}
function show(el, msg) {
  el.style.display = "block";
  el.textContent = msg;
}
function hide(el) {
  el.style.display = "none";
  el.textContent = "";
}

const btnLogin = document.getElementById("btnLogin");
const btnRegister = document.getElementById("btnRegister");
const panelLogin = document.getElementById("panelLogin");
const panelRegister = document.getElementById("panelRegister");

function openLogin() {
  panelLogin.style.display = "block";
  panelRegister.style.display = "none";
}
function openRegister() {
  panelLogin.style.display = "none";
  panelRegister.style.display = "block";
}

btnLogin.addEventListener("click", openLogin);
btnRegister.addEventListener("click", openRegister);

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginErr = document.getElementById("loginErr");
const loginOk = document.getElementById("loginOk");
const regErr = document.getElementById("regErr");
const regOk = document.getElementById("regOk");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  hide(loginErr); hide(loginOk);

  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;

  if (!isValidEmail(email)) return show(loginErr, "Invalid email.");
  if (!isValidPassword(password)) return show(loginErr, "Password must be 6–64 characters.");

  const users = readUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    show(loginErr, "No account found. Switching to Register.");
    openRegister();
    registerForm.email.value = email;
    return;
  }

  if (user.password !== password) {
    show(loginErr, "Wrong password.");
    return;
  }

  setSessionUser(email);
  show(loginOk, "Logged in. Redirecting…");
  setTimeout(() => window.location.href = "index.html", 600);
});

registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  hide(regErr); hide(regOk);

  const email = registerForm.email.value.trim();
  const pwd1 = registerForm.password.value;
  const pwd2 = registerForm.password2.value;

  if (!isValidEmail(email)) return show(regErr, "Invalid email.");
  if (!isValidPassword(pwd1)) return show(regErr, "Password must be 6–64 characters.");
  if (pwd1 !== pwd2) return show(regErr, "Passwords do not match.");

  const users = readUsers();
  if (users.some(u => u.email === email)) return show(regErr, "Email already used.");

  users.push({ email, password: pwd1, createdAt: new Date().toISOString() });
  writeUsers(users);

  show(regOk, "Account created. You can login now.");
  openLogin();
  loginForm.email.value = email;
  loginForm.password.value = "";
});
