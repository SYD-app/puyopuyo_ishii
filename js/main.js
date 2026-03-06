// Puyo Puyo - Entry Point
(function () {
    window.addEventListener('DOMContentLoaded', function () {
        var canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        var game = new PP.Game(canvas);
        window._game = game; // Debug access
        game.start();
    });
})();
