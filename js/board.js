// Puyo Puyo - Board
window.PP = window.PP || {};

PP.Board = class Board {
    constructor() {
        const C = PP.Constants;
        this.grid = [];
        for (let r = 0; r < C.TOTAL_ROWS; r++) {
            this.grid[r] = new Array(C.COLS).fill(C.CELL_EMPTY);
        }
    }

    getCell(row, col) {
        const C = PP.Constants;
        if (row < 0 || row >= C.TOTAL_ROWS || col < 0 || col >= C.COLS) {
            return -99; // Out of bounds sentinel
        }
        return this.grid[row][col];
    }

    setCell(row, col, value) {
        const C = PP.Constants;
        if (row >= 0 && row < C.TOTAL_ROWS && col >= 0 && col < C.COLS) {
            this.grid[row][col] = value;
        }
    }

    isEmpty(row, col) {
        return this.getCell(row, col) === PP.Constants.CELL_EMPTY;
    }

    isInBounds(row, col) {
        const C = PP.Constants;
        return row >= 0 && row < C.TOTAL_ROWS && col >= 0 && col < C.COLS;
    }

    isOccupied(row, col) {
        if (!this.isInBounds(row, col)) return true; // Walls are "occupied"
        return this.grid[row][col] !== PP.Constants.CELL_EMPTY;
    }

    /**
     * Apply gravity: drop all puyos down to fill gaps.
     * Returns true if anything moved.
     */
    applyGravity() {
        const C = PP.Constants;
        let anyMoved = false;

        for (let c = 0; c < C.COLS; c++) {
            let writeRow = C.TOTAL_ROWS - 1;
            for (let r = C.TOTAL_ROWS - 1; r >= 0; r--) {
                if (this.grid[r][c] !== C.CELL_EMPTY) {
                    if (r !== writeRow) {
                        this.grid[writeRow][c] = this.grid[r][c];
                        this.grid[r][c] = C.CELL_EMPTY;
                        anyMoved = true;
                    }
                    writeRow--;
                }
            }
        }

        return anyMoved;
    }

    /**
     * Lock piece cells onto the board.
     * @param {Array} cells - [{row, col, color}, ...]
     */
    lockPiece(cells) {
        for (const cell of cells) {
            this.setCell(cell.row, cell.col, cell.color);
        }
    }

    /**
     * Check if game is over (kill position occupied).
     */
    isGameOver() {
        const C = PP.Constants;
        return this.isOccupied(C.KILL_ROW, C.KILL_COL);
    }

    /**
     * Check if the entire board is empty (All Clear).
     */
    isBoardEmpty() {
        const C = PP.Constants;
        for (let r = 0; r < C.TOTAL_ROWS; r++) {
            for (let c = 0; c < C.COLS; c++) {
                if (this.grid[r][c] !== C.CELL_EMPTY) return false;
            }
        }
        return true;
    }

    /**
     * Get the lowest row a puyo would fall to in a given column.
     */
    getDropRow(startRow, col) {
        const C = PP.Constants;
        let row = startRow;
        while (row + 1 < C.TOTAL_ROWS && this.isEmpty(row + 1, col)) {
            row++;
        }
        return row;
    }

    reset() {
        const C = PP.Constants;
        for (let r = 0; r < C.TOTAL_ROWS; r++) {
            for (let c = 0; c < C.COLS; c++) {
                this.grid[r][c] = C.CELL_EMPTY;
            }
        }
    }
};
