import { getCubicBezierPolyline } from './geometry.js';
import { FiniteStateMachine, createState } from './fsm.js';
import { QuadTree } from './quadtree.js';

export class Car {
    constructor(nodePath, roadNetwork) {
        this.roadNetwork = roadNetwork;
        this.nodePath = nodePath;
        this.smoothPath = [];
        this.currentTargetIndex = 0;
        this.isFinished = false;

        this.x = -100;
        this.y = -100;
        this.width = 8;
        this.height = 16;
        this.speed = 1.5;
        this.baseSpeed = 1.5;
        this.angle = 0;

        this.generateSmoothPath();
        if (this.smoothPath.length > 0) {
            this.x = this.smoothPath[0].x;
            this.y = this.smoothPath[0].y;
        }

        this.fsm = new FiniteStateMachine('DRIVING', {
            'DRIVING': createState({
                enter: () => this.speed = this.baseSpeed,
                update: (qtree, trafficLights) => this.drive(qtree, trafficLights)
            }),
            'STOPPING': createState({
                enter: () => this.speed = 0,
                update: (qtree, trafficLights) => {
                    if (this.isPathClear(qtree) && this.isLightGreen(trafficLights)) {
                        this.fsm.transition('DRIVING');
                    }
                }
            }),
            'FINISHED': createState({
                enter: () => this.isFinished = true
            })
        });
    }

    isPathClear(qtree) {
        const lookAheadDist = this.height * 1.5;
        const lookAheadX = this.x + Math.cos(this.angle) * lookAheadDist;
        const lookAheadY = this.y + Math.sin(this.angle) * lookAheadDist;
        const queryRange = new QuadTree.Rectangle(lookAheadX, lookAheadY, this.width, this.height);
        const nearbyCars = qtree.query(queryRange);
        return nearbyCars.filter(car => car !== this).length === 0;
    }

    isLightGreen(trafficLights) {
        // Find the next node in the original node path, not the smooth path
        const nextNode = this.getNextNode();
        if (nextNode?.trafficLightId) {
            const light = trafficLights.get(nextNode.trafficLightId);
            if (light && !light.isGreen(nextNode.dirChar)) {
                // Check if we are close enough to the intersection to care
                const distToNode = Math.hypot(this.x - nextNode.x, this.y - nextNode.y);
                if (distToNode < 40) { // Stop within 40 pixels of the light
                    return false;
                }
            }
        }
        return true;
    }

    getNextNode() {
        // Find the node that corresponds to the start of the current or next smooth path segment
        let currentSegmentStartNodeIndex = 0;
        let cumulativeLength = 0;
        for (let i = 0; i < this.nodePath.length - 1; i++) {
            // 15 is the number of points per segment from generateSmoothPath
            cumulativeLength += 15;
            if (this.currentTargetIndex < cumulativeLength) {
                currentSegmentStartNodeIndex = i + 1;
                break;
            }
        }
        return this.roadNetwork.nodes.get(this.nodePath[currentSegmentStartNodeIndex]);
    }

    drive(qtree, trafficLights) {
        if (!this.isPathClear(qtree) || !this.isLightGreen(trafficLights)) {
            this.fsm.transition('STOPPING');
            return;
        }

        if (!this.smoothPath || this.currentTargetIndex >= this.smoothPath.length) {
            this.fsm.transition('FINISHED');
            return;
        }

        const targetPoint = this.smoothPath[this.currentTargetIndex];
        const dx = targetPoint.x - this.x;
        const dy = targetPoint.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.speed * 1.5) {
            this.currentTargetIndex++;
        } else {
            this.angle = Math.atan2(dy, dx);
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
        }
    }

    generateSmoothPath() {
        if (this.nodePath.length < 2) return;
        const points = [];
        const controlPointScale = 20;
        for (let i = 0; i < this.nodePath.length - 1; i++) {
            const p0_node = this.roadNetwork.nodes.get(this.nodePath[i]);
            const p3_node = this.roadNetwork.nodes.get(this.nodePath[i + 1]);
            if (!p0_node || !p3_node) continue;
            const p0 = { x: p0_node.x, y: p0_node.y };
            const p3 = { x: p3_node.x, y: p3_node.y };
            const p1 = { x: p0.x + p0_node.direction.x * controlPointScale, y: p0.y + p0_node.direction.y * controlPointScale };
            const p2 = { x: p3.x - p3_node.direction.x * controlPointScale, y: p3.y - p3_node.direction.y * controlPointScale };
            const segmentPoints = getCubicBezierPolyline(p0, p1, p2, p3, 15);
            points.push(...segmentPoints.slice(0, -1));
        }
        const lastNode = this.roadNetwork.nodes.get(this.nodePath[this.nodePath.length - 1]);
        if (lastNode) points.push(lastNode);
        this.smoothPath = points.filter(p => p);
    }

    update(qtree, trafficLights) {
        this.fsm.update(qtree, trafficLights);
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);
        const color = this.fsm.currentState === 'STOPPING' ? 'hsl(0, 80%, 55%)' : 'hsl(210, 100%, 50%)';
        ctx.fillStyle = color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.fillStyle = 'hsl(60, 100%, 80%)';
        ctx.fillRect(-this.width / 4, -this.height / 2 - 2, this.width / 2, 4);
        ctx.restore();
    }
}
