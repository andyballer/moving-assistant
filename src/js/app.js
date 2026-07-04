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
  { id: 'aptsearch', label: 'Apartment Search Timeline', icon: '🔍', category: 'apartment' },
  { id: 'apartments', label: 'Apartment Tracker', icon: '🏢', category: 'apartment' },
  { id: 'tasks', label: 'Move-Out Timeline', icon: '📋', category: 'moveout' },
  { id: 'supplies', label: 'Boxes & Supplies', icon: '📦', category: 'moveout' },
  { id: 'donations', label: 'Donations Manager', icon: '🤝', category: 'moveout' },
  { id: 'movers', label: 'Moving Companies', icon: '🚛', category: 'moveout' },
  { id: 'rooms', label: 'Room Packing Checklist', icon: '🧳', category: 'moveout' },
  { id: 'addressutil', label: 'Address & Utilities', icon: '⚡', category: 'moveout' },
  { id: 'dayof', label: 'Move Day Survival', icon: '🎯', category: 'moveout' }
];

// --- CORE ANIMATION ---
function playWelcomeAnimation() {
  if (sessionStorage.getItem('hasAnimated')) return;

  const overlay = document.createElement('div');
  overlay.id = 'mt-welcome-overlay';
  
  overlay.innerHTML = `
    <div class="truck-wrapper">
      <img src="src/assets/moving truck.webp" class="mt-truck-img" alt="Moving Truck" onerror="console.error('IMAGE FAILED TO LOAD: Check your local folder directory structure')" />
      <div class="mt-box">📦</div>
    </div>
    <div class="mt-road"></div> 
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
      localStorage.clear();
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
  const donationCount = Object.values(state.donations).reduce((sum, arr) => sum + arr.length, 0);
  const packedRooms = AppEngine.ROOMS.filter(r => state.rooms[r] === 'Packed').length;
  const days = daysUntilMove();
  if (packedRooms > 0 && packedRooms < AppEngine.ROOMS.length) {
    return `${packedRooms} of ${AppEngine.ROOMS.length} rooms fully packed. Keep going!`;
  }
  if (packedRooms === AppEngine.ROOMS.length && AppEngine.ROOMS.length > 0) {
    return `Every room packed. You are basically a moving professional now.`;
  }
  if (donationCount > 0) {
    return `You've donated ${donationCount} item${donationCount === 1 ? '' : 's'} so far — future you says thanks.`;
  }
  if (days > 0 && days <= 7) {
    return `${days} day${days === 1 ? '' : 's'} to go. This is the home stretch.`;
  }
  return `Every box you pack now is one less thing to think about on move day.`;
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
    <div class="mt-bubble-item ${state.activeTab === sec.id ? 'active' : ''}" onclick="handleSectionTap('${sec.id}')">
      <span class="mt-bubble-icon">${sec.icon}</span>
      <span>${sec.label}</span>
    </div>
  `;
  const generalSecs = appSections.filter(s => s.category === 'general');
  const aptSecs = appSections.filter(s => s.category === 'apartment');
  const moveoutSecs = appSections.filter(s => s.category === 'moveout');

  overlay.innerHTML = `
    <div class="mt-mobile-menu-header">
      <h2>Navigate Move</h2>
      <button class="mt-mobile-menu-close" onclick="document.getElementById('mt-mobile-nav-overlay').remove()">×</button>
    </div>
    <div class="mt-mobile-grid-bubbles mt-general-row">
      ${generalSecs.map(bubble).join('')}
    </div>
    <div class="mt-mobile-columns">
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
      <div class="mt-progress-meta"><span>COMPLETION METRIC</span><span>${pct}% Done</span></div>
      <div class="mt-progress-track" style="margin-bottom:15px;"><div class="mt-progress-fill" style="width:${pct}%"></div></div>
      <button class="mt-wizard-btn" id="mobile-gear-trigger" style="margin-bottom: 10px; width: 100%;">⚙️ Edit Move Details</button>
      <div style="display:flex; gap:10px;">
         <button class="mt-wizard-btn" id="mobile-export-trigger" style="flex:1; background:#8e8e93;">Export JSON</button>
         <button class="mt-wizard-btn" id="mobile-import-trigger" style="flex:1; background:#8e8e93;">Import JSON</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

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

window.handleSectionTap = function(tabId) {
  state.activeTab = tabId;
  AppEngine.saveState(state);
  const menu = document.getElementById('mt-mobile-nav-overlay');
  if (menu) menu.remove();
  render();
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
function totalTaskCount() {
  let count = AppEngine.TIMELINE_DATA_MATRIX.reduce((sum, p) => sum + p.items.length, 0);
  count += AppEngine.APT_PHASES.reduce((sum, p) => sum + p.items.length, 0);
  count += AppEngine.SUPPLIES.length;
  count += AppEngine.ADDRESS_CHANGES.length;
  count += AppEngine.ROOMS.length; 
  return count;
}

function doneTaskCount() {
  let checkedCount = 0;
  Object.keys(state.checked).forEach(k => { if (state.checked[k]) checkedCount++; });
  AppEngine.ROOMS.forEach(room => { if (state.rooms[room] === 'Packed') checkedCount++; });
  return checkedCount;
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

function getTodaysFocus() {
  const allTasks = [...AppEngine.TIMELINE_DATA_MATRIX, ...AppEngine.APT_PHASES];
  for (const phase of allTasks) {
    for (let i = 0; i < phase.items.length; i++) {
      const key = phase.id + '-' + i;
      if (!state.checked[key]) return { text: phase.items[i], phase: phase.label };
    }
  }
  return { text: "No pending tasks—you're ready to go!", phase: "All clear" };
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

  return `
    <div class="mt-sidebar">
      <div class="mt-sidebar-top">
        <div class="mt-user-badge">
          <div class="welcome">Packing for a ${state.aptSize.toUpperCase()}</div>
          <div class="username">${esc(state.userName || 'Friend')}</div>
        </div>
        <div class="mt-nav">
          ${appSections.map(sec => `<button data-tab="${sec.id}" class="${state.activeTab === sec.id ? 'active' : ''}">${sec.icon} ${sec.label}</button>`).join('')}
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
  const days = daysUntilMove();
  const total = totalTaskCount();
  const done = doneTaskCount();
  const pct = total ? Math.round((done / total) * 100) : 0;
  const focus = getTodaysFocus();

  return `
    <div style="padding: 10px 0;">
      <div class="mt-hero-card">
        
        <h1>Good Evening, ${esc(state.userName || 'Andy')} 👋</h1>
        <p>You're in great shape.</p>

        <div class="mt-recommendation">
          <h3>Today's recommendation</h3>
          <p style="font-weight: 600; margin: 0; font-size:16px; color: var(--text-main);">${esc(focus.text)}</p>
          <small style="color: var(--accent-primary); font-weight:500; display:block; margin-top:4px;">${esc(focus.phase)}</small>
        </div>

        <div class="mt-progress-container" style="max-width: 400px; margin: 30px auto 0 auto;">
          <div class="mt-progress-track">
            <div class="mt-progress-fill" style="width:${pct}%"></div>
          </div>
          <p style="margin-top: 10px; font-size: 13px; font-weight: 700; color: var(--text-muted);">${pct}% Complete</p>
        </div>
      </div>

      <div style="display: flex; gap: 16px; margin-bottom: 20px;">
        <div class="mt-card" style="padding: 20px; flex: 1; margin:0; text-align:center;">
          <div style="font-size: 28px; font-weight: 800; color:var(--text-main);">${days} Days</div>
          <div style="color: var(--text-muted); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing:0.02em; margin-top:4px;">Remaining</div>
        </div>
        <div class="mt-card" style="padding: 20px; flex: 1; margin:0; text-align:center;">
          <div style="font-size: 28px; font-weight: 800; color:var(--text-main);">${pct}%</div>
          <div style="color: var(--text-muted); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing:0.02em; margin-top:4px;">Progress</div>
        </div>
      </div>

      <div class="mt-card" style="padding: 16px 20px; background: rgba(0,122,255,0.04); border-color: rgba(0,122,255,0.12); margin:0;">
        <p style="margin: 0; font-size: 13.5px; font-weight: 600; text-align:center; color: var(--text-main);">${esc(getFunStat())}</p>
      </div>
    </div>
  `;
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
  return renderPhaseList(AppEngine.TIMELINE_DATA_MATRIX);
}

function renderAptSearch() {
  return renderPhaseList(AppEngine.APT_PHASES);
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
  const max = parseFloat(state.targetBudgetMax) || 0;
  const filter = state.aptFilter || 'all';
  const visibleList = filter === 'favorites' ? list.filter(a => a.favorite) : list;

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
            <span style="font-size:12px; color:var(--text-muted); font-weight:500;">Bracket Matrix: ${minRentText} – ${maxRentText}</span>
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
      <label>Annual Income (for a rough budget check):</label>
      <input type="number" id="mt-income-input" value="${state.annualIncome || ''}" />
    </div>
    <div class="mt-income-wrapper">
      <label>Target Budget Range ($/mo):</label>
      <div style="display:flex; gap:10px; align-items:center; margin-bottom: 12px;">
        ${renderRentDropdownHtml('mt-apt-min-rent', 'Min Target Rent', state.targetBudgetMin || '')}
        <span style="color: var(--text-muted); font-weight:600;">–</span>
        ${renderRentDropdownHtml('mt-apt-max-rent', 'Max Target Rent', state.targetBudgetMax || '')}
      </div>
      ${max > 0 ? `
        <p style="font-size: 12.5px; color: var(--text-muted); margin-top: 8px;">
          For a $${max.toLocaleString()}/mo max, most landlords want to see an annual income of at least
          <strong>$${(max * 40).toLocaleString()}</strong> (the standard 40x rent rule).
          ${state.annualIncome ? (state.annualIncome >= max * 40
            ? ' Your current income clears that.'
            : ` That's about $${((max * 40) - state.annualIncome).toLocaleString()} above your current income — a guarantor may be worth looking into.`)
            : ''}
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
    <div style="font-family:'Oswald', sans-serif; font-size:14px; text-transform:uppercase; margin-bottom:10px; color:var(--text-muted); font-weight:700; letter-spacing:0.02em;">Calculated Volume Inventory Metrics:</div>
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
      <div class="mt-card-header"><h3>Packing Logistics Checklist</h3></div>
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

function renderDonations() {
  const cats = AppEngine.DONATION_CATEGORIES.map(cat => {
    const items = state.donations[cat] || [];
    return `
      <div class="mt-cat">
        <h4><span>${esc(cat)}</span><span style="color:var(--accent-primary); font-family:monospace; font-weight:700; margin-left:8px;">${items.length}</span></h4>
        <ul>
          ${items.length ? items.map((item, i) => `
            <li><span>${esc(item)}</span><button data-don-remove="${esc(cat)}|${i}">×</button></li>
          `).join('') : '<li class="mt-empty">Empty</li>'}
        </ul>
        <div class="mt-cat-add">
          <input type="text" placeholder="Add item..." data-don-input="${esc(cat)}" />
          <button data-don-add="${esc(cat)}">+</button>
        </div>
      </div>
    `;
  }).join('');
  return `<div class="mt-cat-grid">${cats}</div>`;
}

function renderMovers() {
  return `
    <div class="mt-card" style="margin-bottom: 20px;">
      <div class="mt-card-header"><h3>NYC Movers</h3></div>
      <div class="mt-card-body">
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
      <div class="mt-card-header"><h3>Other Movers You're Considering</h3></div>
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
  'donate': { label: 'Consider donating', color: '#3f9e5e' },
  'optional': { label: 'Optional', color: '#8a8a94' }
};

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

  return `<div class="mt-mover-grid" style="grid-template-columns: 1fr;">${cards}</div>`;
}


function renderAddressUtil() {
  const rows = AppEngine.UTILITIES.map(u => {
    const rec = state.utilities[u] || { oldCancelDate: '', newStartDate: '' };
    return `
      <tr>
        <td><b>${esc(u)}</b></td>
        <td><input type="date" data-util="${esc(u)}" data-util-field="oldCancelDate" value="${esc(rec.oldCancelDate || '')}" style="width:100%; box-sizing:border-box; font-size:12px; padding:4px;" /></td>
        <td><input type="date" data-util="${esc(u)}" data-util-field="newStartDate" value="${esc(rec.newStartDate || '')}" style="width:100%; box-sizing:border-box; font-size:12px; padding:4px;" /></td>
      </tr>
    `;
  }).join('');

  return `
    <div class="mt-card">
      <div class="mt-card-header"><h3>Update Your Address</h3></div>
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
    <div class="mt-card" style="margin-top:20px; overflow-x: auto;">
      <div class="mt-card-header"><h3>Utility Connections</h3></div>
      <div class="mt-card-body" style="padding: 10px 20px;">
        <table class="mt-util-table" style="width:100%; border-collapse: collapse;">
          <thead><tr><th style="text-align:left; padding:8px 0;">Utility</th><th style="text-align:left;">Disconnect</th><th style="text-align:left;">Activation</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderDayOf() {
  return `
    <div class="mt-card">
      <div class="mt-card-header"><h3>Move Day Strategy Reminders</h3></div>
      <div class="mt-card-body">
        <ul style="padding-left:20px; line-height:1.8; font-size:13.5px; margin: 12px 0;">
          ${AppEngine.MOVE_TIPS.map(t => `<li>${esc(t)}</li>`).join('')}
        </ul>
      </div>
    </div>
    <textarea class="mt-notes-area" id="mt-notes" placeholder="Drop logistical run-sheets or notes here..." style="width:100%; min-height:180px; box-sizing:border-box; padding:12px; border-radius:8px; border:1px solid var(--border-color); font-family:inherit; font-size:13px; line-height:1.5; margin-top:15px;">${esc(state.notes || '')}</textarea>
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
      if (!name || !date) return alert('Just need your name and move date to get started!');
      state.userName = name;
      state.targetMoveDate = date;
      state.aptSize = size;
      state.showWizardOverride = false;
      AppEngine.saveState(state);
      render();
    });
    return;
  }

  let body = '';
  if (state.activeTab === 'dashboard') body = renderDashboard();
  else if (state.activeTab === 'tasks') body = renderTasks();
  else if (state.activeTab === 'aptsearch') body = renderAptSearch();
  else if (state.activeTab === 'apartments') body = renderApartments();
  else if (state.activeTab === 'supplies') body = renderSupplies();
  else if (state.activeTab === 'donations') body = renderDonations();
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
    });
  }

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
          state = Object.assign(AppEngine.defaultState(), parsed);
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

  const incomeInput = root.querySelector('#mt-income-input');
  if (incomeInput) {
    incomeInput.addEventListener('input', () => { state.annualIncome = parseFloat(incomeInput.value) || 0; AppEngine.saveState(state); });
    incomeInput.addEventListener('blur', () => render());
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

  root.querySelectorAll('[data-check]').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.getAttribute('data-check');
      const turningOn = !state.checked[key];
      const wasAllDone = isAllDone();
      state.checked[key] = !state.checked[key];
      AppEngine.saveState(state);
      if (turningOn) {
        checkPhaseCelebration(key);
        if (isAllDone() && !wasAllDone) spawnConfetti(true);
      }
      render();
    });
  });

  root.querySelectorAll('[data-don-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-don-add');
      const inputEl = root.querySelector(`[data-don-input="${CSS.escape(cat)}"]`);
      const val = inputEl ? inputEl.value.trim() : '';
      if (!val) return;
      if (!state.donations[cat]) state.donations[cat] = [];
      state.donations[cat].push(val);
      AppEngine.saveState(state);
      render();
    });
  });

  root.querySelectorAll('[data-don-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const [cat, idxStr] = btn.getAttribute('data-don-remove').split('|');
      state.donations[cat].splice(parseInt(idxStr, 10), 1);
      AppEngine.saveState(state);
      render();
    });
  });

  root.querySelectorAll('.mt-room-item-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const room = cb.getAttribute('data-room');
      const item = cb.getAttribute('data-item');
      if (!state.roomChecklist[room]) state.roomChecklist[room] = {};
      state.roomChecklist[room][item] = cb.checked;

      const guide = AppEngine.ROOM_PACKING_GUIDE[room] || [];
      const checkedCount = guide.filter(g => state.roomChecklist[room][g.item]).length;
      const newStatus = checkedCount === 0 ? 'Not started' : (checkedCount === guide.length ? 'Packed' : 'In progress');

      const wasAllDone = isAllDone();
      const justPacked = newStatus === 'Packed' && state.rooms[room] !== 'Packed';
      state.rooms[room] = newStatus;
      AppEngine.saveState(state);
      if (justPacked) {
        spawnConfetti(false);
        if (isAllDone() && !wasAllDone) spawnConfetti(true);
      }
      render();
    });
  });

  root.querySelectorAll('[data-util]').forEach(input => {
    input.addEventListener('change', () => {
      const util = input.getAttribute('data-util');
      const field = input.getAttribute('data-util-field');
      if (!state.utilities[util]) state.utilities[util] = { oldCancelDate: '', newStartDate: '' };
      state.utilities[util][field] = input.value;
      AppEngine.saveState(state);
    });
  });

  const notesEl = root.querySelector('#mt-notes');
  if (notesEl) {
    notesEl.addEventListener('input', () => { state.notes = notesEl.value; AppEngine.saveState(state); });
  }

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