import { BASE_URL, API_KEY } from './config.js';

// --- SYSTEM POWIADOMIEŃ (OPCJONALNIE) ---
function showToast(message) {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// --- OBSŁUGA MOTYWU (DARK MODE) ---
const themeToggle = document.getElementById("themeToggle");

function initTheme() {
    if (!themeToggle) return;
    const savedTheme = localStorage.getItem("theme") || "light";
    
    if (savedTheme === "dark") {
        document.documentElement.classList.add("dark-mode");
        themeToggle.textContent = "☀️";
    } else {
        themeToggle.textContent = "🌙";
    }
}

themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeToggle.textContent = isDark ? "☀️" : "🌙";
});

// --- PRZEŁĄCZANIE TABÓW ---
const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
});

tabRegister.addEventListener("click", () => {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
});

// --- LOGIKA API ---

async function handleAuth(endpoint, body, resultId) {
    const resultElement = document.getElementById(resultId);
    // Czyścimy poprzednie wiadomości
    resultElement.textContent = "Łączenie...";
    resultElement.style.color = "var(--text-muted)";

    try {
        const res = await fetch(`${BASE_URL}/auth/${endpoint}?code=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("userName", data.name || "Użytkownik");
            window.location.href = "index.html";
        } else {
            resultElement.textContent = data.message || "Wystąpił błąd";
            resultElement.style.color = "var(--error)";
        }
    } catch (err) {
        resultElement.textContent = "Błąd połączenia z serwerem";
        resultElement.style.color = "var(--error)";
    }
}

document.getElementById("registerForm").addEventListener("submit", async e => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    await handleAuth("register", { name, email, password }, "registerResult");
});

document.getElementById("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    await handleAuth("login", { email, password }, "loginResult");
});

// --- INICJALIZACJA ---
initTheme();