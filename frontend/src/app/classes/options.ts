export interface CellRenderOptions {
    color?: string; //the color to render with
    fill?: boolean; //determines if cell is filled or not
    clear?: boolean; //determines if cell is cleared before being rendered
    lineWidth?: number; //width of the line
    text?: string; //text to be displayed
    opacity?: number; //opacity of the render color in range [0, 1]
}

export interface ImageRenderingOptions {
    opacity?: number; //opacity in range [0, 1]
    text?: string; //text to be shown on image
}