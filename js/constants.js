// Puyo Puyo - Constants
window.PP = window.PP || {};

PP.Constants = {
    // Board dimensions
    COLS: 6,
    VISIBLE_ROWS: 12,
    HIDDEN_ROWS: 2,
    TOTAL_ROWS: 14,

    // Cell types
    CELL_EMPTY: 0,

    // Colors (positive integers)
    COLOR_RED: 1,
    COLOR_BLUE: 2,
    COLOR_PURPLE: 3,
    COLOR_YELLOW: 4,
    NUM_COLORS: 4,

    // Color CSS values
    COLOR_MAP: {
        1: '#FF4444', // Red
        2: '#4488FF', // Blue
        3: '#AA44FF', // Purple
        4: '#FFCC00', // Yellow
    },

    COLOR_DARK_MAP: {
        1: '#CC2222',
        2: '#2266CC',
        3: '#7722CC',
        4: '#CC9900',
    },

    COLOR_NAMES: {
        1: 'Red',
        2: 'Blue',
        3: 'Purple',
        4: 'Yellow',
    },

    // Rendering
    CELL_SIZE: 40,
    BOARD_X: 20,
    BOARD_Y: 20,
    CANVAS_WIDTH: 420,
    CANVAS_HEIGHT: 540,

    // Piece spawn position (0-indexed, in hidden area)
    SPAWN_ROW: 1,   // hidden row index 1
    SPAWN_COL: 2,   // 3rd column (0-indexed)

    // Kill position - game over if this cell is occupied when spawning
    KILL_ROW: 1,
    KILL_COL: 2,

    // Rotation offsets: child position relative to axis [dr, dc]
    // State 0: child ABOVE axis
    // State 1: child RIGHT of axis
    // State 2: child BELOW axis
    // State 3: child LEFT of axis
    ROTATION_OFFSETS: [
        { dr: -1, dc: 0 },
        { dr: 0, dc: 1 },
        { dr: 1, dc: 0 },
        { dr: 0, dc: -1 },
    ],

    // Timing (in frames at 60fps)
    INITIAL_DROP_INTERVAL: 60,  // 1 second
    MIN_DROP_INTERVAL: 5,
    LOCK_DELAY: 30,             // 0.5 seconds
    POP_DURATION: 20,           // ~0.33 seconds
    DROP_ANIM_SPEED: 4,         // rows per frame during gravity animation

    // DAS (Delayed Auto Shift)
    DAS_DELAY: 10,              // frames before auto-repeat starts
    DAS_REPEAT: 2,              // frames between auto-repeats

    // Soft drop
    SOFT_DROP_INTERVAL: 2,      // frames per row when holding down

    // Level
    LEVEL_SCORE_INTERVAL: 5000, // score per level-up
    DROP_SPEED_DECREASE: 3,     // frames faster per level

    // Scoring - Chain Power Table (Puyo Puyo Tsu rules)
    CHAIN_POWER: [
        0, 8, 16, 32, 64, 96, 128, 160, 192, 224,
        256, 288, 320, 352, 384, 416, 448, 480, 512,
    ],

    // Color Bonus: index = number of distinct colors cleared
    COLOR_BONUS: [0, 0, 3, 6, 12, 24],

    // Group Bonus: index = group size (4 = base, 5+)
    GROUP_BONUS: [0, 0, 0, 0, 0, 2, 3, 4, 5, 6, 7, 10],

    // Minimum connected count to pop
    MIN_CHAIN_SIZE: 4,
};
