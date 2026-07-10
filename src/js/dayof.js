window.MovingDayOf = (function() {
  function renderStageCards(ctx, stages, prefix) {
    const { state, esc } = ctx;
    return stages.map(stage => `
      <div class="mt-card">
        <div class="mt-card-header"><h3>${esc(stage.emoji)} ${esc(stage.title)}</h3></div>
        <div class="mt-card-body">
          ${stage.items.map((item, i) => {
            const key = `${prefix}-${stage.title.replace(/\W+/g, '-').toLowerCase()}-${i}`;
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
  }

  function renderDayOf(ctx) {
    const {
      AppEngine,
      esc,
      renderMoveStyleGuidanceCard,
      renderBuildingGuidanceCard,
      getMoverTipSummary
    } = ctx;
    const { tip, perMover, totalTip } = getMoverTipSummary();
    const guide = AppEngine.MOVER_TIPPING_GUIDE || {};

    return `
      <div class="mt-alert-box">
        <strong>Move day mode:</strong> this is not the day for cleverness. Follow the run sheet, drink water, and protect the essentials box like it is a royal heirloom.
      </div>
      ${renderMoveStyleGuidanceCard()}
      ${renderBuildingGuidanceCard()}
      <div class="mt-guide-grid">
        ${renderStageCards(ctx, AppEngine.MOVE_DAY_STAGES || [], 'dayof')}
      </div>

      <div class="mt-section-intro">
        <h3>First week follow-up</h3>
        <p>The move does not end when the boxes land. Close the loop on utilities, deposit proof, address updates, and the little new-place facts that are annoying to rediscover.</p>
      </div>
      <div class="mt-guide-grid">
        ${renderStageCards(ctx, AppEngine.FIRST_WEEK_STAGES || [], 'firstweek')}
      </div>

      <div class="mt-card mt-tip-card">
        <div class="mt-card-header"><h3>💵 Mover tipping guide</h3></div>
        <div class="mt-card-body">
          <p class="mt-muted-copy"><strong>Rule of thumb:</strong> ${esc(guide.simpleRule || '$5-$10 per mover per hour is a common practical range.')}</p>
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
      <textarea class="mt-notes-area" id="mt-notes" placeholder="Drop mover arrival windows, elevator info, super phone, food plan, or chaos notes here...">${esc(ctx.state.notes || '')}</textarea>
    `;
  }

  return { renderDayOf };
})();
