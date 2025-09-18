/**
 * Calculates a point on a cubic Bézier curve.
 * @param {number} t The position on the curve, from 0 to 1.
 * @param {{x: number, y: number}} p0 The start point.
 * @param {{x: number, y: number}} p1 The first control point.
 * @param {{x: number, y: number}} p2 The second control point.
 * @param {{x: number, y: number}} p3 The end point.
 * @returns {{x: number, y: number}} The point on the curve.
 */
export function cubicBezier(t, p0, p1, p2, p3) {
    const cX = 3 * (p1.x - p0.x);
    const bX = 3 * (p2.x - p1.x) - cX;
    const aX = p3.x - p0.x - cX - bX;

    const cY = 3 * (p1.y - p0.y);
    const bY = 3 * (p2.y - p1.y) - cY;
    const aY = p3.y - p0.y - cY - bY;

    const x = aX * t * t * t + bX * t * t + cX * t + p0.x;
    const y = aY * t * t * t + bY * t * t + cY * t + p0.y;

    return { x, y };
}

/**
 * Generates a series of points (a polyline) along a cubic Bézier curve.
 * @param {{x: number, y: number}} p0 The start point.
 * @param {{x: number, y: number}} p1 The first control point.
 * @param {{x: number, y: number}} p2 The second control point.
 * @param {{x: number, y: number}} p3 The end point.
 * @param {number} numPoints The number of points to generate.
 * @returns {{x: number, y: number}[]} An array of points.
 */
export function getCubicBezierPolyline(p0, p1, p2, p3, numPoints = 10) {
    const points = [];
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        points.push(cubicBezier(t, p0, p1, p2, p3));
    }
    return points;
}
