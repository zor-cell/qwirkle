import { Injectable } from '@angular/core';
import {Tile} from "../classes/tile";
import {CanvasPosition, GridPosition} from "../classes/position";

@Injectable({
  providedIn: 'root'
})
export class PositionService {

  constructor() { }

  static gridToCanvasPosition(gridPosition: GridPosition): CanvasPosition {
    return new CanvasPosition(gridPosition.j * Tile.SIZE, gridPosition.i * Tile.SIZE);
  }

  static canvasToGridPosition(canvasPosition: CanvasPosition): GridPosition {
    return new GridPosition(Math.floor(canvasPosition.y / Tile.SIZE), Math.floor(canvasPosition.x / Tile.SIZE));
  }
}
