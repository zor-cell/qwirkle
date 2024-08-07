export interface CellRenderOptions {
    color?: string; //the color to render with
    fill?: boolean; //determines if cell is filled or not
    clear?: boolean; //determines if cell is cleared before being rendered
}

export interface ImageRenderingOptions {
    opacity?: number; //opacity in range [0, 1]
}