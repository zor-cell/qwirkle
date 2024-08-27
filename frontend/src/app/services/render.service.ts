import { Injectable } from '@angular/core';
import {CanvasPosition, GridPosition} from "../classes/position";
import {Tile} from "../classes/tile";
import {CellRenderOptions} from "../classes/options";
import {PositionService} from "./position.service";
import {Direction, SimpleDirection} from "../classes/direction";

@Injectable({
  providedIn: 'root'
})
export class RenderService {

  constructor() { }

  drawBelowCellFromGridPos(ctx: CanvasRenderingContext2D, pos: GridPosition, options: CellRenderOptions = {}) {
    this.drawBelowCell(ctx, pos.asCanvasPosition(), options);
  }

  drawBelowCell(ctx: CanvasRenderingContext2D, pos: CanvasPosition, options: CellRenderOptions = {}) {
    if(options.clear) ctx.clearRect(pos.x, pos.y, Tile.SIZE, Tile.SIZE);
    if(options.color) {
      ctx.fillStyle = options.color;
      ctx.strokeStyle = options.color;
    }
    if(options.lineWidth) {
      ctx.lineWidth = options.lineWidth;
    }
    if(options.opacity) ctx.globalAlpha = options.opacity;

    ctx.beginPath();
    ctx.rect(pos.x, pos.y + Tile.SIZE, Tile.SIZE, 10);

    if(options.fill) ctx.fill();
    else ctx.stroke();

    if(options.text) {
      ctx.fillText(options.text, pos.x + 2, pos.y + 8);
    }

    ctx.globalAlpha = 1;
  }

  //draws a cell from a grid position
  drawCellFromGridPos(ctx: CanvasRenderingContext2D, pos: GridPosition, options: CellRenderOptions = {}) {
    this.drawCell(ctx, PositionService.gridToCanvasPosition(pos), options);
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
    if(options.opacity) ctx.globalAlpha = options.opacity;

    ctx.beginPath();
    ctx.rect(pos.x, pos.y, Tile.SIZE, Tile.SIZE);

    if(options.fill) ctx.fill();
    else ctx.stroke();

    if(options.text) {
      ctx.fillText(options.text, pos.x + 2, pos.y + 8);
    }

    ctx.globalAlpha = 1;
  }

  drawCellDirectionFromGridPos(ctx: CanvasRenderingContext2D, pos: GridPosition, direction: Direction, options: CellRenderOptions = {fill: true}) {
    this.drawCellDirection(ctx, PositionService.gridToCanvasPosition(pos), direction, options);
  }

  drawCellDirection(ctx: CanvasRenderingContext2D, pos: CanvasPosition, direction: Direction, options: CellRenderOptions = {fill: true}) {
    //console.log(options);
    const SIZE = 3;
    let x = pos.x;
    let y = pos.y;
    let w = 0;
    let h = 0;

    if(direction.d === SimpleDirection.UP) {
      w = Tile.SIZE;
      h = SIZE;
    } else if(direction.d === SimpleDirection.DOWN) {
      y += Tile.SIZE - SIZE;
      w = Tile.SIZE;
      h = SIZE;
    } else if(direction.d === SimpleDirection.LEFT) {
      h = Tile.SIZE;
      w = SIZE;
    } else if(direction.d === SimpleDirection.RIGHT) {
      x += Tile.SIZE - SIZE;
      h = Tile.SIZE;
      w = SIZE;
    }

    ctx.beginPath();
    ctx.rect(x, y, w, h);
    if(options.fill) ctx.fill();
    else ctx.stroke();
  }
}
