window.MovingBoxes = (function() {
  let undoBannerTimeout = null;

  function clearUndoBannerTimeout() {
    if (undoBannerTimeout) clearTimeout(undoBannerTimeout);
    undoBannerTimeout = null;
  }

  function suggestedBoxToBox(ctx, suggestion, indexOverride) {
    const { state } = ctx;
    const number = typeof indexOverride === 'number' ? indexOverride : ((state.boxes || []).length + 1);
    return {
      id: (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : 'box-' + Date.now() + '-' + Math.random().toString(16).slice(2),
      label: suggestion.label || `Box ${number}`,
      room: suggestion.room || 'Unassigned',
      contents: Array.isArray(suggestion.contents) ? [...suggestion.contents] : [],
      fragile: !!suggestion.fragile,
      openFirst: !!suggestion.openFirst,
      status: 'packed',
      source: 'suggested-plan',
      sourceKey: getSuggestedBoxKey(suggestion)
    };
  }

  function getSuggestedBoxKey(suggestion) {
    return `${(suggestion.label || '').toLowerCase()}|${(suggestion.room || '').toLowerCase()}`;
  }

  function normalizeContents(contents) {
    return (Array.isArray(contents) ? contents : String(contents || '').split(','))
      .map(item => String(item || '').trim())
      .filter(Boolean);
  }

  function hasSameContents(box, suggestion) {
    const boxContents = normalizeContents(box.contents);
    const suggestionContents = normalizeContents(suggestion.contents);
    return boxContents.length === suggestionContents.length
      && boxContents.every((item, idx) => item === suggestionContents[idx]);
  }

  function isUndoableSuggestedBox(box, suggestionsByKey) {
    const sourceKey = box.sourceKey || getSuggestedBoxKey(box);
    const suggestion = suggestionsByKey.get(sourceKey);
    if (!suggestion) return false;
    if (box.source === 'suggested-plan' && box.sourceKey === sourceKey) return true;
    return getSuggestedBoxKey(box) === sourceKey
      && hasSameContents(box, suggestion)
      && !!box.fragile === !!suggestion.fragile
      && !!box.openFirst === !!suggestion.openFirst;
  }

  function getUndoableSuggestedBoxes(ctx) {
    const suggestionsByKey = new Map((ctx.AppEngine.DEFAULT_BOX_PLAN || []).map(suggestion => [getSuggestedBoxKey(suggestion), suggestion]));
    return (ctx.state.boxes || []).filter(box => isUndoableSuggestedBox(box, suggestionsByKey));
  }

  function renderBoxPlan(ctx) {
    const { AppEngine, state, esc } = ctx;
    const plan = AppEngine.DEFAULT_BOX_PLAN || [];
    const used = new Set((state.boxes || []).map(getSuggestedBoxKey));
    const undoableCount = getUndoableSuggestedBoxes(ctx).length;
    return `
      <div class="mt-card mt-box-plan-card">
        <div class="mt-card-header">
          <div>
            <h3>Suggested packing order</h3>
            <p class="mt-muted-copy" style="margin:4px 0 0;">Start with what you will not need for weeks. Kitchen daily-use boxes wait until later.</p>
          </div>
          <div class="mt-box-plan-actions">
            <button class="mt-secondary-btn" id="mt-box-add-plan">Add all missing</button>
            ${undoableCount ? `<button class="mt-secondary-btn mt-secondary-btn-danger" id="mt-box-undo-plan">Undo ${undoableCount} suggested box${undoableCount === 1 ? '' : 'es'}</button>` : ''}
          </div>
        </div>
        <div class="mt-box-plan-list">
          ${plan.map((suggestion, i) => {
            const alreadyUsed = used.has(getSuggestedBoxKey(suggestion));
            return `
              <div class="mt-box-plan-item ${alreadyUsed ? 'used' : ''}">
                <div class="mt-box-plan-num">${i + 1}</div>
                <div class="mt-box-plan-main">
                  <div class="mt-box-plan-title">
                    <strong>${esc(suggestion.label)}</strong>
                    <span>${esc(suggestion.room)}</span>
                    ${suggestion.fragile ? '<em>Fragile</em>' : ''}
                    ${suggestion.openFirst ? '<em>Open first</em>' : ''}
                  </div>
                  <p>${esc(suggestion.note || '')}</p>
                  <ul>${(suggestion.contents || []).map(item => `<li>${esc(item)}</li>`).join('')}</ul>
                </div>
                <button class="mt-mini-action" data-box-use-suggestion="${i}" ${alreadyUsed ? 'disabled' : ''}>${alreadyUsed ? 'Added' : 'Use'}</button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function moveBoxBefore(ctx, dragId, dropId) {
    if (!dragId || !dropId || dragId === dropId) return false;
    const boxes = ctx.state.boxes || [];
    const from = boxes.findIndex(b => b.id === dragId);
    const to = boxes.findIndex(b => b.id === dropId);
    if (from < 0 || to < 0) return false;
    const [moved] = boxes.splice(from, 1);
    boxes.splice(from < to ? to - 1 : to, 0, moved);
    return true;
  }

  function renderBoxes(ctx) {
    const { AppEngine, state, esc } = ctx;
    const query = (state.boxSearch || '').toLowerCase();
    const filter = state.boxStatusFilter || 'all';
    const allBoxes = state.boxes || [];
    const boxes = allBoxes.filter(box => {
      const haystack = [box.label, box.room, box.status, ...(box.contents || [])].join(' ').toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const matchesFilter = filter === 'all'
        || (filter === 'open-first' && box.openFirst)
        || (filter === 'fragile' && box.fragile)
        || box.status === filter;
      return matchesQuery && matchesFilter;
    });
    const editingBox = allBoxes.find(b => b.id === state.editingBoxId);
    const roomOptions = ['Unassigned', ...AppEngine.ROOMS].map(room => `<option value="${esc(room)}" ${(editingBox?.room || '') === room ? 'selected' : ''}>${esc(room)}</option>`).join('');
    const nextNum = allBoxes.length + 1;
    const statusLabel = { packed: 'Packed', loaded: 'Loaded', arrived: 'Arrived', unpacked: 'Unpacked' };
    const counts = {
      all: allBoxes.length,
      'open-first': allBoxes.filter(b => b.openFirst).length,
      fragile: allBoxes.filter(b => b.fragile).length,
      packed: allBoxes.filter(b => b.status === 'packed').length,
      loaded: allBoxes.filter(b => b.status === 'loaded').length,
      arrived: allBoxes.filter(b => b.status === 'arrived').length,
      unpacked: allBoxes.filter(b => b.status === 'unpacked').length
    };
    const filterLabels = [
      ['all', 'All'],
      ['open-first', 'Open first'],
      ['fragile', 'Fragile'],
      ['packed', 'Packed'],
      ['loaded', 'Loaded'],
      ['arrived', 'Arrived'],
      ['unpacked', 'Unpacked']
    ];

    return `
      <div class="mt-alert-box">
        <strong>Packing order:</strong> Box 1 should be off-season closet stuff, not daily kitchen gear. Kitchen basics and open-first boxes belong much closer to move week.
      </div>
      ${state.recentlyRemovedBox ? `
        <div class="mt-box-undo-banner">
          <span>Removed ${esc(state.recentlyRemovedBox.label || 'box')}.</span>
          <span class="mt-box-undo-banner-actions">
            <button class="mt-mini-action" id="mt-box-undo-remove">Undo</button>
            <button class="mt-mini-action mt-mini-action-dismiss" id="mt-box-dismiss-remove" aria-label="Dismiss removed box message">×</button>
          </span>
        </div>
      ` : ''}
      <div class="mt-dashboard-metrics" style="margin-bottom:16px;">
        <div class="mt-card" style="padding:16px; margin:0; text-align:center;"><div class="mt-box-big">${allBoxes.length}</div><div class="mt-metric-label">Total boxes</div></div>
        <div class="mt-card" style="padding:16px; margin:0; text-align:center;"><div class="mt-box-big">${counts['open-first']}</div><div class="mt-metric-label">Open first</div></div>
        <div class="mt-card" style="padding:16px; margin:0; text-align:center;"><div class="mt-box-big">${counts.fragile}</div><div class="mt-metric-label">Fragile</div></div>
        <div class="mt-card" style="padding:16px; margin:0; text-align:center;"><div class="mt-box-big">${counts.unpacked}</div><div class="mt-metric-label">Unpacked</div></div>
      </div>
      ${renderBoxPlan(ctx)}
      <div class="mt-card" id="mt-box-add-card">
        <div class="mt-card-header"><h3>${editingBox ? `Edit ${esc(editingBox.label)}` : 'Add a box'}</h3></div>
        <div class="mt-card-body" style="padding:16px 20px;">
          <div class="mt-box-form">
            <input type="text" id="mt-box-label" placeholder="Box ${nextNum}" value="${esc(editingBox?.label || '')}" />
            <select id="mt-box-room">${roomOptions}</select>
            <input type="text" id="mt-box-contents" placeholder="Contents, comma separated" value="${esc((editingBox?.contents || []).join(', '))}" />
            <label class="mt-box-check"><input type="checkbox" id="mt-box-fragile" ${editingBox?.fragile ? 'checked' : ''} /> Fragile</label>
            <label class="mt-box-check"><input type="checkbox" id="mt-box-open-first" ${editingBox?.openFirst ? 'checked' : ''} /> Open first</label>
            <button class="mt-wizard-btn" id="mt-box-add">${editingBox ? 'Update Box' : 'Add Box'}</button>
            ${editingBox ? '<button class="mt-secondary-btn" id="mt-box-cancel-edit">Cancel edit</button>' : ''}
          </div>
        </div>
      </div>
      <div class="mt-income-wrapper">
        <label>Search boxes</label>
        <input type="search" id="mt-box-search" value="${esc(state.boxSearch || '')}" placeholder="Try: mugs, router, towels, Kitchen..." />
      </div>
      <div class="mt-chip-row" style="margin: 0 0 16px 0;">
        ${filterLabels.map(([value, label]) => `<button class="mt-filter-chip ${filter === value ? 'active' : ''}" data-box-filter="${value}">${label} (${counts[value] || 0})</button>`).join('')}
      </div>
      <div class="mt-box-grid">
        ${boxes.length ? boxes.map(box => `
          <div class="mt-box-card ${box.openFirst ? 'open-first' : ''}" draggable="true" data-box-drag-id="${esc(box.id)}">
            <div class="mt-box-card-head">
              <div>
                <h4><span class="mt-drag-handle" aria-hidden="true">⋮⋮</span>${esc(box.label)}</h4>
                <span>${esc(box.room || 'Unassigned')}</span>
              </div>
              <div class="mt-box-actions">
                <button data-box-edit="${esc(box.id)}" aria-label="Edit ${esc(box.label)}">✎</button>
                <button data-box-remove="${esc(box.id)}" aria-label="Remove ${esc(box.label)}">×</button>
              </div>
            </div>
            <div class="mt-box-tags">
              ${box.fragile ? '<span>Fragile</span>' : ''}
              ${box.openFirst ? '<span>Open first</span>' : ''}
            </div>
            <ul>
              ${(box.contents || []).length ? box.contents.map(item => `<li>${esc(item)}</li>`).join('') : '<li class="mt-empty">No contents listed yet.</li>'}
            </ul>
            <select data-box-status="${esc(box.id)}">
              ${Object.keys(statusLabel).map(val => `<option value="${val}" ${box.status === val ? 'selected' : ''}>${statusLabel[val]}</option>`).join('')}
            </select>
          </div>
        `).join('') : '<div class="mt-empty">No boxes match that view yet.</div>'}
      </div>
    `;
  }

  function attachHandlers(ctx) {
    const { root, state, AppEngine, render } = ctx;

    const boxSearch = root.querySelector('#mt-box-search');
    if (boxSearch) {
      boxSearch.addEventListener('input', () => {
        state.boxSearch = boxSearch.value;
        AppEngine.saveState(state);
      });
      boxSearch.addEventListener('keydown', (e) => { if (e.key === 'Enter') render(); });
      boxSearch.addEventListener('blur', () => render());
    }

    root.querySelectorAll('[data-box-use-suggestion]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-box-use-suggestion'), 10);
        const suggestion = (AppEngine.DEFAULT_BOX_PLAN || [])[idx];
        if (!suggestion) return;
        if (!state.boxes) state.boxes = [];
        state.boxes.push(suggestedBoxToBox(ctx, suggestion));
        AppEngine.saveState(state);
        render();
        clearUndoBannerTimeout();
        undoBannerTimeout = setTimeout(() => {
          if (!state.recentlyRemovedBox || state.recentlyRemovedBox.id !== id) return;
          state.recentlyRemovedBox = null;
          undoBannerTimeout = null;
          AppEngine.saveState(state);
          render();
        }, 8000);
      });
    });

    const addPlanBtn = root.querySelector('#mt-box-add-plan');
    if (addPlanBtn) {
      addPlanBtn.addEventListener('click', () => {
        if (!state.boxes) state.boxes = [];
        const used = new Set(state.boxes.map(getSuggestedBoxKey));
        (AppEngine.DEFAULT_BOX_PLAN || []).forEach((suggestion, idx) => {
          if (!used.has(getSuggestedBoxKey(suggestion))) {
            state.boxes.push(suggestedBoxToBox(ctx, suggestion, idx + 1));
            used.add(getSuggestedBoxKey(suggestion));
          }
        });
        AppEngine.saveState(state);
        render();
      });
    }

    const undoPlanBtn = root.querySelector('#mt-box-undo-plan');
    if (undoPlanBtn) {
      undoPlanBtn.addEventListener('click', () => {
        const undoIds = new Set(getUndoableSuggestedBoxes(ctx).map(box => box.id));
        if (!undoIds.size) return;
        state.boxes = (state.boxes || []).filter(box => !undoIds.has(box.id));
        AppEngine.saveState(state);
        render();
      });
    }

    const boxAddBtn = root.querySelector('#mt-box-add');
    if (boxAddBtn) {
      boxAddBtn.addEventListener('click', () => {
        const labelEl = root.querySelector('#mt-box-label');
        const roomEl = root.querySelector('#mt-box-room');
        const contentsEl = root.querySelector('#mt-box-contents');
        const fragileEl = root.querySelector('#mt-box-fragile');
        const openFirstEl = root.querySelector('#mt-box-open-first');
        const contents = (contentsEl.value || '').split(',').map(x => x.trim()).filter(Boolean);
        const label = labelEl.value.trim() || `Box ${(state.boxes || []).length + 1}`;
        if (!state.boxes) state.boxes = [];
        const duplicate = state.boxes.find(b => b.label.toLowerCase() === label.toLowerCase() && b.id !== state.editingBoxId);
        if (duplicate && !confirm(`${label} already exists. Add/update anyway?`)) return;
        const existing = state.boxes.find(b => b.id === state.editingBoxId);
        if (existing) {
          existing.label = label;
          existing.room = roomEl.value || 'Unassigned';
          existing.contents = contents;
          existing.fragile = !!fragileEl.checked;
          existing.openFirst = !!openFirstEl.checked;
          state.editingBoxId = '';
        } else {
          const beforePct = ctx.getPctDone();
          state.boxes.push({
            id: (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : 'box-' + Date.now(),
            label,
            room: roomEl.value || 'Unassigned',
            contents,
            fragile: !!fragileEl.checked,
            openFirst: !!openFirstEl.checked,
            status: 'packed'
          });
          if (state.boxes.length === 1) ctx.celebrateOnce('first-box', false);
          ctx.maybeCelebrateProgress(beforePct);
        }
        AppEngine.saveState(state);
        render();
      });
    }

    const boxCancelEdit = root.querySelector('#mt-box-cancel-edit');
    if (boxCancelEdit) {
      boxCancelEdit.addEventListener('click', () => {
        state.editingBoxId = '';
        AppEngine.saveState(state);
        render();
      });
    }

    root.querySelectorAll('[data-box-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.boxStatusFilter = btn.getAttribute('data-box-filter') || 'all';
        AppEngine.saveState(state);
        render();
      });
    });

    root.querySelectorAll('[data-box-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.editingBoxId = btn.getAttribute('data-box-edit');
        AppEngine.saveState(state);
        render();
      });
    });

    root.querySelectorAll('[data-box-status]').forEach(sel => {
      sel.addEventListener('change', () => {
        const id = sel.getAttribute('data-box-status');
        const box = (state.boxes || []).find(b => b.id === id);
        if (!box) return;
        box.status = sel.value;
        AppEngine.saveState(state);
        render();
      });
    });

    root.querySelectorAll('[data-box-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-box-remove');
        const removed = (state.boxes || []).find(b => b.id === id);
        if (!removed) return;
        state.recentlyRemovedBox = { ...removed };
        state.boxes = (state.boxes || []).filter(b => b.id !== id);
        if (state.editingBoxId === id) state.editingBoxId = '';
        AppEngine.saveState(state);
        render();
      });
    });

    const undoRemoveBtn = root.querySelector('#mt-box-undo-remove');
    if (undoRemoveBtn) {
      undoRemoveBtn.addEventListener('click', () => {
        clearUndoBannerTimeout();
        if (!state.recentlyRemovedBox) return;
        if (!state.boxes) state.boxes = [];
        if (!state.boxes.some(box => box.id === state.recentlyRemovedBox.id)) {
          state.boxes.push({ ...state.recentlyRemovedBox });
        }
        state.recentlyRemovedBox = null;
        AppEngine.saveState(state);
        render();
      });
    }

    const dismissRemoveBtn = root.querySelector('#mt-box-dismiss-remove');
    if (dismissRemoveBtn) {
      dismissRemoveBtn.addEventListener('click', () => {
        clearUndoBannerTimeout();
        state.recentlyRemovedBox = null;
        AppEngine.saveState(state);
        render();
      });
    }

    root.querySelectorAll('[data-box-drag-id]').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.getAttribute('data-box-drag-id'));
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        card.classList.add('drag-over');
      });
      card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        const dragId = e.dataTransfer.getData('text/plain');
        const dropId = card.getAttribute('data-box-drag-id');
        if (moveBoxBefore(ctx, dragId, dropId)) {
          AppEngine.saveState(state);
          render();
        }
      });
    });
  }

  return {
    attachHandlers,
    getUndoableSuggestedBoxes,
    getSuggestedBoxKey,
    renderBoxes
  };
})();
