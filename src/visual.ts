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
import VisualObjectInstance = powerbi.VisualObjectInstance
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject


import { VisualSettings } from "./settings";
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;

import { valueFormatter } from "powerbi-visuals-utils-formattingutils"

import * as d3 from "d3";
// import { ProcessedVisualSettings } from "./processedvisualsettings";

import { PropertyGroupKeys } from './TilesCollection/interfaces'
import { getPropertyStateNameArr, getObjectsToPersist, getCorrectPropertyStateName } from './functions'
import { SelectionManagerUnbound } from './SelectionManagerUnbound'

type Selection<T extends d3.BaseType> = d3.Selection<T, any, any, any>;

// import * as enums from "./enums"
import { TileSizingType, TileLayoutType, TileShape, IconPlacement, State } from './TilesCollection/enums'
import { ContentSource } from './enums'

import { select, merge } from "d3";


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


    constructor(options: VisualConstructorOptions) {
        this.selectionIdBuilder = options.host.createSelectionIdBuilder();
        this.selectionManager = options.host.createSelectionManager();
        this.selectionManagerUnbound = new SelectionManagerUnbound()
        this.selectionManagerHover = options.host.createSelectionManager();
        this.host = options.host;
        this.svg = d3.select(options.element)
            .append('svg')
            .classed('navigator', true);

        this.container = this.svg.append("g")
            .classed('container', true);
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
        const settings: VisualSettings = this.visualSettings || <VisualSettings>VisualSettings.getDefault();
        let settingsKeys = Object.keys(settings)
        for (let i = 0; i < settingsKeys.length; i++) {
            let settingKey: string = settingsKeys[i]
            let groupedKeyNamesArr: PropertyGroupKeys[] = getPropertyStateNameArr(Object.keys(settings[settingKey]))
            for (let j = 0; j < groupedKeyNamesArr.length; j++) {
                let groupedKeyNames: PropertyGroupKeys = groupedKeyNamesArr[j]
                switch (settings[settingKey].state) {
                    case State.all:
                        delete settings[settingKey][groupedKeyNames.selected]
                        delete settings[settingKey][groupedKeyNames.unselected]
                        delete settings[settingKey][groupedKeyNames.hover]
                        break
                    case State.selected:
                        delete settings[settingKey][groupedKeyNames.all]
                        delete settings[settingKey][groupedKeyNames.unselected]
                        delete settings[settingKey][groupedKeyNames.hover]
                        break
                    case State.unselected:
                        delete settings[settingKey][groupedKeyNames.all]
                        delete settings[settingKey][groupedKeyNames.selected]
                        delete settings[settingKey][groupedKeyNames.hover]
                        break
                    case State.hovered:
                        delete settings[settingKey][groupedKeyNames.all]
                        delete settings[settingKey][groupedKeyNames.selected]
                        delete settings[settingKey][groupedKeyNames.unselected]
                        break
                }
            }
        }
        let iconSettingsKeys: string[] = Object.keys(settings.icon)
        if (!settings.icon.icons)
            for (let i = 0; i < iconSettingsKeys.length; i++)
                if (iconSettingsKeys[i] != 'icons')
                    delete settings.icon[iconSettingsKeys[i]]
        let effectSettingsKeys: string[] = Object.keys(settings.effects)
        if (!settings.effects.shadow)
            for (let i = 0; i < effectSettingsKeys.length; i++)
                if (effectSettingsKeys[i].startsWith("shadow") && effectSettingsKeys[i] != "shadow")
                    delete settings.effects[effectSettingsKeys[i]]
        if (!settings.effects.glow)
            for (let i = 0; i < effectSettingsKeys.length; i++)
                if (effectSettingsKeys[i].startsWith("glow") && effectSettingsKeys[i] != "glow")
                    delete settings.effects[effectSettingsKeys[i]]

        let iconPlacement = settings.icon[getCorrectPropertyStateName(settings.icon.state, 'placement')] as IconPlacement
        if (iconPlacement == IconPlacement.left) {
            delete settings.icon[getCorrectPropertyStateName(settings.icon.state, "topMargin")]
            delete settings.icon[getCorrectPropertyStateName(settings.icon.state, "bottomMargin")]
        }
        // if(!(settings.content.source != ContentSource.measures && settings.icon.icons && iconPlacement == IconPlacement.above))
        //     delete settings.text[getCorrectPropertyStateName(settings.text.state, "bmargin")]

        if (settings.layout.sizingMethod != TileSizingType.fixed) {
            delete settings.layout.tileWidth;
            delete settings.layout.tileHeight;
            delete settings.layout.tileAlignment;
        }
        if (settings.layout.tileLayout != TileLayoutType.grid) {
            delete settings.layout.rowLength
        }

        if (settings.layout.tileShape != TileShape.parallelogram) {
            delete settings.layout.parallelogramAngle
        }
        if (settings.layout.tileShape != TileShape.chevron) {
            delete settings.layout.chevronAngle
        }
        if (settings.layout.tileShape != TileShape.pentagon) {
            delete settings.layout.pentagonAngle
        }
        if (settings.layout.tileShape != TileShape.hexagon) {
            delete settings.layout.hexagonAngle
        }
        if (settings.layout.tileShape != TileShape.tab_cutCorners) {
            delete settings.layout.tab_cutCornersLength
        }
        if (settings.layout.tileShape != TileShape.tab_cutCorner) {
            delete settings.layout.tab_cutCornerLength
        }

        return VisualSettings.enumerateObjectInstances(settings, options);
    }

    public update(options: VisualUpdateOptions) {
        if (!(options && options.dataViews && options.dataViews[0]))
            return
        this.visualSettings = VisualSettings.parse(options.dataViews[0]) as VisualSettings
        let objects: powerbi.VisualObjectInstancesToPersist = getObjectsToPersist(this.visualSettings)
        if (objects.merge.length != 0)
            this.host.persistProperties(objects);


        this.svg
            .style('width', options.viewport.width)
            .style('height', options.viewport.height)


        let cardsCollection = new CardsCollection()

        cardsCollection.formatSettings.icon = this.visualSettings.icon
        cardsCollection.formatSettings.layout = this.visualSettings.layout
        cardsCollection.formatSettings.effect = this.visualSettings.effects


        cardsCollection.container = this.container
        cardsCollection.viewport = {
            height: options.viewport.height,
            width: options.viewport.width,
        }
        cardsCollection.visual = this
        cardsCollection.options = options
        let dataView = options.dataViews[0]
        let categories: powerbi.DataViewCategoryColumn[] = dataView.categorical.categories;
        let measures: powerbi.DataViewValueColumn[] = dataView.categorical.values
        let selectionIdKeys: string[] = (this.selectionManager.getSelectionIds() as powerbi.visuals.ISelectionId[]).map(x => x.getKey()) as string[]


        if (categories) {
            this.visualSettings.layout.tileLayout = TileLayoutType.grid
            this.visualSettings.layout.rowLength = measures.length + 1
            cardsCollection.hasCategory = true
        }

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

                        cardsCollection.tilesData[j * (measures.length + 1)] = {
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
                    cardsCollection.tilesData[j * (measures.length + 1) + i + 1] = {
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
                cardsCollection.tilesData[i] = {
                    text: measures[i].source.displayName,
                    text2: iValueFormatter.format(measures[i].values[0]),
                    contentFormatType: ContentFormatType.text_text2,
                    isHovered: this.hoveredIndex == i,
                    isSelected: this.selectionManagerUnbound.getSelectionIndexes().indexOf(i) > -1,
                }
            }
        }


        cardsCollection.render()
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return <VisualSettings>VisualSettings.parse(dataView);
    }
}