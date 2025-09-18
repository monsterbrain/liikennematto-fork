import { World } from './world.js';

// Get the canvas element
const canvas = document.getElementById('gameCanvas');

// Create the main world instance
const world = new World(canvas);

// The main game loop
function gameLoop(timestamp) {
    world.update(timestamp);
    world.render();
    requestAnimationFrame(gameLoop);
}

// Start the game loop
requestAnimationFrame(gameLoop);
