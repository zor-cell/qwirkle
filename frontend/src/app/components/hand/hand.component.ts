import {AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {Tile} from "../../classes/tile";
import {CanvasPosition, Position, PositionMapper} from "../../classes/position";
import {Color} from "../../classes/color";
import {Shape} from "../../classes/shape";
import {GameComponent} from "../game/game.component";
import {Observable} from "rxjs";
import {CellRenderOptions} from "../../classes/options";
import {RenderService} from "../../services/render.service";
import {BitfilterService} from "../../services/bitfilter.service";

@Component({
  selector: 'app-hand',
  templateUrl: './hand.component.html',
  styleUrl: './hand.component.css'
})
export class HandComponent implements AfterViewInit {
  @Input() placeTileEvent!: Observable<Tile>;
  @Output() selectedEvent = new EventEmitter<Tile[]>();

  @ViewChild('handCanvas') canvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  private width: number = 0;
  private height: number = 0;
  private hand: Tile[] = [];
  private selected: Tile[] = [];

  constructor(private renderService: RenderService, private bitfilterService: BitfilterService) {}

  ngAfterViewInit() {
    this.ctx = this.canvas.nativeElement.getContext('2d')!;
    this.width = this.canvas.nativeElement.width;
    this.height = this.canvas.nativeElement.height;

    //event from game component on placed tile
    this.placeTileEvent.subscribe((placedTile) => {
      this.selected.splice(this.selected.indexOf(placedTile), 1);
      this.hand.splice(this.hand.indexOf(placedTile), 1);

      this.draw();
      this.selectedEvent.emit(this.selected);
    });

    this.initHand();
    this.draw();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    //draw hand
    for(let j = 0;j < this.hand.length;j++) {
      let tile = this.hand[j];
      tile.position = new Position(0.1, j + 0.1 * (j + 1));
      tile.show(this.ctx);

      if(this.selected.includes(tile)) {
        //highlight selected hand tiles
        this.renderService.drawCellFromGridPos(this.ctx, tile.position, {color: "#f00"});
      } else {
        //grey out incompatible hand tiles
        if (this.selected.length > 0) {
          let color = this.selected.map(selectedTile => selectedTile.color).reduce((a, b) => a | b);
          let shape = this.selected.map(selectedTile => selectedTile.shape).reduce((a, b) => a | b);

          if (!this.bitfilterService.isCompatible(color, shape, tile.color, tile.shape)) {
            tile.show(this.ctx, {opacity: 0.3});
          }
        }
      }
    }
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
    this.selectedEvent.emit(this.selected);
  }

  private  initHand() {
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
}
