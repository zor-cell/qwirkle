import {CanvasPosition, GridPosition} from "./position";
import {Color} from "./color";
import {Shape} from "./shape";
import {ImageRenderingOptions} from "./options";
import {ColorService} from "../services/color.service";
import {PositionService} from "../services/position.service";

export class Tile {
    public static SIZE = 40;
    private static cache = new Map<number, string>();

    public position: GridPosition;
    public color: Color;
    public shape: Shape;

    constructor(position: GridPosition, color: Color, shape: Shape) {
        this.position = position.copy();
        this.color = color;
        this.shape = shape;
    }

    show(ctx: CanvasRenderingContext2D, options: ImageRenderingOptions = {}) {
        let canvasPos = PositionService.gridToCanvasPosition(this.position);

        if(Tile.cache.has(this.shape)) {
            let img = new Image();
            img.onload = () => {
                ctx.clearRect(canvasPos.x, canvasPos.y, Tile.SIZE, Tile.SIZE);
                ctx.drawImage(img, canvasPos.x, canvasPos.y, Tile.SIZE, Tile.SIZE);
                if(options.text) {
                    ctx.font = "12px Arial";
                    ctx.fillStyle = "black";
                    ctx.fillText(options.text, canvasPos.x + Tile.SIZE / 2 - 4, canvasPos.y + Tile.SIZE / 2 + 4);
                }

                URL.revokeObjectURL(img.src);
            }

            let text = Tile.cache.get(this.shape)!;
            let color = ColorService.mapColorToHex(this.color);
            let updatedText = text.replace('fill="#f00"', `fill="${color}"`)
            if(options.opacity) updatedText = updatedText.replace('opacity="1"', `opacity="${options.opacity}"`);
            let updatedSvg = new Blob([updatedText], {type: 'image/svg+xml'});
            img.src = URL.createObjectURL(updatedSvg);
        } else {
            fetch(`assets/${Shape[this.shape].toString().toLowerCase()}.svg`)
                .then(response => response.text())
                .then(text => {
                    Tile.cache.set(this.shape, text);
                    this.show(ctx, options);
                })
        }
    }

    /**
     * Indicates whether a tile is compatible with a given color and a given shape.
     * Compatible means, that the tiles color or shape is missing from the given ones.
     * @param color
     * @param shape
     */
    isCompatible(color: Color, shape: Shape): boolean {
        //if the color is the same, the shape has to be different
        let sameColorMissingShape = this.color === color && (this.shape & shape) === 0;
        //if the shape is the same, the color has to be different
        let sameShapeMissingColor = this.shape === shape && (this.color & color) === 0;

        return sameColorMissingShape || sameShapeMissingColor;
    }
}