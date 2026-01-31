const monthYearEl = document.getElementById('monthYear');
const calendarEl = document.getElementById('calendar');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

// Modal Elements
const modal = document.getElementById('noteModal');
const modalTitle = document.getElementById('modalTitle');
const noteInput = document.getElementById('noteInput');
const cancelBtn = document.getElementById('cancelBtn');

// New Modal Elements
const colorOptions = document.querySelectorAll('.color-option');
const newTaskInput = document.getElementById('newTaskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskListEl = document.getElementById('taskList');

let currentDate = new Date();
let selectedDateStr = null;

// ==========================================
// DATA MANAGEMENT & MIGRATION
// ==========================================
// Data Schema:
// { 
//   "YYYY-MM-DD": {
//      color: "green", // green, red, blue, yellow, purple
//      note: "text",
//      tasks: [ { id: 123, text: "Habit", completed: false } ]
//   }
// }

let habitData = JSON.parse(localStorage.getItem('habitData')) || {};

// Migration Function: Convert old boolean marks to tasks
function migrateData() {
    let changed = false;
    for (const [date, dayData] of Object.entries(habitData)) {
        // If it has 'marked' property (old schema)
        if (dayData.hasOwnProperty('marked')) {
            if (!dayData.tasks) {
                dayData.tasks = [];
                // If it was marked, create a default completed task
                if (dayData.marked) {
                    dayData.tasks.push({
                        id: Date.now() + Math.random(),
                        text: "Daily Goal",
                        completed: true
                    });
                }
            }
            if (!dayData.color) dayData.color = 'green';
            delete dayData.marked; // Remove old key
            changed = true;
        }
    }
    if (changed) saveToLocalStorage();
}
migrateData();

function saveToLocalStorage() {
    localStorage.setItem('habitData', JSON.stringify(habitData));
}

function getDayData(dateStr) {
    if (!habitData[dateStr]) {
        habitData[dateStr] = { color: 'green', note: '', tasks: [] };
    }
    return habitData[dateStr];
}

// ==========================================
// CALENDAR RENDERING
// ==========================================

function getMonthName(date) {
    return date.toLocaleString('default', { month: 'long' });
}

function formatDateKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// 2026 Sri Lanka Holidays
const holidays2026 = {
    '1-3': { name: 'Duruthu Full Moon Poya', emoji: '🌕' },
    '1-15': { name: 'Tamil Thai Pongal', emoji: '🌾' },
    '2-1': { name: 'Navam Full Moon Poya', emoji: '🌕' },
    '2-4': { name: 'Independence Day', emoji: '🇱🇰' },
    '2-15': { name: 'Mahasivarathri', emoji: '🕉️' },
    '3-2': { name: 'Madin Full Moon Poya', emoji: '🌕' },
    '3-21': { name: 'Id-Ul-Fitr', emoji: '☪️' },
    '4-1': { name: 'Bak Full Moon Poya', emoji: '🌕' },
    '4-3': { name: 'Good Friday', emoji: '✝️' },
    '4-13': { name: 'New Year Eve', emoji: '🎆' },
    '4-14': { name: 'Sinhala & Tamil New Year', emoji: '🎆' },
    '5-1': { name: 'May Day / Vesak', emoji: '☸️' },
    '5-2': { name: 'Day following Vesak', emoji: '☸️' },
    '5-28': { name: 'Id-Ul-Alha', emoji: '🕌' },
    '5-30': { name: 'Adhi Vesak Poya', emoji: '🌕' },
    '6-29': { name: 'Poson Full Moon Poya', emoji: '🌕' },
    '7-29': { name: 'Esala Full Moon Poya', emoji: '🌕' },
    '8-26': { name: 'Milad-Un-Nabi', emoji: '🕌' },
    '8-27': { name: 'Nikini Full Moon Poya', emoji: '🌕' },
    '9-26': { name: 'Binara Full Moon Poya', emoji: '🌕' },
    '10-25': { name: 'Vap Full Moon Poya', emoji: '🌕' },
    '11-8': { name: 'Deepavali', emoji: '🪔' },
    '11-24': { name: 'Ill Full Moon Poya', emoji: '🌕' },
    '12-23': { name: 'Unduvap Full Moon Poya', emoji: '🌕' },
    '12-25': { name: 'Christmas Day', emoji: '🎄' }
};

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Only apply for 2026 or generic? Assuming 2026 specific for now based on request
    const is2026 = year === 2026;

    monthYearEl.textContent = `${getMonthName(currentDate)} ${year}`;

    const existingDays = calendarEl.querySelectorAll('.day');
    existingDays.forEach(day => day.remove());

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const dayCount = lastDay.getDate();
    const startDayIndex = firstDay.getDay();

    for (let i = 0; i < startDayIndex; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('day', 'empty');
        calendarEl.appendChild(emptyDiv);
    }

    for (let day = 1; day <= dayCount; day++) {
        const dayEl = document.createElement('div');
        dayEl.classList.add('day');

        const numberEl = document.createElement('div');
        numberEl.classList.add('day-number');
        numberEl.textContent = day;
        dayEl.appendChild(numberEl);

        // Holiday Check
        if (is2026) {
            const holKey = `${month + 1}-${day}`;
            if (holidays2026[holKey]) {
                const hol = holidays2026[holKey];
                const holEl = document.createElement('div');
                holEl.classList.add('holiday-emoji');
                holEl.textContent = hol.emoji;
                holEl.title = hol.name; // Tooltip
                dayEl.appendChild(holEl);
            }
        }

        const dateKey = formatDateKey(year, month, day);
        const data = habitData[dateKey];

        // Apply Data Visualization
        if (data) {
            // Note Preview
            if (data.note) {
                const notePreview = document.createElement('div');
                notePreview.classList.add('note-preview');
                notePreview.textContent = data.note;
                dayEl.appendChild(notePreview);
            }

            // Progress Fill
            const tasks = data.tasks || [];
            const total = tasks.length;
            const completed = tasks.filter(t => t.completed).length;

            let percent = 0;
            if (total > 0) {
                percent = (completed / total) * 100;
            } else if (completed > 0) {
                // Determine if we should show full for Migrated data w/o tasks?
                // Logic handled in migrateData()
            }

            // Reward Emoji
            if (total > 0 && completed === total) {
                const reward = document.createElement('div');
                reward.classList.add('reward-emoji');
                reward.textContent = '🏆';
                dayEl.appendChild(reward);
                dayEl.classList.add('has-reward'); // Add class for styling
            }

            // Set CSS Variables for styling
            let colorHex = '#4ade80'; // default green
            switch (data.color) {
                case 'red': colorHex = '#ef4444'; break;
                case 'blue': colorHex = '#3b82f6'; break;
                case 'yellow': colorHex = '#eab308'; break;
                case 'purple': colorHex = '#a855f7'; break;
            }

            dayEl.style.setProperty('--fill-color', colorHex);
            dayEl.style.setProperty('--fill-percent', `${percent}%`);
        } else {
            dayEl.style.setProperty('--fill-percent', '0%');
        }

        // Interaction: Open Modal directly
        dayEl.addEventListener('click', () => {
            openModal(dateKey, day);
        });

        calendarEl.appendChild(dayEl);
    }
}

// ==========================================
// MODAL / SIDE PANEL LOGIC
// ==========================================

function openModal(dateKey, day) {
    // If panel is already open for this date, do nothing
    if (selectedDateStr === dateKey && modal.classList.contains('open')) return;

    // Save previous data if switching days while open
    if (selectedDateStr && selectedDateStr !== dateKey) {
        saveCurrentNote();
    }

    selectedDateStr = dateKey;
    const data = getDayData(dateKey);

    modalTitle.textContent = `Details for ${getMonthName(currentDate)} ${day}`;
    noteInput.value = data.note || '';

    // Set Color Selection
    colorOptions.forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.color === data.color) {
            opt.classList.add('selected');
        }
    });

    renderTaskList(data.tasks);

    // Add open class (slide in)
    modal.classList.add('open');
}

function saveCurrentNote() {
    if (selectedDateStr) {
        const data = getDayData(selectedDateStr);
        data.note = noteInput.value.trim();
        saveToLocalStorage();
        renderCalendar();
    }
}

function closeModal() {
    saveCurrentNote(); // Save on close
    modal.classList.remove('open');
    selectedDateStr = null;
}

// Color Picker Logic
colorOptions.forEach(opt => {
    opt.addEventListener('click', () => {
        if (!selectedDateStr) return;

        // UI Update
        colorOptions.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');

        // Logic Update
        const data = getDayData(selectedDateStr);
        data.color = opt.dataset.color;
        saveToLocalStorage();
        renderCalendar(); // Live preview changes behind modal
    });
});

// Task Logic
function renderTaskList(tasks) {
    taskListEl.innerHTML = '';
    tasks.forEach(task => {
        const item = document.createElement('div');
        item.classList.add('task-item');
        if (task.completed) item.classList.add('completed');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.onclick = () => toggleTask(task.id);

        const text = document.createElement('span');
        text.textContent = task.text;

        const delBtn = document.createElement('button');
        delBtn.classList.add('delete-task-btn');
        delBtn.textContent = '✖'; // Cross icon
        delBtn.onclick = () => deleteTask(task.id);

        item.appendChild(checkbox);
        item.appendChild(text);
        item.appendChild(delBtn);
        taskListEl.appendChild(item);
    });
}

function addTask() {
    if (!selectedDateStr) return;
    const text = newTaskInput.value.trim();
    if (!text) return;

    const data = getDayData(selectedDateStr);
    data.tasks.push({
        id: Date.now(),
        text: text,
        completed: false
    });

    newTaskInput.value = '';
    saveToLocalStorage();
    renderTaskList(data.tasks);
    renderCalendar();
}

function toggleTask(id) {
    if (!selectedDateStr) return;
    const data = getDayData(selectedDateStr);
    const task = data.tasks.find(t => t.id === id);
    if (task) {
        // Check if we are completing it (going from false to true)
        const wasCompleted = task.completed;
        task.completed = !task.completed;

        saveToLocalStorage();
        renderTaskList(data.tasks);
        renderCalendar();

        // Celebration Trigger check
        // Check if ALL tasks are now completed AND we just completed one
        if (!wasCompleted && task.completed) {
            const allCompleted = data.tasks.every(t => t.completed);
            if (allCompleted) {
                triggerCelebration();
            }
        }
    }
}

function triggerCelebration() {
    const overlay = document.getElementById('celebration-overlay');
    overlay.classList.add('active');
    setTimeout(() => {
        overlay.classList.remove('active');
    }, 2000); // Hide after 2 seconds
}

function deleteTask(id) {
    if (!selectedDateStr) return;
    const data = getDayData(selectedDateStr);
    data.tasks = data.tasks.filter(t => t.id !== id);
    saveToLocalStorage();
    renderTaskList(data.tasks);
    renderCalendar();
}

addTaskBtn.addEventListener('click', addTask);
newTaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

cancelBtn.addEventListener('click', closeModal);

// Close on click outside
document.addEventListener('click', (e) => {
    // If click is NOT inside modal content and NOT on a day element (to allow opening)
    if (modal.classList.contains('open') &&
        !modal.contains(e.target) &&
        !e.target.closest('.day')) {
        closeModal();
    }
});

// Navigation Logic
prevBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

renderCalendar();
