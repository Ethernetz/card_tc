import { Visual } from "./visual";
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import ISelectionId = powerbi.extensibility.ISelectionId;


import { TilesCollection } from "./TilesCollection/TilesCollection";
import { Tile } from "./TilesCollection/Tile";
import powerbi from "powerbi-visuals-api";
import { TileData } from "./TilesCollection/TileData";
import * as d3 from "d3";
import { getMatchingStateProperty } from "./TilesCollection/functions";
import { ContentFormatType } from "./TilesCollection/enums";
import { VisualSettings } from "./settings";

// import { sizeTextContainer, styleText, makeTextTransparent } from './d3calls'

export class CardsCollection extends TilesCollection {
    visual: Visual
    options: VisualUpdateOptions
    tilesData = <CardData[]>this.tilesData
    hasCategory = false

    public createTile(i): Tile {
        return new Card(this, i, this.tilesData, this.formatSettings)
    }


    onShiftUp() {
        this.visual.shiftFired = false
        d3.select(".handle").remove()
        this.visual.update(this.options)
    }

}

export class Card extends Tile {
    collection = <CardsCollection>this.collection
    tilesData = <CardData[]>this.tilesData
    visual: Visual = this.collection.visual
    

    get vs(): VisualSettings{
        return this.visual.visualSettings
    }

    get tileFill(): string{
        if(this.contentFormatType == ContentFormatType.text_text2)
            return getMatchingStateProperty(this.currentState, this.vs.measureTile, 'color')
        return getMatchingStateProperty(this.currentState, this.vs.categoryTile, 'color')
    }

    get tileFillOpacity(): number {
        if(this.contentFormatType == ContentFormatType.text_text2)
            return 1 - getMatchingStateProperty(this.currentState, this.vs.measureTile, 'transparency') / 100
        return 1 - getMatchingStateProperty(this.currentState, this.vs.categoryTile, 'transparency') / 100
    }

    get tileStroke(): string {
        if(this.contentFormatType == ContentFormatType.text_text2)
            return getMatchingStateProperty(this.currentState, this.vs.measureTile, 'stroke')
        return getMatchingStateProperty(this.currentState, this.vs.categoryTile, 'stroke')
    }

    get tileStrokeWidth(): number {
        if(this.contentFormatType == ContentFormatType.text_text2)
            return getMatchingStateProperty(this.currentState, this.vs.measureTile, 'strokeWidth')
        return getMatchingStateProperty(this.currentState, this.vs.categoryTile, 'strokeWidth')
    }


    get textColor(): string {
        if(this.contentFormatType == ContentFormatType.text_text2)
            return getMatchingStateProperty(this.currentState, this.vs.categoryLabelText, 'color')
        return getMatchingStateProperty(this.currentState, this.vs.headerText, 'color')
    }
    get textOpacity(): number {
        if(this.contentFormatType == ContentFormatType.text_text2)
            return 1 - getMatchingStateProperty(this.currentState, this.vs.categoryLabelText, 'transparency') / 100
        return 1 - getMatchingStateProperty(this.currentState, this.vs.headerText, 'transparency') / 100
    }
    get fontSize(): number {
        if(this.contentFormatType == ContentFormatType.text_text2)
            return getMatchingStateProperty(this.currentState, this.vs.categoryLabelText, 'fontSize')
        return getMatchingStateProperty(this.currentState, this.vs.headerText, 'fontSize')
    }
    get fontFamily(): string {
        if(this.contentFormatType == ContentFormatType.text_text2)
            return getMatchingStateProperty(this.currentState, this.vs.categoryLabelText, 'fontFamily')
        return getMatchingStateProperty(this.currentState, this.vs.categoryLabelText, 'fontFamily')
    }
    get textAlign(): string {
        if(this.contentFormatType == ContentFormatType.text_text2)
            return getMatchingStateProperty(this.currentState, this.vs.categoryLabelText, 'alignment')
        return getMatchingStateProperty(this.currentState, this.vs.categoryLabelText, 'alignment')
    }

    get text2Color(): string {
        return getMatchingStateProperty(this.currentState, this.visual.visualSettings.dataLabelText, 'color')
    }
    get text2Opacity(): number {
        return 1 - getMatchingStateProperty(this.currentState, this.visual.visualSettings.dataLabelText, 'transparency') / 100
    }
    get font2Size(): number {
        return getMatchingStateProperty(this.currentState, this.visual.visualSettings.dataLabelText, 'fontSize')
    }
    get font2Family(): string {
        return getMatchingStateProperty(this.currentState, this.visual.visualSettings.dataLabelText, 'fontFamily')
    }
    get text2Align(): string {
        return getMatchingStateProperty(this.currentState, this.visual.visualSettings.dataLabelText, 'alignment')
    }


    onTileClick() {
        if(this.collection.hasCategory)
            this.visual.selectionManager.select((<CardData>this.tileData).selectionId, false)
        else
            this.visual.selectionManagerUnbound.select(this.i)
        this.visual.update(this.collection.options)
    }

    onTileMouseover() {
        this.visual.hoveredIndex = this.i
        let vs = this.collection.visual.visualSettings
        if(vs.measureTile.hoverStyling || vs.categoryTile.hoverStyling || vs.headerText.hoverStyling || vs.categoryLabelText.hoverStyling || vs.dataLabelText || vs.icon.hoverStyling || vs.effects.hoverStyling)
            this.visual.update(this.collection.options)
    }
    onTileMouseout() {
        this.visual.hoveredIndex = null
        let vs = this.collection.visual.visualSettings
        if(vs.measureTile.hoverStyling || vs.categoryTile.hoverStyling || vs.headerText.hoverStyling || vs.categoryLabelText.hoverStyling || vs.dataLabelText || vs.icon.hoverStyling || vs.effects.hoverStyling)
            this.visual.update(this.collection.options)
    }
}

export class CardData extends TileData {
    selectionId?: ISelectionId
}

