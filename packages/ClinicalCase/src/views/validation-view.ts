import * as grok from 'datagrok-api/grok';
import * as DG from "datagrok-api/dg";
import * as ui from "datagrok-api/ui";
import { study } from "../clinical-study";
import { validationRulesList, _package } from "../package";
import { pinnacleRuleIdColumnName, validationResultRuleIdColumn } from "../validation/constants";
import { createRulesDataFrame } from '../validation/validation-utils';
import { ILazyLoading } from '../lazy-loading/lazy-loading';
import { getUniqueValues } from '../data-preparation/utils';

export class ValidationView extends DG.ViewBase implements ILazyLoading {

  resultsDataframe: DG.DataFrame;
  rulesDataframe: DG.DataFrame;
  resultsGrid: DG.Grid;
  rulesGrid: DG.Grid;
  errorsByDomain = {};
  domains: any;

  constructor(errorsMap: any, name) {
    super({});
    this.name = name;
    if(!errorsMap){
      const validationSummary = study.validationResults.groupBy([ 'Domain' ]).count().aggregate();
      for (let i = 0; i < validationSummary.rowCount; ++i) {
        this.errorsByDomain [ validationSummary.get('Domain', i) ] = validationSummary.get('count', i);
      }
    } else {
      this.errorsByDomain = errorsMap;
    }
    this.helpUrl = `${_package.webRoot}/views_help/validation.md`;
  }

  loaded: boolean;

  load(): void {
    this.createView();
 }

  createView(): void {
    this.resultsDataframe = study.validationResults;
    this.domains = study.domains;

    let uniqueViolatedRuleIds = Array.from(getUniqueValues(study.validationResults, validationResultRuleIdColumn));
    this.rulesDataframe = this.getViolatedRulesDataframe(validationRulesList, uniqueViolatedRuleIds);

    this.rulesGrid = this.rulesDataframe.plot.grid();

    grok.data.linkTables(this.rulesDataframe, this.resultsDataframe,
      [ `${pinnacleRuleIdColumnName}` ], [ `${validationResultRuleIdColumn}` ],
      [ DG.SYNC_TYPE.CURRENT_ROW_TO_SELECTION, DG.SYNC_TYPE.CURRENT_ROW_TO_SELECTION ]);

    this.generateUI();
  }

  private generateUI() {

    let viewerTitle = {style:{
      'color':'var(--grey-6)',
      'margin':'12px 0px 6px 12px',
      'font-size':'16px',
      'justify-content':'center'
    }};


    let violatedRules = DG.Viewer.grid(this.rulesDataframe);
    violatedRules.root.prepend();

    let tabs = ui.tabControl(this.createErrorsTabControl());
    console.log(tabs)

    this.root.className = 'grok-view ui-box';
    this.root.appendChild(
      ui.splitV([
        ui.box(ui.divText('Violated rules', viewerTitle), { style: { maxHeight: '45px' } }),
        violatedRules.root,
        //this.resultsDataframe.plot.grid().root,
        ui.box(ui.divText('Errors', viewerTitle), { style: { maxHeight: '45px' } }),
        tabs.root
      ])
    );

  }

  private createErrorsTabControl() {
    const tabControl = {}
    Object.keys(this.errorsByDomain).forEach(key => {
      const domainDataframe = this.domains[ key ].clone();
      this.addRowNumberColumn(domainDataframe, key);
      tabControl[`${key.toUpperCase()} (${this.errorsByDomain[ key ]})`] = DG.Viewer.grid(domainDataframe).root;
      grok.data.linkTables(this.resultsDataframe, domainDataframe,
        [ `Row number`,  'Domain'], [ `Row number`,  'Domain lower case' ],
        [ DG.SYNC_TYPE.SELECTION_TO_FILTER, DG.SYNC_TYPE.SELECTION_TO_FILTER ]);
    })
    return tabControl;
  }


  private addRowNumberColumn(dataframe: DG.DataFrame, domain: string){
    if(!dataframe.columns.contains('Row number')){
      dataframe.columns.addNewInt('Row number').init((i) => i);
    }
    if(!dataframe.columns.contains('Domain lower case')){
      dataframe.columns.addNewString('Domain lower case').init((i) => domain);
    }
  }

  
  private getViolatedRulesDataframe(rules: DG.DataFrame, uniqueViolatedRuleIds: any) {
    const res = createRulesDataFrame();
    console.log(rules.columns.names());
    let column = rules.getCol(pinnacleRuleIdColumnName);
    let rowCount = rules.rowCount;
    for (let i = 0; i < rowCount; i++) {
      if (uniqueViolatedRuleIds.includes(column.get(i))) {
        const array = [];
        for (let col of rules.columns)
          array.push(col.get(i));
        res.rows.addNew(array);
      }
    }
    return res;
  }

}

