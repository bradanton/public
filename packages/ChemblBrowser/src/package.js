/* Do not change these import lines. Datagrok will import API library in exactly the same manner */
import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';

export let _package = new DG.Package();
let packageName = 'Chemblbrowser'

//name: test
//input: string s
export function test(s) {
    grok.shell.info(_package.webRoot);
}

let r = null;
let v = null;

//name: Browser
//tags: app
export async function Browser() {

    let molecule = ui.moleculeInput('', '');
    let subName = ui.stringInput('Find by name', '');
    let molregno = ui.intInput('Find by molregno',);
    let clear = ui.button('Clear filters', () => clearFilters());

    molecule.onChanged(() => update("FindBySubstructure", {'sub': molecule.stringValue}));
    subName.onChanged(() => update("FindByName", {'sub': subName.stringValue}));
    molregno.onChanged(() => update("FindByMolregno", {'molregno': molregno.value}));


    let inputs = [molecule, subName, molregno, clear];
    let controlPanel = ui.divV([ui.h2("Find By Substructure"), ui.inputs(inputs)]);

    async function initView() {
        let data = await grok.data.query(`${packageName}:allChemblStructures`, {});
        data.col('canonical_smiles').semType = DG.SEMTYPE.MOLECULE;
        v = grok.shell.newView('Chembl Browser');
        r = DG.Viewer.fromType(DG.VIEWER.TILE_VIEWER, data);
        v.append(ui.divV([r]));
        v.toolbox = ui.div(controlPanel);
        v.box = true;
    }

    async function update(queryName, queryParameters) {
        let query = await grok.data.query(`${packageName}:${queryName}`, queryParameters);
        query.col('canonical_smiles').semType = DG.SEMTYPE.MOLECULE;
        v.root.children[0].remove();
        r = DG.Viewer.fromType(DG.VIEWER.TILE_VIEWER, query);
        v.toolbox = ui.div(controlPanel);
        v.append(ui.divV([r]));
        v.box = true;
    }

    async function clearFilters() {
        molecule.value = '';
        subName.value = '';
        molregno.value = null;
    }

    initView();

}




