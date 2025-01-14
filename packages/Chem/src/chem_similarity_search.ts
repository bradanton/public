import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';
import {GridCellRenderArgs, Property, Widget} from 'datagrok-api/dg';
import {getMorganFingerprints} from './package';
import {_morganFP /*, _fingerprintSimilarity*/} from './chem_searches';

/* 

export class MoleculeViewer extends DG.JsViewer {
  private moleculeColumnName: string;
  private initialized: boolean;
  private isEditedFromSketcher: boolean = false;
  private hotSearch: boolean = true;
  private sketchButton: HTMLButtonElement;

  constructor() {
    super();

    // Register properties and define fields initialized to properties' default values
    // Properties that represent columns should end with the 'ColumnName' postfix
    this.moleculeColumnName = this.string('moleculeColumnName', 'smiles');
    this.initialized = false;
    this.sketchButton = ui.button('Sketch', () => {
      let mol = '';
      this.isEditedFromSketcher = true;
      let sketcher = grok.chem.sketcher((_: any, molfile: string) => {
          mol = molfile;
          if (this.hotSearch) {
            // this._search(mol).then();
          }
        }
      );
      let dialog = ui.dialog()
      .add(sketcher)
      if(!this.hotSearch){
        dialog.onOK(() => {
          // this._search(mol).then();
        });
      }
      dialog.show();
    });
    this.sketchButton.id = 'reference';
  }

  // Additional chart settings
  init(): void {
    this.initialized = true;
    this.isEditedFromSketcher = false;
    this.hotSearch = true;
  }

  // Stream subscriptions
  onTableAttached(): void {
    this.init();

    if (this.dataFrame) {
      this.subs.push(DG.debounce(this.dataFrame.onCurrentRowChanged, 50).subscribe((_) => this.render()));
      this.subs.push(DG.debounce(this.dataFrame.selection.onChanged, 50).subscribe((_) => this.render(false)));
      this.subs.push(DG.debounce(this.dataFrame.filter.onChanged, 50).subscribe((_) => this.render()));
      this.subs.push(DG.debounce(ui.onSizeChanged(this.root), 50).subscribe((_) => this.render(false)));
    }

    this.render();
  }

  // Cancel subscriptions when the viewer is detached
  detach() {
    this.subs.forEach(sub => sub.unsubscribe());
  }

  onPropertyChanged(property: Property): void {
    super.onPropertyChanged(property);
    if (this.initialized) {
      if (property.name === 'moleculeColumnName' &&
          this.dataFrame?.getCol(this.moleculeColumnName).type !== property.propertyType) {
            grok.shell.error('Wrong property type');
            return;
      }
      this.render();
    }
    this.render();
  }
  
  render(computeData = true): void {
    if (!this.initialized) {
      return;
    }
    if (this.dataFrame && computeData) {
      if (this.root.hasChildNodes())
        this.root.removeChild(this.root.childNodes[0]);

      const curIdx = this.dataFrame.currentRowIdx;
      const df = chemSimilaritySearch(this.dataFrame, this.dataFrame?.getCol(this.moleculeColumnName), 
        this.dataFrame?.getCol(this.moleculeColumnName).get(curIdx), 'tanimoto', 10, 0.1);

      const molCol = df.getCol('smiles');
      const idxs = df.getCol('indexes');
      const scores = df.getCol('score');
      let g = [], cnt = 0;
      g[cnt++] = ui.h1('SVG rendering');
      g[cnt++] = this.sketchButton;
      for (let i = 0; i < molCol.length; ++i) {
        let mol = grok.chem.svgMol(molCol?.get(i), 250, 100);
        const text = ui.p(`${scores.get(i).toPrecision(3)}`);

        let grid = ui.div([mol, text]);
        grid.addEventListener("click", (event: Event) => {
          if (this.dataFrame) {
            this.dataFrame.currentRowIdx = idxs.get(i);
          }
        });
        g[cnt++] = grid;
      }
      this.root.appendChild(ui.div(g));
    }
  }
}

//name: chemSimilaritySearch
//input: dataframe table
//input: column smiles
//input: string molecule
//input: string metric = tanimoto
//input: int limit = 10
//input: double minScore = 0.7
export function chemSimilaritySearch(
  table: DG.DataFrame,
  smiles: DG.Column,
  molecule: string,
  metric: string,
  limit: number,
  minScore: number,
) {
  const options = {
    'minPath': 1,
    'maxPath': 7,
    'fpSize': 2048,
    'bitsPerHash': 2,
    'useHs': true,
    'tgtDensity': 0.0,
    'minSize': 128,
  };
  limit = Math.min(limit, smiles.length);
  const fingerprint = DG.BitSet.fromString(_morganFP(molecule));
  const fingerprintCol = getMorganFingerprints(smiles);
  const distances: number[] = [];

  let fpSim = _fingerprintSimilarity;
  let webWorker = false;
  if(webWorker){
    //todo: implement
    fpSim = () => {throw new Error('Not Impemented yet')};
  }

  for (let row = 0; row < fingerprintCol.length; row++) {
    const fp = fingerprintCol.get(row);
    distances[row] = fp == null ? 100.0 : fpSim(fingerprint, fp);
  }

  function range(end: number) {
    return Array(end).fill(0).map((_, idx) => idx)
  }

  function compare(i1: number, i2: number) {
    if (distances[i1] > distances[i2]){
      return -1;
    }
    if (distances[i1] < distances[i2]){
      return 1;
    }
    return 0;
  }

  let indexes = range(table.rowCount)
    .filter((idx) => fingerprintCol.get(idx) != null)
    .sort(compare);
  const molsList = [];
  const scoresList = [];
  const molsIdxs = [];

  for (let n = 0; n < limit; n++) {
    const idx = indexes[n];
    const score = distances[idx];
    if (score < minScore) {
      break;
    }
    molsIdxs[n] = idx;
    molsList[n] = smiles.get(idx);
    scoresList[n] = score;
  }
  const mols = DG.Column.fromList(DG.COLUMN_TYPE.STRING,'smiles',molsList);
  mols.semType = DG.SEMTYPE.MOLECULE;
  const scores = DG.Column.fromList(DG.COLUMN_TYPE.FLOAT,'score',scoresList);
  const new_indexes = DG.Column.fromList(DG.COLUMN_TYPE.INT,'indexes',molsIdxs);
  return DG.DataFrame.fromColumns([mols, scores, new_indexes]);
}

*/ 