import {AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {CanvasPosition, GridPosition} from "../../classes/position";
import {Tile} from "../../classes/tile";
import {Shape} from "../../classes/shape";
import {Color} from "../../classes/color";
import {CustomSet} from "../../classes/custom-set";
import {CustomMap} from "../../classes/custom-map";
import {RenderService} from "../../services/render.service";
import {BitfilterService} from "../../services/bitfilter.service";
import {Observable} from "rxjs";
import {HtmlCanvas} from "../../classes/html-canvas";
import {PositionService} from "../../services/position.service";
import {Move, MoveGroup} from '../../classes/move';
import {Direction} from "../../classes/direction";
//TODO:
// edit mode:
// - adding tiles from stack and not hand
// - removing tiles (misplaced)
// undo button:

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent implements OnInit, AfterViewInit {
  @Input() selectTilesInHandEvent!: Observable<Tile[]>; //tiles are selected in hand component
  @Output() placeTilesEvent = new EventEmitter<Tile[]>(); //tile is placed in game component

  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private canvas!: HtmlCanvas;

  private grid = new CustomMap<GridPosition, Tile>(pos => pos.hash());
  private selectedHand: Tile[] = [];

  private selectedMoveGroup: MoveGroup | null = null;

  constructor(private renderService: RenderService, private bitfilterService: BitfilterService) {}

  ngOnInit() {
    this.selectTilesInHandEvent.subscribe((selectedTiles => {
      this.selectedHand = selectedTiles;
      this.draw();
    }));

    this.grid = this.map1();
  }

  ngAfterViewInit() {
    this.canvas = new HtmlCanvas(this.canvasRef);
    this.draw();
  }

  mouseClick(event: MouseEvent) {
    let mousePos = this.canvas.mouseToCanvasPosition(event.clientX, event.clientY);
    if(!this.canvas.isValidMousePosition(mousePos)) return;

    //check for tile placing
    if(this.selectedHand.length === 0) return;

    //TODO: for efficiency dont check all legal moves, only if the pressed move is legal
    this.draw();
    let legal = this.getLegalPositionMulti(this.selectedHand);

    if(this.selectedMoveGroup != null) {
      let clickInMoveGroup = false;
      for (let direction of this.selectedMoveGroup.directions) {
        let gridDir = MoveGroup.directionToGridDirection(direction);

        //if there is only one tile
        if(direction === Direction.NONE) {
          let canvasPos = PositionService.gridToCanvasPosition(this.selectedMoveGroup.position);
          if(canvasPos.containsPointInCell(mousePos)) {
            let move = new Move(this.selectedMoveGroup.position, 0, 0);
            this.placeTiles(move, this.selectedHand);
            clickInMoveGroup = true;
            break;
          }
        }

        //if there are multiple tiles to place
        for (let i = 1; i < this.selectedHand.length; i++) {
          let tilePos = new GridPosition(this.selectedMoveGroup.position.i + gridDir.di * i, this.selectedMoveGroup.position.j + gridDir.dj * i);
          let tileCanvasPos = PositionService.gridToCanvasPosition(tilePos);
          if (tileCanvasPos.containsPointInCell(mousePos)) {
            console.log(tilePos);
            let move = new Move(this.selectedMoveGroup.position, gridDir.di, gridDir.dj);
            this.placeTiles(move, this.selectedHand);
            clickInMoveGroup = true;
            break;
          }
        }
      }

      this.selectedMoveGroup = null;
      if(clickInMoveGroup) return;
    }

    for(let moveGroup of legal) {
      let canvasPos = PositionService.gridToCanvasPosition(moveGroup.position);
      if(canvasPos.containsPointInCell(mousePos)) {
        //show first tile as it is shown in all directions
        let firstTile = new Tile(moveGroup.position, this.selectedHand[0].color, this.selectedHand[0].shape);
        firstTile.show(this.canvas.ctx, {opacity: 0.5});

        //show tiles in order in every direction
        for(let direction of moveGroup.directions) {
          let gridDir = MoveGroup.directionToGridDirection(direction);
          for(let i = 1;i < this.selectedHand.length;i++) {
            let tilePos = new GridPosition(moveGroup.position.i + gridDir.di * i, moveGroup.position.j + gridDir.dj * i);
            let curTile = new Tile(tilePos, this.selectedHand[i].color, this.selectedHand[i].shape);
            curTile.show(this.canvas.ctx, {opacity: 0.5});
          }
        }

        this.selectedMoveGroup = moveGroup;
      }
    }

    /*let temp = this.selectedHand[0];
    let legalMoves = this.getLegalPositions(temp);
    for(let pos of legalMoves.values()) {
      let canvasPos = PositionService.gridToCanvasPosition(pos);
      if(canvasPos.containsPoint(mousePos)) {
        this.placeTile(pos, temp);
        this.placeTileEvent.emit(temp);
        break;
      }
    }*/
  }

  draw() {
    this.canvas.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    //draw tiles
    this.canvas.ctx.beginPath();
    for(let tile of this.grid.values()) {
      tile.show(this.canvas.ctx);
    }
    this.canvas.ctx.stroke();

    //draw free spots
    let free = this.getFreePositions();
    for(let pos of free.values()) {
      this.renderService.drawCellFromGridPos(this.canvas.ctx, pos, {color: "#0aa", text: pos.i.toString() + "," + pos.j.toString()});
    }

    //draw multi legal
    let legal = this.getLegalPositionMulti(this.selectedHand);
    //console.log("legal", legal);
    for(let move of legal) {
      let options = {color: "#f00", clear: true, text: move.position.i.toString() + "," + move.position.j.toString()};
      this.renderService.drawCellFromGridPos(this.canvas.ctx, move.position, options);
      for(let direction of move.directions) {
        this.renderService.drawCellDirectionFromGridPos(this.canvas.ctx, move.position, direction);
      }
    }
  }

  //places a tile at the given position
  private placeTile(pos: GridPosition, tile: Tile) {
    tile.position = pos;
    this.grid.add(tile.position, tile);

    this.draw();
  }

  private placeTiles(move: Move, tiles: Tile[]) {
    for(let i = 0;i < tiles.length;i++) {
      let tilePos = new GridPosition(move.position.i + move.di * i, move.position.j + move.dj * i);
      let tile = new Tile(tilePos, tiles[i].color, tiles[i].shape);
      this.grid.add(tile.position, tile);
    }

    this.draw();
    this.placeTilesEvent.next(tiles);
  }

  //retrieves all open raster spots, ie all neighbor tile fields that are not occupied
  private getFreePositions(): CustomSet<GridPosition> {
    let free = new CustomSet<GridPosition>(pos => pos.hash());

    let di = [-1, 1, 0, 0];
    let dj = [0, 0, -1, 1];
    for(let tile of this.grid.values()) {
      for(let d = 0;d < 4;d++) {
        let pos: GridPosition = new GridPosition(tile.position.i + di[d], tile.position.j + dj[d]);
        if(!this.grid.has(pos)) {
          free.add(pos);
        }
      }
    }

    return free;
  }

  //order of tiles is important!
  private getLegalPositionMulti(tiles: Tile[]): MoveGroup[] {
    let result: MoveGroup[] = [];

    if(tiles.length === 0) return result;
    else if(tiles.length === 1) return this.getLegalPositions(tiles[0]).values().map(pos => new MoveGroup(pos, [Direction.NONE]));

    let legal = this.getLegalPositions(tiles[0]);

    let di = [-1, 1, 0, 0];
    let dj = [0, 0, -1, 1];
    for (let pos of legal.values()) {
      let curMoveGroup = new MoveGroup(new GridPosition(pos.i, pos.j), []);
      for(let d = 0;d < 4;d++) {
        let tempPositions = [];
        let valid = true;
        let newPos = new GridPosition(pos.i, pos.j);
        this.grid.add(newPos, new Tile(newPos, tiles[0].color, tiles[0].shape));
        tempPositions.push(newPos);
        let index;
        for(index = 1;index < tiles.length;index++) {
          newPos = new GridPosition(newPos.i + di[d], newPos.j + dj[d]);

          let score = this.computeMoveScore(newPos, tiles[index]);
          if (score <= 0) {
            valid = false;
            break;
          }

          this.grid.add(newPos, new Tile(newPos, tiles[index].color, tiles[index].shape));
          tempPositions.push(newPos);
        }

        for(let tempPos of tempPositions) {
          this.grid.delete(tempPos);
        }

        if(valid) {
          //solution found
          let direction = MoveGroup.gridDirectionsToDirection(di[d], dj[d]);
          curMoveGroup.directions.push(direction);
        }
      }
      if(curMoveGroup.directions.length > 0) result.push(curMoveGroup);
    }

    return result;
  }

  //all legal positions for a single tile
  private getLegalPositions(tile: Tile): CustomSet<GridPosition> {
    let legal = new CustomSet<GridPosition>(pos => pos.hash());

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
  private computeMoveScore(position: GridPosition, tile: Tile): number {
    //cannot be placed if position is already occupied
    if(this.grid.has(position)) {
      return 0;
    }

    //go through all 4 directions from the tile
    let score = 0;
    let di = [-1, 1, 0, 0];
    let dj = [0, 0, -1, 1];
    for(let d = 0;d < 4;d++) {
      let pos: GridPosition = new GridPosition(position.i + di[d],position.j + dj[d]);
      let color = Color.NONE;
      let shape = Shape.NONE;

      //continue if neighbor is empty
      if(!this.grid.has(pos)) continue;

      //accumulate neighbors colors and shapes in current direction
      while(this.grid.has(pos)) {
        let neighbor = this.grid.get(pos)!;

        color |= neighbor.color;
        shape |= neighbor.shape;

        pos = new GridPosition(pos.i + di[d],pos.j + dj[d]);
      }

      score += this.bitfilterService.setBitCount(color);
      score += this.bitfilterService.setBitCount(shape);
      if(score === 6) score *= 2;

      if(!this.bitfilterService.isCompatible(color, shape, tile.color, tile.shape)) return 0;
    }

    return score;
  }

  private initMap() {
    let pos = new GridPosition(5, 3);
    let orangeCircle = new Tile(pos, Color.ORANGE, Shape.CIRCLE);
    this.grid.add(pos, orangeCircle);

    pos = new GridPosition(6, 3);
    let purpleSquare = new Tile(pos, Color.PURPLE, Shape.SQUARE);
    this.grid.add(pos, purpleSquare);

    pos = new GridPosition(7, 3);
    let yellowDiamond = new Tile(pos, Color.YELLOW, Shape.DIAMOND);
    this.grid.add(pos, yellowDiamond);

    pos = new GridPosition(5, 4);
    let redClover = new Tile(pos, Color.RED, Shape.CLOVER);
    this.grid.add(pos, redClover);

    pos = new GridPosition(5, 5);
    let greenStar4 = new Tile(pos, Color.GREEN, Shape.STAR4);
    this.grid.add(pos, greenStar4);

    pos = new GridPosition(5, 6);
    let blueStar8 = new Tile(pos, Color.BLUE, Shape.STAR8);
    this.grid.add(pos, blueStar8);
  }

  private map1(): CustomMap<GridPosition, Tile> {
    let map = new CustomMap<GridPosition, Tile>(pos => pos.hash());

    let pos = new GridPosition(6, 3);
    let tile = new Tile(pos, Color.RED, Shape.CIRCLE);
    map.add(pos, tile);

    pos = new GridPosition(6, 4);
    tile = new Tile(pos, Color.RED, Shape.CLOVER);
    map.add(pos, tile);

    pos = new GridPosition(6, 5);
    tile = new Tile(pos, Color.RED, Shape.STAR8);
    map.add(pos, tile);

    pos = new GridPosition(6, 6);
    tile = new Tile(pos, Color.RED, Shape.STAR4);
    map.add(pos, tile);

    pos = new GridPosition(5, 6);
    tile = new Tile(pos, Color.YELLOW, Shape.STAR4);
    map.add(pos, tile);

    pos = new GridPosition(4, 6);
    tile = new Tile(pos, Color.GREEN, Shape.STAR4);
    map.add(pos, tile);

    pos = new GridPosition(3, 6);
    tile = new Tile(pos, Color.PURPLE, Shape.STAR4);
    map.add(pos, tile);

    pos = new GridPosition(2, 6);
    tile = new Tile(pos, Color.ORANGE, Shape.STAR4);
    map.add(pos, tile);

    pos = new GridPosition(2, 7);
    tile = new Tile(pos, Color.ORANGE, Shape.SQUARE);
    map.add(pos, tile);

    pos = new GridPosition(4, 5);
    tile = new Tile(pos, Color.GREEN, Shape.CLOVER);
    map.add(pos, tile);

    pos = new GridPosition(4, 7);
    tile = new Tile(pos, Color.GREEN, Shape.STAR8);
    map.add(pos, tile);

    pos = new GridPosition(4, 8);
    tile = new Tile(pos, Color.GREEN, Shape.CIRCLE);
    map.add(pos, tile);

    pos = new GridPosition(3, 8);
    tile = new Tile(pos, Color.YELLOW, Shape.CIRCLE);
    map.add(pos, tile);

    return map;
  }
}

