// Puyo Puyo - Score Manager
window.PP = window.PP || {};

PP.ScoreManager = class ScoreManager {
    constructor() {
        this.score = 0;
    }

    /**
     * Calculate score for one chain step.
     * @param {Object} clearResult - { groups: [{color, cells, count}], totalCleared, colorsCleared }
     * @param {number} chainStep - 1-based chain step number
     * @returns {number} points scored for this step
     */
    calculateChainStepScore(clearResult, chainStep) {
        const C = PP.Constants;
        const PC = clearResult.totalCleared;

        // Chain Power
        let CP;
        if (chainStep <= C.CHAIN_POWER.length) {
            CP = C.CHAIN_POWER[chainStep - 1];
        } else {
            const last = C.CHAIN_POWER[C.CHAIN_POWER.length - 1];
            CP = Math.min(999, last + 32 * (chainStep - C.CHAIN_POWER.length));
        }

        // Color Bonus
        const numColors = clearResult.colorsCleared;
        const CB = numColors < C.COLOR_BONUS.length
            ? C.COLOR_BONUS[numColors]
            : C.COLOR_BONUS[C.COLOR_BONUS.length - 1];

        // Group Bonus (sum for each group)
        let GB = 0;
        for (const group of clearResult.groups) {
            const size = group.count;
            if (size >= C.GROUP_BONUS.length) {
                GB += C.GROUP_BONUS[C.GROUP_BONUS.length - 1];
            } else {
                GB += C.GROUP_BONUS[size];
            }
        }

        const multiplier = Math.max(1, Math.min(999, CP + CB + GB));
        const points = (10 * PC) * multiplier;
        this.score += points;
        return points;
    }

    reset() {
        this.score = 0;
    }
};
