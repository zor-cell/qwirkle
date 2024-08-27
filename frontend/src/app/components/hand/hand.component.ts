import {AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {Tile} from "../../classes/tile";
import {CanvasPosition, GridPosition} from "../../classes/position";
import {Color} from "../../classes/color";
import {Shape} from "../../classes/shape";
import {GameComponent} from "../game/game.component";
import {Observable} from "rxjs";
import {CellRenderOptions, ImageRenderingOptions} from "../../classes/options";
import {RenderService} from "../../services/render.service";
import {BitfilterService} from "../../services/bitfilter.service";
import {HtmlCanvas} from "../../classes/html-canvas";
import {PositionService} from "../../services/position.service";
import {Move} from "../../classes/move";

@Component({
  selector: 'app-hand',
  templateUrl: './hand.component.html',
  styleUrl: './hand.component.css'
})
export class HandComponent implements OnInit, AfterViewInit {
  @Input() placeTilesFromGameEvent!: Observable<Tile[]>; //tiles are placed in game component
  @Input() bestMoveFromGameEvent!: Observable<Move>; //best move is computed in game component
  @Input() selectTileFromStackEvent!: Observable<Tile>; //tile is selected in stack component
  @Output() handTilesEvent = new EventEmitter<Tile[]>(); //tiles that are in hand
  @Output() selectTilesEvent = new EventEmitter<Tile[]>(); //tiles are selected in hand component

  @ViewChild('handCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private canvas!: HtmlCanvas;

  private hand: Tile[] = [];
  private selected: Tile[] = [];
  private bestMove: Move | null = null;

  constructor(private renderService: RenderService, private bitfilterService: BitfilterService) {}

  private findIndex(arr: Tile[], tile: Tile) {
    for(let i = 0;i < arr.length;i++) {
      if(arr[i].color === tile.color && arr[i].shape === tile.shape) {
        return i;
      }
    }

    return -1;
  }

  ngOnInit() {
    this.placeTilesFromGameEvent.subscribe(placedTiles => {
      for(let tile of placedTiles) {
        let handIndex = this.findIndex(this.hand, tile);
        if(handIndex >= 0) this.hand.splice(handIndex, 1);
      }
      this.selected = [];

      this.draw();
      this.handTilesEvent.emit(this.hand);
      this.selectTilesEvent.emit(this.selected);
    });


    this.selectTileFromStackEvent.subscribe(selectedTile => {
      //limit hand tiles
      if(this.hand.length < 6) {
        this.hand.push(selectedTile);
        this.draw();
      }

      this.handTilesEvent.emit(this.hand);
    });

    this.bestMoveFromGameEvent.subscribe(bestMove => {
      this.bestMove = bestMove;

      //we need reference of hand tiles not any tiles.
      let correctTiles: Tile[] = [];
      for(let tile of bestMove.tiles) {
        let index = this.findIndex(this.hand, tile);
        correctTiles.push(this.hand[index]);
      }
      this.bestMove.tiles = correctTiles;

      this.draw();

      console.log(this.bestMove);
    })
  }

  ngAfterViewInit() {
    this.initHand();

    this.canvas = new HtmlCanvas(this.canvasRef);
    this.draw();
  }

  draw() {
    if(this.canvas === undefined) return;

    this.canvas.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    //draw hand
    for(let j = 0;j < this.hand.length;j++) {
      let tile = this.hand[j];
      tile.position = new GridPosition(0.1, j + 0.1 * (j + 1));

      let index = this.selected.indexOf(tile);
      let options: ImageRenderingOptions = {text: (index + 1).toString()};
      if(index >= 0) tile.show(this.canvas.ctx, options);
      else tile.show(this.canvas.ctx);

      if(this.selected.includes(tile)) {
        //highlight selected hand tiles
        this.renderService.drawCellFromGridPos(this.canvas.ctx, tile.position, {color: "#f00", lineWidth: 3});
        //tile.show(this.canvas.ctx, {opacity: 0.8})
      } else {
        //grey out incompatible hand tiles
        if (this.selected.length > 0) {
          let color = this.selected.map(selectedTile => selectedTile.color).reduce((a, b) => a | b);
          let shape = this.selected.map(selectedTile => selectedTile.shape).reduce((a, b) => a | b);

          if (!this.bitfilterService.isCompatible(color, shape, tile.color, tile.shape)) {
            tile.show(this.canvas.ctx, {opacity: 0.3});
          }
        }
      }
    }

    //TODO draw best move tiles
    if(this.bestMove) {
      for (let i = 0;i < this.bestMove.tiles.length; i++) {
        let tile = this.bestMove.tiles[i];
        this.renderService.drawBelowCellFromGridPos(this.canvas.ctx, tile.position, {color: Move.bestMoveColors[i], fill: true});
      }
    }
  }

  mouseClick(event: MouseEvent) {
    let mousePos = this.canvas.mouseToCanvasPosition(event.clientX, event.clientY);
    if(!this.canvas.isValidMousePosition(mousePos)) return;

    //check for hand tile selection
    for(let tile of this.hand) {
      let canvasPos = PositionService.gridToCanvasPosition(tile.position);
      if(canvasPos.containsPointInCell(mousePos)) {
        //select or deselect pressed tile
        let index = this.selected.indexOf(tile);
        if(index === -1) {
          //first tile is always valid
          if(this.selected.length === 0) {
            this.selected.push(tile);
            break;
          }

          //select pressed tile if it is valid
          let color = this.selected.map(selectedTile => selectedTile.color).reduce((a, b) => a | b);
          let shape = this.selected.map(selectedTile => selectedTile.shape).reduce((a, b) => a | b);

          if(this.bitfilterService.isCompatible(color, shape, tile.color, tile.shape)) {
            this.selected.push(tile);
          } else {
            //if invalid do nothing
            return;
          }
        } else {
          //deselect pressed tile
          this.selected.splice(index, 1);
        }

        break;
      }
    }

    this.draw();
    this.selectTilesEvent.emit(this.selected);
  }

  private  initHand() {
    let a = new Tile(new GridPosition(0, 0), Color.ORANGE, Shape.CIRCLE);
    let b = new Tile(new GridPosition(0, 0), Color.BLUE, Shape.SQUARE);
    let c = new Tile(new GridPosition(0, 0), Color.PURPLE, Shape.CIRCLE);
    let d = new Tile(new GridPosition(0, 0), Color.RED, Shape.CIRCLE);
    let e = new Tile(new GridPosition(0, 0), Color.ORANGE, Shape.STAR4);
    let f = new Tile(new GridPosition(0, 0), Color.BLUE, Shape.STAR4);
    this.hand.push(a);
    this.hand.push(b);
    this.hand.push(c);
    this.hand.push(d);
    this.hand.push(e);
    this.hand.push(f);

    this.handTilesEvent.emit(this.hand);
  }
}
