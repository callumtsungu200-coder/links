import type { PuzzleDefinition } from './types';

/**
 * The original puzzle collection. Every board is generated fresh from these
 * definitions, so the same theme plays differently each time it comes up.
 */
export const PUZZLES: PuzzleDefinition[] = [
  {
    id: 'road-trip',
    theme: 'Hit the road',
    spangram: 'ROADTRIP',
    pool: ['SNACKS', 'PLAYLIST', 'MOTEL', 'DETOUR', 'HIGHWAY', 'GASOLINE', 'BILLBOARD', 'CAMPER', 'ODOMETER', 'SUNROOF', 'LUGGAGE', 'ATLAS'],
  },
  {
    id: 'desserts',
    theme: 'Sweet tooth',
    spangram: 'DESSERTS',
    pool: ['BROWNIE', 'CUPCAKE', 'PUDDING', 'SUNDAE', 'TIRAMISU', 'MACARON', 'PARFAIT', 'CRUMBLE', 'ECLAIR', 'SORBET', 'TRIFLE', 'FUDGE'],
  },
  {
    id: 'astronomy',
    theme: 'Starry-eyed',
    spangram: 'ASTRONOMY',
    pool: ['COMET', 'NEBULA', 'GALAXY', 'ORBIT', 'PLANET', 'QUASAR', 'ECLIPSE', 'METEOR', 'PULSAR', 'SUPERNOVA', 'TELESCOPE', 'COSMOS'],
  },
  {
    id: 'orchestra',
    theme: 'In the pit',
    spangram: 'ORCHESTRA',
    pool: ['VIOLIN', 'CELLO', 'OBOE', 'FLUTE', 'TUBA', 'HARP', 'BASSOON', 'CLARINET', 'TRUMPET', 'TIMPANI', 'PICCOLO', 'TROMBONE', 'VIOLA'],
  },
  {
    id: 'coral-reef',
    theme: 'Under the sea',
    spangram: 'CORALREEF',
    pool: ['OCTOPUS', 'SEAHORSE', 'CLOWNFISH', 'STARFISH', 'URCHIN', 'SHARK', 'DOLPHIN', 'TURTLE', 'SQUID', 'ANEMONE', 'LOBSTER', 'SPONGE'],
  },
  {
    id: 'gardening',
    theme: 'Green thumb',
    spangram: 'GARDENING',
    pool: ['TROWEL', 'COMPOST', 'SEEDS', 'HOSE', 'RAKE', 'SHOVEL', 'MULCH', 'PRUNER', 'TULIP', 'DAISY', 'BULBS', 'WEEDS', 'SPROUT'],
  },
  {
    id: 'breakfast',
    theme: 'Rise and shine',
    spangram: 'BREAKFAST',
    pool: ['PANCAKE', 'WAFFLE', 'OMELET', 'BACON', 'TOAST', 'CEREAL', 'GRANOLA', 'MUFFIN', 'BAGEL', 'YOGURT', 'CROISSANT', 'OATMEAL', 'COFFEE'],
  },
  {
    id: 'weather',
    theme: 'What it’s like out there',
    spangram: 'FORECAST',
    pool: ['THUNDER', 'DRIZZLE', 'BLIZZARD', 'MONSOON', 'TORNADO', 'HAIL', 'SLEET', 'BREEZE', 'CYCLONE', 'RAINBOW', 'HUMIDITY', 'FROST', 'LIGHTNING'],
  },
  {
    id: 'game-night',
    theme: 'Bring your A-game',
    spangram: 'GAMENIGHT',
    pool: ['CHESS', 'CHECKERS', 'DOMINOES', 'BACKGAMMON', 'MAHJONG', 'CRIBBAGE', 'CHARADES', 'BINGO', 'POKER', 'SOLITAIRE', 'RUMMY', 'BRIDGE'],
  },
  {
    id: 'library',
    theme: 'A bookworm’s haunt',
    spangram: 'LIBRARY',
    pool: ['NOVEL', 'CHAPTER', 'SHELF', 'AUTHOR', 'POETRY', 'MYSTERY', 'ATLAS', 'JOURNAL', 'BOOKMARK', 'FICTION', 'ARCHIVE', 'CATALOG', 'READER'],
  },
  {
    id: 'utensils',
    theme: 'The kitchen drawer',
    spangram: 'UTENSILS',
    pool: ['WHISK', 'LADLE', 'SPATULA', 'TONGS', 'PEELER', 'GRATER', 'SKEWER', 'STRAINER', 'ROLLINGPIN', 'SCISSORS', 'CORKSCREW', 'TIMER'],
  },
  {
    id: 'spices',
    theme: 'Add a little flavour',
    spangram: 'SEASONING',
    pool: ['PAPRIKA', 'CUMIN', 'OREGANO', 'NUTMEG', 'CINNAMON', 'TURMERIC', 'SAFFRON', 'CLOVES', 'THYME', 'BASIL', 'PEPPER', 'GINGER', 'FENNEL'],
  },
  {
    id: 'swimming',
    theme: 'Make a splash',
    spangram: 'SWIMMING',
    pool: ['BACKSTROKE', 'BUTTERFLY', 'FREESTYLE', 'GOGGLES', 'LANES', 'FLIPPERS', 'SNORKEL', 'TOWEL', 'POOLSIDE', 'LIFEGUARD', 'KICKBOARD', 'WETSUIT'],
  },
  {
    id: 'campfire',
    theme: 'Sleeping under the stars',
    spangram: 'CAMPFIRE',
    pool: ['TENT', 'LANTERN', 'COMPASS', 'HIKING', 'CANOE', 'FLASHLIGHT', 'KINDLING', 'BACKPACK', 'TRAIL', 'CABIN', 'SMORES', 'HAMMOCK'],
  },
  {
    id: 'seating',
    theme: 'Take a load off',
    spangram: 'SEATING',
    pool: ['STOOL', 'BENCH', 'SOFA', 'OTTOMAN', 'RECLINER', 'COUCH', 'THRONE', 'SADDLE', 'SWING', 'BEANBAG', 'ARMCHAIR', 'LOVESEAT'],
  },
  {
    id: 'art-studio',
    theme: 'Paint the town',
    spangram: 'ARTSTUDIO',
    pool: ['EASEL', 'CANVAS', 'PALETTE', 'BRUSH', 'CHARCOAL', 'SKETCH', 'PASTEL', 'GOUACHE', 'ACRYLIC', 'PIGMENT', 'PORTRAIT', 'MURAL', 'VARNISH'],
  },
  {
    id: 'volcano',
    theme: 'Blowing its top',
    spangram: 'ERUPTION',
    pool: ['MAGMA', 'LAVA', 'CRATER', 'VENT', 'CALDERA', 'PUMICE', 'BASALT', 'GEYSER', 'OBSIDIAN', 'TREMOR', 'SUMMIT', 'PLUME', 'CINDER'],
  },
  {
    id: 'fruit-bowl',
    theme: 'Picked fresh',
    spangram: 'FRUITBOWL',
    pool: ['MANGO', 'PAPAYA', 'CHERRY', 'APRICOT', 'KIWI', 'BANANA', 'LYCHEE', 'PEACH', 'PLUM', 'GUAVA', 'TANGERINE', 'PINEAPPLE', 'MELON', 'LEMON'],
  },
  {
    id: 'airport',
    theme: 'Wheels up',
    spangram: 'AIRPORT',
    pool: ['RUNWAY', 'HANGAR', 'TERMINAL', 'PASSPORT', 'BOARDING', 'LUGGAGE', 'PILOT', 'GATE', 'CUSTOMS', 'LAYOVER', 'TICKET', 'CONCOURSE', 'TAXIWAY'],
  },
  {
    id: 'circus',
    theme: 'Under the big top',
    spangram: 'CIRCUS',
    pool: ['ACROBAT', 'JUGGLER', 'CLOWN', 'TRAPEZE', 'RINGMASTER', 'STILTS', 'UNICYCLE', 'TIGHTROPE', 'MAGICIAN', 'TENT', 'POPCORN', 'CANNON'],
  },
  {
    id: 'sailing',
    theme: 'Knot a problem',
    spangram: 'SAILBOAT',
    pool: ['MAST', 'HULL', 'RUDDER', 'ANCHOR', 'KEEL', 'TILLER', 'BOOM', 'SPINNAKER', 'COMPASS', 'CABIN', 'DECK', 'STERN', 'GALLEY', 'HATCH'],
  },
  {
    id: 'blues',
    theme: 'Feeling blue',
    spangram: 'SHADESOFBLUE',
    pool: ['NAVY', 'COBALT', 'AZURE', 'TEAL', 'INDIGO', 'CYAN', 'SAPPHIRE', 'CERULEAN', 'ROYAL', 'DENIM', 'TURQUOISE', 'PERIWINKLE', 'CORNFLOWER'],
  },
  {
    id: 'nocturnal',
    theme: 'Night shift',
    spangram: 'NOCTURNAL',
    pool: ['BADGER', 'FIREFLY', 'RACCOON', 'OPOSSUM', 'HEDGEHOG', 'MOTH', 'COYOTE', 'NIGHTJAR', 'ARMADILLO', 'KIWI', 'AARDVARK', 'TARSIER', 'OWLET'],
  },
  {
    id: 'bakery',
    theme: 'Fresh from the oven',
    spangram: 'BAKERY',
    pool: ['SOURDOUGH', 'BAGUETTE', 'CROISSANT', 'SCONE', 'BRIOCHE', 'MUFFIN', 'PRETZEL', 'DANISH', 'STRUDEL', 'FOCACCIA', 'CIABATTA', 'DOUGHNUT', 'PASTRY'],
  },
  {
    id: 'workshop',
    theme: 'Tool time',
    spangram: 'WORKSHOP',
    pool: ['HAMMER', 'WRENCH', 'CHISEL', 'PLIERS', 'SANDER', 'DRILL', 'LEVEL', 'CLAMP', 'MALLET', 'VISE', 'RATCHET', 'CROWBAR', 'SCREWDRIVER'],
  },
  {
    id: 'gemstones',
    theme: 'Hidden treasure',
    spangram: 'GEMSTONES',
    pool: ['RUBY', 'EMERALD', 'OPAL', 'TOPAZ', 'GARNET', 'JADE', 'AMETHYST', 'ONYX', 'PEARL', 'QUARTZ', 'DIAMOND', 'ZIRCON', 'PERIDOT', 'TOURMALINE'],
  },
  {
    id: 'mountains',
    theme: 'Reach new heights',
    spangram: 'MOUNTAINS',
    pool: ['SUMMIT', 'GLACIER', 'RIDGE', 'VALLEY', 'CLIFF', 'PEAK', 'AVALANCHE', 'CANYON', 'SLOPE', 'CREST', 'BOULDER', 'PLATEAU', 'FOOTHILL'],
  },
  {
    id: 'dance',
    theme: 'Strictly speaking',
    spangram: 'DANCEFLOOR',
    pool: ['TANGO', 'WALTZ', 'SALSA', 'FOXTROT', 'RUMBA', 'BALLET', 'SAMBA', 'CHACHA', 'POLKA', 'MAMBO', 'QUICKSTEP', 'BOLERO', 'TAPDANCE'],
  },
];
