import * as grok from 'datagrok-api/grok'
import * as ui from 'datagrok-api/ui'
import * as DG from 'datagrok-api/dg'

/* 3rd party imports */
import grapesjs from 'grapesjs'

export class FormsViewer extends DG.JsViewer {
  editor = null
  constructor() {
    super()

    this._initLayouts()
    this._initGrapesJS()
  }

  _initGrapesJS() {
    this.editor = grapesjs.init({
      container: this.root,
      fromElement: 1,
      height: '100%',
      storageManager: false,
      plugins: ['gjs-blocks-basic'],
      avoidInlineStyle: 1,
      panels: {
        defaults: []
      },
    })


    this.editor.getModel().set('dmode', 'absolute')
  }
  _initLayouts() {
    const windows = grok.shell.windows
    windows.showToolbox = false
    windows.showProperties = false
    windows.showHelp = false

    let basicLayout = ui.panel([
      ui.h1('Hello from GrapesJS'),
    ])

    this.root.append(ui.div([
      basicLayout,
    ]))
  }
  onTableAttached() {
    this.subs.push(this.dataFrame.selection.onChanged.subscribe((_) => this.render()))
    this.subs.push(this.dataFrame.filter.onChanged.subscribe((_) => this.render()))
    this.subs.push(this.dataFrame.onCurrentCellChanged.subscribe((_) => this.render()))

    this.render()

    this.dataFrame && this.generateElements(this.dataFrame)
  }

  // TODO - IMPROVEMENT: move to utils
  generateElements(dataFrame) {
    dataFrame.columns.toList().forEach((col) => {
      console.log("name: " + col.name, "semType: " + col.semType, "type: " + col.type)
      this.editor.addComponents(`<div style="display: block; width: fit-content;">${col.name}</div>`)
    })
  }
  render() {
    // this.root.innerHTML =
    //   `${this.dataFrame.toString()}<br>
    //         Selected: ${this.dataFrame.selection.trueCount}<br>
    //         Filtered: ${this.dataFrame.filter.trueCount}`;
  }
}
