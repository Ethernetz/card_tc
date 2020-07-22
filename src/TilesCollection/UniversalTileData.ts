import { FormatSettings } from './FormatSettings'
import { TileData } from './TileData'
import { Viewport } from './interfaces';
import { TileLayoutType, State, TileSizingType } from './enums';
import { getMatchingStateProperty, calculateWordDimensions } from './functions'
import { TilesCollection } from './TilesCollection';
export class UniversalTileData{
    tilesData: TileData[]
    formatSettings: FormatSettings;
    collection: TilesCollection;
    constructor(tilesData: TileData[], formatSettings: FormatSettings, collection: TilesCollection) {
        this.tilesData = tilesData;
        this.formatSettings = formatSettings;
        this.collection = collection;
    }

    public scrollLeft: number = 0;
    public scrollTop: number = 0;
    public maxBoundedTextHeight: number;
    public maxBoundedText2Height: number;
    public maxIconHeight: number; 

    public viewport: Viewport = {
        height: 0,
        width: 0
    };
    
    get viewportWidth(): number {
        return this.viewport.width
    }
    get viewportHeight(): number {
        return this.viewport.height
    }
    get containerWidth(): number {
        return this.viewportWidth - this.effectSpace
    }
    get containerHeight(): number {
        return this.viewportHeight - this.effectSpace
    }

    get n(): number {
        return this.tilesData.length
    }
    get numRows(): number {
        return Math.ceil(this.n / this.rowLength)
    }
    get rowLength(): number {
        switch (this.formatSettings.layout.tileLayout) {
            case (TileLayoutType.horizontal):
                return this.n
            case (TileLayoutType.vertical):
                return 1
            case (TileLayoutType.grid):
                return Math.max(1, this.formatSettings.layout.tilesPerRow)
        }
    }



    getMaxOfPropertyGroup(formatObj: any, propBase: string): number{
        let max = Math.max(
            getMatchingStateProperty(State.selected, formatObj, propBase),
            getMatchingStateProperty(State.unselected, formatObj, propBase),
            getMatchingStateProperty(State.hovered, formatObj, propBase),
            getMatchingStateProperty(State.disabled, formatObj, propBase),
        )
        return max == undefined ? formatObj[propBase + 'D'] || 0 : max
    }


    get maxTileStrokeWidth(): number{        
        return this.getMaxOfPropertyGroup(this.formatSettings.tile, 'strokeWidth')
    }

    get maxFontSize(): number{
        return this.getMaxOfPropertyGroup(this.formatSettings.text, 'fontSize')
    }
    get maxFont2Size(): number{
        return this.maxFontSize
    }
    get maxInlineTextHeight(): number {
        return Math.round(this.maxFontSize*4/3)
    }
    get minTileWidth(): number{
        return this.maxFontSize*5
    }

    get maxIconWidth(): number {
        return this.getMaxOfPropertyGroup(this.formatSettings.icon, 'width')
    }


    get effectSpace(): number {
        return Math.max(this.shadowSpace, this.glowSpace, 2*this.maxTileStrokeWidth)
    }

    get shadow(): boolean {
        return this.formatSettings.effect.shadow
    }
    get shadowSpace(): number {
        return this.shadow ? 3 * (this.shadowMaxDistance + this.shadowMaxStrength) : 0
    }
    get shadowMaxDistance(): number {
        return this.getMaxOfPropertyGroup(this.formatSettings.effect, 'shadowDistance')
    }
    get shadowMaxStrength(): number {
        return this.getMaxOfPropertyGroup(this.formatSettings.effect, 'shadowStrength')
    }

    get glow(): boolean {
        return this.formatSettings.effect.glow
    }
    get glowSpace(): number {
        return this.formatSettings.effect.glow ? 5 * (this.glowMaxStrength) : 0
    }
    get glowMaxStrength(): number {
        return this.getMaxOfPropertyGroup(this.formatSettings.effect, 'glowStrength')
    }
}