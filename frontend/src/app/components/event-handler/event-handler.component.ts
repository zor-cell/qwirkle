import { Component } from '@angular/core';
import {Subject} from "rxjs";
import {Tile} from "../../classes/tile";

@Component({
  selector: 'app-event-handler',
  templateUrl: './event-handler.component.html',
  styleUrl: './event-handler.component.css'
})
export class EventHandlerComponent {
  placeTilesEvent: Subject<Tile[]> = new Subject<Tile[]>();
  selectTileInStackEvent: Subject<Tile> = new Subject<Tile>();
  selectTilesInHandEvent: Subject<Tile[]> = new Subject<Tile[]>();
  handTilesInHandEvent: Subject<Tile[]> = new Subject<Tile[]>();

  constructor() {}

  getPlaceTilesEvent(placedTiles: Tile[]) {
    this.placeTilesEvent.next(placedTiles);
  }

  getSelectTileInStackEvent(selectedTile: Tile) {
    this.selectTileInStackEvent.next(selectedTile);
  }

  getSelectTilesInHandEvent(selectedTiles: Tile[]) {
    this.selectTilesInHandEvent.next(selectedTiles);
  }

  getHandTilesInHandEvent(handTiles: Tile[]) {
    this.handTilesInHandEvent.next(handTiles);
  }
}
