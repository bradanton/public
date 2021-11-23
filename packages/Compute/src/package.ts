/* Do not change these import lines to match external modules in webpack configuration */
import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';
import {ModelHandler} from './model-handler';
import {selectOutliersManually} from './outliers-selection';
import {exportFuncCall} from './export-funccall';
import {_functionParametersGrid} from './function-views/function-parameters-grid';
import {ModelCatalogView} from './model-catalog-view';
import {BehaviorSubject} from 'rxjs';

let initCompleted: boolean = false;
export const _package = new DG.Package();

//name: test
export function test() {
  grok.shell.info(_package.webRoot);
}

//tags: init, autostart
export function init() {
  if (initCompleted) {
    return;
  }
  DG.ObjectHandler.register(new ModelHandler());
  grok.events.onAccordionConstructed.subscribe((acc: DG.Accordion) => {
    const ent = acc.context;
    if (ent == null) {
      return;
    }
    if (ent.type != 'script') {
      return;
    }
    const restPane = acc.getPane('REST');
    if (!restPane) {
      acc.addPane('REST', () => ui.wait(async () => (await renderRestPanel(ent)).root));
    }
  });
  initCompleted = true;
}

//name: Model Catalog
//tags: app
export function modelCatalog() {
  grok.shell.addView(new ModelCatalogView());
}

//name: manualOutlierDetectionDialog
//input: dataframe inputData
//output: dataframe augmentedInput
//output: dataframe editedInput
export async function manualOutlierSelectionDialog(inputData: DG.DataFrame) {
  const call = grok.functions.getCurrentCall();

  const IS_OUTLIER_COL_LABEL = 'isOutlier';
  const OUTLIER_REASON_COL_LABEL = 'Reason';

  if (call.options['interactive']) {
    const {augmentedInput, editedInput} = await selectOutliersManually(inputData);
    return {augmentedInput, editedInput};
  }
  return new Promise<{augmentedInput: DG.DataFrame, editedInput: DG.DataFrame}>((resolve, reject) => {
    if (!inputData.columns.byName(IS_OUTLIER_COL_LABEL)) {
      inputData.columns
        .add(DG.Column.fromBitSet(IS_OUTLIER_COL_LABEL, DG.BitSet.create(inputData.rowCount, () => false)));
    }

    if (!inputData.columns.byName(OUTLIER_REASON_COL_LABEL)) {
      inputData.columns
        .add(DG.Column.fromStrings(OUTLIER_REASON_COL_LABEL, Array.from({length: inputData.rowCount}, () => '')));
    }
    resolve({augmentedInput: inputData, editedInput: inputData});
  });
}

//name: export To Excel
//input: funccall call
//tags: export
export function exportToExcel(call: DG.FuncCall) {
  exportFuncCall(call);
}

//name: testUI
export function testUI() {
  const v = grok.shell.newView('list');

  const head = v.root.appendChild(ui.h1('List'));

  const dataSource = [
    'element 1',
    'element 2',
  ];

  const listState = new BehaviorSubject(dataSource);

  listState.subscribe(() => {
    if (v.root.lastChild && v.root.lastChild !== head) v.root.removeChild(v.root.lastChild);
    v.root.appendChild(ui.list(dataSource));
  });

  setTimeout(() => {
    dataSource.push('new Element');
    listState.next(dataSource);
  }, 2000);

  setTimeout(() => {
    dataSource.push('new Element2');
    listState.next(dataSource);
  }, 4000);

  setTimeout(() => {
    dataSource.push('new Element3');
    listState.next(dataSource);
  }, 6000);

  setTimeout(() => {
    dataSource.pop();
    listState.next(dataSource);
  }, 8000);
}

/* eslint-disable */

//description: A spreadsheet that lets you interactively edit parameters and evaluate functions
//tags: functionAnalysis
//input: func f
//output: view result
export function functionParametersGrid(f: DG.Func): DG.View {
  return _functionParametersGrid(f);
}

//name: hof
export function hof() {
  let f: DG.Func = DG.Func.byName('Sin');
  let v: DG.View = functionParametersGrid(f);
  grok.shell.addView(v);
}

//name: renderRestPanel
//input: func func
//output: widget panel
export async function renderRestPanel(func: DG.Func): Promise<DG.Widget> {
  let params: object = {};
  func.inputs.forEach((i) => (<any>params)[i.name] = null);
let curl = `
curl --location --request POST '${(<any>grok.settings).apiUrl}/v1/func/${func.nqName}/run' \\
--header 'Authorization: ${getCookie('auth')}' \\
--header 'Content-Type: application/json' \\
--data-raw '${JSON.stringify(params)}'`
let js = `
var myHeaders = new Headers();
myHeaders.append("Authorization", "${getCookie('auth')}");
myHeaders.append("Content-Type", "application/json");

var raw = JSON.stringify(${JSON.stringify(params)});

var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: raw,
  redirect: 'follow'
};

fetch("${(<any>grok.settings).apiUrl}/v1/func/${func.nqName}/run", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));`
  let tabs = ui.tabControl({'CURL': ui.div([ui.divText(curl)]), 'JS': ui.div([ui.divText(js)])})
  return DG.Widget.fromRoot(tabs.root);
}

function getCookie(name: string): string | undefined{
  let matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}