import { Tilemap } from './tilemap.js';
import { RoadNetwork } from './road_network.js';
import { Simulation } from './simulation.js';
import { findPath } from './pathfinding.js';
import { Lot } from './lot.js';

export class World {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;

        this.camera = { x: 0, y: 0, zoom: 1, isDragging: false, lastX: 0, lastY: 0 };

        const TILE_SIZE = 40;
        // Make map bigger to have something to pan around in
        const MAP_WIDTH = Math.floor(this.canvas.width / TILE_SIZE) * 2;
        const MAP_HEIGHT = Math.floor(this.canvas.height / TILE_SIZE) * 2;

        this.tilemap = new Tilemap(MAP_WIDTH, MAP_HEIGHT, TILE_SIZE);
        this.roadNetwork = new RoadNetwork();
        this.simulation = new Simulation(this.roadNetwork, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
        this.lots = [];

        this.lotGenTimer = 0;
        this.lotGenInterval = 2000;
        this.lastTimestamp = 0;

        this.showRoadNetwork = true;
        this.showTrafficLights = true;
        this.startNodeId = null;

        this.init();
    }

    init() {
        this.roadNetwork.build(this.tilemap, this.lots);
        this.attachEventListeners();
        console.log("World initialized. Scroll to zoom, Middle-click + drag to pan.");
    }

    attachEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        document.getElementById('toggle-network').addEventListener('click', () => {
            this.showRoadNetwork = !this.showRoadNetwork;
        });
        document.getElementById('toggle-lights').addEventListener('click', () => {
            this.showTrafficLights = !this.showTrafficLights;
        });
    }

    onMouseDown(e) {
        if (e.button === 1) { // Middle mouse button for panning
            this.camera.isDragging = true;
            this.camera.lastX = e.clientX;
            this.camera.lastY = e.clientY;
            e.preventDefault();
            return;
        }
        const mousePos = this.getMousePos(e);
        if (e.ctrlKey || e.metaKey) this.handlePathfindingClick(mousePos);
        else this.handleTileClick(e.button, mousePos);
    }

    onMouseUp(e) { this.camera.isDragging = false; }

    onMouseMove(e) {
        if (!this.camera.isDragging) return;
        const dx = e.clientX - this.camera.lastX;
        const dy = e.clientY - this.camera.lastY;
        this.camera.x += dx;
        this.camera.y += dy;
        this.camera.lastX = e.clientX;
        this.camera.lastY = e.clientY;
    }

    onWheel(e) {
        e.preventDefault();
        const zoomIntensity = 0.1;
        const wheel = e.deltaY < 0 ? 1 : -1;
        const oldZoom = this.camera.zoom;
        this.camera.zoom = Math.max(0.2, Math.min(5, this.camera.zoom * Math.exp(wheel * zoomIntensity)));
    }

    getMousePos(evt) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (evt.clientX - rect.left - this.camera.x) / this.camera.zoom;
        const y = (evt.clientY - rect.top - this.camera.y) / this.camera.zoom;
        return { x, y };
    }

    handleTileClick(button, mousePos) {
        const gridX = Math.floor(mousePos.x / this.tilemap.tileSize);
        const gridY = Math.floor(mousePos.y / this.tilemap.tileSize);
        if (button === 0) this.tilemap.addTile(gridX, gridY);
        else if (button === 2) this.tilemap.removeTile(gridX, gridY);
        this.roadNetwork.build(this.tilemap, this.lots);
        this.simulation.updateTrafficLights();
    }

    findNearestNode(x, y) {
        let nearestNode = null;
        let minDistance = Infinity;
        for (const node of this.roadNetwork.nodes.values()) {
            const distance = Math.hypot(node.x - x, node.y - y);
            if (distance < minDistance && distance < this.tilemap.tileSize) {
                minDistance = distance;
                nearestNode = node;
            }
        }
        return nearestNode;
    }

    handlePathfindingClick(mousePos) {
        const nearestNode = this.findNearestNode(mousePos.x, mousePos.y);
        if (nearestNode) {
            if (!this.startNodeId) this.startNodeId = nearestNode.id;
            else {
                const path = findPath(this.roadNetwork, this.startNodeId, nearestNode.id);
                if (path) this.simulation.spawnCar(path);
                this.startNodeId = null;
            }
        }
    }

    tryGenerateLot() {
        const roadTiles = [];
        for (let y = 0; y < this.tilemap.height; y++) for (let x = 0; x < this.tilemap.width; x++) {
            if (this.tilemap.getTile(x, y)?.type === 'road') roadTiles.push({ x, y });
        }
        if (roadTiles.length === 0) return;
        const potentialSpots = [];
        for (const roadTile of roadTiles) {
            const neighbors = [{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}];
            for (const n of neighbors) {
                const spotX = roadTile.x + n.dx;
                const spotY = roadTile.y + n.dy;
                if (this.tilemap.getTile(spotX, spotY) === null && !this.isOccupiedByLot(spotX, spotY)) {
                    potentialSpots.push({ x: spotX, y: spotY, entryPoint: roadTile });
                }
            }
        }
        if (potentialSpots.length === 0) return;
        const spot = potentialSpots[Math.floor(Math.random() * potentialSpots.length)];
        const lotWidth = 2, lotHeight = 2;
        let areaClear = true;
        for (let y = 0; y < lotHeight; y++) for (let x = 0; x < lotWidth; x++) {
            if (this.tilemap.getTile(spot.x + x, spot.y + y) !== null || this.isOccupiedByLot(spot.x + x, spot.y + y)) areaClear = false;
        }
        if (areaClear) {
            this.lots.push(new Lot(spot.x, spot.y, lotWidth, lotHeight, spot.entryPoint));
            this.roadNetwork.build(this.tilemap, this.lots);
            this.simulation.updateTrafficLights();
        }
    }

    isOccupiedByLot(x, y) {
        return this.lots.some(lot => x >= lot.x && x < lot.x + lot.width && y >= lot.y && y < lot.y + lot.height);
    }

    update(timestamp) {
        this.simulation.update(timestamp, this.lots);
        this.lotGenTimer += timestamp - (this.lastTimestamp || timestamp);
        this.lastTimestamp = timestamp;
        if (this.lotGenTimer > this.lotGenInterval) {
            this.lotGenTimer = 0;
            this.tryGenerateLot();
        }
    }

    render() {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.translate(this.camera.x, this.camera.y);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.tilemap.render(this.ctx);
        for (const lot of this.lots) lot.render(this.ctx, this.tilemap.tileSize);
        if (this.showRoadNetwork) this.roadNetwork.renderDebug(this.ctx);
        if (this.showTrafficLights) this.simulation.renderDebug(this.ctx);
        this.simulation.render(this.ctx);
        if (this.startNodeId) {
            const node = this.roadNetwork.nodes.get(this.startNodeId);
            if (node) {
                 this.ctx.fillStyle = 'green';
                 this.ctx.beginPath();
                 this.ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI);
                 this.ctx.fill();
            }
        }
        this.ctx.restore();
    }
}
