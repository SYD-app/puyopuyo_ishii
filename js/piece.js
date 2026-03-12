// Puyo Puyo - Piece (Falling Pair)
window.PP = window.PP || {};

PP.Piece = class Piece {
    constructor(axisColor, childColor) {
        const C = PP.Constants;
        this.axisColor = axisColor;
        this.childColor = childColor;
        this.axisRow = C.SPAWN_ROW;
        this.axisCol = C.SPAWN_COL;
        this.rotation = 0; // 0=up, 1=right, 2=down, 3=left
        this.quickTurnCount = 0; // Track consecutive blocked rotations
    }

    getChildRow() {
        return this.axisRow + PP.Constants.ROTATION_OFFSETS[this.rotation].dr;
    }

    getChildCol() {
        return this.axisCol + PP.Constants.ROTATION_OFFSETS[this.rotation].dc;
    }

    getCells() {
        return [
            { row: this.axisRow, col: this.axisCol, color: this.axisColor },
            { row: this.getChildRow(), col: this.getChildCol(), color: this.childColor },
        ];
    }

    /**
     * Check if both axis and child can occupy their positions.
     */
    canPlace(board, axisRow, axisCol, rotation) {
        const C = PP.Constants;
        const offset = C.ROTATION_OFFSETS[rotation];
        const childRow = axisRow + offset.dr;
        const childCol = axisCol + offset.dc;

        // Check bounds (allow hidden rows)
        if (axisCol < 0 || axisCol >= C.COLS) return false;
        if (childCol < 0 || childCol >= C.COLS) return false;
        if (axisRow < 0 || axisRow >= C.TOTAL_ROWS) return false;
        if (childRow < 0 || childRow >= C.TOTAL_ROWS) return false;

        // Check collision with existing puyos
        if (board.isOccupied(axisRow, axisCol)) return false;
        if (board.isOccupied(childRow, childCol)) return false;

        return true;
    }

    moveLeft(board) {
        if (this.canPlace(board, this.axisRow, this.axisCol - 1, this.rotation)) {
            this.axisCol--;
            return true;
        }
        return false;
    }

    moveRight(board) {
        if (this.canPlace(board, this.axisRow, this.axisCol + 1, this.rotation)) {
            this.axisCol++;
            return true;
        }
        return false;
    }

    moveDown(board) {
        if (this.canPlace(board, this.axisRow + 1, this.axisCol, this.rotation)) {
            this.axisRow++;
            return true;
        }
        return false;
    }

    /**
     * Rotate clockwise with wall/floor kick.
     */
    rotateCW(board) {
        return this._rotate(board, 1);
    }

    /**
     * Rotate counter-clockwise with wall/floor kick.
     */
    rotateCCW(board) {
        return this._rotate(board, -1);
    }

    _rotate(board, direction) {
        const C = PP.Constants;
        const newRotation = ((this.rotation + direction) + 4) % 4;

        // Try basic rotation
        if (this.canPlace(board, this.axisRow, this.axisCol, newRotation)) {
            this.rotation = newRotation;
            this.quickTurnCount = 0;
            return true;
        }

        // Wall/floor kick: try pushing the axis in the opposite direction of the child
        const newOffset = C.ROTATION_OFFSETS[newRotation];
        const kickRow = this.axisRow - newOffset.dr;
        const kickCol = this.axisCol - newOffset.dc;

        if (this.canPlace(board, kickRow, kickCol, newRotation)) {
            this.axisRow = kickRow;
            this.axisCol = kickCol;
            this.rotation = newRotation;
            this.quickTurnCount = 0;
            return true;
        }

        // Quick turn (180 degree): if rotation is blocked twice consecutively
        this.quickTurnCount++;
        if (this.quickTurnCount >= 2) {
            const flipRotation = (this.rotation + 2) % 4;
            if (this.canPlace(board, this.axisRow, this.axisCol, flipRotation)) {
                this.rotation = flipRotation;
                this.quickTurnCount = 0;
                return true;
            }
            // Try flip with kick
            const flipOffset = C.ROTATION_OFFSETS[flipRotation];
            const flipKickRow = this.axisRow - flipOffset.dr;
            const flipKickCol = this.axisCol - flipOffset.dc;
            if (this.canPlace(board, flipKickRow, flipKickCol, flipRotation)) {
                this.axisRow = flipKickRow;
                this.axisCol = flipKickCol;
                this.rotation = flipRotation;
                this.quickTurnCount = 0;
                return true;
            }
        }

        return false;
    }

    /**
     * Hard drop: instantly move to lowest valid position.
     */
    hardDrop(board) {
        while (this.moveDown(board)) {
            // Keep moving down
        }
    }

    /**
     * Check if piece has landed (cannot move down).
     */
    hasLanded(board) {
        return !this.canPlace(board, this.axisRow + 1, this.axisCol, this.rotation);
    }

    /**
     * Get ghost piece position (where piece would land).
     */
    getGhostPosition(board) {
        let ghostRow = this.axisRow;
        while (this.canPlace(board, ghostRow + 1, this.axisCol, this.rotation)) {
            ghostRow++;
        }
        const C = PP.Constants;
        const offset = C.ROTATION_OFFSETS[this.rotation];
        return {
            axisRow: ghostRow,
            axisCol: this.axisCol,
            childRow: ghostRow + offset.dr,
            childCol: this.axisCol + offset.dc,
        };
    }
};
