// Puyo Puyo - Renderer
window.PP = window.PP || {};

PP.Renderer = class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        const C = PP.Constants;
        this.boardWidth = C.COLS * C.CELL_SIZE;
        this.boardHeight = C.VISIBLE_ROWS * C.CELL_SIZE;
        this.sidePanelX = C.BOARD_X + this.boardWidth + 20;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Draw the board grid and all placed puyos.
     */
    drawBoard(board) {
        const C = PP.Constants;
        const ctx = this.ctx;

        // Board background
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(C.BOARD_X, C.BOARD_Y, this.boardWidth, this.boardHeight);

        // Grid lines
        ctx.strokeStyle = '#1a1a3a';
        ctx.lineWidth = 1;
        for (let r = 0; r <= C.VISIBLE_ROWS; r++) {
            const y = C.BOARD_Y + r * C.CELL_SIZE;
            ctx.beginPath();
            ctx.moveTo(C.BOARD_X, y);
            ctx.lineTo(C.BOARD_X + this.boardWidth, y);
            ctx.stroke();
        }
        for (let c = 0; c <= C.COLS; c++) {
            const x = C.BOARD_X + c * C.CELL_SIZE;
            ctx.beginPath();
            ctx.moveTo(x, C.BOARD_Y);
            ctx.lineTo(x, C.BOARD_Y + this.boardHeight);
            ctx.stroke();
        }

        // Board border
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.strokeRect(C.BOARD_X, C.BOARD_Y, this.boardWidth, this.boardHeight);

        // Draw puyos (only visible rows)
        for (let r = C.HIDDEN_ROWS; r < C.TOTAL_ROWS; r++) {
            for (let c = 0; c < C.COLS; c++) {
                const color = board.getCell(r, c);
                if (color > 0) {
                    const x = C.BOARD_X + c * C.CELL_SIZE;
                    const y = C.BOARD_Y + (r - C.HIDDEN_ROWS) * C.CELL_SIZE;
                    this.drawPuyo(x, y, color, 1.0);
                }
            }
        }

        // Kill marker (X on column 2, top row)
        const killX = C.BOARD_X + C.KILL_COL * C.CELL_SIZE + C.CELL_SIZE / 2;
        const killY = C.BOARD_Y + 2; // Just inside top
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(killX - 6, killY);
        ctx.lineTo(killX + 6, killY);
        ctx.moveTo(killX, killY - 3);
        ctx.lineTo(killX, killY + 6);
        ctx.stroke();
    }

    /**
     * Draw a single puyo.
     */
    drawPuyo(x, y, color, scale, alpha) {
        const C = PP.Constants;
        const ctx = this.ctx;
        const radius = (C.CELL_SIZE / 2 - 3) * scale;
        const centerX = x + C.CELL_SIZE / 2;
        const centerY = y + C.CELL_SIZE / 2;

        if (alpha !== undefined) {
            ctx.globalAlpha = alpha;
        }

        // Main circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = C.COLOR_MAP[color] || '#888';
        ctx.fill();

        // Border
        ctx.strokeStyle = C.COLOR_DARK_MAP[color] || '#555';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Highlight (top-left shine)
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.25, centerY - radius * 0.25, radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();

        if (alpha !== undefined) {
            ctx.globalAlpha = 1.0;
        }
    }

    /**
     * Draw the active falling piece.
     */
    drawActivePiece(piece) {
        const C = PP.Constants;
        const cells = piece.getCells();
        for (const cell of cells) {
            if (cell.row >= C.HIDDEN_ROWS) {
                const x = C.BOARD_X + cell.col * C.CELL_SIZE;
                const y = C.BOARD_Y + (cell.row - C.HIDDEN_ROWS) * C.CELL_SIZE;
                this.drawPuyo(x, y, cell.color, 1.0);
            }
        }
    }

    /**
     * Draw the ghost piece (where piece will land).
     */
    drawGhostPiece(piece, board) {
        const C = PP.Constants;
        const ghost = piece.getGhostPosition(board);
        const positions = [
            { row: ghost.axisRow, col: ghost.axisCol, color: piece.axisColor },
            { row: ghost.childRow, col: ghost.childCol, color: piece.childColor },
        ];
        for (const pos of positions) {
            if (pos.row >= C.HIDDEN_ROWS) {
                const x = C.BOARD_X + pos.col * C.CELL_SIZE;
                const y = C.BOARD_Y + (pos.row - C.HIDDEN_ROWS) * C.CELL_SIZE;
                this.drawPuyo(x, y, pos.color, 0.8, 0.25);
            }
        }
    }

    /**
     * Draw popping animation (shrinking puyos).
     */
    drawPoppingAnimation(groups, timer, duration) {
        const C = PP.Constants;
        const progress = timer / duration;
        const scale = 1.0 - progress;

        for (const group of groups) {
            for (const cell of group.cells) {
                if (cell.row >= C.HIDDEN_ROWS) {
                    const x = C.BOARD_X + cell.col * C.CELL_SIZE;
                    const y = C.BOARD_Y + (cell.row - C.HIDDEN_ROWS) * C.CELL_SIZE;
                    this.drawPuyo(x, y, group.color, Math.max(0, scale), 1.0 - progress * 0.5);
                }
            }
        }

        // Flash effect at the start
        if (progress < 0.3) {
            const flashAlpha = (0.3 - progress) / 0.3 * 0.5;
            this.ctx.globalAlpha = flashAlpha;
            for (const group of groups) {
                for (const cell of group.cells) {
                    if (cell.row >= C.HIDDEN_ROWS) {
                        const x = C.BOARD_X + cell.col * C.CELL_SIZE;
                        const y = C.BOARD_Y + (cell.row - C.HIDDEN_ROWS) * C.CELL_SIZE;
                        const cx = x + C.CELL_SIZE / 2;
                        const cy = y + C.CELL_SIZE / 2;
                        this.ctx.beginPath();
                        this.ctx.arc(cx, cy, C.CELL_SIZE / 2 + 4, 0, Math.PI * 2);
                        this.ctx.fillStyle = '#fff';
                        this.ctx.fill();
                    }
                }
            }
            this.ctx.globalAlpha = 1.0;
        }
    }

    /**
     * Draw UI panel (score, level, next pieces, chain).
     */
    drawUI(score, level, chainStep, nextPieces) {
        const C = PP.Constants;
        const ctx = this.ctx;
        const px = this.sidePanelX;

        ctx.fillStyle = '#ddd';
        ctx.font = 'bold 14px monospace';

        // Score
        ctx.fillText('SCORE', px, C.BOARD_Y + 20);
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText(String(score), px, C.BOARD_Y + 45);

        // Level
        ctx.fillStyle = '#ddd';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('LEVEL', px, C.BOARD_Y + 80);
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText(String(level), px, C.BOARD_Y + 105);

        // Chain counter (only show during chains)
        if (chainStep > 0) {
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 16px monospace';
            ctx.fillText(chainStep + ' \u9023\u9396!', px, C.BOARD_Y + 140);
        }

        // Next pieces
        ctx.fillStyle = '#ddd';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('NEXT', px, C.BOARD_Y + 180);

        if (nextPieces && nextPieces.length > 0) {
            for (let i = 0; i < Math.min(2, nextPieces.length); i++) {
                const piece = nextPieces[i];
                const scale = i === 0 ? 0.8 : 0.6;
                const baseY = C.BOARD_Y + 190 + i * 85;
                const baseX = px + 10;

                // Child on top, axis on bottom
                this.drawPuyo(baseX, baseY, piece.childColor, scale);
                this.drawPuyo(baseX, baseY + C.CELL_SIZE * scale, piece.axisColor, scale);
            }
        }
    }

    /**
     * Draw chain notification on the board.
     */
    drawChainNotification(chainStep, points) {
        if (chainStep <= 0) return;
        const C = PP.Constants;
        const ctx = this.ctx;
        const cx = C.BOARD_X + this.boardWidth / 2;
        const cy = C.BOARD_Y + this.boardHeight / 2;

        ctx.save();
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillText(chainStep + ' \u9023\u9396!', cx + 2, cy + 2);

        // Text
        const colors = ['#ffcc00', '#ff8800', '#ff4444', '#ff00ff', '#00ffff'];
        ctx.fillStyle = colors[Math.min(chainStep - 1, colors.length - 1)];
        ctx.fillText(chainStep + ' \u9023\u9396!', cx, cy);

        // Points
        ctx.font = 'bold 18px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText('+' + points, cx, cy + 35);

        ctx.restore();
    }

    /**
     * Draw title screen.
     */
    drawTitleScreen() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Title
        ctx.font = 'bold 40px monospace';
        ctx.fillStyle = '#FF4444';
        ctx.fillText('\u3077\u3088\u3077\u3088', w / 2, h / 2 - 60);

        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = '#ffcc00';
        ctx.fillText('\u30a8\u30f3\u30c9\u30ec\u30b9\u30e2\u30fc\u30c9', w / 2, h / 2 - 20);

        // Start prompt
        ctx.font = '16px monospace';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Press ENTER to Start', w / 2, h / 2 + 40);

        // Controls
        ctx.font = '12px monospace';
        ctx.fillStyle = '#666';
        ctx.fillText('\u2190\u2192: Move  \u2191/Z: Rotate CW  X: Rotate CCW', w / 2, h / 2 + 90);
        ctx.fillText('\u2193: Soft Drop  Space: Hard Drop', w / 2, h / 2 + 110);

        ctx.restore();
    }

    /**
     * Draw game over screen.
     */
    drawGameOverScreen(score) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = 'bold 36px monospace';
        ctx.fillStyle = '#FF4444';
        ctx.fillText('GAME OVER', w / 2, h / 2 - 40);

        ctx.font = 'bold 24px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText('Score: ' + score, w / 2, h / 2 + 10);

        ctx.font = '16px monospace';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Press ENTER to Restart', w / 2, h / 2 + 60);

        ctx.restore();
    }
};
