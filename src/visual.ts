/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionIdBuilder = powerbi.extensibility.ISelectionIdBuilder;
import DataView = powerbi.DataView;
import VisualObjectInstancesToPersist = powerbi.VisualObjectInstancesToPersist
import DataViewPropertyValue = powerbi.DataViewPropertyValue
import VisualObjectInstance = powerbi.VisualObjectInstance
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject


import { VisualSettings } from "./settings";
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;

import { valueFormatter } from "powerbi-visuals-utils-formattingutils"

import * as d3 from "d3";
// import { ProcessedVisualSettings } from "./processedvisualsettings";

import { PropertyGroupKeys } from './TilesCollection/interfaces'
import { getPropertyStateNameArr, getObjectsToPersist } from './TilesCollectionUtlities/functions'
import { getCorrectPropertyStateName } from './TilesCollection/functions'
import { SelectionManagerUnbound } from './SelectionManagerUnbound'

type Selection<T extends d3.BaseType> = d3.Selection<T, any, any, any>;

// import * as enums from "./enums"
import { TileSizingType, TileLayoutType, TileShape, IconPlacement, State } from './TilesCollection/enums'

import { CardsCollection, CardData } from './CardsCollection'
import { ContentFormatType } from "./TilesCollection/enums";

export class Visual implements IVisual {
    private target: HTMLElement;
    public selectionManager: ISelectionManager;
    public selectionManagerUnbound: SelectionManagerUnbound
    private selectionManagerHover: ISelectionManager;
    private selectionIds: any = {};
    public host: IVisualHost;

    public visualSettings: VisualSettings;
    private selectionIdBuilder: ISelectionIdBuilder;

    private svg: Selection<SVGElement>;
    private container: Selection<SVGElement>;
    public hoveredIndex: number

    public shiftFired: boolean = false

    public visualElement: HTMLElement;

    public selectionIdKeys: string [] = []

    constructor(options: VisualConstructorOptions) {
        this.selectionIdBuilder = options.host.createSelectionIdBuilder();
        this.selectionManager = options.host.createSelectionManager();
        this.selectionManagerUnbound = new SelectionManagerUnbound()
        this.selectionManagerHover = options.host.createSelectionManager();
        this.host = options.host;
        this.visualElement = options.element

        this.svg = d3.select(options.element)
            .append('svg')
            .classed('slicer', true);

        this.container = this.svg.append("g")
            .classed('container', true);
    }

    public getEnumeratedStateProperties(propertyGroup: any, prefix?: string): { [propertyName: string]: DataViewPropertyValue } {
        let properties: { [propertyName: string]: DataViewPropertyValue } = {}
        let groupedKeyNamesArr: PropertyGroupKeys[] = getPropertyStateNameArr(Object.keys(propertyGroup))
        if (groupedKeyNamesArr.length > 0 && propertyGroup["state"]) {
            let state: State = propertyGroup["state"]
            for (let i = 0; i < groupedKeyNamesArr.length; i++) {
                let groupedKeyNames = groupedKeyNamesArr[i]
                if (prefix && !groupedKeyNames.default.startsWith(prefix))
                    continue
                switch (state) {
                    case State.all:
                        properties[groupedKeyNames.all] = propertyGroup[groupedKeyNames.all]
                        break
                    case State.selected:
                        properties[groupedKeyNames.selected] = propertyGroup[groupedKeyNames.selected]
                        break
                    case State.unselected:
                        properties[groupedKeyNames.unselected] = propertyGroup[groupedKeyNames.unselected]
                        break
                    case State.hovered:
                        properties[groupedKeyNames.hover] = propertyGroup[groupedKeyNames.hover]
                        break
                    case State.disabled:
                        properties[groupedKeyNames.disabled] = propertyGroup[groupedKeyNames.disabled]
                        break
                }
            }
        }

        return properties
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
        let objectName = options.objectName;
        let objectEnumeration: VisualObjectInstance[] = [];

        let properties: { [propertyName: string]: DataViewPropertyValue } = {}


        const settings: VisualSettings = this.visualSettings || <VisualSettings>VisualSettings.getDefault();
        switch (objectName) {
            case "measureTile":
                properties.state = settings.measureTile.state
                properties.hoverStyling = settings.measureTile.hoverStyling
                properties = {...properties, ...this.getEnumeratedStateProperties(settings.measureTile) }
                break
            case "headerTile":
                properties.state = settings.headerTile.state
                properties.hoverStyling = settings.headerTile.hoverStyling
                properties = {...properties, ...this.getEnumeratedStateProperties(settings.headerTile) }
                break
            case "categoryLabelText": {
                properties.state = settings.categoryLabelText.state
                properties.hoverStyling = settings.categoryLabelText.hoverStyling
                let iconPlacement = settings.icon[getCorrectPropertyStateName(settings.categoryLabelText.state, 'placement')] as IconPlacement
                let filtered = Object.keys(settings.categoryLabelText)
                    .filter(key => !(settings.icon.icons && iconPlacement != IconPlacement.above && key == "bmarginA"))
                    .reduce((obj, key) => {
                        obj[key] = settings.categoryLabelText[key]
                        return obj;
                    }, {})

                properties = {...properties, ...this.getEnumeratedStateProperties(filtered) }
                break
            }
            case "dataLabelText": {
                properties.state = settings.dataLabelText.state
                properties.hoverStyling = settings.dataLabelText.hoverStyling
                let iconPlacement = settings.icon[getCorrectPropertyStateName(settings.dataLabelText.state, 'placement')] as IconPlacement
                let filtered = Object.keys(settings.dataLabelText)
                    .filter(key => !(settings.icon.icons && iconPlacement != IconPlacement.above && key == "bmarginA"))
                    .reduce((obj, key) => {
                        obj[key] = settings.dataLabelText[key]
                        return obj;
                    }, {})

                properties = {...properties, ...this.getEnumeratedStateProperties(filtered) }
                break
            }
            case "headerText": {
                properties.state = settings.headerText.state
                properties.hoverStyling = settings.headerText.hoverStyling
                let iconPlacement = settings.icon[getCorrectPropertyStateName(settings.headerText.state, 'placement')] as IconPlacement
                let filtered = Object.keys(settings.headerText)
                    .filter(key => !(settings.icon.icons && iconPlacement != IconPlacement.above && key == "bmarginA"))
                    .reduce((obj, key) => {
                        obj[key] = settings.headerText[key]
                        return obj;
                    }, {})

                properties = {...properties, ...this.getEnumeratedStateProperties(filtered) }
                break
            }
            case "icon":{
                properties.icons = settings.icon.icons
                let excludeWhenLeft = ["topMarginA", "bottomMarginA"]

                if (settings.icon.icons) {
                    let iconPlacement = settings.icon[getCorrectPropertyStateName(settings.icon.state, 'placement')] as IconPlacement
                    properties.state = settings.icon.state
                    properties.hoverStyling = settings.icon.hoverStyling
                    let filtered = Object.keys(settings.icon)
                        .filter(key => !(iconPlacement && excludeWhenLeft.indexOf(key) > -1))
                        .reduce((obj, key) => {
                            obj[key] = settings.icon[key]
                            return obj;
                        }, {})


                    properties = { ...properties, ...this.getEnumeratedStateProperties(filtered) }
                }
                break}
            case "layout": {
                let excludeWhenNotFixed = ["tileWidth", "tileHeight", "tileAlignment"]

                let filtered = Object.keys(settings.layout)
                    .filter(key => !(key.endsWith("Angle") || key.endsWith("Length"))
                        || key == settings.layout.tileShape + "Angle"
                        || key == settings.layout.tileShape + "Length")
                    .filter(key => !(settings.layout.sizingMethod != TileSizingType.fixed && excludeWhenNotFixed.indexOf(key) > -1))
                    .filter(key => !(settings.layout.tileLayout != TileLayoutType.grid && key == "tilesPerRow"))
                    .reduce((obj, key) => {
                        obj[key] = settings.layout[key]
                        return obj;
                    }, {})

                properties = { ...properties, ...filtered }
                break
            }
            case "effect":
                properties.shapeRoundedCornerRadius = settings.effect.shapeRoundedCornerRadius
                properties.state = settings.effect.state
                properties.hoverStyling = settings.effect.hoverStyling
                properties.shadow = settings.effect.shadow
                if (settings.effect.shadow)
                    properties = { ...properties, ...this.getEnumeratedStateProperties(settings.effect, "shadow") }
                properties.glow = settings.effect.glow
                if (settings.effect.glow)
                    properties = { ...properties, ...this.getEnumeratedStateProperties(settings.effect, "glow") }
                break
            case "content":
                properties = { ...properties, ...settings.content }
                break
        }

        objectEnumeration.push({
            objectName: objectName,
            properties: properties,
            selector: null
        })

        return objectEnumeration
    }

    public options: VisualUpdateOptions;

    public update(options: VisualUpdateOptions) {
        if (!(options
            && options.dataViews
            && options.dataViews[0]
        ))
            return
        this.options = options
        this.visualSettings = VisualSettings.parse(options.dataViews[0]) as VisualSettings
        let objects: powerbi.VisualObjectInstancesToPersist = getObjectsToPersist(this.visualSettings)
        if (objects.merge.length != 0)
            this.host.persistProperties(objects);


        let cardsCollection = new CardsCollection()

        cardsCollection.formatSettings.icon = this.visualSettings.icon
        cardsCollection.formatSettings.layout = this.visualSettings.layout
        cardsCollection.formatSettings.effect = this.visualSettings.effect


        cardsCollection.svg = this.svg
        cardsCollection.container = this.container
        cardsCollection.viewport = {
            height: options.viewport.height,
            width: options.viewport.width,
        }
        cardsCollection.visual = this
        cardsCollection.options = options
        cardsCollection.visualElement = this.visualElement
        

        
        let dataView = this.options.dataViews[0]
        let allCategories: powerbi.DataViewCategoryColumn[] = dataView.categorical.categories;
        let measures: powerbi.DataViewValueColumn[] = dataView.categorical.values
        let categories = allCategories && allCategories[0]
        if (categories) {
            this.visualSettings.layout.tileLayout = TileLayoutType.grid
            this.visualSettings.layout.tilesPerRow = measures.length + 1
            cardsCollection.hasCategory = true
        }

        cardsCollection.render(this.createCardData())
    }

    public createCardData(): CardData[] {

        

        let cardData: CardData[] = []

        let dataView = this.options.dataViews[0]
        let categories: powerbi.DataViewCategoryColumn[] = dataView.categorical.categories;
        let measures: powerbi.DataViewValueColumn[] = dataView.categorical.values
        let selectionIdKeys: string[] = (this.selectionManager.getSelectionIds() as powerbi.visuals.ISelectionId[]).map(x => x.getKey()) as string[]
        if(selectionIdKeys.indexOf(undefined) == -1)
            this.selectionIdKeys = selectionIdKeys

        let categoryInstanceSelectionIds: powerbi.visuals.ISelectionId[] = []

        for (let i = 0; i < measures.length; i++) {
            let iValueFormatter = valueFormatter.create({ format: measures[i].source.format });
            if (categories) {
                for (let j = 0; j < categories[0].values.length; j++) {
                    if (i == 0) {
                        let categoryInstanceId = this.host.createSelectionIdBuilder()
                            .withCategory(categories[0], j)
                            .createSelectionId();
                        categoryInstanceSelectionIds[j] = categoryInstanceId

                        cardData[j * (measures.length + 1)] = {
                            text: categories[0].values[j].toString(),
                            selectionId: categoryInstanceSelectionIds[j],
                            get isSelected(): boolean {
                                return this.selectionId &&
                                    selectionIdKeys &&
                                    selectionIdKeys.indexOf(this.selectionId.getKey() as string) > -1
                            },
                            isHovered: this.hoveredIndex == j * (measures.length + 1),
                        }
                    }
                    cardData[j * (measures.length + 1) + i + 1] = {
                        text: measures[i].source.displayName,
                        text2: iValueFormatter.format(measures[i].values[j]),
                        contentFormatType: ContentFormatType.text_text2,
                        selectionId: categoryInstanceSelectionIds[j],
                        get isSelected(): boolean {
                            return this.selectionId &&
                                selectionIdKeys &&
                                selectionIdKeys.indexOf(this.selectionId.getKey() as string) > -1
                        },
                        isHovered: this.hoveredIndex == j * (measures.length + 1) + i + 1
                    }
                }
            } else {
                cardData[i] = {
                    text: measures[i].source.displayName,
                    text2: iValueFormatter.format(measures[i].values[0]),
                    contentFormatType: ContentFormatType.text_text2,
                    isHovered: this.hoveredIndex == i,
                    isSelected: this.selectionManagerUnbound.getSelectionIndexes().indexOf(i) > -1,
                }
            }
        }
        return cardData
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return <VisualSettings>VisualSettings.parse(dataView);
    }
}