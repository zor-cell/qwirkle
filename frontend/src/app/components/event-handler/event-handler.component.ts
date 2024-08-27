import { Component } from '@angular/core';
import {Subject} from "rxjs";
import {Tile} from "../../classes/tile";
import {Move} from "../../classes/move";

@Component({
  selector: 'app-event-handler',
  templateUrl: './event-handler.component.html',
  styleUrl: './event-handler.component.css'
})
export class EventHandlerComponent {
  placeTileFromGameEvent: Subject<Tile[]> = new Subject<Tile[]>();
  selectTileFromStackEvent: Subject<Tile> = new Subject<Tile>();
  selectTilesFromHandEvent: Subject<Tile[]> = new Subject<Tile[]>();
  handTilesFromHandEvent: Subject<Tile[]> = new Subject<Tile[]>();
  bestMoveFromGameEvent: Subject<Move> = new Subject<Move>();

  constructor() {}

  getPlaceTilesFromGameEvent(placedTiles: Tile[]) {
    this.placeTileFromGameEvent.next(placedTiles);
  }

  getSelectTileFromStackEvent(selectedTile: Tile) {
    this.selectTileFromStackEvent.next(selectedTile);
  }

  getSelectTilesFromHandEvent(selectedTiles: Tile[]) {
    this.selectTilesFromHandEvent.next(selectedTiles);
  }

  getHandTilesFromHandEvent(handTiles: Tile[]) {
    this.handTilesFromHandEvent.next(handTiles);
  }

  getBestMoveFromGameEvent(bestMove: Move) {
    this.bestMoveFromGameEvent.next(bestMove);
  }
}
