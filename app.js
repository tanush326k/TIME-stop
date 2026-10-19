// Simple Clock + Stopwatch app

// --- THEME TOGGLE ---
const THEME_KEY = 'time-stop-theme';
const themeToggle = document.getElementById('theme-toggle');

function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    themeToggle.textContent = '☀️';
    themeToggle.setAttribute('aria-pressed', 'true');
  } else {
    document.documentElement.removeAttribute('data-theme');
    themeToggle.textContent = '🌙';
    themeToggle.setAttribute('aria-pressed', 'false');
  }
}

function initTheme() {
  // load saved, otherwise use prefers-color-scheme
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) {
    applyTheme(saved);
  } else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const next = isLight ? 'dark' : 'light';
    applyTheme(next === 'light' ? 'light' : 'dark');
    localStorage.setItem(THEME_KEY, next);
  });
}

initTheme();

// --- CLOCK ---
function pad(n, width = 2) {
  return String(n).padStart(width, '0');
}
function updateClock() {
  const el = document.getElementById('clock');
  const now = new Date();
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  el.textContent = `${hh}:${mm}:${ss}`;
}
updateClock();
setInterval(updateClock, 500);

// --- STOPWATCH ---
class Stopwatch {
  constructor(onTick) {
    this.running = false;
    this._startTime = 0; // performance.now at start
    this._elapsed = 0;   // ms accumulated while not running
    this._rafId = null;
    this.onTick = onTick;
  }

  _now() { return performance.now(); }

  start() {
    if (this.running) return;
    this._startTime = this._now();
    this.running = true;
    this._loop();
  }

  pause() {
    if (!this.running) return;
    this._elapsed += this._now() - this._startTime;
    this.running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = null;
    this._emit();
  }

  reset() {
    this.running = false;
    this._startTime = 0;
    this._elapsed = 0;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = null;
    this._emit();
  }

  elapsed() {
    if (this.running) {
      return this._elapsed + (this._now() - this._startTime);
    }
    return this._elapsed;
  }

  _emit() {
    if (this.onTick) this.onTick(this.elapsed());
  }

  _loop() {
    this._emit();
    this._rafId = requestAnimationFrame(() => this._loop());
  }
}

// format ms -> MM:SS.CS (centiseconds)
function formatTime(ms) {
  const totalCentis = Math.floor(ms / 10);
  const cs = totalCentis % 100;
  const totalSeconds = Math.floor(totalCentis / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
}

// DOM wiring
const swDisplay = document.getElementById('sw-display');
const btnStart = document.getElementById('sw-start');
const btnLap = document.getElementById('sw-lap');
const btnReset = document.getElementById('sw-reset');
const lapList = document.getElementById('lap-list');

const sw = new Stopwatch((ms) => {
  swDisplay.textContent = formatTime(ms);
});

function updateButtons() {
  if (sw.running) {
    btnStart.textContent = 'Stop';
    btnStart.classList.add('danger');
    btnLap.disabled = false;
    btnReset.disabled = true;
  } else {
    btnStart.textContent = (sw.elapsed() > 0) ? 'Start' : 'Start';
    btnStart.classList.remove('danger');
    btnLap.disabled = true;
    btnReset.disabled = (sw.elapsed() === 0);
  }
}

btnStart.addEventListener('click', () => {
  if (!sw.running) {
    sw.start();
  } else {
    sw.pause();
  }
  updateButtons();
});

btnLap.addEventListener('click', () => {
  if (!sw.running) return;
  const t = sw.elapsed();
  const li = document.createElement('li');
  li.textContent = `${formatTime(t)}  — Lap ${lapList.children.length + 1}`;
  lapList.insertBefore(li, lapList.firstChild);
});

btnReset.addEventListener('click', () => {
  sw.reset();
  lapList.innerHTML = '';
  updateButtons();
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    btnStart.click();
  } else if (e.key.toLowerCase() === 'l') {
    btnLap.click();
  } else if (e.key.toLowerCase() === 'r') {
    btnReset.click();
  }
});

// init
updateButtons();
sw._emit();
