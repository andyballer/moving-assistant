window.MovingApp = window.MovingApp || {};

window.MovingApp.APT_STATUSES = ['Inquired', 'Emailed/Called', 'Visited', 'Applied', 'Rejected', 'Lease Signed'];
window.MovingApp.STORAGE_KEY = 'move-tracker:state:v8';
window.MovingApp.SCHEMA_VERSION = 9;

window.MovingApp.DONATION_CATEGORIES = ['Books', 'Games', 'Clothes', 'Electronics', 'Other'];
window.MovingApp.ROOMS = ['Kitchen', 'Bedroom', 'Bathroom', 'Closet', 'Living Room', 'Entryway/Storage'];
window.MovingApp.ROOM_STATUSES = ['Not started', 'In progress', 'Packed'];

// Curated per-room packing guide. Items are ordered most -> least important/complex.
// action tags: 'bring' | 'buy-new' | 'donate' | 'optional' (drives the little colored pill in the UI)
window.MovingApp.ROOM_PACKING_GUIDE = {
  'Kitchen': [
    { item: 'Dishes, glasses & bowls', tip: 'Wrap each piece individually in packing paper. Stack plates on their edge like records, never flat. Keep the box under 30 lbs.', action: 'bring' },
    { item: 'Pots, pans & bakeware', tip: 'Nest smaller pots inside bigger ones with packing paper between each layer. Wrap lids separately.', action: 'bring' },
    { item: 'Knives & sharp utensils', tip: 'Wrap blades in cardboard or a dish towel, tape shut, and label the box "SHARP."', action: 'bring' },
    { item: 'Small appliances (toaster, blender, coffee maker)', tip: 'Wrap cords separately from the appliance. Bubble-wrap any glass parts like carafes or blender jars.', action: 'bring' },
    { item: 'Pantry & food', tip: 'Use a cooler bag for perishables on move day. Donate unopened, unexpired items you won\'t finish before the move.', action: 'donate' },
    { item: 'Trash can & cleaning supplies', tip: 'Bring cleaning supplies in an "open first" box — you\'ll want them to clean both the old and new place.', action: 'optional' }
  ],
  'Bathroom': [
    { item: 'Shower head', tip: 'Unscrew and bring pliers for corroded fittings — landlords usually only leave a basic builder-grade one behind.', action: 'bring' },
    { item: 'Shower curtain & rings', tip: 'No box needed — just roll it up and pack it in a bag with towels.', action: 'bring' },
    { item: 'Medicine cabinet & toiletries', tip: 'Use a toiletry bag or ziplock bags for anything liquid, tape lids shut, and pack upright in a small box.', action: 'bring' },
    { item: 'Towels & bath mat', tip: 'Use these as free padding for fragile kitchen items instead of buying extra packing paper.', action: 'bring' },
    { item: 'Plunger & toilet brush', tip: 'Not worth the hassle or hygiene concern of moving — cheap to replace at your new place.', action: 'buy-new' },
    { item: 'Bathroom trash can & rugs', tip: 'Bring if still in good shape, otherwise it\'s cheap to replace.', action: 'optional' }
  ],
  'Bedroom': [
    { item: 'Bed frame & mattress', tip: 'Disassemble the frame, tape all screws/bolts into a labeled bag stuck to the frame. Use a mattress bag for the mattress itself.', action: 'bring' },
    { item: 'Dresser & nightstand contents', tip: 'Leave lightweight clothing inside the drawers to save box space — just wrap the whole piece in stretch wrap so drawers don\'t slide open.', action: 'bring' },
    { item: 'Lamps & bedding', tip: 'Wrap lamp bases in packing paper or a towel; ship shades separately since they crush easily. Pack pillows/comforters in a large bag to save space.', action: 'bring' },
    { item: 'TV, monitor & chargers', tip: 'Use the original box if you kept it. Otherwise wrap in a blanket plus bubble wrap and mark "FRAGILE."', action: 'bring' },
    { item: 'Décor & mirrors', tip: 'Tape an X across mirror glass with painter\'s tape, wrap flat, and never lay other boxes on top of it.', action: 'bring' }
  ],
  'Closet': [
    { item: 'Hanging clothes', tip: 'Use a wardrobe box with a hanger bar, or a trash bag with a hole cut for the hangers as a cheap substitute.', action: 'bring' },
    { item: 'Shoes', tip: 'Pack in original boxes if you kept them, or stack sole-to-sole in a medium box.', action: 'bring' },
    { item: 'Off-season/rarely worn clothing', tip: 'Anything you haven\'t worn in the last year is worth donating before you pack it, not after.', action: 'donate' },
    { item: 'Closet organizers & bins', tip: 'Double check whether it\'s actually built into the closet (leave it) or free-standing (bring it).', action: 'optional' },
    { item: 'Luggage', tip: 'Use your own suitcases as free moving boxes for clothes or shoes — you\'re transporting them either way.', action: 'bring' }
  ],
  'Living Room': [
    { item: 'TV & electronics', tip: 'Snap a photo of the cable setup before disconnecting anything. Bundle and label cables with painter\'s tape.', action: 'bring' },
    { item: 'Bookshelves & books', tip: 'Books are deceptively heavy — always use small boxes for them, never large ones, so you can actually lift the box.', action: 'bring' },
    { item: 'Furniture (couch, coffee table, chairs)', tip: 'Disassemble legs where possible, and measure doorways ahead of time to confirm the couch will actually fit through.', action: 'bring' },
    { item: 'Rugs', tip: 'Roll — don\'t fold — and secure with tape or stretch wrap.', action: 'bring' },
    { item: 'Décor & plants', tip: 'Small plants travel fine in an open-top box near light. Larger ones may be cheaper to rehome and replace than to move long-distance.', action: 'optional' }
  ],
  'Entryway/Storage': [
    { item: 'Seasonal/storage bins', tip: 'Consolidate into uniform box sizes so they stack cleanly in the truck.', action: 'bring' },
    { item: 'Tools & hardware', tip: 'Keep these in a toolbox and bring it in your day-of essentials bag — you\'ll need it immediately to reassemble furniture.', action: 'bring' },
    { item: 'Bikes/sports equipment', tip: 'Deflate tires slightly and remove pedals if you\'re navigating a tight stairwell.', action: 'bring' },
    { item: 'Miscellaneous storage (old boxes, expired documents)', tip: 'A move is the best excuse to actually purge and shred this stuff instead of hauling it again.', action: 'donate' },
    { item: 'Entry furniture (shoe rack, coat hooks)', tip: 'Often flimsy flat-pack furniture — may be cheaper to buy new than to disassemble and reassemble.', action: 'optional' }
  ]
};
window.MovingApp.UTILITIES = ['Electric', 'Gas', 'Internet/Cable', 'Water (if applicable)'];

window.MovingApp.UTILITY_GUIDE = {
  'Electric': { lead: '1–2 weeks ahead', nudge: 'Set activation for move-in day or the day before. Nobody wants first-night flashlight vibes.' },
  'Gas': { lead: '1–2 weeks ahead', nudge: 'If heat, hot water, or the stove depends on gas, confirm any appointment window early.' },
  'Internet/Cable': { lead: '2–3 weeks ahead', nudge: 'Book this early. First night without Wi‑Fi is how you end up watching one downloaded episode forever.' },
  'Water (if applicable)': { lead: 'Ask building/landlord', nudge: 'Often handled by the building or landlord, but worth confirming so it does not become a move-in surprise.' }
};

window.MovingApp.MOVE_DAY_STAGES = [
  {
    title: 'Before movers arrive',
    emoji: '☕',
    items: ['Charge phone and keep charger with you', 'Pack meds, wallet, keys, documents, and 2 days of clothes', 'Take photos of the old apartment condition', 'Clear a path from rooms to the door', 'Keep open-first boxes separate from the main pile']
  },
  {
    title: 'While the truck is loading',
    emoji: '🚛',
    items: ['Do a drawer/cabinet/closet sweep before anything leaves', 'Point fragile and open-first boxes out to movers', 'Keep elevator/super/COI details handy', 'Photograph anything valuable or delicate before it is wrapped']
  },
  {
    title: 'Final sweep before leaving',
    emoji: '🔦',
    items: ['Open every drawer, cabinet, closet, and medicine cabinet', 'Check outlets for chargers and extension cords', 'Take final condition photos for deposit protection', 'Return keys, fobs, and garage/elevator passes as required', 'Text/email building management that you are fully out']
  },
  {
    title: 'At the new place',
    emoji: '🏁',
    items: ['Direct boxes by room before they become a cardboard mountain', 'Set up bed basics first — future you deserves a landing pad', 'Find toilet paper, towels, shower curtain, and soap', 'Plug in router/modem if available', 'Eat something real before unpacking turns feral']
  },
  {
    title: 'First night sanity kit',
    emoji: '🛌',
    items: ['Make the bed before you are too tired to function', 'Put meds, chargers, wallet, keys, and documents somewhere obvious', 'Unpack towels, soap, toothbrush, and shower basics', 'Set up one lamp or nightlight', 'Leave tomorrow-you a water bottle and clean clothes']
  }
];

window.MovingApp.MOVERS = [
  { name: 'Roadway Moving', phone: '(212) 812-5240', price: 'Flat-rate quote, mid-to-upper range', desc: 'Reliable full-service standard, dedicated coordinators, binding estimates.' },
  { name: 'FlatRate Moving', phone: '(212) 988-9292', price: '$900-$1,400 for a 1BR local move (flat-rate)', desc: 'Originator of guaranteed flat-rate pricing, no surprise hourly overage.' },
  { name: 'Dumbo Moving & Storage', phone: '(718) 222-8282', price: 'Flat per-job pricing, generally competitive/affordable', desc: 'Well-reviewed, BBB-accredited since 2012, strong if either end is in Brooklyn.' },
  { name: 'Zip to Zip Moving', phone: '(929) 990-2060', price: 'Avg. ~$678 for a 1BR full-service move', desc: 'Frequently top-rated for in-city moves.' },
  { name: 'Oz Moving & Storage', phone: '(212) 452-6683', price: 'Mid-to-upper range, hourly or flat-rate', desc: 'Operating since 1993, one of the longest-running NYC movers — full residential, commercial, interstate, and storage.' },
  { name: 'JP Urban Moving', phone: '(718) 965-1925', price: 'Mid-to-premium, hourly', desc: 'Brooklyn-based, highly rated, experienced with strict NYC building compliance (COI, elevator scheduling) and white-glove/art handling.' },
  { name: 'Metropolis Moving', phone: '(718) 710-4520', price: 'Transparent hourly pricing, budget-friendly', desc: 'Brooklyn-based, popular with young professionals doing apartment moves; smaller crews, good price-to-service balance.' }
];

window.MovingApp.MOVE_TIPS = [
  'Order food for move day in advance — you will not want to cook or decide',
  "Pack a separate bag with 2 days of clothes, toiletries, and chargers — treat it like a weekend trip, not part of the move",
  "Don't schedule anything the day after move day — give yourself a buffer",
  'Keep phone chargers, medications, and important documents on your person, not in a box',
  'Label the outside by room + box number; keep the detailed contents in the app so movers are not reading your sock inventory',
  'Take a deep breath — everyone hates moving, this feeling is normal and temporary'
];

window.MovingApp.MOVER_TIPPING_GUIDE = {
  simpleRule: '$5–$10 per mover per hour is a common practical range. $20–$40 per mover often works for a small local move; $50–$100+ per mover is common for long, stair-heavy, or unusually smooth jobs.',
  cashNote: 'Cash in separate envelopes is easiest when you want each mover to get their share directly.',
  raiseFor: ['Lots of stairs', 'Heat, rain, or snow', 'Heavy or fragile pieces', 'Long carry distance', 'Great attitude and careful handling'],
  lowerFor: ['Late arrival without communication', 'Careless handling', 'Missing agreed services', 'Rudeness or pressure for a tip']
};

window.MovingApp.TIMELINE_DATA_MATRIX = [
  { id: '8wk', weeksOut: 8, label: '8 Weeks: Strategy', items: ['Calculate max rent: (Annual Income / 40) [10m]', 'Research 3 movers: Compare reviews/services [45m]', 'Get COI requirements from both building managements [15m]', 'Categorize: Sort 3 donation bags for pickup [1h]'] },
  { id: '4wk', weeksOut: 4, label: '4 Weeks: Logistics', items: ['Confirm elevator reservation slot [15m]', 'Order supplies: 30 boxes, tape, markers [15m]', 'Notify current landlord (email/portal) [10m]', 'Schedule internet setup for new place [20m]'] },
  { id: '2wk', weeksOut: 2, label: '2 Weeks: Preparation', items: ['Submit COI to new building management [20m]', 'Book bed disassembly help (TaskRabbit/friend) [30m]', 'Pack non-essentials: Books/Off-season clothes [2h]', 'File USPS mail forwarding [15m]'] },
  { id: 'movingwk', weeksOut: 1, label: '1 Week: Launch Prep', items: ['Confirm movers: Call to verify arrival window [15m]', 'Pack "Essentials Box": Meds, chargers, documents, 2 days clothes [1h]', 'Defrost freezer and clean fridge [45m]', 'Photo record: Floor/wall condition for deposit return [30m]'] },
  { id: 'moveday', weeksOut: 0, label: 'Move Day: Execution', items: ['Final walkthrough: Check drawers/cabinets [20m]', 'Hand off keys to management [10m]', 'Check-in: Elevator access with new Super [10m]', 'Unpack: Essentials box and bedding [1h]'] }
];

window.MovingApp.APT_PHASES = [
  { id: 'apt-t60', weeksOut: 8, label: 'Start the hunt', items: ['Define budget ceiling, must-haves, and deal-breakers', 'Set up alerts on StreetEasy, Zillow, Renthop, or your local listing sites', 'Start touring — aim for 3–5 viewings per week once listings are fresh'] },
  { id: 'apt-t30', weeksOut: 4, label: 'Apply fast', items: ['Submit applications for top choices', 'Build renter resume: pay stubs, employment letter, bank statements, ID', 'Watch fees carefully — NYC application/credit checks are generally capped at $20'] },
  { id: 'apt-t14', weeksOut: 2, label: 'Lock it down', items: ['Sign lease & pay security deposit + first month', 'Submit COI to new building if required', 'Reserve freight elevator for move day'] }
];

window.MovingApp.APT_HUNT_GUIDES = [
  {
    id: 'renter-resume',
    title: 'Renter resume',
    emoji: '📄',
    items: ['Two recent pay stubs', 'Employment letter', 'Two bank statements', 'Photo ID scan', 'Tax docs if requested']
  },
  {
    id: 'tour-detective',
    title: 'Tour like a detective',
    emoji: '🔎',
    items: ['Run faucets and check pressure', 'Test cell signal in every room', 'Open windows', 'Check hallway, laundry, trash, and lobby areas', 'Reality-check the commute at rush hour']
  },
  {
    id: 'scam-radar',
    title: 'Scam radar',
    emoji: '👻',
    items: ['Be skeptical of suspiciously cheap listings', 'Never wire money before seeing a place', 'Watch pending listings that may come back', 'Verify who any broker represents']
  }
];

window.MovingApp.DEFAULT_NEIGHBORHOODS = ['Gramercy', 'Flatiron', 'Murray Hill'];

window.MovingApp.SUPPLIES = [
  { name: 'Tape Gun & Dispensers', store: 'Target, Staples, or U-Haul' },
  { name: 'Heavy-Duty Box Cutter', store: 'Target or Home Depot' },
  { name: 'Fat Permanent Sharpie Set', store: 'Target or any drugstore' },
  { name: 'Color-Coded Room Label Stickers', store: 'Amazon or Staples' },
  { name: 'Stretch Wrap Roll for Furniture', store: 'U-Haul, Home Depot, or Amazon' }
];
window.MovingApp.ADDRESS_CHANGES = ['USPS mail forwarding', 'Bank accounts & credit cards', 'Employer payroll / HR', "Driver's license or state ID", 'Shopping, subscriptions, and delivery apps'];

window.MovingApp.DEFAULT_BOX_PLAN = [
  {
    label: 'Box 1',
    room: 'Closet',
    contents: ['Off-season clothes', 'Rarely worn shoes', 'Extra scarves/hats', 'Closet shelf items you will not touch before moving'],
    note: 'Best first box: low-risk, non-daily stuff you can pack 6-8 weeks out.',
    fragile: false,
    openFirst: false
  },
  {
    label: 'Box 2',
    room: 'Living Room',
    contents: ['Books you are not currently reading', 'Photo albums', 'Board games', 'Small shelf items'],
    note: 'Use a small box. Books get heavy absurdly fast.',
    fragile: false,
    openFirst: false
  },
  {
    label: 'Box 3',
    room: 'Living Room',
    contents: ['Decor', 'Candles', 'Frames without glass', 'Low-priority display items'],
    note: 'Clear visual clutter early without touching daily routines.',
    fragile: true,
    openFirst: false
  },
  {
    label: 'Box 4',
    room: 'Entryway/Storage',
    contents: ['Seasonal storage', 'Spare bags', 'Archived papers to keep', 'Extra extension cords'],
    note: 'Storage zones are perfect early wins because they rarely affect your week.',
    fragile: false,
    openFirst: false
  },
  {
    label: 'Box 5',
    room: 'Bedroom',
    contents: ['Extra bedding', 'Guest linens', 'Decor pillows', 'Bedroom decor'],
    note: 'Keep one normal bedding set out. Everything extra can go.',
    fragile: false,
    openFirst: false
  },
  {
    label: 'Box 6',
    room: 'Kitchen',
    contents: ['Serving platters', 'Specialty glasses', 'Baking tools you rarely use', 'Holiday or party supplies'],
    note: 'First kitchen box should be non-essential kitchen only, not daily plates or cookware.',
    fragile: true,
    openFirst: false
  },
  {
    label: 'Box 7',
    room: 'Bathroom',
    contents: ['Backstock toiletries', 'Extra towels', 'Travel-size duplicates', 'Unopened medicine cabinet extras'],
    note: 'Leave daily medicine and shower basics out until move week.',
    fragile: false,
    openFirst: false
  },
  {
    label: 'Box 8',
    room: 'Living Room',
    contents: ['Cables you are not using', 'Spare remotes', 'Game console accessories', 'Small electronics extras'],
    note: 'Bag and label cords before they become mystery noodles.',
    fragile: true,
    openFirst: false
  },
  {
    label: 'Box 9',
    room: 'Kitchen',
    contents: ['Pantry overflow', 'Duplicate mugs', 'Extra utensils', 'Cookbooks'],
    note: 'Pack this around 3-4 weeks out, after you know what you still use.',
    fragile: true,
    openFirst: false
  },
  {
    label: 'Box 10',
    room: 'Bedroom',
    contents: ['Desk papers', 'Office supplies', 'Non-daily chargers', 'Small personal items'],
    note: 'Keep IDs, lease papers, laptop charger, and daily meds with you instead.',
    fragile: false,
    openFirst: false
  },
  {
    label: 'Open First 1',
    room: 'Bathroom',
    contents: ['Toilet paper', 'Hand soap', 'Shower curtain and rings', 'Towel', 'Toothbrush/toothpaste', 'Basic toiletries'],
    note: 'Pack during move week and keep it reachable.',
    fragile: false,
    openFirst: true
  },
  {
    label: 'Open First 2',
    room: 'Bedroom',
    contents: ['Sheets', 'Pillowcase', 'Phone charger', 'Two days of clothes', 'Meds', 'Important documents'],
    note: 'This rides with you, not buried in the truck.',
    fragile: false,
    openFirst: true
  }
];

window.MovingApp.getBudgetLimits = function(annualIncome) {
  const income = parseFloat(annualIncome) || 0;
  return {
    max40xRent: Math.round(income / 40),
    comfortCeiling: Math.round(income * 0.022)
  };
};

window.MovingApp.calculateSuppliesConfig = function(size) {
  const matrix = {
    'studio': { small: 15, medium: 10, large: 5, tape: 2, paper: 1 },
    '1br':    { small: 25, medium: 20, large: 10, tape: 3, paper: 2 },
    '2br':    { small: 40, medium: 35, large: 15, tape: 5, paper: 3 },
    '3br':    { small: 55, medium: 50, large: 25, tape: 7, paper: 4 }
  };
  return matrix[size] || matrix['1br'];
};

window.MovingApp.defaultState = function() {
  return {
    schemaVersion: window.MovingApp.SCHEMA_VERSION,
    userName: '',
    targetMoveDate: '',
    aptSize: '1br',
    city: '',
    neighborhoods: [...window.MovingApp.DEFAULT_NEIGHBORHOODS],
    annualIncome: 0,
    targetBudgetMin: '',
    targetBudgetMax: '',
    checked: {},
    donations: window.MovingApp.DONATION_CATEGORIES.reduce((acc, c) => ({ ...acc, [c]: [] }), {}),
    movers: window.MovingApp.MOVERS.reduce((acc, m) => ({ ...acc, [m.name]: false }), {}),
    customMovers: [],
    apartments: [],
    boxes: [],
    boxSearch: '',
    boxStatusFilter: 'all',
    editingBoxId: '',
    rooms: window.MovingApp.ROOMS.reduce((acc, r) => ({ ...acc, [r]: 'Not started' }), {}),
    roomChecklist: {},
    utilities: window.MovingApp.UTILITIES.reduce((acc, u) => ({ ...acc, [u]: {
      oldCancelDate: '',
      newStartDate: '',
      provider: '',
      account: '',
      confirmation: '',
      status: 'not-started',
      action: 'transfer',
      phone: '',
      notes: ''
    } }), {}),
    contacts: { movers: '', doorman: '', newSuper: '', emergency: '' },
    moverTip: { crewSize: 3, hours: 4, rate: 8, service: 'good' },
    backupExportedAt: '',
    celebrationLog: {},
    notes: '',
    activeTab: 'dashboard',
    showWizardOverride: false
  };
};

// Migrates older saved apartment entries (single `url` string) to the newer shape
// that supports multiple source links, a favorite flag, and an optional preview image.
window.MovingApp.migrateApartments = function(apartments) {
  if (!Array.isArray(apartments)) return [];
  return apartments.map(a => ({
    ...a,
    links: Array.isArray(a.links) ? a.links : (a.url ? [a.url] : []),
    favorite: typeof a.favorite === 'boolean' ? a.favorite : false,
    image: a.image || null,
    imageStatus: a.imageStatus || 'none' // 'none' | 'auto' | 'manual'
  }));
};

window.MovingApp.sanitizeState = function(input) {
  const base = window.MovingApp.defaultState();
  if (!input || typeof input !== 'object' || Array.isArray(input)) return base;

  const merged = Object.assign(base, input);
  merged.schemaVersion = window.MovingApp.SCHEMA_VERSION;
  merged.userName = typeof input.userName === 'string' ? input.userName : '';
  merged.targetMoveDate = typeof input.targetMoveDate === 'string' ? input.targetMoveDate : '';
  merged.aptSize = ['studio', '1br', '2br', '3br'].includes(input.aptSize) ? input.aptSize : '1br';
  merged.city = typeof input.city === 'string' ? input.city : '';
  merged.neighborhoods = Array.isArray(input.neighborhoods)
    ? input.neighborhoods.map(String).map(x => x.trim()).filter(Boolean).slice(0, 12)
    : [...window.MovingApp.DEFAULT_NEIGHBORHOODS];
  merged.annualIncome = Number(input.annualIncome) || 0;
  merged.targetBudgetMin = input.targetBudgetMin || '';
  merged.targetBudgetMax = input.targetBudgetMax || '';
  merged.checked = (input.checked && typeof input.checked === 'object' && !Array.isArray(input.checked)) ? input.checked : {};
  merged.donations = window.MovingApp.DONATION_CATEGORIES.reduce((acc, cat) => {
    const items = input.donations && Array.isArray(input.donations[cat]) ? input.donations[cat] : [];
    acc[cat] = items.map(String);
    return acc;
  }, {});
  merged.apartments = window.MovingApp.migrateApartments(input.apartments);
  merged.customMovers = Array.isArray(input.customMovers) ? input.customMovers.map(m => ({
    name: String(m.name || ''),
    phone: String(m.phone || ''),
    notes: String(m.notes || '')
  })).filter(m => m.name) : [];
  merged.rooms = window.MovingApp.ROOMS.reduce((acc, room) => {
    const val = input.rooms && window.MovingApp.ROOM_STATUSES.includes(input.rooms[room]) ? input.rooms[room] : 'Not started';
    acc[room] = val;
    return acc;
  }, {});
  merged.roomChecklist = (input.roomChecklist && typeof input.roomChecklist === 'object' && !Array.isArray(input.roomChecklist)) ? input.roomChecklist : {};
  merged.utilities = window.MovingApp.UTILITIES.reduce((acc, util) => {
    const rec = input.utilities && input.utilities[util] && typeof input.utilities[util] === 'object' ? input.utilities[util] : {};
    acc[util] = {
      oldCancelDate: rec.oldCancelDate || '',
      newStartDate: rec.newStartDate || '',
      provider: rec.provider || '',
      account: rec.account || '',
      confirmation: rec.confirmation || '',
      status: ['not-started', 'scheduled', 'confirmed', 'done'].includes(rec.status) ? rec.status : 'not-started',
      action: ['transfer', 'cancel', 'start-new', 'ask-building'].includes(rec.action) ? rec.action : 'transfer',
      phone: rec.phone || '',
      notes: rec.notes || ''
    };
    return acc;
  }, {});
  merged.boxes = Array.isArray(input.boxes) ? input.boxes.map((box, idx) => ({
    id: box.id || ('box-' + Date.now() + '-' + idx),
    label: box.label || `Box ${idx + 1}`,
    room: box.room || 'Unassigned',
    contents: Array.isArray(box.contents) ? box.contents.map(String) : String(box.contents || '').split(',').map(x => x.trim()).filter(Boolean),
    fragile: !!box.fragile,
    openFirst: !!box.openFirst,
    status: ['packed', 'loaded', 'arrived', 'unpacked'].includes(box.status) ? box.status : 'packed'
  })) : [];
  merged.boxSearch = typeof input.boxSearch === 'string' ? input.boxSearch : '';
  merged.boxStatusFilter = ['all', 'open-first', 'fragile', 'packed', 'loaded', 'arrived', 'unpacked'].includes(input.boxStatusFilter) ? input.boxStatusFilter : 'all';
  merged.editingBoxId = typeof input.editingBoxId === 'string' ? input.editingBoxId : '';
  merged.contacts = input.contacts && typeof input.contacts === 'object' ? {
    movers: input.contacts.movers || '',
    doorman: input.contacts.doorman || '',
    newSuper: input.contacts.newSuper || '',
    emergency: input.contacts.emergency || ''
  } : { movers: '', doorman: '', newSuper: '', emergency: '' };
  const tip = input.moverTip && typeof input.moverTip === 'object' ? input.moverTip : {};
  merged.moverTip = {
    crewSize: Math.max(1, Math.min(12, parseInt(tip.crewSize, 10) || 3)),
    hours: Math.max(1, Math.min(16, parseFloat(tip.hours) || 4)),
    rate: Math.max(0, Math.min(50, parseFloat(tip.rate) || 8)),
    service: ['okay', 'good', 'great'].includes(tip.service) ? tip.service : 'good'
  };
  merged.backupExportedAt = typeof input.backupExportedAt === 'string' ? input.backupExportedAt : '';
  merged.celebrationLog = (input.celebrationLog && typeof input.celebrationLog === 'object' && !Array.isArray(input.celebrationLog)) ? input.celebrationLog : {};
  merged.notes = typeof input.notes === 'string' ? input.notes : '';
  const validTabs = ['dashboard', 'aptsearch', 'apartments', 'tasks', 'supplies', 'boxes', 'donations', 'movers', 'rooms', 'addressutil', 'dayof'];
  merged.activeTab = validTabs.includes(input.activeTab) ? input.activeTab : 'dashboard';
  merged.showWizardOverride = !!input.showWizardOverride;
  return merged;
};

window.MovingApp.loadState = function() {
  try {
    const saved = localStorage.getItem(window.MovingApp.STORAGE_KEY);
    if (saved) return window.MovingApp.sanitizeState(JSON.parse(saved));
  } catch (e) { console.error(e); }
  return window.MovingApp.defaultState();
};

window.MovingApp.saveState = function(stateData) {
  try { localStorage.setItem(window.MovingApp.STORAGE_KEY, JSON.stringify(window.MovingApp.sanitizeState(stateData))); } catch (e) { console.error(e); }
};
