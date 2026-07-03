const AppEngine = window.MovingApp;
let state = AppEngine.loadState();

// --- CORE ANIMATION ---
function playWelcomeAnimation() {
  if (sessionStorage.getItem('hasAnimated')) return;

  const overlay = document.createElement('div');
  overlay.id = 'mt-welcome-overlay';
  
  // Ensure image path matches your actual file structure
  overlay.innerHTML = `
    <div class="truck-wrapper">
      <img src="src/assets/moving truck.webp" class="mt-truck-img" alt="Moving Truck" onerror="console.error('IMAGE FAILED TO LOAD: Check the path in app.js')" />
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
    localStorage.clear();
    location.reload();
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
  const isWeekend = (weekday === 'Saturday' || weekday === 'Sunday');
  const parts = state.targetMoveDate.split('-');
  const moveDateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  const formattedMoveDate = moveDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return `
    <div class="mt-header">
      <div class="mt-title-area">
        <h1>The Big Move</h1>
        <p>Target Date: <span style="font-size: 15px; color: var(--accent-primary); font-weight:700;">${formattedMoveDate} (${weekday})</span></p>
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
  const tabs = [
    ['dashboard', '🏠 Dashboard'],
    ['tasks', '📋 Milestone Timeline'],
    ['aptsearch', '🔍 Market Search Timeline'],
    ['apartments', '🏢 Apartment Tracker'],
    ['supplies', '📦 Boxes & Supplies'],
    ['donations', '🤝 Donations Manager'],
    ['spend', '💰 Spending Ledger'],
    ['movers', '🚛 Moving Companies'],
    ['rooms', '🏠 Room Packing Matrix'],
    ['addressutil', '⚡ Address & Utilities'],
    ['dayof', '🎯 Move Day Survival']
  ];

  return `
    <div class="mt-sidebar">
      <div class="mt-sidebar-top">
        <div class="mt-user-badge">
          <div class="welcome">Packing for a ${state.aptSize.toUpperCase()}</div>
          <div class="username">${esc(state.userName || 'Friend')}</div>
        </div>
        <div class="mt-nav">
          ${tabs.map(([id, label]) => `<button data-tab="${id}" class="${state.activeTab === id ? 'active' : ''}">${label}</button>`).join('')}
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
    <div style="padding: 40px;">
      <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 30px;">Dashboard</h1>
      
      <div style="display: flex; gap: 20px; margin-bottom: 30px;">
        <div class="mt-card" style="padding: 20px; flex: 1;">
          <div style="font-size: 32px; font-weight: 800;">${days} Days</div>
          <div style="color: var(--text-muted); font-size: 12px; font-weight: 600; text-transform: uppercase;">Remaining</div>
        </div>
        <div class="mt-card" style="padding: 20px; flex: 1;">
          <div style="font-size: 32px; font-weight: 800;">${pct}%</div>
          <div style="color: var(--text-muted); font-size: 12px; font-weight: 600; text-transform: uppercase;">Progress</div>
        </div>
      </div>

      <div class="mt-card" style="padding: 20px; border-left: 5px solid var(--accent-primary);">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: var(--text-muted);">Today's Focus</h3>
        <p style="font-size: 18px; font-weight: 600; margin-bottom: 5px;">${esc(focus.text)}</p>
        <p style="font-size: 12px; color: var(--accent-primary);">${esc(focus.phase)}</p>
      </div>

      <div class="mt-card" style="padding: 16px 20px; margin-top: 16px; background: rgba(0,122,255,0.05); border-color: rgba(0,122,255,0.15);">
        <p style="margin: 0; font-size: 13.5px; font-weight: 600;">${esc(getFunStat())}</p>
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

function renderApartments() {
  const list = state.apartments || [];
  const { max40xRent, comfortCeiling } = AppEngine.getBudgetLimits(state.annualIncome);
  const min = parseFloat(state.targetBudgetMin) || 0;
  const max = parseFloat(state.targetBudgetMax) || 0;
  const cards = list.length ? list.slice().reverse().map((a, ri) => {
    const i = list.length - 1 - ri;
    const status = a.status || 'Visited'; 
    let statusClass = 'mt-badge-optimal';
    if (status === 'Applied') statusClass = 'mt-badge-stretching';
    else if (status === 'Rejected') statusClass = 'mt-badge-fail';
    else if (status === 'Lease Signed') statusClass = 'mt-badge-success';
    const safeUrl = a.url && /^https?:\/\//i.test(a.url) ? a.url : null;

    return `
      <div class="mt-apt-card">
        <div class="mt-apt-card-top">
          <div>
            <h4>${esc(a.name)}</h4>
            ${safeUrl ? `<a href="${esc(safeUrl)}" target="_blank" rel="noopener noreferrer" class="mt-apt-link-chip">🔗 View Listing</a>` : ''}
            <div style="margin-top: 6px;">
              ${AppEngine.APT_STATUSES.map(s => `
                <button data-apt-status="${i}" data-status-val="${s}" 
                  style="font-size: 10px; padding: 2px 6px; margin-right: 4px; margin-top: 4px; border-radius: 4px; border: 1px solid var(--border-color); cursor: pointer; ${status === s ? 'background: var(--accent-primary); color: white;' : 'background: white;'}"
                >${s}</button>
              `).join('')}
            </div>
          </div>
          <div style="text-align:right;">
            <div class="mt-apt-price">${a.price ? '$' + parseFloat(a.price).toLocaleString() + '/mo' : '—'}</div>
            <span class="mt-apt-status ${statusClass}">${status}</span>
          </div>
        </div>
        <button class="mt-apt-card-remove" data-apt-remove="${i}" style="margin-top: 10px; font-size: 11px; background: none; border: none; color: var(--accent-danger); cursor: pointer;">Delete Listing</button>
      </div>
    `;
  }).join('') : '<div class="mt-empty">No apartments logged yet.</div>';

  return `
    <div class="mt-income-wrapper">
      <label>Annual Income (for a rough budget check):</label>
      <input type="number" id="mt-income-input" value="${state.annualIncome || ''}" />
    </div>
    <div class="mt-income-wrapper">
      <label>Target Budget Range ($/mo):</label>
      <div style="display:flex; gap:10px; align-items:center;">
        <input type="number" id="mt-budget-min" placeholder="Min (e.g. 3500)" value="${state.targetBudgetMin || ''}" style="flex:1;" />
        <span style="color: var(--text-muted);">–</span>
        <input type="number" id="mt-budget-max" placeholder="Max (e.g. 4000)" value="${state.targetBudgetMax || ''}" style="flex:1;" />
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
    <div class="mt-apt-form">
      <input type="text" id="mt-apt-name" placeholder="Address / Building Name" />
      <input type="number" id="mt-apt-price" placeholder="Rent/mo" />
      <input type="url" id="mt-apt-url" placeholder="Listing URL (optional)" style="flex: 2; min-width: 160px;" />
      <button class="mt-wizard-btn" id="mt-apt-submit" style="width: auto;">Add Apartment</button>
    </div>
    ${cards}
  `;
}

function renderSupplies() {
  const boxCalculations = AppEngine.calculateSuppliesConfig(state.aptSize);
  return `
    <div style="font-family:'Oswald'; font-size:14px; text-transform:uppercase; margin-bottom:10px; color:var(--text-muted);">Calculated Volume Inventory Metrics:</div>
    <div class="mt-supply-metrics">
      <div class="mt-supply-badge"><span class="count">${boxCalculations.small}</span><span class="label">Small Boxes</span></div>
      <div class="mt-supply-badge"><span class="count">${boxCalculations.medium}</span><span class="label">Medium Boxes</span></div>
      <div class="mt-supply-badge"><span class="count">${boxCalculations.large}</span><span class="label">Large Boxes</span></div>
      <div class="mt-supply-badge"><span class="count">${boxCalculations.tape} Rolls</span><span class="label">Packing Tape</span></div>
      <div class="mt-supply-badge"><span class="count">${boxCalculations.paper} Packs</span><span class="label">Wrapping Paper</span></div>
    </div>
    <div class="mt-card">
      <div class="mt-card-header"><h3>Packing Logistics Checklist</h3></div>
      <div class="mt-card-body">
        ${AppEngine.SUPPLIES.map((text, i) => {
          const key = 'supply-' + i;
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
}

function renderDonations() {
  const cats = AppEngine.DONATION_CATEGORIES.map(cat => {
    const items = state.donations[cat] || [];
    return `
      <div class="mt-cat">
        <h4><span>${esc(cat)}</span><span style="color:var(--accent-primary); font-family:monospace;">${items.length}</span></h4>
        <ul>
          ${items.length ? items.map((item, i) => `
            <li><span>${esc(item)}</span><button data-don-remove="${esc(cat)}|${i}">×</button></li>
          `).join('') : '<li class="mt-empty">Empty</li>'}
        </ul>
        <div class="mt-cat-add">
          <input type="text" placeholder="Add..." data-don-input="${esc(cat)}" />
          <button data-don-add="${esc(cat)}">+</button>
        </div>
      </div>
    `;
  }).join('');
  return `<div class="mt-cat-grid">${cats}</div>`;
}

function renderSpend() {
  const total = state.spend.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  const rows = state.spend.length ? state.spend.slice().reverse().map((s, ri) => {
    const i = state.spend.length - 1 - ri;
    return `
      <div class="mt-spend-row" style="display:flex; justify-content:space-between; padding: 12px 0; border-bottom:1px solid var(--border-color);">
        <div><span style="font-weight:600; color:var(--accent-primary); margin-right:10px;">${esc(s.category)}</span> ${esc(s.note || '')}</div>
        <div><span style="font-family:monospace; font-weight:600;">$${parseFloat(s.amount).toFixed(2)}</span><button data-spend-remove="${i}" style="background:none; border:none; color:var(--accent-danger); margin-left:10px; cursor:pointer;">×</button></div>
      </div>
    `;
  }).join('') : '<div class="mt-empty">No logged transactions.</div>';

  return `
    <div class="mt-apt-summary">
      <div class="mt-apt-stat"><span class="n">$${total.toFixed(2)}</span><span class="l">Total Outflow</span></div>
    </div>
    <div class="mt-spend-form">
      <select id="mt-spend-cat">
        ${AppEngine.SPEND_CATEGORIES.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}
      </select>
      <input type="text" id="mt-spend-note" placeholder="Item notation description" />
      <input type="number" id="mt-spend-amt" placeholder="$0.00" />
      <button id="mt-spend-submit">Log Transaction</button>
    </div>
    <div class="mt-card"><div class="mt-card-body">${rows}</div></div>
  `;
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
        <div class="mt-apt-form" style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:16px;">
          <input type="text" id="mover-name" placeholder="Company name" style="flex:1; min-width:140px;" />
          <input type="text" id="mover-phone" placeholder="Phone" style="flex:1; min-width:120px;" />
          <input type="text" id="mover-notes" placeholder="Notes (quote, reviews, etc.)" style="flex:2; min-width:160px;" />
          <button class="mt-wizard-btn" id="mover-add-btn" style="width:auto;">Add Mover</button>
        </div>
        ${state.customMovers.length === 0
          ? '<p style="color:var(--text-muted); font-size:13px;">Add any other movers you\'re getting quotes from.</p>'
          : `<div class="mt-mover-grid">
              ${state.customMovers.map((m, i) => `
                <div class="mt-mover">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <h4>${esc(m.name)}</h4>
                    <span data-remove-mover="${i}" style="cursor:pointer; color:var(--text-muted); font-size:13px;">✕</span>
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

function renderRooms() {
  return `
    <div class="mt-mover-grid">
      ${AppEngine.ROOMS.map(room => {
        const currentStatus = state.rooms[room] || 'Not started';
        return `
          <div class="mt-cat">
            <h4>${esc(room)}</h4>
            <div style="display:flex; gap:6px; margin-top:10px;">
              <button data-room="${esc(room)}" data-room-status="Not started" class="btn-status-red ${currentStatus === 'Not started' ? 'active' : ''}" style="flex:1; padding:6px; font-size:11px; border-radius:6px; border:1px solid var(--border-color); cursor:pointer;">Not Started</button>
              <button data-room="${esc(room)}" data-room-status="In progress" class="btn-status-yellow ${currentStatus === 'In progress' ? 'active' : ''}" style="flex:1; padding:6px; font-size:11px; border-radius:6px; border:1px solid var(--border-color); cursor:pointer;">In Progress</button>
              <button data-room="${esc(room)}" data-room-status="Packed" class="btn-status-green ${currentStatus === 'Packed' ? 'active' : ''}" style="flex:1; padding:6px; font-size:11px; border-radius:6px; border:1px solid var(--border-color); cursor:pointer;">Packed</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderAddressUtil() {
  const rows = AppEngine.UTILITIES.map(u => {
    const rec = state.utilities[u] || { oldCancelDate: '', newStartDate: '' };
    return `
      <tr>
        <td><b>${esc(u)}</b></td>
        <td><input type="date" data-util="${esc(u)}" data-util-field="oldCancelDate" value="${esc(rec.oldCancelDate || '')}" /></td>
        <td><input type="date" data-util="${esc(u)}" data-util-field="newStartDate" value="${rec.newStartDate || ''}" /></td>
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
    <div class="mt-card" style="margin-top:20px;">
      <div class="mt-card-header"><h3>Utility Connections</h3></div>
      <div class="mt-card-body">
        <table class="mt-util-table">
          <thead><tr><th>Utility Line</th><th>Disconnect Date</th><th>Activation Date</th></tr></thead>
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
        <ul style="padding-left:20px; line-height:1.8; font-size:13.5px;">
          ${AppEngine.MOVE_TIPS.map(t => `<li>${esc(t)}</li>`).join('')}
        </ul>
      </div>
    </div>
    <textarea class="mt-notes-area" id="mt-notes" placeholder="Drop logistical run-sheets or notes here...">${esc(state.notes || '')}</textarea>
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
  else if (state.activeTab === 'spend') body = renderSpend();
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

  const budgetMinInput = root.querySelector('#mt-budget-min');
  if (budgetMinInput) {
    budgetMinInput.addEventListener('input', () => { state.targetBudgetMin = budgetMinInput.value; AppEngine.saveState(state); });
    budgetMinInput.addEventListener('blur', () => render());
  }

  const budgetMaxInput = root.querySelector('#mt-budget-max');
  if (budgetMaxInput) {
    budgetMaxInput.addEventListener('input', () => { state.targetBudgetMax = budgetMaxInput.value; AppEngine.saveState(state); });
    budgetMaxInput.addEventListener('blur', () => render());
  }

  root.querySelectorAll('[data-tab]').forEach(btn => {
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
      const val = root.querySelector(`[data-don-input="${CSS.escape(cat)}"]`).value.trim();
      if (!val) return;
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

  root.querySelectorAll('[data-room-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      const room = btn.getAttribute('data-room');
      const status = btn.getAttribute('data-room-status');
      const wasAllDone = isAllDone();
      const justPacked = status === 'Packed' && state.rooms[room] !== 'Packed';
      state.rooms[room] = status;
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
      state.utilities[input.getAttribute('data-util')][input.getAttribute('data-util-field')] = input.value;
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
      if (!name || !price) return;
      state.apartments.push({ name, price, url });
      AppEngine.saveState(state);
      render();
    });
  }

  const moverAddBtn = root.querySelector('#mover-add-btn');
  if (moverAddBtn) {
    moverAddBtn.addEventListener('click', () => {
      const name = root.querySelector('#mover-name').value.trim();
      const phone = root.querySelector('#mover-phone').value.trim();
      const notes = root.querySelector('#mover-notes').value.trim();
      if (!name) return;
      state.customMovers.push({ name, phone, notes });
      AppEngine.saveState(state);
      render();
    });
  }

  root.querySelectorAll('[data-remove-mover]').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-remove-mover'), 10);
      if (!confirm('Remove this mover?')) return;
      state.customMovers.splice(idx, 1);
      AppEngine.saveState(state);
      render();
    });
  });

  root.querySelectorAll('[data-apt-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-apt-status'), 10);
      state.apartments[idx].status = btn.getAttribute('data-status-val');
      AppEngine.saveState(state);
      render();
    });
  });

  root.querySelectorAll('[data-apt-remove]').forEach(btn => {
    btn.addEventListener('click', () => { state.apartments.splice(parseInt(btn.getAttribute('data-apt-remove'), 10), 1); AppEngine.saveState(state); render(); });
  });

  const spendSubmit = root.querySelector('#mt-spend-submit');
  if (spendSubmit) {
    spendSubmit.addEventListener('click', () => {
      const cat = root.querySelector('#mt-spend-cat').value;
      const note = root.querySelector('#mt-spend-note').value.trim();
      const amt = root.querySelector('#mt-spend-amt').value;
      if (!amt) return;
      state.spend.push({ category: cat, note, amount: amt });
      AppEngine.saveState(state);
      render();
    });
  }

  root.querySelectorAll('[data-spend-remove]').forEach(btn => {
    btn.addEventListener('click', () => { state.spend.splice(parseInt(btn.getAttribute('data-spend-remove'), 10), 1); AppEngine.saveState(state); render(); });
  });
}

// --- STARTUP ---
document.getElementById('mt-loading').style.display = 'none';
playWelcomeAnimation();
render();