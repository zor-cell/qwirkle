import {AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {Tile} from "../../classes/tile";
import {Color} from "../../classes/color";
import {Shape} from "../../classes/shape";
import {CanvasPosition, GridPosition} from "../../classes/position";
import {StackTile} from "../../classes/stack-tile";
import {HtmlCanvas} from "../../classes/html-canvas";
import {PositionService} from "../../services/position.service";

@Component({
  selector: 'app-stack',
  templateUrl: './stack.component.html',
  styleUrl: './stack.component.css'
})
export class StackComponent implements OnInit, AfterViewInit {
  @Output() randomTile = new EventEmitter<Tile>();
  @Output() selectedTile = new EventEmitter<Tile>();

  @ViewChild('stackCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private canvas!: HtmlCanvas;

  private stack: StackTile[] = [];

  constructor() {}

  ngOnInit() {
    this.initStack();
  }

  ngAfterViewInit() {
    this.canvas = new HtmlCanvas(this.canvasRef);
    this.draw();
  }

  draw() {
    this.canvas.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    //draw stack
    for(let stackTile of this.stack) {
      stackTile.show(this.canvas.ctx);
    }
  }

  mouseClick(event: MouseEvent) {
    let mousePos = this.canvas.mouseToCanvasPosition(event.clientX, event.clientY);
    if(!this.canvas.isValidMousePosition(mousePos)) return;

    for(let stackTile of this.stack) {
      let canvasPosition = PositionService.gridToCanvasPosition(stackTile.tile.position);
      if(canvasPosition.containsPointInCell(mousePos)) {
        //select tile if there are any left
        if(stackTile.count < 1) return;
        stackTile.count--;
        let copy = new Tile(new GridPosition(stackTile.tile.position.i, stackTile.tile.position.j), stackTile.tile.color, stackTile.tile.shape);
        this.selectedTile.emit(copy);
        break;
      }
    }

    this.draw();
  }

  private initStack() {
    let colors: Color[] = [Color.ORANGE, Color.PURPLE, Color.YELLOW, Color.RED, Color.GREEN, Color.BLUE];
    let shapes: Shape[] = [Shape.CIRCLE, Shape.SQUARE, Shape.DIAMOND, Shape.CLOVER, Shape.STAR4, Shape.STAR8];

    for(let i = 0;i < colors.length;i++) {
      let color = colors[i];
      for(let j = 0;j < shapes.length;j++) {
        let shape = shapes[j];

        let tile = new Tile(new GridPosition(i + 0.1 * i, j + 0.1 * j), color, shape);
        this.stack.push(new StackTile(tile, 3));
      }
    }
  }
}
