window.MovingApp = window.MovingApp || {};

window.MovingApp.APT_STATUSES = ['Visited', 'Applied', 'Rejected', 'Lease Signed'];
window.MovingApp.STORAGE_KEY = 'move-tracker:state:v8';

window.MovingApp.DONATION_CATEGORIES = ['Books', 'Games', 'Clothes', 'Electronics', 'Other'];
window.MovingApp.SPEND_CATEGORIES = ['Movers', 'Packing supplies', 'Building move-in fee', 'Building move-out/deposit', 'COI fee', 'Cleaning (old place)', 'New furniture/misc'];
window.MovingApp.ROOMS = ['Kitchen', 'Bedroom', 'Bathroom', 'Closet', 'Living Room', 'Entryway/Storage'];
window.MovingApp.ROOM_STATUSES = ['Not started', 'In progress', 'Packed'];
window.MovingApp.UTILITIES = ['Electric', 'Gas', 'Internet/Cable', 'Water (if applicable)'];

window.MovingApp.MOVERS = [
  { name: 'Roadway Moving', phone: '(212) 812-5240', price: 'Flat-rate quote, mid-to-upper range', desc: 'Reliable full-service standard, dedicated coordinators, binding estimates.' },
  { name: 'FlatRate Moving', phone: '(212) 988-9292', price: '$900-$1,400 for a 1BR local move (flat-rate)', desc: 'Originator of guaranteed flat-rate pricing, no surprise hourly overage.' },
  { name: 'Dumbo Moving & Storage', phone: '(718) 222-8282', price: 'Flat per-job pricing, generally competitive/affordable', desc: 'Well-reviewed, BBB-accredited since 2012, strong if either end is in Brooklyn.' },
  { name: 'Zip to Zip Moving', phone: '(929) 990-2060', price: 'Avg. ~$678 for a 1BR full-service move', desc: 'Frequently top-rated for in-city moves.' }
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

window.MovingApp.SUPPLIES = ['Tape Gun & Dispensers', 'Heavy-Duty Box Cutter', 'Fat Permanent Sharpie Set', 'Color-Coded Room Label Stickers', 'Stretch Wrap Roll for Furniture'];
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
    checked: {},
    donations: window.MovingApp.DONATION_CATEGORIES.reduce((acc, c) => ({ ...acc, [c]: [] }), {}),
    spend: [],
    movers: window.MovingApp.MOVERS.reduce((acc, m) => ({ ...acc, [m.name]: false }), {}),
    apartments: [],
    rooms: window.MovingApp.ROOMS.reduce((acc, r) => ({ ...acc, [r]: 'Not started' }), {}),
    utilities: window.MovingApp.UTILITIES.reduce((acc, u) => ({ ...acc, [u]: { oldCancelDate: '', newStartDate: '' } }), {}),
    contacts: { movers: '', doorman: '', newSuper: '', emergency: '' },
    notes: '',
    activeTab: 'dashboard',
    showWizardOverride: false
  };
};

window.MovingApp.loadState = function() {
  try {
    const saved = localStorage.getItem(window.MovingApp.STORAGE_KEY);
    if (saved) return Object.assign(window.MovingApp.defaultState(), JSON.parse(saved));
  } catch (e) { console.error(e); }
  return window.MovingApp.defaultState();
};

window.MovingApp.saveState = function(stateData) {
  try { localStorage.setItem(window.MovingApp.STORAGE_KEY, JSON.stringify(stateData)); } catch (e) { console.error(e); }
};