"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { holidays2026 } from '@/lib/holidays';
import { useHabitData } from '@/lib/storage';
import Celebration from './Celebration';


// Data structure interface
interface CalendarPage {
  id: number;
  date: string;
  quote: string;
  isTorn: boolean;
}

// Inspirational quotes for each day
const quotes = [
  'The journey of a thousand miles begins with one step.',
  'Believe you can and you\'re halfway there.',
  'Success is not final, failure is not fatal.',
  'The only way to do great work is to love what you do.',
  'Dream big and dare to fail.',
  'Your time is limited, don\'t waste it living someone else\'s life.',
  'The future belongs to those who believe in the beauty of their dreams.',
  'It does not matter how slowly you go as long as you do not stop.',
  'Everything you\'ve ever wanted is on the other side of fear.',
  'Believe in yourself. You are braver than you think.',
  'I am in charge of how I feel and today I choose happiness.',
  'You don\'t have to be great to start, but you have to start to be great.',
  'Make each day your masterpiece.',
  'Success is the sum of small efforts repeated daily.',
  'Today is a good day to have a good day.',
  'Focus on being productive instead of busy.',
  'You are capable of amazing things.',
  'The secret of getting ahead is getting started.',
  'Do something today that your future self will thank you for.',
  'Small progress is still progress.',
  'Don\'t count the days, make the days count.',
  'You are stronger than you think.',
  'Every accomplishment starts with the decision to try.',
  'Be the energy you want to attract.',
  'Your only limit is your mind.',
  'Great things never come from comfort zones.',
  'The harder you work, the luckier you get.',
  'Stay focused and never give up.',
  'You are enough just as you are.',
];

// Generate pages for the entire month
const generateMonthPages = (year: number, month: number): CalendarPage[] => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const pages: CalendarPage[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    pages.push({
      id: day,
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      quote: quotes[(day - 1) % quotes.length],
      isTorn: false,
    });
  }

  return pages;
};

const PageADayCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentPageIndex, setCurrentPageIndex] = useState(new Date().getDate() - 1);
  const [isFlipping, setIsFlipping] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [showCelebration, setShowCelebration] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');

  const { getDayData, updateDayData, isMounted } = useHabitData();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getHoliday = (dateString: string) => {
    const d = new Date(dateString);
    if (d.getFullYear() !== 2026) return null;
    const key = `${d.getMonth() + 1}-${d.getDate()}`;
    return holidays2026[key] || null;
  };

  const pages = useMemo(() => generateMonthPages(year, month), [year, month]);

  const currentPage = pages[currentPageIndex];
  const dayData = currentPage ? getDayData(currentPage.date) : { color: 'green', note: '', tasks: [] };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || !currentPage) return;

    const newTask = {
      id: Date.now(),
      text: newTaskText.trim(),
      completed: false
    };

    updateDayData(currentPage.date, {
      tasks: [...dayData.tasks, newTask]
    });
    setNewTaskText('');
  };

  const toggleTask = (taskId: number) => {
    if (!currentPage) return;
    const newTasks = dayData.tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );

    updateDayData(currentPage.date, { tasks: newTasks });

    // Celebration check
    if (newTasks.every(t => t.completed) && newTasks.length > 0) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
  };

  const deleteTask = (taskId: number) => {
    if (!currentPage) return;
    updateDayData(currentPage.date, {
      tasks: dayData.tasks.filter(t => t.id !== taskId)
    });
  };

  const handleFlip = () => {
    if (isFlipping || currentPageIndex >= pages.length - 1) return;

    setIsFlipping(true);
    setTimeout(() => {
      setCurrentPageIndex(prev => prev + 1);
      setIsFlipping(false);
    }, 600);
  };

  const handlePrevious = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(prev => prev + 1);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setCurrentPageIndex(0);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setCurrentPageIndex(0);
  };

  const handleSelectDay = (index: number) => {
    setCurrentPageIndex(index);
    setViewMode('single');
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  if (!isMounted) return null;

  return (
    <div className="font-display bg-background-light dark:bg-background-dark min-h-screen relative overflow-x-hidden w-full">
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 glass-panel">
        <div className="flex items-center gap-3">
          <div className="text-primary">
            <span className="material-symbols-outlined text-3xl">wb_sunny</span>
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-tight">Morning Ritual</h2>
        </div>
        <nav className="flex items-center gap-8">
          <button onClick={() => setViewMode('grid')} className={`text-sm font-medium hover:text-primary transition-colors ${viewMode === 'grid' ? 'border-b-2 border-primary' : ''}`}>Dashboard</button>
          <button onClick={() => setViewMode('single')} className={`text-sm font-medium hover:text-primary transition-colors ${viewMode === 'single' ? 'border-b-2 border-primary' : ''}`}>Journal</button>
          <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Habits</a>
          <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Settings</a>
          <div className="size-9 rounded-full bg-cover bg-center border-2 border-primary/20" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBh-P_jkuGjvFCDPZY2d9ZMhduFVK2LCPq5HpZzKdyHAcywYehWC1U37CRzF4_00AipQgQeWN3Qm7vnDrzyasIxDq0MZnIKuEFqN3AT4_7Wf0_11eLKZow0m_seMNfHq1emohrNMdwvyCgpiw3lKQKrZ_B1pXLOAMa4F45qcHT53-8_1Yd7yn8xq6ePjAVAeuJpQ9SzOApWbt7Ul1CIBNjpUZN0cgv8E3j3DCDIIkx4KN73_okwXFKFNhv2DVXQkj4ZL4gJQmh8Wk4")' }}></div>
        </nav>
      </header>

      <div className="fixed inset-0 sunrise-gradient dark:opacity-10 z-0"></div>

      <main className="relative z-10 flex-1 flex justify-center items-start pt-28 pb-24 px-4 md:px-12 overflow-y-auto min-h-screen">
        <Celebration show={showCelebration} />
        <div className="max-w-[1000px] w-full flex flex-col items-center">
          <div className="relative w-full bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-primary/20 p-6 md:p-12 overflow-hidden">
            <div className="absolute inset-0 paper-texture"></div>

            {viewMode === 'single' ? (
              <>
                <div className="relative z-10 text-center mb-12">
                  <p className="text-[#8a8060] text-xs uppercase tracking-[0.2em] font-bold mb-4">
                    {new Date(currentPage.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <h2 className="font-serif text-[32px] md:text-[42px] leading-tight text-[#181611] italic mb-8 max-w-2xl mx-auto">
                    "{currentPage.quote}"
                  </h2>
                  <div className="w-16 h-[1px] bg-primary/40 mx-auto"></div>
                </div>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
                  {/* Calendar Mini View */}
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-[#181611] text-sm font-bold uppercase tracking-widest text-[#8a8060]">
                        {monthName} {year}
                      </h3>
                      <div className="flex gap-2">
                        <button onClick={handlePrevMonth} className="p-1 hover:text-primary" aria-label="Previous Month"><ChevronLeft size={16} /></button>
                        <button onClick={handleNextMonth} className="p-1 hover:text-primary" aria-label="Next Month"><ChevronRight size={16} /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-y-4 text-center">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <span key={`${d}-${i}`} className="text-[10px] text-[#8a8060] font-bold uppercase">{d}</span>
                      ))}
                      {/* Grid Logic */}
                      {Array.from({ length: new Date(year, month, 1).getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} className="w-8 h-8" />
                      ))}
                      {pages.map((page, index) => {
                        const dayNum = new Date(page.date).getDate();
                        const isSelected = index === currentPageIndex;
                        const hasTasks = getDayData(page.date).tasks.length > 0;
                        return (
                          <button
                            key={page.id}
                            onClick={() => handleSelectDay(index)}
                            className={`flex items-center justify-center text-xs font-medium w-8 h-8 rounded-full transition-all relative
                              ${isSelected ? 'bg-primary/20 ring-1 ring-primary/40 font-bold text-[#181611]' : 'text-[#8a8060] hover:bg-primary/5'}
                            `}
                          >
                            {dayNum}
                            {hasTasks && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-8 pt-6 border-t border-dashed border-primary/20">
                      <p className="text-[11px] text-[#8a8060] font-medium italic">
                        Small progress is still progress.
                      </p>
                    </div>
                  </div>

                  {/* Intentions Section */}
                  <div className="flex flex-col">
                    <h3 className="text-[#181611] text-sm font-bold mb-6 flex items-center gap-2 uppercase tracking-widest text-[#8a8060]">
                      <span className="material-symbols-outlined text-primary text-lg">stylus_note</span>
                      Today Intentions
                    </h3>
                    <div className="space-y-3">
                      {dayData.tasks.map(task => (
                        <label key={task.id} className="flex items-center gap-4 group cursor-pointer p-3 rounded-xl border border-transparent hover:border-primary/10 hover:bg-primary/5 transition-all">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTask(task.id)}
                            className="wax-seal-checkbox"
                          />
                          <div className="flex flex-col flex-1">
                            <span className={`text-[#181611] text-sm font-semibold ${task.completed ? 'line-through opacity-50' : ''}`}>{task.text}</span>
                          </div>
                          <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-[#8a8060] hover:text-red-500 transition-all" aria-label="Delete task">
                            <Trash2 size={14} />
                          </button>
                        </label>
                      ))}
                      <form onSubmit={handleAddTask} className="flex items-center gap-4 p-3 border-t border-dashed border-primary/20 mt-2">
                        <Plus size={16} className="text-primary" />
                        <input
                          type="text"
                          value={newTaskText}
                          onChange={(e) => setNewTaskText(e.target.value)}
                          placeholder="Add new intention..."
                          className="bg-transparent border-none focus:ring-0 p-0 text-sm flex-1 placeholder-[#8a8060]/50"
                        />
                      </form>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 max-w-2xl mx-auto mb-16 border-t border-dashed border-primary/20 pt-12">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-8 h-[1px] bg-primary/30"></div>
                    <p className="text-[#8a8060] text-sm font-medium italic">What is one thing you are grateful for today?</p>
                    <div className="w-8 h-[1px] bg-primary/30"></div>
                  </div>
                  <textarea
                    value={dayData.note}
                    onChange={(e) => updateDayData(currentPage.date, { note: e.target.value })}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-[#181611] text-lg text-center font-serif placeholder-[#8a8060]/30 resize-none h-32 leading-relaxed"
                    placeholder="Begin your reflection here..."
                  />
                </div>

                <div className="relative z-10 flex flex-col items-center gap-4">
                  <button
                    onClick={handleFlip}
                    className="letterpress-btn bg-primary text-[#181611] px-16 py-4 rounded-xl font-bold text-lg tracking-wide hover:bg-[#ebba1a] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined">history_edu</span>
                    Seal the Day
                  </button>
                  <p className="text-[#8a8060] text-[10px] uppercase tracking-widest opacity-60">Completed rituals are archived in your soul's library</p>
                </div>
              </>
            ) : (
              /* Grid View */
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="font-serif text-3xl italic text-[#181611]">{monthName} {year}</h2>
                  <div className="flex gap-2">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-primary/10 rounded-lg transition-all" aria-label="Previous Month"><ChevronLeft /></button>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-primary/10 rounded-lg transition-all" aria-label="Next Month"><ChevronRight /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                    <div key={`${d}-${i}`} className="text-center text-[10px] font-bold uppercase tracking-widest text-[#8a8060] mb-4">{d}</div>
                  ))}
                  {Array.from({ length: new Date(year, month, 1).getDay() }).map((_, i) => (
                    <div key={`empty-grid-${i}`} className="aspect-square" />
                  ))}
                  {pages.map((page, index) => {
                    const dayNum = new Date(page.date).getDate();
                    const isSelected = index === currentPageIndex;
                    const dayInfo = getDayData(page.date);
                    const isComplete = dayInfo.tasks.length > 0 && dayInfo.tasks.every(t => t.completed);

                    return (
                      <button
                        key={page.id}
                        onClick={() => handleSelectDay(index)}
                        className={`aspect-square rounded-xl border transition-all flex flex-col items-center justify-center gap-1 relative overflow-hidden group
                          ${isSelected ? 'bg-primary/20 border-primary ring-1 ring-primary' : 'bg-background-light/50 border-primary/10 hover:border-primary/30'}
                        `}
                      >
                        <span className={`text-xl font-bold ${isSelected ? 'text-[#181611]' : 'text-[#8a8060]'}`}>{dayNum}</span>
                        {isComplete && <Trophy className="w-4 h-4 text-primary" />}
                        {dayInfo.tasks.length > 0 && (
                          <div className="absolute bottom-2 flex gap-1">
                            {dayInfo.tasks.slice(0, 3).map(t => (
                              <div key={t.id} className={`w-1 h-1 rounded-full ${t.completed ? 'bg-primary' : 'bg-[#8a8060]/30'}`} />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="mt-12 flex items-center gap-8 text-[#8a8060] text-xs font-medium uppercase tracking-widest relative z-10">
            <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px] text-primary">bolt</span> 14 Day Streak</span>
            <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">done_all</span> {dayData.tasks.filter(t => t.completed).length}/{dayData.tasks.length} Intentions</span>
            <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">schedule</span> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PageADayCalendar;
