export class Tilemap {
    constructor(width, height, tileSize) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        // The grid stores tile objects, e.g., { type: 'road', bitmask: 0 }
        this.grid = Array(height).fill(null).map(() => Array(width).fill(null));
    }

    /**
     * Safely gets a tile at the given grid coordinates.
     * @returns The tile object or null if out of bounds.
     */
    getTile(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.grid[y][x];
        }
        return null;
    }

    /**
     * Calculates the 4-bit bitmask for a tile based on its neighbors.
     * North = 1, West = 2, East = 4, South = 8
     */
    calculateBitmask(x, y) {
        let mask = 0;
        // North
        if (this.getTile(x, y - 1)?.type === 'road') mask |= 1;
        // West
        if (this.getTile(x - 1, y)?.type === 'road') mask |= 2;
        // East
        if (this.getTile(x + 1, y)?.type === 'road') mask |= 4;
        // South
        if (this.getTile(x, y + 1)?.type === 'road') mask |= 8;
        return mask;
    }

    /**
     * Adds a road tile at the given grid coordinates and updates bitmasks.
     */
    addTile(x, y) {
        if (this.getTile(x, y) === null) {
            this.grid[y][x] = { type: 'road', bitmask: 0 };
            this.updateSurroundingBitmasks(x, y);
        }
    }

    /**
     * Removes a tile and updates surrounding bitmasks.
     */
    removeTile(x, y) {
        if (this.getTile(x, y) !== null) {
            this.grid[y][x] = null;
            this.updateSurroundingBitmasks(x, y);
        }
    }

    /**
     * Recalculates the bitmask for a tile and its four neighbors.
     */
    updateSurroundingBitmasks(x, y) {
        const neighbors = [
            { dx: 0, dy: 0 },   // The tile itself
            { dx: 0, dy: -1 },  // North
            { dx: -1, dy: 0 },  // West
            { dx: 1, dy: 0 },   // East
            { dx: 0, dy: 1 }    // South
        ];

        for (const neighbor of neighbors) {
            const nx = x + neighbor.dx;
            const ny = y + neighbor.dy;
            const tile = this.getTile(nx, ny);
            if (tile?.type === 'road') {
                tile.bitmask = this.calculateBitmask(nx, ny);
            }
        }
    }


    /**
     * Renders the tilemap on the given canvas context.
     * @param {CanvasRenderingContext2D} ctx The canvas rendering context.
     */
    render(ctx) {
        ctx.strokeStyle = '#eee'; // Light grey for grid lines
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tileX = x * this.tileSize;
                const tileY = y * this.tileSize;

                // Draw grid outline
                ctx.strokeRect(tileX, tileY, this.tileSize, this.tileSize);

                const tile = this.grid[y][x];
                if (tile) {
                    // For now, just draw a colored square if a tile exists
                    ctx.fillStyle = '#aaa'; // Dark grey for roads
                    ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);

                    // Draw bitmask for debugging
                    ctx.fillStyle = '#000';
                    ctx.fillText(tile.bitmask, tileX + this.tileSize / 2, tileY + this.tileSize / 2);
                }
            }
        }
    }
}
