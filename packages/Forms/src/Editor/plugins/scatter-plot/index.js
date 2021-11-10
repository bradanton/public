import * as grok from 'datagrok-api/grok'
import * as DG from 'datagrok-api/dg'

import { renderBlock } from '../utils'
import { CATEGORY_NAME_VIEWER, DATA_DEMO_DEMOG } from '../const'

export default editor => {
  const blockManager = editor.BlockManager
  const domComponents = editor.DomComponents

  domComponents.addType("scatter-plot", {
    model: {
      defaults: {
        name: "Scatter Plot",
        scatterPlot: null
      }
    },
    view: {
      tagName: 'div',
      init() {
        const { model } = this
        model.scatterPlot || (model.scatterPlot = DG.Viewer.fromType(DG.VIEWER.SCATTER_PLOT, DATA_DEMO_DEMOG))
        // model.scatterPlot.root.style.width = '400px'
        // model.scatterPlot.root.style.height = '400px'
      },
      onRender({ el, model }) {
        console.log("onrender1",model.get('scatterPlot'))
        console.log("onrender2",model.scatterPlot)
        el.appendChild(model.scatterPlot.root);
      },
    }
  })

  blockManager.add("scatter-plot", {
    category: CATEGORY_NAME_VIEWER,
    label: "Scatter Plot",
    icon: `<svg viewBox="10 0 47.5 40" fill="none"  xmlns="http://www.w3.org/2000/svg">
            <path d="M46.9772 29H42.1372V16.88H28.8172V29H24.0172V0.639998H28.8172V12.36H42.1372V0.639998H46.9772V29Z" fill="#9A9797" />
          </svg>`,
    attributes: {},
    content: { type: 'scatter-plot' },
    render: renderBlock,
    //useBaseStyle: true
  })

  // blockManager.add("scatter-plot", {
  //   category: CATEGORY_NAME_VIEWER,
  //   label: "Scatter Plot",
  //   icon: `<svg viewBox="10 0 47.5 40" fill="none"  xmlns="http://www.w3.org/2000/svg">
  //           <path d="M46.9772 29H42.1372V16.88H28.8172V29H24.0172V0.639998H28.8172V12.36H42.1372V0.639998H46.9772V29Z" fill="#9A9797" />
  //         </svg>`,
  //   attributes: {},
  //   content: () => {
  //     return el.root.outerHTML
  //   },
  //   render: renderBlock,
  //   //useBaseStyle: true
  // })
}
