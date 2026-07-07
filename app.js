"use strict";

/* ============ ניווט בין מסכים ============ */
const overlay = document.getElementById("overlay");
let dialogRetry = null;

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-goto]");
  if (!btn) return;
  if (overlay.classList.contains("show") && dialogRetry) dialogRetry();
  overlay.classList.remove("show");
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(btn.dataset.goto).classList.add("active");
});

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

/* =====================================================
   חידה 1: זאב, כבשה וחסה
   ===================================================== */
const River = (() => {
  const PIECES = [
    { id: "wolf",    emoji: "🐺", name: "הזאב" },
    { id: "sheep",   emoji: "🐑", name: "הכבשה" },
    { id: "cabbage", emoji: "🥬", name: "החסה" },
  ];
  let state, busy;

  const bankStart = document.getElementById("bank-left");
  const bankGoal  = document.getElementById("bank-right");
  const boatEl    = document.getElementById("boat");
  const seatsEl   = document.getElementById("boat-seats");
  const movesEl   = document.getElementById("river-moves");
  const statusEl  = document.getElementById("river-status");

  function reset() {
    state = {
      pos: { wolf: "start", sheep: "start", cabbage: "start" },
      boatSide: "start",
      moves: 0,
      over: false,
    };
    busy = false;
    setStatus("");
    render();
  }

  function setStatus(msg, bad = false) {
    statusEl.textContent = msg;
    statusEl.classList.toggle("bad", bad);
  }

  function pieceEl(p, inBoat) {
    const el = document.createElement("span");
    el.className = "piece" + (inBoat ? " in-boat" : "");
    el.textContent = p.emoji;
    el.title = p.name;
    el.addEventListener("click", () => onPiece(p.id));
    return el;
  }

  function render() {
    bankStart.innerHTML = "";
    bankGoal.innerHTML = "";
    seatsEl.innerHTML = '<span class="farmer">🧑‍🌾</span>';
    for (const p of PIECES) {
      const where = state.pos[p.id];
      if (where === "start") bankStart.appendChild(pieceEl(p, false));
      else if (where === "goal") bankGoal.appendChild(pieceEl(p, false));
      else seatsEl.appendChild(pieceEl(p, true));
    }
    boatEl.classList.toggle("at-right", state.boatSide === "goal");
    movesEl.textContent = state.moves;
  }

  function onPiece(id) {
    if (busy || state.over) return;
    const where = state.pos[id];
    if (where === "boat") {
      state.pos[id] = state.boatSide;              // ירידה לגדה
    } else if (where === state.boatSide) {
      const inBoat = PIECES.some(p => state.pos[p.id] === "boat");
      if (inBoat) { setStatus("בסירה יש מקום לנוסע אחד בלבד!", true); return; }
      state.pos[id] = "boat";                      // עלייה לסירה
    } else {
      setStatus("הסירה בגדה השנייה — אי אפשר להגיע לשם בלעדיה.", true);
      return;
    }
    setStatus("");
    render();
  }

  function cross() {
    if (busy || state.over) return;
    busy = true;
    setStatus("");
    state.boatSide = state.boatSide === "start" ? "goal" : "start";
    state.moves++;
    boatEl.classList.toggle("at-right", state.boatSide === "goal");
    movesEl.textContent = state.moves;

    setTimeout(() => {
      busy = false;
      // בדיקת טריפה בגדה שנשארה בלי האיכר
      const alone = state.boatSide === "start" ? "goal" : "start";
      const at = (id) => state.pos[id] === alone;
      if (at("wolf") && at("sheep")) return lose("🐺", "הזאב טרף את הכבשה!", "השארתם את הזאב לבד עם הכבשה בגדה בלי השגחה.");
      if (at("sheep") && at("cabbage")) return lose("🐑", "הכבשה אכלה את החסה!", "השארתם את הכבשה לבד עם החסה בגדה בלי השגחה.");
      render();
      // ניצחון: כולם בגדה השנייה (כולל מי שעדיין בסירה שהגיעה)
      const done = PIECES.every(p => state.pos[p.id] === "goal" || (state.pos[p.id] === "boat" && state.boatSide === "goal"));
      if (done) {
        state.over = true;
        const extra = state.moves === 7 ? " וגם בדרך הקצרה ביותר — כל הכבוד!" : ` (אפשר גם ב־7 חציות... נסו שוב?)`;
        showDialog("🎉", "כולם עברו בשלום!", `פתרתם את החידה ב־${state.moves} חציות${extra}`, reset);
      }
    }, 1000);
  }

  function lose(emoji, title, text) {
    state.over = true;
    render();
    showDialog(emoji === "🐺" ? "😱" : "😋", title, text, reset);
  }

  document.getElementById("river-cross").addEventListener("click", cross);
  document.getElementById("river-reset").addEventListener("click", reset);
  reset();
})();

/* =====================================================
   חידה 2: קפיצת הצפרדעים (3 מול 3)
   ===================================================== */
const Frogs = (() => {
  const N = 7;
  let board, moves, history;

  const padsEl   = document.getElementById("pads");
  const movesEl  = document.getElementById("frogs-moves");
  const statusEl = document.getElementById("frogs-status");

  function reset() {
    board = ["R", "R", "R", "", "L", "L", "L"];
    moves = 0;
    history = [];
    setStatus("");
    render();
  }

  function setStatus(msg, bad = false) {
    statusEl.textContent = msg;
    statusEl.classList.toggle("bad", bad);
  }

  function targetOf(i) {
    const d = board[i] === "R" ? 1 : -1;
    if (board[i + d] === "") return i + d;                       // צעד
    if (board[i + d] !== undefined && board[i + d] !== "" && board[i + 2 * d] === "") return i + 2 * d; // קפיצה
    return -1;
  }

  function render(hopIndex = -1) {
    padsEl.innerHTML = "";
    for (let i = 0; i < N; i++) {
      const pad = document.createElement("div");
      pad.className = "pad";
      if (board[i]) {
        const frog = document.createElement("span");
        frog.className = "frog " + (board[i] === "R" ? "dir-right" : "orange");
        frog.textContent = "🐸";
        if (targetOf(i) !== -1) frog.classList.add("movable");
        if (i === hopIndex) frog.classList.add("hop");
        frog.addEventListener("click", () => onFrog(i));
        pad.appendChild(frog);
      }
      padsEl.appendChild(pad);
    }
    movesEl.textContent = moves;
  }

  function onFrog(i) {
    const t = targetOf(i);
    if (t === -1) { setStatus("הצפרדע הזאת לא יכולה לזוז עכשיו.", true); return; }
    history.push(board.slice());
    board[t] = board[i];
    board[i] = "";
    moves++;
    setStatus("");
    render(t);
    check();
  }

  function check() {
    const win = board.join("") === "LLL" + "" + "RRR" && board[3] === "";
    if (win) {
      const extra = moves === 15 ? " ובמינימום המהלכים האפשרי — מושלם!" : ` (אפשר גם ב־15 קפיצות... נסו שוב?)`;
      showDialog("🏆", "הצפרדעים החליפו מקומות!", `סיימתם ב־${moves} קפיצות${extra}`, reset);
      return;
    }
    const stuck = board.every((f, i) => !f || targetOf(i) === -1);
    if (stuck) setStatus("אוי, נתקעתם! אף צפרדע לא יכולה לזוז. בטלו מהלך או התחילו מחדש.", true);
  }

  document.getElementById("frogs-undo").addEventListener("click", () => {
    if (!history.length) return;
    board = history.pop();
    moves = Math.max(0, moves - 1);
    setStatus("");
    render();
  });
  document.getElementById("frogs-reset").addEventListener("click", reset);
  reset();
})();

/* =====================================================
   חידה 3: הגשר והנר
   ===================================================== */
const Bridge = (() => {
  const LIMIT = 17;
  const PEOPLE = [
    { id: "a", emoji: "⚡", name: "זריז",  time: 1 },
    { id: "b", emoji: "🏃", name: "רץ",    time: 2 },
    { id: "c", emoji: "🚶", name: "מטייל", time: 5 },
    { id: "d", emoji: "🧓", name: "סבא",   time: 10 },
  ];
  let state, busy;

  const startEl  = document.getElementById("people-start");
  const endEl    = document.getElementById("people-end");
  const lampEl   = document.getElementById("lamp");
  const timeEl   = document.getElementById("bridge-time");
  const fillEl   = document.getElementById("candle-fill");
  const candleEl = document.getElementById("candle-emoji");
  const statusEl = document.getElementById("bridge-status");

  function reset() {
    state = {
      side: Object.fromEntries(PEOPLE.map(p => [p.id, "start"])),
      lamp: "start",
      elapsed: 0,
      selected: new Set(),
      over: false,
    };
    busy = false;
    setStatus("");
    render();
  }

  function setStatus(msg, bad = false) {
    statusEl.textContent = msg;
    statusEl.classList.toggle("bad", bad);
  }

  function personEl(p) {
    const el = document.createElement("button");
    el.className = "person";
    el.innerHTML = `<span class="p-emoji">${p.emoji}</span><span>${p.name}</span><span class="p-time">${p.time} דק'</span>`;
    if (state.side[p.id] !== state.lamp || state.over) el.classList.add("disabled");
    if (state.selected.has(p.id)) el.classList.add("selected");
    el.addEventListener("click", () => onPerson(p));
    return el;
  }

  function render() {
    startEl.innerHTML = "";
    endEl.innerHTML = "";
    for (const p of PEOPLE) {
      (state.side[p.id] === "start" ? startEl : endEl).appendChild(personEl(p));
    }
    lampEl.classList.toggle("at-end", state.lamp === "end");
    timeEl.textContent = state.elapsed;
    const left = Math.max(0, LIMIT - state.elapsed);
    fillEl.style.width = (left / LIMIT * 100) + "%";
    candleEl.textContent = left === 0 ? "💨" : "🕯️";
  }

  function onPerson(p) {
    if (busy || state.over) return;
    if (state.side[p.id] !== state.lamp) {
      setStatus("הנר נמצא בצד השני — אי אפשר לחצות בחושך!", true);
      return;
    }
    if (state.selected.has(p.id)) state.selected.delete(p.id);
    else if (state.selected.size >= 2) { setStatus("על הגשר יכולים ללכת לכל היותר שניים!", true); return; }
    else state.selected.add(p.id);
    setStatus("");
    render();
  }

  function cross() {
    if (busy || state.over) return;
    if (state.selected.size === 0) { setStatus("בחרו קודם מי חוצה (עד שניים).", true); return; }
    busy = true;
    const walkers = PEOPLE.filter(p => state.selected.has(p.id));
    const duration = Math.max(...walkers.map(p => p.time));
    const dest = state.lamp === "start" ? "end" : "start";

    state.lamp = dest;
    lampEl.classList.toggle("at-end", dest === "end");
    setStatus(`${walkers.map(w => w.emoji + " " + w.name).join(" ו־")} חוצים... (${duration} דק')`);

    setTimeout(() => {
      busy = false;
      for (const w of walkers) state.side[w.id] = dest;
      state.elapsed += duration;
      state.selected.clear();
      render();

      const allAcross = PEOPLE.every(p => state.side[p.id] === "end");
      if (allAcross && state.elapsed <= LIMIT) {
        state.over = true;
        const extra = state.elapsed === LIMIT ? " ממש על הקשקש — זה בדיוק הפתרון האופטימלי!" : " ועוד נשאר נר — מרשים!";
        showDialog("🎉", "כולם עברו לפני שהנר כבה!", `סיימתם ב־${state.elapsed} דקות מתוך ${LIMIT}.${extra}`, reset);
      } else if (state.elapsed >= LIMIT) {
        state.over = true;
        render();
        showDialog("💨", "הנר כבה!", `עברו ${state.elapsed} דקות ולא כולם הספיקו לחצות. רמז: לפעמים שווה לשלוח את האיטיים יחד.`, reset);
      } else {
        setStatus("");
      }
    }, 1000);
  }

  document.getElementById("bridge-cross").addEventListener("click", cross);
  document.getElementById("bridge-reset").addEventListener("click", reset);
  reset();
})();
