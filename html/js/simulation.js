import { Car } from './car.js';
import { findPath } from './pathfinding.js';
import { QuadTree } from './quadtree.js';
import { TrafficLight } from './traffic_light.js';

export class Simulation {
    constructor(roadNetwork, width, height) {
        this.roadNetwork = roadNetwork;
        this.cars = [];
        this.width = width;
        this.height = height;
        this.trafficLights = new Map();

        this.spawnInterval = 3000;
        this.timeSinceLastSpawn = 0;
        this.lastUpdateTime = 0;
    }

    updateTrafficLights() {
        this.trafficLights.clear();
        for (const node of this.roadNetwork.nodes.values()) {
            if (node.trafficLightId && !this.trafficLights.has(node.trafficLightId)) {
                this.trafficLights.set(node.trafficLightId, new TrafficLight(node.trafficLightId));
            }
        }
    }

    spawnCar(path) {
        if (!path || path.length < 2) return;
        const car = new Car(path, this.roadNetwork);
        this.cars.push(car);
    }

    trySpawnRandomCar(lots) {
        const validLots = lots.filter(lot => lot.entryNodeId && this.roadNetwork.nodes.has(lot.entryNodeId));
        if (validLots.length < 2) return;

        const startLotIndex = Math.floor(Math.random() * validLots.length);
        let endLotIndex = Math.floor(Math.random() * validLots.length);

        if (startLotIndex === endLotIndex) {
            endLotIndex = (endLotIndex + 1) % validLots.length;
        }

        const startNodeId = validLots[startLotIndex].entryNodeId;
        const endNodeId = validLots[endLotIndex].entryNodeId;

        if (startNodeId && endNodeId) {
            const path = findPath(this.roadNetwork, startNodeId, endNodeId);
            if (path) {
                this.spawnCar(path);
            }
        }
    }

    update(timestamp, lots) {
        if (this.lastUpdateTime === 0) this.lastUpdateTime = timestamp;
        const deltaTime = timestamp - this.lastUpdateTime;
        this.lastUpdateTime = timestamp;

        this.timeSinceLastSpawn += deltaTime;
        if (this.timeSinceLastSpawn > this.spawnInterval) {
            this.timeSinceLastSpawn = 0;
            this.trySpawnRandomCar(lots);
        }

        for (const light of this.trafficLights.values()) {
            light.update(deltaTime);
        }

        const qtree = QuadTree.create(this.width, this.height);
        for (const car of this.cars) {
            qtree.insert(car);
        }

        for (let i = this.cars.length - 1; i >= 0; i--) {
            const car = this.cars[i];
            car.update(qtree, this.trafficLights);

            if (car.isFinished) {
                this.cars.splice(i, 1);
            }
        }
    }

    render(ctx) {
        for (const car of this.cars) {
            car.render(ctx);
        }
    }

    renderDebug(ctx) {
        for (const node of this.roadNetwork.nodes.values()) {
            if (node.trafficLightId) {
                const light = this.trafficLights.get(node.trafficLightId);
                if (light) {
                    ctx.fillStyle = light.isGreen(node.dirChar) ? 'green' : 'red';
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        }
    }
}
