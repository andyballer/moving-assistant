window.MovingApp = window.MovingApp || {};

window.MovingApp.APT_STATUSES = ['Inquired', 'Emailed/Called', 'Visited', 'Applied', 'Rejected', 'Lease Signed'];
window.MovingApp.STORAGE_KEY = 'move-tracker:state:v8';

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
  'Label boxes by room, not contents — movers just need to know where to put them',
  'Take a deep breath — everyone hates moving, this feeling is normal and temporary'
];

window.MovingApp.TIMELINE_DATA_MATRIX = [
  { id: '8wk', weeksOut: 8, label: '8 Weeks: Strategy', items: ['Calculate max rent: (Annual Income / 40) [10m]', 'Research 3 movers: Compare reviews/services [45m]', 'Get COI requirements from both building managements [15m]', 'Categorize: Sort 3 donation bags for pickup [1h]'] },
  { id: '4wk', weeksOut: 4, label: '4 Weeks: Logistics', items: ['Confirm elevator reservation slot [15m]', 'Order supplies: 30 boxes, tape, markers [15m]', 'Notify current landlord (email/portal) [10m]', 'Schedule internet setup for new place [20m]'] },
  { id: '2wk', weeksOut: 2, label: '2 Weeks: Preparation', items: ['Submit COI to new building management [20m]', 'Book bed disassembly help (TaskRabbit/friend) [30m]', 'Pack non-essentials: Books/Off-season clothes [2h]', 'File USPS mail forwarding [15m]'] },
  { id: 'movingwk', weeksOut: 1, label: '1 Week: Launch Prep', items: ['Confirm movers: Call to verify arrival window [15m]', 'Pack "Essentials Box": Meds, chargers, documents, 2 days clothes [1h]', 'Defrost freezer and clean fridge [45m]', 'Photo record: Floor/wall condition for deposit return [30m]'] },
  { id: 'moveday', weeksOut: 0, label: 'Move Day: Execution', items: ['Final walkthrough: Check drawers/cabinets [20m]', 'Hand off keys to management [10m]', 'Check-in: Elevator access with new Super [10m]', 'Unpack: Essentials box and bedding [1h]'] }
];

window.MovingApp.APT_PHASES = [
  { id: 'apt-t60', weeksOut: 8, label: 'Active Pipeline Sourcing', items: ['Define budget ceiling & must-haves (Gramercy/Flatiron/Murray Hill)', 'Set up alerts on StreetEasy, Zillow, Renthop', 'Start touring — schedule 3-5 viewings per week'] },
  { id: 'apt-t30', weeksOut: 4, label: 'Application Verification Sourcing', items: ['Submit applications for top choices', 'Gather docs: pay stubs, W-2, bank statements, ID', 'Pay application/credit check fees ($20 legal cap)'] },
  { id: 'apt-t14', weeksOut: 2, label: 'Lease Processing Closures', items: ['Sign lease & pay security deposit + first month', 'Submit COI to new building', 'Reserve freight elevator for move day'] }
];

window.MovingApp.SUPPLIES = [
  { name: 'Tape Gun & Dispensers', store: 'Target, Staples, or U-Haul' },
  { name: 'Heavy-Duty Box Cutter', store: 'Target or Home Depot' },
  { name: 'Fat Permanent Sharpie Set', store: 'Target or any drugstore' },
  { name: 'Color-Coded Room Label Stickers', store: 'Amazon or Staples' },
  { name: 'Stretch Wrap Roll for Furniture', store: 'U-Haul, Home Depot, or Amazon' }
];
window.MovingApp.ADDRESS_CHANGES = ['USPS mail forwarding Profile', 'Bank Accounts & Credit Cards', 'Employer Payroll HR', 'DMV Driver License Registry', 'Active Subscriptions Default Shipping Profiles'];

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
    userName: '',
    targetMoveDate: '',
    aptSize: '1br',
    annualIncome: 0,
    targetBudgetMin: '',
    targetBudgetMax: '',
    checked: {},
    donations: window.MovingApp.DONATION_CATEGORIES.reduce((acc, c) => ({ ...acc, [c]: [] }), {}),
    movers: window.MovingApp.MOVERS.reduce((acc, m) => ({ ...acc, [m.name]: false }), {}),
    customMovers: [],
    apartments: [],
    rooms: window.MovingApp.ROOMS.reduce((acc, r) => ({ ...acc, [r]: 'Not started' }), {}),
    roomChecklist: {},
    utilities: window.MovingApp.UTILITIES.reduce((acc, u) => ({ ...acc, [u]: { oldCancelDate: '', newStartDate: '' } }), {}),
    contacts: { movers: '', doorman: '', newSuper: '', emergency: '' },
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

window.MovingApp.loadState = function() {
  try {
    const saved = localStorage.getItem(window.MovingApp.STORAGE_KEY);
    if (saved) {
      const merged = Object.assign(window.MovingApp.defaultState(), JSON.parse(saved));
      merged.apartments = window.MovingApp.migrateApartments(merged.apartments);
      return merged;
    }
  } catch (e) { console.error(e); }
  return window.MovingApp.defaultState();
};

window.MovingApp.saveState = function(stateData) {
  try { localStorage.setItem(window.MovingApp.STORAGE_KEY, JSON.stringify(stateData)); } catch (e) { console.error(e); }
};