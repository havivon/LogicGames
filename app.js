"use strict";

/* =====================================================
   תשתית: ניווט, צלילים, קונפטי, התקדמות
   ===================================================== */
const overlay = document.getElementById("overlay");
let dialogRetry = null;

/* --- צלילים (WebAudio, בלי קבצים) --- */
const Sound = (() => {
  let ctx = null, on = localStorage.getItem("lp-sound") !== "off";
  function ac() { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); return ctx; }
  function blip(freq, dur = 0.09, type = "sine", vol = 0.14) {
    if (!on) return;
    try {
      const a = ac(), o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
      o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + dur);
    } catch (e) {}
  }
  return {
    click: () => blip(520, 0.06, "triangle"),
    move:  () => blip(360, 0.08, "sine"),
    error: () => blip(150, 0.18, "sawtooth", 0.1),
    win:   () => [0, 130, 260, 400].forEach((t, i) => setTimeout(() => blip([523, 659, 784, 1047][i], 0.22, "triangle", 0.16), t)),
    lose:  () => [0, 140].forEach((t, i) => setTimeout(() => blip([330, 196][i], 0.3, "sawtooth", 0.12), t)),
    get on() { return on; },
    toggle() { on = !on; localStorage.setItem("lp-sound", on ? "on" : "off"); return on; },
  };
})();

/* --- קונפטי --- */
const Confetti = (() => {
  const cv = document.getElementById("confetti"), cx = cv.getContext("2d");
  let parts = [], raf = null;
  function resize() { cv.width = innerWidth; cv.height = innerHeight; }
  addEventListener("resize", resize); resize();
  function burst() {
    resize();
    const colors = ["#ffc24d", "#6ee7ff", "#4ade80", "#f472b6", "#b07cf0", "#ff9e3d"];
    for (let i = 0; i < 140; i++) {
      parts.push({
        x: innerWidth / 2 + (Math.random() - 0.5) * 120, y: innerHeight / 2 - 40,
        vx: (Math.random() - 0.5) * 11, vy: Math.random() * -13 - 4,
        g: 0.28 + Math.random() * 0.15, s: 5 + Math.random() * 7,
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
        c: colors[(Math.random() * colors.length) | 0], life: 120,
      });
    }
    if (!raf) loop();
  }
  function loop() {
    cx.clearRect(0, 0, cv.width, cv.height);
    parts.forEach(p => {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.fillStyle = p.c;
      cx.globalAlpha = Math.max(0, p.life / 120);
      cx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); cx.restore();
    });
    parts = parts.filter(p => p.life > 0 && p.y < cv.height + 40);
    if (parts.length) raf = requestAnimationFrame(loop);
    else { cx.clearRect(0, 0, cv.width, cv.height); raf = null; }
  }
  return { burst };
})();

/* --- התקדמות (localStorage) --- */
const Progress = (() => {
  const KEY = "lp-solved";
  let solved = new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
  const total = 6;
  function paint() {
    document.querySelectorAll(".card").forEach(c => c.classList.toggle("solved", solved.has(c.dataset.goto)));
    const bar = document.getElementById("progress-bar"), label = document.getElementById("progress-label");
    if (bar) bar.style.width = (solved.size / total * 100) + "%";
    if (label) label.textContent = `${solved.size}/${total} נפתרו`;
  }
  return {
    mark(id) { if (!solved.has(id)) { solved.add(id); localStorage.setItem(KEY, JSON.stringify([...solved])); paint(); } },
    reset() { solved.clear(); localStorage.removeItem(KEY); paint(); },
    paint,
  };
})();

/* --- ניווט + דיאלוג --- */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-goto]");
  if (!btn) return;
  if (overlay.classList.contains("show") && dialogRetry) dialogRetry();
  overlay.classList.remove("show");
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(btn.dataset.goto).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

function showWin(id, emoji, title, text, retryFn) {
  Progress.mark(id); Sound.win(); Confetti.burst();
  showDialog(emoji, title, text, retryFn);
}
function showLose(emoji, title, text, retryFn) { Sound.lose(); showDialog(emoji, title, text, retryFn); }
function showDialog(emoji, title, text, retryFn) {
  document.getElementById("dialog-emoji").textContent = emoji;
  document.getElementById("dialog-title").textContent = title;
  document.getElementById("dialog-text").textContent = text;
  dialogRetry = retryFn;
  overlay.classList.add("show");
}
document.getElementById("dialog-retry").addEventListener("click", () => {
  overlay.classList.remove("show");
  if (dialogRetry) dialogRetry();
});

/* --- כפתורי בית --- */
const soundBtn = document.getElementById("sound-toggle");
function paintSound() { soundBtn.textContent = Sound.on ? "🔊 צלילים" : "🔇 מושתק"; soundBtn.setAttribute("aria-pressed", Sound.on); }
soundBtn.addEventListener("click", () => { Sound.toggle(); paintSound(); Sound.click(); });
document.getElementById("reset-progress").addEventListener("click", () => { Progress.reset(); Sound.click(); });
paintSound();
Progress.paint();

/* helper לרעידה + סטטוס שגיאה */
function bad(el, msg) { el.textContent = msg; el.classList.add("bad"); el.classList.remove("good"); el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); Sound.error(); }
function ok(el, msg = "") { el.textContent = msg; el.classList.remove("bad"); }

/* =====================================================
   חידה 1: זאב, כבשה וחסה
   ===================================================== */
(() => {
  const PIECES = [
    { id: "wolf", emoji: "🐺", name: "הזאב" },
    { id: "sheep", emoji: "🐑", name: "הכבשה" },
    { id: "cabbage", emoji: "🥬", name: "החסה" },
  ];
  let state, busy;
  const bankStart = document.getElementById("bank-left");
  const bankGoal = document.getElementById("bank-right");
  const boatEl = document.getElementById("boat");
  const seatsEl = document.getElementById("boat-seats");
  const movesEl = document.getElementById("river-moves");
  const statusEl = document.getElementById("river-status");

  function reset() {
    state = { pos: { wolf: "start", sheep: "start", cabbage: "start" }, boatSide: "start", moves: 0, over: false };
    busy = false; ok(statusEl, ""); render();
  }
  function pieceEl(p, inBoat) {
    const el = document.createElement("span");
    el.className = "piece" + (inBoat ? " in-boat board" : "");
    el.textContent = p.emoji; el.title = p.name;
    el.addEventListener("click", () => onPiece(p.id));
    return el;
  }
  function render() {
    bankStart.innerHTML = ""; bankGoal.innerHTML = "";
    seatsEl.innerHTML = '<span class="farmer">🧑‍🌾</span>';
    for (const p of PIECES) {
      const w = state.pos[p.id];
      if (w === "start") bankStart.appendChild(pieceEl(p, false));
      else if (w === "goal") bankGoal.appendChild(pieceEl(p, false));
      else seatsEl.appendChild(pieceEl(p, true));
    }
    boatEl.classList.toggle("at-right", state.boatSide === "goal");
    movesEl.textContent = state.moves;
  }
  function onPiece(id) {
    if (busy || state.over) return;
    const w = state.pos[id];
    if (w === "boat") { state.pos[id] = state.boatSide; Sound.move(); }
    else if (w === state.boatSide) {
      if (PIECES.some(p => state.pos[p.id] === "boat")) return bad(statusEl, "בסירה יש מקום לנוסע אחד בלבד!");
      state.pos[id] = "boat"; Sound.move();
    } else return bad(statusEl, "הסירה בגדה השנייה — אי אפשר להגיע לשם בלעדיה.");
    ok(statusEl, ""); render();
  }
  function cross() {
    if (busy || state.over) return;
    busy = true; ok(statusEl, ""); Sound.click();
    state.boatSide = state.boatSide === "start" ? "goal" : "start";
    state.moves++;
    boatEl.classList.toggle("at-right", state.boatSide === "goal");
    movesEl.textContent = state.moves;
    setTimeout(() => {
      busy = false;
      const alone = state.boatSide === "start" ? "goal" : "start";
      const at = (id) => state.pos[id] === alone;
      if (at("wolf") && at("sheep")) return lose("😱", "הזאב טרף את הכבשה!", "השארתם את הזאב לבד עם הכבשה.");
      if (at("sheep") && at("cabbage")) return lose("😋", "הכבשה אכלה את החסה!", "השארתם את הכבשה לבד עם החסה.");
      render();
      const done = PIECES.every(p => state.pos[p.id] === "goal" || (state.pos[p.id] === "boat" && state.boatSide === "goal"));
      if (done) {
        state.over = true;
        const extra = state.moves === 7 ? " ובדרך הקצרה ביותר — מושלם!" : ` (אפשר גם ב־7 חציות)`;
        showWin("river", "🎉", "כולם עברו בשלום!", `פתרתם ב־${state.moves} חציות${extra}`, reset);
      }
    }, 1000);
  }
  function lose(emoji, title, text) { state.over = true; render(); showLose(emoji, title, text, reset); }
  document.getElementById("river-cross").addEventListener("click", cross);
  document.getElementById("river-reset").addEventListener("click", reset);
  reset();
})();

/* =====================================================
   חידה 2: קפיצת הצפרדעים
   ===================================================== */
(() => {
  const N = 7;
  let board, moves, history;
  const padsEl = document.getElementById("pads");
  const movesEl = document.getElementById("frogs-moves");
  const statusEl = document.getElementById("frogs-status");

  function reset() { board = ["R", "R", "R", "", "L", "L", "L"]; moves = 0; history = []; ok(statusEl, ""); render(); }
  function targetOf(i) {
    const d = board[i] === "R" ? 1 : -1;
    if (board[i + d] === "") return i + d;
    if (board[i + d] && board[i + 2 * d] === "") return i + 2 * d;
    return -1;
  }
  function render(hop = -1) {
    padsEl.innerHTML = "";
    for (let i = 0; i < N; i++) {
      const pad = document.createElement("div"); pad.className = "pad";
      if (board[i]) {
        const f = document.createElement("span");
        f.className = "frog " + (board[i] === "R" ? "dir-right" : "orange");
        f.textContent = "🐸";
        if (targetOf(i) !== -1) f.classList.add("movable");
        if (i === hop) f.classList.add("hop");
        f.addEventListener("click", () => onFrog(i));
        pad.appendChild(f);
      }
      padsEl.appendChild(pad);
    }
    movesEl.textContent = moves;
  }
  function onFrog(i) {
    const t = targetOf(i);
    if (t === -1) return bad(statusEl, "הצפרדע הזו לא יכולה לזוז עכשיו.");
    history.push(board.slice());
    board[t] = board[i]; board[i] = ""; moves++;
    ok(statusEl, ""); Sound.move(); render(t); check();
  }
  function check() {
    const win = board[0] === "L" && board[1] === "L" && board[2] === "L" && board[3] === "" && board[4] === "R" && board[5] === "R" && board[6] === "R";
    if (win) {
      const extra = moves === 15 ? " ובמינימום המהלכים — מושלם!" : ` (אפשר גם ב־15 קפיצות)`;
      return showWin("frogs", "🏆", "הצפרדעים החליפו מקומות!", `סיימתם ב־${moves} קפיצות${extra}`, reset);
    }
    if (board.every((f, i) => !f || targetOf(i) === -1)) bad(statusEl, "נתקעתם! בטלו מהלך או התחילו מחדש.");
  }
  document.getElementById("frogs-undo").addEventListener("click", () => {
    if (!history.length) return; board = history.pop(); moves = Math.max(0, moves - 1); ok(statusEl, ""); Sound.click(); render();
  });
  document.getElementById("frogs-reset").addEventListener("click", () => { Sound.click(); reset(); });
  reset();
})();

/* =====================================================
   חידה 3: הגשר והנר
   ===================================================== */
(() => {
  const LIMIT = 17;
  const PEOPLE = [
    { id: "a", emoji: "⚡", name: "זריז", time: 1 },
    { id: "b", emoji: "🏃", name: "רץ", time: 2 },
    { id: "c", emoji: "🚶", name: "מטייל", time: 5 },
    { id: "d", emoji: "🧓", name: "סבא", time: 10 },
  ];
  let state, busy;
  const startEl = document.getElementById("people-start");
  const endEl = document.getElementById("people-end");
  const lampEl = document.getElementById("lamp");
  const timeEl = document.getElementById("bridge-time");
  const fillEl = document.getElementById("candle-fill");
  const candleEl = document.getElementById("candle-emoji");
  const statusEl = document.getElementById("bridge-status");

  function reset() {
    state = { side: Object.fromEntries(PEOPLE.map(p => [p.id, "start"])), lamp: "start", elapsed: 0, selected: new Set(), over: false };
    busy = false; ok(statusEl, ""); render();
  }
  function personEl(p) {
    const el = document.createElement("button"); el.className = "person";
    el.innerHTML = `<span class="p-emoji">${p.emoji}</span><span>${p.name}</span><span class="p-time">${p.time} דק'</span>`;
    if (state.side[p.id] !== state.lamp || state.over) el.classList.add("disabled");
    if (state.selected.has(p.id)) el.classList.add("selected");
    el.addEventListener("click", () => onPerson(p));
    return el;
  }
  function render() {
    startEl.innerHTML = ""; endEl.innerHTML = "";
    for (const p of PEOPLE) (state.side[p.id] === "start" ? startEl : endEl).appendChild(personEl(p));
    lampEl.classList.toggle("at-end", state.lamp === "end");
    timeEl.textContent = state.elapsed;
    const left = Math.max(0, LIMIT - state.elapsed);
    fillEl.style.width = (left / LIMIT * 100) + "%";
    candleEl.textContent = left === 0 ? "💨" : "🕯️";
  }
  function onPerson(p) {
    if (busy || state.over) return;
    if (state.side[p.id] !== state.lamp) return bad(statusEl, "הנר בצד השני — אי אפשר לחצות בחושך!");
    if (state.selected.has(p.id)) state.selected.delete(p.id);
    else if (state.selected.size >= 2) return bad(statusEl, "על הגשר עד שניים בלבד!");
    else state.selected.add(p.id);
    ok(statusEl, ""); Sound.move(); render();
  }
  function cross() {
    if (busy || state.over) return;
    if (state.selected.size === 0) return bad(statusEl, "בחרו קודם מי חוצה (עד שניים).");
    busy = true; Sound.click();
    const walkers = PEOPLE.filter(p => state.selected.has(p.id));
    const duration = Math.max(...walkers.map(p => p.time));
    const dest = state.lamp === "start" ? "end" : "start";
    state.lamp = dest; lampEl.classList.toggle("at-end", dest === "end");
    ok(statusEl, `${walkers.map(w => w.emoji + " " + w.name).join(" ו־")} חוצים... (${duration} דק')`);
    setTimeout(() => {
      busy = false;
      for (const w of walkers) state.side[w.id] = dest;
      state.elapsed += duration; state.selected.clear(); render();
      const all = PEOPLE.every(p => state.side[p.id] === "end");
      if (all && state.elapsed <= LIMIT) {
        state.over = true;
        const extra = state.elapsed === LIMIT ? " בדיוק בזמן — הפתרון האופטימלי!" : " ועוד נשאר נר!";
        showWin("bridge", "🎉", "כולם עברו לפני שהנר כבה!", `סיימתם ב־${state.elapsed}/${LIMIT} דקות.${extra}`, reset);
      } else if (state.elapsed >= LIMIT) {
        state.over = true; render();
        showLose("💨", "הנר כבה!", `עברו ${state.elapsed} דקות. רמז: שלחו את שני האיטיים יחד.`, reset);
      } else ok(statusEl, "");
    }, 1000);
  }
  document.getElementById("bridge-cross").addEventListener("click", cross);
  document.getElementById("bridge-reset").addEventListener("click", () => { Sound.click(); reset(); });
  reset();
})();

/* =====================================================
   חידה 4: מגדלי האנוי (3 טבעות, מ-ימין לשמאל)
   ===================================================== */
(() => {
  const DISKS = 3;
  const COLORS = ["#f472b6", "#6ee7ff", "#ffc24d", "#4ade80"];
  const WIDTHS = [46, 62, 78, 94];
  let pegs, moves, sel, history;
  const scene = document.getElementById("hanoi-scene");
  const movesEl = document.getElementById("hanoi-moves");
  const statusEl = document.getElementById("hanoi-status");
  const LABELS = ["מטרה 🏁", "", "התחלה"]; // עמודים 0,1,2 (0=שמאל)

  function reset() {
    // עמוד 2 (ימין) מלא: הגדולה למטה. אצלנו index גדול = טבעת גדולה יותר
    pegs = [[], [], []];
    for (let d = DISKS; d >= 1; d--) pegs[2].push(d);
    moves = 0; sel = null; history = []; ok(statusEl, ""); render();
  }
  function topSize(i) { return pegs[i].length ? pegs[i][pegs[i].length - 1] : Infinity; }
  function render() {
    scene.innerHTML = "";
    pegs.forEach((stack, i) => {
      const peg = document.createElement("div"); peg.className = "peg";
      if (sel === null && stack.length) peg.classList.add("selectable");
      if (sel === i) peg.classList.add("source");
      else if (sel !== null && topSize(i) > pegs[sel][pegs[sel].length - 1]) peg.classList.add("selectable");
      stack.forEach((d, idx) => {
        const disk = document.createElement("div"); disk.className = "disk";
        disk.style.width = WIDTHS[d - 1] + "px";
        disk.style.background = `linear-gradient(#ffffff40, transparent), ${COLORS[d - 1]}`;
        disk.textContent = d;
        if (sel === i && idx === stack.length - 1) disk.classList.add("lifted");
        peg.appendChild(disk);
      });
      const lbl = document.createElement("div"); lbl.className = "peg-base-label"; lbl.textContent = LABELS[i];
      peg.appendChild(lbl);
      peg.addEventListener("click", () => onPeg(i));
      scene.appendChild(peg);
    });
    movesEl.textContent = moves;
  }
  function onPeg(i) {
    if (sel === null) {
      if (!pegs[i].length) return bad(statusEl, "אין טבעת להרים בעמוד הזה.");
      sel = i; ok(statusEl, "בחרו עמוד יעד."); Sound.move(); render();
      return;
    }
    if (i === sel) { sel = null; ok(statusEl, ""); render(); return; } // ביטול בחירה
    const moving = pegs[sel][pegs[sel].length - 1];
    if (moving > topSize(i)) { sel = null; render(); return bad(statusEl, "אסור להניח טבעת גדולה על קטנה!"); }
    history.push(pegs.map(s => s.slice()));
    pegs[i].push(pegs[sel].pop()); sel = null; moves++;
    ok(statusEl, ""); Sound.move(); render(); check();
  }
  function check() {
    if (pegs[0].length === DISKS) {
      const opt = Math.pow(2, DISKS) - 1;
      const extra = moves === opt ? " ובמינימום המהלכים — מושלם!" : ` (אפשר גם ב־${opt} מהלכים)`;
      showWin("hanoi", "🗼", "המגדל הועבר!", `סיימתם ב־${moves} מהלכים${extra}`, reset);
    }
  }
  document.getElementById("hanoi-undo").addEventListener("click", () => {
    if (!history.length) return; pegs = history.pop(); moves = Math.max(0, moves - 1); sel = null; ok(statusEl, ""); Sound.click(); render();
  });
  document.getElementById("hanoi-reset").addEventListener("click", () => { Sound.click(); reset(); });
  reset();
})();

/* =====================================================
   חידה 5: כדי מים (3 ו-5 ליטר, מטרה 4)
   ===================================================== */
(() => {
  const CAP = { a: 3, b: 5 }, GOAL = 4;
  let jugs, moves, history, over;
  const movesEl = document.getElementById("jugs-moves");
  const statusEl = document.getElementById("jugs-status");
  const els = {
    a: { water: document.getElementById("water-a"), liters: document.getElementById("liters-a"), jug: document.getElementById("jug-a") },
    b: { water: document.getElementById("water-b"), liters: document.getElementById("liters-b"), jug: document.getElementById("jug-b") },
  };
  function reset() { jugs = { a: 0, b: 0 }; moves = 0; history = []; over = false; ok(statusEl, ""); render(); }
  function render(flash) {
    for (const k of ["a", "b"]) {
      els[k].water.style.height = (jugs[k] / CAP[k] * 100) + "%";
      els[k].liters.textContent = jugs[k];
      if (flash === k) { els[k].jug.classList.remove("flash"); void els[k].jug.offsetWidth; els[k].jug.classList.add("flash"); }
    }
    movesEl.textContent = moves;
  }
  function act(fn) {
    if (over) return;
    const before = JSON.stringify(jugs);
    history.push({ ...jugs });
    fn();
    if (JSON.stringify(jugs) === before) { history.pop(); return; } // בלי שינוי — לא סופרים
    moves++; ok(statusEl, ""); Sound.move(); render(); check();
  }
  function check() {
    const hit = jugs.a === GOAL ? "a" : jugs.b === GOAL ? "b" : null;
    if (hit) {
      over = true; render(hit);
      const extra = moves === 6 ? " ובמספר המהלכים המיטבי!" : ` (אפשר גם ב־6 מהלכים)`;
      showWin("jugs", "💧", `בדיוק ${GOAL} ליטר!`, `מדדתם ${GOAL} ליטר ב־${moves} מהלכים${extra}`, reset);
    }
  }
  document.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => {
    const k = b.dataset.jug, a = b.dataset.act;
    act(() => { if (a === "fill") jugs[k] = CAP[k]; else jugs[k] = 0; });
  }));
  document.querySelectorAll("[data-pour]").forEach(b => b.addEventListener("click", () => {
    const [from, to] = b.dataset.pour.split("");
    act(() => { const amt = Math.min(jugs[from], CAP[to] - jugs[to]); jugs[from] -= amt; jugs[to] += amt; });
  }));
  document.getElementById("jugs-reset").addEventListener("click", () => { Sound.click(); reset(); });
  reset();
})();

/* =====================================================
   חידה 6: מיסיונרים וקניבלים (3+3, סירה 1-2)
   ===================================================== */
(() => {
  // m = מיסיונרים בגדת ההתחלה, c = קניבלים בגדת ההתחלה, boat side
  let state, busy;
  const leftEl = document.getElementById("mc-left");
  const rightEl = document.getElementById("mc-right");
  const boatEl = document.getElementById("mc-boat");
  const seatsEl = document.getElementById("mc-seats");
  const movesEl = document.getElementById("mc-moves");
  const statusEl = document.getElementById("mc-status");

  function reset() {
    // people: לכל אחד id וסוג; מיקום start/goal/boat
    state = {
      people: [
        { id: "m1", t: "m", e: "😇" }, { id: "m2", t: "m", e: "😇" }, { id: "m3", t: "m", e: "😇" },
        { id: "c1", t: "c", e: "👹" }, { id: "c2", t: "c", e: "👹" }, { id: "c3", t: "c", e: "👹" },
      ],
      pos: {}, boatSide: "start", moves: 0, over: false,
    };
    state.people.forEach(p => state.pos[p.id] = "start");
    busy = false; ok(statusEl, ""); render();
  }
  function pieceEl(p, inBoat) {
    const el = document.createElement("span");
    el.className = "piece" + (inBoat ? " in-boat board" : "");
    el.textContent = p.e; el.title = p.t === "m" ? "מיסיונר" : "קניבל";
    el.addEventListener("click", () => onPiece(p.id));
    return el;
  }
  function render() {
    leftEl.innerHTML = ""; rightEl.innerHTML = ""; seatsEl.innerHTML = "";
    for (const p of state.people) {
      const w = state.pos[p.id];
      if (w === "start") leftEl.appendChild(pieceEl(p, false));
      else if (w === "goal") rightEl.appendChild(pieceEl(p, false));
      else seatsEl.appendChild(pieceEl(p, true));
    }
    boatEl.classList.toggle("at-right", state.boatSide === "goal");
    movesEl.textContent = state.moves;
  }
  function inBoatCount() { return state.people.filter(p => state.pos[p.id] === "boat").length; }
  function onPiece(id) {
    if (busy || state.over) return;
    const w = state.pos[id];
    if (w === "boat") { state.pos[id] = state.boatSide; Sound.move(); }
    else if (w === state.boatSide) {
      if (inBoatCount() >= 2) return bad(statusEl, "בסירה יש מקום לשניים בלבד!");
      state.pos[id] = "boat"; Sound.move();
    } else return bad(statusEl, "הסירה בגדה השנייה כרגע.");
    ok(statusEl, ""); render();
  }
  function safe() {
    // בכל גדה: אם יש מיסיונרים והקניבלים רבים מהם — לא בטוח
    for (const side of ["start", "goal"]) {
      const m = state.people.filter(p => p.t === "m" && state.pos[p.id] === side).length;
      const c = state.people.filter(p => p.t === "c" && state.pos[p.id] === side).length;
      if (m > 0 && c > m) return false;
    }
    return true;
  }
  function cross() {
    if (busy || state.over) return;
    if (inBoatCount() === 0) return bad(statusEl, "צריך לפחות נוסע אחד שיחתור.");
    busy = true; ok(statusEl, ""); Sound.click();
    state.boatSide = state.boatSide === "start" ? "goal" : "start";
    state.moves++;
    boatEl.classList.toggle("at-right", state.boatSide === "goal");
    movesEl.textContent = state.moves;
    setTimeout(() => {
      busy = false;
      // הנוסעים יורדים אוטומטית בגדה שהגיעו אליה
      state.people.forEach(p => { if (state.pos[p.id] === "boat") state.pos[p.id] = state.boatSide; });
      render();
      if (!safe()) {
        state.over = true;
        return showLose("💀", "הקניבלים גברו!", "באחת הגדות הקניבלים היו רוב מול המיסיונרים.", reset);
      }
      const done = state.people.every(p => state.pos[p.id] === "goal");
      if (done) {
        state.over = true;
        const extra = state.moves === 11 ? " ובמינימום החציות — מושלם!" : ` (אפשר גם ב־11 חציות)`;
        showWin("mc", "🎉", "כולם עברו בשלום!", `העברתם את כולם ב־${state.moves} חציות${extra}`, reset);
      }
    }, 1000);
  }
  document.getElementById("mc-cross").addEventListener("click", cross);
  document.getElementById("mc-reset").addEventListener("click", () => { Sound.click(); reset(); });
  reset();
})();
