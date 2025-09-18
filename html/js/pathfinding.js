/**
 * Calculates the Euclidean distance between two nodes.
 * @param {Node} nodeA
 * @param {Node} nodeB
 * @returns {number} The distance.
 */
function heuristic(nodeA, nodeB) {
    return Math.sqrt(Math.pow(nodeA.x - nodeB.x, 2) + Math.pow(nodeA.y - nodeB.y, 2));
}

/**
 * Finds the shortest path between two nodes in a graph using the A* algorithm.
 * @param {RoadNetwork} roadNetwork The graph to search.
 * @param {string} startNodeId The ID of the starting node.
 * @param {string} goalNodeId The ID of the goal node.
 * @returns {string[] | null} An array of node IDs representing the path, or null if no path is found.
 */
export function findPath(roadNetwork, startNodeId, goalNodeId) {
    const startNode = roadNetwork.nodes.get(startNodeId);
    const goalNode = roadNetwork.nodes.get(goalNodeId);

    if (!startNode || !goalNode) {
        return null; // Start or goal node not in the graph
    }

    const openSet = new Set([startNodeId]);
    const cameFrom = new Map();

    const gScore = new Map();
    gScore.set(startNodeId, 0);

    const fScore = new Map();
    fScore.set(startNodeId, heuristic(startNode, goalNode));

    while (openSet.size > 0) {
        let currentId = null;
        let lowestFScore = Infinity;

        // Find the node in the open set with the lowest fScore
        for (const nodeId of openSet) {
            const score = fScore.get(nodeId) || Infinity;
            if (score < lowestFScore) {
                lowestFScore = score;
                currentId = nodeId;
            }
        }

        if (currentId === goalNodeId) {
            // Reconstruct path
            const path = [currentId];
            let current = currentId;
            while (cameFrom.has(current)) {
                current = cameFrom.get(current);
                path.unshift(current);
            }
            return path;
        }

        openSet.delete(currentId);
        const currentNode = roadNetwork.nodes.get(currentId);

        for (const neighborId of currentNode.edges) {
            const neighborNode = roadNetwork.nodes.get(neighborId);
            if (!neighborNode) continue;

            const tentativeGScore = (gScore.get(currentId) || 0) + heuristic(currentNode, neighborNode);

            if (tentativeGScore < (gScore.get(neighborId) || Infinity)) {
                cameFrom.set(neighborId, currentId);
                gScore.set(neighborId, tentativeGScore);
                fScore.set(neighborId, tentativeGScore + heuristic(neighborNode, goalNode));
                if (!openSet.has(neighborId)) {
                    openSet.add(neighborId);
                }
            }
        }
    }

    return null; // No path found
}
