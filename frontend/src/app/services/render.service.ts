import { Injectable } from '@angular/core';
import {CanvasPosition, Position, PositionMapper} from "../classes/position";
import {Tile} from "../classes/tile";
import {CellRenderOptions} from "../classes/options";

@Injectable({
  providedIn: 'root'
})
export class RenderService {

  constructor() { }

  //draws a cell from a grid position
  drawCellFromGridPos(ctx: CanvasRenderingContext2D, pos: Position, options: CellRenderOptions = {}) {
    this.drawCell(ctx, PositionMapper.gridToCanvasPosition(pos), options);
  }

  //draws a cell from a canvas position
  drawCell(ctx: CanvasRenderingContext2D, pos: CanvasPosition, options: CellRenderOptions = {}) {
    if(options.clear) ctx.clearRect(pos.x, pos.y, Tile.SIZE, Tile.SIZE);
    if(options.color) {
      ctx.fillStyle = options.color;
      ctx.strokeStyle = options.color;
    }
    if(options.lineWidth) {
      ctx.lineWidth = options.lineWidth;
    }

    ctx.beginPath();
    ctx.rect(pos.x, pos.y, Tile.SIZE, Tile.SIZE);

    if(options.fill) ctx.fill();
    else ctx.stroke();
  }
}
