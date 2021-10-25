import * as ui from "../../js-api/ui";
import {Sketcher} from "../../js-api/src/chem";
import * as DG from "../../js-api/src/dataframe";

var rdKitModule = null;
// var rdKitWorkerProxy = null;
var rdKitWorkerWebRoot = null;

//name: Chem
class ChemPackage extends DG.Package {

  constructor(webRoot) {
    super(webRoot);
    this.initialized = false;
  }

  /** Guaranteed to be executed exactly once before the execution of any function below */
  async init() {
    if (!this.initialized) {
      this.name = "Chem";
      rdKitModule = await initRDKitModule();
      console.log('RDKit (package) initialized');
      rdKitModule.prefer_coordgen(false);
      rdKitWorkerWebRoot = this.webRoot;
      this.STORAGE_NAME = 'rdkit_descriptors';
      this.KEY = 'selected';
      this.rdKitRendererCache = new DG.LruCache();
      this.rdKitRendererCache.onItemEvicted = (mol) => {
        mol.delete();
      };
      this.initialized = true;
    }
  }

  //name: SubstructureFilter
  //description: RDKit-based substructure filter
  //tags: filter
  //output: filter result
  substructureFilter() {
    return new SubstructureFilter();
  }

  _svgDiv(mol) {
    let root = ui.div();
    root.innerHTML = mol.get_svg();
    return root;
  }

  //name: getCLogP
  //input: string smiles {semType: Molecule}
  //output: double cLogP
  getCLogP(smiles) {
    let mol = rdKitModule.get_mol(smiles);
    return JSON.parse(mol.get_descriptors()).CrippenClogP;
  }

  //name: RDKit Info
  //tags: panel, widgets
  //input: string smiles {semType: Molecule}
  //output: widget result
  rdkitInfoPanel(smiles) {
    let mol = rdKitModule.get_mol(smiles);
    return new DG.Widget(ui.divV([
      this._svgDiv(mol),
      ui.divText(`${this.getCLogP(smiles)}`)
    ]));
  }

  //name: RDKit Settings
  //input: column molColumn {semType: Molecule}
  //tags: panel
  //output: widget result
  molColumnPropertyPanel(molColumn) {
    return getMolColumnPropertyPanel(molColumn);
  }

  //name: rdkitCellRenderer
  //tags: cellRenderer, cellRenderer-Molecule
  //meta-cell-renderer-sem-type: Molecule
  //output: grid_cell_renderer result
  async rdkitCellRenderer() {
    //let props = DG.toJs(await this.getProperties());
    // if (props?.Renderer && props.Renderer === 'RDKit') {
    return new RDKitCellRenderer();
    //}
  }

  //name: similarityScoring
  //input: column molStringsColumn
  //input: string molString
  //input: bool sorted
  //output: dataframe result
  // deprecated
  async similarityScoring(molStringsColumn, molString, sorted) {
    try {
      if (molStringsColumn === null || molString === null) throw "An input was null";
      let result = await _chemSimilarityScoring(molStringsColumn, molString, {'sorted': sorted});
      if (result == null) {
        return DG.DataFrame.create();
      }
      return (sorted ? result : DG.DataFrame.fromColumns([result]));
    } catch (e) {
      console.error("In similarityScoring: " + e.toString());
      throw e;
    }
  }

  //name: getSimilarities
  //input: column molStringsColumn
  //input: string molString
  //output: dataframe result
  async getSimilarities(molStringsColumn, molString) {
    try {
      if (molStringsColumn === null || molString === null) throw "An input was null";
      let result = await chemGetSimilarities(molStringsColumn, molString);
      // TODO: get rid of a wrapping DataFrame and be able to return Columns
      return result ? DG.DataFrame.fromColumns([result]) : DG.DataFrame.create();
    } catch (e) {
      console.error("In getSimilarities: " + e.toString());
      throw e;
    }
  }

  //name: getMorganFingerprints
  //input: column molColumn {semType: Molecule}
  //output: column result [fingerprints]
  getMorganFingerprints(molColumn) {
    return _moleculesToFingerprints(molColumn);
  }

  //name: findSimilar
  //input: column molStringsColumn
  //input: string molString
  //input: int limit
  //input: int cutoff
  //output: dataframe result
  async findSimilar(molStringsColumn, molString, aLimit, aCutoff) {
    try {
      if (molStringsColumn === null || molString === null || aLimit === null || aCutoff === null) throw "An input was null";
      let result = await chemFindSimilar(molStringsColumn, molString, {limit: aLimit, cutoff: aCutoff});
      return result ? result : DG.DataFrame.create();
    } catch (e) {
      console.error("In getSimilarities: " + e.toString());
      throw e;
    }
  }

  //name: searchSubstructure
  //input: column molStringsColumn
  //input: string molString
  //input: bool substructLibrary
  //input: string molStringSmarts
  //output: column result
  async searchSubstructure(molStringsColumn, molString, substructLibrary, molStringSmarts) {
    try {
      if (molStringsColumn === null || molString === null || substructLibrary === null || molStringSmarts === null)
        throw "An input was null";
      let result =
        substructLibrary ?
          await chemSubstructureSearchLibrary(molStringsColumn, molString, molStringSmarts) :
          chemSubstructureSearchGraph(molStringsColumn, molString);
      return DG.Column.fromList('object', 'bitset', [result]);
    } catch (e) {
      console.error("In substructureSearch: " + e.toString());
      throw e;
    }
  }

  //name: substructureSearch
  //input: column molStringsColumn
  //input: string molString
  //input: bool substructLibrary
  //output: column result
  // deprecated
  async substructureSearch(molStringsColumn, molString, substructLibrary) {
    return this.searchSubstructure(molStringsColumn, molString, substructLibrary);
  }

  //tags: app
  descriptorsApp(context) {
    let defaultSmiles = 'O=C1CN=C(c2ccccc2N1)C3CCCCC3';
    let sketcherValue = defaultSmiles;

    let windows = grok.shell.windows;
    windows.showToolbox = false;
    windows.showHelp = false;
    windows.showProperties = false;

    let table = DG.DataFrame.create();
    table.name = 'Descriptors';
    let view = grok.shell.addTableView(table);

    let dsDiv = ui.divV([], 'grok-prop-panel');
    dsDiv.appendChild(this.descriptorsWidget(defaultSmiles).root);

    let sketcher = grok.chem.sketcher((smiles, molfile) => {
      sketcherValue = smiles;
      ChemPackage.removeChildren(dsDiv);
      dsDiv.appendChild(this.descriptorsWidget(smiles).root);
    }, defaultSmiles);
    let addButton = ui.bigButton('ADD', async () => {
      this.getSelected().then(selected => {
        grok.chem.descriptors(DG.DataFrame.fromCsv(`smiles\n${sketcherValue}`), 'smiles', selected).then(t => {
          let columnNames = table.columns.names();
          if ((table.columns.length !== selected.length + 1) || selected.some(s => !columnNames.includes(s))) {
            table = DG.DataFrame.create();
            table.name = 'Descriptors';
            view.dataFrame = table;
            for (let col of t.columns.toList())
              table.columns.addNew(col.name, col.type);
          }
          table.rows.addNew(t.columns.toList().map(c => c.get(0)));
        });
      });
    });
    addButton.style.marginTop = '12px';
    let skDiv = ui.divV([sketcher, addButton], 'grok-prop-panel,dlg-sketcher,pure-form');

    let skNode = view.dockManager.dock(skDiv, DG.DOCK_TYPE.RIGHT, null, 'Sketcher', 0.25);
    view.dockManager.dock(dsDiv, DG.DOCK_TYPE.DOWN, skNode, 'Descriptors', 0.5);

    grok.events.onViewRemoved.subscribe((v) => {
      if (v.name === view.name) {
        windows.showToolbox = true;
        windows.showHelp = true;
        windows.showProperties = true;
      }
    });
  }

  //name: Chem Descriptors
  //tags: panel, widgets
  //input: string smiles { semType: Molecule }
  //output: widget result
  descriptorsWidget(smiles) {
    let widget = new DG.Widget(ui.div());
    let result = ui.div();
    let selectButton = ui.bigButton('SELECT', async () => {
      ChemPackage.openDescriptorsDialog(await this.getSelected(), async (selected) => {
        await grok.dapi.userDataStorage.postValue(this.STORAGE_NAME, this.KEY, JSON.stringify(selected));
        update();
      });
    });
    selectButton.style.marginTop = '20px';

    let update = () => {
      ChemPackage.removeChildren(result);
      result.appendChild(ui.loader());
      this.getSelected().then(selected => {
        grok.chem.descriptors(DG.DataFrame.fromCsv(`smiles\n${smiles}`), 'smiles', selected).then(table => {
          ChemPackage.removeChildren(result);
          let map = {};
          for (let descriptor of selected)
            map[descriptor] = table.col(descriptor).get(0);
          result.appendChild(ui.tableFromMap(map));
        });
      });
    }

    widget.root.appendChild(result);
    widget.root.appendChild(selectButton);

    update();

    return widget;
  }

  //description: Get selected descriptors
  async getSelected() {
    let str = await grok.dapi.userDataStorage.getValue(this.STORAGE_NAME, this.KEY);
    let selected = (str != null && str !== '') ? JSON.parse(str) : [];
    if (selected.length === 0) {
      selected = (await grok.chem.descriptorsTree())['Lipinski']['descriptors'].slice(0, 3).map(p => p['name']);
      await grok.dapi.userDataStorage.postValue(this.STORAGE_NAME, this.KEY, JSON.stringify(selected));
    }
    return selected;
  }

  //description: Open descriptors selection dialog
  static openDescriptorsDialog(selected, onOK) {
    grok.chem.descriptorsTree().then(descriptors => {
      let tree = ui.tree();
      tree.root.style.maxHeight = '400px';

      let groups = {};
      let items = [];

      for (let groupName in descriptors) {
        let group = tree.group(groupName, null, false);
        group.enableCheckBox();
        groups[groupName] = group;

        for (let descriptor of descriptors[groupName]['descriptors']) {
          let item = group.item(descriptor['name'], descriptor);
          item.enableCheckBox(selected.includes(descriptor['name']));
          items.push(item);
        }
      }

      let clear = ui.button('NONE', () => {
        for (let g in groups) groups[g].checked = false;
        for (let i of items) i.checked = false;
      });

      ui.dialog('Chem Descriptors')
        .add(clear)
        .add(tree.root)
        .onOK(() => onOK(items.filter(i => i.checked).map(i => i.value['name'])))
        .show();
    });
  }

  renderMolRdKitCanvasCache(molString, canvas, x, y, w, h) {

    let mol = this.rdKitRendererCache.getOrCreate(molString, (s) => {
      try {
        return rdKitModule.get_mol(s);
      } catch (e) {
        return rdKitModule.get_mol("");
      }
    });

    const opts = {
      "clearBackground": false,
      "offsetx": Math.floor(x),
      "offsety": -Math.floor(y),
      "width": Math.floor(w),
      "height": Math.floor(h)
    };
    mol.draw_to_canvas_with_highlights(canvas, JSON.stringify(opts));

  }

  get rdKitModule() {

    return rdKitModule;

  }

  //description: Removes all children from node
  static removeChildren(node) {
    while (node.firstChild)
      node.removeChild(node.firstChild);
  }

  //name: saveAsSdf
  //description: Save as SDF
  //tags: fileExporter
  saveAsSdf() {
    //todo: load OpenChemLib (or use RDKit?)
    //todo: open dialog
    //todo: UI for choosing structure column if necessary
    //todo: UI for choosing columns with properties

    let table = grok.shell.t;
    let structureColumn = table.columns.bySemType('Molecule');
    if (structureColumn == null)
      return;

    let result = '';

    for (let i = 0; i < table.rowCount; i++) {
      try {
        let mol = new OCL.Molecule.fromSmiles(structureColumn.get(i));
        result += `\n${mol.toMolfile()}\n`;

        // properties
        for (let col of table.columns)
          if (col !== structureColumn) {
            result += `>  <${col.name}>\n${col.get(i)}\n\n`;
          }

        result += '$$$$'
      }
      catch (error) {
        console.error(error);
      }
    }

    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(result));
    element.setAttribute('download', table.name + '.sdf');
    element.click();
  }

  //name: Structure WIP
  //description: 2D molecule representation
  //tags: panel, widgets
  //input: string smiles { semType: Molecule }
  //output: widget result
  structureWIP(smiles) {
    const mol = rdKitModule.get_mol(smiles);
    return new DG.Widget(this._svgDiv(mol));
  }

  //name: Properties WIP
  //description: Basic molecule properties
  //tags: panel, widgets
  //input: string smiles { semType: Molecule }
  //output: widget result
  propertiesWIP(smiles) {
    const mol = new OCL.Molecule.fromSmiles(smiles);
    const formula = mol.getMolecularFormula();
    const molProps = new OCL.MoleculeProperties(mol);

    //TODO: name, need PubChem
    const map = {
      'SMILES': smiles,
      'Formula': formula.formula,
      'MW': formula.absoluteWeight,
      'Number of HBA': molProps.acceptorCount,
      'Number of HBD': molProps.donorCount,
      'LogP': molProps.logP,
      'LogS': molProps.logS,
      'Polar Surface Area': molProps.polarSurfaceArea,
      'Number of rotatabe bonds': molProps.rotatableBondCount,
      'Number of stereo centers': molProps.stereoCenterCount,
    };

    return new DG.Widget(ui.tableFromMap(map));
  }

  //name: SDF WIP
  //description: Molecule as SDF
  //tags: panel, widgets
  //input: string smiles { semType: Molecule }
  //output: widget result
  sdfWIP(smiles) {
    const mol = new OCL.Molecule.fromSmiles(smiles);
    return new DG.Widget(ui.textInput('', mol.toMolfile()).root);
  }

  //name: 3D WIP
  //description: 3D molecule representation
  //tags: panel, widgets
  //input: string smiles { semType: Molecule }
  //output: widget result
  async get3dWIP(smiles) {
    //TODO: implement
    //what is dml?
    return new DG.Widget();
  }

  //name: Toxicity WIP
  //description: Toxicity prediction. Calculated by openchemlib
  //help-url: /help/domains/chem/info-panels/toxicity-risks.md
  //tags: panel, widgets
  //input: string smiles { semType: Molecule }
  //output: widget result
  toxicityWIP(smiles) {
    const mol = new OCL.Molecule.fromSmiles(smiles);
    const riskTypes = {
      0: 'Mutagenicity',
      1: 'Tumorigenicity',
      2: 'Irritating effects',
      3: 'Reproductive effects'
    };
    const riskLevels = {
      0: 'Unknown',
      1: 'None',
      2: 'Low',
      3: 'High'
    };

    const risks = {};
    Object.keys(riskTypes).forEach((typeId) => {
      risks[riskTypes[typeId]] = riskLevels[new OCL.ToxicityPredictor().assessRisk(mol, typeId)];
    });

    //FIXME: no such settings as in Dart: processValueElement, Aydar
    return new DG.Widget(ui.tableFromMap(risks));
  }

  //name: Drug Likeness WIP
  //description: Drug Likeness score, with explanations on molecule fragments contributing to the score. Calculated by openchemlib
  //help-url: /help/domains/chem/info-panels/drug-likeness.md
  //tags: panel, widgets
  //input: string smiles { semType: Molecule }
  //output: widget result
  drugLikenessWIP(smiles) {
    //TODO: implement
    //what is chem?
    return new DG.Widget();
  }

  //name: Structural Alerts WIP
  //description: Screening drug candidates against structural alerts, i.e. chemical fragments associated to a toxicological response
  //help-url: /help/domains/chem/info-panels/structural-alerts.md
  //tags: panel, widgets
  //input: string smiles { semType: Molecule }
  //output: widget result
  structuralAlertsWIP(smiles) {
    //TODO: implement
    //what is chem?
    return new DG.Widget();
  }

  //tags: unitTest
  async _testSubstructureSearch() {
    await testSubstructureSearch();
  }

  async chemSimilaritySearch(
    table,
    smiles,
    molecule,
    metric = 'tanimoto',
    limit = 10,
    minScore =  0.7,
  )  {
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
    const fingerprint = _morganFP(molecule);
    const fingerprintCol = this.getMorganFingerprints(smiles);
    const distances = [];
    let fpSim = _fingerprintSimilarity
    this.webWorker = false;
    if(this.webWorker){
      //todo: implement
      fpSim = () => throw 'Not Impemented yet';

    }
    for (let row = 0; row < table.rowCount; row++) {
      const fp = fingerprintCol[row];
      distances[row] = fp == null ? 100.0 : fpSim(fingerprint, fp);
    }
    function range(end) {
      return Array(end).fill(0).map((_, idx) => idx)
    }
    function compare(i1,i2){
      if (i1 > i2){
        return -1;
      }
      if (i1 < i2){
        return 1;
      }
      return 0;
    }
    const indexes = range(table.rowCount)
        .filter((idx) => fingerprintCol[idx] != null)
        .sort(compare);
    const molsList = [];
    const scoresList = [];
    for (let n = 0; n < limit; n++) {
      const idx = indexes[n];
      const score = distances[idx];
      if (score < minScore) {
        break;
      }
      molsList[n] = smiles[idx];
      scoresList[n] = score;
    }
    let mols = DG.Column.fromList(DG.COLUMN_TYPE.STRING,'smiles',molsList);
    mols.semType = DG.SEMTYPE.MOLECULE;
    let scores = DG.Column.fromList(DG.COLUMN_TYPE.FLOAT,'score',scoresList);
    return  DG.DataFrame.fromColumns([mols, scores]);
  }


}


class ChemSimilaritySearchCore extends DG.JsViewer{
  init(){
    this.helpUrl = '/help/domains/chem/similarity-search.md';
    this.searchCanvas = null;
    this.itemsView = DG.VirtualView.create();
    this.referenceDiv = null;
    this.molCol = null;
    this.isEditedFromSketcher = false;
    this.isClickedFromSelf = false;
    this.hotSearch = true;
  }
  constructor() {
    super();
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
      let sketcher = grok.chem.sketcher((_, molfile) => {
          mol = molfile;
          if (this.hotSearch) this._search(mol).then();
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
    this.itemsView.root.style.flexGrow = '1'
    rt.append(this.itemsView);
    this.subs.push(DG.debounce(
        this.dataFrame.onCurrentRowChanged, 50).subscribe(
          (_) => {
            if (this.syncWithCurrentRow && (this.drillDown || !this.isClickedFromSelf) &&
              !this.isEditedFromSketcher && this.dataFrame.currentRow !== -1)
              this._search(this.molCol.get(this.dataFrame.currentRow)).then();
          }
      )
    );
    this.molCol = this.dataFrame.getCol(this.molColumnName);
    if (this.molCol != null && this.dataFrame.rowCount > 0)
      this._search(this.molCol.get(Math.max(this.dataFrame.currentRow, 0))).then();
  }
  detach() {
    this.subs.forEach((sub) => sub.unsubscribe());
  }
  onPropertyChanged(property) {
    super.onPropertyChanged(property);
    this.molCol = this.dataFrame.getCol(this.molColumnName);
    this._search(this.reference).then();
    //todo: todo
  }

  async _search(smiles){
    if(!this.molCol) return;
    this.reference = smiles;
    const mol = rdKitModule.get_mol(smiles);
    let svg = ui.div();
    svg.innerHTML = mol.get_svg();
    if (this.searchCanvas){
      this.searchCanvas = svg;
      this.referenceDiv.append(svg);
    }
    else{
      this.referenceDiv.replaceChild(svg,this.searchCanvas);
    }

    const fingerprint = _morganFP(smiles);
    const fingerprintCol = this.getMorganFingerprints(this.molCol);
    const distances = [];
    let fpSim = _fingerprintSimilarity
    this.webWorker = false;
    if(this.webWorker){
      //todo: implement
      fpSim = () => throw 'Not Impemented yet';

    }
    for (let row = 0; row < this.dataFrame.rowCount; row++) {
      const fp = fingerprintCol[row];
      distances[row] = fp == null ? 100.0 : fpSim(fingerprint, fp);
    }
    function range(end) {
      return Array(end).fill(0).map((_, idx) => idx)
    }
    function compare(i1,i2){
      if (distances[i1] > distances[i2]){
        return -1;
      }
      if (distances[i1] < distances[i2]){
        return 1;
      }
      return 0;
    }
    const indexes = range(this.dataFrame.rowCount)
    .filter((idx) => fingerprintCol[idx] != null)
    .sort(compare);
    function renderMolecule(i){
      const idx = indexes[i];
      const smiles = this.molCol.get(idx);
      const mol = rdKitModule.get_mol(smiles);
      let svg = ui.div();
      svg.innerHTML = mol.get_svg();
      let host = ui.divV([svg]);
      if (this.showValueColumnNames?.length > 0) {
        let map = {};
        if (this.showScore)
           map = {'Score': distances[idx].toString()};
        map = new Map([...this.showValueColumnNames.map(cn =>
          [cn, `${this.dataFrame.get(cn,idx)}`]
        ), ...map]);
        host.append(ui.tableFromMap(map));
      }
      else if (this.showScore)
        host.append(ui.divText(distances[idx]).toString());
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

