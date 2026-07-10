window.MovingRooms = (function() {
  const ROOM_ICONS = { 'Kitchen': '🍳', 'Bedroom': '🛏️', 'Bathroom': '🚿', 'Closet': '👕', 'Living Room': '🛋️', 'Entryway/Storage': '📦' };
  const ACTION_TAGS = {
    'bring': { label: 'Bring', color: '#2f6fed' },
    'buy-new': { label: 'Buy new at destination', color: '#c9832f' },
    'donate': { label: 'Donate / purge', color: '#3f9e5e' },
    'optional': { label: 'Optional', color: '#8a8a94' }
  };

  function renderDonationSuggestions(ctx) {
    const { AppEngine, state, esc } = ctx;
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

  function renderInstalledItemReminders(ctx) {
    const { AppEngine, state, esc } = ctx;
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

  function renderBulkyDonationRules(ctx) {
    const { AppEngine, state, esc } = ctx;
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

  function renderRooms(ctx) {
    const { AppEngine, state, esc } = ctx;
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
      ${renderInstalledItemReminders(ctx)}
      ${renderBulkyDonationRules(ctx)}
      ${renderDonationSuggestions(ctx)}
      <div class="mt-mover-grid" style="grid-template-columns: 1fr;">${cards}</div>
    `;
  }

  return { renderRooms };
})();
