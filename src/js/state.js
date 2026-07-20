window.MovingApp = window.MovingApp || {};

window.MovingApp.APT_STATUSES = ['Saved', 'Inquired', 'Heard Back', 'Needs Follow-up', 'Viewing Scheduled', 'Viewed', 'Applied', 'Rejected', 'Lease Signed'];
window.MovingApp.TAB_IDS = ['dashboard', 'savings', 'aptsearch', 'apartments', 'tasks', 'supplies', 'rooms', 'boxes', 'movers', 'addressutil', 'dayof'];
window.MovingApp.STORAGE_KEY = 'move-tracker:state:v8';
window.MovingApp.STORAGE_BACKUP_KEY = 'move-tracker:state:latest';
window.MovingApp.LEGACY_STORAGE_KEYS = [
  'move-tracker:state:v7',
  'move-tracker:state:v6',
  'move-tracker:state:v5',
  'move-tracker:state:v4',
  'move-tracker:state:v3',
  'move-tracker:state:v2',
  'move-tracker:state:v1'
];
window.MovingApp.SCHEMA_VERSION = 18;

window.MovingApp.DONATION_CATEGORIES = ['Books', 'Games', 'Clothes', 'Electronics', 'Other'];
window.MovingApp.ROOMS = ['Kitchen', 'Bedroom', 'Bathroom', 'Closet', 'Living Room', 'Entryway/Storage'];
window.MovingApp.ROOM_STATUSES = ['Not started', 'In progress', 'Packed'];

window.MovingApp.DONATION_GUIDE = {
  'Kitchen': [
    'Duplicate mugs, cups, and utensils',
    'Gadgets you forgot you owned',
    'Old cookware decision: keep the smallest reliable set you actually use; donate duplicates, specialty pieces, and pots or pans untouched for a year if they are clean and fully usable',
    'Do not donate unsafe cookware: recycle or discard pans with loose handles, severe warping, deep rust, cracks, or peeling/chipped nonstick coating',
    'Unopened shelf-stable food you will not eat before moving',
    'Serving pieces you never reach for'
  ],
  'Bedroom': ['Extra bedding sets you do not love', 'Decor pillows you only move from chair to bed', 'Lamps or decor that will not fit the next place', 'Old sheets or towels for textile recycling'],
  'Bathroom': ['Unopened toiletries you will not use', 'Duplicate hair tools', 'Expired products or medications for proper disposal', 'Towels that should become packing padding or textile recycling'],
  'Closet': ['Clothes not worn in the last year', 'Shoes that hurt or need repairs you will not make', 'Bags, belts, and accessories that no longer fit your style', 'Freebie totes and duplicate hangers'],
  'Living Room': ['Books you will not reread', 'Games with missing pieces', 'Old Xbox One / game console you decided to donate', 'Extra cables and chargers you cannot identify', 'Decor that does not match the next apartment'],
  'Entryway/Storage': ['Old boxes and mystery storage', 'Unused sports gear', 'Expired documents for shredding', 'Duplicate tools or hardware']
};

window.MovingApp.INSTALLED_ITEM_REMINDERS = [
  {
    title: 'Smart bulbs and specialty bulbs',
    room: 'Whole apartment',
    timing: '1-2 weeks before move day',
    action: 'Buy cheap standard bulbs, swap them in, test each fixture, then pack your smart/expensive bulbs in a labeled fragile box.',
    why: 'Fixtures usually need working bulbs left behind, but the upgraded bulbs are yours if you installed them.'
  },
  {
    title: 'Shower head',
    room: 'Bathroom',
    timing: 'Move week',
    action: 'Reinstall the old shower head if you still have it, check for leaks, then pack the upgraded shower head with plumber tape.',
    why: 'Landlords generally expect a working shower fixture; your upgraded one can move with you.'
  },
  {
    title: 'Router, mesh nodes, hubs, and smart bridges',
    room: 'Living Room',
    timing: 'Move day morning',
    action: 'Label each power adapter, remove smart-home hubs, and only leave ISP-owned equipment if it belongs to the building/provider.',
    why: 'Tiny hubs and adapters are easy to abandon accidentally, and replacing them is irritating.'
  },
  {
    title: 'Command hooks, adhesive mounts, and removable shelves',
    room: 'Bedroom / Entry',
    timing: 'Final week',
    action: 'Remove slowly, patch only what the lease allows, and decide whether cheap adhesive pieces are worth moving.',
    why: 'This is a deposit-protection task more than a packing task.'
  },
  {
    title: 'Window AC brackets, filters, and add-ons',
    room: 'Living Room / Bedroom',
    timing: '1-2 weeks before move day',
    action: 'Confirm what must stay with the unit, remove personal add-ons, clean filters, and photograph the window area after removal.',
    why: 'Window hardware can blur the line between yours and the apartment, so document it.'
  },
  {
    title: 'Battery chargers, wall plates, and specialty adapters',
    room: 'Whole apartment',
    timing: 'Packing week',
    action: 'Walk every outlet and shelf for chargers, smart plugs, dimmers, remotes, and adapters before the final box closes.',
    why: 'Small installed tech is exactly the stuff that gets missed in the last sweep.'
  }
];

window.MovingApp.BULKY_DONATION_RULES = [
  'If you have not used it in a year and it is large, schedule donation or resale before the final two weeks.',
  'If movers would spend more time carrying it than the item is worth, donate/sell it before move week.',
  'If it is cheap to rebuy, awkward to carry, or unlikely to fit the next layout, let it go early.',
  'For bulky items, book pickup as soon as you decide; donation pickup slots disappear quickly near month-end.',
  'Take photos, measurements, elevator/stair notes, and pickup availability before posting furniture or electronics.',
  'If an item needs repairs you have avoided for months, do not pay movers to relocate the unfinished project.'
];

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
    { item: 'Shower head', tip: 'If you installed an upgraded shower head, reinstall the old one first, check for leaks, then pack yours with plumber tape.', action: 'bring' },
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
    { item: 'Smart bulbs, hubs & upgraded tech', tip: 'Swap in cheap standard bulbs before move day so you can take expensive smart bulbs, hubs, and specialty adapters with you.', action: 'bring' },
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
  'Electric': { lead: '1-2 weeks ahead', nudge: 'Set activation for move-in day or the day before. Nobody wants first-night flashlight vibes.' },
  'Gas': { lead: '1-2 weeks ahead', nudge: 'If heat, hot water, or the stove depends on gas, confirm any appointment window early.' },
  'Internet/Cable': {
    lead: '2-3 weeks ahead',
    nudge: 'Schedule cancellation for the day after your last needed internet use, and return rented modem/router/cable boxes right after service ends.',
    checklist: [
      'Call or chat with the provider 2-3 weeks before move day to schedule old-service cancellation or transfer.',
      'Set the old-service stop date for the day after your last work/packing night unless your billing cycle makes an earlier cutoff worth it.',
      'Ask exactly which devices must be returned: modem, router, cable boxes, remotes, power cords, and any Wi-Fi pods.',
      'Return rented devices as soon as service ends; keep the drop-off receipt/tracking number and photo of serial numbers until the final bill clears.',
      'Write the cancellation confirmation number and return receipt in this card.'
    ]
  },
  'Water (if applicable)': { lead: 'Ask building/landlord', nudge: 'Often handled by the building or landlord, but worth confirming so it does not become a move-in surprise.' }
};

window.MovingApp.MOVE_DAY_STAGES = [
  {
    title: 'Before movers arrive',
    emoji: '☕',
    items: ['Charge phone and keep charger with you', 'Pack meds, wallet, keys, documents, and 2 days of clothes', 'Take photos of the old apartment condition', 'Clear a path from rooms to the door', 'Stage sealed boxes together without blocking the path to large furniture', 'Keep open-first boxes separate from the main pile', 'Bring a separate cleaning kit to the new place before the truck is unloaded', 'Keep the furniture hardware, labeled bags, and matching tools with you', 'Assign one person to meet the crew at the destination and manage building access if timing overlaps']
  },
  {
    title: 'While the truck is loading',
    emoji: '🚛',
    items: ['Do a drawer/cabinet/closet sweep before anything leaves', 'Point fragile and open-first boxes out to movers', 'Keep elevator/super/COI details handy', 'Photograph anything valuable or delicate before it is wrapped']
  },
  {
    title: 'Final sweep before leaving',
    emoji: '🔦',
    items: ['Open every drawer, cabinet, closet, and medicine cabinet', 'Check outlets for chargers and extension cords', 'Take final condition photos/video for deposit protection', 'Return keys, fobs, and garage/elevator passes as required', 'Email/text building management that you are fully out and include your forwarding address']
  },
  {
    title: 'At the new place',
    emoji: '🏁',
    items: ['Post the room color/number key at the entrance so every box lands correctly', 'Direct boxes by room before they become a cardboard mountain', 'Set up and make the bed first — future you deserves a landing pad', 'Find toilet paper, towels, shower curtain, and soap', 'Plug in router/modem if available', 'Unpack enough kitchen gear for coffee, breakfast, and water', 'Eat something real before unpacking turns feral']
  },
  {
    title: 'First night sanity kit',
    emoji: '🛌',
    items: ['Make the bed before you are too tired to function', 'Put meds, chargers, wallet, keys, and documents somewhere obvious', 'Unpack towels, soap, toothbrush, and shower basics', 'Set up one lamp or nightlight', 'Leave tomorrow-you a water bottle and clean clothes']
  }
];

window.MovingApp.MOVERS = [
  {
    name: 'Roadway Moving',
    phone: '(212) 812-5240',
    website: 'https://www.roadwaymoving.com/',
    reviewUrl: 'https://www.google.com/search?q=Roadway+Moving+NYC+reviews',
    quoteUrl: 'https://www.roadwaymoving.com/',
    rating: 'Google 4.9 / 5',
    ratingNote: 'Site cites 7,392 Google reviews; verify live before booking.',
    pricingModel: 'Premium fixed quote',
    estimateBySize: { studio: [850, 1500], '1br': [1200, 2200], '2br': [1800, 3200], '3br': [2600, 4600] },
    includes: 'Labor, transportation, gas, tolls, standard wrapping, COI support, and tracking on many moves.',
    watchFor: 'Usually not the cheapest; best when timing, COI, and careful handling matter more than lowest price.',
    bestFor: 'White-glove local moves, complex buildings, long distance, and higher-touch coordination.',
    desc: 'Reliable full-service standard, dedicated coordinators, binding estimates.'
  },
  {
    name: 'FlatRate Moving',
    phone: '(212) 988-9292',
    website: 'https://www.flatrate.com/',
    reviewUrl: 'https://www.google.com/search?q=FlatRate+Moving+NYC+reviews',
    quoteUrl: 'https://www.flatrate.com/',
    rating: 'Google 4.7 / 5',
    ratingNote: 'Site cites 4.87 average across 11,225 reviews from 5 sources.',
    pricingModel: 'Guaranteed flat rate',
    estimateBySize: { studio: [750, 1350], '1br': [1000, 1900], '2br': [1600, 2900], '3br': [2300, 4200] },
    includes: 'Flat-rate labor, truck, equipment, fuel, tolls, basic disassembly/reassembly, and quoted access details.',
    watchFor: 'Quote accuracy depends on inventory and access details; be painfully specific about stairs, long carries, and packing.',
    bestFor: 'People who hate hourly uncertainty and want a single all-in quote.',
    desc: 'Originator of guaranteed flat-rate pricing, no surprise hourly overage.'
  },
  {
    name: 'Dumbo Moving & Storage',
    phone: '(718) 222-8282',
    website: 'https://dumbomoving.com/',
    reviewUrl: 'https://www.google.com/search?q=Dumbo+Moving+Storage+NYC+reviews',
    quoteUrl: 'https://dumbomoving.com/',
    rating: 'Review check needed',
    ratingNote: 'Site emphasizes Google, Trustpilot, and BBB reviews; verify current score live.',
    pricingModel: 'Locked itemized quote',
    estimateBySize: { studio: [650, 1100], '1br': [850, 1600], '2br': [1300, 2400], '3br': [1900, 3400] },
    includes: 'Labor, truck, fuel, tolls, supplies/protection, COIs, elevator coordination, and parking permits in quoted scope.',
    watchFor: 'Very quote-driven; confirm whether packing supplies, boxes, storage, or last-minute changes affect the price.',
    bestFor: 'Budget-conscious NYC apartment moves, Brooklyn-heavy routes, and locked-price planning.',
    desc: 'Competitive all-inclusive quotes and strong NYC apartment-move familiarity.'
  },
  {
    name: 'Zip to Zip Moving',
    phone: '(929) 990-2060',
    website: 'https://ziptozipmoving.com/',
    reviewUrl: 'https://www.google.com/search?q=Zip+to+Zip+Moving+NYC+reviews',
    quoteUrl: 'https://ziptozipmoving.com/',
    rating: 'Review check needed',
    ratingNote: 'Use live Google/Yelp checks; service footprint can vary by crew and route.',
    pricingModel: 'Quote-based value option',
    estimateBySize: { studio: [650, 1100], '1br': [850, 1500], '2br': [1300, 2300], '3br': [1850, 3300] },
    includes: 'Typically quote-based labor/truck move; confirm COI, materials, stairs, and travel fees in writing.',
    watchFor: 'Get building-access fees, COI timing, and stair/long-carry terms written into the quote.',
    bestFor: 'Value shopping when you can compare details against 2-3 other written quotes.',
    desc: 'Often competitive for local/regional moves; verify current NYC review quality before booking.'
  },
  {
    name: 'Oz Moving & Storage',
    phone: '(212) 452-6683',
    website: 'https://ozmoving.com/',
    reviewUrl: 'https://www.google.com/search?q=Oz+Moving+Storage+NYC+reviews',
    quoteUrl: 'https://ozmoving.com/',
    rating: 'Google 4.7 / 5',
    ratingNote: 'Site cites 4.7 from over 1,300 Google reviews and A+ BBB.',
    pricingModel: 'Guaranteed services quote',
    estimateBySize: { studio: [700, 1300], '1br': [900, 1800], '2br': [1500, 2800], '3br': [2200, 4000] },
    includes: 'Labor/travel, COI, furniture wrapping, floor/corner protection, storage options, and package tiers.',
    watchFor: 'Package level matters; confirm what is included versus requested in advance.',
    bestFor: 'Traditional full-service moves, storage needs, and larger apartment moves.',
    desc: 'Long-running NYC mover with full residential, commercial, interstate, and storage service.'
  },
  {
    name: 'JP Urban Moving',
    phone: '(718) 965-1925',
    website: 'https://www.jpurbanmoving.com/',
    reviewUrl: 'https://www.google.com/search?q=JP+Urban+Moving+NYC+reviews',
    quoteUrl: 'https://www.jpurbanmoving.com/',
    rating: 'A+ BBB / review check',
    ratingNote: 'Site cites A+ BBB and thousands of reviews; verify live Google/Yelp score.',
    pricingModel: 'Hourly or guaranteed quote',
    estimateBySize: { studio: [800, 1450], '1br': [1100, 2100], '2br': [1700, 3200], '3br': [2500, 4500] },
    includes: 'Video walkthrough planning, in-house crews, COI, basic disassembly/reassembly, protection, wardrobe boxes, labor/truck/travel.',
    watchFor: 'Good fit for complex logistics; may price above budget movers for smaller/simple moves.',
    bestFor: 'Brooklyn/Manhattan building logistics, COIs, white-glove local moves, and careful prep.',
    desc: 'Brooklyn-based, experienced with strict NYC building compliance and careful handling.'
  },
  {
    name: 'Metropolis Moving',
    phone: '(718) 710-4520',
    website: 'https://metropolismoving.com/',
    reviewUrl: 'https://www.google.com/search?q=Metropolis+Moving+NYC+reviews',
    quoteUrl: 'https://metropolismoving.com/',
    rating: 'Google 5.0 / 5',
    ratingNote: 'Site cites 5/5 from 590 Google reviews and 4.9/5 on Yelp.',
    pricingModel: 'Fixed-rate quote',
    estimateBySize: { studio: [650, 1150], '1br': [850, 1550], '2br': [1300, 2400], '3br': [1900, 3400] },
    includes: 'Fixed-rate residential moving, packing options, plastic box rental, and local NYC building experience.',
    watchFor: 'Storage/options may be more limited than larger national-style movers; confirm add-ons.',
    bestFor: 'Inter-borough moves, Brooklyn routes, and smaller full-service moves with strong review signals.',
    desc: 'Brooklyn-based, popular with young professionals doing apartment moves; good price-to-service balance.'
  }
];

window.MovingApp.FIRST_WEEK_STAGES = [
  {
    title: 'First 24 hours',
    emoji: '🧭',
    items: [
      'Confirm lights, hot water, heat/AC, stove, fridge, and locks all work',
      'Plug in router/modem and note any internet activation or equipment issue',
      'Put keys, fobs, mailbox info, trash room, laundry, and package pickup details in one note',
      'Photograph move-in condition before unpacking hides wall, floor, or appliance problems'
    ]
  },
  {
    title: 'First week closeout',
    emoji: '✅',
    items: [
      'Send current landlord/building your forwarding address and deposit-return request if not already done',
      'Confirm old utilities and internet are fully canceled and save final confirmation numbers',
      'Return rented modem/router/cable boxes and keep the receipt or tracking number',
      'Update address for banking, payroll, insurance, prescriptions, voter/DMV needs, and core deliveries',
      'Do one quiet sweep for missing open-first items before buying duplicates'
    ]
  }
];

window.MovingApp.MOVE_TIPS = [
  'Order food for move day in advance — you will not want to cook or decide',
  "Pack a separate bag with 2 days of clothes, toiletries, and chargers — treat it like a weekend trip, not part of the move",
  "Don't schedule anything the day after move day — give yourself a buffer",
  'Keep phone chargers, medications, and important documents on your person, not in a box',
  'Label the outside by room + box number; keep the detailed contents in the app so movers are not reading your sock inventory',
  'Put the room color or number on the top and two sides of each box, then post the room key at the new entrance',
  'Photograph each open box with its number visible for a fast visual inventory',
  'Pack books, dishes, and other heavy items in small boxes; reserve large boxes for light items',
  'Reuse your shoeboxes for glassware: wrap each piece with bubble wrap, pack the box snugly so nothing shifts, then place and cushion the shoeboxes inside a sturdy moving box labeled Fragile',
  'Keep hanging clothes on their hangers: slide a clearly marked trash bag up around each bundle from the bottom, then tie it around the hanger necks',
  'Bag and label furniture hardware by item; keep it with the screwdriver or Allen key needed for reassembly',
  'Use towels, linens, and clothing as padding where appropriate, but use proper protection for fragile or valuable pieces',
  'Keep trash visually separate from clothing or soft goods packed in bags so nothing is thrown away by mistake',
  'For apartment moves, compare reusable bin rental with cardboard: bins stack cleanly and avoid box disposal, but pickup deadlines require prompt unpacking',
  'Clean dusty furniture and inspect or vacuum soft furnishings before they enter the moving truck',
  'For your deposit: photograph every room after it is empty, including inside appliances, cabinets, closets, floors, windows, and repaired wall spots',
  'Take a deep breath — everyone hates moving, this feeling is normal and temporary'
];

window.MovingApp.SAVINGS_PLAYS = [
  { title: 'Get 3-5 written mover quotes before booking', detail: 'Written quotes make it easier to compare hourly minimums, travel time, stairs, COI fees, supplies, cancellation terms, and whether the estimate is binding or can grow.' },
  { title: 'Book movers before the date gets scarce', detail: 'Waiting can push you into worse time slots, pricier crews, or companies with weaker reviews. The 6-week timeline phase is where booking belongs.' },
  { title: 'Reduce mover hours before move day', detail: 'Packing boxes fully, labeling rooms, reserving elevators, clearing pathways, and disassembling simple furniture can shave billable time.' },
  { title: 'Protect your security deposit', detail: 'Lease check, allowed hole repair, cleaning, empty-apartment photos, key return proof, and forwarding-address email can prevent avoidable deductions.' },
  { title: 'Use the box plan to avoid duplicate purchases', detail: 'Searchable boxes make it less likely you rebuy chargers, tools, toiletries, kitchen basics, or cleaning supplies you already packed.' },
  { title: 'Donate or sell before the final week', detail: 'Early donation/resale avoids paying movers to transport things you do not want and prevents last-minute trash/removal costs.' },
  { title: 'Borrow or reuse boxes where possible', detail: 'Uniform boxes are helpful, but free boxes from neighbors, work, or recent deliveries can cut supply cost if they are sturdy and clean.' },
  { title: 'Price reusable moving-bin rental', detail: 'Delivered stackable bins can reduce assembly and disposal work on a local NYC move. Compare the rental window, delivery/pickup fees, quantity, and late charges against cardboard.' },
  { title: 'Avoid first-night convenience spending', detail: 'Open-first boxes and food planning prevent expensive emergency runs for toiletries, chargers, bedding, tools, and takeout decisions.' }
];

window.MovingApp.MOVER_TIPPING_GUIDE = {
  simpleRule: '$5–$10 per mover per hour is a common practical range. $20–$40 per mover often works for a small local move; $50–$100+ per mover is common for long, stair-heavy, or unusually smooth jobs.',
  cashNote: 'Cash in separate envelopes is easiest when you want each mover to get their share directly.',
  raiseFor: ['Lots of stairs', 'Heat, rain, or snow', 'Heavy or fragile pieces', 'Long carry distance', 'Great attitude and careful handling'],
  lowerFor: ['Late arrival without communication', 'Careless handling', 'Missing agreed services', 'Rudeness or pressure for a tip']
};

window.MovingApp.TIMELINE_DATA_MATRIX = [
  { id: '8wk', weeksOut: 8, label: '8 Weeks: Set the Plan', items: ['Set a target rent range you would actually feel okay paying [10m]', 'Fill in the Savings estimate: deposit, mover rate, reused boxes, duplicate buys [10m]', 'Request written quotes from 3-5 movers for your move date or target week; send the same photo/video inventory to each [45m]', 'Ask both buildings for moving rules: elevator hours, COI wording, loading dock, fees [20m]', 'Review your lease for move-out rules, notice deadline, cleaning requirements, and deposit return process [20m]', 'Start one donation bag from the room suggestions [30m]', 'Compare delivered reusable-bin rental with sturdy cardboard, including pickup and late fees [20m]'] },
  { id: '6wk', weeksOut: 6, label: '6 Weeks: Book the Big Pieces', items: ['Book the mover once your date/window is realistic; get written confirmation and deposit receipt [30m]', 'Send the booked mover both buildings\' COI instructions and ask them to issue the certificate [15m]', 'Schedule first donation pickup/dropoff so the first bag actually leaves [15m]', 'Reserve freight elevator or loading slot if either building allows early booking [20m]', 'Ask building management what repairs you may do yourself: nail holes, paint touch-ups, wall anchors [10m]'] },
  { id: '4wk', weeksOut: 4, label: '4 Weeks: Lock Logistics', items: ['Confirm elevator reservation slot with current and new buildings [15m]', 'Order supplies: sturdy boxes in consistent sizes, tape gun, markers, room-color labels, packing paper [20m]', 'Buy deposit-repair basics: spackle, putty knife, sanding sponge, magic erasers, matching touch-up paint if allowed [25m]', 'Notify current landlord or building management in writing [10m]', 'Schedule internet setup for the new place [20m]', 'Confirm the mover sent the COI or gave you a copy to forward [10m]', 'Choose a room color/number system and make a destination room key [15m]'] },
  { id: '2wk', weeksOut: 2, label: '2 Weeks: Approvals & Non-Essentials', items: ['Forward the mover COI to building management and ask for written approval [20m]', 'Book bed disassembly help if needed (TaskRabbit/friend/mover add-on) [30m]', 'Do a second donation dropoff/pickup before packing accelerates [45m]', 'Patch small nail holes and wall-anchor holes only if your lease/building allows it [45m]', 'Pack non-essentials: books, decor, off-season clothes, storage [2h]', 'File USPS mail forwarding [15m]', 'Number boxes and photograph the contents before sealing, with the number visible [30m]'] },
  { id: 'movingwk', weeksOut: 1, label: '1 Week: Launch Prep', items: ['Call movers to confirm arrival window, crew size, truck access, elevator time, and COI approval [15m]', 'Pack "open first" essentials: meds, chargers, documents, toiletries, bedding, towels, and 2 days clothes [1h]', 'Defrost freezer and clean fridge [45m]', 'Touch up allowed wall repairs after spackle dries; skip repainting whole walls unless required [45m]', 'Clean appliances, bathroom, cabinets, floors, and windowsills for deposit return [2h]', 'Finish final donation/trash run so it does not ride in the truck [45m]', 'Make a carry-with-you cleaning kit: broom/dustpan, cloths, cleaner, trash bags, paper towels, and gloves [20m]', 'Bag and label furniture hardware; pair it with the tools needed for reassembly [30m]', 'Keep clothes on their hangers; slide clearly marked trash bags up around bundles and tie them at the hanger necks [30m]', 'Ask the mover what to empty, wrap, or disassemble yourself, then finish only the agreed prep [30m]', 'Choose who will meet the truck and coordinate access at the destination [10m]'] },
  { id: 'moveday', weeksOut: 0, label: 'Move Day: Execution', items: ['Final walkthrough: check every drawer, cabinet, closet, and outlet [20m]', 'Take empty-apartment photos/video: walls, floors, appliances, bathroom, cabinets, windows, keys/fobs [20m]', 'Hand off keys to current building management and get written confirmation if possible [10m]', 'Send forwarding address and deposit return request to landlord/building management [10m]', 'Check in with new super/doorman for elevator and access [10m]', 'Direct boxes by room before they become a cardboard mountain [30m]', 'Unpack open-first boxes and bedding [1h]'] }
];

window.MovingApp.APT_PHASES = [
  { id: 'apt-t60', weeksOut: 8, label: 'Start the hunt', items: ['Define budget ceiling, must-haves, and deal-breakers', 'Set up alerts on StreetEasy, Zillow, Renthop, or your local listing sites', 'Start touring — aim for 3–5 viewings per week once listings are fresh'] },
  { id: 'apt-t30', weeksOut: 4, label: 'Apply fast', items: ['Submit applications for top choices', 'Build renter resume: pay stubs, employment letter, bank statements, ID', 'Watch fees carefully — NYC application/credit checks are generally capped at $20'] },
  { id: 'apt-t14', weeksOut: 2, label: 'Lock it down', items: ['Sign lease & pay security deposit + first month', 'Ask the new building whether movers need a COI (Certificate of Insurance)', 'Reserve freight elevator for move day'] }
];

window.MovingApp.APT_HUNT_GUIDES = [
  {
    id: 'renter-resume',
    title: 'Renter packet',
    emoji: '📄',
    items: ['Now: scan your photo ID and save it as "ID - [Your Name].pdf" so you can attach it in one tap', 'Now: download your two most recent pay stubs; if paid irregularly, also save last year tax docs or offer letter', 'This week: ask HR for an employment letter with title, salary, start date, and contact info', 'This week: download two to three recent bank statements and black out only full account numbers, not balances/name', 'Before tours: save a credit score screenshot or credit report PDF so you can move fast without guessing', 'Before applying: collect previous landlord reference info or proof of on-time rent payments', 'If income is close to the 40x rule: prep guarantor ID, pay stubs, tax return, and bank statements before you tour', 'If you have a pet: make a one-page pet resume with weight, breed, vaccines, references, and a good photo']
  },
  {
    id: 'cashiers-check',
    title: 'Cashier check prep',
    emoji: '🏦',
    items: ['Before serious tours: ask each agent what move-in payment types they accept: cashier check, certified check, money order, ACH, or portal', '3-5 business days before you may apply: transfer move-in funds from the credit union to a bank with a nearby branch', 'Before ordering checks: ask for the exact payable-to name and amount; do not guess the payee', 'Before applying: estimate first month + security deposit + any legal broker fee so the right cash is liquid', 'Same day you are approved: go to the branch for checks only after the lease/payment instructions are confirmed in writing', 'At handoff: get receipts for cashier check, certified check, money order, or cash payments and save photos in your apartment folder']
  },
  {
    id: 'best-candidate',
    title: 'Best-candidate polish',
    emoji: '✅',
    items: ['Now: keep one folder named "Rental Packet" with PDFs named clearly so agents trust the file set', 'Before messaging: write a short renter bio with move date, occupants, pets, income fit, and viewing availability', 'Before tours: know your 40x rent ceiling and your guarantor plan so you can answer instantly', 'Before applying: prepare employer, income, current landlord, references, desired lease start, and occupant details', 'Same day after viewing: if you want the apartment, send a concise follow-up and ask for the application/payment steps']
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
  },
  {
    id: 'outreach-timing',
    title: 'Outreach timing',
    emoji: '⏱️',
    items: ['Check new listings in the morning, at lunch, and late afternoon on active search days', 'Message immediately when a serious fit appears; good rentals often reward speed', 'Call during business hours if the listing includes a phone number', 'If no response, follow up once the same day and once the next morning']
  }
];

window.MovingApp.APT_OUTREACH_GUIDE = {
  bestTimes: [
    'Best daily rhythm: scan listings before work, again around lunch, and once around 4-6pm.',
    'Best response window: contact the agent within the first hour after you notice a strong listing.',
    'Best call window: late morning or early afternoon on weekdays, when agents are more likely to be between showings.',
    'Weekend tip: if a listing goes live before an open house, message immediately and ask for the earliest showing slot.'
  ],
  followUp: [
    'No reply after 2-4 hours: send one short follow-up with your availability.',
    'No reply by next morning: call once, then move on unless the apartment is unusually perfect.',
    'If they ask for documents, reply quickly with your renter packet ready.',
    'If the unit is gone, ask whether they have anything similar coming up.'
  ],
  emailTemplate: `Subject: Interested in [Apartment Address] - available to view [today/tomorrow]\n\nHi [Agent Name],\n\nI saw the listing for [Apartment Address] and I am very interested. My target move date is [Move Date], my budget is [Budget Range], and I can view it [2-3 specific time windows].\n\nA few quick details: [number of occupants], [pets/no pets], ready with application documents, and able to move quickly if it is a fit.\n\nIs the apartment still available, and what is the earliest showing time?\n\nThanks,\n[Your Name]\n[Phone Number]`,
  phoneScript: `Hi, I am calling about [Apartment Address]. Is it still available?\n\nIf yes: Great. What is the earliest showing slot? I am ready with documents and can move quickly if it is a fit.\n\nIf unavailable: Thanks for letting me know. Do you have anything similar in [neighborhoods], around [budget], for [move date]?`
};

window.MovingApp.DEFAULT_NEIGHBORHOODS = ['East Village', 'Union Square'];

window.MovingApp.defaultApartmentProfile = function() {
  return {
    currentSpace: {
      bedroomWidthIn: 90,
      bedroomLengthIn: 120,
      livingKitchenWidthIn: 225,
      livingKitchenLengthIn: 144,
      livingOnlyWidthIn: 112,
      livingOnlyLengthIn: 144
    },
    mustHaves: {
      fullKitchen: true,
      dishwasher: true,
      queenBed: true,
      smallDesk: true,
      smallDiningTable: true,
      coffeeTable: true,
      lShapeCouch: true,
      tv: true,
      coatShoeLanding: true
    },
    preferences: {
      laundryInBuilding: true,
      preferNoInUnitLaundry: true,
      maxLeaseMonths: 12,
      comfortableBudgetMax: 4250,
      stretchBudgetMax: 4500
    },
    preferenceNotes: 'Prioritize East Village / Union Square access. $4,250 is the comfortable target. Going as high as $4,500 is exceptional-only: the apartment must truly blow me away through some combination of location, beauty, light, space, layout, and amenities—not merely qualify on paper. A beautiful apartment in an exceptional location can justify being a little smaller, but it should offer similar or greater usable space than the current studio. Natural light matters. Laundry in the building is strongly preferred; in-unit laundry is not desirable. A required lease longer than 12 months is a dealbreaker.',
    learnedSignals: 'Strong positive: beautiful prewar character, park proximity, doorman/elevator, excellent storage, and a separate renovated kitchen. Tradeoffs tolerated: slightly small when the location and character are exceptional. Negative: limited natural light is noticeable and matters. Judge space by the usable main-room dimensions and complete furniture layout—not advertised total square footage that includes the foyer, kitchen, bath, or balcony. A studio that cannot hold the queen bed, full couch/TV/coffee-table zone, and desk is too small even at 400 advertised sq ft. Reject otherwise appealing listings when they require a two-year lease.'
  };
};

window.MovingApp.UNIVERSITY_PLACE_REFERENCE = {
  name: '1 University Place #7G',
  price: '4095',
  minRent: '',
  maxRent: '4250',
  status: 'Rejected',
  links: ['https://streeteasy.com/building/1-university-place-new_york/7g'],
  favorite: true,
  image: 'https://photos.zillowstatic.com/fp/c5332670b524cbded59bc42c29d3aca6-se_extra_large_1500_800.webp',
  imageStatus: 'auto',
  realtorName: 'Leonard Bromberg · Balen Real Estate, LLC',
  lastContactDate: '',
  viewedDate: '',
  followUpDate: '',
  applicationDueDate: '',
  cashierCheckNeeded: false,
  cashierCheckBy: '',
  notes: 'REJECTED — mandatory two-year lease is a dealbreaker. Keep as a taste reference. $4,095 base rent; studio; available 7/21/2026. Confirmed: separate windowed full kitchen, refrigerator, dishwasher, 3 closets (2 walk-in), doorman, elevator, and 9-foot ceilings. Floor plan: main studio 14′2″ × 18′9″ (~266 sq ft) plus kitchen 5′6″ × 8′10″ (~49 sq ft), roughly 315 measured sq ft before bath/closets/hall. Fit: queen bed, TV, coffee table, and couch should work; an L-shaped couch plus desk and dining table needs an exact furniture-layout check. Loved: beautiful prewar character and immediate Washington Square Park location. Drawbacks: felt a little small and the main window received limited natural light. Listing photos appear staged, so do not use their furniture scale as proof of fit.'
};

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
    moveProfile: {
      apartmentHunt: true,
      moveStyle: 'movers',
      buildingType: 'apartment',
      borough: 'manhattan'
    },
    neighborhoods: [...window.MovingApp.DEFAULT_NEIGHBORHOODS],
    targetBudgetMin: '',
    targetBudgetMax: '4500',
    apartmentProfile: window.MovingApp.defaultApartmentProfile(),
    checked: {},
    donations: window.MovingApp.DONATION_CATEGORIES.reduce((acc, c) => ({ ...acc, [c]: [] }), {}),
    movers: window.MovingApp.MOVERS.reduce((acc, m) => ({ ...acc, [m.name]: false }), {}),
    customMovers: [],
    apartments: [],
    aptFilter: 'all',
    boxes: [],
    boxSearch: '',
    boxStatusFilter: 'all',
    editingBoxId: '',
    recentlyRemovedBox: null,
    dismissedFocusItems: {},
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
    savings: {
      depositAmount: '', depositReturnDueDate: '', depositReturned: false,
      plannedMoveCost: '', actualMoveCost: '', moverHourlyRate: '',
      avoidedMoverHours: '1', reusedBoxes: '', avoidedDuplicateBuys: ''
    },
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
    status: window.MovingApp.APT_STATUSES.includes(a.status) ? a.status : (a.status === 'Emailed/Called' ? 'Inquired' : (a.status === 'Visited' ? 'Viewed' : 'Saved')),
    favorite: typeof a.favorite === 'boolean' ? a.favorite : false,
    image: a.image || null,
    imageStatus: a.imageStatus || 'none', // 'none' | 'auto' | 'manual'
    realtorName: a.realtorName || '',
    lastContactDate: a.lastContactDate || '',
    viewedDate: a.viewedDate || '',
    followUpDate: a.followUpDate || '',
    applicationDueDate: a.applicationDueDate || '',
    cashierCheckNeeded: !!a.cashierCheckNeeded,
    cashierCheckBy: a.cashierCheckBy || '',
    notes: a.notes || ''
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
  const profile = input.moveProfile && typeof input.moveProfile === 'object' && !Array.isArray(input.moveProfile) ? input.moveProfile : {};
  merged.moveProfile = {
    apartmentHunt: typeof profile.apartmentHunt === 'boolean' ? profile.apartmentHunt : true,
    moveStyle: ['movers', 'diy'].includes(profile.moveStyle) ? profile.moveStyle : 'movers',
    buildingType: ['apartment', 'house'].includes(profile.buildingType) ? profile.buildingType : 'apartment',
    borough: ['manhattan', 'brooklyn', 'queens', 'bronx', 'staten-island'].includes(profile.borough) ? profile.borough : 'manhattan'
  };
  delete merged.city;
  merged.neighborhoods = Array.isArray(input.neighborhoods)
    ? input.neighborhoods.map(String).map(x => x.trim()).filter(Boolean).slice(0, 12)
    : [...window.MovingApp.DEFAULT_NEIGHBORHOODS];
  if (!input.apartmentProfile) {
    ['East Village', 'Union Square'].forEach(neighborhood => {
      if (!merged.neighborhoods.some(item => item.toLowerCase() === neighborhood.toLowerCase())) merged.neighborhoods.push(neighborhood);
    });
  }
  merged.targetBudgetMin = input.targetBudgetMin || '';
  merged.targetBudgetMax = input.targetBudgetMax || base.targetBudgetMax;
  const defaultApartmentProfile = window.MovingApp.defaultApartmentProfile();
  const apartmentProfile = input.apartmentProfile && typeof input.apartmentProfile === 'object' && !Array.isArray(input.apartmentProfile) ? input.apartmentProfile : {};
  const currentSpace = apartmentProfile.currentSpace && typeof apartmentProfile.currentSpace === 'object' ? apartmentProfile.currentSpace : {};
  const mustHaves = apartmentProfile.mustHaves && typeof apartmentProfile.mustHaves === 'object' ? apartmentProfile.mustHaves : {};
  const preferences = apartmentProfile.preferences && typeof apartmentProfile.preferences === 'object' ? apartmentProfile.preferences : {};
  merged.apartmentProfile = {
    currentSpace: Object.keys(defaultApartmentProfile.currentSpace).reduce((acc, key) => {
      const value = parseFloat(currentSpace[key]);
      acc[key] = Number.isFinite(value) && value > 0 ? value : defaultApartmentProfile.currentSpace[key];
      return acc;
    }, {}),
    mustHaves: Object.keys(defaultApartmentProfile.mustHaves).reduce((acc, key) => {
      acc[key] = typeof mustHaves[key] === 'boolean' ? mustHaves[key] : defaultApartmentProfile.mustHaves[key];
      return acc;
    }, {}),
    preferences: {
      laundryInBuilding: typeof preferences.laundryInBuilding === 'boolean' ? preferences.laundryInBuilding : defaultApartmentProfile.preferences.laundryInBuilding,
      preferNoInUnitLaundry: typeof preferences.preferNoInUnitLaundry === 'boolean' ? preferences.preferNoInUnitLaundry : defaultApartmentProfile.preferences.preferNoInUnitLaundry,
      maxLeaseMonths: Number.isFinite(parseInt(preferences.maxLeaseMonths, 10)) && parseInt(preferences.maxLeaseMonths, 10) > 0 ? parseInt(preferences.maxLeaseMonths, 10) : defaultApartmentProfile.preferences.maxLeaseMonths,
      comfortableBudgetMax: Number.isFinite(parseInt(preferences.comfortableBudgetMax, 10)) ? parseInt(preferences.comfortableBudgetMax, 10) : defaultApartmentProfile.preferences.comfortableBudgetMax,
      stretchBudgetMax: Number.isFinite(parseInt(preferences.stretchBudgetMax, 10)) ? parseInt(preferences.stretchBudgetMax, 10) : defaultApartmentProfile.preferences.stretchBudgetMax
    },
    preferenceNotes: typeof apartmentProfile.preferenceNotes === 'string' ? apartmentProfile.preferenceNotes : defaultApartmentProfile.preferenceNotes,
    learnedSignals: typeof apartmentProfile.learnedSignals === 'string' ? apartmentProfile.learnedSignals : defaultApartmentProfile.learnedSignals
  };
  delete merged.annualIncome;
  merged.checked = (input.checked && typeof input.checked === 'object' && !Array.isArray(input.checked)) ? input.checked : {};
  merged.donations = window.MovingApp.DONATION_CATEGORIES.reduce((acc, cat) => {
    const items = input.donations && Array.isArray(input.donations[cat]) ? input.donations[cat] : [];
    acc[cat] = items.map(String);
    return acc;
  }, {});
  merged.apartments = window.MovingApp.migrateApartments(input.apartments);
  if ((parseInt(input.schemaVersion, 10) || 0) < 15) {
    const referenceUrl = window.MovingApp.UNIVERSITY_PLACE_REFERENCE.links[0];
    const alreadySaved = merged.apartments.some(apartment => (apartment.links || []).some(link => String(link).split('?')[0] === referenceUrl));
    if (!alreadySaved) merged.apartments.push({ ...window.MovingApp.UNIVERSITY_PLACE_REFERENCE });
  }
  if ((parseInt(input.schemaVersion, 10) || 0) < 16) {
    const referenceUrl = window.MovingApp.UNIVERSITY_PLACE_REFERENCE.links[0];
    const reference = merged.apartments.find(apartment => (apartment.links || []).some(link => String(link).split('?')[0] === referenceUrl));
    if (reference) {
      reference.status = 'Rejected';
      reference.notes = window.MovingApp.UNIVERSITY_PLACE_REFERENCE.notes;
    }
  }
  if ((parseInt(input.schemaVersion, 10) || 0) < 17 && (!input.targetBudgetMax || String(input.targetBudgetMax) === '4250')) {
    merged.targetBudgetMax = '4500';
  }
  if ((parseInt(input.schemaVersion, 10) || 0) < 18) {
    const oldBudgetPhrase = '$4,250 is the comfortable target, but up to $4,500 is acceptable when the apartment earns the premium.';
    const exceptionalBudgetPhrase = '$4,250 is the comfortable target. Going as high as $4,500 is exceptional-only: the apartment must truly blow me away through some combination of location, beauty, light, space, layout, and amenities—not merely qualify on paper.';
    if (!merged.apartmentProfile.preferenceNotes.includes(exceptionalBudgetPhrase)) {
      merged.apartmentProfile.preferenceNotes = merged.apartmentProfile.preferenceNotes.includes(oldBudgetPhrase)
        ? merged.apartmentProfile.preferenceNotes.replace(oldBudgetPhrase, exceptionalBudgetPhrase)
        : `${exceptionalBudgetPhrase} ${merged.apartmentProfile.preferenceNotes}`.trim();
    }
  }
  merged.aptFilter = ['all', 'favorites', 'followup'].includes(input.aptFilter) ? input.aptFilter : 'all';
  merged.customMovers = Array.isArray(input.customMovers) ? input.customMovers.map(m => {
    const quote = parseFloat(m.quoteAmount);
    return {
      name: String(m.name || ''),
      phone: String(m.phone || ''),
      quoteAmount: Number.isFinite(quote) && quote > 0 ? String(quote) : '',
      notes: String(m.notes || '')
    };
  }).filter(m => m.name) : [];
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
    status: ['packed', 'loaded', 'arrived', 'unpacked'].includes(box.status) ? box.status : 'packed',
    source: typeof box.source === 'string' ? box.source : '',
    sourceKey: typeof box.sourceKey === 'string' ? box.sourceKey : ''
  })) : [];
  merged.boxSearch = typeof input.boxSearch === 'string' ? input.boxSearch : '';
  merged.boxStatusFilter = ['all', 'open-first', 'fragile', 'packed', 'loaded', 'arrived', 'unpacked'].includes(input.boxStatusFilter) ? input.boxStatusFilter : 'all';
  merged.editingBoxId = typeof input.editingBoxId === 'string' ? input.editingBoxId : '';
  merged.recentlyRemovedBox = input.recentlyRemovedBox && typeof input.recentlyRemovedBox === 'object' ? {
    id: input.recentlyRemovedBox.id || ('box-removed-' + Date.now()),
    label: input.recentlyRemovedBox.label || 'Removed box',
    room: input.recentlyRemovedBox.room || 'Unassigned',
    contents: Array.isArray(input.recentlyRemovedBox.contents) ? input.recentlyRemovedBox.contents.map(String) : String(input.recentlyRemovedBox.contents || '').split(',').map(x => x.trim()).filter(Boolean),
    fragile: !!input.recentlyRemovedBox.fragile,
    openFirst: !!input.recentlyRemovedBox.openFirst,
    status: ['packed', 'loaded', 'arrived', 'unpacked'].includes(input.recentlyRemovedBox.status) ? input.recentlyRemovedBox.status : 'packed',
    source: typeof input.recentlyRemovedBox.source === 'string' ? input.recentlyRemovedBox.source : '',
    sourceKey: typeof input.recentlyRemovedBox.sourceKey === 'string' ? input.recentlyRemovedBox.sourceKey : ''
  } : null;
  const dismissedFocusItems = input.dismissedFocusItems && typeof input.dismissedFocusItems === 'object' && !Array.isArray(input.dismissedFocusItems)
    ? input.dismissedFocusItems
    : {};
  merged.dismissedFocusItems = Object.entries(dismissedFocusItems).reduce((acc, [id, dismissal]) => {
    if (!id || !dismissal || typeof dismissal !== 'object') return acc;
    const mode = dismissal.mode;
    if (!['snoozed', 'not-relevant'].includes(mode)) return acc;
    acc[id] = {
      mode,
      until: mode === 'snoozed' && typeof dismissal.until === 'string' ? dismissal.until : null
    };
    return acc;
  }, {});
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
  const savings = input.savings && typeof input.savings === 'object' ? input.savings : {};
  merged.savings = {
    depositAmount: savings.depositAmount || '',
    depositReturnDueDate: savings.depositReturnDueDate || '',
    depositReturned: !!savings.depositReturned,
    plannedMoveCost: savings.plannedMoveCost || '',
    actualMoveCost: savings.actualMoveCost || '',
    moverHourlyRate: savings.moverHourlyRate || '',
    avoidedMoverHours: savings.avoidedMoverHours || '1',
    reusedBoxes: savings.reusedBoxes || '',
    avoidedDuplicateBuys: savings.avoidedDuplicateBuys || ''
  };
  merged.backupExportedAt = typeof input.backupExportedAt === 'string' ? input.backupExportedAt : '';
  merged.celebrationLog = (input.celebrationLog && typeof input.celebrationLog === 'object' && !Array.isArray(input.celebrationLog)) ? input.celebrationLog : {};
  merged.notes = typeof input.notes === 'string' ? input.notes : '';
  merged.activeTab = input.activeTab === 'donations' ? 'rooms' : (window.MovingApp.TAB_IDS.includes(input.activeTab) ? input.activeTab : 'dashboard');
  merged.showWizardOverride = !!input.showWizardOverride;
  return merged;
};

window.MovingApp.isLikelyBackupPayload = function(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  const knownKeys = [
    'schemaVersion',
    'userName',
    'targetMoveDate',
    'aptSize',
    'checked',
    'apartments',
    'boxes',
    'rooms',
    'utilities',
    'contacts',
    'notes'
  ];
  return knownKeys.some(key => Object.prototype.hasOwnProperty.call(input, key));
};

window.MovingApp.getBackupSummary = function(input) {
  if (!window.MovingApp.isLikelyBackupPayload(input)) return null;
  const sanitized = window.MovingApp.sanitizeState(input);
  const checkedCount = Object.values(sanitized.checked || {}).filter(Boolean).length;
  const packedRooms = Object.values(sanitized.rooms || {}).filter(value => value === 'Packed').length;
  return {
    userName: sanitized.userName || 'Unnamed move',
    targetMoveDate: sanitized.targetMoveDate || 'No move date',
    aptSize: sanitized.aptSize,
    apartments: sanitized.apartments.length,
    boxes: sanitized.boxes.length,
    checkedItems: checkedCount,
    packedRooms,
    utilitiesDone: Object.values(sanitized.utilities || {}).filter(rec => rec.status === 'done').length,
    schemaVersion: sanitized.schemaVersion
  };
};

window.MovingApp.storageKeys = function() {
  return [
    window.MovingApp.STORAGE_KEY,
    window.MovingApp.STORAGE_BACKUP_KEY,
    ...(window.MovingApp.LEGACY_STORAGE_KEYS || [])
  ];
};

window.MovingApp.loadState = function() {
  try {
    const keys = window.MovingApp.storageKeys();
    for (const key of keys) {
      const saved = localStorage.getItem(key);
      if (!saved) continue;
      const migrated = window.MovingApp.sanitizeState(JSON.parse(saved));
      migrated.recentlyRemovedBox = null;
      if (key !== window.MovingApp.STORAGE_KEY) window.MovingApp.saveState(migrated);
      return migrated;
    }
  } catch (e) { console.error(e); }
  return window.MovingApp.defaultState();
};

window.MovingApp.saveState = function(stateData) {
  try {
    const sanitized = window.MovingApp.sanitizeState(stateData);
    const serialized = JSON.stringify(sanitized);
    localStorage.setItem(window.MovingApp.STORAGE_KEY, serialized);
    localStorage.setItem(window.MovingApp.STORAGE_BACKUP_KEY, serialized);
  } catch (e) { console.error(e); }
};

window.MovingApp.clearStoredState = function() {
  try {
    window.MovingApp.storageKeys().forEach(key => localStorage.removeItem(key));
  } catch (e) { console.error(e); }
};
