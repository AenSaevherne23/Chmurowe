import { BASE_URL, API_KEY } from './config.js';

// Globalna zmienna na zadania, żebyśmy mogli nimi zarządzać lokalnie bez czekania na serwer
let localTasks = [];

// --- SYSTEM POWIADOMIEŃ (TOASTS) ---
function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- NARZĘDZIA MODALA ---
function showModal({ title, desc, showInput = false, defaultValue = "" }) {
    return new Promise((resolve) => {
        const modal = document.getElementById("customModal");
        const inputContainer = document.getElementById("modalInputContainer");
        const input = document.getElementById("modalInput");
        
        document.getElementById("modalTitle").textContent = title;
        document.getElementById("modalDescription").textContent = desc;
        
        if (showInput) {
            inputContainer.classList.remove("hidden");
            input.value = defaultValue;
            setTimeout(() => input.focus(), 100);
        } else {
            inputContainer.classList.add("hidden");
        }

        modal.classList.remove("hidden");

        const cleanup = (value) => {
            modal.classList.add("hidden");
            document.getElementById("modalConfirm").onclick = null;
            document.getElementById("modalCancel").onclick = null;
            resolve(value);
        };

        document.getElementById("modalConfirm").onclick = () => cleanup(showInput ? input.value : true);
        document.getElementById("modalCancel").onclick = () => cleanup(null);
    });
}

// --- KONFIGURACJA I NAGŁÓWKI ---
function getToken() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "rejestracja.html";
    }
    return token;
}

function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
    };
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

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const isDark = document.documentElement.classList.toggle("dark-mode");
        localStorage.setItem("theme", isDark ? "dark" : "light");
        themeToggle.textContent = isDark ? "☀️" : "🌙";
        showToast(`Tryb ${isDark ? "ciemny" : "jasny"} aktywny`);
    });
}

// --- OBSŁUGA SESJI I KONTA ---
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    window.location.href = "rejestracja.html";
}

document.getElementById("logoutBtn").addEventListener("click", async () => {
    const confirmed = await showModal({
        title: "Wylogowanie",
        desc: "Czy na pewno chcesz się wylogować z aplikacji?"
    });
    if (confirmed) logout();
});

document.getElementById("deleteAccountBtn").addEventListener("click", async () => {
    const confirmed = await showModal({
        title: "Usuń konto",
        desc: "UWAGA! Czy na pewno chcesz usunąć konto? Wszystkie zadania zostaną bezpowrotnie skasowane."
    });
    
    if (confirmed) {
        try {
            const res = await fetch(`${BASE_URL}/auth/user`, {
                method: "DELETE",
                headers: authHeaders()
            });
            if (res.ok) {
                logout();
            } else {
                showToast("Błąd podczas usuwania konta", "error");
            }
        } catch (err) {
            showToast("Błąd połączenia z serwerem", "error");
        }
    }
});

// --- OBSŁUGA ZADAŃ (LOGIKA OPTIMISTIC UI) ---

// Funkcja pomocnicza do odświeżania licznika i listy
function refreshUI() {
    localTasks.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
    const total = localTasks.length;
    const completed = localTasks.filter(t => t.completed).length;
    const counter = document.getElementById("counter");
    if (counter) counter.textContent = `${completed}/${total} ukończonych`;
    renderTasks(localTasks);
}

async function loadTasks() {
    try {
        const res = await fetch(`${BASE_URL}/tasks?t=${new Date().getTime()}`, {
            headers: authHeaders()
        });

        if (res.status === 401) {
            logout();
            return;
        }

        localTasks = await res.json();
        refreshUI();
    } catch (err) {
        showToast("Nie udało się pobrać zadań", "error");
    }
}

async function addTask(title) {
    const btn = document.getElementById("addBtn");
    btn.disabled = true;

    try {
        const res = await fetch(`${BASE_URL}/tasks`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ title })
        });
        if (res.ok) {
            const newTask = await res.json();
            localTasks.push(newTask);
            refreshUI();
            showToast("Zadanie dodane!");
        }
    } catch (err) {
        showToast("Błąd dodawania zadania", "error");
    } finally {
        btn.disabled = false;
    }
}

async function updateTask(id, data) {
    // KROK 1: Lokalna zmiana (widoczna natychmiast)
    const index = localTasks.findIndex(t => t.id === id);
    if (index !== -1) {
        localTasks[index] = { ...localTasks[index], ...data };
        refreshUI();
    }

    try {
        // KROK 2: Synchronizacja z serwerem w tle
        const res = await fetch(`${BASE_URL}/tasks/${id}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!res.ok) throw new Error("API error");
    } catch (err) {
        showToast("Błąd synchronizacji", "error");
        await loadTasks(); // Jeśli serwer padł, przywracamy faktyczny stan
    }
}

async function deleteTask(id) {
    // KROK 1: Usuwamy lokalnie
    localTasks = localTasks.filter(t => t.id !== id);
    refreshUI();

    try {
        // KROK 2: Usuwamy z serwera
        const res = await fetch(`${BASE_URL}/tasks/${id}`, {
            method: "DELETE",
            headers: authHeaders()
        });
        if (res.ok) {
            showToast("Zadanie usunięte");
        } else {
            throw new Error("API error");
        }
    } catch (err) {
        showToast("Błąd usuwania", "error");
        await loadTasks();
    }
}

// --- RENDEROWANIE INTERFEJSU ---
function renderTasks(tasks) {
    const listContainer = document.getElementById("tasksList");
    if (!listContainer) return;

    if (tasks.length === 0) {
        listContainer.innerHTML = `<div class="empty-state">🎉 Czysta karta! Dodaj pierwsze zadanie powyżej.</div>`;
        return;
    }

    listContainer.innerHTML = "";

    tasks.forEach((task, index) => {
        const taskDiv = document.createElement("div");
        taskDiv.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskDiv.dataset.id = task.id;

        const dateFormatted = task.createdAt 
            ? new Date(task.createdAt).toLocaleString("pl-PL", { dateStyle: 'short', timeStyle: 'short' }) 
            : "";

        taskDiv.innerHTML = `
            <input type="checkbox" class="checkbox-custom" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <span class="task-title">${task.title}</span>
                <span class="task-date">${dateFormatted}</span>
            </div>
            <div class="task-actions">
                <button class="btn-action edit-btn">Edytuj</button>
                <button class="btn-action delete-btn" style="color: var(--error)">Usuń</button>
            </div>
        `;

        const checkbox = taskDiv.querySelector(".checkbox-custom");
        checkbox.addEventListener("change", () => {
            updateTask(task.id, { completed: checkbox.checked });
        });

        taskDiv.querySelector(".edit-btn").addEventListener("click", async () => {
            const newTitle = await showModal({
                title: "Edytuj zadanie",
                desc: "Zmień nazwę zadania:",
                showInput: true,
                defaultValue: task.title
            });
            if (newTitle && newTitle.trim() !== "" && newTitle.trim() !== task.title) {
                updateTask(task.id, { title: newTitle.trim() });
            }
        });

        taskDiv.querySelector(".delete-btn").addEventListener("click", async () => {
            const confirmed = await showModal({
                title: "Usuń zadanie",
                desc: `Czy na pewno usunąć "${task.title}"?`
            });
            if (confirmed) deleteTask(task.id);
        });

        listContainer.appendChild(taskDiv);
    });
}

// --- INICJALIZACJA ---
const taskForm = document.getElementById("taskForm");
if (taskForm) {
    taskForm.addEventListener("submit", async e => {
        e.preventDefault();
        const titleInput = document.getElementById("title");
        const title = titleInput.value.trim();
        if (title) {
            await addTask(title);
            titleInput.value = "";
        }
    });
}

// Start aplikacji
initTheme();
const userNameDisplay = document.getElementById("userName");
if (userNameDisplay) {
    userNameDisplay.textContent = localStorage.getItem("userName") || "Użytkownik";
}
getToken(); 
loadTasks();