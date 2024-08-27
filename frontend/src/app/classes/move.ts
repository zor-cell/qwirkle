import {Direction, SimpleDirection} from "./direction";
import {GridPosition} from "./position";
import {Tile} from "./tile";

export class Move {
    //public static bestMoveColors = ["#41afaa", "#466eb4", "#00a0e1", "#e6a532", "#d7642c", "#af4b91"];
    public static bestMoveColors = ["#af4b91", "#42adc7", "#81d152", "#f5f263", "#ff9d4f", "#ff5347"];
    //["#060", "#090", "#0c0", "#0c0", "#0c0", "#0c0"];

    public position: GridPosition;
    public direction: Direction;
    public tiles: Tile[];
    public score: number;

    constructor(position: GridPosition, direction: Direction, tiles: Tile[], score: number) {
        this.position = position.copy();
        this.direction = direction.copy();
        this.tiles = tiles;
        this.score = score;
    }
}

export class MoveGroup {
    public position: GridPosition;
    public directions: Direction[];

    constructor(position: GridPosition, directions: Direction[]) {
        this.position = position.copy();
        this.directions = directions.map(d => d.copy());
    }
}