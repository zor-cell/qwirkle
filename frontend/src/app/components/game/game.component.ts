import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {CanvasPosition, Position, PositionMapper} from "../../classes/position";
import {Tile} from "../../classes/tile";
import {Shape} from "../../classes/shape";
import {Color, ColorMapper} from "../../classes/color";
import {CustomSet} from "../../classes/custom-set";
import {CustomMap} from "../../classes/custom-map";
import {HandComponent} from "../hand/hand.component";
import {Subject} from "rxjs";
import {RenderService} from "../../services/render.service";
import {BitfilterService} from "../../services/bitfilter.service";

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent implements AfterViewInit {
  //an event that is triggered when a tile is placed (allows communication with hand component)
  placeTileEvent: Subject<Tile> = new Subject<Tile>();

  @ViewChild('gameCanvas') canvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;

  private grid : CustomMap<Position, Tile>;
  private selected: Tile[] = [];

  constructor(private renderService: RenderService, private bitfilterService: BitfilterService) {
    this.grid = new CustomMap<Position, Tile>(pos => pos.hash());
  }

  ngAfterViewInit() {
    this.ctx = this.canvas.nativeElement.getContext('2d')!;
    this.width = this.canvas.nativeElement.width;
    this.height = this.canvas.nativeElement.height;

    this.grid = this.map1();

    this.draw();
  }

  //gets the selected tiles from the hand component
  getSelected(selected: Tile[]) {
    this.selected = selected;
    this.draw();
  }

  mouseClick(event: MouseEvent) {
    //click on canvas
    let rect = this.canvas.nativeElement.getBoundingClientRect();
    let mousePos = new CanvasPosition(event.clientX - rect.left, event.clientY - rect.top);

    if(mousePos.x < 0 || mousePos.x > this.width || mousePos.y < 0 || mousePos.y > this.height) return;

    //check for tile placing
    if(this.selected.length === 0) return;

    let temp = this.selected[0];
    let legalMoves = this.getLegalPositions(temp);
    for(let pos of legalMoves.values()) {
      let canvasPos = PositionMapper.gridToCanvasPosition(pos);
      if(canvasPos.containsPoint(mousePos)) {
        this.placeTile(pos, temp);
        this.placeTileEvent.next(temp);
        break;
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    //draw tiles
    this.ctx.beginPath();
    for(let tile of this.grid.values()) {
      tile.show(this.ctx);
    }
    this.ctx.stroke();

    //draw free spots
    let free = this.getFreePositions();
    for(let pos of free.values()) {
      this.renderService.drawCellFromGridPos(this.ctx, pos, {color: "#0aa"});
    }

    //draw legal spots
    if(this.selected.length > 0) {
      let temp = this.selected[0];
      let legal = this.getLegalPositions(temp);
      for (let pos of legal.values()) {
        this.renderService.drawCellFromGridPos(this.ctx, pos, {color: "#f00", clear: true});
      }
    }
  }

  //places a tile at the given position
  private placeTile(pos: Position, tile: Tile) {
    tile.position = pos;
    this.grid.add(tile.position, tile);

    this.draw();
  }

  //retrieves all open raster spots, ie all neighbor tile fields that are not occupied
  private getFreePositions(): CustomSet<Position> {
    let free = new CustomSet<Position>(pos => pos.hash());

    let di = [-1, 1, 0, 0];
    let dj = [0, 0, -1, 1];
    for(let tile of this.grid.values()) {
      for(let d = 0;d < 4;d++) {
        let pos: Position = new Position(tile.position.i + di[d], tile.position.j + dj[d]);
        if(!this.grid.has(pos)) {
          free.add(pos);
        }
      }
    }

    return free;
  }

  //all legal positions for a single tile
  private getLegalPositions(tile: Tile): CustomSet<Position> {
    let legal = new CustomSet<Position>(pos => pos.hash());

    let free = this.getFreePositions();
    for(let pos of free.values()) {
      if(this.computeMoveScore(pos, tile) > 0) {
        legal.add(pos);
      }
    }

    return legal;
  }

  //computes the score a given move achieves
  //if the score is 0, the move is invalid
  private computeMoveScore(position: Position, tile: Tile): number {
    //cannot be placed if position is already occupied
    if(this.grid.has(position)) return 0;

    //go through all 4 directions from the tile
    let score = 0;
    let di = [-1, 1, 0, 0];
    let dj = [0, 0, -1, 1];
    for(let d = 0;d < 4;d++) {
      let pos: Position = new Position(position.i + di[d],position.j + dj[d]);
      let color = Color.NONE;
      let shape = Shape.NONE;

      //continue if neighbor is empty
      if(!this.grid.has(pos)) continue;

      //accumulate neighbors colors and shapes in current direction
      while(this.grid.has(pos)) {
        let neighbor = this.grid.get(pos)!;

        color |= neighbor.color;
        shape |= neighbor.shape;

        pos = new Position(pos.i + di[d],pos.j + dj[d]);
      }

      score += this.bitfilterService.setBitCount(color);
      score += this.bitfilterService.setBitCount(shape);
      if(score === 6) score *= 2;

      if(!this.bitfilterService.isCompatible(color, shape, tile.color, tile.shape)) return 0;
    }

    return score;
  }

  private initMap() {
    let pos = new Position(5, 3);
    let orangeCircle = new Tile(pos, Color.ORANGE, Shape.CIRCLE);
    this.grid.add(pos, orangeCircle);

    pos = new Position(6, 3);
    let purpleSquare = new Tile(pos, Color.PURPLE, Shape.SQUARE);
    this.grid.add(pos, purpleSquare);

    pos = new Position(7, 3);
    let yellowDiamond = new Tile(pos, Color.YELLOW, Shape.DIAMOND);
    this.grid.add(pos, yellowDiamond);

    pos = new Position(5, 4);
    let redClover = new Tile(pos, Color.RED, Shape.CLOVER);
    this.grid.add(pos, redClover);

    pos = new Position(5, 5);
    let greenStar4 = new Tile(pos, Color.GREEN, Shape.STAR4);
    this.grid.add(pos, greenStar4);

    pos = new Position(5, 6);
    let blueStar8 = new Tile(pos, Color.BLUE, Shape.STAR8);
    this.grid.add(pos, blueStar8);
  }

  private map1(): CustomMap<Position, Tile> {
    let map = new CustomMap<Position, Tile>(pos => pos.hash());

    let pos = new Position(6, 3);
    let tile = new Tile(pos, Color.RED, Shape.CIRCLE);
    map.add(pos, tile);

    pos = new Position(6, 4);
    tile = new Tile(pos, Color.RED, Shape.CLOVER);
    map.add(pos, tile);

    pos = new Position(6, 5);
    tile = new Tile(pos, Color.RED, Shape.STAR8);
    map.add(pos, tile);

    pos = new Position(6, 6);
    tile = new Tile(pos, Color.RED, Shape.STAR4);
    map.add(pos, tile);

    pos = new Position(5, 6);
    tile = new Tile(pos, Color.YELLOW, Shape.STAR4);
    map.add(pos, tile);

    pos = new Position(4, 6);
    tile = new Tile(pos, Color.GREEN, Shape.STAR4);
    map.add(pos, tile);

    pos = new Position(3, 6);
    tile = new Tile(pos, Color.PURPLE, Shape.STAR4);
    map.add(pos, tile);

    pos = new Position(2, 6);
    tile = new Tile(pos, Color.ORANGE, Shape.STAR4);
    map.add(pos, tile);

    pos = new Position(2, 7);
    tile = new Tile(pos, Color.ORANGE, Shape.SQUARE);
    map.add(pos, tile);

    pos = new Position(4, 5);
    tile = new Tile(pos, Color.GREEN, Shape.CLOVER);
    map.add(pos, tile);

    pos = new Position(4, 7);
    tile = new Tile(pos, Color.GREEN, Shape.STAR8);
    map.add(pos, tile);

    pos = new Position(4, 8);
    tile = new Tile(pos, Color.GREEN, Shape.CIRCLE);
    map.add(pos, tile);

    pos = new Position(3, 8);
    tile = new Tile(pos, Color.YELLOW, Shape.CIRCLE);
    map.add(pos, tile);

    return map;
  }
}
