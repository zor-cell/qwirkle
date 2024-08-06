import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {CanvasPosition, Position, PositionMapper} from "../../classes/position";
import {Tile} from "../../classes/tile";
import {Shape} from "../../classes/shape";
import {Color, ColorMapper} from "../../classes/color";
import {CustomSet} from "../../classes/custom-set";
import {CustomMap} from "../../classes/custom-map";

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent implements AfterViewInit {
  @ViewChild('gameCanvas') canvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;

  private grid : CustomMap<Position, Tile>;
  private hand: Tile[] = [];
  private selected: Tile[] = [];

  constructor() {
    this.grid = new CustomMap<Position, Tile>(pos => pos.hash());

    let a = new Tile(new Position(0, 0), Color.ORANGE, Shape.CIRCLE);
    let b = new Tile(new Position(0, 0), Color.BLUE, Shape.SQUARE);
    let c = new Tile(new Position(0, 0), Color.PURPLE, Shape.CIRCLE);
    let d = new Tile(new Position(0, 0), Color.RED, Shape.CIRCLE);
    let e = new Tile(new Position(0, 0), Color.ORANGE, Shape.STAR4);
    let f = new Tile(new Position(0, 0), Color.BLUE, Shape.STAR4);
    this.hand.push(a);
    this.hand.push(b);
    this.hand.push(c);
    this.hand.push(d);
    this.hand.push(e);
    this.hand.push(f);
  }

  ngAfterViewInit() {
    this.ctx = this.canvas.nativeElement.getContext('2d')!;
    this.width = this.canvas.nativeElement.width;
    this.height = this.canvas.nativeElement.height;

    this.initMap();
    this.grid = this.map1();
    this.draw();
  }

  mouseClick(event: MouseEvent) {
    //click on canvas
    let rect = this.canvas.nativeElement.getBoundingClientRect();
    let mousePos = new CanvasPosition(event.clientX - rect.left, event.clientY - rect.top);

    if(mousePos.x < 0 || mousePos.x > this.width || mousePos.y < 0 || mousePos.y > this.height) return;

    //check for hand tile selection
    for(let tile of this.hand) {
      let canvasPos = PositionMapper.gridToCanvasPosition(tile.position);
      if(canvasPos.containsPoint(mousePos)) {
        let index = this.selected.indexOf(tile);
        if(index === -1) {
          this.selected.push(tile);
        } else {
          this.selected.splice(index, 1);
        }

        this.draw();
        break;
      }
    }

    //check for tile placing
    if(this.selected.length === 0) return;

    let temp = this.selected[0];
    let legalMoves = this.getLegalPositions(temp);
    for(let pos of legalMoves.values()) {
      let canvasPos = PositionMapper.gridToCanvasPosition(pos);
      if(canvasPos.containsPoint(mousePos)) {
        this.selected.splice(0, 1);
        this.hand.splice(this.hand.indexOf(temp), 1);
        this.placeTile(pos, temp);
        break;
      }
    }
  }

  private placeTile(pos: Position, tile: Tile) {
    tile.position = pos;

    let score = this.computeScore(tile.position, tile);
//    console.log(score);
    this.grid.add(tile.position, tile);

    //console.log(this.selected, this.hand);

    this.draw();
  }


  private draw() {
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
      this.drawCell(pos, "#0aa");
    }

    //draw legal spots
    if(this.selected.length > 0) {
      let temp = this.selected[0];
      let legal = this.getLegalPositions(temp);
      for (let pos of legal.values()) {
        this.drawCell(pos, "#f00", true);
      }
    }

    //draw hand
    for(let j = 0;j < this.hand.length;j++) {
      let tile = this.hand[j];
      tile.position = new Position(0.1, j + 0.1 * (j + 1));
      tile.show(this.ctx);

      if(this.selected.includes(tile)) {
        this.drawCell(tile.position, "#f00");
      }
    }
  }

  private drawCell(pos: Position, color: string = "#000", clear: boolean = false) {
    let canvasPosition = PositionMapper.gridToCanvasPosition(pos);

    if(clear) this.ctx.clearRect(canvasPosition.x, canvasPosition.y, Tile.SIZE, Tile.SIZE)

    this.ctx.beginPath();
    this.ctx.rect(canvasPosition.x, canvasPosition.y, Tile.SIZE, Tile.SIZE);
    this.ctx.strokeStyle = color;
    this.ctx.stroke();
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

  private getLegalPositions(tile: Tile): CustomSet<Position> {
    let legal = new CustomSet<Position>(pos => pos.hash());

    let free = this.getFreePositions();
    for(let pos of free.values()) {
      if(this.isLegalPosition(pos, tile)) {
        legal.add(pos);
      }
    }

    return legal;
  }

  //indicates whether the tile placement would be valid
  private isLegalPosition(position: Position, tile: Tile): boolean {
    //cannot be placed if position is already occupied
    if(this.grid.has(position)) return false;

    //go through all 4 directions from the tile
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

      //the neighbors in the current direction have: the same color as the tile, do not contain the shape of the tile
      let sameColorMissingShape = color === tile.color && (shape & tile.shape) === 0;
      //the neighbors in the current direction have: the same shape as the tile, do not contain the color of the tile
      let sameShapeMissingColor = shape === tile.shape && (color & tile.color) === 0;

      //if the tile does not match color or shape, it cannot be placed
      if(!sameColorMissingShape && !sameShapeMissingColor) return false;
    }

    return true;
  }

  //indicates whether the tile placement would be valid
  private computeScore(position: Position, tile: Tile): number {
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

      score += ColorMapper.bitCount(color);
      score += ColorMapper.bitCount(shape);
      if(score === 6) score *= 2;

      //the neighbors in the current direction have: the same color as the tile, do not contain the shape of the tile
      let sameColorMissingShape = color === tile.color && (shape & tile.shape) === 0;
      //the neighbors in the current direction have: the same shape as the tile, do not contain the color of the tile
      let sameShapeMissingColor = shape === tile.shape && (color & tile.color) === 0;

      //if the tile does not match color or shape, it cannot be placed
      if(!sameColorMissingShape && !sameShapeMissingColor) return 0;
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
