import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';
import {select, scaleLinear, scaleOrdinal, color} from 'd3';
import $ from 'cash-dom';
import {rdKitModule} from './package'
import {_fingerprintSimilarity, _morganFP, moleculesToFingerprints} from './chem_searches'
import {GridCellRenderArgs, Property, Widget} from 'datagrok-api/dg';

export class MoleculeViewer extends DG.JsViewer {
  helpUrl = '/help/domains/chem/similarity-search.md';
  searchCanvas: HTMLDivElement;
  itemsView: DG.VirtualView;
  referenceDiv: HTMLDivElement;
  molCol: DG.Column; 
  isEditedFromSketcher: boolean;
  isClickedFromSelf: boolean;
  hotSearch: boolean;
  reference: string;
  molColumnName: string;
  drillDown: boolean; 
  syncWithCurrentRow: boolean;
  bindItemsToTableSubs: boolean;
  showValueColumnNames: string[];
  showScore: boolean;

  init() {
    this.helpUrl = '/help/domains/chem/similarity-search.md';
    this.searchCanvas = ui.divH([ui.h1('')]);
    this.itemsView = DG.VirtualView.create();
    this.referenceDiv = ui.divH([ui.h1('')]);
    this.molCol = new DG.Column([0]);
    this.isEditedFromSketcher = false;
    this.isClickedFromSelf = false;
    this.hotSearch = true;
  }

  constructor() {
    super();
    this.init();
    this.searchCanvas = ui.divH([ui.h1('')]);
    this.itemsView = DG.VirtualView.create();
    this.referenceDiv = ui.divH([ui.h1('')]);
    this.molCol = new DG.Column([0]);
    this.isEditedFromSketcher = false;
    this.isClickedFromSelf = false;
    this.hotSearch = true;

    this.reference = this.string('Reference', '');
    this.molColumnName = this.string('molColumnName',null);
    this.drillDown = this.bool('drillDown',false);
    this.syncWithCurrentRow = this.bool('syncWithCurrentRow',false);
    this.bindItemsToTableSubs = this.bool('bindItemsToTableSubs',false);
    this.showValueColumnNames = this.stringList('showValueColumnNames');
    this.showScore = this.bool('showScore',true);
  }

  onTableAttached() {
    this.init();
    let sketchButton = ui.button('Sketch', () => {
      let mol = '';
      this.isEditedFromSketcher = true;
      let sketcher = grok.chem.sketcher((_: any, molfile: string) => {
          mol = molfile;
          if (this.hotSearch) {
            this._search(mol).then();
          }
        }
      );
      let dialog = ui.dialog()
      .add(sketcher)
      if(!this.hotSearch){
        dialog.onOK(() => {
          this._search(mol).then();
        });
      }
      dialog.show();
    });

    sketchButton.id = 'reference';
    let rt = $(this.root);
    this.referenceDiv = ui.divH([ ui.divV([sketchButton])]);
    rt.append(ui.label('Reference'));
    rt.append(this.referenceDiv);
    rt.append(ui.label('Similar structures'));
    this.itemsView.root.style.flexGrow = '1';
    rt.append(this.itemsView.root);

    if (this.dataFrame) {
      this.subs.push(DG.debounce(
          this.dataFrame.onCurrentRowChanged, 50).subscribe(
            (_) => {
              if (this.syncWithCurrentRow && (this.drillDown || !this.isClickedFromSelf) &&
                !this.isEditedFromSketcher && this.dataFrame?.currentRow.idx !== -1)
                this._search(this.molCol.get(this.dataFrame?.currentRow.idx? this.dataFrame.currentRow.idx : 0)).then();
            }
        )
      );
      this.molCol = this.dataFrame.getCol(this.molColumnName);
      if (this.molCol != null && this.dataFrame.rowCount > 0)
        this._search(this.molCol.get(Math.max(this.dataFrame.currentRow.idx, 0))).then();
    }
  }

  detach() {
    this.subs.forEach((sub) => sub.unsubscribe());
  }

  onPropertyChanged(property: Property) {
    super.onPropertyChanged(property);
    if (this.dataFrame) {
      this.molCol = this.dataFrame.getCol(this.molColumnName);
    }
    this._search(this.reference).then();
    //todo: todo
  }

  async _search(smile: string){
    if(!this.molCol) return;
    this.reference = smile;
    const mol = rdKitModule.get_mol(smile);
    let svg = ui.div();
    svg.innerHTML = mol.get_svg();
    if (this.searchCanvas){
      this.searchCanvas = svg;
      this.referenceDiv.append(svg);
    }
    else{
      this.referenceDiv.replaceChild(svg,this.searchCanvas);
    }

    const fingerprint = _morganFP(smile);
    const fingerprintCol = moleculesToFingerprints(this.molCol);
    const distances: number[] = [];
    let fpSim = _fingerprintSimilarity
    const webWorker = false;
    if (webWorker) {
      //todo: implement
      fpSim = () => {throw new Error('Not Impemented yet')};
    }

    if (this.dataFrame) {
      for (let row = 0; row < this.dataFrame.rowCount; row++) {
        const fp = fingerprintCol.get(row);
        distances[row] = fp == null ? 100.0 : fpSim(fingerprint, fp);
      }
    }

    function range(end: number) {
      return Array(end).fill(0).map((_, idx) => idx)
    }

    function compare(i1: number, i2: number){
      if (distances[i1] > distances[i2]){
        return -1;
      }
      if (distances[i1] < distances[i2]){
        return 1;
      }
      return 0;
    }

    const indexes = range(this.dataFrame?.rowCount? this.dataFrame.rowCount : 0)
    .filter((idx) => fingerprintCol.get(idx) != null)
    .sort(compare);

    function renderMolecule(this: MoleculeViewer, i: number) {
      const idx = indexes[i];
      const smile = this.molCol.get(idx);
      const mol = rdKitModule.get_mol(smile);
      let svg = ui.div();
      svg.innerHTML = mol.get_svg();
      let host = ui.divV([svg]);

      if (this.showValueColumnNames?.length > 0) {
        let map = new Map();
        if (this.showScore) {
          map.set('Score',  distances[idx].toString());
        }
        map = new Map([...this.showValueColumnNames.map(
          cn => [cn, `${this.dataFrame?.get(cn,idx)}`]
        ), ...map.values()]);
        host.append(ui.tableFromMap(map));
      }
      else if (this.showScore) {
        host.append(ui.divText(`${distances[idx]}`).toString());
      }
      //Todo: how to bind them???
      // DG.DataFrameViewer.bindElementToRow(host, dataFrame, idx,
      //   beforeClick: () {
      //   this.isClickedFromSelf = true;
      //   if (!this.syncWithCurrentRow)
      //     itemsView.elements.forEach((i, e) => htmlSetClass(e, 'd4-current', false));
      // },
      // afterClick: () => this.isClickedFromSelf = false);
      return host;
    }

    this.itemsView.setData(indexes.length, renderMolecule);
    // if (this.bindItemsToTableSubs != null)
    //   for (var sub in bindItemsToTableSubs)
    //     sub.cancel();
    // if (look.syncWithCurrentRow)
    //   bindItemsToTableSubs = itemsView.bindItemsToTable(dataFrame,
    //     (tableIdx) => indexes.indexOf(tableIdx),
    //     (listIdx) => indexes[listIdx]);
  }
}

// <canvas width="400" height="200" tabindex="0" style="width: 200px; height: 100px;"></canvas>