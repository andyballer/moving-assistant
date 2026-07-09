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

function sameRealm(value) {
  return JSON.parse(JSON.stringify(value));
}

test('JavaScript files compile', () => {
  ['src/js/state.js', 'src/js/apartments.js', 'src/js/boxes.js', 'src/js/movers.js', 'src/js/app.js', 'sw.js'].forEach((relPath) => {
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
    market: 'nyc',
    distance: 'local',
    housing: 'renter',
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
      market: 'other',
      distance: 'long-distance',
      housing: 'owner',
      apartmentHunt: false,
      moveStyle: 'diy',
      buildingType: 'house'
    }
  });

  assert.deepEqual(sameRealm(sanitized.moveProfile), {
    market: 'other',
    distance: 'long-distance',
    housing: 'owner',
    apartmentHunt: false,
    moveStyle: 'diy',
    buildingType: 'house'
  });

  const fallback = MovingApp.sanitizeState({
    moveProfile: {
      market: 'mars',
      distance: 'teleport',
      apartmentHunt: 'sometimes',
      moveStyle: 'maybe',
      buildingType: 'tent'
    }
  });

  assert.deepEqual(sameRealm(fallback.moveProfile), {
    market: 'nyc',
    distance: 'local',
    housing: 'renter',
    apartmentHunt: true,
    moveStyle: 'movers',
    buildingType: 'apartment'
  });
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
