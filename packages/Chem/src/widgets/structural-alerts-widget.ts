// This file may not be used in
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';
// The file is imported from a WebWorker. Don't use Datagrok imports
import { drawMoleculeToCanvas } from '../chem_common_rdkit';
import {getRdKitService} from "../chem_common_rdkit";
// import { getStructuralAlerts } from './structural-alerts';

let _alertsSmarts: string[] = [];
let _alertsDescriptions: string[] = [];

export async function initStructuralAlertsContext(
  alertsSmarts: string[], alertsDescriptions: string[]) {
    _alertsSmarts = alertsSmarts;
    _alertsDescriptions = alertsDescriptions;
    await getRdKitService().initStructuralAlerts(_alertsSmarts);
}

export async function structuralAlertsWidget(smiles: string) {
  const alerts = await getRdKitService().getStructuralAlerts(smiles); // getStructuralAlerts(smiles);
  const width = 200;
  const height = 100;
  const list = ui.div(alerts.map((i) => {
    const description = ui.divText(_alertsDescriptions[i]);
    const imageHost = ui.canvas(width, height);
    drawMoleculeToCanvas(0, 0, width, height, imageHost, smiles, _alertsSmarts[i]);
    const host = ui.div([description, imageHost], 'd4-flex-col');
    host.style.margin = '5px';
    return host;
  }), 'd4-flex-wrap');
  if (!alerts.length) {
    list.innerText = 'No Alerts';
  }
  return new DG.Widget(list);
}