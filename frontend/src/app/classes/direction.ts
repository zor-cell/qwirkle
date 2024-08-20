export enum SimpleDirection {
    NONE,
    UP,
    RIGHT,
    DOWN,
    LEFT
}

export class Direction {
    private readonly _direction: SimpleDirection;

    constructor(d: SimpleDirection);
    constructor(di: number, dj: number);
    constructor(param1: SimpleDirection | number, param2?: number) {
        if(param1 satisfies SimpleDirection && param2 === undefined) {
            //1 direction
            this._direction = param1;
        } else {
            //2 numbers
            this._direction = this.gridToSimpleDirection(param1, param2!);
        }
    }

    private gridToSimpleDirection(di: number, dj: number) {
        if(di === -1 && dj === 0) return SimpleDirection.UP;
        else if(di === 0 && dj === 1) return SimpleDirection.RIGHT;
        else if(di === 1 && dj === 0) return SimpleDirection.DOWN;
        else if(di === 0 && dj === -1) return SimpleDirection.LEFT;

        return SimpleDirection.NONE;
    }

    get d(): SimpleDirection {
        return this._direction;
    }

    get di(): number {
        if(this._direction === SimpleDirection.UP) return -1;
        else if(this._direction === SimpleDirection.DOWN) return 1;

        return 0;
    }

    get dj(): number {
        if(this._direction === SimpleDirection.LEFT) return -1;
        else if(this._direction === SimpleDirection.RIGHT) return 1;

        return 0;
    }

    get inverse(): Direction {
        return new Direction(-this.di, -this.dj);
    }

    rotate90Deg(): Direction {
        if(this.d === SimpleDirection.UP) return new Direction(SimpleDirection.RIGHT);
        else if(this.d === SimpleDirection.RIGHT) return new Direction(SimpleDirection.DOWN);
        else if(this.d === SimpleDirection.DOWN) return new Direction(SimpleDirection.LEFT);
        else if(this.d === SimpleDirection.LEFT) return new Direction(SimpleDirection.UP);

        return new Direction(SimpleDirection.NONE);
    }

    static noDirection(): Direction {
        return new Direction(SimpleDirection.NONE);
    }

    static allDirections(): Direction[] {
        let simpleDirections = [SimpleDirection.UP, SimpleDirection.RIGHT, SimpleDirection.DOWN, SimpleDirection.LEFT];
        return simpleDirections.map(simpleDirection => new Direction(simpleDirection));
    }
}