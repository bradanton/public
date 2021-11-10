/* Do not change these import lines to match external modules in webpack configuration */
import * as grok from 'datagrok-api/grok'
import * as ui from 'datagrok-api/ui'

/* 3rd party imports */
import grapesjs from 'grapesjs'

/* Project imports */
import './css/style.scss'
import pluginHeadline from "./plugins/headline"
import pluginBasicText from "./plugins/basic-text"
//import pluginScatterPlot from "./plugins/scatter-plot"

export default class Editor {
    _gjsEditor = null
    _view = null
    _propertyTabControl = null
    constructor(options) {
        options || (options = {})
        this._view = options.view ?? grok.shell.newView('Forms')

        let acc = ui.accordion()
        acc.addPane('header 1', () => ui.divText('Dynamic content'))
        acc.addPane('header 2', () => ui.divText('More dynamic content'))

        this._view.toolbox = acc.root

        const canvasContainer = this._view.root
        const stylesContainer = ui.panel([], { id: 'styles-container', style: { padding: '0' } })
        const layersContainer = ui.panel([], { id: 'layers-container', style: { padding: '0' } })
        const blocksContainer = ui.panel([], { id: 'blocks-container', style: { padding: '0' } })
        const traitsContainer = ui.panel([], { id: 'traits-container', style: { padding: '0' } })

        this._propertyTabControl = ui.tabControl({
            'STYLES': stylesContainer,
            'LAYERS': layersContainer,
            'BLOCKS': blocksContainer,
            'TRAITS': traitsContainer
        })
        this._propertyTabControl.root.style.height = '100%'

        const propertyPanel = document.getElementsByClassName('grok-prop-panel').item(0)
        propertyPanel.style.display = 'block'
        propertyPanel.innerHTML = ''
        propertyPanel.append(this._propertyTabControl.root)

        this._gjsEditor = grapesjs.init({
            container: canvasContainer,
            height: '100%',
            width: '100%',
            storageManager: false,
            avoidInlineStyle: 1,
            fromElement: 1,
            showOffsets: 1,
            showOffsetsSelected: 1,
            keepEmptyTextNodes: 1,

            modal: {
                backdrop: false
            },
            panels: {
                defaults: []
            },
            plugins: [
                pluginHeadline,
                pluginBasicText,
                //pluginScatterPlot
            ],
            layerManager: {
                appendTo: layersContainer
            },
            selectorManager: {
                appendTo: stylesContainer
            },
            styleManager: {
                appendTo: stylesContainer,
                sectors: [
                    {
                        name: 'General',
                        open: open,
                        buildProps: [
                            'float',
                            'display',
                            'position',
                            'top',
                            'right',
                            'left',
                            'bottom'
                        ]
                    },
                    {
                        name: 'Flex',
                        open: false,
                        buildProps: [
                            'flex-direction',
                            'flex-wrap',
                            'justify-content',
                            'align-items',
                            'align-content',
                            'order',
                            'flex-basis',
                            'flex-grow',
                            'flex-shrink',
                            'align-self'
                        ]
                    },
                    {
                        name: 'Dimension',
                        open: false,
                        buildProps: [
                            'width',
                            'height',
                            'max-width',
                            'min-height',
                            'margin',
                            'padding'
                        ]
                    },
                    {
                        name: 'Typography',
                        open: false,
                        buildProps: [
                            'font-family',
                            'font-size',
                            'font-weight',
                            'letter-spacing',
                            'color',
                            'line-height',
                            'text-align',
                            'text-shadow'
                        ],
                        properties: [
                            {
                                property: 'text-align',
                                list: [
                                    { value: 'left', className: 'fa fa-align-left' },
                                    { value: 'center', className: 'fa fa-align-center' },
                                    { value: 'right', className: 'fa fa-align-right' },
                                    { value: 'justify', className: 'fa fa-align-justify' }
                                ]
                            }
                        ]
                    },
                    {
                        name: 'Decorations',
                        open: false,
                        buildProps: [
                            'border-radius-c',
                            'background-color',
                            'border-radius',
                            'border',
                            'box-shadow',
                            'background'
                        ]
                    },
                    {
                        name: 'Extra',
                        open: false,
                        buildProps: ['transition', 'perspective', 'transform']
                    }
                ]
            },

            blockManager: {
                appendTo: blocksContainer,
            },
            traitManager: {
                appendTo: traitsContainer,
            },
        })
    }

    /**
     * @desc Destroy and cleanup
     */
    destroy() {
        this._gjsEditor.destroy()
    }

    /**
     * @desc Get internal grapesjs editor
     * @returns grapejs editor
     */
    get gjsEditor() {
        return this._gjsEditor
    }

    /**
     * @desc Get internal view
     * @returns view
     */
    get view() {
        return this._view
    }
}