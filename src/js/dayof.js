window.MovingDayOf = (function() {
  function getMoveDayItems(ctx) {
    return (ctx.AppEngine.MOVE_DAY_STAGES || []).flatMap(stage => stage.items.map((text, index) => ({
      stage: stage.title,
      emoji: stage.emoji,
      text,
      key: `dayof-${stage.title.replace(/\W+/g, '-').toLowerCase()}-${index}`,
      done: !!ctx.state.checked[`dayof-${stage.title.replace(/\W+/g, '-').toLowerCase()}-${index}`]
    })));
  }

  function renderRunMode(ctx) {
    const items = getMoveDayItems(ctx);
    const done = items.filter(item => item.done).length;
    const current = items.find(item => !item.done);
    const openFirst = (ctx.state.boxes || []).filter(box => box.openFirst && box.status !== 'unpacked');
    const contacts = ctx.state.contacts || {};
    const contactRows = [
      ['Movers', contacts.movers], ['Current building', contacts.doorman],
      ['New building', contacts.newSuper], ['Backup', contacts.emergency]
    ].filter(([, value]) => value);
    const progress = items.length ? Math.round((done / items.length) * 100) : 0;
    return `
      <section class="mt-run-mode ${ctx.daysUntilMove() === 0 ? 'is-today' : ''}">
        <div class="mt-run-mode-head">
          <div><span class="mt-dashboard-kicker">Focused run mode</span><h2>${current ? 'Do this now' : 'Move-day run sheet complete'}</h2></div>
          <strong>${done}/${items.length}</strong>
        </div>
        <div class="mt-run-progress"><span style="width:${progress}%"></span></div>
        ${current ? `
          <label class="mt-current-task">
            <input type="checkbox" class="mt-check" data-check="${current.key}" aria-label="${ctx.esc(current.text)}" />
            <span><small>${ctx.esc(current.emoji)} ${ctx.esc(current.stage)}</small><strong>${ctx.esc(current.text)}</strong></span>
          </label>
        ` : '<p class="mt-run-complete">Everything is checked. Save the packet, hydrate, and take the win.</p>'}
        <div class="mt-run-glance">
          <div><span>Open-first boxes</span><strong>${openFirst.length}</strong><small>${openFirst.length ? ctx.esc(openFirst.slice(0, 3).map(box => box.label).join(' · ')) : 'None still marked'}</small></div>
          <div><span>Essential contacts</span><strong>${contactRows.length}</strong><small>${contactRows.length ? ctx.esc(contactRows.map(([label]) => label).join(' · ')) : 'Add them under Utilities'}</small></div>
          <button data-print-move-packet="true">Print / save move packet</button>
        </div>
      </section>
    `;
  }

  function renderMovePacket(ctx) {
    const state = ctx.state;
    const profile = state.moveProfile || {};
    const openFirst = (state.boxes || []).filter(box => box.openFirst && box.status !== 'unpacked');
    const contacts = state.contacts || {};
    const utilities = ctx.AppEngine.UTILITIES.map(name => ({ name, ...(state.utilities[name] || {}) }));
    const deadlines = (ctx.deadlineItems || []).filter(item => item.status !== 'completed').slice(0, 14);
    const selectedMovers = ctx.AppEngine.MOVERS.filter(mover => state.movers && state.movers[mover.name]);
    const movers = [...selectedMovers.map(mover => ({ name: mover.name, phone: mover.phone })), ...(state.customMovers || [])];
    const moveDate = state.targetMoveDate ? new Date(`${state.targetMoveDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Not set';
    const contactRows = [['Movers', contacts.movers], ['Current building', contacts.doorman], ['New building', contacts.newSuper], ['Emergency backup', contacts.emergency]].filter(([, value]) => value);
    return `
      <article class="mt-move-packet">
        <header><span>Moving Assistant</span><h1>${ctx.esc(state.userName || 'My')} move packet</h1><p>${ctx.esc(moveDate)} · ${ctx.esc(profile.borough || 'NYC')} · ${ctx.esc(state.aptSize || '')}</p></header>
        <section><h2>Fast contacts</h2>${contactRows.length ? `<dl>${contactRows.map(([label, value]) => `<div><dt>${ctx.esc(label)}</dt><dd>${ctx.esc(value)}</dd></div>`).join('')}</dl>` : '<p>No contacts saved.</p>'}</section>
        <section><h2>Mover / crew</h2>${movers.length ? `<ul>${movers.map(mover => `<li><strong>${ctx.esc(mover.name)}</strong>${mover.phone ? ` — ${ctx.esc(mover.phone)}` : ''}${mover.quoteAmount ? ` — $${ctx.esc(mover.quoteAmount)}` : ''}</li>`).join('')}</ul>` : '<p>DIY move or no mover selected.</p>'}</section>
        <section><h2>Open-first inventory</h2>${openFirst.length ? `<ul>${openFirst.map(box => `<li><strong>${ctx.esc(box.label)}</strong> (${ctx.esc(box.room)}): ${ctx.esc((box.contents || []).join(', ') || 'contents not listed')}</li>`).join('')}</ul>` : '<p>No active open-first boxes.</p>'}</section>
        <section><h2>Utilities</h2><ul>${utilities.map(util => `<li><strong>${ctx.esc(util.name)}</strong>: ${ctx.esc(util.provider || 'provider not set')} · ${ctx.esc(util.status || 'not started')}${util.confirmation ? ` · confirmation ${ctx.esc(util.confirmation)}` : ''}</li>`).join('')}</ul></section>
        <section><h2>Dates to protect</h2>${deadlines.length ? `<ul>${deadlines.map(item => `<li><strong>${ctx.esc(item.dateLabel)}</strong> — ${ctx.esc(item.shortLabel || item.label)}${Number.isFinite(item.cost) ? ` ($${item.cost.toLocaleString()})` : ''}</li>`).join('')}</ul>` : '<p>No tracked dates.</p>'}</section>
        ${state.notes ? `<section><h2>Move notes</h2><p class="mt-packet-notes">${ctx.esc(state.notes)}</p></section>` : ''}
        <footer>Generated locally by Moving Assistant · ${new Date().toLocaleDateString()}</footer>
      </article>
    `;
  }

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
      ${renderRunMode(ctx)}
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
        <div class="mt-card-header"><h3>Community-tested packing reminders</h3></div>
        <div class="mt-card-body">
          <ul class="mt-tight-list">
            ${AppEngine.MOVE_TIPS.map(t => `<li>${esc(t)}</li>`).join('')}
          </ul>
          <p class="mt-source-links">Adapted from practical suggestions shared by <a href="https://www.reddit.com/r/lifehacks/comments/sma1rc/tips_for_moving_efficiently/" target="_blank" rel="noopener noreferrer">r/lifehacks</a> and <a href="https://www.reddit.com/r/AskNYC/comments/apcsvt/tips_for_making_moving_easier/" target="_blank" rel="noopener noreferrer">r/AskNYC</a>.</p>
        </div>
      </div>
      <textarea class="mt-notes-area" id="mt-notes" placeholder="Drop mover arrival windows, elevator info, super phone, food plan, or chaos notes here...">${esc(ctx.state.notes || '')}</textarea>
      ${renderMovePacket(ctx)}
    `;
  }

  return { renderDayOf };
})();
