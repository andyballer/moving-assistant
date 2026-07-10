window.MovingUtilities = (function() {
  function getDateNudge(dateStr, leadText) {
    if (!dateStr) return leadText;
    const target = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const daysAway = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (daysAway < 0) return 'Date passed — double-check it happened.';
    if (daysAway <= 3) return 'Coming up fast. Confirm the window.';
    return leadText;
  }

  function renderAddressUtil(ctx) {
    const { AppEngine, state, esc } = ctx;
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
      const checklist = Array.isArray(guide.checklist) ? guide.checklist : [];
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
          ${checklist.length ? `
            <div class="mt-util-checklist">
              ${checklist.map((item, i) => {
                const key = `utility-${u}-${i}`;
                const isDone = !!state.checked[key];
                return `
                  <div class="mt-item ${isDone ? 'done' : ''}">
                    <input type="checkbox" class="mt-check" data-check="${esc(key)}" ${isDone ? 'checked' : ''} aria-label="${esc(item)}" />
                    <div class="mt-item-text" data-check="${esc(key)}">${esc(item)}</div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}
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
        <strong>Utility rule of thumb:</strong> internet gets weird fastest, so schedule Spectrum or your provider 2-3 weeks before move day, keep service through the last day you need it, and return rented equipment right after cancellation with a receipt.
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

  return { renderAddressUtil };
})();
