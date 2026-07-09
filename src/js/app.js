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

function getMoveProfile() {
  return state.moveProfile || {};
}

function needsApartmentHunt() {
  return getMoveProfile().apartmentHunt !== false;
}

function usesProfessionalMovers() {
  return getMoveProfile().moveStyle !== 'diy';
}

function getVisibleAppSections() {
  return appSections.filter(sec => {
    if (sec.category === 'apartment' && !needsApartmentHunt()) return false;
    if (sec.id === 'movers' && !usesProfessionalMovers()) return false;
    return true;
  });
}

function ensureVisibleActiveTab() {
  if (getVisibleAppSections().some(sec => sec.id === state.activeTab)) return;
  state.activeTab = 'dashboard';
  AppEngine.saveState(state);
}

// --- CORE ANIMATION / WELCOME ---
function renderWelcomeSceneHtml(contentHtml) {
  return `
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
      ${contentHtml}
    </div>
  `;
}

function getSetupFormHtml() {
  const profile = getMoveProfile();
  return `
    <h1>Moving Assistant</h1>
    <p class="mt-welcome-subcopy">Tell me the basics and I’ll build the move plan around them.</p>
    <div class="mt-wizard-card mt-welcome-form">
      <div class="mt-wizard-field"><label>What should we call you?</label><input type="text" id="wiz-name" placeholder="e.g. Andy" value="${esc(state.userName || '')}" /></div>
      <div class="mt-wizard-field"><label>When's moving day?</label><input type="date" id="wiz-date" value="${state.targetMoveDate || ''}" /></div>
      <div class="mt-wizard-field">
        <label>How big's the place?</label>
        <select id="wiz-size">
          <option value="studio" ${state.aptSize === 'studio' ? 'selected' : ''}>Studio Layout</option>
          <option value="1br" ${state.aptSize === '1br' ? 'selected' : ''}>1-Bedroom Apartment</option>
          <option value="2br" ${state.aptSize === '2br' ? 'selected' : ''}>2-Bedroom Apartment</option>
          <option value="3br" ${state.aptSize === '3br' ? 'selected' : ''}>3-Bedroom Apartment</option>
        </select>
      </div>
      <div class="mt-wizard-field"><label>City / market</label><input type="text" id="wiz-city" placeholder="e.g. New York, Chicago, Austin" value="${esc(state.city || '')}" /></div>
      <div class="mt-wizard-field">
        <label>Do you still need to find a place?</label>
        <select id="wiz-apartment-hunt">
          <option value="yes" ${profile.apartmentHunt !== false ? 'selected' : ''}>Yes, include apartment hunt tools</option>
          <option value="no" ${profile.apartmentHunt === false ? 'selected' : ''}>No, I already have the place</option>
        </select>
      </div>
      <div class="mt-wizard-field">
        <label>Move help</label>
        <select id="wiz-move-style">
          <option value="movers" ${profile.moveStyle !== 'diy' ? 'selected' : ''}>Hiring movers / comparing quotes</option>
          <option value="diy" ${profile.moveStyle === 'diy' ? 'selected' : ''}>DIY / friends / rental vehicle</option>
        </select>
      </div>
      <div class="mt-two-col-form mt-profile-grid">
        <label>Move distance<select id="wiz-distance">
          <option value="local" ${profile.distance !== 'long-distance' ? 'selected' : ''}>Local</option>
          <option value="long-distance" ${profile.distance === 'long-distance' ? 'selected' : ''}>Long-distance</option>
        </select></label>
        <label>Home type<select id="wiz-building-type">
          <option value="apartment" ${profile.buildingType !== 'house' ? 'selected' : ''}>Apartment / building</option>
          <option value="house" ${profile.buildingType === 'house' ? 'selected' : ''}>House / standalone</option>
        </select></label>
      </div>
      <button class="mt-wizard-btn" id="wiz-submit">Build My Move Plan</button>
    </div>
  `;
}

function bindSetupForm(root) {
  const submit = root.querySelector('#wiz-submit');
  if (!submit) return;
  submit.addEventListener('click', () => {
    const name = root.querySelector('#wiz-name').value.trim();
    const date = root.querySelector('#wiz-date').value;
    const size = root.querySelector('#wiz-size').value;
    const city = root.querySelector('#wiz-city').value.trim();
    const apartmentHunt = root.querySelector('#wiz-apartment-hunt').value === 'yes';
    const moveStyle = root.querySelector('#wiz-move-style').value;
    const distance = root.querySelector('#wiz-distance').value;
    const buildingType = root.querySelector('#wiz-building-type').value;
    if (!name || !date) return alert('Just need your name and move date to get started!');
    state.userName = name;
    state.targetMoveDate = date;
    state.aptSize = size;
    state.city = city;
    state.moveProfile = {
      ...(state.moveProfile || {}),
      market: city && !/new york|nyc/i.test(city) ? 'other' : 'nyc',
      distance,
      housing: 'renter',
      apartmentHunt,
      moveStyle,
      buildingType
    };
    state.showWizardOverride = false;
    ensureVisibleActiveTab();
    AppEngine.saveState(state);
    sessionStorage.removeItem('hasAnimated');
    render();
  });
}

function playWelcomeAnimation() {
  if (!state.userName || !state.targetMoveDate || sessionStorage.getItem('hasAnimated')) return;

  const overlay = document.createElement('div');
  overlay.id = 'mt-welcome-overlay';
  
  overlay.innerHTML = renderWelcomeSceneHtml(`
      <h1 style="font-size: 48px; font-weight: 800; margin-bottom: 10px;">Moving Assistant</h1>
      <p style="color: var(--text-muted); font-size: 20px;">Welcome back, ${esc(state.userName || 'friend')}.</p>
      <button id="mt-enter-app" class="mt-wizard-btn" style="margin-top: 20px; width: auto; padding: 15px 40px; font-size: 18px;">Resume Move</button>
      <button id="mt-start-new" style="display:block; margin: 15px auto; background:none; border:none; color:var(--text-muted); cursor:pointer;">Start New Move</button>
  `);
  
  overlay.querySelector('#mt-enter-app').addEventListener('click', () => {
    overlay.style.transition = 'opacity 0.5s';
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 500);
  });

  overlay.querySelector('#mt-start-new').addEventListener('click', () => {
    if (confirm('Are you sure you want to completely clear your move data? This cannot be undone.')) {
      AppEngine.clearStoredState();
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
  const visibleSections = getVisibleAppSections();
  const generalSecs = visibleSections.filter(s => s.category === 'general');
  const aptSecs = visibleSections.filter(s => s.category === 'apartment');
  const moveoutSecs = visibleSections.filter(s => s.category === 'moveout');

  overlay.innerHTML = `
    <div class="mt-mobile-menu-header">
      <h2>Move Map</h2>
      <button class="mt-mobile-menu-close" id="mt-mobile-menu-close">×</button>
    </div>
    <div class="mt-mobile-grid-bubbles mt-general-row">
      ${generalSecs.map(bubble).join('')}
    </div>
    <div class="mt-mobile-groups">
      ${aptSecs.length ? `
        <div class="mt-mobile-column">
          <div class="mt-mobile-column-title">🔑 Finding an Apartment</div>
          <div class="mt-mobile-grid-bubbles">${aptSecs.map(bubble).join('')}</div>
        </div>
      ` : ''}
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
  Object.entries(AppEngine.DONATION_GUIDE || {}).forEach(([room, items]) => {
    if (Array.isArray(items)) items.forEach((_, i) => keys.push(`donation-${room}-${i}`));
  });
  (AppEngine.INSTALLED_ITEM_REMINDERS || []).forEach((_, i) => keys.push(`installed-${i}`));
  (AppEngine.BULKY_DONATION_RULES || []).forEach((_, i) => keys.push(`bulky-donation-${i}`));
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
  return daysUntilDate(state.targetMoveDate);
}

function daysUntilDate(dateStr) {
  if (!dateStr) return 0;
  const now = new Date();
  const parts = dateStr.split('-');
  const target = new Date(parts[0], parts[1] - 1, parts[2]);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
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

function apartmentCtx(root) {
  return {
    AppEngine,
    state,
    esc,
    renderPhaseList,
    renderRentDropdownHtml,
    daysUntilDate,
    root,
    render
  };
}

function boxesCtx(root) {
  return {
    AppEngine,
    state,
    esc,
    getPctDone,
    celebrateOnce,
    maybeCelebrateProgress,
    root,
    render
  };
}

function moversCtx(root) {
  return {
    AppEngine,
    state,
    esc,
    root,
    render
  };
}

function getApartmentGuideFocusItem() {
  return window.MovingApartments.guideFocusItem(apartmentCtx());
}

function getApartmentTrackerFocusItem() {
  return window.MovingApartments.trackerFocusItem(apartmentCtx());
}

function getApartmentActionItems() {
  return window.MovingApartments.actionItems(apartmentCtx());
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

  if (needsApartmentHunt()) {
    const apt = getPhaseFocusItem(AppEngine.APT_PHASES, { timingAware: true }) || getApartmentGuideFocusItem();
    if (apt) items.push(apt);

    const aptTracker = getApartmentTrackerFocusItem();
    if (aptTracker) items.push(aptTracker);
  }

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
  const visibleSections = getVisibleAppSections();
  const groupedSections = [
    { title: 'Home', sections: visibleSections.filter(s => s.category === 'general') },
    { title: 'Finding an Apartment', sections: visibleSections.filter(s => s.category === 'apartment') },
    { title: 'Moving Out', sections: visibleSections.filter(s => s.category === 'moveout') }
  ].filter(group => group.sections.length);
  const profile = getMoveProfile();
  const profileLabel = [
    profile.distance === 'long-distance' ? 'Long-distance' : 'Local',
    profile.moveStyle === 'diy' ? 'DIY move' : 'mover-assisted',
    state.aptSize.toUpperCase()
  ].join(' · ');

  return `
    <div class="mt-sidebar">
      <div class="mt-sidebar-top">
        <div class="mt-user-badge">
          <div class="welcome">${esc(profileLabel)}</div>
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
  const apartmentActions = needsApartmentHunt() ? getApartmentActionItems() : [];
  const packedRooms = AppEngine.ROOMS.filter(r => state.rooms[r] === 'Packed').length;
  const boxCount = (state.boxes || []).length;
  const openFirstCount = (state.boxes || []).filter(b => b.openFirst && b.status !== 'unpacked').length;
  const utilitiesDone = AppEngine.UTILITIES.filter(u => (state.utilities[u] || {}).status === 'done').length;
  const backupText = state.backupExportedAt ? `Last backup: ${new Date(state.backupExportedAt).toLocaleDateString()}` : 'No backup yet';
  const savings = estimateSavings();
  const primaryFocus = focusItems[0];
  const secondaryFocus = focusItems.slice(1);
  const signalCards = [
    { label: 'Rooms packed', value: `${packedRooms}/${AppEngine.ROOMS.length}`, tab: 'rooms' },
    { label: 'Boxes logged', value: boxCount, tab: 'boxes' },
    { label: 'Open first', value: openFirstCount, tab: 'boxes' },
    { label: 'Utilities done', value: `${utilitiesDone}/${AppEngine.UTILITIES.length}`, tab: 'addressutil' },
    { label: 'Backup', value: state.backupExportedAt ? 'Saved' : 'Needed', tab: 'dashboard' }
  ];

  return `
    <div class="mt-dashboard-shell">
      <div class="mt-hero-card">
        <div class="mt-dashboard-kicker">${days <= 7 ? 'Move week command center' : 'Move command center'}</div>
        <h1>${getGreeting()}, ${esc(state.userName || 'friend')} 👋</h1>
        <p>${days <= 7 ? 'Home stretch. We are making this annoyingly manageable.' : 'One small win at a time. Cardboard fears you.'}</p>

        <div class="mt-command-grid">
          <section class="mt-primary-action">
            <div class="mt-command-label">Do next</div>
            <button class="mt-primary-action-main" data-focus-open="${esc(primaryFocus.tab)}">
              <span>${esc(primaryFocus.text)}</span>
              <small>${esc(primaryFocus.phase)}</small>
            </button>
            ${renderFocusDoneButton(primaryFocus)}
          </section>

          <section class="mt-up-next-panel">
            <div class="mt-command-label">Up next</div>
            <div class="mt-focus-list">
              ${secondaryFocus.length ? secondaryFocus.map(item => `
                <div class="mt-focus-row">
                  <button class="mt-focus-main" data-focus-open="${esc(item.tab)}">
                    <span class="mt-focus-text">${esc(item.text)}</span>
                    <small>${esc(item.phase)}</small>
                  </button>
                  ${renderFocusDoneButton(item)}
                </div>
              `).join('') : `
                <div class="mt-empty mt-dashboard-empty">No other urgent items right now.</div>
              `}
            </div>
          </section>
        </div>

        <div class="mt-progress-container">
          <div class="mt-progress-track">
            <div class="mt-progress-fill" style="width:${pct}%"></div>
          </div>
          <p>${pct}% done · ${done}/${total} tiny wins · ${esc(backupText)}</p>
        </div>
      </div>

      <div class="mt-dashboard-signals">
        ${signalCards.map(card => `
          <button class="mt-signal-card" data-focus-open="${esc(card.tab)}">
            <span>${esc(card.label)}</span>
            <strong>${esc(card.value)}</strong>
          </button>
        `).join('')}
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

      ${needsApartmentHunt() ? `<div class="mt-card mt-apartment-actions">
        <div class="mt-card-header">
          <h3>Apartment actions</h3>
          <button class="mt-mini-action" data-focus-open="apartments">Open tracker</button>
        </div>
        <div class="mt-card-body">
          ${apartmentActions.length ? apartmentActions.map(action => `
            <div class="mt-focus-row">
              <button class="mt-focus-main" data-focus-open="${esc(action.tab)}">
                <span class="mt-focus-text">${esc(action.text)}</span>
                <small>${esc(action.phase)}</small>
              </button>
            </div>
          `).join('') : `
            <div class="mt-empty">No apartment deadlines yet. Add follow-up dates, apply-by dates, or cashier-check dates as listings get serious.</div>
          `}
        </div>
      </div>` : ''}
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
  return window.MovingApartments.renderAptSearch(apartmentCtx());
}

function renderApartments() {
  return window.MovingApartments.renderApartments(apartmentCtx());
}

function getMoverTipSummary() {
  return window.MovingMovers.getMoverTipSummary(moversCtx());
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
  return window.MovingMovers.renderMovers(moversCtx());
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
            <div class="mt-donation-checklist">
              ${suggestions[room].map((item, i) => {
                const key = `donation-${room}-${i}`;
                const isDone = !!state.checked[key];
                return `
                  <div class="mt-item ${isDone ? 'done' : ''}">
                    <input type="checkbox" class="mt-check" data-check="${esc(key)}" ${isDone ? 'checked' : ''} aria-label="${esc(item)}" />
                    <div class="mt-item-text" data-check="${esc(key)}">${esc(item)}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderInstalledItemReminders() {
  const reminders = AppEngine.INSTALLED_ITEM_REMINDERS || [];
  if (!reminders.length) return '';
  return `
    <div class="mt-card mt-installed-card">
      <div class="mt-card-header">
        <div>
          <h3>Installed things to take back</h3>
          <p class="mt-muted-copy" style="margin:4px 0 0;">Upgrades you bought can be easy to forget because they feel like part of the apartment.</p>
        </div>
      </div>
      <div class="mt-installed-grid">
        ${reminders.map((item, i) => {
          const key = `installed-${i}`;
          const isDone = !!state.checked[key];
          return `
            <label class="mt-installed-item ${isDone ? 'done' : ''}">
              <input type="checkbox" class="mt-check" data-check="${key}" ${isDone ? 'checked' : ''} aria-label="${esc(item.title)}" />
              <div>
                <div class="mt-installed-title">${esc(item.title)} <span>${esc(item.timing)}</span></div>
                <p>${esc(item.action)}</p>
                <small>${esc(item.why)} ${item.room ? `Area: ${esc(item.room)}.` : ''}</small>
              </div>
            </label>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderBulkyDonationRules() {
  const rules = AppEngine.BULKY_DONATION_RULES || [];
  if (!rules.length) return '';
  return `
    <div class="mt-card mt-bulky-card">
      <div class="mt-card-header">
        <div>
          <h3>Bulky item reality check</h3>
          <p class="mt-muted-copy" style="margin:4px 0 0;">Bigger donations need a decision earlier because pickup windows and elevator logistics get annoying fast.</p>
        </div>
      </div>
      <div class="mt-card-body">
        ${rules.map((rule, i) => {
          const key = `bulky-donation-${i}`;
          const isDone = !!state.checked[key];
          return `
            <div class="mt-item ${isDone ? 'done' : ''}">
              <input type="checkbox" class="mt-check" data-check="${key}" ${isDone ? 'checked' : ''} aria-label="${esc(rule)}" />
              <div class="mt-item-text" data-check="${key}">${esc(rule)}</div>
            </div>
          `;
        }).join('')}
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
    ${renderInstalledItemReminders()}
    ${renderBulkyDonationRules()}
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

function renderBoxes() {
  return window.MovingBoxes.renderBoxes(boxesCtx());
}

function renderDayOf() {
  const { tip, perMover, totalTip } = getMoverTipSummary();
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
      <div id="mt-welcome-overlay" class="mt-onboarding-welcome">
        ${renderWelcomeSceneHtml(getSetupFormHtml())}
      </div>
    `;
    bindSetupForm(root);
    return;
  }
  ensureVisibleActiveTab();

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
          const summary = AppEngine.getBackupSummary(parsed);
          if (!summary) {
            alert('That JSON file does not look like a Moving Assistant backup.');
            return;
          }
          const message = [
            `Import backup for ${summary.userName}?`,
            `Move date: ${summary.targetMoveDate}`,
            `Apartments: ${summary.apartments} · Boxes: ${summary.boxes} · Checked items: ${summary.checkedItems}`,
            '',
            'This will replace your current data. Continue?'
          ].join('\n');
          if (!confirm(message)) return;
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

  root.querySelectorAll('[data-savings-field]').forEach(input => {
    input.addEventListener('input', () => {
      if (!state.savings) state.savings = { depositAmount: '', moverHourlyRate: '', avoidedMoverHours: '1', reusedBoxes: '', avoidedDuplicateBuys: '' };
      state.savings[input.getAttribute('data-savings-field')] = input.value;
      AppEngine.saveState(state);
    });
    input.addEventListener('blur', () => render());
  });

  window.MovingApartments.attachHandlers(apartmentCtx(root));
  window.MovingBoxes.attachHandlers(boxesCtx(root));
  window.MovingMovers.attachHandlers(moversCtx(root));

}

// --- STARTUP ---
const loadingIndicator = document.getElementById('mt-loading');
if (loadingIndicator) loadingIndicator.style.display = 'none';

playWelcomeAnimation();
render();
