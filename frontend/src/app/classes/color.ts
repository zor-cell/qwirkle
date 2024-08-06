export enum Color {
    NONE = 0,
    ORANGE = 1 << 0,
    PURPLE = 1 << 1,
    YELLOW = 1 << 2,
    RED = 1 << 3,
    GREEN = 1 << 4,
    BLUE = 1 << 5
}

export abstract class ColorMapper {
    static mapColorToHex(color: Color): string {
        if(color === Color.ORANGE) return "#ff9900";
        if(color === Color.PURPLE) return "#8000ff";
        if(color === Color.YELLOW) return "#ffff00";
        if(color === Color.RED) return "#ff0000";
        if(color === Color.GREEN) return "#00ff00";
        if(color === Color.BLUE) return "#0066ff";

        return "#000";
    }

    static bitCount(n: number) {
        let count = 0;
        while (n) {
            count += n & 1;
            n >>= 1;
        }
        return count;
    }
}