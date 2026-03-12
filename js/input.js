// Puyo Puyo - Input Manager
window.PP = window.PP || {};

PP.InputManager = class InputManager {
    constructor() {
        this.keys = {};
        this.justPressed = {};

        // DAS state per direction
        this.dasState = {
            ArrowLeft: { held: 0, active: false },
            ArrowRight: { held: 0, active: false },
        };
    }

    bind() {
        window.addEventListener('keydown', (e) => {
            const preventKeys = [
                'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp',
                'Space', 'KeyZ', 'KeyX',
            ];
            if (preventKeys.includes(e.code)) {
                e.preventDefault();
            }
            if (!this.keys[e.code]) {
                this.justPressed[e.code] = true;
            }
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (this.dasState[e.code]) {
                this.dasState[e.code].held = 0;
                this.dasState[e.code].active = false;
            }
        });
    }

    isHeld(code) {
        return !!this.keys[code];
    }

    isJustPressed(code) {
        return !!this.justPressed[code];
    }

    // Returns true on the first frame, then after DAS_DELAY, every DAS_REPEAT frames
    isDASTriggered(code) {
        const C = PP.Constants;
        if (!this.keys[code]) return false;

        const state = this.dasState[code];
        if (!state) return this.isJustPressed(code);

        state.held++;

        if (state.held === 1) {
            return true; // First frame
        }
        if (state.held >= C.DAS_DELAY) {
            if (!state.active || (state.held - C.DAS_DELAY) % C.DAS_REPEAT === 0) {
                state.active = true;
                return true;
            }
        }
        return false;
    }

    resetFrame() {
        this.justPressed = {};
    }
};
