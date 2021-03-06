/*
 *  Power BI Visualizations
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

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;
import * as TileCollectionFormatSettings from "./TilesCollection/FormatSettings"

export class MeasureTileFillSettings extends TileCollectionFormatSettings.TileFillSettings{
    public colorD: string = "#fff";
}
export class MeasureTileStrokeSettings extends TileCollectionFormatSettings.TileStrokeSettings{
}


export class HeaderTileFillSettings extends TileCollectionFormatSettings.TileFillSettings{
  public colorD: string = "#fff";
}
export class HeaderTileStrokeSettings extends TileCollectionFormatSettings.TileStrokeSettings{
}


export class HeaderTextSettings extends TileCollectionFormatSettings.TextSettings{
    public colorD: string = "#252423";
    public fontSizeD: number = 20;
}
export class CategoryLabelTextSettings extends TileCollectionFormatSettings.TextSettings{
    public colorD: string = "#666666";
    public fontSizeD: number = 12;
    public fontFamilyD: string = "Segoe UI";
}
export class DataLabelTextSettings extends TileCollectionFormatSettings.TextSettings{
    public colorD: string = "#252423";
    public fontSizeD: number = 45;
    public fontFamilyD: string = "Segoe UI";
}

export class IconSettings extends TileCollectionFormatSettings.IconSettings{
}

export class ShapeSettings extends TileCollectionFormatSettings.ShapeSettings{
}

export class LayoutSettings extends TileCollectionFormatSettings.LayoutSettings{
}

export class ContentAlignmentSettings extends TileCollectionFormatSettings.ContentAlignmentSettings{
}

export class EffectSettings extends TileCollectionFormatSettings.EffectSettings{
}

export class ContentSettings{
  public multiselect: boolean = false
}

export class VisualSettings extends DataViewObjectsParser {
  public measureTileFill: MeasureTileFillSettings = new MeasureTileFillSettings();
  public measureTileStroke: MeasureTileStrokeSettings = new MeasureTileStrokeSettings()
  public categoryLabelText: CategoryLabelTextSettings = new CategoryLabelTextSettings();
  public dataLabelText: DataLabelTextSettings = new DataLabelTextSettings();
  
  public headerTileFill: HeaderTileFillSettings = new HeaderTileFillSettings();
  public headerTileStroke: HeaderTileStrokeSettings = new HeaderTileStrokeSettings();
  public headerText: HeaderTextSettings = new HeaderTextSettings();

  public icon: IconSettings = new IconSettings();
  public shape: ShapeSettings = new ShapeSettings();
  public layout: LayoutSettings = new LayoutSettings();
  public content: ContentSettings = new ContentSettings();
  public contentAlignment: ContentAlignmentSettings = new ContentAlignmentSettings();
  public effect: EffectSettings = new EffectSettings();
}