import {Direction, SimpleDirection} from "./direction";
import {GridPosition} from "./position";

export class Move {
    public position: GridPosition;
    public direction: Direction;

    constructor(position: GridPosition, direction: Direction) {
        this.position = position;
        this.direction = direction;
    }
}

export class MoveGroup {
    public position: GridPosition;
    public directions: Direction[];

    constructor(position: GridPosition, directions: Direction[]) {
        this.position = position;
        this.directions = directions;
    }

    get moves(): Move[] {
        return this.directions
            .map(direction => new Move(this.position, direction));
    }
}