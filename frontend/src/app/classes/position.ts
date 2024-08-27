import {Tile} from "./tile";
import {Direction} from "./direction";

export class GridPosition {
    private readonly _i: number;
    private readonly _j: number;

    constructor(i: number, j: number) {
        this._i = i;
        this._j = j;
    }

    get i(): number {
        return this._i;
    }

    get j(): number {
        return this._j;
    }

    asCanvasPosition(): CanvasPosition {
        return new CanvasPosition(this.j * Tile.SIZE, this.i * Tile.SIZE);
    }

    hash(): number {
        let tmp = (this.j +  ((this.i + 1) / 2));
        return this.i + (tmp * tmp);
    }

    copy(): GridPosition {
        return new GridPosition(this.i, this.j);
    }

    stepsInDirection(direction: Direction, steps: number = 1): GridPosition {
        return new GridPosition(this.i + direction.di * steps, this.j + direction.dj * steps);
    }
}

export class CanvasPosition {
    private readonly _x: number;
    private readonly _y: number;

    constructor(x: number, y: number) {
        this._x = x
        this._y = y;
    }

    get x(): number {
        return this._x;
    }

    get y(): number {
        return this._y;
    }

    asGridPosition(): GridPosition {
        return new GridPosition(Math.floor(this.y / Tile.SIZE), Math.floor(this.x / Tile.SIZE));
    }

    hash(): number {
        let tmp = (this.y +  ((this.x + 1) / 2));
        return this.x + (tmp * tmp);
    }

    copy(): CanvasPosition {
        return new CanvasPosition(this.x, this.y);
    }

    containsPointInCell(pointPosition: CanvasPosition) {
        return pointPosition.y >= this.y
            && pointPosition.y <= this.y + Tile.SIZE
            && pointPosition.x >= this.x
            && pointPosition.x <= this.x + Tile.SIZE;
    }
}