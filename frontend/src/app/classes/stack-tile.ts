import {Tile} from "./tile";
import {ImageRenderingOptions} from "./options";

export class StackTile {
    public tile: Tile;
    public count: number;

    constructor(tile: Tile, count: number, ) {
        this.tile = tile;
        this.count = count;
    }

    show(ctx: CanvasRenderingContext2D) {
        let options: ImageRenderingOptions;
        if(this.count > 0) options = {opacity: 0.6, text: this.count.toString()};
        else options = {opacity: 0.2};

        this.tile.show(ctx, options);
    }
}