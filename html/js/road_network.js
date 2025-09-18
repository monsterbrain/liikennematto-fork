class Node {
    constructor(id, x, y, direction, dirChar) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.direction = direction; // A vector like {x: 0, y: -1} for North
        this.dirChar = dirChar; // 'N', 'S', 'E', 'W', or 'LOT'
        this.edges = [];
        this.trafficLightId = null;
    }
}

export class RoadNetwork {
    constructor() {
        this.nodes = new Map();
    }

    build(tilemap, lots) {
        this.nodes.clear();
        const { width, height, tileSize } = tilemap;

        // 1. Create nodes for road tiles
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tile = tilemap.getTile(x, y);
                if (tile?.type === 'road') {
                    this.createNodesForTile(x, y, tileSize, tile.bitmask);
                }
            }
        }

        // 2. Create nodes for lots and connect them
        for (const lot of lots) {
            this.createNodeForLot(lot, tileSize);
        }

        // 3. Connect road nodes with edges
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tile = tilemap.getTile(x, y);
                if (tile?.type === 'road') {
                    this.createEdgesForTile(x, y, tile.bitmask);
                }
            }
        }
    }

    createNodeForLot(lot, tileSize) {
        const id = `lot-${lot.x}-${lot.y}`;
        const lotCenterX = lot.x * tileSize + (lot.width * tileSize) / 2;
        const lotCenterY = lot.y * tileSize + (lot.height * tileSize) / 2;

        const roadCenterX = lot.entryPoint.x * tileSize + tileSize / 2;
        const roadCenterY = lot.entryPoint.y * tileSize + tileSize / 2;
        const dirX = roadCenterX - lotCenterX;
        const dirY = roadCenterY - lotCenterY;
        const mag = Math.hypot(dirX, dirY);
        const direction = mag > 0 ? { x: dirX / mag, y: dirY / mag } : {x: 0, y: 1};

        const node = new Node(id, lotCenterX, lotCenterY, direction, 'LOT');
        this.nodes.set(id, node);
        lot.entryNodeId = id;

        let closestRoadNode = null;
        let minDistance = Infinity;
        for (const [nodeId, roadNode] of this.nodes) {
            if (nodeId.startsWith(`${lot.entryPoint.x}-${lot.entryPoint.y}`)) {
                const distance = Math.hypot(lotCenterX - roadNode.x, lotCenterY - roadNode.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestRoadNode = roadNode;
                }
            }
        }

        if (closestRoadNode) {
            node.edges.push(closestRoadNode.id);
            closestRoadNode.edges.push(node.id);
        }
    }

    createNodesForTile(x, y, tileSize, bitmask) {
        const centerX = x * tileSize + tileSize / 2;
        const centerY = y * tileSize + tileSize / 2;
        const halfSize = tileSize / 2;
        const trafficLightId = (bitmask === 15) ? `tl-${x}-${y}` : null;
        const directions = {
            'N': { vec: { x: 0, y: -1 }, x: 0, y: -halfSize },
            'W': { vec: { x: -1, y: 0 }, x: -halfSize, y: 0 },
            'E': { vec: { x: 1, y: 0 }, x: halfSize, y: 0 },
            'S': { vec: { x: 0, y: 1 }, x: 0, y: halfSize }
        };
        const addNode = (dir, def) => {
            const id = `${x}-${y}-${dir}`;
            const node = new Node(id, centerX + def.x, centerY + def.y, def.vec, dir);
            if (trafficLightId) node.trafficLightId = trafficLightId;
            this.nodes.set(id, node);
        };
        if (bitmask & 1) addNode('N', directions['N']);
        if (bitmask & 2) addNode('W', directions['W']);
        if (bitmask & 4) addNode('E', directions['E']);
        if (bitmask & 8) addNode('S', directions['S']);
    }

    createEdgesForTile(x, y, bitmask) {
        const connections = {
            'N': { bit: 1, dx: 0, dy: -1, opposite: 'S' },
            'W': { bit: 2, dx: -1, dy: 0, opposite: 'E' },
            'E': { bit: 4, dx: 1, dy: 0, opposite: 'W' },
            'S': { bit: 8, dx: 0, dy: 1, opposite: 'N' },
        };
        const dirs = Object.keys(connections);
        for (const fromDir of dirs) {
            const fromNodeId = `${x}-${y}-${fromDir}`;
            if (!this.nodes.has(fromNodeId)) continue;
            for (const toDir of dirs) {
                if (fromDir === toDir) continue;
                const toNodeId = `${x}-${y}-${toDir}`;
                if (this.nodes.has(toNodeId)) this.nodes.get(fromNodeId).edges.push(toNodeId);
            }
            const conn = connections[fromDir];
            const neighborX = x + conn.dx;
            const neighborY = y + conn.dy;
            const neighborNodeId = `${neighborX}-${neighborY}-${conn.opposite}`;
            if (this.nodes.has(neighborNodeId)) this.nodes.get(fromNodeId).edges.push(neighborNodeId);
        }
    }

    renderDebug(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
        ctx.lineWidth = 1;
        for (const node of this.nodes.values()) {
            for (const neighborId of node.edges) {
                const neighbor = this.nodes.get(neighborId);
                if (neighbor) {
                    ctx.beginPath();
                    ctx.moveTo(node.x, node.y);
                    const angle = Math.atan2(neighbor.y - node.y, neighbor.x - node.x);
                    const arrowX = neighbor.x - 5 * Math.cos(angle);
                    const arrowY = neighbor.y - 5 * Math.sin(angle);
                    ctx.lineTo(arrowX, arrowY);
                    ctx.stroke();
                }
            }
        }
        ctx.fillStyle = 'rgba(255, 0, 255, 1)';
        for (const node of this.nodes.values()) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 3, 0, 2 * Math.PI);
            ctx.fill();
        }
        ctx.restore();
    }
}
