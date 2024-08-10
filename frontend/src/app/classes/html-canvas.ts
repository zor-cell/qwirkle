import {ElementRef} from "@angular/core";
import {CanvasPosition} from "./position";

export class HtmlCanvas {
    private _canvas!: ElementRef<HTMLCanvasElement>;
    private readonly _ctx: CanvasRenderingContext2D;
    private readonly _width: number;
    private readonly _height: number;

    constructor(canvasRef: ElementRef<HTMLCanvasElement>) {
        this._canvas = canvasRef;

        this._ctx = this._canvas.nativeElement.getContext("2d")!;
        this._width = this._canvas.nativeElement.width;
        this._height = this._canvas.nativeElement.height;
    }

    get nativeElement(): HTMLCanvasElement {
        return this._canvas.nativeElement;
    }

    get ctx(): CanvasRenderingContext2D {
        return this._ctx;
    }

    get width(): number {
        return this._width;
    }

    get height(): number {
        return this._height;
    }

    mouseToCanvasPosition(x: number, y: number): CanvasPosition {
        let rect = this.nativeElement.getBoundingClientRect();

        return new CanvasPosition(x - rect.left, y - rect.top);
    }

    isValidMousePosition(mousePos: CanvasPosition): boolean {
        return mousePos.x >= 0 && mousePos.x <= this.width && mousePos.y >= 0 && mousePos.y <= this.height;
    }
}