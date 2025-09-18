class Rectangle {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    contains(point) {
        return (
            point.x >= this.x - this.w &&
            point.x <= this.x + this.w &&
            point.y >= this.y - this.h &&
            point.y <= this.y + this.h
        );
    }

    intersects(range) {
        return !(
            range.x - range.w > this.x + this.w ||
            range.x + range.w < this.x - this.w ||
            range.y - range.h > this.y + this.h ||
            range.y + range.h < this.y - this.h
        );
    }
}

export class QuadTree {
    constructor(boundary, capacity) {
        this.boundary = boundary; // A Rectangle object
        this.capacity = capacity; // Max number of points in a node
        this.points = []; // The points in this quadtree node
        this.divided = false;
    }

    subdivide() {
        const x = this.boundary.x;
        const y = this.boundary.y;
        const w = this.boundary.w / 2;
        const h = this.boundary.h / 2;

        const ne = new Rectangle(x + w, y - h, w, h);
        this.northeast = new QuadTree(ne, this.capacity);
        const nw = new Rectangle(x - w, y - h, w, h);
        this.northwest = new QuadTree(nw, this.capacity);
        const se = new Rectangle(x + w, y + h, w, h);
        this.southeast = new QuadTree(se, this.capacity);
        const sw = new Rectangle(x - w, y + h, w, h);
        this.southwest = new QuadTree(sw, this.capacity);

        this.divided = true;
    }

    insert(point) {
        if (!this.boundary.contains(point)) {
            return false;
        }

        if (this.points.length < this.capacity) {
            this.points.push(point);
            return true;
        }

        if (!this.divided) {
            this.subdivide();
        }

        if (this.northeast.insert(point)) return true;
        if (this.northwest.insert(point)) return true;
        if (this.southeast.insert(point)) return true;
        if (this.southwest.insert(point)) return true;
    }

    query(range, found) {
        if (!found) {
            found = [];
        }

        if (!this.boundary.intersects(range)) {
            return found;
        }

        for (let p of this.points) {
            if (range.contains(p)) {
                found.push(p);
            }
        }

        if (this.divided) {
            this.northwest.query(range, found);
            this.northeast.query(range, found);
            this.southwest.query(range, found);
            this.southeast.query(range, found);
        }

        return found;
    }
}

// Add a static method to create a QuadTree that covers the whole canvas
QuadTree.create = function(width, height) {
    const boundary = new Rectangle(width / 2, height / 2, width / 2, height / 2);
    return new QuadTree(boundary, 4);
}
// Add the Rectangle class to the export so it can be used for queries
QuadTree.Rectangle = Rectangle;
