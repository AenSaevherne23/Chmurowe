import { BASE_URL, API_KEY } from './config.js';

// --- KONFIGURACJA I NAGŁÓWKI ---

function getToken() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/public/rejestracja.html";
    }
    return token;
}

function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
    };
}

// --- OBSŁUGA SESJI I KONTA ---

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    window.location.href = "/public/rejestracja.html";
}

document.getElementById("logoutBtn").addEventListener("click", logout);

document.getElementById("deleteAccountBtn").addEventListener("click", async () => {
    const confirmDelete = confirm("UWAGA! Czy na pewno chcesz usunąć konto? Wszystkie zadania zostaną bezpowrotnie skasowane.");
    
    if (confirmDelete) {
        try {
            const res = await fetch(`${BASE_URL}/auth/user?code=${API_KEY}`, {
                method: "DELETE",
                headers: authHeaders()
            });

            if (res.ok) {
                alert("Konto zostało pomyślnie usunięte.");
                logout();
            } else {
                const text = await res.text();
                alert(`Błąd podczas usuwania konta: ${res.status}`);
            }
        } catch (err) {
            alert("Błąd połączenia z serwerem.");
        }
    }
});

// --- OBSŁUGA ZADAŃ (API) ---

async function loadTasks() {
    try {
        const res = await fetch(`${BASE_URL}/tasks?code=${API_KEY}`, {
            headers: authHeaders()
        });

        if (res.status === 401) {
            logout();
            return;
        }

        const tasks = await res.json();

        // Sortowanie: nieukończone na górze
        tasks.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));

        // Aktualizacja licznika
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        document.getElementById("counter").textContent = `${completed}/${total} ukończonych`;

        renderTasks(tasks);
    } catch (err) {
        console.error("Błąd pobierania zadań:", err);
    }
}

async function addTask(title) {
    try {
        await fetch(`${BASE_URL}/tasks?code=${API_KEY}`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ title })
        });
        loadTasks();
    } catch (err) {
        alert("Nie udało się dodać zadania.");
    }
}

async function updateTask(id, data) {
    try {
        await fetch(`${BASE_URL}/tasks/${id}?code=${API_KEY}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        loadTasks();
    } catch (err) {
        alert("Błąd aktualizacji zadania.");
    }
}

async function deleteTask(id) {
    if (confirm("Usunąć to zadanie?")) {
        try {
            await fetch(`${BASE_URL}/tasks/${id}?code=${API_KEY}`, {
                method: "DELETE",
                headers: authHeaders()
            });
            loadTasks();
        } catch (err) {
            alert("Błąd usuwania zadania.");
        }
    }
}

// --- RENDEROWANIE INTERFEJSU ---

function renderTasks(tasks) {
    const listContainer = document.getElementById("tasksList");
    listContainer.innerHTML = "";

    tasks.forEach(task => {
        const taskDiv = document.createElement("div");
        taskDiv.className = `task-item ${task.completed ? 'completed' : ''}`;

        const dateFormatted = task.createdAt 
            ? new Date(task.createdAt).toLocaleString("pl-PL", { dateStyle: 'short', timeStyle: 'short' }) 
            : "";

        taskDiv.innerHTML = `
            <input type="checkbox" class="checkbox-custom" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <span class="task-title" style="${task.completed ? 'text-decoration: line-through' : ''}">
                    ${task.title}
                </span>
                <span class="task-date">${dateFormatted}</span>
            </div>
            <div class="task-actions">
                <button class="btn-action edit-btn">Edytuj</button>
                <button class="btn-action delete-btn" style="color: var(--error)">Usuń</button>
            </div>
        `;

        // Eventy dla checkboxa
        const checkbox = taskDiv.querySelector(".checkbox-custom");
        checkbox.addEventListener("change", () => {
            updateTask(task.id, { completed: checkbox.checked });
        });

        // Event dla edycji
        taskDiv.querySelector(".edit-btn").addEventListener("click", () => {
            const newTitle = prompt("Nowa nazwa zadania:", task.title);
            if (newTitle && newTitle.trim() !== task.title) {
                updateTask(task.id, { title: newTitle.trim() });
            }
        });

        // Event dla usuwania
        taskDiv.querySelector(".delete-btn").addEventListener("click", () => {
            deleteTask(task.id);
        });

        listContainer.appendChild(taskDiv);
    });
}

// --- INICJALIZACJA ---

document.getElementById("taskForm").addEventListener("submit", e => {
    e.preventDefault();
    const titleInput = document.getElementById("title");
    const title = titleInput.value.trim();
    
    if (title) {
        addTask(title);
        titleInput.value = "";
    }
});

// Ustawienie nazwy użytkownika i start
document.getElementById("userName").textContent = localStorage.getItem("userName") || "Użytkownik";
getToken(); // Sprawdzenie tokenu na wejściu
loadTasks();