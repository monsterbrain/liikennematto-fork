export class Lot {
    constructor(x, y, width, height, entryPoint) {
        this.x = x; // grid coordinates
        this.y = y; // grid coordinates
        this.width = width;
        this.height = height;
        this.entryPoint = entryPoint; // {x, y} of the road tile it connects to
        this.color = `hsl(${Math.random() * 360}, 50%, 70%)`;
    }

    /**
     * Renders the lot as a colored rectangle.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} tileSize
     */
    render(ctx, tileSize) {
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.x * tileSize,
            this.y * tileSize,
            this.width * tileSize,
            this.height * tileSize
        );
    }
}
