// Puyo Puyo - Chain Detection
window.PP = window.PP || {};

PP.Chain = {
    /**
     * Find all connected groups of 4+ same-color puyos using BFS.
     * @param {Board} board
     * @returns {Array} groups - [{color, cells: [{row, col}], count}]
     */
    findConnectedGroups(board) {
        const C = PP.Constants;
        const visited = [];
        for (let r = 0; r < C.TOTAL_ROWS; r++) {
            visited[r] = new Array(C.COLS).fill(false);
        }

        const groups = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (let r = 0; r < C.TOTAL_ROWS; r++) {
            for (let c = 0; c < C.COLS; c++) {
                const color = board.getCell(r, c);
                if (color <= 0 || visited[r][c]) continue;

                // BFS
                const group = [];
                const queue = [{ row: r, col: c }];
                visited[r][c] = true;

                while (queue.length > 0) {
                    const cell = queue.shift();
                    group.push(cell);

                    for (const [dr, dc] of directions) {
                        const nr = cell.row + dr;
                        const nc = cell.col + dc;
                        if (board.isInBounds(nr, nc) && !visited[nr][nc] && board.getCell(nr, nc) === color) {
                            visited[nr][nc] = true;
                            queue.push({ row: nr, col: nc });
                        }
                    }
                }

                if (group.length >= C.MIN_CHAIN_SIZE) {
                    groups.push({ color: color, cells: group, count: group.length });
                }
            }
        }

        return groups;
    },

    /**
     * Clear groups from the board and return clear result for scoring.
     * @param {Board} board
     * @param {Array} groups
     * @returns {Object} { groups, totalCleared, colorsCleared }
     */
    clearGroups(board, groups) {
        const C = PP.Constants;
        let totalCleared = 0;
        const colorsSet = new Set();

        for (const group of groups) {
            colorsSet.add(group.color);
            totalCleared += group.count;
            for (const cell of group.cells) {
                board.setCell(cell.row, cell.col, C.CELL_EMPTY);
            }
        }

        return {
            groups: groups,
            totalCleared: totalCleared,
            colorsCleared: colorsSet.size,
        };
    },
};
