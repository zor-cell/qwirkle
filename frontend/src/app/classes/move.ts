import {Direction, SimpleDirection} from "./direction";
import {GridPosition} from "./position";
import {Tile} from "./tile";

export class Move {
    public position: GridPosition;
    public direction: Direction;

    constructor(position: GridPosition, direction: Direction) {
        this.position = position;
        this.direction = direction;
    }
}

export class FinalMove {
    public position: GridPosition;
    public direction: Direction;
    public tiles: Tile[];
    public score: number;

    constructor(position: GridPosition, direction: Direction, tiles: Tile[], score: number) {
        this.position = position;
        this.direction = direction;
        this.tiles = tiles;
        this.score = score;
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