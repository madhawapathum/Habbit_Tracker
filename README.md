# Habit Tracker

> [!CAUTION]
> **Work In Progress**
> This project is currently under active development. Features, UI, and data structures are subject to change.

A lightweight, browser-based habit tracker designed to help you organize daily tasks and visualize your consistency over time using a monthly calendar view.

## Features

- **Interactive Calendar**:
  - View tasks and progress month-by-month.
  - Navigate between months easily.
  - Visual indicators for task completion progress and daily notes.

- **Daily Management**:
  - **Tasks**: Add, delete, and check off daily habits/tasks.
  - **Notes**: Write a daily reflection or log.
  - **Color Themes**: Tag days with specific colors (Green, Red, Blue, Yellow, Purple) to categorize days or track mood.

- **Data Persistence**:
  - Uses `localStorage` to save your data directly in your browser. No account or backend required.
  - Includes data migration logic for backward compatibility.

## Tech Stack

- **HTML5**
- **CSS3** (Variables, Flexbox, Grid)
- **JavaScript** (Vanilla ES6+)

## Getting Started

1. Clone or download the repository.
2. Navigate to the `Habit_Tracker` folder.
3. Open `index.html` in any modern web browser.

## Project Structure

```text
Habbit_Tracker/
├── Habit_Tracker/
│   ├── index.html      # Main application entry point
│   ├── style.css       # Styling for calendar and modals
│   └── script.js       # Core logic and state management
└── README.md           # Project documentation
```

## Upcoming
- [ ] Enhanced mobile responsiveness
- [ ] Data export/import functionality
- [ ] Detailed analytics and streaks