import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';

@Component({
  selector: 'app-stack',
  templateUrl: './stack.component.html',
  styleUrl: './stack.component.css'
})
export class StackComponent implements AfterViewInit {
  @ViewChild('stackCanvas') canvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;

  ngAfterViewInit() {
    this.ctx = this.canvas.nativeElement.getContext('2d')!;
    this.width = this.canvas.nativeElement.width;
    this.height = this.canvas.nativeElement.height;
  }

  mouseClick(event: MouseEvent) {

  }
}
