const AppEngine = window.MovingApp;
let state = AppEngine.loadState();

if (!state.activeTab) {
  state.activeTab = 'dashboard';
  AppEngine.saveState(state);
}

// Global Definitions for Mobile Grid Bubble Mapping Matrix
// category: 'general' shows above the two columns; 'apartment' = finding a new place;
// 'moveout' = moving out of the current place.
const appSections = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', category: 'general' },
  { id: 'savings', label: 'Savings', icon: '💵', category: 'general' },
  { id: 'aptsearch', label: 'Apartment Hunt', icon: '🔍', category: 'apartment' },
  { id: 'apartments', label: 'Apartment Tracker', icon: '🏢', category: 'apartment' },
  { id: 'tasks', label: 'Move Timeline', icon: '📋', category: 'moveout' },
  { id: 'supplies', label: 'Supplies', icon: '📦', category: 'moveout' },
  { id: 'rooms', label: 'Room Packing', icon: '🧳', category: 'moveout' },
  { id: 'boxes', label: 'Box Inventory', icon: '🏷️', category: 'moveout' },
  { id: 'movers', label: 'Movers', icon: '🚛', category: 'moveout' },
  { id: 'addressutil', label: 'Address & Utilities', icon: '⚡', category: 'moveout' },
  { id: 'dayof', label: 'Move Day', icon: '🎯', category: 'moveout' }
];

// --- CORE ANIMATION ---
function playWelcomeAnimation() {
  if (!state.userName || !state.targetMoveDate || sessionStorage.getItem('hasAnimated')) return;

  const overlay = document.createElement('div');
  overlay.id = 'mt-welcome-overlay';
  
  overlay.innerHTML = `
    <div class="mt-welcome-scene">
      <div class="mt-road"></div>
      <div class="mt-house" aria-hidden="true">
        <div class="mt-house-roof"></div>
        <div class="mt-house-body">
          <span class="mt-house-window window-left"></span>
          <span class="mt-house-window window-right"></span>
          <span class="mt-house-door"></span>
        </div>
      </div>
      <img src="src/assets/moving-truck-clean.png" class="mt-truck-img" alt="Moving Truck" onerror="console.error('IMAGE FAILED TO LOAD: Check your local folder directory structure')" />
      <div class="mt-ground-box box-left-large" aria-hidden="true">📦</div>
      <div class="mt-ground-box box-left-mid" aria-hidden="true">📦</div>
      <div class="mt-box">📦</div>
    </div>
    <div class="welcome-content">
      <h1 style="font-size: 48px; font-weight: 800; margin-bottom: 10px;">Moving Assistant</h1>
      <p style="color: var(--text-muted); font-size: 20px;">Welcome back, ${esc(state.userName || 'friend')}.</p>
      <button id="mt-enter-app" class="mt-wizard-btn" style="margin-top: 20px; width: auto; padding: 15px 40px; font-size: 18px;">Resume Move</button>
      <button id="mt-start-new" style="display:block; margin: 15px auto; background:none; border:none; color:var(--text-muted); cursor:pointer;">Start New Move</button>
    </div>
  `;
  
  overlay.querySelector('#mt-enter-app').addEventListener('click', () => {
    overlay.style.transition = 'opacity 0.5s';
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 500);
  });

  overlay.querySelector('#mt-start-new').addEventListener('click', () => {
    if (confirm('Are you sure you want to completely clear your move data? This cannot be undone.')) {
      localStorage.removeItem(AppEngine.STORAGE_KEY);
      sessionStorage.removeItem('hasAnimated');
      location.reload();
    }
  });

  document.body.appendChild(overlay);
  sessionStorage.setItem('hasAnimated', 'true');
}

// --- CELEBRATIONS ---
function spawnConfetti(big) {
  const colors = ['#007aff', '#34c759', '#ff9500', '#ff3b30', '#eb6eaf'];
  const count = big ? 100 : 45;
  const layer = document.createElement('div');
  layer.className = 'mt-confetti-layer';
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'mt-confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = (Math.random() * 0.35) + 's';
    piece.style.animationDuration = (1.8 + Math.random() * 1.2) + 's';
    layer.appendChild(piece);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 3200);
}

function isPhaseComplete(phase) {
  return phase.items.every((_, i) => !!state.checked[phase.id + '-' + i]);
}

function checkPhaseCelebration(key) {
  const allPhases = [...AppEngine.TIMELINE_DATA_MATRIX, ...AppEngine.APT_PHASES];
  const phase = allPhases.find(p => key.startsWith(p.id + '-'));
  if (phase && isPhaseComplete(phase)) spawnConfetti(false);
}

function isAllDone() {
  const total = totalTaskCount();
  return total > 0 && doneTaskCount() === total;
}

function getFunStat() {
  const packedRooms = AppEngine.ROOMS.filter(r => state.rooms[r] === 'Packed').length;
  const days = daysUntilMove();
  if (packedRooms > 0 && packedRooms < AppEngine.ROOMS.length) {
    return `${packedRooms} of ${AppEngine.ROOMS.length} rooms fully packed. Keep going!`;
  }
  if (packedRooms === AppEngine.ROOMS.length && AppEngine.ROOMS.length > 0) {
    return `Every room packed. You are basically a moving professional now.`;
  }
  if (days > 0 && days <= 7) {
    return `${days} day${days === 1 ? '' : 's'} to go. This is the home stretch.`;
  }
  return `Use the room suggestions to donate before you pack. Every item that leaves now is one less item to move.`;
}

// --- MOBILE INTERACTION WINDOW HOOKS ---
window.openMobileMenu = function() {
  const existing = document.getElementById('mt-mobile-nav-overlay');
  if (existing) existing.remove();

  const total = totalTaskCount();
  const done = doneTaskCount();
  const pct = total ? Math.round((done / total) * 100) : 0;

  const overlay = document.createElement('div');
  overlay.id = 'mt-mobile-nav-overlay';
  overlay.className = 'mt-mobile-menu-overlay';

  const bubble = sec => `
    <button type="button" class="mt-bubble-item ${state.activeTab === sec.id ? 'active' : ''}" data-mobile-tab="${sec.id}">
      <span class="mt-bubble-icon">${sec.icon}</span>
      <span>${sec.label}</span>
    </button>
  `;
  const generalSecs = appSections.filter(s => s.category === 'general');
  const aptSecs = appSections.filter(s => s.category === 'apartment');
  const moveoutSecs = appSections.filter(s => s.category === 'moveout');

  overlay.innerHTML = `
    <div class="mt-mobile-menu-header">
      <h2>Move Map</h2>
      <button class="mt-mobile-menu-close" id="mt-mobile-menu-close">×</button>
    </div>
    <div class="mt-mobile-grid-bubbles mt-general-row">
      ${generalSecs.map(bubble).join('')}
    </div>
    <div class="mt-mobile-groups">
      <div class="mt-mobile-column">
        <div class="mt-mobile-column-title">🔑 Finding an Apartment</div>
        <div class="mt-mobile-grid-bubbles">${aptSecs.map(bubble).join('')}</div>
      </div>
      <div class="mt-mobile-column">
        <div class="mt-mobile-column-title">📦 Moving Out</div>
        <div class="mt-mobile-grid-bubbles">${moveoutSecs.map(bubble).join('')}</div>
      </div>
    </div>
    <div class="mt-mobile-menu-bottom">
      <div class="mt-progress-meta"><span>MOVE PROGRESS</span><span>${pct}% Done</span></div>
      <div class="mt-progress-track" style="margin-bottom:15px;"><div class="mt-progress-fill" style="width:${pct}%"></div></div>
      <button class="mt-wizard-btn" id="mobile-gear-trigger" style="margin-bottom: 10px; width: 100%;">⚙️ Edit Move Details</button>
      <div style="display:flex; gap:10px;">
         <button class="mt-wizard-btn" id="mobile-export-trigger" style="flex:1; background:#8e8e93;">Export JSON</button>
         <button class="mt-wizard-btn" id="mobile-import-trigger" style="flex:1; background:#8e8e93;">Import JSON</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#mt-mobile-menu-close').addEventListener('click', () => overlay.remove());
  overlay.querySelectorAll('[data-mobile-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeTab = btn.getAttribute('data-mobile-tab');
      AppEngine.saveState(state);
      overlay.remove();
      render();
    });
  });

  // Wire up structural menu system hooks inside mobile overlay shell context
  document.getElementById('mobile-gear-trigger').addEventListener('click', () => {
    overlay.remove(); state.showWizardOverride = true; render();
  });
  document.getElementById('mobile-export-trigger').addEventListener('click', () => {
    overlay.remove();
    document.getElementById('mt-export-backup').click();
  });
  document.getElementById('mobile-import-trigger').addEventListener('click', () => {
    overlay.remove();
    document.getElementById('mt-import-backup').click();
  });
}

// --- RENT BUDGET SELECT DROPDOWN REUSABLE HTML GENERATOR ---
function renderRentDropdownHtml(elementId, placeholderText, activeValue) {
  let html = `<select id="${elementId}" style="padding:10px; border:1px solid var(--border-color); border-radius:8px; font-size:13px; background:#fff; flex:1; min-width:120px;">`;
  html += `<option value="">${placeholderText}</option>`;
  for (let rent = 2500; rent <= 5000; rent += 250) {
    html += `<option value="${rent}" ${activeValue == rent ? 'selected' : ''}>$${rent.toLocaleString()}</option>`;
  }
  html += `</select>`;
  return html;
}

// --- HELPERS ---
function getKnownCheckKeys() {
  const keys = [];
  AppEngine.TIMELINE_DATA_MATRIX.forEach(phase => phase.items.forEach((_, i) => keys.push(phase.id + '-' + i)));
  AppEngine.APT_PHASES.forEach(phase => phase.items.forEach((_, i) => keys.push(phase.id + '-' + i)));
  (AppEngine.APT_HUNT_GUIDES || []).forEach(guide => guide.items.forEach((_, i) => keys.push(`apt-guide-${guide.id}-${i}`)));
  AppEngine.SUPPLIES.forEach((_, i) => keys.push('supply-' + i));
  AppEngine.ADDRESS_CHANGES.forEach((_, i) => keys.push('addr-' + i));
  (AppEngine.SAVINGS_PLAYS || []).forEach((_, i) => keys.push('saving-' + i));
  (AppEngine.MOVE_DAY_STAGES || []).forEach(stage => {
    stage.items.forEach((_, i) => keys.push('dayof-' + stage.title.replace(/\W+/g, '-').toLowerCase() + '-' + i));
  });
  return keys;
}

function getRoomChecklistTotal() {
  return AppEngine.ROOMS.reduce((sum, room) => sum + (AppEngine.ROOM_PACKING_GUIDE[room] || []).length, 0);
}

function getRoomChecklistDone() {
  return AppEngine.ROOMS.reduce((sum, room) => {
    const guide = AppEngine.ROOM_PACKING_GUIDE[room] || [];
    const checklist = state.roomChecklist[room] || {};
    return sum + guide.filter(g => !!checklist[g.item]).length;
  }, 0);
}

function totalTaskCount() {
  return getKnownCheckKeys().length + getRoomChecklistTotal();
}

function doneTaskCount() {
  const checkedCount = getKnownCheckKeys().filter(k => !!state.checked[k]).length;
  return checkedCount + getRoomChecklistDone();
}

function getMoveDayOfWeek(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
}

function daysUntilMove() {
  if (!state.targetMoveDate) return 0;
  const now = new Date();
  const parts = state.targetMoveDate.split('-');
  const move = new Date(parts[0], parts[1] - 1, parts[2]);
  return Math.ceil((move - now) / (1000 * 60 * 60 * 24));
}

function getRoomFocusItem() {
  const days = daysUntilMove();
  const hasStartedPacking = AppEngine.ROOMS.some(room => state.rooms[room] === 'In progress');
  if (days > 28 && !hasStartedPacking) return null;

  for (const room of AppEngine.ROOMS) {
    const guide = AppEngine.ROOM_PACKING_GUIDE[room] || [];
    const checklist = state.roomChecklist[room] || {};
    const done = guide.filter(g => checklist[g.item]).length;
    if (done > 0 && done < guide.length) {
      const next = guide.find(g => !checklist[g.item]);
      return next ? { text: `${room}: ${next.item}`, phase: `${guide.length - done} item${guide.length - done === 1 ? '' : 's'} left in this room`, tab: 'rooms', type: 'room', done: { kind: 'room', room, item: next.item } } : null;
    }
  }
  for (const room of AppEngine.ROOMS) {
    const guide = AppEngine.ROOM_PACKING_GUIDE[room] || [];
    const checklist = state.roomChecklist[room] || {};
    const next = guide.find(g => !checklist[g.item]);
    if (next) return { text: `${room}: ${next.item}`, phase: 'Start with one tiny packing win', tab: 'rooms', type: 'room', done: { kind: 'room', room, item: next.item } };
  }
  return null;
}

function getUtilityFocusItem() {
  const missing = AppEngine.UTILITIES.find(u => {
    const rec = state.utilities[u] || {};
    return !rec.oldCancelDate || !rec.newStartDate;
  });
  if (!missing) return null;
  const guide = AppEngine.UTILITY_GUIDE[missing];
  return { text: `${missing}: add provider/date details`, phase: guide ? `Best timing: ${guide.lead}` : 'Utility timing', tab: 'addressutil', type: 'utility' };
}

function getBoxFocusItem() {
  const boxes = state.boxes || [];
  const days = daysUntilMove();
  if (!boxes.length) {
    return days > 28
      ? { text: 'Start with suggested Box 1: off-season closet items', phase: 'Good early packing, 6-8 weeks out', tab: 'boxes', type: 'box' }
      : { text: 'Create your open-first and next packing boxes', phase: 'Unpacking gets easier when boxes are searchable', tab: 'boxes', type: 'box' };
  }
  const openFirst = boxes.filter(b => b.openFirst && b.status !== 'unpacked').length;
  if (days <= 14 && openFirst > 0) return { text: `${openFirst} open-first box${openFirst === 1 ? '' : 'es'} to keep easy to reach`, phase: 'Do not bury these in the truck', tab: 'boxes', type: 'box' };
  return null;
}

function getEligiblePhases(phases, days) {
  const sorted = [...phases].sort((a, b) => b.weeksOut - a.weeksOut);
  const earliest = sorted[0];
  if (earliest && days > earliest.weeksOut * 7) return [earliest];
  return phases.filter(phase => {
    const phaseStart = phase.weeksOut * 7;
    const previous = phases
      .filter(p => p.weeksOut < phase.weeksOut)
      .sort((a, b) => b.weeksOut - a.weeksOut)[0];
    const phaseEnd = previous ? previous.weeksOut * 7 : -1;
    return days <= phaseStart && days > phaseEnd;
  });
}

function getPhaseFocusItem(phases, options = {}) {
  const days = daysUntilMove();
  const eligible = options.timingAware ? getEligiblePhases(phases, days) : phases;
  const phasePool = eligible.length ? eligible : phases.slice(-1);
  for (const phase of phasePool) {
    for (let i = 0; i < phase.items.length; i++) {
      const key = phase.id + '-' + i;
      if (!state.checked[key]) {
        return {
          text: phase.items[i],
          phase: phase.label,
          tab: phases === AppEngine.APT_PHASES ? 'aptsearch' : 'tasks',
          type: 'timeline',
          done: { kind: 'check', key }
        };
      }
    }
  }
  return null;
}

function getApartmentGuideFocusItem() {
  for (const guide of (AppEngine.APT_HUNT_GUIDES || [])) {
    for (let i = 0; i < guide.items.length; i++) {
      const key = `apt-guide-${guide.id}-${i}`;
      if (!state.checked[key]) {
        return { text: guide.items[i], phase: guide.title, tab: 'aptsearch', type: 'apartment', done: { kind: 'check', key } };
      }
    }
  }
  return null;
}

function getBackupFocusItem() {
  if (state.backupExportedAt) return null;
  return { text: 'Export one backup before the chaos gets spicy', phase: 'Data safety', tab: 'dashboard', type: 'backup', done: { kind: 'backup' } };
}

function getTodaysFocusItems() {
  const days = daysUntilMove();
  const items = [];

  if (days <= 7) {
    const essentialsKey = 'movingwk-1';
    items.push({
      text: 'Pack / confirm your open-first essentials box',
      phase: 'Move week survival mode',
      tab: 'dayof',
      type: 'urgent',
      done: state.checked[essentialsKey] ? null : { kind: 'check', key: essentialsKey }
    });
  }

  const timeline = getPhaseFocusItem(AppEngine.TIMELINE_DATA_MATRIX, { timingAware: true });
  if (timeline) items.push(timeline);

  const apt = getPhaseFocusItem(AppEngine.APT_PHASES, { timingAware: true }) || getApartmentGuideFocusItem();
  if (apt) items.push(apt);

  const box = getBoxFocusItem();
  if (box) items.push(box);

  const utility = getUtilityFocusItem();
  if (days <= 21 && utility) items.push(utility);

  const room = getRoomFocusItem();
  if (room) items.push(room);

  const backup = getBackupFocusItem();
  if (backup) items.push(backup);

  if (!items.length) return [{ text: "No urgent tasks — go drink water and admire your progress.", phase: 'All clear', tab: 'dashboard', type: 'clear' }];

  const seen = new Set();
  return items.filter(item => {
    const key = item.text + '|' + item.tab;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 3);
}

function getTodaysFocus() {
  return getTodaysFocusItems()[0];
}

function getDynamicCalendarRange(targetDateStr, weeksOut) {
  if (!targetDateStr) return 'Range Unset';
  const parts = targetDateStr.split('-');
  const moveDate = new Date(parts[0], parts[1] - 1, parts[2]);
  const endOffset = moveDate.getTime() - ((weeksOut === 0 ? 0 : weeksOut - 1) * 7 * 24 * 60 * 60 * 1000);
  const startOffset = moveDate.getTime() - (weeksOut * 7 * 24 * 60 * 60 * 1000);
  const formatOptions = { month: 'short', day: 'numeric' };
  if (weeksOut === 0) return `Move Day: ${moveDate.toLocaleDateString('en-US', formatOptions)}`;
  return `${new Date(startOffset).toLocaleDateString('en-US', formatOptions)} – ${new Date(endOffset).toLocaleDateString('en-US', formatOptions)}`;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function encodeAttrData(value) {
  return esc(encodeURIComponent(String(value || '')));
}

function decodeAttrData(value) {
  try { return decodeURIComponent(value || ''); } catch (e) { return value || ''; }
}

function updateRoomStatus(room) {
  const guide = AppEngine.ROOM_PACKING_GUIDE[room] || [];
  const checklist = state.roomChecklist[room] || {};
  const checkedCount = guide.filter(g => checklist[g.item]).length;
  state.rooms[room] = checkedCount === 0 ? 'Not started' : (checkedCount === guide.length ? 'Packed' : 'In progress');
}

function getPctDone() {
  const total = totalTaskCount();
  return total ? Math.min(100, Math.round((doneTaskCount() / total) * 100)) : 0;
}

function celebrateOnce(key, big) {
  if (!state.celebrationLog) state.celebrationLog = {};
  if (state.celebrationLog[key]) return;
  state.celebrationLog[key] = new Date().toISOString();
  AppEngine.saveState(state);
  spawnConfetti(!!big);
}

function maybeCelebrateProgress(beforePct) {
  const afterPct = getPctDone();
  if (beforePct < 50 && afterPct >= 50) celebrateOnce('progress-50', false);
  if (beforePct < 100 && afterPct >= 100) celebrateOnce('progress-100', true);
}

function renderFocusDoneButton(item) {
  if (!item.done) return '';
  if (item.done.kind === 'check') {
    return `<button class="mt-mini-action" data-focus-complete="check" data-focus-key="${esc(item.done.key)}">Done</button>`;
  }
  if (item.done.kind === 'room') {
    return `<button class="mt-mini-action" data-focus-complete="room" data-focus-room="${encodeAttrData(item.done.room)}" data-focus-item="${encodeAttrData(item.done.item)}">Done</button>`;
  }
  if (item.done.kind === 'backup') {
    return `<button class="mt-mini-action" data-export-now="true">Export</button>`;
  }
  return '';
}

// --- RENDER FUNCTIONS ---
function renderHeader() {
  const days = daysUntilMove();
  let urgencyClass = 'countdown-safe';
  if (days <= 14) urgencyClass = 'countdown-urgent';
  else if (days <= 45) urgencyClass = 'countdown-warning';
  const weekday = getMoveDayOfWeek(state.targetMoveDate);
  const parts = state.targetMoveDate.split('-');
  const moveDateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  const formattedMoveDate = moveDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const currentSec = appSections.find(s => s.id === state.activeTab);
  const sectionTitle = currentSec ? currentSec.label : 'Moving Assistant';

  return `
    <div class="mt-header">
      <div class="mt-title-area">
        <button class="mt-hamburger-btn" onclick="window.openMobileMenu()">☰</button>
        <div>
          <h1>${sectionTitle}</h1>
          <p>Target Date: <span style="font-size: 14px; color: var(--accent-primary); font-weight:700;">${formattedMoveDate} (${weekday})</span></p>
        </div>
      </div>
      <div class="mt-countdown ${urgencyClass}">
        <span class="n">${days >= 0 ? days : 0}</span>
        <span class="lbl">Days Left</span>
      </div>
    </div>
  `;
}

function renderSidebar() {
  const total = totalTaskCount();
  const done = doneTaskCount();
  const pct = total ? Math.round((done / total) * 100) : 0;
  const groupedSections = [
    { title: 'Home', sections: appSections.filter(s => s.category === 'general') },
    { title: 'Finding an Apartment', sections: appSections.filter(s => s.category === 'apartment') },
    { title: 'Moving Out', sections: appSections.filter(s => s.category === 'moveout') }
  ];

  return `
    <div class="mt-sidebar">
      <div class="mt-sidebar-top">
        <div class="mt-user-badge">
          <div class="welcome">Packing for a ${state.aptSize.toUpperCase()}</div>
          <div class="username">${esc(state.userName || 'Friend')}</div>
        </div>
        <div class="mt-nav">
          ${groupedSections.map(group => `
            <div class="mt-nav-group">
              <div class="mt-nav-heading">${esc(group.title)}</div>
              ${group.sections.map(sec => `<button data-tab="${sec.id}" class="${state.activeTab === sec.id ? 'active' : ''}">${sec.icon} ${sec.label}</button>`).join('')}
            </div>
          `).join('')}
        </div>
      </div>
      <div>
        <button class="mt-settings-trigger" id="mt-gear-settings">⚙️ Edit Move Details</button>
        <button class="mt-settings-trigger" id="mt-export-backup">⬇️ Export Backup</button>
        <button class="mt-settings-trigger" id="mt-import-backup">⬆️ Import Backup</button>
        <input type="file" id="mt-import-file" accept="application/json" style="display:none;" />
        <div class="mt-sidebar-progress">
          <div class="mt-progress-meta"><span>PROGRESS</span><span>${pct}% Done</span></div>
          <div class="mt-progress-track"><div class="mt-progress-fill" style="width:${pct}%"></div></div>
        </div>
      </div>
    </div>
  `;
}

function renderDashboard() {
  const days = Math.max(0, daysUntilMove());
  const total = totalTaskCount();
  const done = doneTaskCount();
  const pct = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const focusItems = getTodaysFocusItems();
  const packedRooms = AppEngine.ROOMS.filter(r => state.rooms[r] === 'Packed').length;
  const boxCount = (state.boxes || []).length;
  const openFirstCount = (state.boxes || []).filter(b => b.openFirst && b.status !== 'unpacked').length;
  const utilitiesDone = AppEngine.UTILITIES.filter(u => (state.utilities[u] || {}).status === 'done').length;
  const backupText = state.backupExportedAt ? `Last backup: ${new Date(state.backupExportedAt).toLocaleDateString()}` : 'No backup yet';
  const savings = estimateSavings();

  return `
    <div style="padding: 10px 0;">
      <div class="mt-hero-card">
        <h1>${getGreeting()}, ${esc(state.userName || 'friend')} 👋</h1>
        <p>${days <= 7 ? 'Home stretch. We are making this annoyingly manageable.' : 'One small win at a time. Cardboard fears you.'}</p>

        <div class="mt-recommendation">
          <h3>Today's focus</h3>
          <div class="mt-focus-list">
            ${focusItems.map(item => `
              <div class="mt-focus-row">
                <button class="mt-focus-main" data-focus-open="${esc(item.tab)}">
                  <span class="mt-focus-text">${esc(item.text)}</span>
                  <small>${esc(item.phase)}</small>
                </button>
                ${renderFocusDoneButton(item)}
              </div>
            `).join('')}
          </div>
        </div>

        <div class="mt-progress-container" style="max-width: 420px; margin: 30px auto 0 auto;">
          <div class="mt-progress-track">
            <div class="mt-progress-fill" style="width:${pct}%"></div>
          </div>
          <p style="margin-top: 10px; font-size: 13px; font-weight: 700; color: var(--text-muted);">${pct}% done · ${done}/${total} tiny wins · ${esc(backupText)}</p>
        </div>
      </div>

      <div class="mt-dashboard-metrics">
        <div class="mt-card" style="padding: 20px; margin:0; text-align:center;">
          <div style="font-size: 28px; font-weight: 800; color:var(--text-main);">${days}</div>
          <div class="mt-metric-label">Days left</div>
        </div>
        <div class="mt-card" style="padding: 20px; margin:0; text-align:center;">
          <div style="font-size: 28px; font-weight: 800; color:var(--text-main);">${packedRooms}/${AppEngine.ROOMS.length}</div>
          <div class="mt-metric-label">Rooms packed</div>
        </div>
        <div class="mt-card" style="padding: 20px; margin:0; text-align:center;">
          <div style="font-size: 28px; font-weight: 800; color:var(--text-main);">${boxCount}</div>
          <div class="mt-metric-label">Boxes logged</div>
        </div>
        <div class="mt-card" style="padding: 20px; margin:0; text-align:center;">
          <div style="font-size: 28px; font-weight: 800; color:var(--text-main);">${savings.hasInputs ? `$${savings.low.toLocaleString()}–$${savings.high.toLocaleString()}` : 'Add details'}</div>
          <div class="mt-metric-label">Avoidable costs</div>
        </div>
      </div>

      <div class="mt-card" style="padding: 16px 20px; background: rgba(0,122,255,0.04); border-color: rgba(0,122,255,0.12); margin:20px 0 0;">
        <p style="margin: 0; font-size: 13.5px; font-weight: 600; text-align:center; color: var(--text-main);">${esc(getFunStat())}${openFirstCount ? ` · ${openFirstCount} open-first box${openFirstCount === 1 ? '' : 'es'} should stay easy to grab.` : ''}</p>
      </div>
    </div>
  `;
}

function estimateSavings() {
  const s = state.savings || {};
  const deposit = Math.max(0, parseFloat(s.depositAmount) || 0);
  const moverHourlyRate = Math.max(0, parseFloat(s.moverHourlyRate) || 0);
  const avoidedMoverHours = Math.max(0, parseFloat(s.avoidedMoverHours) || 0);
  const reusedBoxes = Math.max(0, parseInt(s.reusedBoxes, 10) || 0);
  const avoidedDuplicateBuys = Math.max(0, parseFloat(s.avoidedDuplicateBuys) || 0);
  const hasInputs = deposit > 0 || moverHourlyRate > 0 || reusedBoxes > 0 || avoidedDuplicateBuys > 0;
  const depositLow = Math.round(deposit * 0.1);
  const depositHigh = Math.round(deposit * 0.5);
  const moverSavings = Math.round(moverHourlyRate * avoidedMoverHours);
  const boxSavings = Math.round(reusedBoxes * 2.5);
  const low = depositLow + moverSavings + boxSavings + avoidedDuplicateBuys;
  const high = depositHigh + moverSavings + boxSavings + avoidedDuplicateBuys;
  return { low, high, depositLow, depositHigh, moverSavings, boxSavings, avoidedDuplicateBuys, hasInputs };
}

function renderSavings() {
  const s = state.savings || {};
  const savings = estimateSavings();
  const plays = AppEngine.SAVINGS_PLAYS || [];
  return `
    <div class="mt-alert-box">
      <strong>The money thesis:</strong> this app saves money by preventing avoidable charges: mover overtime, duplicate supply runs, lost deposit deductions, missed donation/resale windows, and last-minute convenience purchases.
    </div>
    <div class="mt-dashboard-metrics">
      <div class="mt-card" style="padding:18px; margin:0; text-align:center;"><div class="mt-box-big">$${savings.low.toLocaleString()}–$${savings.high.toLocaleString()}</div><div class="mt-metric-label">Estimated avoidable costs</div></div>
      <div class="mt-card" style="padding:18px; margin:0; text-align:center;"><div class="mt-box-big">$${savings.depositLow.toLocaleString()}–$${savings.depositHigh.toLocaleString()}</div><div class="mt-metric-label">Deposit risk protected</div></div>
      <div class="mt-card" style="padding:18px; margin:0; text-align:center;"><div class="mt-box-big">$${savings.moverSavings.toLocaleString()}</div><div class="mt-metric-label">Mover overtime avoided</div></div>
      <div class="mt-card" style="padding:18px; margin:0; text-align:center;"><div class="mt-box-big">$${(savings.boxSavings + savings.avoidedDuplicateBuys).toLocaleString()}</div><div class="mt-metric-label">Supply/duplicate buys avoided</div></div>
    </div>
    <div class="mt-card">
      <div class="mt-card-header"><h3>Savings estimate</h3></div>
      <div class="mt-card-body" style="padding:16px 20px;">
        <div class="mt-util-fields">
          <label>Security deposit amount<input type="number" min="0" data-savings-field="depositAmount" value="${esc(s.depositAmount || '')}" placeholder="e.g. 3500" /></label>
          <label>Mover hourly rate<input type="number" min="0" data-savings-field="moverHourlyRate" value="${esc(s.moverHourlyRate || '')}" placeholder="e.g. 225" /></label>
          <label>Mover hours avoided<input type="number" min="0" step="0.5" data-savings-field="avoidedMoverHours" value="${esc(s.avoidedMoverHours || '')}" placeholder="e.g. 1.5" /></label>
          <label>Borrowed/reused boxes<input type="number" min="0" data-savings-field="reusedBoxes" value="${esc(s.reusedBoxes || '')}" placeholder="e.g. 20" /></label>
          <label>Duplicate buys avoided<input type="number" min="0" data-savings-field="avoidedDuplicateBuys" value="${esc(s.avoidedDuplicateBuys || '')}" placeholder="e.g. 80" /></label>
        </div>
      </div>
    </div>
    <div class="mt-card">
      <div class="mt-card-header"><h3>Money-saving plays</h3></div>
      <div class="mt-card-body">
        ${plays.map((play, i) => {
          const key = 'saving-' + i;
          const isDone = !!state.checked[key];
          return `
            <div class="mt-item ${isDone ? 'done' : ''}">
              <input type="checkbox" class="mt-check" data-check="${key}" ${isDone ? 'checked' : ''} aria-label="${esc(play.title)}" />
              <div class="mt-item-text" data-check="${key}">
                <strong>${esc(play.title)}</strong>
                <div style="font-size:12px; color:var(--text-muted); margin-top:3px; line-height:1.45;">${esc(play.detail)}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function renderPhaseList(phases) {
  return phases.map(phase => {
    return `
      <div class="mt-card">
        <div class="mt-card-header">
          <h3>${esc(phase.label)}</h3>
          <span class="date-range">${getDynamicCalendarRange(state.targetMoveDate, phase.weeksOut)}</span>
        </div>
        <div class="mt-card-body">
          ${phase.items.map((text, i) => {
            const key = phase.id + '-' + i;
            const isDone = !!state.checked[key];
            return `
              <div class="mt-item ${isDone ? 'done' : ''}">
                <input type="checkbox" class="mt-check" data-check="${key}" ${isDone ? 'checked' : ''} aria-label="${esc(text)}" />
                <div class="mt-item-text" data-check="${key}">${esc(text)}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function renderTasks() {
  return `
    <div class="mt-alert-box">
      <strong>COI = Certificate of Insurance.</strong> Many apartment buildings require your mover to send this proof of insurance before move day. Ask each building for its exact COI wording, send that to your booked mover, then forward the completed COI back to building management for approval.
    </div>
    <div class="mt-alert-box">
      <strong>Security deposit plan:</strong> check your lease before patching or painting. Usually small nail holes can be spackled, but large damage, paint matching, and wall anchors may have building-specific rules. Keep before/after photos and send your forwarding address when you return keys.
    </div>
    ${renderPhaseList(AppEngine.TIMELINE_DATA_MATRIX)}
  `;
}

function renderAptSearch() {
  const neighborhoods = state.neighborhoods || [];
  const outreach = AppEngine.APT_OUTREACH_GUIDE || {};
  const guideCards = (AppEngine.APT_HUNT_GUIDES || []).map(guide => `
    <div class="mt-card">
      <div class="mt-card-header"><h3>${esc(guide.emoji)} ${esc(guide.title)}</h3></div>
      <div class="mt-card-body">
        ${guide.items.map((item, i) => {
          const key = `apt-guide-${guide.id}-${i}`;
          const isDone = !!state.checked[key];
          return `
            <div class="mt-item ${isDone ? 'done' : ''}">
              <input type="checkbox" class="mt-check" data-check="${key}" ${isDone ? 'checked' : ''} aria-label="${esc(item)}" />
              <div class="mt-item-text" data-check="${key}">${esc(item)}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');

  return `
    <div class="mt-alert-box">
      <strong>Apartment hunt cheat sheet:</strong> The best listings tend to matter most closer to move-in, so being ready beats endless browsing. Keep your renter docs ready before you tour.
    </div>
    <div class="mt-card" style="margin-bottom:16px;">
      <div class="mt-card-header"><h3>Search setup</h3></div>
      <div class="mt-card-body">
        <div class="mt-two-col-form">
          <label>City / market<input type="text" id="mt-city-input" placeholder="e.g. New York, Chicago, Austin" value="${esc(state.city || '')}" /></label>
          <label>Add neighborhood<input type="text" id="mt-neighborhood-input" placeholder="e.g. Park Slope" /></label>
        </div>
        <button class="mt-wizard-btn" id="mt-neighborhood-add" style="width:auto; padding:10px 14px; margin-top:8px;">Add neighborhood</button>
        <div class="mt-chip-row" style="margin-top:12px;">
          ${neighborhoods.length ? neighborhoods.map((n, i) => `<span class="mt-chip">${esc(n)} <button data-neighborhood-remove="${i}" aria-label="Remove ${esc(n)}">×</button></span>`).join('') : '<span class="mt-empty">No neighborhoods yet. Add a few so this stops feeling like a one-person app.</span>'}
        </div>
      </div>
    </div>
    <div class="mt-guide-grid">${guideCards}</div>
    <div class="mt-card mt-template-card">
      <div class="mt-card-header"><h3>Agent outreach playbook</h3></div>
      <div class="mt-card-body" style="padding:16px 20px;">
        <div class="mt-two-col-list">
          <div>
            <strong>Best timing</strong>
            <ul>${(outreach.bestTimes || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
          </div>
          <div>
            <strong>If they do not respond</strong>
            <ul>${(outreach.followUp || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
          </div>
        </div>
        <div class="mt-template-grid">
          <label>Email template<textarea class="mt-script-box">${esc(outreach.emailTemplate || '')}</textarea></label>
          <label>Phone script<textarea class="mt-script-box">${esc(outreach.phoneScript || '')}</textarea></label>
        </div>
      </div>
    </div>
    <div class="mt-card" style="margin: 0 0 16px 0; border-color: rgba(0,122,255,0.16); background: rgba(0,122,255,0.035);">
      <div class="mt-card-body" style="padding:14px 18px; font-size:13px; line-height:1.5;">
        <strong>NYC note:</strong> the FARE Act changed broker-fee rules in 2025. If a landlord's broker tries to charge you, verify who they represent before paying anything. Keep this note editable/removable for non-NYC users.
      </div>
    </div>
    ${renderPhaseList(AppEngine.APT_PHASES)}
  `;
}

// Given a listing URL, return a display hostname + a favicon <img>/emoji fallback.
// Centralized here so the upcoming real-image-preview work only has to change one spot.
function getListingSourceInfo(url) {
  if (!url) return { hostname: 'Listing URL', faviconUrl: '🏢' };
  try {
    const parsedUrl = new URL(url);
    return {
      hostname: parsedUrl.hostname.replace('www.', ''),
      faviconUrl: `<img src="https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=32" alt="favicon" style="width:28px; height:28px; object-fit:contain;" />`
    };
  } catch (e) {
    return { hostname: 'External Reference Link', faviconUrl: '🔗' };
  }
}

// Known real-estate sites that block third-party unfurl bots outright — no point
// spending a request against these, just go straight to the manual-photo prompt.
const BLOCKED_PREVIEW_DOMAINS = ['streeteasy.com', 'zillow.com', 'apartments.com'];
function isKnownBlockedDomain(url) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return BLOCKED_PREVIEW_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
  } catch (e) {
    return false;
  }
}

// Tries to fetch a real preview image for a listing URL via microlink.io's free
// unfurl API (same idea as an iMessage link preview). Some sites (StreetEasy,
// Zillow, Apartments.com) block this outright — checked before we even try.
async function fetchListingPreview(url) {
  if (isKnownBlockedDomain(url)) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = await res.json();
    const imageUrl = json?.data?.image?.url || json?.data?.logo?.url;
    return imageUrl ? { image: imageUrl } : null;
  } catch (e) {
    return null;
  }
}

// Downscales an uploaded photo to a reasonable size before storing it as base64 in
// localStorage, so a handful of manual photos don't blow the storage quota.
function compressImageFile(file, maxWidth) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderApartments() {
  const list = state.apartments || [];
  const filter = state.aptFilter || 'all';
  const visibleList = filter === 'favorites' ? list.filter(a => a.favorite) : list;
  const maxTargetRent = parseFloat(state.targetBudgetMax) || 0;

  const cards = visibleList.length ? visibleList.slice().reverse().map((a) => {
    const i = list.indexOf(a);
    const status = a.status || 'Visited'; 
    let statusClass = 'mt-badge-optimal';
    if (status === 'Applied') statusClass = 'mt-badge-stretching';
    else if (status === 'Rejected') statusClass = 'mt-badge-fail';
    else if (status === 'Lease Signed') statusClass = 'mt-badge-success';

    const links = a.links && a.links.length ? a.links : (a.url ? [a.url] : []);
    const primaryUrl = links[0];
    const { hostname, faviconUrl } = getListingSourceInfo(primaryUrl);
    const imageFrame = a.image
      ? `<img src="${esc(a.image)}" alt="${esc(a.name)}" />`
      : faviconUrl;

    const minRentText = a.minRent ? `$${parseFloat(a.minRent).toLocaleString()}` : "Any";
    const maxRentText = a.maxRent ? `$${parseFloat(a.maxRent).toLocaleString()}` : "Any";

    const extraChips = links.slice(1).map(link => {
      const info = getListingSourceInfo(link);
      return `<a href="${esc(link)}" target="_blank" rel="noopener noreferrer" class="mt-apt-link-chip">${esc(info.hostname)}</a>`;
    }).join(' ');

    return `
      <div class="mt-apt-card">
        <div class="mt-apt-card-top">
          <div>
            <h4 style="margin:0 0 4px 0; font-size:16px;">${esc(a.name)}</h4>
            <span style="font-size:12px; color:var(--text-muted); font-weight:500;">Target rent: ${minRentText} – ${maxRentText}</span>
            <div style="margin-top: 10px;">
              ${AppEngine.APT_STATUSES.map(s => `
                <button data-apt-status="${i}" data-status-val="${s}" 
                  style="font-size: 10px; padding: 3px 8px; margin-right: 4px; margin-top: 4px; border-radius: 4px; border: 1px solid var(--border-color); cursor: pointer; ${status === s ? 'background: var(--accent-primary); color: white;' : 'background: white;'}"
                >${s}</button>
              `).join('')}
            </div>
          </div>
          <div style="text-align:right;">
            <button data-apt-favorite="${i}" class="mt-apt-favorite-btn" aria-label="Toggle favorite">${a.favorite ? '★' : '☆'}</button>
            <div class="mt-apt-price">${a.price ? '$' + parseFloat(a.price).toLocaleString() + '/mo' : '—'}</div>
            <span class="mt-apt-status ${statusClass}">${status}</span>
          </div>
        </div>

        ${primaryUrl ? `
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <a href="${esc(primaryUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none; display:block; flex:1; min-width:0;">
              <div class="mt-apt-imessage-bubble">
                <div class="mt-apt-image-frame">${imageFrame}</div>
                <div class="mt-apt-preview-text">
                  <span class="mt-apt-preview-headline">${esc(a.name || 'View Apartment Listing')}</span>
                  <span class="mt-apt-preview-sub">${esc(hostname)}</span>
                </div>
              </div>
            </a>
            ${!a.image ? `
              <label class="mt-apt-photo-cta">
                📷 Add photo
                <input type="file" accept="image/*" data-apt-photo="${i}" style="display:none;" />
              </label>
            ` : ''}
          </div>
        ` : ''}

        ${extraChips ? `<div style="margin-top:8px; display:flex; gap:6px; flex-wrap:wrap;">${extraChips}</div>` : ''}

        <div style="margin-top: 12px; display:flex; gap:14px; flex-wrap:wrap; align-items:center;">
          <button data-apt-addlink="${i}" style="font-size: 11px; background: none; border: none; color: var(--accent-primary); cursor: pointer; padding:0;">+ Add another source</button>
          ${a.image ? `
            <label style="font-size: 11px; color: var(--accent-primary); cursor: pointer;">
              📷 Replace photo
              <input type="file" accept="image/*" data-apt-photo="${i}" style="display:none;" />
            </label>
          ` : ''}
          <button data-apt-remove="${i}" style="font-size: 11px; background: none; border: none; color: var(--accent-danger); cursor: pointer; padding:0;">Delete Listing</button>
        </div>
      </div>
    `;
  }).join('') : `<div class="mt-empty">${filter === 'favorites' ? 'No favorites yet — tap ☆ on a listing to save it here.' : 'No apartments logged yet.'}</div>`;

  return `
    <div class="mt-income-wrapper">
      <label>Target Budget Range ($/mo):</label>
      <div style="display:flex; gap:10px; align-items:center; margin-bottom: 12px;">
        ${renderRentDropdownHtml('mt-apt-min-rent', 'Min Target Rent', state.targetBudgetMin || '')}
        <span style="color: var(--text-muted); font-weight:600;">–</span>
        ${renderRentDropdownHtml('mt-apt-max-rent', 'Max Target Rent', state.targetBudgetMax || '')}
      </div>
      ${maxTargetRent > 0 ? `
        <p style="font-size: 12.5px; color: var(--text-muted); margin: 0; line-height: 1.45;">
          Sanity check: for a $${maxTargetRent.toLocaleString()}/mo max, many landlords look for income around
          <strong>$${(maxTargetRent * 40).toLocaleString()}/year</strong> under the common 40x rent rule.
        </p>
      ` : ''}
    </div>
    <div class="mt-apt-form" style="display:flex; flex-direction:column; gap:10px; margin-top: 20px;">
      <input type="text" id="mt-apt-name" placeholder="Address / Building Name" style="width:100%; box-sizing:border-box;" />
      <input type="url" id="mt-apt-url" placeholder="Paste Listing URL Link (StreetEasy, Zillow, etc.)" style="width:100%; box-sizing:border-box;" />
      <input type="number" id="mt-apt-price" placeholder="Rent Amount/mo" style="width:100%; box-sizing:border-box;" />
      <button class="mt-wizard-btn" id="mt-apt-submit" style="width: 100%;">Add Apartment</button>
    </div>
    <div style="margin-top: 20px; display:flex; gap:8px;">
      <button data-apt-filter="all" class="mt-apt-filter-tab ${filter === 'all' ? 'active' : ''}">All (${list.length})</button>
      <button data-apt-filter="favorites" class="mt-apt-filter-tab ${filter === 'favorites' ? 'active' : ''}">★ Favorites (${list.filter(a => a.favorite).length})</button>
    </div>
    <div style="margin-top: 16px;">
      ${cards}
    </div>
  `;
}

function renderSupplies() {
  const boxCalculations = AppEngine.calculateSuppliesConfig(state.aptSize);
  return `
    <div style="font-family:'Oswald', sans-serif; font-size:14px; text-transform:uppercase; margin-bottom:10px; color:var(--text-muted); font-weight:700; letter-spacing:0.02em;">Your rough box forecast:</div>
    <div class="mt-supply-metrics">
      <div class="mt-supply-badge"><span class="count">${boxCalculations.small}</span><span class="label">Small Boxes</span></div>
      <div class="mt-supply-badge"><span class="count">${boxCalculations.medium}</span><span class="label">Medium Boxes</span></div>
      <div class="mt-supply-badge"><span class="count">${boxCalculations.large}</span><span class="label">Large Boxes</span></div>
      <div class="mt-supply-badge"><span class="count">${boxCalculations.tape} Rolls</span><span class="label">Packing Tape</span></div>
      <div class="mt-supply-badge"><span class="count">${boxCalculations.paper} Packs</span><span class="label">Wrapping Paper</span></div>
    </div>
    <p style="font-size:12px; color:var(--text-muted); margin: 4px 0 20px;">
      For the boxes/tape/paper above: <a href="https://www.amazon.com/s?k=moving+boxes+kit" target="_blank" rel="noopener noreferrer">Amazon moving box kits</a>,
      U-Haul's box centers (they buy back unused boxes), or a FedEx Office/The UPS Store if you just need a handful of sturdy ones.
    </p>
    <div class="mt-card">
      <div class="mt-card-header"><h3>Stuff to buy before the tape panic</h3></div>
      <div class="mt-card-body">
        ${AppEngine.SUPPLIES.map((supply, i) => {
          const key = 'supply-' + i;
          const isDone = !!state.checked[key];
          const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(supply.name)}`;
          return `
            <div class="mt-item ${isDone ? 'done' : ''}">
              <input type="checkbox" class="mt-check" data-check="${key}" ${isDone ? 'checked' : ''} aria-label="${esc(supply.name)}" />
              <div class="mt-item-text" data-check="${key}">
                ${esc(supply.name)}
                <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
                  Try: ${esc(supply.store)} · <a href="${amazonUrl}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();">Search on Amazon</a>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderMovers() {
  return `
    <div class="mt-card" style="margin-bottom: 20px;">
      <div class="mt-card-header"><h3>Starter mover list</h3></div>
      <div class="mt-card-body">
        <p class="mt-muted-copy" style="margin-top:0;">These are starter defaults. Add/edit your own quotes below, especially if your move is outside NYC.</p>
        <div class="mt-mover-grid">
          ${AppEngine.MOVERS.map(m => `
            <div class="mt-mover">
              <h4>${esc(m.name)}</h4>
              <p style="color:var(--accent-primary); font-weight:600; font-family:monospace; margin:4px 0;">${esc(m.phone)}</p>
              <p>${esc(m.desc)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="mt-card">
      <div class="mt-card-header"><h3>Your mover quotes</h3></div>
      <div class="mt-card-body">
        <div class="mt-apt-form" style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px; padding: 10px 0;">
          <input type="text" id="mover-name" placeholder="Company name" style="width:100%; box-sizing:border-box;" />
          <input type="text" id="mover-phone" placeholder="Phone" style="width:100%; box-sizing:border-box;" />
          <input type="text" id="mover-notes" placeholder="Notes (quote, reviews, etc.)" style="width:100%; box-sizing:border-box;" />
          <button class="mt-wizard-btn" id="mover-add-btn" style="width:100%;">Add Mover</button>
        </div>
        ${state.customMovers.length === 0
          ? '<p style="color:var(--text-muted); font-size:13px; text-align:center; padding:10px 0;">Add any other movers you\'re getting quotes from.</p>'
          : `<div class="mt-mover-grid">
              ${state.customMovers.map((m, i) => `
                <div class="mt-mover">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <h4>${esc(m.name)}</h4>
                    <span data-remove-mover="${i}" style="cursor:pointer; color:var(--text-muted); font-size:16px; padding:0 4px;">✕</span>
                  </div>
                  ${m.phone ? `<p style="color:var(--accent-primary); font-weight:600; font-family:monospace; margin:4px 0;">${esc(m.phone)}</p>` : ''}
                  ${m.notes ? `<p>${esc(m.notes)}</p>` : ''}
                </div>
              `).join('')}
            </div>`
        }
      </div>
    </div>
  `;
}

const ROOM_ICONS = { 'Kitchen': '🍳', 'Bedroom': '🛏️', 'Bathroom': '🚿', 'Closet': '👕', 'Living Room': '🛋️', 'Entryway/Storage': '📦' };
const ACTION_TAGS = {
  'bring': { label: 'Bring', color: '#2f6fed' },
  'buy-new': { label: 'Buy new at destination', color: '#c9832f' },
  'donate': { label: 'Donate / purge', color: '#3f9e5e' },
  'optional': { label: 'Optional', color: '#8a8a94' }
};

function renderDonationSuggestions() {
  const suggestions = AppEngine.DONATION_GUIDE || {};
  const rooms = AppEngine.ROOMS.filter(room => Array.isArray(suggestions[room]) && suggestions[room].length);
  return `
    <div class="mt-card mt-donation-sweep">
      <div class="mt-card-header">
        <div>
          <h3>Donation sweep</h3>
          <p class="mt-muted-copy" style="margin:4px 0 0;">No item-by-item logging. Use these as default purge prompts while you pack each room.</p>
        </div>
        <button class="mt-secondary-btn" data-tab-jump="boxes">Open box plan</button>
      </div>
      <div class="mt-donation-grid">
        ${rooms.map(room => `
          <div class="mt-donation-room">
            <h4>${esc(ROOM_ICONS[room] || '📦')} ${esc(room)}</h4>
            <ul>${suggestions[room].map(item => `<li>${esc(item)}</li>`).join('')}</ul>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderRooms() {
  const cards = AppEngine.ROOMS.map(room => {
    const guide = AppEngine.ROOM_PACKING_GUIDE[room] || [];
    const checklist = state.roomChecklist[room] || {};
    const checkedCount = guide.filter(g => checklist[g.item]).length;
    const total = guide.length;
    const status = state.rooms[room] || 'Not started';
    let statusColor = 'var(--text-muted)';
    if (status === 'In progress') statusColor = '#c9832f';
    else if (status === 'Packed') statusColor = '#3f9e5e';

    return `
      <details class="mt-cat mt-room-card" ${status !== 'Packed' ? 'open' : ''}>
        <summary style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; list-style:none;">
          <h4 style="margin:0; display:flex; align-items:center; gap:8px;"><span>${ROOM_ICONS[room] || '📦'}</span>${esc(room)}</h4>
          <span style="font-size:11.5px; font-weight:700; color:${statusColor};">${checkedCount}/${total} packed</span>
        </summary>
        <div style="margin-top:12px; display:flex; flex-direction:column; gap:10px;">
          ${guide.map(g => {
            const isChecked = !!checklist[g.item];
            const tag = ACTION_TAGS[g.action];
            return `
              <label class="mt-room-item ${isChecked ? 'done' : ''}" style="display:flex; gap:10px; align-items:flex-start; cursor:pointer;">
                <input type="checkbox" class="mt-room-item-checkbox" data-room="${esc(room)}" data-item="${esc(g.item)}" ${isChecked ? 'checked' : ''} style="margin-top:3px; flex-shrink:0;" />
                <div>
                  <div style="font-size:13.5px; font-weight:600; ${isChecked ? 'text-decoration:line-through; color:var(--text-muted);' : ''}">
                    ${esc(g.item)}
                    ${tag ? `<span style="font-size:10px; font-weight:700; color:white; background:${tag.color}; padding:2px 7px; border-radius:10px; margin-left:6px; white-space:nowrap;">${tag.label}</span>` : ''}
                  </div>
                  <div style="font-size:12px; color:var(--text-muted); margin-top:3px; line-height:1.4;">${esc(g.tip)}</div>
                </div>
              </label>
            `;
          }).join('')}
        </div>
      </details>
    `;
  }).join('');

  return `
    <div class="mt-alert-box">
      <strong>Room flow:</strong> purge first, pack second, then use Box Inventory for the final box labels and contents.
    </div>
    ${renderDonationSuggestions()}
    <div class="mt-mover-grid" style="grid-template-columns: 1fr;">${cards}</div>
  `;
}


function getDateNudge(dateStr, leadText) {
  if (!dateStr) return leadText;
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const daysAway = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  if (daysAway < 0) return 'Date passed — double-check it happened.';
  if (daysAway <= 3) return 'Coming up fast. Confirm the window.';
  return leadText;
}

function renderAddressUtil() {
  const statusOptions = [
    ['not-started', 'Not started'],
    ['scheduled', 'Scheduled'],
    ['confirmed', 'Confirmed'],
    ['done', 'Done']
  ];
  const actionOptions = [
    ['transfer', 'Transfer'],
    ['cancel', 'Cancel'],
    ['start-new', 'Start new'],
    ['ask-building', 'Ask building']
  ];

  const cards = AppEngine.UTILITIES.map(u => {
    const rec = state.utilities[u] || {};
    const guide = AppEngine.UTILITY_GUIDE[u] || { lead: 'Set early', nudge: 'Confirm timing with your provider or building.' };
    return `
      <div class="mt-util-card">
        <div class="mt-util-head">
          <div>
            <h4>${esc(u)}</h4>
            <span>${esc(guide.lead)}</span>
          </div>
          <select data-util="${esc(u)}" data-util-field="status">
            ${statusOptions.map(([value, label]) => `<option value="${value}" ${rec.status === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </div>
        <p class="mt-util-nudge">${esc(getDateNudge(rec.newStartDate, guide.nudge))}</p>
        <div class="mt-util-fields">
          <label>Action<select data-util="${esc(u)}" data-util-field="action">${actionOptions.map(([value, label]) => `<option value="${value}" ${rec.action === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
          <label>Provider<input type="text" data-util="${esc(u)}" data-util-field="provider" value="${esc(rec.provider || '')}" placeholder="Provider name" /></label>
          <label>Phone / portal<input type="text" data-util="${esc(u)}" data-util-field="phone" value="${esc(rec.phone || '')}" placeholder="Phone, URL, or app" /></label>
          <label>Old place off<input type="date" data-util="${esc(u)}" data-util-field="oldCancelDate" value="${esc(rec.oldCancelDate || '')}" /></label>
          <label>New place on<input type="date" data-util="${esc(u)}" data-util-field="newStartDate" value="${esc(rec.newStartDate || '')}" /></label>
          <label>Account #<input type="text" data-util="${esc(u)}" data-util-field="account" value="${esc(rec.account || '')}" placeholder="Optional" /></label>
          <label>Confirmation #<input type="text" data-util="${esc(u)}" data-util-field="confirmation" value="${esc(rec.confirmation || '')}" placeholder="Optional" /></label>
          <label>Notes<input type="text" data-util="${esc(u)}" data-util-field="notes" value="${esc(rec.notes || '')}" placeholder="Appointment window, login, etc." /></label>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="mt-alert-box">
      <strong>Utility rule of thumb:</strong> internet gets weird fastest, so book it early. Electric/gas usually need less lead time, but appointment windows can still sneak up on you.
    </div>
    <div class="mt-card">
      <div class="mt-card-header"><h3>Update your address</h3></div>
      <div class="mt-card-body">
        ${AppEngine.ADDRESS_CHANGES.map((text, i) => {
          const key = 'addr-' + i;
          const isDone = !!state.checked[key];
          return `
            <div class="mt-item ${isDone ? 'done' : ''}">
              <input type="checkbox" class="mt-check" data-check="${key}" ${isDone ? 'checked' : ''} aria-label="${esc(text)}" />
              <div class="mt-item-text" data-check="${key}">${esc(text)}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    <div class="mt-guide-grid" style="margin-top:20px;">${cards}</div>
    <div class="mt-card" style="margin-top:4px;">
      <div class="mt-card-header"><h3>Important contacts</h3></div>
      <div class="mt-card-body">
        <div class="mt-util-fields">
          <label>Movers<input type="text" data-contact="movers" value="${esc(state.contacts?.movers || '')}" placeholder="Company / dispatcher / arrival window" /></label>
          <label>Current building<input type="text" data-contact="doorman" value="${esc(state.contacts?.doorman || '')}" placeholder="Doorman, super, management" /></label>
          <label>New building<input type="text" data-contact="newSuper" value="${esc(state.contacts?.newSuper || '')}" placeholder="Super, elevator, keys" /></label>
          <label>Emergency backup<input type="text" data-contact="emergency" value="${esc(state.contacts?.emergency || '')}" placeholder="Friend/family backup" /></label>
        </div>
      </div>
    </div>
  `;
}

function suggestedBoxToBox(suggestion, indexOverride) {
  const number = typeof indexOverride === 'number' ? indexOverride : ((state.boxes || []).length + 1);
  return {
    id: (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : 'box-' + Date.now() + '-' + Math.random().toString(16).slice(2),
    label: suggestion.label || `Box ${number}`,
    room: suggestion.room || 'Unassigned',
    contents: Array.isArray(suggestion.contents) ? [...suggestion.contents] : [],
    fragile: !!suggestion.fragile,
    openFirst: !!suggestion.openFirst,
    status: 'packed'
  };
}

function getSuggestedBoxKey(suggestion) {
  return `${(suggestion.label || '').toLowerCase()}|${(suggestion.room || '').toLowerCase()}`;
}

function renderBoxPlan() {
  const plan = AppEngine.DEFAULT_BOX_PLAN || [];
  const used = new Set((state.boxes || []).map(getSuggestedBoxKey));
  return `
    <div class="mt-card mt-box-plan-card">
      <div class="mt-card-header">
        <div>
          <h3>Suggested packing order</h3>
          <p class="mt-muted-copy" style="margin:4px 0 0;">Start with what you will not need for weeks. Kitchen daily-use boxes wait until later.</p>
        </div>
        <button class="mt-secondary-btn" id="mt-box-add-plan">Add all missing</button>
      </div>
      <div class="mt-box-plan-list">
        ${plan.map((suggestion, i) => {
          const alreadyUsed = used.has(getSuggestedBoxKey(suggestion));
          return `
            <div class="mt-box-plan-item ${alreadyUsed ? 'used' : ''}">
              <div class="mt-box-plan-num">${i + 1}</div>
              <div class="mt-box-plan-main">
                <div class="mt-box-plan-title">
                  <strong>${esc(suggestion.label)}</strong>
                  <span>${esc(suggestion.room)}</span>
                  ${suggestion.fragile ? '<em>Fragile</em>' : ''}
                  ${suggestion.openFirst ? '<em>Open first</em>' : ''}
                </div>
                <p>${esc(suggestion.note || '')}</p>
                <ul>${(suggestion.contents || []).map(item => `<li>${esc(item)}</li>`).join('')}</ul>
              </div>
              <button class="mt-mini-action" data-box-use-suggestion="${i}" ${alreadyUsed ? 'disabled' : ''}>${alreadyUsed ? 'Added' : 'Use'}</button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function moveBoxBefore(dragId, dropId) {
  if (!dragId || !dropId || dragId === dropId) return false;
  const boxes = state.boxes || [];
  const from = boxes.findIndex(b => b.id === dragId);
  const to = boxes.findIndex(b => b.id === dropId);
  if (from < 0 || to < 0) return false;
  const [moved] = boxes.splice(from, 1);
  boxes.splice(from < to ? to - 1 : to, 0, moved);
  return true;
}

function renderBoxes() {
  const query = (state.boxSearch || '').toLowerCase();
  const filter = state.boxStatusFilter || 'all';
  const allBoxes = state.boxes || [];
  const boxes = allBoxes.filter(box => {
    const haystack = [box.label, box.room, box.status, ...(box.contents || [])].join(' ').toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesFilter = filter === 'all'
      || (filter === 'open-first' && box.openFirst)
      || (filter === 'fragile' && box.fragile)
      || box.status === filter;
    return matchesQuery && matchesFilter;
  });
  const editingBox = allBoxes.find(b => b.id === state.editingBoxId);
  const roomOptions = ['Unassigned', ...AppEngine.ROOMS].map(room => `<option value="${esc(room)}" ${(editingBox?.room || '') === room ? 'selected' : ''}>${esc(room)}</option>`).join('');
  const nextNum = allBoxes.length + 1;
  const statusLabel = { packed: 'Packed', loaded: 'Loaded', arrived: 'Arrived', unpacked: 'Unpacked' };
  const counts = {
    all: allBoxes.length,
    'open-first': allBoxes.filter(b => b.openFirst).length,
    fragile: allBoxes.filter(b => b.fragile).length,
    packed: allBoxes.filter(b => b.status === 'packed').length,
    loaded: allBoxes.filter(b => b.status === 'loaded').length,
    arrived: allBoxes.filter(b => b.status === 'arrived').length,
    unpacked: allBoxes.filter(b => b.status === 'unpacked').length
  };
  const filterLabels = [
    ['all', 'All'],
    ['open-first', 'Open first'],
    ['fragile', 'Fragile'],
    ['packed', 'Packed'],
    ['loaded', 'Loaded'],
    ['arrived', 'Arrived'],
    ['unpacked', 'Unpacked']
  ];

  return `
    <div class="mt-alert-box">
      <strong>Packing order:</strong> Box 1 should be off-season closet stuff, not daily kitchen gear. Kitchen basics and open-first boxes belong much closer to move week.
    </div>
    <div class="mt-dashboard-metrics" style="margin-bottom:16px;">
      <div class="mt-card" style="padding:16px; margin:0; text-align:center;"><div class="mt-box-big">${allBoxes.length}</div><div class="mt-metric-label">Total boxes</div></div>
      <div class="mt-card" style="padding:16px; margin:0; text-align:center;"><div class="mt-box-big">${counts['open-first']}</div><div class="mt-metric-label">Open first</div></div>
      <div class="mt-card" style="padding:16px; margin:0; text-align:center;"><div class="mt-box-big">${counts.fragile}</div><div class="mt-metric-label">Fragile</div></div>
      <div class="mt-card" style="padding:16px; margin:0; text-align:center;"><div class="mt-box-big">${counts.unpacked}</div><div class="mt-metric-label">Unpacked</div></div>
    </div>
    ${renderBoxPlan()}
    <div class="mt-card">
      <div class="mt-card-header"><h3>${editingBox ? `Edit ${esc(editingBox.label)}` : 'Add a box'}</h3></div>
      <div class="mt-card-body" style="padding:16px 20px;">
        <div class="mt-box-form">
          <input type="text" id="mt-box-label" placeholder="Box ${nextNum}" value="${esc(editingBox?.label || '')}" />
          <select id="mt-box-room">${roomOptions}</select>
          <input type="text" id="mt-box-contents" placeholder="Contents, comma separated" value="${esc((editingBox?.contents || []).join(', '))}" />
          <label class="mt-box-check"><input type="checkbox" id="mt-box-fragile" ${editingBox?.fragile ? 'checked' : ''} /> Fragile</label>
          <label class="mt-box-check"><input type="checkbox" id="mt-box-open-first" ${editingBox?.openFirst ? 'checked' : ''} /> Open first</label>
          <button class="mt-wizard-btn" id="mt-box-add">${editingBox ? 'Update Box' : 'Add Box'}</button>
          ${editingBox ? '<button class="mt-secondary-btn" id="mt-box-cancel-edit">Cancel edit</button>' : ''}
        </div>
      </div>
    </div>
    <div class="mt-income-wrapper">
      <label>Search boxes</label>
      <input type="search" id="mt-box-search" value="${esc(state.boxSearch || '')}" placeholder="Try: mugs, router, towels, Kitchen..." />
    </div>
    <div class="mt-chip-row" style="margin: 0 0 16px 0;">
      ${filterLabels.map(([value, label]) => `<button class="mt-filter-chip ${filter === value ? 'active' : ''}" data-box-filter="${value}">${label} (${counts[value] || 0})</button>`).join('')}
    </div>
    <div class="mt-box-grid">
      ${boxes.length ? boxes.map(box => `
        <div class="mt-box-card ${box.openFirst ? 'open-first' : ''}" draggable="true" data-box-drag-id="${esc(box.id)}">
          <div class="mt-box-card-head">
            <div>
              <h4><span class="mt-drag-handle" aria-hidden="true">⋮⋮</span>${esc(box.label)}</h4>
              <span>${esc(box.room || 'Unassigned')}</span>
            </div>
            <div class="mt-box-actions">
              <button data-box-edit="${esc(box.id)}" aria-label="Edit ${esc(box.label)}">✎</button>
              <button data-box-remove="${esc(box.id)}" aria-label="Remove ${esc(box.label)}">×</button>
            </div>
          </div>
          <div class="mt-box-tags">
            ${box.fragile ? '<span>Fragile</span>' : ''}
            ${box.openFirst ? '<span>Open first</span>' : ''}
          </div>
          <ul>
            ${(box.contents || []).length ? box.contents.map(item => `<li>${esc(item)}</li>`).join('') : '<li class="mt-empty">No contents listed yet.</li>'}
          </ul>
          <select data-box-status="${esc(box.id)}">
            ${Object.keys(statusLabel).map(val => `<option value="${val}" ${box.status === val ? 'selected' : ''}>${statusLabel[val]}</option>`).join('')}
          </select>
        </div>
      `).join('') : '<div class="mt-empty">No boxes match that view yet.</div>'}
    </div>
  `;
}

function renderDayOf() {
  const tip = state.moverTip || { crewSize: 3, hours: 4, rate: 8, service: 'good' };
  const serviceMultiplier = tip.service === 'great' ? 1.25 : (tip.service === 'okay' ? 0.8 : 1);
  const perMover = Math.max(0, Math.round((tip.hours || 0) * (tip.rate || 0) * serviceMultiplier));
  const totalTip = perMover * (tip.crewSize || 0);
  const guide = AppEngine.MOVER_TIPPING_GUIDE || {};

  return `
    <div class="mt-alert-box">
      <strong>Move day mode:</strong> this is not the day for cleverness. Follow the run sheet, drink water, and protect the essentials box like it is a royal heirloom.
    </div>
    <div class="mt-guide-grid">
      ${AppEngine.MOVE_DAY_STAGES.map(stage => `
        <div class="mt-card">
          <div class="mt-card-header"><h3>${esc(stage.emoji)} ${esc(stage.title)}</h3></div>
          <div class="mt-card-body">
            ${stage.items.map((item, i) => {
              const key = 'dayof-' + stage.title.replace(/\W+/g, '-').toLowerCase() + '-' + i;
              const isDone = !!state.checked[key];
              return `
                <div class="mt-item ${isDone ? 'done' : ''}">
                  <input type="checkbox" class="mt-check" data-check="${key}" ${isDone ? 'checked' : ''} aria-label="${esc(item)}" />
                  <div class="mt-item-text" data-check="${key}">${esc(item)}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `).join('')}
    </div>

    <div class="mt-card mt-tip-card">
      <div class="mt-card-header"><h3>💵 Mover tipping guide</h3></div>
      <div class="mt-card-body">
        <p class="mt-muted-copy"><strong>Rule of thumb:</strong> ${esc(guide.simpleRule || '$5–$10 per mover per hour is a common practical range.')}</p>
        <div class="mt-util-fields">
          <label>Crew size<input type="number" min="1" max="12" data-tip-field="crewSize" value="${esc(tip.crewSize || 3)}" /></label>
          <label>Hours worked<input type="number" min="1" max="16" step="0.5" data-tip-field="hours" value="${esc(tip.hours || 4)}" /></label>
          <label>Base $ / mover / hour<input type="number" min="0" max="50" step="1" data-tip-field="rate" value="${esc(tip.rate || 8)}" /></label>
          <label>Service vibe<select data-tip-field="service">
            <option value="okay" ${tip.service === 'okay' ? 'selected' : ''}>Okay / basic</option>
            <option value="good" ${tip.service === 'good' ? 'selected' : ''}>Good</option>
            <option value="great" ${tip.service === 'great' ? 'selected' : ''}>Great / lifesavers</option>
          </select></label>
        </div>
        <div class="mt-tip-result">
          <div><span>Suggested per mover</span><strong>$${perMover.toLocaleString()}</strong></div>
          <div><span>Total tip</span><strong>$${totalTip.toLocaleString()}</strong></div>
        </div>
        <p class="mt-muted-copy">${esc(guide.cashNote || 'Cash in separate envelopes is easiest when you want each mover to get their share directly.')}</p>
        <div class="mt-two-col-list">
          <div><strong>Tip more for:</strong><ul>${(guide.raiseFor || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
          <div><strong>Tip less / ask questions for:</strong><ul>${(guide.lowerFor || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        </div>
      </div>
    </div>

    <div class="mt-card">
      <div class="mt-card-header"><h3>Extra reminders</h3></div>
      <div class="mt-card-body">
        <ul class="mt-tight-list">
          ${AppEngine.MOVE_TIPS.map(t => `<li>${esc(t)}</li>`).join('')}
        </ul>
      </div>
    </div>
    <textarea class="mt-notes-area" id="mt-notes" placeholder="Drop mover arrival windows, elevator info, super phone, food plan, or chaos notes here..." style="width:100%; min-height:180px; box-sizing:border-box; padding:12px; border-radius:8px; border:1px solid var(--border-color); font-family:inherit; font-size:13px; line-height:1.5; margin-top:15px;">${esc(state.notes || '')}</textarea>
  `;
}

function render() {
  const root = document.getElementById('move-tracker-root');
  if (!state.userName || !state.targetMoveDate || state.showWizardOverride) {
    root.innerHTML = `
      <div class="mt-wizard-overlay">
        <div class="mt-wizard-card">
          <h2>📦 Welcome! Let's Get Your Move On</h2>
          <p>Just the basics — we'll handle the rest.</p>
          <div class="mt-wizard-field"><label>What should we call you?</label><input type="text" id="wiz-name" placeholder="e.g. Andy" value="${esc(state.userName || '')}" /></div>
          <div class="mt-wizard-field"><label>When's moving day?</label><input type="date" id="wiz-date" value="${state.targetMoveDate || ''}" /></div>
          <div class="mt-wizard-field"><label>City / market</label><input type="text" id="wiz-city" placeholder="e.g. New York" value="${esc(state.city || '')}" /></div>
          <div class="mt-wizard-field">
            <label>How big's the place?</label>
            <select id="wiz-size">
              <option value="studio" ${state.aptSize === 'studio' ? 'selected' : ''}>Studio Layout</option>
              <option value="1br" ${state.aptSize === '1br' ? 'selected' : ''}>1-Bedroom Apartment</option>
              <option value="2br" ${state.aptSize === '2br' ? 'selected' : ''}>2-Bedroom Apartment</option>
              <option value="3br" ${state.aptSize === '3br' ? 'selected' : ''}>3-Bedroom Apartment</option>
            </select>
          </div>
          <button class="mt-wizard-btn" id="wiz-submit">Let's Do This</button>
        </div>
      </div>
    `;
    document.getElementById('wiz-submit').addEventListener('click', () => {
      const name = document.getElementById('wiz-name').value.trim();
      const date = document.getElementById('wiz-date').value;
      const size = document.getElementById('wiz-size').value;
      const city = document.getElementById('wiz-city').value.trim();
      if (!name || !date) return alert('Just need your name and move date to get started!');
      state.userName = name;
      state.targetMoveDate = date;
      state.aptSize = size;
      state.city = city;
      state.showWizardOverride = false;
      AppEngine.saveState(state);
      render();
    });
    return;
  }

  let body = '';
  if (state.activeTab === 'dashboard') body = renderDashboard();
  else if (state.activeTab === 'tasks') body = renderTasks();
  else if (state.activeTab === 'savings') body = renderSavings();
  else if (state.activeTab === 'aptsearch') body = renderAptSearch();
  else if (state.activeTab === 'apartments') body = renderApartments();
  else if (state.activeTab === 'supplies') body = renderSupplies();
  else if (state.activeTab === 'boxes') body = renderBoxes();
  else if (state.activeTab === 'movers') body = renderMovers();
  else if (state.activeTab === 'rooms') body = renderRooms();
  else if (state.activeTab === 'addressutil') body = renderAddressUtil();
  else if (state.activeTab === 'dayof') body = renderDayOf();

  root.innerHTML = `
    ${renderSidebar()}
    <div class="mt-main-content">
      ${renderHeader()}
      <div class="mt-scroll-body">${body}</div>
    </div>
  `;
  attachHandlers();
}

function attachHandlers() {
  const root = document.getElementById('move-tracker-root');
  
  const gearBtn = root.querySelector('#mt-gear-settings');
  if (gearBtn) gearBtn.addEventListener('click', () => { state.showWizardOverride = true; render(); });

  const exportBtn = root.querySelector('#mt-export-backup');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `moving-assistant-backup-${dateStamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
      state.backupExportedAt = new Date().toISOString();
      AppEngine.saveState(state);
      render();
    });
  }

  root.querySelectorAll('[data-export-now]').forEach(btn => {
    btn.addEventListener('click', () => {
      const exportTrigger = root.querySelector('#mt-export-backup');
      if (exportTrigger) exportTrigger.click();
    });
  });

  const importBtn = root.querySelector('#mt-import-backup');
  const importFile = root.querySelector('#mt-import-file');
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', () => {
      const file = importFile.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          if (!confirm('This will replace your current data with the backup file. Continue?')) return;
          state = AppEngine.sanitizeState(parsed);
          AppEngine.saveState(state);
          render();
        } catch (e) {
          alert('That file could not be read as a valid backup.');
        }
      };
      reader.readAsText(file);
      importFile.value = '';
    });
  }

  // Apartment Tracker budget listeners connected to the drop option selectors
  const budgetMinInput = root.querySelector('#mt-apt-min-rent');
  if (budgetMinInput) {
    budgetMinInput.addEventListener('change', () => { state.targetBudgetMin = budgetMinInput.value; AppEngine.saveState(state); render(); });
  }

  const budgetMaxInput = root.querySelector('#mt-apt-max-rent');
  if (budgetMaxInput) {
    budgetMaxInput.addEventListener('change', () => { state.targetBudgetMax = budgetMaxInput.value; AppEngine.saveState(state); render(); });
  }

  root.querySelectorAll('.mt-nav [data-tab]').forEach(btn => {
    btn.addEventListener('click', () => { state.activeTab = btn.getAttribute('data-tab'); AppEngine.saveState(state); render(); });
  });

  root.querySelectorAll('[data-tab-jump]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeTab = btn.getAttribute('data-tab-jump') || 'dashboard';
      AppEngine.saveState(state);
      render();
    });
  });

  root.querySelectorAll('[data-focus-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeTab = btn.getAttribute('data-focus-open') || 'dashboard';
      AppEngine.saveState(state);
      render();
    });
  });

  root.querySelectorAll('[data-focus-complete]').forEach(btn => {
    btn.addEventListener('click', () => {
      const beforePct = getPctDone();
      const kind = btn.getAttribute('data-focus-complete');
      if (kind === 'check') {
        const key = btn.getAttribute('data-focus-key');
        if (key) state.checked[key] = true;
      } else if (kind === 'room') {
        const room = decodeAttrData(btn.getAttribute('data-focus-room'));
        const item = decodeAttrData(btn.getAttribute('data-focus-item'));
        if (!state.roomChecklist[room]) state.roomChecklist[room] = {};
        state.roomChecklist[room][item] = true;
        updateRoomStatus(room);
        if (state.rooms[room] === 'Packed') celebrateOnce('room-' + room, false);
      } else if (kind === 'backup') {
        state.backupExportedAt = new Date().toISOString();
      }
      AppEngine.saveState(state);
      maybeCelebrateProgress(beforePct);
      render();
    });
  });

  root.querySelectorAll('[data-check]').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.getAttribute('data-check');
      const turningOn = !state.checked[key];
      const beforePct = getPctDone();
      state.checked[key] = !state.checked[key];
      AppEngine.saveState(state);
      if (turningOn) {
        checkPhaseCelebration(key);
        maybeCelebrateProgress(beforePct);
      }
      render();
    });
  });

  root.querySelectorAll('.mt-room-item-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const room = cb.getAttribute('data-room');
      const item = cb.getAttribute('data-item');
      if (!state.roomChecklist[room]) state.roomChecklist[room] = {};
      const beforePct = getPctDone();
      const wasPacked = state.rooms[room] === 'Packed';
      state.roomChecklist[room][item] = cb.checked;
      updateRoomStatus(room);
      AppEngine.saveState(state);
      if (!wasPacked && state.rooms[room] === 'Packed') celebrateOnce('room-' + room, false);
      if (cb.checked) maybeCelebrateProgress(beforePct);
      render();
    });
  });

  root.querySelectorAll('[data-util]').forEach(input => {
    const updateUtility = () => {
      const util = input.getAttribute('data-util');
      const field = input.getAttribute('data-util-field');
      if (!state.utilities[util]) state.utilities[util] = { oldCancelDate: '', newStartDate: '', provider: '', account: '', confirmation: '', status: 'not-started', action: 'transfer', phone: '', notes: '' };
      state.utilities[util][field] = input.value;
      AppEngine.saveState(state);
    };
    input.addEventListener('change', () => { updateUtility(); render(); });
    if (input.tagName === 'INPUT' && input.type === 'text') input.addEventListener('blur', updateUtility);
  });

  root.querySelectorAll('[data-contact]').forEach(input => {
    input.addEventListener('blur', () => {
      const field = input.getAttribute('data-contact');
      if (!state.contacts) state.contacts = {};
      state.contacts[field] = input.value;
      AppEngine.saveState(state);
    });
  });

  const notesEl = root.querySelector('#mt-notes');
  if (notesEl) {
    notesEl.addEventListener('input', () => { state.notes = notesEl.value; AppEngine.saveState(state); });
  }

  root.querySelectorAll('[data-tip-field]').forEach(input => {
    input.addEventListener('change', () => {
      if (!state.moverTip) state.moverTip = { crewSize: 3, hours: 4, rate: 8, service: 'good' };
      const field = input.getAttribute('data-tip-field');
      state.moverTip[field] = field === 'service' ? input.value : (parseFloat(input.value) || 0);
      AppEngine.saveState(state);
      render();
    });
  });

  root.querySelectorAll('[data-savings-field]').forEach(input => {
    input.addEventListener('input', () => {
      if (!state.savings) state.savings = { depositAmount: '', moverHourlyRate: '', avoidedMoverHours: '1', reusedBoxes: '', avoidedDuplicateBuys: '' };
      state.savings[input.getAttribute('data-savings-field')] = input.value;
      AppEngine.saveState(state);
    });
    input.addEventListener('blur', () => render());
  });

  const cityInput = root.querySelector('#mt-city-input');
  if (cityInput) {
    cityInput.addEventListener('blur', () => {
      state.city = cityInput.value.trim();
      AppEngine.saveState(state);
    });
  }

  const neighborhoodAdd = root.querySelector('#mt-neighborhood-add');
  if (neighborhoodAdd) {
    neighborhoodAdd.addEventListener('click', () => {
      const input = root.querySelector('#mt-neighborhood-input');
      const val = input ? input.value.trim() : '';
      if (!val) return;
      if (!state.neighborhoods) state.neighborhoods = [];
      if (!state.neighborhoods.some(n => n.toLowerCase() === val.toLowerCase())) state.neighborhoods.push(val);
      AppEngine.saveState(state);
      render();
    });
  }

  root.querySelectorAll('[data-neighborhood-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-neighborhood-remove'), 10);
      state.neighborhoods.splice(idx, 1);
      AppEngine.saveState(state);
      render();
    });
  });

  const aptSubmit = root.querySelector('#mt-apt-submit');
  if (aptSubmit) {
    aptSubmit.addEventListener('click', () => {
      const name = root.querySelector('#mt-apt-name').value.trim();
      const price = root.querySelector('#mt-apt-price').value;
      const url = root.querySelector('#mt-apt-url').value.trim();
      const minRent = root.querySelector('#mt-apt-min-rent').value;
      const maxRent = root.querySelector('#mt-apt-max-rent').value;

      if (!name || !price) return alert('Building Address and Monthly Rent are required.');

      state.apartments.push({
        name, price, minRent, maxRent, status: 'Visited',
        links: url ? [url] : [], favorite: false, image: null, imageStatus: 'none'
      });
      const newIdx = state.apartments.length - 1;
      AppEngine.saveState(state);
      render();

      if (url) {
        fetchListingPreview(url).then(preview => {
          const apt = state.apartments[newIdx];
          if (preview && apt && apt.imageStatus !== 'manual') {
            apt.image = preview.image;
            apt.imageStatus = 'auto';
            AppEngine.saveState(state);
            render();
          }
        });
      }
    });
  }

  root.querySelectorAll('[data-apt-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-apt-status'), 10);
      state.apartments[idx].status = btn.getAttribute('data-status-val');
      AppEngine.saveState(state);
      render();
    });
  });

  root.querySelectorAll('[data-apt-favorite]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-apt-favorite'), 10);
      state.apartments[idx].favorite = !state.apartments[idx].favorite;
      AppEngine.saveState(state);
      render();
    });
  });

  root.querySelectorAll('[data-apt-addlink]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-apt-addlink'), 10);
      const url = prompt('Paste another listing link for this apartment (StreetEasy, Zillow, etc.):');
      if (!url || !url.trim()) return;
      const apt = state.apartments[idx];
      if (!apt.links) apt.links = [];
      apt.links.push(url.trim());
      AppEngine.saveState(state);
      render();

      if (!apt.image) {
        fetchListingPreview(url.trim()).then(preview => {
          if (preview && apt.imageStatus !== 'manual') {
            apt.image = preview.image;
            apt.imageStatus = 'auto';
            AppEngine.saveState(state);
            render();
          }
        });
      }
    });
  });

  root.querySelectorAll('[data-apt-photo]').forEach(input => {
    input.addEventListener('change', async () => {
      const idx = parseInt(input.getAttribute('data-apt-photo'), 10);
      const file = input.files[0];
      if (!file) return;
      try {
        const dataUrl = await compressImageFile(file, 480);
        state.apartments[idx].image = dataUrl;
        state.apartments[idx].imageStatus = 'manual';
        AppEngine.saveState(state);
        render();
      } catch (e) {
        alert('Could not load that photo — try a different file.');
      }
    });
  });

  root.querySelectorAll('[data-apt-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.aptFilter = btn.getAttribute('data-apt-filter');
      AppEngine.saveState(state);
      render();
    });
  });

  root.querySelectorAll('[data-apt-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-apt-remove'), 10);
      state.apartments.splice(idx, 1);
      AppEngine.saveState(state);
      render();
    });
  });

  const boxSearch = root.querySelector('#mt-box-search');
  if (boxSearch) {
    boxSearch.addEventListener('input', () => {
      state.boxSearch = boxSearch.value;
      AppEngine.saveState(state);
    });
    boxSearch.addEventListener('keydown', (e) => { if (e.key === 'Enter') render(); });
    boxSearch.addEventListener('blur', () => render());
  }

  root.querySelectorAll('[data-box-use-suggestion]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-box-use-suggestion'), 10);
      const suggestion = (AppEngine.DEFAULT_BOX_PLAN || [])[idx];
      if (!suggestion) return;
      if (!state.boxes) state.boxes = [];
      state.boxes.push(suggestedBoxToBox(suggestion));
      AppEngine.saveState(state);
      render();
    });
  });

  const addPlanBtn = root.querySelector('#mt-box-add-plan');
  if (addPlanBtn) {
    addPlanBtn.addEventListener('click', () => {
      if (!state.boxes) state.boxes = [];
      const used = new Set(state.boxes.map(getSuggestedBoxKey));
      (AppEngine.DEFAULT_BOX_PLAN || []).forEach((suggestion, idx) => {
        if (!used.has(getSuggestedBoxKey(suggestion))) {
          state.boxes.push(suggestedBoxToBox(suggestion, idx + 1));
          used.add(getSuggestedBoxKey(suggestion));
        }
      });
      AppEngine.saveState(state);
      render();
    });
  }

  const boxAddBtn = root.querySelector('#mt-box-add');
  if (boxAddBtn) {
    boxAddBtn.addEventListener('click', () => {
      const labelEl = root.querySelector('#mt-box-label');
      const roomEl = root.querySelector('#mt-box-room');
      const contentsEl = root.querySelector('#mt-box-contents');
      const fragileEl = root.querySelector('#mt-box-fragile');
      const openFirstEl = root.querySelector('#mt-box-open-first');
      const contents = (contentsEl.value || '').split(',').map(x => x.trim()).filter(Boolean);
      const label = labelEl.value.trim() || `Box ${(state.boxes || []).length + 1}`;
      if (!state.boxes) state.boxes = [];
      const duplicate = state.boxes.find(b => b.label.toLowerCase() === label.toLowerCase() && b.id !== state.editingBoxId);
      if (duplicate && !confirm(`${label} already exists. Add/update anyway?`)) return;
      const existing = state.boxes.find(b => b.id === state.editingBoxId);
      if (existing) {
        existing.label = label;
        existing.room = roomEl.value || 'Unassigned';
        existing.contents = contents;
        existing.fragile = !!fragileEl.checked;
        existing.openFirst = !!openFirstEl.checked;
        state.editingBoxId = '';
      } else {
        const beforePct = getPctDone();
        state.boxes.push({
          id: (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : 'box-' + Date.now(),
          label,
          room: roomEl.value || 'Unassigned',
          contents,
          fragile: !!fragileEl.checked,
          openFirst: !!openFirstEl.checked,
          status: 'packed'
        });
        if (state.boxes.length === 1) celebrateOnce('first-box', false);
        maybeCelebrateProgress(beforePct);
      }
      AppEngine.saveState(state);
      render();
    });
  }

  const boxCancelEdit = root.querySelector('#mt-box-cancel-edit');
  if (boxCancelEdit) {
    boxCancelEdit.addEventListener('click', () => {
      state.editingBoxId = '';
      AppEngine.saveState(state);
      render();
    });
  }

  root.querySelectorAll('[data-box-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.boxStatusFilter = btn.getAttribute('data-box-filter') || 'all';
      AppEngine.saveState(state);
      render();
    });
  });

  root.querySelectorAll('[data-box-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.editingBoxId = btn.getAttribute('data-box-edit');
      AppEngine.saveState(state);
      render();
    });
  });

  root.querySelectorAll('[data-box-status]').forEach(sel => {
    sel.addEventListener('change', () => {
      const id = sel.getAttribute('data-box-status');
      const box = (state.boxes || []).find(b => b.id === id);
      if (!box) return;
      box.status = sel.value;
      AppEngine.saveState(state);
      render();
    });
  });

  root.querySelectorAll('[data-box-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-box-remove');
      if (!confirm('Remove this box from the inventory?')) return;
      state.boxes = (state.boxes || []).filter(b => b.id !== id);
      AppEngine.saveState(state);
      render();
    });
  });

  root.querySelectorAll('[data-box-drag-id]').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.getAttribute('data-box-drag-id'));
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      card.classList.add('drag-over');
    });
    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('drag-over');
      const dragId = e.dataTransfer.getData('text/plain');
      const dropId = card.getAttribute('data-box-drag-id');
      if (moveBoxBefore(dragId, dropId)) {
        AppEngine.saveState(state);
        render();
      }
    });
  });

  const moverAddBtn = root.querySelector('#mover-add-btn');
  if (moverAddBtn) {
    moverAddBtn.addEventListener('click', () => {
      const name = root.querySelector('#mover-name').value.trim();
      const phone = root.querySelector('#mover-phone').value.trim();
      const notes = root.querySelector('#mover-notes').value.trim();
      if (!name) return alert('Company name is required.');
      state.customMovers.push({ name, phone, notes });
      AppEngine.saveState(state);
      render();
    });
  }

  root.querySelectorAll('[data-remove-mover]').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-remove-mover'), 10);
      if (!confirm('Remove this custom mover from your comparison grid?')) return;
      state.customMovers.splice(idx, 1);
      AppEngine.saveState(state);
      render();
    });
  });

}

// --- STARTUP ---
const loadingIndicator = document.getElementById('mt-loading');
if (loadingIndicator) loadingIndicator.style.display = 'none';

playWelcomeAnimation();
render();
