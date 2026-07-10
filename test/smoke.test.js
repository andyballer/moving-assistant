const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function loadStateModule() {
  const context = {
    console,
    window: {},
    localStorage: {
      data: new Map(),
      getItem(key) { return this.data.get(key) || null; },
      setItem(key, value) { this.data.set(key, String(value)); },
      removeItem(key) { this.data.delete(key); }
    }
  };
  vm.createContext(context);
  vm.runInContext(read('src/js/state.js'), context, { filename: 'src/js/state.js' });
  return context.window.MovingApp;
}

function renderAppWithState(savedState) {
  const rootEl = {
    innerHTML: '',
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
  const noopElement = {
    style: {},
    appendChild() {},
    remove() {},
    querySelector() { return { addEventListener() {} }; },
    querySelectorAll() { return []; },
    addEventListener() {}
  };
  const context = {
    console,
    alert() {},
    confirm() { return false; },
    setTimeout() {},
    location: { reload() {} },
    document: {
      body: { appendChild() {} },
      createElement() { return { ...noopElement, style: {} }; },
      getElementById(id) { return id === 'move-tracker-root' ? rootEl : noopElement; }
    },
    sessionStorage: {
      data: new Map([['hasAnimated', 'true']]),
      getItem(key) { return this.data.get(key) || null; },
      setItem(key, value) { this.data.set(key, String(value)); },
      removeItem(key) { this.data.delete(key); }
    },
    localStorage: {
      data: new Map([[ 'move-tracker:state:v8', JSON.stringify(savedState) ]]),
      getItem(key) { return this.data.get(key) || null; },
      setItem(key, value) { this.data.set(key, String(value)); },
      removeItem(key) { this.data.delete(key); }
    },
    window: {}
  };
  context.window = context;
  vm.createContext(context);
  ['src/js/state.js', 'src/js/apartments.js', 'src/js/boxes.js', 'src/js/movers.js', 'src/js/dashboard.js', 'src/js/rooms.js', 'src/js/utilities.js', 'src/js/deadlines.js', 'src/js/dayof.js', 'src/js/savings.js', 'src/js/supplies.js', 'src/js/tasks.js', 'src/js/app.js'].forEach((relPath) => {
    vm.runInContext(read(relPath), context, { filename: relPath });
  });
  return rootEl.innerHTML;
}

function sameRealm(value) {
  return JSON.parse(JSON.stringify(value));
}

test('JavaScript files compile', () => {
  ['src/js/state.js', 'src/js/apartments.js', 'src/js/boxes.js', 'src/js/movers.js', 'src/js/dashboard.js', 'src/js/rooms.js', 'src/js/utilities.js', 'src/js/deadlines.js', 'src/js/dayof.js', 'src/js/savings.js', 'src/js/supplies.js', 'src/js/tasks.js', 'src/js/app.js', 'sw.js'].forEach((relPath) => {
    assert.doesNotThrow(() => new vm.Script(read(relPath), { filename: relPath }), relPath);
  });
});

test('HTML loads app scripts in dependency order', () => {
  const html = read('index.html');
  const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((match) => match[1]);
  assert.deepEqual(scripts, [
    'src/js/state.js',
    'src/js/apartments.js',
    'src/js/boxes.js',
    'src/js/movers.js',
    'src/js/dashboard.js',
    'src/js/rooms.js',
    'src/js/utilities.js',
    'src/js/deadlines.js',
    'src/js/dayof.js',
    'src/js/savings.js',
    'src/js/supplies.js',
    'src/js/tasks.js',
    'src/js/app.js'
  ]);
});

test('service worker caches every local shell asset', () => {
  const sw = read('sw.js');
  const assetMatches = [...sw.matchAll(/'\.\/([^']*)'/g)].map((match) => match[1]);
  const assets = assetMatches.filter(Boolean);

  assert.ok(assets.includes('index.html'));
  assert.ok(assets.includes('src/js/state.js'));
  assert.ok(assets.includes('src/js/apartments.js'));
  assert.ok(assets.includes('src/js/boxes.js'));
  assert.ok(assets.includes('src/js/movers.js'));
  assert.ok(assets.includes('src/js/dashboard.js'));
  assert.ok(assets.includes('src/js/rooms.js'));
  assert.ok(assets.includes('src/js/utilities.js'));
  assert.ok(assets.includes('src/js/deadlines.js'));
  assert.ok(assets.includes('src/js/dayof.js'));
  assert.ok(assets.includes('src/js/savings.js'));
  assert.ok(assets.includes('src/js/supplies.js'));
  assert.ok(assets.includes('src/js/tasks.js'));
  assert.ok(assets.includes('src/js/app.js'));
  assert.ok(assets.includes('src/css/style.css'));

  assets.forEach((asset) => {
    assert.ok(fs.existsSync(path.join(root, asset)), `Missing cached asset: ${asset}`);
  });
});

test('navigation tabs and state-valid tabs stay in sync', () => {
  const appJs = read('src/js/app.js');
  const MovingApp = loadStateModule();
  const sectionIds = [...appJs.matchAll(/\{\s*id: '([^']+)'/g)].map((match) => match[1]);

  assert.deepEqual(sectionIds, sameRealm(MovingApp.TAB_IDS));
});

test('default state has the expected core shape', () => {
  const MovingApp = loadStateModule();
  const state = MovingApp.defaultState();

  assert.equal(state.schemaVersion, MovingApp.SCHEMA_VERSION);
  assert.equal(state.activeTab, 'dashboard');
  assert.equal(state.aptSize, '1br');
  assert.deepEqual(sameRealm(state.moveProfile), {
    apartmentHunt: true,
    moveStyle: 'movers',
    buildingType: 'apartment'
  });
  assert.deepEqual(Object.keys(state.utilities), sameRealm(MovingApp.UTILITIES));
  assert.deepEqual(Object.keys(state.rooms), sameRealm(MovingApp.ROOMS));
  assert.equal(Array.isArray(state.apartments), true);
  assert.equal(Array.isArray(state.boxes), true);
});

test('sanitizeState migrates older apartment and box data', () => {
  const MovingApp = loadStateModule();
  const sanitized = MovingApp.sanitizeState({
    schemaVersion: 1,
    activeTab: 'donations',
    aptSize: 'castle',
    neighborhoods: [' Gramercy ', '', 'Flatiron'],
    apartments: [
      { name: 'Old listing', url: 'https://example.com/listing', status: 'Visited' }
    ],
    boxes: [
      { label: 'Kitchen 1', contents: 'mugs, plates', status: 'lost' }
    ],
    moverTip: { crewSize: 99, hours: -4, rate: 100, service: 'heroic' }
  });

  assert.equal(sanitized.schemaVersion, MovingApp.SCHEMA_VERSION);
  assert.equal(sanitized.activeTab, 'rooms');
  assert.equal(sanitized.aptSize, '1br');
  assert.equal('city' in sanitized, false);
  assert.deepEqual(sameRealm(sanitized.neighborhoods), ['Gramercy', 'Flatiron']);
  assert.deepEqual(sameRealm(sanitized.apartments[0].links), ['https://example.com/listing']);
  assert.equal(sanitized.apartments[0].status, 'Viewed');
  assert.deepEqual(sameRealm(sanitized.boxes[0].contents), ['mugs', 'plates']);
  assert.equal(sanitized.boxes[0].status, 'packed');
  assert.deepEqual(sameRealm(sanitized.moverTip), { crewSize: 12, hours: 1, rate: 50, service: 'good' });
});

test('sanitizeState normalizes move profile applicability fields', () => {
  const MovingApp = loadStateModule();
  const sanitized = MovingApp.sanitizeState({
    moveProfile: {
      apartmentHunt: false,
      moveStyle: 'diy',
      buildingType: 'house'
    }
  });

  assert.deepEqual(sameRealm(sanitized.moveProfile), {
    apartmentHunt: false,
    moveStyle: 'diy',
    buildingType: 'house'
  });

  const fallback = MovingApp.sanitizeState({
    moveProfile: {
      apartmentHunt: 'sometimes',
      moveStyle: 'maybe',
      buildingType: 'tent'
    }
  });

  assert.deepEqual(sameRealm(fallback.moveProfile), {
    apartmentHunt: true,
    moveStyle: 'movers',
    buildingType: 'apartment'
  });
});

test('building type changes task guidance', () => {
  const baseState = {
    schemaVersion: 13,
    userName: 'Test',
    targetMoveDate: '2026-08-15',
    aptSize: '1br',
    activeTab: 'tasks',
    moveProfile: { apartmentHunt: false, moveStyle: 'movers', buildingType: 'house' }
  };
  const houseHtml = renderAppWithState(baseState);
  assert.match(houseHtml, /House move focus/);
  assert.match(houseHtml, /House \/ standalone logistics/);
  assert.match(houseHtml, /truck parking/);
  assert.doesNotMatch(houseHtml, /COI = Certificate of Insurance/);

  const apartmentHtml = renderAppWithState({
    ...baseState,
    moveProfile: { apartmentHunt: false, moveStyle: 'movers', buildingType: 'apartment' }
  });
  assert.match(apartmentHtml, /COI = Certificate of Insurance/);
  assert.match(apartmentHtml, /Apartment \/ building logistics/);
});

test('profile applicability hides irrelevant navigation and redirects stale tabs', () => {
  const baseState = {
    schemaVersion: 13,
    userName: 'Test',
    targetMoveDate: '2026-08-15',
    aptSize: '1br',
    activeTab: 'dashboard',
    moveProfile: { apartmentHunt: false, moveStyle: 'diy', buildingType: 'apartment' }
  };
  const dashboardHtml = renderAppWithState(baseState);

  assert.doesNotMatch(dashboardHtml, /Apartment Hunt/);
  assert.doesNotMatch(dashboardHtml, /Apartment Tracker/);
  assert.doesNotMatch(dashboardHtml, />Movers</);
  assert.match(dashboardHtml, /Dashboard/);

  const staleApartmentHtml = renderAppWithState({ ...baseState, activeTab: 'aptsearch' });
  assert.match(staleApartmentHtml, /Dashboard/);
  assert.doesNotMatch(staleApartmentHtml, /Search setup/);

  const staleMoversHtml = renderAppWithState({ ...baseState, activeTab: 'movers' });
  assert.match(staleMoversHtml, /Dashboard/);
  assert.doesNotMatch(staleMoversHtml, /Mover tipping guide/);
});

test('move style changes task guidance', () => {
  const baseState = {
    schemaVersion: 13,
    userName: 'Test',
    targetMoveDate: '2026-08-15',
    aptSize: '1br',
    activeTab: 'tasks',
    moveProfile: { apartmentHunt: false, moveStyle: 'diy', buildingType: 'apartment' }
  };
  const diyHtml = renderAppWithState(baseState);
  assert.match(diyHtml, /DIY move plan/);
  assert.match(diyHtml, /rental vehicle/);
  assert.match(diyHtml, /helper availability/);
  assert.doesNotMatch(diyHtml, /Request written quotes from 3-5 movers/);

  const moverHtml = renderAppWithState({
    ...baseState,
    moveProfile: { apartmentHunt: false, moveStyle: 'movers', buildingType: 'apartment' }
  });
  assert.match(moverHtml, /Mover-assisted plan/);
  assert.match(moverHtml, /Request written quotes from 3-5 movers/);
});

test('internet utility guidance includes cancellation and equipment return plan', () => {
  const html = renderAppWithState({
    schemaVersion: 13,
    userName: 'Test',
    targetMoveDate: '2026-08-15',
    aptSize: '1br',
    activeTab: 'addressutil',
    moveProfile: { apartmentHunt: false, moveStyle: 'movers', buildingType: 'apartment' }
  });

  assert.match(html, /schedule Spectrum or your provider 2-3 weeks before move day/);
  assert.match(html, /Schedule cancellation for the day after your last needed internet use/);
  assert.match(html, /return rented modem\/router\/cable boxes/);
  assert.match(html, /Return rented devices as soon as service ends/);
});

test('dashboard surfaces upcoming deadline chips from existing dates', () => {
  const html = renderAppWithState({
    schemaVersion: 13,
    userName: 'Test',
    targetMoveDate: '2026-08-15',
    aptSize: '1br',
    activeTab: 'dashboard',
    moveProfile: { apartmentHunt: true, moveStyle: 'movers', buildingType: 'apartment' },
    apartments: [
      {
        name: '123 Main',
        status: 'Needs Follow-up',
        followUpDate: '2026-07-20',
        applicationDueDate: '2026-07-22',
        cashierCheckNeeded: true,
        cashierCheckBy: '2026-07-24'
      }
    ],
    utilities: {
      'Internet/Cable': {
        provider: 'Spectrum',
        oldCancelDate: '2026-08-14',
        newStartDate: '2026-08-15',
        status: 'scheduled'
      }
    }
  });

  assert.match(html, /Upcoming deadlines/);
  assert.match(html, /Export calendar/);
  assert.match(html, /Later/);
  assert.match(html, /123 Main: follow up/);
  assert.match(html, /Spectrum off/);
  assert.match(html, /Spectrum on/);
  assert.match(html, /Return internet equipment/);
  assert.match(html, /Confirm movers/);
  assert.match(html, /Move day/);
  assert.match(html, /First 24-hour home check/);
  assert.match(html, /First week closeout/);
});

test('move day includes first-week follow-up checklist', () => {
  const html = renderAppWithState({
    schemaVersion: 13,
    userName: 'Test',
    targetMoveDate: '2026-08-15',
    aptSize: '1br',
    activeTab: 'dayof',
    moveProfile: { apartmentHunt: false, moveStyle: 'movers', buildingType: 'apartment' }
  });

  assert.match(html, /First week follow-up/);
  assert.match(html, /deposit-return request/);
  assert.match(html, /Return rented modem\/router\/cable boxes/);
});

test('supplies renders extracted forecast markup', () => {
  const html = renderAppWithState({
    schemaVersion: 13,
    userName: 'Test',
    targetMoveDate: '2026-08-15',
    aptSize: '1br',
    activeTab: 'supplies',
    moveProfile: { apartmentHunt: false, moveStyle: 'movers', buildingType: 'apartment' }
  });

  assert.match(html, /mt-supply-forecast-title/);
  assert.match(html, /Your rough box forecast/);
  assert.match(html, /Amazon moving box kits/);
  assert.match(html, /Search on Amazon/);
  assert.doesNotMatch(html, /font-family:'Oswald'/);
});

test('savings helper calculates avoidable cost ranges', () => {
  const context = { window: {} };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(read('src/js/savings.js'), context, { filename: 'src/js/savings.js' });

  const savings = context.window.MovingSavings.estimateSavings({
    savings: {
      depositAmount: '4000',
      moverHourlyRate: '225',
      avoidedMoverHours: '1.5',
      reusedBoxes: '20',
      avoidedDuplicateBuys: '80'
    }
  });

  assert.deepEqual(sameRealm(savings), {
    low: 868,
    high: 2468,
    depositLow: 400,
    depositHigh: 2000,
    moverSavings: 338,
    boxSavings: 50,
    avoidedDuplicateBuys: 80,
    hasInputs: true
  });
});

test('deadline helper calculates shared deadline items', () => {
  const context = { window: {} };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(read('src/js/deadlines.js'), context, { filename: 'src/js/deadlines.js' });

  const deadlines = context.window.MovingDeadlines;
  const items = deadlines.getUpcomingDeadlines({
    state: {
      targetMoveDate: '2026-08-15',
      moveProfile: { apartmentHunt: false, moveStyle: 'movers' },
      apartments: [],
      utilities: {
        'Internet/Cable': {
          provider: 'Spectrum',
          oldCancelDate: '2026-08-14',
          newStartDate: '2026-08-15',
          status: 'scheduled'
        }
      }
    },
    AppEngine: { UTILITIES: ['Internet/Cable'] },
    daysUntilDate(dateStr) {
      return Math.ceil((new Date(`${dateStr}T00:00:00`) - new Date('2026-08-10T00:00:00')) / (1000 * 60 * 60 * 24));
    },
    getMoveDayOfWeek() { return 'Saturday'; },
    needsApartmentHunt() { return false; },
    isDiyMove() { return false; }
  });

  assert.equal(deadlines.addDaysToDateStr('2026-08-15', -7), '2026-08-08');
  assert.equal(deadlines.formatShortDate('2026-08-15'), 'Aug 15');
  assert.equal(deadlines.getDueLabel({ daysUntilDate: () => 1 }, '2026-08-11'), 'Tomorrow');
  assert.equal(deadlines.getDueTone({ daysUntilDate: () => -1 }, '2026-08-09'), 'overdue');
  assert.deepEqual(sameRealm(items.map(item => item.label)), [
    'Confirm movers',
    'Spectrum off',
    'Move day',
    'Spectrum on',
    'Return internet equipment',
    'First 24-hour home check',
    'First week closeout'
  ]);

  const calendar = deadlines.buildCalendarFile({
    state: {
      targetMoveDate: '2026-08-15',
      moveProfile: { apartmentHunt: false, moveStyle: 'movers' },
      apartments: [],
      utilities: {
        'Internet/Cable': {
          provider: 'Spectrum',
          oldCancelDate: '2026-08-14',
          newStartDate: '2026-08-15',
          status: 'scheduled'
        }
      }
    },
    AppEngine: { UTILITIES: ['Internet/Cable'] },
    daysUntilDate(dateStr) {
      return Math.ceil((new Date(`${dateStr}T00:00:00`) - new Date('2026-08-10T00:00:00')) / (1000 * 60 * 60 * 24));
    },
    getMoveDayOfWeek() { return 'Saturday'; },
    needsApartmentHunt() { return false; },
    isDiyMove() { return false; }
  }, { generatedAt: new Date('2026-08-10T12:00:00Z') });

  assert.match(calendar, /BEGIN:VCALENDAR/);
  assert.match(calendar, /SUMMARY:Return internet equipment/);
  assert.match(calendar, /SUMMARY:First week closeout/);
  assert.match(calendar, /DTSTART;VALUE=DATE:20260815/);
});

test('backup payload summary rejects random JSON and summarizes likely backups', () => {
  const MovingApp = loadStateModule();

  assert.equal(MovingApp.isLikelyBackupPayload({ hello: 'world' }), false);
  assert.equal(MovingApp.getBackupSummary({ hello: 'world' }), null);

  const summary = MovingApp.getBackupSummary({
    userName: 'Andy',
    targetMoveDate: '2026-09-01',
    checked: { a: true, b: false, c: true },
    rooms: { Kitchen: 'Packed', Bedroom: 'In progress' },
    apartments: [{ name: '123 Main', price: '3200' }],
    boxes: [{ label: 'Box 1', contents: ['books'] }],
    utilities: { Electric: { status: 'done' } }
  });

  assert.deepEqual(sameRealm(summary), {
    userName: 'Andy',
    targetMoveDate: '2026-09-01',
    aptSize: '1br',
    apartments: 1,
    boxes: 1,
    checkedItems: 2,
    packedRooms: 1,
    utilitiesDone: 1,
    schemaVersion: MovingApp.SCHEMA_VERSION
  });
});
