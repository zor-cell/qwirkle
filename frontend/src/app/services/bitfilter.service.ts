import { Injectable } from '@angular/core';
import {Color} from "../classes/color";
import {Shape} from "../classes/shape";
import {Tile} from "../classes/tile";

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

  static allPermutations <T>(arr: T[]): T[][] {
    const results: T[][] = [];

    function backtrack(start: number) {
      if (start === arr.length) {
        // Make a copy of the array and add it to the results
        results.push(arr.slice());
      }

      for (let i = start; i < arr.length; i++) {
        // Swap elements at indices start and i
        [arr[start], arr[i]] = [arr[i], arr[start]];
        // Recurse with the next index
        backtrack(start + 1);
        // Swap back to restore the original array for the next iteration
        [arr[start], arr[i]] = [arr[i], arr[start]];
      }
    }

    backtrack(0);
    return results;
  }

  static allSubsets(array: Tile[]) {
    const subset: Tile[] = [];
    const res: Tile[][] = [];
    let index = 0;
    this.calcSubsets(array, res, subset, index);
    return res;
  }

  private static calcSubsets(array: Tile[], res: Tile[][], subset: Tile[], index: number) {
    res.push([...subset]);

    for(let i = index;i < array.length;i++) {
      subset.push(array[i]);

      this.calcSubsets(array, res, subset, i + 1);

      subset.pop();
    }
  }
}
