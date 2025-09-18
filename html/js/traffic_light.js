export class TrafficLight {
    constructor(id) {
        this.id = id;
        // For simplicity, we'll assume a standard 4-way intersection.
        // N/S lights are linked, E/W lights are linked.
        // We'll model one pair's state, the other is the opposite.
        this.isNorthSouthGreen = true;

        this.cycleDuration = 10000; // 10 seconds for a full red-green-red cycle
        this.timer = 0;
    }

    /**
     * Updates the state of the traffic light based on the timer.
     * @param {number} deltaTime The time elapsed since the last frame.
     */
    update(deltaTime) {
        this.timer += deltaTime;
        if (this.timer >= this.cycleDuration / 2) {
            this.timer = 0;
            this.isNorthSouthGreen = !this.isNorthSouthGreen;
        }
    }

    /**
     * Checks if a car coming from a specific direction is allowed to proceed.
     * @param {string} direction The direction the node corresponds to ('N', 'S', 'E', 'W').
     * @returns {boolean} True if the light is green for that direction.
     */
    isGreen(direction) {
        if (direction === 'N' || direction === 'S') {
            return this.isNorthSouthGreen;
        }
        if (direction === 'E' || direction === 'W') {
            return !this.isNorthSouthGreen;
        }
        return false; // Should not happen for intersection nodes
    }
}
