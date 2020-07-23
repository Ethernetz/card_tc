import { Visual } from "./visual";
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import ISelectionId = powerbi.extensibility.ISelectionId;


import { TilesCollection } from "./TilesCollection/TilesCollection";
import { Tile } from "./TilesCollection/Tile";
import powerbi from "powerbi-visuals-api";
import { TileData } from "./TilesCollection/TileData";
import * as d3 from "d3";
import { getMatchingStateProperty, calculateWordDimensions } from "./TilesCollection/functions";
import { ContentFormatType } from "./TilesCollection/enums";
import { VisualSettings } from "./settings";
import { UniversalTileData } from "./TilesCollection/UniversalTileData";
import { TileSettings, TextSettings } from "./TilesCollection/FormatSettings";

// import { sizeTextContainer, styleText, makeTextTransparent } from './d3calls'

export class CardsCollection extends TilesCollection {
    visual: Visual
    options: VisualUpdateOptions
    tilesData = <CardData[]>this.tilesData
    hasCategory = false
    universalTileData: UniversalCardData

    public setTextBounds(){
        this.universalTileData.maxBoundedDataHeight = this.getMaxBoundedDataHeight()
        this.universalTileData.maxBoundedCategoryHeight = this.getMaxBoundedCategoryHeight()
        super.setTextBounds()
    }

    public getMaxBoundedDataHeight(): number {
        let mutableTiles = [...this.tiles]
        let longestTextTiles: Card[] = mutableTiles.slice()
            .filter((d)=>d.tileData.contentFormatType == ContentFormatType.text_text2 && d.text2 && d.text2.length > 0)
            .sort((a, b)=> b.text2.length - a.text2.length )
            .slice(0, 5) as Card[]
        return longestTextTiles.map((d)=> d.maxIndividualBoundedText2Height).sort((a, b)=> b - a)[0]
    }

    public getMaxBoundedCategoryHeight(): number {
        let mutableTiles = [...this.tiles]
        let longestTextTiles: Card[] = mutableTiles.slice()
            .filter((d)=>d.tileData.contentFormatType == ContentFormatType.text_text2 && d.text && d.text.length > 0)
            .sort((a, b)=> b.text2.length - a.text2.length )
            .slice(0, 5) as Card[]
        return longestTextTiles.map((d)=> d.maxIndividualBoundedTextHeight).sort((a, b)=> b - a)[0]
    }
    

    public createTile(i): Tile {
        return new Card(this, i, this.tilesData, this.formatSettings)
    }

    public createUniversalTileData(): UniversalTileData {
        return new UniversalCardData(this.tilesData, this.formatSettings, this)
    }
}

export class UniversalCardData extends UniversalTileData {
    collection = <CardsCollection>this.collection
    tilesData = <CardData[]>this.tilesData
    visual: Visual = this.collection.visual

    public maxBoundedDataHeight: number
    public maxBoundedCategoryHeight: number


    get vs(): VisualSettings{
        return this.visual.visualSettings
    }

    get maxCategoryLabelFontSize(): number{
        return this.getMaxOfPropertyGroup(this.vs.categoryLabelText, 'fontSize')
    }
    get maxHeaderFontSize(): number{
        return this.getMaxOfPropertyGroup(this.vs.headerText, 'fontSize')
    }
    get maxFont2Size(): number{
        return this.getMaxOfPropertyGroup(this.vs.dataLabelText, 'fontSize')
    }
    
}



export class Card extends Tile {
    collection = <CardsCollection>this.collection
    tilesData = <CardData[]>this.tilesData
    visual: Visual = this.collection.visual
    universalTileData: UniversalCardData
    

    get vs(): VisualSettings{
        return this.visual.visualSettings
    }

    get maxFontSize(): number {
        if(this.contentFormatType == ContentFormatType.text_text2)
            return this.universalTileData.maxCategoryLabelFontSize
        return this.universalTileData.maxHeaderFontSize
    }

    get boundedText2Width(): number {
        return calculateWordDimensions(this.text2 as string, this.font2Family, this.universalTileData.maxFont2Size + "pt", 
        this.textContainerWidthType, (this.maxHorizontalTextSpace) + 'px').width;
    }
    get maxIndividualBoundedText2Height(): number {
        return calculateWordDimensions(this.text2 as string, this.font2Family, this.universalTileData.maxFont2Size + "pt", 
        this.textContainerWidthType, (this.maxHorizontalTextSpace) + 'px').height;
    }
    
    get maxBoundedText2Height(): number {
        return this.universalTileData.maxBoundedDataHeight
    }

    get maxBoundedTextHeight(): number {
        if(this.contentFormatType == ContentFormatType.text_text2)
            return this.universalTileData.maxBoundedCategoryHeight
        return this.universalTileData.maxBoundedTextHeight
    }

    get content(): HTMLDivElement {
        if(this.contentFormatType == ContentFormatType.text_text2){
            return this.textText2Content
        }
        return super.content
    }

    get textText2Content(): HTMLDivElement {
        let content = document.createElement('div')
        content.append(this.text2Container, this.textContainer)
        return content
    }

    get text2Container(): HTMLDivElement {
        let text2Container = document.createElement('div')
        text2Container.className = 'text2Container'
        text2Container.style.position = 'relative'
        text2Container.style.display = 'flex'
        text2Container.style.height = this.maxBoundedText2Height + 'px'
        text2Container.style.maxHeight = this.contentBoundingBoxHeight + 'px'
        text2Container.style.maxWidth = this.maxHorizontalTextSpace + 'px'

        let text2 = this.text2Element
        text2.textContent = this.text2
        text2Container.append(text2)
        text2Container = this.setTextContainerAlignments(text2Container)
        return text2Container
    }

    get text2Element(): HTMLSpanElement {
        let text = document.createElement('span')
        text.className = 'text2'
        text.style.width = this.boundedText2Width + 'px'
        return text
    }


    get tileSettings(): TileSettings{
        if(this.contentFormatType == ContentFormatType.text_text2)
            return this.vs.measureTile
        return this.vs.headerTile
    }

    get textSettings(): TextSettings{
        if(this.contentFormatType == ContentFormatType.text_text2)
            return this.vs.categoryLabelText
        return this.vs.headerText
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


    onTileClick() {
        if(this.collection.hasCategory)
            this.visual.selectionManager.select((<CardData>this.tileData).selectionId, this.visual.visualSettings.content.multiselect)
        else
            this.visual.selectionManagerUnbound.select(this.i)
        this.collection.onStateChange(this.visual.createCardData()) 
    }

    onTileMouseover() {
        this.visual.hoveredIndex = this.i
        this.collection.onStateChange(this.visual.createCardData()) 
    }
    onTileMouseout() {
        this.visual.hoveredIndex = null
        this.collection.onStateChange(this.visual.createCardData()) 
    }
}

export class CardData extends TileData {
    selectionId?: ISelectionId
}

