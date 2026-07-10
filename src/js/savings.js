window.MovingSavings = (function() {
  function estimateSavings(state) {
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

  function renderSavings(ctx) {
    const { AppEngine, state, esc } = ctx;
    const s = state.savings || {};
    const savings = estimateSavings(state);
    const plays = AppEngine.SAVINGS_PLAYS || [];
    return `
      <div class="mt-alert-box">
        <strong>The money thesis:</strong> this app saves money by preventing avoidable charges: mover overtime, duplicate supply runs, lost deposit deductions, missed donation/resale windows, and last-minute convenience purchases.
      </div>
      <div class="mt-dashboard-metrics">
        <div class="mt-card mt-savings-metric"><div class="mt-box-big">$${savings.low.toLocaleString()}&ndash;$${savings.high.toLocaleString()}</div><div class="mt-metric-label">Estimated avoidable costs</div></div>
        <div class="mt-card mt-savings-metric"><div class="mt-box-big">$${savings.depositLow.toLocaleString()}&ndash;$${savings.depositHigh.toLocaleString()}</div><div class="mt-metric-label">Deposit risk protected</div></div>
        <div class="mt-card mt-savings-metric"><div class="mt-box-big">$${savings.moverSavings.toLocaleString()}</div><div class="mt-metric-label">Mover overtime avoided</div></div>
        <div class="mt-card mt-savings-metric"><div class="mt-box-big">$${(savings.boxSavings + savings.avoidedDuplicateBuys).toLocaleString()}</div><div class="mt-metric-label">Supply/duplicate buys avoided</div></div>
      </div>
      <div class="mt-card">
        <div class="mt-card-header"><h3>Savings estimate</h3></div>
        <div class="mt-card-body mt-savings-form-body">
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
                  <div class="mt-item-detail">${esc(play.detail)}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  return { estimateSavings, renderSavings };
})();
