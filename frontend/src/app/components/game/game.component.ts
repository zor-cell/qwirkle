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
import {SimpleDirection, Direction} from "../../classes/direction";
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
  @Input() handTilesInHandEvent!: Observable<Tile[]>; //tiles that are in the hand component
  @Output() placeTilesEvent = new EventEmitter<Tile[]>(); //tile is placed in game component

  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private canvas!: HtmlCanvas;

  private grid = new CustomMap<GridPosition, Tile>(pos => pos.hash());
  private handTiles: Tile[] = [];
  private selectedHand: Tile[] = [];

  private highlightedMove: MoveGroup | null = null;

  constructor(private renderService: RenderService, private bitfilterService: BitfilterService) {}

  ngOnInit() {
    this.selectTilesInHandEvent.subscribe((selectedTiles => {
      this.selectedHand = selectedTiles;
      this.draw();
    }));

    this.handTilesInHandEvent.subscribe((handTiles) => {
      this.handTiles = handTiles;
     // this.findBestMove(this.handTiles);
    })

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

    this.draw();

    if(this.highlightedMove) this.placeMoves(mousePos, this.selectedHand, this.highlightedMove);
    this.highlightMoves(mousePos);
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

    //draw legal spots for current selected tiles
    let legal = this.getLegalMoves(this.selectedHand);
    for(let move of legal) {
      let options = {color: "#f00", clear: true, text: move.position.i.toString() + "," + move.position.j.toString()};
      this.renderService.drawCellFromGridPos(this.canvas.ctx, move.position, options);
      for(let direction of move.directions) {
        this.renderService.drawCellDirectionFromGridPos(this.canvas.ctx, move.position, direction);
      }
    }
  }

  private findBestMove(tiles: Tile[]) {
    //create all valid subsets of tiles
    let subsets = BitfilterService.allSubsets(tiles);
    let validSubsets: Tile[][] = [];
    for(let subset of subsets) {
      if(subset.length === 0) continue;

      let valid = true;
      for(let i = 0;i < subset.length;i++) {
        for(let j = 0;j < subset.length;j++) {
          if(i === j) continue;
          if(subset[i].color === subset[j].color && subset[i].shape === subset[j].shape) {
            valid = false;
            break;
          }

          let comp = this.bitfilterService.isCompatible(subset[i].color, subset[i].shape, subset[j].color, subset[j].shape);
          if(!comp) {
            valid = false;
            break;
          }
        }
        if(!valid) break;
      }
      if(valid) validSubsets.push(subset);
    }

    let maxScore = -1;
    let maxMove = null;
    let maxTiles = null;
    //go through all permutations of valid subsets
    for(let subset of validSubsets) {
      let permutations = BitfilterService.allPermutations(subset);
      for(let permutation of permutations) {
        let legal = this.getLegalMoves(permutation);
        //get score for every move of legal moves
        for(let moveGroup of legal) {
          for(let direction of moveGroup.directions) {
            let move = new Move(moveGroup.position, direction);
            let score = this.getMoveScore(move, subset);
            if(score > maxScore) {
              maxScore = score;
              maxMove = move;
              maxTiles = subset;
            }
          }
        }
      }
    }

    console.log(maxScore, maxMove, maxTiles);
  }

  private getMoveScore(move: Move, tiles: Tile[]) {
    let positions: GridPosition[] = [];
    for(let i = 0;i < tiles.length;i++) {
      let tilePos = new GridPosition(move.position.i + move.direction.di * i, move.position.j + move.direction.dj * i);
      positions.push(tilePos);
    }

    //place tiles
    for(let i = 0;i < tiles.length;i++) {
      tiles[i].position = positions[i];
      this.grid.add(positions[i], tiles[i]);
    }

    //go through all 4 directions from the tile
    let score = 0;
    let seenMoveDirection = false;
    let seenMoveInvDirection = false;
    let di = [-1, 1, 0, 0];
    let dj = [0, 0, -1, 1];
    for(let tile of tiles) {
      let tileScore = 0;
      for (let d = 0; d < 4; d++) {
        //only check move direction once
        if(di[d] === move.direction.di && dj[d] === move.direction.dj) {
          if(seenMoveDirection) continue;
          else seenMoveDirection = true;
        }
        //only check inverse move direction once
        if(di[d] === -move.direction.di && dj[d] === -move.direction.dj) {
          if(seenMoveInvDirection) continue;
          else seenMoveInvDirection = true;
        }

        let pos: GridPosition = new GridPosition(tile.position.i + di[d], tile.position.j + dj[d]);
        let color = Color.NONE;
        let shape = Shape.NONE;

        //continue if neighbor is empty
        if (!this.grid.has(pos)) continue;

        //accumulate neighbors colors and shapes in current direction
        while (this.grid.has(pos)) {
          let neighbor = this.grid.get(pos)!;

          color |= neighbor.color;
          shape |= neighbor.shape;

          pos = new GridPosition(pos.i + di[d], pos.j + dj[d]);
        }

        tileScore += this.bitfilterService.setBitCount(color);
        tileScore += this.bitfilterService.setBitCount(shape);
        if (tileScore === 6) score *= 2;

        if (!this.bitfilterService.isCompatible(color, shape, tile.color, tile.shape)) {
          tileScore = 0;
          break;
        }
      }
      score += tileScore;
    }

    //remove tiles
    for(let i = 0;i < tiles.length;i++) {
      tiles[i].position = positions[i];
      this.grid.delete(positions[i]);
    }

    return score;
  }

  /**
   * Places tiles after a highlighted move is pressed.
   * @param mousePos
   * @param tiles
   * @param highlightedMove
   * @private
   */
  private placeMoves(mousePos: CanvasPosition, tiles: Tile[], highlightedMove: MoveGroup): boolean {
    //move placement after mouse click on already highlighted move group

    //places the tiles in a given direction
    for (let direction of highlightedMove.directions) {
      //place all selected tiles in a direction if a tile is clicked
      for (let i = 0; i < tiles.length; i++) {
        //skip the hit-box of the first tile, if there are multiple directions
        //because it would not be clear what direction to choose on click
        if(i === 0 && highlightedMove.directions.length > 1) continue;

        //check if a tile is clicked
        let tilePos = highlightedMove.position.stepsInDirection(direction, i);
        if (tilePos.asCanvasPosition().containsPointInCell(mousePos)) {
          let move = new Move(highlightedMove.position, direction);
          this.placeTiles(move, tiles);

          //reset highlighting
          this.highlightedMove = null;
          return true;
        }
      }
    }


    return false;
  }

  /**
   * Highlights legal moves after a legal move group is clicked.
   * Returns true if the mouse position is in a legal move and a highlighted move is set.
   * @param mousePos
   * @private
   */
  private highlightMoves(mousePos: CanvasPosition): boolean {
    //move highlighting after first mouse click on valid move
    let legal = this.getLegalMoves(this.selectedHand);
    for(let moveGroup of legal) {
      if(moveGroup.position.asCanvasPosition().containsPointInCell(mousePos)) {
        //show first tile only once because it is shown in all directions
        let firstTile = new Tile(moveGroup.position, this.selectedHand[0].color, this.selectedHand[0].shape);
        firstTile.show(this.canvas.ctx, {opacity: 0.5});

        //show selected tiles in every direction
        for(let direction of moveGroup.directions) {
          //show all selected tiles in order
          for(let selectedIndex = 1;selectedIndex < this.selectedHand.length;selectedIndex++) {
            let tilePos = moveGroup.position.stepsInDirection(direction, selectedIndex);
            let curTile = new Tile(tilePos, this.selectedHand[selectedIndex].color, this.selectedHand[selectedIndex].shape);
            curTile.show(this.canvas.ctx, {opacity: 0.5});
          }
        }

        //set selected group to enable move placing
        this.highlightedMove = moveGroup;
        return true;
      }
    }

    return false;
  }

  /**
   * Makes a move by placing the given tiles at the position and in the direction of the given move.
   * @param move
   * @param tiles
   * @private
   */
  private placeTiles(move: Move, tiles: Tile[]) {
    for(let tileIndex = 0;tileIndex < tiles.length;tileIndex++) {
      let tilePos = move.position.stepsInDirection(move.direction, tileIndex);
      let tile = new Tile(tilePos, tiles[tileIndex].color, tiles[tileIndex].shape);
      this.grid.add(tile.position, tile);
    }

    this.draw();
    this.placeTilesEvent.next(tiles);
  }

  /**
   * Retrieves all legal moves for multiple tiles.
   * The order of the tiles is important! The tile at tiles[0] is placed first, tiles[1] second etc.
   * @param tiles
   * @private
   */
  private getLegalMoves(tiles: Tile[]): MoveGroup[] {
    let result: MoveGroup[] = [];

    if(tiles.length === 0) return result;
    else if(tiles.length === 1) {
      //if there is only one tile to be placed, legal positions are trivial
      return this.getLegalPositions(tiles[0]).values().map(pos => new MoveGroup(pos, [Direction.noDirection()]));
    }

    //try every valid position of the first tile
    let legal = this.getLegalPositions(tiles[0]);
    for (let pos of legal.values()) {
      let curMoveGroup = new MoveGroup(new GridPosition(pos.i, pos.j), []);
      for(let direction of Direction.allDirections()) {
        let tempPositions = [];
        let valid = true;

        //go through all tiles and check if they can be placed
        for(let tileIndex = 0;tileIndex < tiles.length;tileIndex++) {
          let tilePos = pos.stepsInDirection(direction, tileIndex);
          if(!this.isLegalPositionForTile(tilePos, tiles[tileIndex])) {
            valid = false;
            break;
          }

          //add tiles to grid temporarily to get valid positions
          this.grid.add(tilePos, new Tile(tilePos, tiles[tileIndex].color, tiles[tileIndex].shape));
          tempPositions.push(tilePos);
        }

        //delete temp tiles from grid
        for(let tempPos of tempPositions) {
          this.grid.delete(tempPos);
        }

        //add direction to move group if all tiles in this direction are valid
        if(valid) curMoveGroup.directions.push(direction);
      }

      //move group is valid if all tiles can be placed in any direction
      if(curMoveGroup.directions.length > 0) result.push(curMoveGroup);
    }

    return result;
  }

  /**
   * Retrieves all legal positions for a single tile.
   * @param tile
   * @private
   */
  private getLegalPositions(tile: Tile): CustomSet<GridPosition> {
    let legal = new CustomSet<GridPosition>(pos => pos.hash());

    let freePositions = this.getFreePositions();
    for(let freePos of freePositions.values()) {
      if(this.isLegalPositionForTile(freePos, tile)) {
        legal.add(freePos);
      }
    }

    return legal;
  }

  /**
   * Scans all tiles in every direction from a given position until an empty tile is encountered.
   * Returns true if the given tile is compatible with all tiles in every direction.
   * @param position
   * @param tile
   * @private
   */
  private isLegalPositionForTile(position: GridPosition, tile: Tile): boolean {
    //cannot be placed if position is already occupied
    if(this.grid.has(position)) {
      return false;
    }

    //go through all 4 directions from the tile
    for(let direction of Direction.allDirections()) {
      let steps = 1;
      let pos: GridPosition = position.stepsInDirection(direction, steps++);

      //accumulated color and shape of all tiles in current direction
      let color = Color.NONE;
      let shape = Shape.NONE;

      //continue if neighbor is empty
      if(!this.grid.has(pos)) continue;

      //accumulate neighbors colors and shapes in current direction
      while(this.grid.has(pos)) {
        let neighbor = this.grid.get(pos)!;

        color |= neighbor.color;
        shape |= neighbor.shape;

        pos = position.stepsInDirection(direction, steps++);
      }

      //if the tile is incompatible with any direction the position is invalid
      if(!tile.isCompatible(color, shape)) return false;
    }

    return true;
  }

  /**
   * Retrieves all open grid spots, ie all neighbor fields that are not occupied.
   * @private
   */
  private getFreePositions(): CustomSet<GridPosition> {
    let free = new CustomSet<GridPosition>(pos => pos.hash());

    for(let tile of this.grid.values()) {
      for(let direction of Direction.allDirections()) {
        let pos: GridPosition = tile.position.stepsInDirection(direction);
        if(!this.grid.has(pos)) {
          free.add(pos);
        }
      }
    }

    return free;
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

