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
import {Move, MoveGroup} from '../../classes/move';
import {Direction, SimpleDirection} from "../../classes/direction";
import {ImageRenderingOptions} from "../../classes/options";

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
  @Output() bestMoveEvent = new EventEmitter<Move>() //best move is calculated

  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private canvas!: HtmlCanvas;

  private grid = new CustomMap<GridPosition, Tile>(pos => pos.hash());
  private handTiles: Tile[] = [];
  private selectedHand: Tile[] = [];

  private highlightedMove: MoveGroup | null = null;
  private bestMove: Move | null = null;

  constructor(private renderService: RenderService, private bitfilterService: BitfilterService) {}

  ngOnInit() {
    this.selectTilesInHandEvent.subscribe((selectedTiles => {
      this.selectedHand = selectedTiles;
      this.draw();
    }));

    this.handTilesInHandEvent.subscribe((handTiles) => {
      this.handTiles = handTiles;
      this.bestMove = this.findBestMove(this.handTiles);
      if(this.canvas) this.draw();

      this.bestMoveEvent.next(this.bestMove);
    });

    this.grid = this.map1();
  }

  ngAfterViewInit() {
    this.canvas = new HtmlCanvas(this.canvasRef);
    this.draw();
  }

  mouseWheel(event: WheelEvent) {
    let mousePos = this.canvas.mouseToCanvasPosition(event.clientX, event.clientY);
    if(!this.canvas.isValidMousePosition(mousePos)) return;

    if(event.deltaY < 0) {
      //scroll UP
      //if(Tile.SIZE < 60) Tile.SIZE += 1;
    } else if(event.deltaY > 0) {
      //scroll DOWN
      //if(Tile.SIZE > 20) Tile.SIZE -= 1;
    } else return;

    this.draw();
  }

  mouseClick(event: MouseEvent) {
    let mousePos = this.canvas.mouseToCanvasPosition(event.clientX, event.clientY);
    if(!this.canvas.isValidMousePosition(mousePos)) return;

    //check for tile placing
    if(this.selectedHand.length === 0) return;

    this.draw();

    if(this.highlightedMove) {
      this.placeMoves(mousePos, this.selectedHand, this.highlightedMove);
    }
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
    let free = this.getAllFreePositions();
    for(let pos of free.values()) {
      this.renderService.drawCellFromGridPos(this.canvas.ctx, pos, {color: "#0aa", text: pos.i.toString() + "," + pos.j.toString()});
    }

    //draw dead spots
    /*let dead = this.getDeadPositions();
    for(let pos of dead.values()) {
      this.renderService.drawCellFromGridPos(this.canvas.ctx, pos, {color: "#000", fill: true});
    }*/

    //draw legal spots for current selected tiles
    let legal = this.getLegalMoves(this.selectedHand);
    for(let move of legal) {
      let options = {color: "#f00", clear: true, text: move.position.i.toString() + "," + move.position.j.toString()};
      this.renderService.drawCellFromGridPos(this.canvas.ctx, move.position, options);
      for(let direction of move.directions) {
        this.renderService.drawCellDirectionFromGridPos(this.canvas.ctx, move.position, direction);
      }
    }

    //draw best moves
    if(this.bestMove) {
      for (let i = 0; i < this.bestMove.tiles.length; i++) {
        let pos = this.bestMove.position.stepsInDirection(this.bestMove.direction, i);
        this.renderService.drawCellFromGridPos(this.canvas.ctx, pos, {color: Move.bestMoveColors[i], fill: true});
      }
    }
  }

  private findBestMove(tiles: Tile[]): Move {
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

    let moves: Move[] = [];
    //go through all permutations of valid subsets
    for(let subset of validSubsets) {
      let permutations = BitfilterService.allPermutations(subset);
      for(let permutation of permutations) {
        let legal = this.getLegalMoves(permutation);
        //get score for every move of legal moves
        for(let moveGroup of legal) {
          for(let direction of moveGroup.directions) {
            let subsetCopy = subset.map(x => new Tile(x.position, x.color, x.shape));
            let move = new Move(moveGroup.position, new Direction(direction.d), subsetCopy, -1);
            move.score = this.getMoveScore(move);
            moves.push(move);
          }
        }
      }
    }

    moves.sort((a, b) => b.score - a.score);

    return moves[0];
  }

  /**
   * Computes the score for a given position in a given direction and its inverse direction.
   * If x is the position and the direction is pointing UP, the score is 4, as it is
   * summing the score of UP, the score of DOWN and 1 for the tile itself.
   *    1
   *    x
   *    2
   *    3
   * @param position
   * @param direction
   */
  getScoreForDirectionPair(position: GridPosition, direction: Direction): number {
    let directions = [direction, direction.inverse];

    let score = 0;
    let color = Color.NONE;
    let shape = Shape.NONE;
    for(let direction of directions) {
      let steps = 1;
      while(this.grid.has(position.stepsInDirection(direction, steps))) {
        let neighbor = this.grid.get(position.stepsInDirection(direction, steps))!;

        color |= neighbor.color;
        shape |= neighbor.shape;

        score++;
        steps++;
      }
    }
    if(score > 0) score++; //count tile itself
    if(score === 6) score = 12; //when qwirkle is achieved

    return score;
  }

  isDeadInDirectionPair(position: GridPosition, direction: Direction) {
    let directions = [direction, direction.inverse];

    let color = Color.NONE;
    let shape = Shape.NONE;
    for(let direction of directions) {
      let steps = 1;
      while(this.grid.has(position.stepsInDirection(direction, steps))) {
        let neighbor = this.grid.get(position.stepsInDirection(direction, steps))!;

        color |= neighbor.color;
        shape |= neighbor.shape;

        steps++;
      }
    }

    return {color: color, shape: shape};
  }

  isDeadPosition(position: GridPosition) {
    let ver = this.isDeadInDirectionPair(position, new Direction(SimpleDirection.UP));
    let hor = this.isDeadInDirectionPair(position, new Direction(SimpleDirection.LEFT));

    for(let cs of [ver, hor]) {
      let colorBits = this.bitfilterService.setBitCount(cs.color);
      let shapeBits = this.bitfilterService.setBitCount(cs.shape);
      let noMatch =  colorBits >= 2 && shapeBits >= 2; //there are incompatible colors or shapes in the direction
      let qwirkle = colorBits === 6 || shapeBits === 6; //the direction is already finished with a qwirkle

      if(noMatch || qwirkle) return true;
    }

    let invalidColor = false;
    let invalidShape = false;
    if(ver.color != Color.NONE && hor.color != Color.NONE) invalidColor = (~ver.color & hor.color) === 0;
    if(ver.shape != Shape.NONE && hor.shape != Shape.NONE) invalidShape = (~ver.shape & hor.shape) === 0;

    return invalidColor || invalidShape;
  }

  /**
   * Computes the move score for a given move and given tiles.
   * This method does not check if the grid is valid.
   * @param move
   * @param tiles
   * @private
   */
  private getMoveScore(move: Move) {
    //only a single tile is placed
    if(move.tiles.length === 1) {
      let verScore = this.getScoreForDirectionPair(move.position, new Direction(SimpleDirection.UP));
      let horScore = this.getScoreForDirectionPair(move.position, new Direction(SimpleDirection.LEFT));

      return verScore + horScore;
    }

    let totalScore = 0;
    //place tiles
    for(let i = 0;i < move.tiles.length;i++) {
      move.tiles[i].position = move.position.stepsInDirection(move.direction, i);
      this.grid.add(move.tiles[i].position, move.tiles[i]);
    }

    //check scores in direction that is not a placement direction (or inverse placement direction)
    let noPlaceDirection = move.direction.rotate90Deg();
    for(let tile of move.tiles) {
      let noPlaceDirectionScore = this.getScoreForDirectionPair(tile.position, noPlaceDirection);
      totalScore += noPlaceDirectionScore;
    }

    //check score in placement direction only once
    let placeDirectionScore = this.getScoreForDirectionPair(move.position, move.direction);
    totalScore += placeDirectionScore;

    //remove tiles
    for(let i = 0;i < move.tiles.length;i++) {
      this.grid.delete(move.tiles[i].position);
    }

    return totalScore;
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
          let move = new Move(highlightedMove.position, direction, tiles, -1);
          this.placeTiles(move);

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
   * @private
   */
  private placeTiles(move: Move) {
    for(let tileIndex = 0;tileIndex < move.tiles.length;tileIndex++) {
      let tilePos = move.position.stepsInDirection(move.direction, tileIndex);
      let tile = new Tile(tilePos, move.tiles[tileIndex].color, move.tiles[tileIndex].shape);
      this.grid.add(tile.position, tile);
    }

    this.draw();
    this.placeTilesEvent.next(move.tiles);
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
      let curMoveGroup = new MoveGroup(pos, []);
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

    let freePositions = this.getAllFreePositions();
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

   /* let directionPairs = [
        [new Direction(SimpleDirection.UP), new Direction(SimpleDirection.DOWN)],
        [new Direction(SimpleDirection.LEFT), new Direction(SimpleDirection.RIGHT)]
    ];

    for(let directionPair of directionPairs) {
      let color = Color.NONE;
      let shape = Shape.NONE;
      for(let direction of directionPair) {
        let steps = 1;
        while(this.grid.has(position.stepsInDirection(direction, steps))) {
          let neighbor = this.grid.get(position.stepsInDirection(direction, steps))!;

          color |= neighbor.color;
          shape |= neighbor.shape;

          steps++;
        }
      }

      if(!tile.isCompatible(color, shape)) return false;
    }

    return true;*/

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
   * This does not exclude dead positions, ie positions that can never be filled
   * @private
   */
  private getAllOpenPositions(): CustomSet<GridPosition> {
    let open = new CustomSet<GridPosition>(pos => pos.hash());

    for(let tile of this.grid.values()) {
      for(let direction of Direction.allDirections()) {
        let pos: GridPosition = tile.position.stepsInDirection(direction, 1);
        if(!this.grid.has(pos)) {
          open.add(pos);
        }
      }
    }

    return open;
  }

  /**
   * Retrieves all free grid spots, ie all neighbor fields that a tile can be placed on.
   * This excludes dead positions, ie neighbor fields that can never be occupied by a tile.
   * @private
   */
  private getAllFreePositions(): CustomSet<GridPosition> {
    let free = new CustomSet<GridPosition>(pos => pos.hash());

    for(let position of this.getAllOpenPositions().values()) {
      if(!this.isDeadPosition(position)) {
        free.add(position);
      }
    }

    return free;
  }

  /**
   * Retrieves all dead grid spots, ie all neighbor fields that can never be occupied by a valid tile.
   * @private
   */
  private getDeadPositions(): CustomSet<GridPosition> {
    let dead = new CustomSet<GridPosition>(pos => pos.hash());

    for(let position of this.getAllOpenPositions().values()) {
      let deadUp = this.isDeadInDirectionPair(position, new Direction(SimpleDirection.UP));
      let deadLeft = this.isDeadInDirectionPair(position, new Direction(SimpleDirection.LEFT));
      if(deadUp || deadLeft) {
        dead.add(position);
      }
    }

    return dead;
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

