window.MovingDeadlines = (function() {
  function getLocalDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function addDaysToDateStr(dateStr, days) {
    const date = getLocalDate(dateStr);
    if (!date) return '';
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatShortDate(dateStr) {
    const date = getLocalDate(dateStr);
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getDueLabel(ctx, dateStr) {
    const days = ctx.daysUntilDate(dateStr);
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days}d`;
  }

  function getDueTone(ctx, dateStr) {
    const days = ctx.daysUntilDate(dateStr);
    if (days < 0) return 'overdue';
    if (days <= 2) return 'soon';
    if (days <= 7) return 'week';
    return 'later';
  }

  function createDatedItem(ctx, input) {
    if (!input || !input.dueDate) return null;
    const days = ctx.daysUntilDate(input.dueDate);
    if (!Number.isFinite(days)) return null;
    const source = input.source || 'move';
    const status = input.status || (days < 0 ? 'overdue' : 'scheduled');
    return {
      id: input.id || `${source}-${input.dueDate}-${String(input.shortLabel || input.label || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
      dueDate: input.dueDate,
      status,
      source,
      cost: Number.isFinite(input.cost) ? input.cost : null,
      shortLabel: input.shortLabel || input.label,
      label: input.label || input.shortLabel,
      detail: input.detail || '',
      tab: input.tab || 'dashboard',
      days,
      dueLabel: getDueLabel(ctx, input.dueDate),
      dateLabel: formatShortDate(input.dueDate),
      tone: getDueTone(ctx, input.dueDate),
      // Compatibility aliases while existing consumers migrate to the shared shape.
      date: input.dueDate,
      kind: source
    };
  }

  function getDeadlineItems(ctx) {
    const { state, AppEngine } = ctx;
    const items = [];
    const addItem = ({ date, label, shortLabel, detail, tab, kind, status, cost, id }) => {
      const item = createDatedItem(ctx, { id, dueDate: date, label, shortLabel, detail, tab, source: kind, status, cost });
      if (item) items.push(item);
    };

    addItem({
      date: state.targetMoveDate,
      label: 'Move day',
      detail: ctx.getMoveDayOfWeek(state.targetMoveDate),
      tab: 'dayof',
      kind: 'move'
    });
    addItem({
      date: addDaysToDateStr(state.targetMoveDate, 1),
      label: 'First 24-hour home check',
      detail: 'Utilities, locks, condition photos',
      tab: 'dayof',
      kind: 'first-week'
    });
    addItem({
      date: addDaysToDateStr(state.targetMoveDate, 7),
      label: 'First week closeout',
      detail: 'Deposit request, address updates, old accounts',
      tab: 'dayof',
      kind: 'first-week'
    });
    const savings = state.savings || {};
    if (savings.depositReturnDueDate && !savings.depositReturned) {
      const depositAmount = parseFloat(savings.depositAmount);
      addItem({
        date: savings.depositReturnDueDate,
        label: 'Security deposit return due',
        shortLabel: 'Deposit return',
        detail: 'Follow up if payment or an itemized deduction notice has not arrived',
        tab: 'savings',
        kind: 'money',
        cost: Number.isFinite(depositAmount) && depositAmount > 0 ? depositAmount : null,
        id: `deposit-return-${savings.depositReturnDueDate}`
      });
    }
    addItem({
      date: addDaysToDateStr(state.targetMoveDate, -7),
      label: ctx.isDiyMove() ? 'Confirm vehicle and helpers' : 'Confirm movers',
      detail: ctx.isDiyMove() ? 'Rental, parking, loading order' : 'Arrival, crew, COI, payment',
      tab: ctx.isDiyMove() ? 'tasks' : 'movers',
      kind: ctx.isDiyMove() ? 'diy' : 'mover'
    });

    if (ctx.needsApartmentHunt()) {
      (state.apartments || []).forEach((apt, idx) => {
        const name = apt.name || `Apartment ${idx + 1}`;
        addItem({ date: apt.followUpDate, label: `${name}: follow up`, detail: apt.realtorName || apt.status || 'Apartment tracker', tab: 'apartments', kind: 'apartment' });
        addItem({ date: apt.applicationDueDate, label: `${name}: apply by`, detail: 'Application deadline', tab: 'apartments', kind: 'apartment' });
        if (apt.cashierCheckNeeded) {
          addItem({ date: apt.cashierCheckBy, label: `${name}: cashier check`, detail: 'Move-in funds', tab: 'apartments', kind: 'money' });
        }
      });
    }

    AppEngine.UTILITIES.forEach((util) => {
      const rec = state.utilities[util] || {};
      const provider = rec.provider || util;
      addItem({ date: rec.oldCancelDate, label: `${provider} off`, detail: util, tab: 'addressutil', kind: 'utility' });
      addItem({ date: rec.newStartDate, label: `${provider} on`, detail: util, tab: 'addressutil', kind: 'utility' });
      if (util === 'Internet/Cable' && rec.oldCancelDate && rec.status !== 'done') {
        addItem({
          date: addDaysToDateStr(rec.oldCancelDate, 1),
          label: 'Return internet equipment',
          detail: rec.provider ? `${rec.provider} modem/router` : 'Modem/router receipt',
          tab: 'addressutil',
          kind: 'utility'
        });
      }
    });

    return items
      .filter(item => Number.isFinite(item.days))
      .sort((a, b) => a.days - b.days);
  }

  function getUpcomingDeadlines(ctx) {
    return getDeadlineItems(ctx).filter(item => item.status !== 'completed').slice(0, 10);
  }

  function formatIcsDate(dateStr) {
    return String(dateStr || '').replace(/-/g, '');
  }

  function escapeIcsText(value) {
    return String(value || '')
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,');
  }

  function buildCalendarFile(ctx, options = {}) {
    const generatedAt = options.generatedAt || new Date();
    const stamp = generatedAt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Moving Assistant//Deadline Export//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    getDeadlineItems(ctx).forEach((item, idx) => {
      if (!item.dueDate) return;
      const date = formatIcsDate(item.dueDate);
      const uid = `moving-assistant-${item.source || 'deadline'}-${date}-${idx}@local`;
      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${date}`,
        `SUMMARY:${escapeIcsText(item.shortLabel || item.label)}`,
        `DESCRIPTION:${escapeIcsText(item.detail || item.source || 'Moving Assistant deadline')}`,
        'END:VEVENT'
      );
    });

    lines.push('END:VCALENDAR');
    return `${lines.join('\r\n')}\r\n`;
  }

  return {
    addDaysToDateStr,
    buildCalendarFile,
    createDatedItem,
    formatShortDate,
    getDueLabel,
    getDueTone,
    getDeadlineItems,
    getUpcomingDeadlines
  };
})();
