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
  return bootAppWithState(savedState).rootEl.innerHTML;
}

function bootAppWithState(savedState) {
  const appendedElements = [];
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
    URL,
    document: {
      body: { appendChild(element) { appendedElements.push(element); } },
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
  return { context, rootEl, appendedElements };
}

function sameRealm(value) {
  return JSON.parse(JSON.stringify(value));
}

test('JavaScript files compile', () => {
  ['src/js/state.js', 'src/js/apartments.js', 'src/js/boxes.js', 'src/js/movers.js', 'src/js/dashboard.js', 'src/js/rooms.js', 'src/js/utilities.js', 'src/js/deadlines.js', 'src/js/dayof.js', 'src/js/savings.js', 'src/js/supplies.js', 'src/js/tasks.js', 'src/js/app.js', 'sw.js'].forEach((relPath) => {
    assert.doesNotThrow(() => new vm.Script(read(relPath), { filename: relPath }), relPath);
  });
});

test('community moving tips are integrated into planning and move day', () => {
  const MovingApp = loadStateModule();
  const allTips = MovingApp.MOVE_TIPS.join(' ');
  const moveDay = MovingApp.MOVE_DAY_STAGES.flatMap((stage) => stage.items).join(' ');
  const timeline = MovingApp.TIMELINE_DATA_MATRIX.flatMap((phase) => phase.items).join(' ');

  assert.match(allTips, /room color or number/i);
  assert.match(allTips, /Photograph each open box/i);
  assert.match(allTips, /heavy items in small boxes/i);
  assert.match(allTips, /Reuse your shoeboxes for glassware/i);
  assert.match(allTips, /trash bag up around each bundle/i);
  assert.match(moveDay, /cleaning kit/i);
  assert.match(moveDay, /make the bed first/i);
  assert.match(moveDay, /meet the crew at the destination/i);
  assert.match(timeline, /furniture hardware/i);
  assert.match(timeline, /reusable-bin rental/i);
  assert.match(read('src/js/dayof.js'), /reddit\.com\/r\/lifehacks\/comments\/sma1rc/);
  assert.match(read('src/js/dayof.js'), /reddit\.com\/r\/AskNYC\/comments\/apcsvt/);
});

test('kitchen donation guide explains how to decide on old cookware', () => {
  const MovingApp = loadStateModule();
  const kitchenGuide = MovingApp.DONATION_GUIDE.Kitchen.join(' ');
  assert.match(kitchenGuide, /Old cookware decision/i);
  assert.match(kitchenGuide, /untouched for a year/i);
  assert.match(kitchenGuide, /peeling\/chipped nonstick coating/i);
});

test('global search indexes guidance and opens matching sections', () => {
  const appJs = read('src/js/app.js');
  assert.match(appJs, /function searchMovingAssistant\(query\)/);
  assert.match(appJs, /AppEngine\.MOVE_TIPS/);
  assert.match(appJs, /state\.boxes/);
  assert.match(appJs, /data-search-tab/);
  assert.match(appJs, /data-search-text/);
  assert.match(appJs, /revealPendingSearchMatch/);
  assert.match(appJs, /mt-search-word/);

  const html = renderAppWithState({
    userName: 'Test', targetMoveDate: '2026-08-15', activeTab: 'dashboard',
    moveProfile: { apartmentHunt: true, moveStyle: 'movers', buildingType: 'apartment' }
  });
  assert.match(html, /id="mt-global-search-input"/);
  assert.match(html, /placeholder="Search everything/);
});

test('post-move dashboard prioritizes first-week closeout instead of packing', () => {
  const html = renderAppWithState({
    userName: 'Test', targetMoveDate: '2020-01-01', activeTab: 'dashboard',
    moveProfile: { apartmentHunt: true, moveStyle: 'movers', buildingType: 'apartment' }
  });
  assert.match(html, /Post-move command center/);
  assert.match(html, /first-week closeout and settling in/i);
  assert.doesNotMatch(html, /Pack \/ confirm your open-first essentials box/);
});

test('mobile quick actions expose Today and contextual box actions', () => {
  const dashboard = renderAppWithState({
    userName: 'Test', targetMoveDate: '2026-08-15', activeTab: 'dashboard',
    moveProfile: { apartmentHunt: true, moveStyle: 'movers', buildingType: 'apartment' }
  });
  assert.match(dashboard, /mt-mobile-quickbar/);
  assert.match(dashboard, /data-tab-jump="boxes"/);

  const boxes = renderAppWithState({
    userName: 'Test', targetMoveDate: '2026-08-15', activeTab: 'boxes',
    moveProfile: { apartmentHunt: true, moveStyle: 'movers', buildingType: 'apartment' }
  });
  assert.match(boxes, /data-mobile-box-action="add"/);
  assert.match(boxes, /data-mobile-box-action="search"/);
  assert.match(boxes, /id="mt-box-add-card"/);
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
  const appSectionsSource = appJs.match(/const appSections = \[([\s\S]*?)\n\];/)[1];
  const sectionIds = [...appSectionsSource.matchAll(/\{\s*id: '([^']+)'/g)].map((match) => match[1]);

  assert.deepEqual(new Set(sectionIds), new Set(sameRealm(MovingApp.TAB_IDS)));
  assert.equal(sectionIds[0], 'dashboard');
  assert.match(appJs, /navGroup: 'Start Here'/);
  assert.match(appJs, /navGroup: 'Reference'/);
});

test('mobile navigation renders the same four nav groups as desktop', () => {
  const { context, appendedElements } = bootAppWithState({
    userName: 'Test', targetMoveDate: '2026-08-15', activeTab: 'dashboard',
    moveProfile: { apartmentHunt: true, moveStyle: 'movers', buildingType: 'apartment' }
  });
  context.openMobileMenu();
  const html = appendedElements.at(-1).innerHTML;
  const groups = [...html.matchAll(/mt-mobile-column-title">([^<]+)<[\s\S]*?mt-mobile-grid-bubbles">([\s\S]*?)<\/div>/g)]
    .map(match => ({ title: match[1], tabs: [...match[2].matchAll(/data-mobile-tab="([^"]+)"/g)].map(tab => tab[1]) }));
  assert.deepEqual(groups, [
    { title: 'Start Here', tabs: ['dashboard'] },
    { title: 'Work', tabs: ['tasks', 'rooms', 'boxes', 'addressutil'] },
    { title: 'Apartment', tabs: ['aptsearch', 'apartments'] },
    { title: 'Reference', tabs: ['dayof', 'supplies', 'movers', 'savings'] }
  ]);
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
    buildingType: 'apartment',
    borough: 'manhattan'
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
  assert.equal(sanitized.boxes[0].source, '');
  assert.equal(sanitized.boxes[0].sourceKey, '');
  assert.equal(sanitized.recentlyRemovedBox, null);
  assert.deepEqual(sameRealm(sanitized.moverTip), { crewSize: 12, hours: 1, rate: 50, service: 'good' });
});

test('box inventory can undo untouched suggested boxes', () => {
  const MovingApp = loadStateModule();
  const suggestion = MovingApp.DEFAULT_BOX_PLAN[0];
  const html = renderAppWithState({
    schemaVersion: MovingApp.SCHEMA_VERSION,
    userName: 'Test',
    targetMoveDate: '2026-08-15',
    aptSize: '1br',
    activeTab: 'boxes',
    moveProfile: { apartmentHunt: false, moveStyle: 'movers', buildingType: 'apartment' },
    boxes: [{
      id: 'suggested-older-box',
      label: suggestion.label,
      room: suggestion.room,
      contents: suggestion.contents,
      fragile: !!suggestion.fragile,
      openFirst: !!suggestion.openFirst,
      status: 'packed'
    }]
  });
  assert.match(html, /Undo 1 suggested box/);
});

test('box inventory deletion renders inline undo and dismiss controls in the current session', () => {
  const MovingApp = loadStateModule();
  const context = { window: {}, clearTimeout, setTimeout };
  vm.createContext(context);
  vm.runInContext(read('src/js/boxes.js'), context, { filename: 'src/js/boxes.js' });
  const html = context.window.MovingBoxes.renderBoxes({
    AppEngine: MovingApp,
    esc: value => String(value),
    state: { boxes: [], recentlyRemovedBox: { id: 'removed-1', label: 'Box 1', room: 'Bedroom', contents: ['Sweaters'], status: 'packed' } }
  });
  assert.match(html, /Removed Box 1/);
  assert.match(html, /mt-box-undo-remove/);
  assert.match(html, /mt-box-dismiss-remove/);
  assert.doesNotMatch(read('src/js/boxes.js'), /Remove this box from the inventory/);
});

test('saved removed-box undo state is cleared on a fresh app boot', () => {
  const MovingApp = loadStateModule();
  const html = renderAppWithState({
    schemaVersion: MovingApp.SCHEMA_VERSION,
    userName: 'Test',
    targetMoveDate: '2026-08-15',
    aptSize: '1br',
    activeTab: 'boxes',
    recentlyRemovedBox: { id: 'removed-1', label: 'Box 1', room: 'Bedroom', contents: ['Sweaters'], status: 'packed' }
  });
  assert.doesNotMatch(html, /Removed Box 1/);
  assert.doesNotMatch(html, /mt-box-undo-remove/);
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
    buildingType: 'house',
    borough: 'manhattan'
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
    buildingType: 'apartment',
    borough: 'manhattan'
  });
});

test('borough changes sourced curb guidance and mover shortlist scope', () => {
  const base = {
    userName: 'Test', targetMoveDate: '2026-08-15', aptSize: '1br',
    moveProfile: { apartmentHunt: false, moveStyle: 'movers', buildingType: 'apartment' }
  };
  const manhattanTasks = renderAppWithState({ ...base, activeTab: 'tasks', moveProfile: { ...base.moveProfile, borough: 'manhattan' } });
  assert.match(manhattanTasks, /Manhattan curb \+ truck check/);
  assert.match(manhattanTasks, /Midtown or Lower Manhattan/);
  assert.match(manhattanTasks, /nyc\.gov\/html\/dot\/html\/motorist\/loading-zones/);

  const queensTasks = renderAppWithState({ ...base, activeTab: 'tasks', moveProfile: { ...base.moveProfile, borough: 'queens' } });
  assert.match(queensTasks, /Queens curb \+ truck check/);
  assert.match(queensTasks, /commercial vehicles cannot use NYC parkways/);
  assert.doesNotMatch(queensTasks, /Midtown or Lower Manhattan commercial-vehicle rules affect/);

  const queensMovers = renderAppWithState({ ...base, activeTab: 'movers', moveProfile: { ...base.moveProfile, borough: 'queens' } });
  assert.match(queensMovers, /these defaults lean Manhattan and close-borough apartment moves/);
});

test('focus item dismissals sanitize valid snooze and not-relevant records', () => {
  const MovingApp = loadStateModule();
  const sanitized = MovingApp.sanitizeState({
    dismissedFocusItems: {
      box: { mode: 'snoozed', until: '2099-01-01T00:00:00.000Z' },
      backup: { mode: 'not-relevant', until: 'ignored' },
      room: { mode: 'unknown', until: null }
    }
  });
  assert.deepEqual(sameRealm(sanitized.dismissedFocusItems), {
    box: { mode: 'snoozed', until: '2099-01-01T00:00:00.000Z' },
    backup: { mode: 'not-relevant', until: null }
  });
});

test('dashboard respects stable snoozed and not-relevant focus ids independently', () => {
  const base = {
    userName: 'Test', targetMoveDate: '2026-08-15', activeTab: 'dashboard',
    moveProfile: { apartmentHunt: false, moveStyle: 'movers', buildingType: 'apartment' }
  };
  const normal = renderAppWithState(base);
  assert.match(normal, /data-focus-id="timeline-phase"/);
  assert.match(normal, /data-focus-id="box"/);

  const dismissed = renderAppWithState({
    ...base,
    dismissedFocusItems: {
      'timeline-phase': { mode: 'snoozed', until: '2099-01-01T00:00:00.000Z' },
      box: { mode: 'not-relevant', until: null }
    }
  });
  assert.doesNotMatch(dismissed, /data-focus-id="timeline-phase"/);
  assert.doesNotMatch(dismissed, /data-focus-id="box"/);
  assert.match(dismissed, /data-focus-id="backup"/);
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

  assert.doesNotMatch(dashboardHtml, /data-tab="aptsearch"/);
  assert.doesNotMatch(dashboardHtml, /data-tab="apartments"/);
  assert.doesNotMatch(dashboardHtml, />Movers</);
  assert.match(dashboardHtml, /Today/);

  const staleApartmentHtml = renderAppWithState({ ...baseState, activeTab: 'aptsearch' });
  assert.match(staleApartmentHtml, /Today/);
  assert.doesNotMatch(staleApartmentHtml, /Search setup/);

  const staleMoversHtml = renderAppWithState({ ...baseState, activeTab: 'movers' });
  assert.match(staleMoversHtml, /Today/);
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
  assert.match(html, /Where you should be/);
  assert.match(html, /Outstanding/);
  assert.match(html, /Next 10-minute win/);
});

test('apartment search ranks sources instead of presenting a flat list', () => {
  const html = renderAppWithState({
    schemaVersion: 13,
    userName: 'Test',
    targetMoveDate: '2026-08-15',
    aptSize: '1br',
    activeTab: 'aptsearch',
    moveProfile: { apartmentHunt: true, moveStyle: 'movers', buildingType: 'apartment' },
    targetBudgetMin: '3000',
    targetBudgetMax: '4500',
    neighborhoods: ['Astoria']
  });

  assert.match(html, /Where to search first/);
  assert.match(html, /For NYC 1 bedrooms, start with these/);
  assert.match(html, /Start here/);
  assert.match(html, /StreetEasy/);
  assert.match(html, /Openigloo/);
  assert.match(html, /More backup sources/);
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

test('move day opens with one focused action and a printable move packet', () => {
  const html = renderAppWithState({
    userName: 'Test', targetMoveDate: '2026-08-15', aptSize: '1br', activeTab: 'dayof',
    moveProfile: { apartmentHunt: false, moveStyle: 'movers', buildingType: 'apartment', borough: 'manhattan' },
    contacts: { movers: 'Crew 555-0100', doorman: 'Old super', newSuper: 'New super', emergency: 'Backup person' },
    boxes: [{ id: 'box-1', label: 'First Night', room: 'Bedroom', contents: ['sheets', 'charger'], openFirst: true, fragile: false, status: 'packed' }],
    notes: 'Freight elevator at 9am'
  });
  assert.match(html, /Focused run mode/);
  assert.match(html, /Do this now/);
  assert.match(html, /data-print-move-packet="true"/);
  assert.match(html, /class="mt-move-packet"/);
  assert.match(html, /First Night/);
  assert.match(html, /Crew 555-0100/);
  assert.match(html, /Freight elevator at 9am/);
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
      plannedMoveCost: '2500',
      actualMoveCost: '2200',
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
    hasInputs: true,
    plannedMoveCost: 2500,
    actualMoveCost: 2200,
    costVariance: 300
  });
});

test('deposit return deadline carries its amount and disappears when resolved', () => {
  const context = { window: {} };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(read('src/js/deadlines.js'), context, { filename: 'src/js/deadlines.js' });
  const baseCtx = {
    state: {
      targetMoveDate: '2026-08-15', apartments: [], utilities: {},
      savings: { depositAmount: '3500', depositReturnDueDate: '2026-09-01', depositReturned: false }
    },
    AppEngine: { UTILITIES: [] },
    daysUntilDate: dateStr => Math.ceil((new Date(`${dateStr}T00:00:00`) - new Date('2026-08-10T00:00:00')) / 86400000),
    getMoveDayOfWeek: () => 'Saturday', needsApartmentHunt: () => false, isDiyMove: () => false
  };
  const deposit = context.window.MovingDeadlines.getDeadlineItems(baseCtx).find(item => item.id.startsWith('deposit-return-'));
  assert.equal(deposit.shortLabel, 'Deposit return');
  assert.equal(deposit.cost, 3500);
  assert.equal(deposit.tab, 'savings');

  baseCtx.state.savings.depositReturned = true;
  assert.equal(context.window.MovingDeadlines.getDeadlineItems(baseCtx).some(item => item.id.startsWith('deposit-return-')), false);
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

  const moveDay = items.find(item => item.source === 'move');
  assert.equal(moveDay.dueDate, '2026-08-15');
  assert.equal(moveDay.status, 'scheduled');
  assert.equal(moveDay.shortLabel, 'Move day');
  assert.equal(moveDay.cost, null);
  assert.match(moveDay.id, /^move-2026-08-15-/);
  assert.equal(moveDay.date, moveDay.dueDate);
  assert.equal(moveDay.kind, moveDay.source);

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
