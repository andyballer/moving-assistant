window.MovingDashboard = (function() {
  function getDeadlineGroups(deadlines) {
    return [
      { label: 'Today', items: deadlines.filter(item => item.days <= 0) },
      { label: 'This Week', items: deadlines.filter(item => item.days > 0 && item.days <= 7) },
      { label: 'Later', items: deadlines.filter(item => item.days > 7) }
    ].filter(group => group.items.length);
  }

  function renderDashboard(ctx) {
    const {
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
    } = ctx;

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
    const upcomingDeadlines = getUpcomingDeadlines();
    const deadlineGroups = getDeadlineGroups(upcomingDeadlines);
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

        <div class="mt-deadline-panel">
          <div class="mt-card-header">
            <h3>Upcoming deadlines</h3>
            <div class="mt-deadline-actions">
              <span class="date-range">${upcomingDeadlines.length ? `${upcomingDeadlines.length} tracked` : 'Add dates'}</span>
              ${upcomingDeadlines.length ? '<button class="mt-mini-action" data-export-calendar="true">Export calendar</button>' : ''}
            </div>
          </div>
          <div class="mt-deadline-list">
            ${deadlineGroups.length ? deadlineGroups.map(group => `
              <section class="mt-deadline-group">
                <h4>${esc(group.label)}</h4>
                <div class="mt-deadline-group-list">
                  ${group.items.map(item => `
                    <button class="mt-deadline-chip ${esc(item.tone)}" data-focus-open="${esc(item.tab)}">
                      <span class="mt-deadline-date">${esc(item.dateLabel)}</span>
                      <span class="mt-deadline-main">
                        <strong>${esc(item.label)}</strong>
                        <small>${esc(item.detail || item.kind)}</small>
                      </span>
                      <em>${esc(item.dueLabel)}</em>
                    </button>
                  `).join('')}
                </div>
              </section>
            `).join('') : `
              <div class="mt-empty">Add utility dates or apartment follow-ups and they will show up here.</div>
            `}
          </div>
        </div>

        <div class="mt-dashboard-metrics">
          <div class="mt-card mt-dashboard-metric-card">
            <div class="mt-dashboard-metric-value">${days}</div>
            <div class="mt-metric-label">Days left</div>
          </div>
          <div class="mt-card mt-dashboard-metric-card">
            <div class="mt-dashboard-metric-value">${packedRooms}/${AppEngine.ROOMS.length}</div>
            <div class="mt-metric-label">Rooms packed</div>
          </div>
          <div class="mt-card mt-dashboard-metric-card">
            <div class="mt-dashboard-metric-value">${boxCount}</div>
            <div class="mt-metric-label">Boxes logged</div>
          </div>
          <div class="mt-card mt-dashboard-metric-card">
            <div class="mt-dashboard-metric-value">${savings.hasInputs ? `$${savings.low.toLocaleString()}–$${savings.high.toLocaleString()}` : 'Add details'}</div>
            <div class="mt-metric-label">Avoidable costs</div>
          </div>
        </div>

        <div class="mt-card mt-dashboard-fun-stat">
          <p>${esc(getFunStat())}${openFirstCount ? ` · ${openFirstCount} open-first box${openFirstCount === 1 ? '' : 'es'} should stay easy to grab.` : ''}</p>
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

  return { renderDashboard };
})();
