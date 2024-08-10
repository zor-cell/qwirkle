import { Injectable } from '@angular/core';
import {Color} from "../classes/color";

@Injectable({
  providedIn: 'root'
})
export class ColorService {

  constructor() { }

  static mapColorToHex(color: Color): string {
    if(color === Color.ORANGE) return "#ff9900";
    if(color === Color.PURPLE) return "#8000ff";
    if(color === Color.YELLOW) return "#ffff00";
    if(color === Color.RED) return "#ff0000";
    if(color === Color.GREEN) return "#00ff00";
    if(color === Color.BLUE) return "#0066ff";

    return "#000";
  }
}
