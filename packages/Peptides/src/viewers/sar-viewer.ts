import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';

import $ from 'cash-dom';

import {describe} from '../describe';
import { Subject } from 'rxjs';

export class SARViewerModel {
  private viewerGrid: Subject<DG.Grid> = new Subject<DG.Grid>();
  private viewerVGrid: Subject<DG.Grid> = new Subject<DG.Grid>();
  private statsDf: Subject<DG.DataFrame> = new Subject<DG.DataFrame>();
  public viewerGrid$ = this.viewerGrid.asObservable();
  public viewerVGrid$ = this.viewerVGrid.asObservable();
  public statsDf$ = this.statsDf.asObservable();

  async updateData(
      df: DG.DataFrame,
      activityCol: string,
      activityScaling: string,
      sourceGrid: DG.Grid,
      twoColorMode: boolean,
      initialBitset: DG.BitSet | null,
    ) {
    const [viewerGrid, viewerVGrid, statsDf] =
      await describe(df, activityCol, activityScaling, sourceGrid, twoColorMode, initialBitset);
    this.viewerGrid.next(viewerGrid);
    this.viewerVGrid.next(viewerVGrid);
    this.statsDf.next(statsDf);
  }
}

let model = new SARViewerModel();

export class SARViewer extends DG.JsViewer {
  protected viewerGrid: DG.Grid | null;
  protected sourceGrid: DG.Grid | null;
  protected activityColumnColumnName: string;
  protected activityScalingMethod: string;
  protected bidirectionalAnalysis: boolean;
  protected filterMode: boolean;
  protected statsDf: DG.DataFrame | null;
  protected initialized: boolean;
  protected viewGridInitialized: boolean;
  protected aminoAcidResidue;
  protected _initialBitset: DG.BitSet | null;
  protected viewerVGrid: DG.Grid | null;
  protected currentBitset: DG.BitSet | null;
  // private df: DG.DataFrame | null;
  // protected pValueThreshold: number;
  // protected amountOfBestAARs: number;
  // duplicatesHandingMethod: string;
  constructor() {
    super();
    
    this.viewerGrid = null;
    this.viewerVGrid = null;
    this.statsDf = null;
    this.initialized = false;
    this.aminoAcidResidue = 'AAR';
    this._initialBitset = null;
    this.viewGridInitialized = false;
    this.currentBitset = null;

    //TODO: find a way to restrict activityColumnColumnName to accept only numerical columns (double even better)
    this.activityColumnColumnName = this.string('activityColumnColumnName');
    this.activityScalingMethod = this.string('activityScalingMethod', 'none', {choices: ['none', 'lg', '-lg']});
    this.filterMode = this.bool('filterMode', false);
    this.bidirectionalAnalysis = this.bool('bidirectionalAnalysis', false);
    // this.pValueThreshold = this.float('pValueThreshold', 0.1);
    // this.amountOfBestAARs = this.int('amountOfBestAAR', 1);
    // this.duplicatesHandingMethod = this.string('duplicatesHandlingMethod', 'median', {choices: ['median']});

    this.sourceGrid = null;
  }

  init() {
    this._initialBitset = this.dataFrame!.filter.clone();
    this.initialized = true;
    this.subs.push(model.statsDf$.subscribe(data => this.statsDf = data));
    this.subs.push(model.viewerGrid$.subscribe(data => this.viewerGrid = data));
    this.subs.push(model.viewerVGrid$.subscribe(data => this.viewerVGrid = data));
  }

  onTableAttached() {
    this.sourceGrid = this.view.grid;
    this.sourceGrid?.dataFrame?.setTag('dataType', 'peptides');
    this.render();
  }

  detach() {
    this.subs.forEach((sub) => sub.unsubscribe());
  }

  onPropertyChanged(property: DG.Property) {
    super.onPropertyChanged(property);

    if (!this.initialized) {
      this.init();
      return;
    }

    if (property.name === 'activityScalingMethod' && typeof this.dataFrame !== 'undefined') {
      const minActivity = DG.Stats.fromColumn(
        this.dataFrame!.col(this.activityColumnColumnName)!,
        this._initialBitset,
      ).min;
      if (minActivity && minActivity <= 0 && this.activityScalingMethod !== 'none') {
        grok.shell.warning(`Could not apply ${this.activityScalingMethod}: ` +
          `activity column ${this.activityColumnColumnName} contains zero or negative values, falling back to 'none'.`);
        property.set(this, 'none');
        return;
      }
    }

    this.render();
  }

  private applyBitset() {
    if (
      this.dataFrame &&
      this.viewerGrid &&
      this.viewerGrid.dataFrame &&
      this.viewerGrid.dataFrame.currentCell.value &&
      this.viewerGrid.dataFrame.currentCol.name !== this.aminoAcidResidue
    ) {
      const currentAAR: string =
        this.viewerGrid.dataFrame.get(this.aminoAcidResidue, this.viewerGrid.dataFrame.currentRowIdx);
      const currentPosition = this.viewerGrid.dataFrame.currentCol.name;

      const splitColName = '~splitCol';
      const otherLabel = 'Other';
      const aarLabel = `${currentAAR === '-' ? 'Empty' : currentAAR} - ${currentPosition}`;

      let splitCol = this.dataFrame.col(splitColName);
      if (!splitCol) {
        splitCol = this.dataFrame.columns.addNew(splitColName, 'string');
      }

      const isChosen = (i: number) => this.dataFrame!.get(currentPosition, i) === currentAAR;
      splitCol!.init((i) => isChosen(i) ? aarLabel : otherLabel);

      //TODO: use column.compact

      // if (this.filterMode) {
      //   this.dataFrame.selection.setAll(false, false);
      //   this.dataFrame.filter.init(isChosen).and(this._initialBitset!, false);
      // } else {
      //   this.dataFrame.filter.copyFrom(this._initialBitset!);
      //   this.dataFrame.selection.init(isChosen).and(this._initialBitset!, false);
      // }
      this.currentBitset = DG.BitSet.create(this.dataFrame.rowCount, isChosen).and(this._initialBitset!);
      // (this.filterMode ? this.dataFrame.selection.setAll(false) :
      // this.dataFrame.filter.copyFrom(this._initialBitset!)).fireChanged();
      this.sourceFilteringFunc();


      // df.getCol(splitColName).setCategoryOrder([otherLabel, aarLabel]);
      const colorMap: {[index: string]: string | number} = {};
      colorMap[otherLabel] = DG.Color.blue;
      colorMap[aarLabel] = DG.Color.orange;
      // colorMap[currentAAR] = cp.getColor(currentAAR);
      this.dataFrame.getCol(splitColName).colors.setCategorical(colorMap);
    }
  }

  private sourceFilteringFunc() {
    if (this.filterMode) {
      this.dataFrame!.selection.setAll(false, false);
      this.dataFrame!.filter.copyFrom(this.currentBitset!);
    } else {
      this.dataFrame!.filter.copyFrom(this._initialBitset!);
      this.dataFrame!.selection.copyFrom(this.currentBitset!);
    }
  }

  private accordionFunc(accordion: DG.Accordion) {
    if (accordion.context instanceof DG.RowGroup) {
      const originalDf: DG.DataFrame = DG.toJs(accordion.context.dataFrame);

      if (
        originalDf.getTag('dataType') === 'peptides' &&
        originalDf.col('~splitCol') &&
        this.viewerGrid &&
        this.viewerGrid.dataFrame
      ) {
        const currentAAR: string = this.viewerGrid.dataFrame.get(
          this.aminoAcidResidue,
          this.viewerGrid.dataFrame.currentRowIdx,
        );
        const currentPosition = this.viewerGrid.dataFrame.currentCol.name;

        const labelStr = `${currentAAR === '-' ? 'Empty' : currentAAR} - ${currentPosition}`;
        const currentColor = DG.Color.toHtml(DG.Color.orange);
        const otherColor = DG.Color.toHtml(DG.Color.blue);
        const currentLabel = ui.label(labelStr, {style: {color: currentColor}});
        const otherLabel = ui.label('Other', {style: {color: otherColor}});

        const elements: (HTMLLabelElement | HTMLElement)[] = [currentLabel, otherLabel];

        const distPane = accordion.getPane('Distribution');
        if (distPane) {
          accordion.removePane(distPane);
        }
        accordion.addPane('Distribution', () => {
          const hist = originalDf.clone(this._initialBitset).plot.histogram({
          // const hist = originalDf.plot.histogram({
            filteringEnabled: false,
            valueColumnName: `${this.activityColumnColumnName}Scaled`,
            splitColumnName: '~splitCol',
            legendVisibility: 'Never',
            showXAxis: true,
            showColumnSelector: false,
            showRangeSlider: false,
          }).root;
          hist.style.width = 'auto';
          elements.push(hist);

          const tableMap: {[key: string]: string} = {'Statistics:': ''};
          for (const colName of new Set(['Count', 'pValue', 'Mean difference'])) {
            const query = `${this.aminoAcidResidue} = ${currentAAR} and Position = ${currentPosition}`;
            const textNum = this.statsDf?.groupBy([colName]).where(query).aggregate().get(colName, 0);
            // const text = textNum === 0 ? '<0.01' : `${colName === 'Count' ? textNum : textNum.toFixed(2)}`;
            const text = colName === 'Count' ? `${textNum}` : textNum < 0.01 ? '<0.01' : textNum.toFixed(2);
            tableMap[colName === 'pValue' ? 'p-value' : colName] = text;
          }
          elements.push(ui.tableFromMap(tableMap));

          return ui.divV(elements);
        }, true);
      }
    }
  }

  syncGridsFunc(sourceVertical: boolean) { //TODO: refactor
    if (this.viewerGrid && this.viewerGrid.dataFrame && this.viewerVGrid && this.viewerVGrid.dataFrame) {
      if (sourceVertical) {
        const dfCell = this.viewerVGrid.dataFrame.currentCell;
        if (dfCell.column === null || dfCell.column.name !== 'Mean difference') {
          return;
        }
        const otherColName: string = this.viewerVGrid.dataFrame.get('Position', dfCell.rowIndex);
        const otherRowName: string = this.viewerVGrid.dataFrame.get(this.aminoAcidResidue, dfCell.rowIndex);
        let otherRowIndex = -1;
        for (let i = 0; i < this.viewerGrid.dataFrame.rowCount; i++) {
          if (this.viewerGrid.dataFrame.get(this.aminoAcidResidue, i) === otherRowName) {
            otherRowIndex = i;
            break;
          }
        }
        if (otherRowIndex !== -1) {
          this.viewerGrid.dataFrame.currentCell = this.viewerGrid.dataFrame.cell(otherRowIndex, otherColName);
        }
      } else {
        const otherPos: string = this.viewerGrid.dataFrame.currentCol?.name;
        if (typeof otherPos === 'undefined' && otherPos !== this.aminoAcidResidue) {
          return;
        }
        const otherAAR: string =
          this.viewerGrid.dataFrame.get(this.aminoAcidResidue, this.viewerGrid.dataFrame.currentRowIdx);
        let otherRowIndex = -1;
        for (let i = 0; i < this.viewerVGrid.dataFrame.rowCount; i++) {
          if (
            this.viewerVGrid.dataFrame.get(this.aminoAcidResidue, i) === otherAAR &&
            this.viewerVGrid.dataFrame.get('Position', i) === otherPos
          ) {
            otherRowIndex = i;
            break;
          }
        }
        if (otherRowIndex !== -1) {
          this.viewerVGrid.dataFrame.currentCell = this.viewerVGrid.dataFrame.cell(otherRowIndex, 'Mean difference');
        }
      }
    }
  }
  // argument compute data can be used to just redraw grids.
  // Probably iirelevant since mostly grids are updating themselves, and render is only used to update data.
  async render(computeData = true) {
    if (!this.initialized) {
      return;
    }
    //TODO: optimize. Don't calculate everything again if only view changes
    if (computeData) {
      if (typeof this.dataFrame !== 'undefined' && this.activityColumnColumnName && this.sourceGrid) {
        // [this.viewerGrid, this.viewerVGrid, this.statsDf] = await describe(
        //   this.dataFrame,
        //   this.activityColumnColumnName,
        //   this.activityScalingMethod,
        //   this.sourceGrid,
        //   this.bidirectionalAnalysis,
        //   this._initialBitset,
        // );
        await model?.updateData(
          this.dataFrame!,
          this.activityColumnColumnName,
          this.activityScalingMethod,
          this.sourceGrid,
          this.bidirectionalAnalysis,
          this._initialBitset,
        );

        if (this.viewerGrid !== null && this.viewerVGrid !== null) {
          $(this.root).empty();
          this.root.appendChild(this.viewerGrid.root);
          this.viewerGrid.dataFrame!.onCurrentCellChanged.subscribe((_) => {
            this.applyBitset();
            this.syncGridsFunc(false);
          });
          this.viewerVGrid.dataFrame!.onCurrentCellChanged.subscribe((_) => this.syncGridsFunc(true));
          this.dataFrame!.onRowsFiltering.subscribe((_) => this.sourceFilteringFunc());

          grok.events.onAccordionConstructed.subscribe((accordion: DG.Accordion) => this.accordionFunc(accordion));
        }
      }
    }
    //fixes viewers not rendering immediately after analyze.
    this.viewerVGrid?.invalidate();
    this.viewerGrid?.invalidate();
  }
}

export class SARViewerVertical extends DG.JsViewer {
  viewerVGrid: DG.Grid | null;
  constructor() {
    super();

    this.viewerVGrid = null;
    this.subs.push(model.viewerVGrid$.subscribe(data => {
      this.viewerVGrid = data;
      this.render();
    }));
  }

  render() {
    if (this.viewerVGrid) {
      $(this.root).empty();
      this.root.appendChild(this.viewerVGrid.root);
    }
  }
}