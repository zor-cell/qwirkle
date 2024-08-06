import {CanvasPosition, Position, PositionMapper} from "./position";
import {Color, ColorMapper} from "./color";
import {Shape} from "./shape";

export class Tile {
    public static SIZE = 40;

    public position: Position;
    public color: Color;
    public shape: Shape;

    private static cache = new Map<number, string>();

    constructor(position: Position, color: Color, shape: Shape) {
        this.position = position;
        this.color = color;
        this.shape = shape;
    }

    show(ctx: CanvasRenderingContext2D) {
        let canvasPos = PositionMapper.gridToCanvasPosition(this.position);

        if(Tile.cache.has(this.shape)) {
            let img = new Image();
            img.onload = () => {
                ctx.drawImage(img, canvasPos.x, canvasPos.y, Tile.SIZE, Tile.SIZE);
            }

            let text = Tile.cache.get(this.shape)!;
            let color = ColorMapper.mapColorToHex(this.color);
            let updatedText = text.replace('fill="#f00"', `fill="${color}"`)
            let updatedSvg = new Blob([updatedText], {type: 'image/svg+xml'});
            img.src = URL.createObjectURL(updatedSvg);
        } else {
            fetch(`assets/${Shape[this.shape].toString().toLowerCase()}.svg`)
                .then(response => response.text())
                .then(text => {
                    Tile.cache.set(this.shape, text);
                    this.show(ctx);
                })
        }
    }
}