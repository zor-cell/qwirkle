export enum Direction {
    NONE,
    UP,
    RIGHT,
    DOWN,
    LEFT
}

export class GridDirection {
    public di: number;
    public dj: number;

    constructor(di: number, dj: number) {
        this.di = di;
        this.dj = dj;
    }
}