import { Injectable } from '@angular/core';
import {Color} from "../classes/color";
import {Shape} from "../classes/shape";

@Injectable({
  providedIn: 'root'
})
export class BitfilterService {

  constructor() { }

  setBitCount(n: Color | Shape) {
    let count = 0;
    while (n) {
      count += n & 1;
      n >>= 1;
    }

    return count;
  }

  isCompatible(color1: Color, shape1: Shape, color2: Color, shape2: Shape) {
    //if the color is the same, the shape has to be different
    let sameColorMissingShape = color1 === color2 && (shape1 & shape2) === 0;
    //if the shape is the same, the color has to be different
    let sameShapeMissingColor = shape1 === shape2 && (color1 & color2) === 0;

    return sameColorMissingShape || sameShapeMissingColor;
  }
}
