window.MovingMovers = (function() {
  function getMoverTipSummary(ctx) {
    const tip = ctx.state.moverTip || { crewSize: 3, hours: 4, rate: 8, service: 'good' };
    const serviceMultiplier = tip.service === 'great' ? 1.25 : (tip.service === 'okay' ? 0.8 : 1);
    const perMover = Math.max(0, Math.round((tip.hours || 0) * (tip.rate || 0) * serviceMultiplier));
    const totalTip = perMover * (tip.crewSize || 0);
    return { tip, perMover, totalTip };
  }

  function formatMoneyRange(range) {
    if (!range || range.length < 2) return 'Quote required';
    return `$${range[0].toLocaleString()}-$${range[1].toLocaleString()}`;
  }

  function renderMovers(ctx) {
    const { AppEngine, state, esc } = ctx;
    const { tip, perMover, totalTip } = getMoverTipSummary(ctx);
    const sizeLabels = { studio: 'studio', '1br': '1BR', '2br': '2BR', '3br': '3BR' };
    const moveSize = state.aptSize || '1br';
    const borough = state.moveProfile?.borough || 'manhattan';
    const sizeLabel = sizeLabels[moveSize] || '1BR';
    return `
      <div class="mt-alert-box">
        <strong>Planning estimate:</strong> prices below are rough local NYC apartment-move ranges for a ${esc(sizeLabel)} before packing add-ons, storage, specialty items, parking surprises, or insurance upgrades. Get written quotes and verify live reviews before booking.
      </div>
      ${borough !== 'manhattan' ? `<div class="mt-alert-box"><strong>Shortlist scope:</strong> these defaults lean Manhattan and close-borough apartment moves. For ${esc({ brooklyn: 'Brooklyn', queens: 'Queens', bronx: 'the Bronx', 'staten-island': 'Staten Island' }[borough] || 'your borough')}, compare them with locally based quotes and confirm travel time, tolls, route, and service area in writing.</div>` : ''}

      <div class="mt-card mt-mover-budget-card">
        <div class="mt-card-header"><h3>Tip + total assumptions</h3></div>
        <div class="mt-card-body">
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
            <div><span>Total tip to budget</span><strong>$${totalTip.toLocaleString()}</strong></div>
          </div>
          <p class="mt-muted-copy">The mover cards add this tip to each brand estimate so the comparison feels closer to your real cash outlay. Tip usually is not included in mover quotes.</p>
        </div>
      </div>

      <div class="mt-card" style="margin-bottom: 20px;">
        <div class="mt-card-header"><h3>Starter mover comparison</h3></div>
        <div class="mt-card-body">
          <p class="mt-muted-copy" style="margin-top:0;">These are starter defaults. Add/edit your own quotes below, especially if your move is outside NYC or has unusual access.</p>
          <div class="mt-mover-grid">
            ${AppEngine.MOVERS.map(m => {
              const range = (m.estimateBySize || {})[moveSize] || (m.estimateBySize || {})['1br'];
              const totalRange = range ? [range[0] + totalTip, range[1] + totalTip] : null;
              return `
              <div class="mt-mover">
                <div class="mt-mover-head">
                  <h4>${esc(m.name)}</h4>
                  <span class="mt-rating-pill">${esc(m.rating || 'Review check')}</span>
                </div>
                <p style="color:var(--accent-primary); font-weight:600; font-family:monospace; margin:4px 0;">${esc(m.phone)}</p>
                <p>${esc(m.desc)}</p>
                <div class="mt-mover-cost-grid">
                  <div><span>Base estimate</span><strong>${esc(formatMoneyRange(range))}</strong></div>
                  <div><span>Suggested tip</span><strong>$${totalTip.toLocaleString()}</strong><small>$${perMover.toLocaleString()} ea.</small></div>
                  <div><span>All-in planning total</span><strong>${esc(formatMoneyRange(totalRange))}</strong></div>
                </div>
                <div class="mt-mover-details">
                  <p><strong>Pricing:</strong> ${esc(m.pricingModel || m.price || 'Quote required')}</p>
                  <p><strong>Best for:</strong> ${esc(m.bestFor || 'Compare against your written quotes.')}</p>
                  <p><strong>Watch:</strong> ${esc(m.watchFor || 'Confirm access, materials, COI, stairs, and timing in writing.')}</p>
                  <p><strong>Rating note:</strong> ${esc(m.ratingNote || 'Check live reviews before booking.')}</p>
                </div>
                <div class="mt-mover-links">
                  ${m.website ? `<a href="${esc(m.website)}" target="_blank" rel="noopener noreferrer">Site</a>` : ''}
                  ${m.quoteUrl ? `<a href="${esc(m.quoteUrl)}" target="_blank" rel="noopener noreferrer">Quote</a>` : ''}
                  ${m.reviewUrl ? `<a href="${esc(m.reviewUrl)}" target="_blank" rel="noopener noreferrer">Reviews</a>` : ''}
                </div>
              </div>
            `; }).join('')}
          </div>
        </div>
      </div>

      <div class="mt-card">
        <div class="mt-card-header"><h3>Your mover quotes</h3></div>
        <div class="mt-card-body">
          <div class="mt-apt-form" style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px; padding: 10px 0;">
            <input type="text" id="mover-name" placeholder="Company name" style="width:100%; box-sizing:border-box;" />
            <input type="text" id="mover-phone" placeholder="Phone" style="width:100%; box-sizing:border-box;" />
            <input type="number" id="mover-quote" placeholder="Quoted move cost before tip ($)" style="width:100%; box-sizing:border-box;" />
            <input type="text" id="mover-notes" placeholder="Notes (quote, reviews, COI, stairs, included materials, etc.)" style="width:100%; box-sizing:border-box;" />
            <button class="mt-wizard-btn" id="mover-add-btn" style="width:100%;">Add Mover</button>
          </div>
          ${state.customMovers.length === 0
            ? '<p style="color:var(--text-muted); font-size:13px; text-align:center; padding:10px 0;">Add any other movers you are getting quotes from.</p>'
            : `<div class="mt-mover-grid">
                ${state.customMovers.map((m, i) => `
                  <div class="mt-mover">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                      <h4>${esc(m.name)}</h4>
                      <span data-remove-mover="${i}" style="cursor:pointer; color:var(--text-muted); font-size:16px; padding:0 4px;">✕</span>
                    </div>
                    ${m.phone ? `<p style="color:var(--accent-primary); font-weight:600; font-family:monospace; margin:4px 0;">${esc(m.phone)}</p>` : ''}
                    ${m.quoteAmount ? `
                      <div class="mt-mover-cost-grid">
                        <div><span>Your quote</span><strong>$${parseFloat(m.quoteAmount).toLocaleString()}</strong></div>
                        <div><span>Suggested tip</span><strong>$${totalTip.toLocaleString()}</strong><small>$${perMover.toLocaleString()} ea.</small></div>
                        <div><span>All-in planning total</span><strong>$${(parseFloat(m.quoteAmount) + totalTip).toLocaleString()}</strong></div>
                      </div>
                    ` : ''}
                    ${m.notes ? `<p>${esc(m.notes)}</p>` : ''}
                  </div>
                `).join('')}
              </div>`
          }
        </div>
      </div>
    `;
  }

  function attachHandlers(ctx) {
    const { root, state, AppEngine, render } = ctx;

    root.querySelectorAll('[data-tip-field]').forEach(input => {
      input.addEventListener('change', () => {
        if (!state.moverTip) state.moverTip = { crewSize: 3, hours: 4, rate: 8, service: 'good' };
        const field = input.getAttribute('data-tip-field');
        state.moverTip[field] = field === 'service' ? input.value : (parseFloat(input.value) || 0);
        AppEngine.saveState(state);
        render();
      });
    });

    const moverAddBtn = root.querySelector('#mover-add-btn');
    if (moverAddBtn) {
      moverAddBtn.addEventListener('click', () => {
        const name = root.querySelector('#mover-name').value.trim();
        const phone = root.querySelector('#mover-phone').value.trim();
        const quoteAmount = root.querySelector('#mover-quote').value;
        const notes = root.querySelector('#mover-notes').value.trim();
        if (!name) return alert('Company name is required.');
        state.customMovers.push({ name, phone, quoteAmount, notes });
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

  return {
    attachHandlers,
    getMoverTipSummary,
    renderMovers
  };
})();
