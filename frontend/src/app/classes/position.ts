import {Tile} from "./tile";

export class GridPosition {
    i: number;
    j: number;

    constructor(i: number, j: number) {
        this.i = i;
        this.j = j;
    }

    hash(): number {
        let tmp = (this.j +  ((this.i + 1) / 2));
        return this.i + (tmp * tmp);
    }
}

export class CanvasPosition {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x
        this.y = y;
    }

    hash(): number {
        let tmp = (this.y +  ((this.x + 1) / 2));
        return this.x + (tmp * tmp);
    }

    containsPointInCell(pointPosition: CanvasPosition) {
        return pointPosition.y >= this.y
            && pointPosition.y <= this.y + Tile.SIZE
            && pointPosition.x >= this.x
            && pointPosition.x <= this.x + Tile.SIZE;
    }
}