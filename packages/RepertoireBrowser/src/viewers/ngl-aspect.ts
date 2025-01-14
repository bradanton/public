import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from "datagrok-api/dg";
import {MiscMethods} from "./misc.js"


// export let _package = new DG.Package();

export class NglAspect {

  pdbStr: string;
  stage: any;
  schemeObj: any;

    async init(view, inputs, pdbStr, json) {

        let colorScheme = inputs.colorScheme;
        let col_background = colorScheme["col_background"];

        inputs.nglHost.style.backgroundColor = col_background;
        view.box = true;
        this.pdbStr = pdbStr;
        //@ts-ignore
        this.stage = new NGL.Stage(inputs.nglHost);
        this.schemeObj = this.CDR3(inputs.cdrScheme, inputs.paratopes, json, colorScheme);

        await this.loadPdb(pdbStr, inputs.repChoice, this.schemeObj);
        this.nglResize(inputs.nglHost);

    }

    // ---- NGL ----
    // create a color scheme for CDR3 regions
    CDR3(cdr_scheme, paratopes, json, colorScheme) {

        let col_heavy_chain = colorScheme["col_heavy_chain"];
        let col_light_chain = colorScheme["col_light_chain"];
        let col_cdr = colorScheme["col_cdr"];
        let col_para = colorScheme["col_para"];
        let col_partopes_low = colorScheme["col_partopes_low"]; //col_para in rgb
        let col_partopes_high = colorScheme["col_partopes_high"];
        
        let schemeId;

        if (paratopes.value === true) {
            let palette = MiscMethods.interpolateColors(col_partopes_high, col_partopes_low, 100);
            let selectionScheme = [];
            Object.keys(json.parapred_predictions).forEach((chain) => {
                Object.keys(json.parapred_predictions[chain]).forEach((index) => {
                    selectionScheme.push([
                        palette[Math.round(json.parapred_predictions[chain][index] * 100)],
                        `${index} and :${chain}`
                    ]);
                })
            })
            selectionScheme.push([col_para, "* and :H"]);
            selectionScheme.push([col_para, "* and :L"]);
            //@ts-ignore
            schemeId = NGL.ColormakerRegistry.addSelectionScheme(selectionScheme);
        } else {
            if (cdr_scheme.value === 'default') {
                //@ts-ignore
                schemeId = NGL.ColormakerRegistry.addSelectionScheme([
                    [col_heavy_chain, "* and :H"],
                    [col_light_chain, "* and :L"]
                ]);
            } else {
                let scheme_buffer = [];
                Object.keys(json.cdr_ranges).forEach((str) => {
                    if (str.includes(cdr_scheme.value + '_CDRH')) {
                        let str_buffer = ''
                        for (let i = 0; i < Object.keys(json.cdr_ranges[str]).length; i++) {
                            str_buffer = str_buffer + ` or ${json.cdr_ranges[str][i][0]}-${json.cdr_ranges[str][i][1]} and :H`;
                        }
                        str_buffer = str_buffer.slice(4);
                        scheme_buffer.push([col_cdr, str_buffer]);
                        scheme_buffer.push([col_heavy_chain, "* and :H"]);

                    } else if (str.includes(cdr_scheme.value + '_CDRL')) {
                        let str_buffer = ''
                        for (let i = 0; i < Object.keys(json.cdr_ranges[str]).length; i++) {
                            str_buffer = str_buffer + ` or ${json.cdr_ranges[str][i][0]}-${json.cdr_ranges[str][i][1]} and :L`;
                        }
                        str_buffer = str_buffer.slice(4);
                        scheme_buffer.push([col_cdr, str_buffer]);
                        scheme_buffer.push([col_light_chain, "* and :L"]);
                    }
                });

                //@ts-ignore
                schemeId = NGL.ColormakerRegistry.addSelectionScheme(scheme_buffer);
            }
        }
        return {color: schemeId};
    }

    // load the 3D model
    async loadPdb(pdbStr, repChoice, schemeObj) {
        var stringBlob = new Blob([pdbStr], {type: 'text/plain'} );
        await this.stage.loadFile(stringBlob, { ext: "pdb" }).then(function (o) {
            o.addRepresentation(repChoice.value, schemeObj);
            o.autoView();
        });
    }

    // viewer resize
    _resize(host) {
        let canvas = host.querySelector('canvas');
        canvas.width = Math.floor(host.clientWidth * window.devicePixelRatio);
        canvas.height = Math.floor(host.clientHeight * window.devicePixelRatio);
        this.stage.handleResize();
    }

    nglResize(host) {
        ui.onSizeChanged(host).subscribe((_) => this._resize(host));
        this._resize(host);
    }
}