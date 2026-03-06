// Puyo Puyo - Game (Main Loop & State Machine)
window.PP = window.PP || {};

PP.GameState = {
    TITLE: 'TITLE',
    PLAYING: 'PLAYING',
    DROPPING: 'DROPPING',
    CHECKING: 'CHECKING',
    POPPING: 'POPPING',
    GAME_OVER: 'GAME_OVER',
};

PP.Game = class Game {
    constructor(canvas) {
        this.board = new PP.Board();
        this.renderer = new PP.Renderer(canvas);
        this.input = new PP.InputManager();
        this.scoreManager = new PP.ScoreManager();

        this.state = PP.GameState.TITLE;
        this.currentPiece = null;
        this.nextPieces = [];

        // Timing
        this.dropTimer = 0;
        this.dropInterval = PP.Constants.INITIAL_DROP_INTERVAL;
        this.lockTimer = 0;
        this.isLocking = false;
        this.popTimer = 0;
        this.dropAnimTimer = 0;

        // Chain state
        this.chainStep = 0;
        this.displayChainStep = 0;
        this.displayChainPoints = 0;
        this.chainDisplayTimer = 0;

        // Level
        this.level = 1;
        this.piecesPlaced = 0;

        // Popping groups for animation
        this.poppingGroups = [];

        // Game loop
        this.lastTime = 0;
        this.accumulator = 0;
        this.frameTime = 1000 / 60;
    }

    start() {
        this.input.bind();
        this.lastTime = performance.now();
        this._loop(this.lastTime);
    }

    _loop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.accumulator += deltaTime;

        // Prevent spiral of death
        if (this.accumulator > this.frameTime * 5) {
            this.accumulator = this.frameTime * 5;
        }

        while (this.accumulator >= this.frameTime) {
            this._update();
            this.input.resetFrame();
            this.accumulator -= this.frameTime;
        }

        this._render();
        requestAnimationFrame((t) => this._loop(t));
    }

    _update() {
        const S = PP.GameState;
        switch (this.state) {
            case S.TITLE: this._updateTitle(); break;
            case S.PLAYING: this._updatePlaying(); break;
            case S.DROPPING: this._updateDropping(); break;
            case S.CHECKING: this._updateChecking(); break;
            case S.POPPING: this._updatePopping(); break;
            case S.GAME_OVER: this._updateGameOver(); break;
        }

        // Chain display timer
        if (this.chainDisplayTimer > 0) {
            this.chainDisplayTimer--;
        }
    }

    _render() {
        const S = PP.GameState;
        this.renderer.clear();
        this.renderer.drawBoard(this.board);

        if (this.state === S.PLAYING && this.currentPiece) {
            this.renderer.drawGhostPiece(this.currentPiece, this.board);
            this.renderer.drawActivePiece(this.currentPiece);
        }

        if (this.state === S.POPPING) {
            this.renderer.drawPoppingAnimation(
                this.poppingGroups, this.popTimer, PP.Constants.POP_DURATION
            );
        }

        this.renderer.drawUI(
            this.scoreManager.score,
            this.level,
            this.chainDisplayTimer > 0 ? this.displayChainStep : 0,
            this.nextPieces
        );

        if (this.chainDisplayTimer > 0 && this.displayChainStep > 0) {
            this.renderer.drawChainNotification(this.displayChainStep, this.displayChainPoints);
        }

        if (this.state === S.TITLE) {
            this.renderer.drawTitleScreen();
        }
        if (this.state === S.GAME_OVER) {
            this.renderer.drawGameOverScreen(this.scoreManager.score);
        }
    }

    // --- State Updates ---

    _updateTitle() {
        if (this.input.isJustPressed('Enter')) {
            this._startGame();
        }
    }

    _updatePlaying() {
        const C = PP.Constants;

        if (!this.currentPiece) return;

        // Left/Right with DAS
        if (this.input.isDASTriggered('ArrowLeft')) {
            this.currentPiece.moveLeft(this.board);
            if (this.isLocking) this.lockTimer = 0; // Reset lock delay on move
        }
        if (this.input.isDASTriggered('ArrowRight')) {
            this.currentPiece.moveRight(this.board);
            if (this.isLocking) this.lockTimer = 0;
        }

        // Rotate
        if (this.input.isJustPressed('ArrowUp') || this.input.isJustPressed('KeyZ')) {
            this.currentPiece.rotateCW(this.board);
            if (this.isLocking) this.lockTimer = 0;
        }
        if (this.input.isJustPressed('KeyX')) {
            this.currentPiece.rotateCCW(this.board);
            if (this.isLocking) this.lockTimer = 0;
        }

        // Hard drop
        if (this.input.isJustPressed('Space')) {
            this.currentPiece.hardDrop(this.board);
            this._lockPiece();
            return;
        }

        // Soft drop / Auto drop
        if (this.input.isHeld('ArrowDown')) {
            this.dropTimer += (C.INITIAL_DROP_INTERVAL / C.SOFT_DROP_INTERVAL);
        } else {
            this.dropTimer++;
        }

        if (this.dropTimer >= this.dropInterval) {
            this.dropTimer = 0;
            if (!this.currentPiece.moveDown(this.board)) {
                // Piece has landed
                if (!this.isLocking) {
                    this.isLocking = true;
                    this.lockTimer = 0;
                }
            } else {
                // Successfully moved down, reset lock
                this.isLocking = false;
                this.lockTimer = 0;
            }
        }

        // Lock delay
        if (this.isLocking) {
            // Re-check if piece is still on ground
            if (!this.currentPiece.hasLanded(this.board)) {
                this.isLocking = false;
                this.lockTimer = 0;
            } else {
                this.lockTimer++;
                if (this.lockTimer >= C.LOCK_DELAY) {
                    this._lockPiece();
                }
            }
        }
    }

    _updateDropping() {
        this.dropAnimTimer++;
        if (this.dropAnimTimer >= 3) { // Small delay for visual gravity
            const moved = this.board.applyGravity();
            if (!moved) {
                this.state = PP.GameState.CHECKING;
            }
            this.dropAnimTimer = 0;
        }
    }

    _updateChecking() {
        const groups = PP.Chain.findConnectedGroups(this.board);

        if (groups.length > 0) {
            this.chainStep++;
            const clearResult = PP.Chain.clearGroups(this.board, groups);
            const points = this.scoreManager.calculateChainStepScore(clearResult, this.chainStep);

            // Store groups for pop animation (use copies of cell positions)
            this.poppingGroups = groups;
            this.popTimer = 0;

            // Update chain display
            this.displayChainStep = this.chainStep;
            this.displayChainPoints = points;
            this.chainDisplayTimer = 60; // Show for 1 second

            this.state = PP.GameState.POPPING;

            // Check level up
            this._checkLevelUp();
        } else {
            // No more chains
            this.chainStep = 0;

            // Check all clear bonus
            if (this.board.isBoardEmpty() && this.piecesPlaced > 0) {
                const allClearBonus = 2100;
                this.scoreManager.score += allClearBonus;
                this.displayChainPoints = allClearBonus;
                this.displayChainStep = 0;
                this.chainDisplayTimer = 90;
            }

            this._spawnNextPiece();
        }
    }

    _updatePopping() {
        this.popTimer++;
        if (this.popTimer >= PP.Constants.POP_DURATION) {
            // Pop animation done, apply gravity again
            this.poppingGroups = [];
            this.state = PP.GameState.DROPPING;
            this.dropAnimTimer = 0;
        }
    }

    _updateGameOver() {
        if (this.input.isJustPressed('Enter')) {
            this.state = PP.GameState.TITLE;
        }
    }

    // --- Helpers ---

    _startGame() {
        this.board.reset();
        this.scoreManager.reset();
        this.level = 1;
        this.piecesPlaced = 0;
        this.dropInterval = PP.Constants.INITIAL_DROP_INTERVAL;
        this.chainStep = 0;
        this.displayChainStep = 0;
        this.chainDisplayTimer = 0;
        this.poppingGroups = [];

        // Fill next queue
        this.nextPieces = [];
        for (let i = 0; i < 2; i++) {
            this.nextPieces.push(this._generatePiece());
        }

        this._spawnNextPiece();
    }

    _spawnNextPiece() {
        // Check game over before spawning
        if (this.board.isGameOver()) {
            this.state = PP.GameState.GAME_OVER;
            this.currentPiece = null;
            return;
        }

        // Take from queue
        this.currentPiece = this.nextPieces.shift();
        // Reset spawn position
        this.currentPiece.axisRow = PP.Constants.SPAWN_ROW;
        this.currentPiece.axisCol = PP.Constants.SPAWN_COL;
        this.currentPiece.rotation = 0;

        // Add new piece to queue
        this.nextPieces.push(this._generatePiece());

        this.dropTimer = 0;
        this.lockTimer = 0;
        this.isLocking = false;
        this.state = PP.GameState.PLAYING;
    }

    _lockPiece() {
        if (!this.currentPiece) return;

        this.board.lockPiece(this.currentPiece.getCells());
        this.currentPiece = null;
        this.isLocking = false;
        this.lockTimer = 0;
        this.piecesPlaced++;

        // Transition to dropping (gravity)
        this.state = PP.GameState.DROPPING;
        this.dropAnimTimer = 0;
        this.chainStep = 0;
    }

    _generatePiece() {
        const C = PP.Constants;
        const axisColor = Math.floor(Math.random() * C.NUM_COLORS) + 1;
        const childColor = Math.floor(Math.random() * C.NUM_COLORS) + 1;
        return new PP.Piece(axisColor, childColor);
    }

    _checkLevelUp() {
        const C = PP.Constants;
        const newLevel = Math.floor(this.scoreManager.score / C.LEVEL_SCORE_INTERVAL) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.dropInterval = Math.max(
                C.MIN_DROP_INTERVAL,
                C.INITIAL_DROP_INTERVAL - (this.level - 1) * C.DROP_SPEED_DECREASE
            );
        }
    }
};
