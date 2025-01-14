import { study } from "../clinical-study";
import * as ui from "datagrok-api/ui";
import { domains } from "../sdtm-meta";

export function updateDivInnerHTML(div: HTMLDivElement, content: any){
    div.innerHTML = '';
    div.append(content);
  }

export function checkMissingDomains(requiredDomainsAndCols: any, obj: any) {
  let reqDomains = requiredDomainsAndCols['req_domains'] ? Object.keys(requiredDomainsAndCols['req_domains']) : [];
  let optDomains = requiredDomainsAndCols['opt_domains'] ? Object.keys(requiredDomainsAndCols['opt_domains']) : [];
  let missingReqDomains = reqDomains.filter(it => study.domains[it] === null);
  let missingOptDomains = optDomains.some(it => study.domains[it] !== null) ? [] : optDomains;
  let presentOptDomains = optDomains.filter(it => study.domains[it] !== null);
  let totalMissingDomains = missingReqDomains.concat(missingOptDomains);
  let requiredColumns = {};
  reqDomains.forEach(domain => {
    requiredColumns[domain] = requiredDomainsAndCols['req_domains'][domain];
  });
  optDomains.forEach(domain => {
    requiredColumns[domain] = requiredDomainsAndCols['opt_domains'][domain];
  });
  if (!totalMissingDomains.length) {
    if (checkMissingColumns(obj, reqDomains.concat(presentOptDomains), requiredColumns)) {
      obj.createView();
    }
  } else {
    const errorsDiv = ui.divV([], { style: { margin: 'auto', textAlign: 'center' } });
    createMissingDataDiv(errorsDiv, totalMissingDomains, 'Missing domains:');
    checkMissingColumns(errorsDiv, reqDomains.concat(optDomains), requiredColumns);
    obj.root.append(errorsDiv);
  }
}

export function checkMissingColumns(obj: any, reqDomains: string[], requiredDomainsAndCols: any) {
  const errorsDiv = ui.divV([], {style: {margin: 'auto', textAlign: 'center'}});
  let noMissingCols = true;
  reqDomains.forEach(domain => {
    const domainColumns = study.domains[domain] ? study.domains[domain].columns.names() : [];
    const reqCols = requiredDomainsAndCols[domain]['req'] ?? [];
    const optCols = requiredDomainsAndCols[domain]['opt'] ?? []; //at least one of optional columns should exist in domain
    const missingReqColumns = reqCols.filter(it => !domainColumns.includes(it));
    const missingOptColumns = optCols.some(it => study.domains[it] !== null) ? [] : optCols.filter(it => !domainColumns.includes(it));
    const missingColumns = missingReqColumns.concat(missingOptColumns);
    if(missingColumns.length){
      noMissingCols = false;
      createMissingDataDiv(errorsDiv, missingColumns, `Missing columns in ${domain}:`)
    }
  })
  if(!noMissingCols){
    obj.root ? obj.root.append(errorsDiv) : obj.append(errorsDiv);
  }
  return noMissingCols;
}

function createMissingDataDiv(div: HTMLDivElement, missingDomainsOrCols: string[], header: string){
  let domainsDiv = ui.div();
  missingDomainsOrCols.forEach(it => {domainsDiv.append(ui.divText(it))})
  div.append(ui.div([
    ui.h2(header),
    domainsDiv
  ]));
}