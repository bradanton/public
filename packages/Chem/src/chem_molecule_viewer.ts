import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';
import {GridCellRenderArgs, Property, Widget} from 'datagrok-api/dg';

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
      this.subs.push(DG.debounce(this.dataFrame.selection.onChanged, 50).subscribe((_) => this.render()));
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
            grok.shell.info('Wrong property type');
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
    if (this.dataFrame) {
      const molCol = this.dataFrame.getCol(this.moleculeColumnName);
      let g = [], cnt = 0;
      g[cnt++] = ui.h1('SVG rendering');
      g[cnt++] = this.sketchButton;
      for (let i = 0; i < molCol.length; ++i) {
        let mol = grok.chem.svgMol(molCol?.get(i));
        // mol.addEventListener("click", this.dataFrame?.selection.handleClick(i => {
        //   return this.dataFrame.filter.get(i);
        // }, 'onclick'));
        g[cnt++] = mol;
      }
      this.root.appendChild(ui.div(g));
    }
  }
}

// <canvas width="400" height="200" tabindex="0" style="width: 200px; height: 100px;"></canvas>