import {Direction, GridDirection} from "./direction";
import {GridPosition} from "./position";

export class Move {
    public position: GridPosition;
    public di: number;
    public dj: number;

    constructor(position: GridPosition, di: number, dj: number) {
        this.position = position;
        this.di = di;
        this.dj = dj;
    }
}

export class MoveGroup {
    public position: GridPosition;
    public directions: Direction[];

    constructor(position: GridPosition, directions: Direction[]) {
        this.position = position;
        this.directions = directions;
    }

    static gridDirectionsToDirection(di: number, dj: number): Direction {
        if(di === -1 && dj === 0) return Direction.UP;
        else if(di === 0 && dj === 1) return Direction.RIGHT;
        else if(di === 1 && dj === 0) return Direction.DOWN;
        else if(di === 0 && dj === -1) return Direction.LEFT;


        return Direction.NONE;
    }

    static directionToGridDirection(direction: Direction): GridDirection {
        if(direction === Direction.UP) return new GridDirection(-1, 0);
        else if(direction === Direction.RIGHT) return new GridDirection(0, 1);
        else if(direction === Direction.DOWN) return new GridDirection(1, 0);
        else if(direction === Direction.LEFT) return new GridDirection(0, -1);

        return new GridDirection(0, 0);
    }
}