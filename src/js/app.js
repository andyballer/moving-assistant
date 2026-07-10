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

function isDiyMove() {
  return !usesProfessionalMovers();
}

function isHouseMove() {
  return getMoveProfile().buildingType === 'house';
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
  const showHuntFields = profile.apartmentHunt !== false;
  return `
    <h1>Moving Assistant</h1>
    <p class="mt-welcome-subcopy">Answer only what changes your plan. I’ll use it right away.</p>
    <div class="mt-wizard-card mt-welcome-form">
      <div class="mt-wizard-field"><label>What should we call you?</label><input type="text" id="wiz-name" placeholder="e.g. Andy" value="${esc(state.userName || '')}" /></div>
      <div class="mt-wizard-field"><label>When's moving day?</label><input type="date" id="wiz-date" value="${state.targetMoveDate || ''}" /></div>
      <div class="mt-wizard-field">
        <label>How big's the place?</label>
        <select id="wiz-size">
          <option value="studio" ${state.aptSize === 'studio' ? 'selected' : ''}>Studio</option>
          <option value="1br" ${state.aptSize === '1br' ? 'selected' : ''}>1 bedroom</option>
          <option value="2br" ${state.aptSize === '2br' ? 'selected' : ''}>2 bedrooms</option>
          <option value="3br" ${state.aptSize === '3br' ? 'selected' : ''}>3 bedrooms</option>
        </select>
      </div>
      <div class="mt-wizard-field">
        <label>Do you still need to find a place?</label>
        <select id="wiz-apartment-hunt">
          <option value="yes" ${profile.apartmentHunt !== false ? 'selected' : ''}>Yes, include apartment hunt tools</option>
          <option value="no" ${profile.apartmentHunt === false ? 'selected' : ''}>No, I already have the place</option>
        </select>
      </div>
      <div class="mt-setup-hunt-fields" ${showHuntFields ? '' : 'hidden'}>
        <div class="mt-wizard-field">
          <label>Target rent range</label>
          <div class="mt-wizard-inline">
            ${renderRentDropdownHtml('wiz-target-min-rent', 'Min rent', state.targetBudgetMin || '')}
            <span>to</span>
            ${renderRentDropdownHtml('wiz-target-max-rent', 'Max rent', state.targetBudgetMax || '')}
          </div>
        </div>
      </div>
      <div class="mt-wizard-field">
        <label>Move help</label>
        <select id="wiz-move-style">
          <option value="movers" ${profile.moveStyle !== 'diy' ? 'selected' : ''}>Hiring movers / comparing quotes</option>
          <option value="diy" ${profile.moveStyle === 'diy' ? 'selected' : ''}>DIY / friends / rental vehicle</option>
        </select>
      </div>
      <div class="mt-wizard-field">
        <label>Home type</label>
        <select id="wiz-building-type">
          <option value="apartment" ${profile.buildingType !== 'house' ? 'selected' : ''}>Apartment / building</option>
          <option value="house" ${profile.buildingType === 'house' ? 'selected' : ''}>House / standalone</option>
        </select>
      </div>
      <button class="mt-wizard-btn" id="wiz-submit">Build My Move Plan</button>
    </div>
  `;
}

function bindSetupForm(root) {
  const huntSelect = root.querySelector('#wiz-apartment-hunt');
  const huntFields = root.querySelector('.mt-setup-hunt-fields');
  if (huntSelect && huntFields) {
    huntSelect.addEventListener('change', () => {
      huntFields.hidden = huntSelect.value !== 'yes';
    });
  }

  const submit = root.querySelector('#wiz-submit');
  if (!submit) return;
  submit.addEventListener('click', () => {
    const name = root.querySelector('#wiz-name').value.trim();
    const date = root.querySelector('#wiz-date').value;
    const size = root.querySelector('#wiz-size').value;
    const apartmentHunt = root.querySelector('#wiz-apartment-hunt').value === 'yes';
    const moveStyle = root.querySelector('#wiz-move-style').value;
    const buildingType = root.querySelector('#wiz-building-type').value;
    if (!name || !date) return alert('Just need your name and move date to get started!');
    state.userName = name;
    state.targetMoveDate = date;
    state.aptSize = size;
    state.targetBudgetMin = apartmentHunt ? root.querySelector('#wiz-target-min-rent').value : state.targetBudgetMin;
    state.targetBudgetMax = apartmentHunt ? root.querySelector('#wiz-target-max-rent').value : state.targetBudgetMax;
    state.moveProfile = {
      ...(state.moveProfile || {}),
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
      <div class="mt-progress-track mt-mobile-progress-track"><div class="mt-progress-fill" style="width:${pct}%"></div></div>
      <button class="mt-wizard-btn mt-mobile-menu-wide-btn" id="mobile-gear-trigger">⚙️ Edit Move Details</button>
      <div class="mt-mobile-menu-actions">
         <button class="mt-wizard-btn mt-mobile-menu-secondary-btn" id="mobile-export-trigger">Export JSON</button>
         <button class="mt-wizard-btn mt-mobile-menu-secondary-btn" id="mobile-import-trigger">Import JSON</button>
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
  let html = `<select id="${elementId}" class="mt-rent-select">`;
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
  (AppEngine.FIRST_WEEK_STAGES || []).forEach(stage => {
    stage.items.forEach((_, i) => keys.push('firstweek-' + stage.title.replace(/\W+/g, '-').toLowerCase() + '-' + i));
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
  const internet = state.utilities['Internet/Cable'] || {};
  if ((daysUntilMove() <= 21 || internet.provider) && internet.status !== 'done') {
    if (!internet.oldCancelDate) {
      return { text: 'Internet/Cable: schedule cancellation or transfer', phase: 'Best timing: 2-3 weeks ahead', tab: 'addressutil', type: 'utility' };
    }
    if (!internet.confirmation || !internet.notes) {
      return { text: 'Internet/Cable: note confirmation and equipment return plan', phase: 'Avoid surprise equipment fees', tab: 'addressutil', type: 'utility' };
    }
  }

  const missing = AppEngine.UTILITIES.find(u => {
    const rec = state.utilities[u] || {};
    return !rec.oldCancelDate || !rec.newStartDate;
  });
  if (!missing) return null;
  const guide = AppEngine.UTILITY_GUIDE[missing];
  return { text: `${missing}: add provider/date details`, phase: guide ? `Best timing: ${guide.lead}` : 'Utility timing', tab: 'addressutil', type: 'utility' };
}

function deadlineCtx() {
  return {
    state,
    AppEngine,
    daysUntilDate,
    getMoveDayOfWeek,
    needsApartmentHunt,
    isDiyMove
  };
}

function getUpcomingDeadlines() {
  return window.MovingDeadlines.getUpcomingDeadlines(deadlineCtx());
}

function downloadTextFile(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
          <p>Target Date: <span class="mt-target-date">${formattedMoveDate} (${weekday})</span></p>
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
        <input type="file" id="mt-import-file" accept="application/json" class="mt-hidden-file-input" />
        <div class="mt-sidebar-progress">
          <div class="mt-progress-meta"><span>PROGRESS</span><span>${pct}% Done</span></div>
          <div class="mt-progress-track"><div class="mt-progress-fill" style="width:${pct}%"></div></div>
        </div>
      </div>
    </div>
  `;
}

function dashboardCtx() {
  return {
    AppEngine,
    state,
    esc,
    daysUntilMove,
    totalTaskCount,
    doneTaskCount,
    getTodaysFocusItems,
    needsApartmentHunt,
    getApartmentActionItems,
    estimateSavings,
    getUpcomingDeadlines,
    getGreeting,
    renderFocusDoneButton,
    getFunStat
  };
}

function renderDashboard() {
  return window.MovingDashboard.renderDashboard(dashboardCtx());
}

function estimateSavings() {
  return window.MovingSavings.estimateSavings(state);
}

function savingsCtx() {
  return { AppEngine, state, esc };
}

function renderSavings() {
  return window.MovingSavings.renderSavings(savingsCtx());
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getMoveTimelinePhases() {
  let phases = AppEngine.TIMELINE_DATA_MATRIX;
  if (isHouseMove()) {
    const houseReplacements = {
      '8wk': {
        3: 'Ask both homes about truck parking, driveway/street access, stairs, large-item paths, and trash pickup rules [20m]'
      },
      '6wk': {
        1: 'Send movers or helpers the driveway/street access, stairs, door measurements, and large-item path notes [15m]',
        3: 'Choose the loading/staging area: driveway, garage, basement, porch, or safest curb spot [20m]',
        4: 'Ask what repairs, paint touch-ups, yard cleanup, or trash rules apply before handoff [10m]'
      },
      '4wk': {
        0: 'Confirm truck parking, driveway clearance, garage/basement staging, and the large-item path at both homes [15m]',
        5: 'Confirm movers or helpers have the access notes, stairs, heavy-item list, and parking plan [10m]'
      },
      '2wk': {
        0: 'Confirm helpers, movers, or rental-truck plans around driveway access, stairs, weather cover, and heavy-item risk [20m]',
        3: 'Patch small holes and touch-ups only if your lease/sale agreement allows it [45m]'
      },
      'movingwk': {
        0: 'Call movers or helpers to confirm arrival window, truck access, stairs, heavy items, and loading order [15m]',
        3: 'Touch up allowed wall repairs after spackle dries; skip repainting whole walls unless required [45m]'
      },
      'moveday': {
        1: 'Take empty-home photos/video: walls, floors, appliances, basement/garage, closets, windows, and repaired spots [20m]',
        2: 'Hand off keys, garage openers, mailbox keys, and access codes; get written confirmation if possible [10m]',
        4: 'Walk the driveway, garage, basement, stairs, and doorways before loading starts [10m]'
      }
    };

    phases = phases.map(phase => ({
      ...phase,
      items: phase.items.map((item, index) => houseReplacements[phase.id]?.[index] || item)
    }));
  }

  if (isDiyMove()) {
    const diyReplacements = {
      '8wk': {
        2: 'Choose your DIY plan: rental vehicle, borrowed car, helper list, dollies, and heavy-item risks [45m]'
      },
      '6wk': {
        0: 'Reserve the rental vehicle or lock helper availability once your date/window is realistic [30m]',
        1: 'Send helpers the access notes, stairs/elevator details, heavy-item list, and expected time window [15m]'
      },
      '4wk': {
        5: 'Confirm rental pickup/return, parking/loading plan, dollies, blankets, straps, and helper arrival times [10m]'
      },
      'movingwk': {
        0: 'Confirm helpers, vehicle pickup, loading order, parking plan, weather backup, and food/water [15m]'
      }
    };

    phases = phases.map(phase => ({
      ...phase,
      items: phase.items.map((item, index) => diyReplacements[phase.id]?.[index] || item)
    }));
  }

  return phases;
}

function tasksCtx() {
  return {
    state,
    esc,
    getDynamicCalendarRange,
    getMoveTimelinePhases,
    isDiyMove,
    isHouseMove
  };
}

function renderPhaseList(phases) {
  return window.MovingTasks.renderPhaseList(tasksCtx(), phases);
}

function renderMoveStyleGuidanceCard() {
  return window.MovingTasks.renderMoveStyleGuidanceCard(tasksCtx());
}

function renderBuildingGuidanceCard() {
  return window.MovingTasks.renderBuildingGuidanceCard(tasksCtx());
}

function renderTasks() {
  return window.MovingTasks.renderTasks(tasksCtx());
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

function suppliesCtx() {
  return { AppEngine, state, esc };
}

function renderSupplies() {
  return window.MovingSupplies.renderSupplies(suppliesCtx());
}

function renderMovers() {
  return window.MovingMovers.renderMovers(moversCtx());
}

function roomsCtx() {
  return {
    AppEngine,
    state,
    esc
  };
}

function renderRooms() {
  return window.MovingRooms.renderRooms(roomsCtx());
}


function utilitiesCtx() {
  return {
    AppEngine,
    state,
    esc
  };
}

function renderAddressUtil() {
  return window.MovingUtilities.renderAddressUtil(utilitiesCtx());
}

function renderBoxes() {
  return window.MovingBoxes.renderBoxes(boxesCtx());
}

function dayOfCtx() {
  return {
    AppEngine,
    state,
    esc,
    renderMoveStyleGuidanceCard,
    renderBuildingGuidanceCard,
    getMoverTipSummary
  };
}

function renderDayOf() {
  return window.MovingDayOf.renderDayOf(dayOfCtx());
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
      const dateStamp = new Date().toISOString().slice(0, 10);
      downloadTextFile(`moving-assistant-backup-${dateStamp}.json`, JSON.stringify(state, null, 2), 'application/json');
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

  root.querySelectorAll('[data-export-calendar]').forEach(btn => {
    btn.addEventListener('click', () => {
      const dateStamp = new Date().toISOString().slice(0, 10);
      const calendar = window.MovingDeadlines.buildCalendarFile(deadlineCtx());
      downloadTextFile(`moving-assistant-deadlines-${dateStamp}.ics`, calendar, 'text/calendar');
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
