import * as grok from 'datagrok-api/grok';
import * as DG from "datagrok-api/dg";
import * as ui from "datagrok-api/ui";
import { study } from "../clinical-study";
import { addDataFromDmDomain, createPivotedDataframe, getUniqueValues, getVisitNamesAndDays } from '../data-preparation/utils';
import { ETHNIC, LAB_RES_N, LAB_TEST, VISIT_DAY, VISIT_NAME, RACE, SEX, SUBJECT_ID, TREATMENT_ARM, VS_TEST, VS_RES_N } from '../columns-constants';
import { dynamicComparedToBaseline } from '../data-preparation/data-preparation';
import { ILazyLoading } from '../lazy-loading/lazy-loading';
import { checkMissingDomains, updateDivInnerHTML } from './utils';
import { _package } from '../package';
import { requiredColumnsByView } from '../constants';


export class TimeProfileView extends DG.ViewBase implements ILazyLoading {

    blVisitChoices: DG.InputBase;
    epVisitChoices: DG.InputBase;
    labChoices: DG.InputBase;
    blVisitDiv = ui.div();
    epVisitDiv = ui.div();
    labChoicesDiv = ui.div();
    laboratoryDataFrame: DG.DataFrame;
    relativeChangeFromBlDataFrame: DG.DataFrame;
    uniqueLabValues: any;
    uniqueVisits: any;
    splitBy = [ TREATMENT_ARM, SEX, RACE, ETHNIC ];
    types = ['Values', 'Changes'];
    domains = ['vs', 'lb'];
    domainFields = {'lb': {'test': LAB_TEST, 'res': LAB_RES_N}, 'vs': {'test': VS_TEST, 'res': VS_RES_N}};
    selectedLabValue: string;
    selectedType: string;
    bl: string;
    ep: string;
    visitNamesAndDays: any [];
    linechart: any;
    selectedDomain: string;

    constructor(name) {
        super({});
        this.name = name;
        this.helpUrl = `${_package.webRoot}/views_help/time_profile.md`;
    }

    loaded: boolean;

    load(): void {
        checkMissingDomains(requiredColumnsByView[this.name], this);
     }

    createView(): void {
        this.splitBy = this.splitBy.filter(it => study.domains.dm.columns.names().includes(it));
        this.domains = this.domains.filter(it => study.domains[it] !== null);
        this.selectedDomain = this.domains[0];
        this.uniqueLabValues = Array.from(getUniqueValues(study.domains[this.selectedDomain], this.domainFields[this.selectedDomain]['test']));
        this.uniqueVisits = Array.from(getUniqueValues(study.domains[this.selectedDomain], VISIT_NAME));
        this.selectedLabValue = this.uniqueLabValues[ 0 ] as string;
        this.selectedType = this.types[0];
        this.visitNamesAndDays = getVisitNamesAndDays(study.domains[this.selectedDomain]);
        this.bl = this.visitNamesAndDays[0].name;
        this.ep = this.visitNamesAndDays[this.visitNamesAndDays.length-1].name;
        this.createLaboratoryDataframe();

        let domainChoices = ui.choiceInput('', this.selectedDomain, this.domains);
        domainChoices.onChanged((v) => {
            this.selectedDomain = domainChoices.value;
            this.uniqueLabValues = Array.from(getUniqueValues(study.domains[this.selectedDomain], this.domainFields[this.selectedDomain]['test']));
            this.uniqueVisits = Array.from(getUniqueValues(study.domains[this.selectedDomain], VISIT_NAME));
            this.selectedLabValue = this.uniqueLabValues[ 0 ] as string;
            this.visitNamesAndDays = getVisitNamesAndDays(study.domains[this.selectedDomain]);
            if (this.visitNamesAndDays.findIndex(it => it.name === this.bl) === -1) {
                this.bl = this.visitNamesAndDays[0].name;
            }
            if (this.visitNamesAndDays.findIndex(it => it.name === this.ep) === -1) {
                this.ep = this.visitNamesAndDays[this.visitNamesAndDays.length-1].name;
            }
            this.createValuesChoices();
            this.createBlChoices();
            this.createEpChoices();
            this.updateTimeProfile();
        });

        let typeChoices = ui.choiceInput('', this.selectedType, this.types);
        typeChoices.onChanged((v) => {
            this.selectedType = typeChoices.value;
            this.updateTimeProfile();
        });

        this.createValuesChoices();
        this.createBlChoices();
        this.createEpChoices();

        this.root.className = 'grok-view ui-box';
        this.linechart = DG.Viewer.lineChart(this.laboratoryDataFrame, {
            splitColumnName: this.splitBy[0],
            xColumnName: VISIT_DAY,
            yColumnNames: [`${this.selectedLabValue} avg(${this.domainFields[this.selectedDomain]['res']})`],
            whiskersType: 'Med | Q1, Q3'
        });
        this.root.append(this.linechart.root);
        this.setRibbonPanels([
            [
                ui.span([ 'Plot ' ]),
                domainChoices.root,
                this.labChoicesDiv,
                typeChoices.root,
                ui.span([' from ']),
                this.blVisitDiv,
                ui.span([' to ']),
                this.epVisitDiv
            ]
        ]);
    }

    private updateTimeProfile() {
        switch (this.selectedType) {
            case 'Values': {
                this.createLaboratoryDataframe();
                this.linechart.dataFrame = this.laboratoryDataFrame;
                break;
            }
            case 'Changes': {
                this.createrelativeChangeFromBlDataframe();
                this.linechart.dataFrame = this.relativeChangeFromBlDataFrame;
                break;
            }
            default: {
                break;
            }
        }
    }

    private createValuesChoices(){
        this.labChoices = ui.choiceInput('', this.selectedLabValue, this.uniqueLabValues);
        this.labChoices.onChanged((v) => {
            this.selectedLabValue = this.labChoices.value;
            this.updateTimeProfile();
        });
        //@ts-ignore
        this.labChoices.input.style.width = '150px';
        updateDivInnerHTML(this.labChoicesDiv, this.labChoices.root);
    }

    private createBlChoices(){
        this.blVisitChoices = ui.choiceInput('', this.bl, this.uniqueVisits);
        this.blVisitChoices.onChanged((v) => {
            this.bl = this.blVisitChoices.value;
            this.updateTimeProfile();
        });
        //@ts-ignore
        this.blVisitChoices.input.style.width = '150px';
        updateDivInnerHTML(this.blVisitDiv, this.blVisitChoices.root);
    }

    private createEpChoices(){
        this.epVisitChoices = ui.choiceInput('', this.ep, this.uniqueVisits);
        this.epVisitChoices.onChanged((v) => {
            this.ep = this.epVisitChoices.value;
            this.updateTimeProfile();
        });
        //@ts-ignore
        this.epVisitChoices.input.style.width = '150px';
        updateDivInnerHTML(this.epVisitDiv, this.epVisitChoices.root);
    }

    private createLaboratoryDataframe() {
        let df = this.filterDataFrameByDays(study.domains[this.selectedDomain].clone());
        let dfWithArm = addDataFromDmDomain(df, study.domains.dm, [ SUBJECT_ID, VISIT_DAY, VISIT_NAME].concat(Object.values(this.domainFields[this.selectedDomain])), this.splitBy);
        this.laboratoryDataFrame = createPivotedDataframe(dfWithArm, this.domainFields[this.selectedDomain]['test'], this.domainFields[this.selectedDomain]['res'], this.splitBy);
    }

    private createrelativeChangeFromBlDataframe(){
        let df = this.filterDataFrameByDays(study.domains[this.selectedDomain].clone());
        dynamicComparedToBaseline(df, this.domainFields[this.selectedDomain]['test'], this.domainFields[this.selectedDomain]['res'], this.bl, VISIT_NAME, 'LAB_DYNAMIC_BL', true);
        let dfWithArm = addDataFromDmDomain(df, study.domains.dm, [ SUBJECT_ID, VISIT_DAY, VISIT_NAME, this.domainFields[this.selectedDomain]['test'], this.domainFields[this.selectedDomain]['res'] ], this.splitBy);
        this.relativeChangeFromBlDataFrame = createPivotedDataframe(dfWithArm, this.domainFields[this.selectedDomain]['test'], this.domainFields[this.selectedDomain]['res'], this.splitBy);
    }


    private filterDataFrameByDays(df: DG.DataFrame){
        let blDay = this.visitNamesAndDays.find(it => it.name === this.bl).day;
        let epDay = this.visitNamesAndDays.find(it => it.name === this.ep).day;
        let filteredDf = df.groupBy(df.columns.names())
        .where(`${VISIT_DAY} >= ${blDay} and ${VISIT_DAY} <= ${epDay} and ${this.domainFields[this.selectedDomain]['test']} = ${this.selectedLabValue}`)
        .aggregate();
        return filteredDf;
    }

}