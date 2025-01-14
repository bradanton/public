import { VIEW_TYPE, VIEWER } from '../const';
import * as ui from '../../ui';
import { DockNode, DockManager } from '../docking';
import { Grid } from '../grid';
import { Menu, ToolboxPage } from '../widgets';
import { Entity } from '../entities';
import { toJs } from '../wrappers';
import { _options, _toIterable } from '../utils';
import $ from 'cash-dom';
let api = window;
/**
 * Subclass ViewBase to implement a Datagrok view in JavaScript.
 * */
export class ViewBase {
  /**
     * @constructs ViewBase
     * @param {Object} params - URL parameters.
     * @param {string} path - URL path.
     * @param {boolean} createHost - Create JS host wrapper. */
  constructor(params = null, path = '', createHost = true) {
    if (createHost)
      this.d = api.grok_View_CreateJsViewHost(this);
    this._root = ui.div([], 'grok-view');
    this._root.tabIndex = 0;
    /** @type {StreamSubscription[]} */
    this.subs = []; // stream subscriptions - will be canceled when the view is detached
    this._closing = false;
  }
  /** @type {HTMLElement} */
  get root() {
    return this._root;
  }
  /** View type
     * @type {string} */
  get type() {
    return 'js-view-base';
  }
  /** @returns {string|null} View help URL. */
  get helpUrl() {
    return null;
  }
  /** View name. It gets shown in the tab handle.
     * @type {string} */
  get name() {
    // @ts-ignore
    return api.grok_View_Get_Name == null ? this._name : api.grok_View_Get_Name(this.d);
  }
  set name(s) {
    if (api.grok_View_Set_Name == null)
    // @ts-ignore
      this._name = s;
    else
      api.grok_View_Set_Name(this.d, s);
  }
  /** @type {string} */
  get description() {
    return '';
  }
  set description(s) {
  }
  /** @type {Object} */
  get entity() {
    return null;
  }
  set entity(e) {
  }
  /** View toolbox.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/views/toolbox}
     * @type {HTMLElement} */
  get toolbox() {
    return api.grok_View_Get_Toolbox(this.d);
  }
  set toolbox(x) {
    api.grok_View_Set_Toolbox(this.d, x);
  }
  /** View menu.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/views/ribbon}
     *  @type {Menu} */
  get ribbonMenu() {
    return new Menu(api.grok_View_Get_RibbonMenu(this.d));
  }
  set ribbonMenu(menu) {
    api.grok_View_Set_RibbonMenu(this.d, menu.d);
  }
  get closing() {
    return this._closing;
  }
  set closing(c) {
    this._closing = c;
  }
  /** Sets custom view panels on the ribbon.
     * @param {Array<Array<HTMLElement>>} panels
     * @param {boolean} clear Clear all previous before setup
     * Sample: {@link https://public.datagrok.ai/js/samples/ui/views/ribbon} */
  setRibbonPanels(panels, clear = false) {
    api.grok_View_SetRibbonPanels(this.d, panels, clear);
  }
  /** @returns {HTMLElement} View icon. */
  getIcon() {
    return null;
  }
  /** @returns {Object} Viewer state map. */
  saveStateMap() {
    return null;
  }
  /** Load view state map.
     * @param {Object} stateMap - State map. */
  loadStateMap(stateMap) {
  }
  /**
     * View URI, relative to the platform root. See also {@link basePath}
     * @type {string} */
  get path() {
    return '';
  }
  set path(s) {
  }
  /** Handles URL path.
     * @param  {string} path - URL path. */
  handlePath(path) {
  }
  /** Checks if URL path is acceptable.
     * @returns {boolean} "true" if path is acceptable, "false" otherwise.
     * @param {string} path - URL path. */
  acceptsPath(path) {
    return false;
  }
  /**
     * Appends an item to this view. Use {@link appendAll} for appending multiple elements.
     * @param {Object} item */
  append(item) {
    return this.appendAll([ui.render(item)]);
  }
  /**
     * Appends multiple elements this view. Use {@link append} for appending a single element.
     * @param {object[]} items */
  appendAll(items) {
    return ui.appendAll(this.root, items.map(x => ui.render(x)));
  }
  /** Detaches this view. */
  detach() {
    this.subs.forEach((sub) => sub.unsubscribe());
  }
  /** Closes this view. */
  close() {
    this._closing = true;
    api.grok_View_Close(this.d);
  }
}
/**
 * A view is typically docked in the main document area of the Grok platform.
 * See [TableView], [SketchView], etc
 */
export class View extends ViewBase {
  /** @constructs View */
  constructor(d) {
    super(null, '', false);
    this.d = d;
  }
  static fromDart(d) {
    let type = api.grok_View_Get_Type(d);
    if (type === VIEW_TYPE.TABLE_VIEW)
      return new TableView(d);
    else
      return new View(d);
  }
  /** Creates a new empty view.
     * @param {string | ElementOptions | null} options
     * @returns {View} */
  static create(options) {
    let v = api.grok_View == null ? new View(null) : new View(api.grok_View());
    _options(v.root, 'ui-panel');
    _options(v.root, options);
    return v;
  }
  /** Creates one of the standard views based on the view type (such as 'functions') */
  static createByType(viewType, options) {
    return new View(api.grok_View_CreateByType(viewType, options));
  }
  get box() {
    return $(this.root).hasClass('ui-box');
  }
  set box(b) {
    let r = $(this.root);
    r.removeClass('ui-panel').removeClass('ui-box');
    r.addClass(b ? 'ui-box' : 'ui-panel');
  }
  get root() {
    if (api.grok_View_Get_Root == null)
      return this._root;
    return api.grok_View_Get_Root(this.d);
  }
  get type() {
    return api.grok_View_Get_Type(this.d);
  }
  get path() {
    return api.grok_View_Get_Path(this.d);
  }
  set path(s) {
    api.grok_View_Set_Path(this.d, s);
  }
  /**
     *  View type URI. Note that {@link path} is specific to the instance of the view.
     *  @type {string} */
  get basePath() {
    return api.grok_View_Get_BasePath(this.d);
  }
  set basePath(s) {
    api.grok_View_Set_BasePath(this.d, s);
  }
  get description() {
    return api.grok_View_Get_Description(this.d);
  }
  set description(s) {
    api.grok_View_Set_Description(this.d, s);
  }
  /**
     * Loads previously saved view layout. Only applicable to certain views, such as {@link TableView}.
     *  See also {@link saveLayout}
     *  @param {ViewLayout} layout */
  loadLayout(layout) {
    return api.grok_View_Load_Layout(this.d, layout.d);
  }
  /**
     *  Saves view layout as a string. Only applicable to certain views, such as {@link TableView}.
     *  See also {@link loadLayout}
     *  @returns {ViewLayout} */
  saveLayout() {
    return new ViewLayout(api.grok_View_Save_Layout(this.d));
  }
}
// to be used in [createByType].
View.APPS = 'apps';
View.SETTINGS = 'settings';
View.WELCOME = 'welcome';
View.SCRIPT = 'script';
View.SKETCH = 'sketch';
View.FORUM = 'forum';
View.PROJECTS = 'projects';
View.NOTEBOOKS = 'notebooks';
View.HELP = 'help';
View.OPEN_TEXT = 'text';
View.DATABASES = 'databases';
View.WEB_SERVICES = 'webservices';
View.VIEW_LAYOUTS = 'layouts';
View.FUNCTIONS = 'functions';
View.DATA_CONNECTIONS = 'connections';
View.DATA_JOB_RUNS = 'jobs';
View.FILES = 'files';
View.DATA_QUERY_RUNS = 'queryruns';
View.EMAILS = 'emails';
View.GROUPS = 'groups';
View.MODELS = 'models';
View.QUERIES = 'queries';
View.SCRIPTS = 'scripts';
View.USERS = 'users';
View.PACKAGES = 'packages';
View.PACKAGE_REPOSITORIES = 'repositories';
View.JS_EDITOR = 'js';
View.ALL_VIEW_TYPES = [View.APPS, View.SETTINGS, View.WELCOME, View.SCRIPT, View.SKETCH,
  View.FORUM, View.PROJECTS, View.NOTEBOOKS, View.HELP, View.OPEN_TEXT, View.DATABASES,
  View.WEB_SERVICES, View.VIEW_LAYOUTS, View.FUNCTIONS, View.DATA_CONNECTIONS, View.DATA_JOB_RUNS,
  View.FILES, View.DATA_QUERY_RUNS, View.EMAILS, View.GROUPS, View.MODELS, View.QUERIES,
  View.SCRIPTS, View.USERS, View.PACKAGES, View.PACKAGE_REPOSITORIES, View.JS_EDITOR];
/**
 * A {@link View} that is associated with a {@link DataFrame} and exposes
 * exploratory data analysis functionality. This view gets opened whenever
 * a new table is added to the workspace when a user drag-and-drops a CSV file,
 * or opens a table in any other way.
 * @extends View
 */
export class TableView extends View {
  /** @constructs TableView */
  constructor(d) {
    super(d);
  }
  /** Creates a new table view.
     * @param {DataFrame} table
     * @returns {TableView} */
  static create(table) {
    return new TableView(api.grok_TableView(table.d));
  }
  /** Associated table, if it exists (for TableView), or null.
     *  @type {DataFrame} */
  get table() {
    return toJs(api.grok_View_Get_Table(this.d));
  }
  /** @type {Grid} */
  get grid() {
    return new Grid(api.grok_View_Get_Grid(this.d));
  }
  /** @type {DataFrame} */
  get dataFrame() {
    return toJs(api.grok_View_Get_DataFrame(this.d));
  }
  set dataFrame(x) {
    api.grok_View_Set_DataFrame(this.d, x.d);
  }
  /** View toolbox that gets shown on the left, in the sidebar.
     *  @type {ToolboxPage} */
  get toolboxPage() {
    return new ToolboxPage(api.grok_View_Get_ToolboxPage(this.d));
  }
  /** Adds a viewer of the specified type.
     * @param {string | Viewer} v
     * @param options
     * @returns {Viewer} */
  addViewer(v, options = null) {
    if (typeof v === 'string')
      v = toJs(api.grok_View_AddViewerByName(this.d, v));
    else
      api.grok_View_AddViewer(this.d, v.d);
    if (options !== null)
      v.setOptions(options);
    return v;
  }
  /** A dock node for this view.
     *  Use `grok.shell.dockManager` to manipulate it; {@link dockManager} is for controlling
     *  windows that reside inside this view.
     *  @type {DockNode} */
  get dockNode() {
    return new DockNode(api.grok_View_Get_DockNode(this.d));
  }
  /**
     * View's dock manager. Only defined for DockView descendants such as {@link TableView}, UsersView, etc.
     * @type {DockManager} */
  get dockManager() {
    return new DockManager(api.grok_View_Get_DockManager(this.d));
  }
  /**
     *  Adds a {@link https://datagrok.ai/help/visualize/viewers/histogram | histogram}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/histogram}
     *  @param options
     *  @returns {Viewer} */
  histogram(options = null) {
    return this.addViewer(VIEWER.HISTOGRAM, options);
  }
  /**
     *  Adds a {@link https://datagrok.ai/help/visualize/viewers/bar-chart | bar chart}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/bar-chart}
     *  @param options
     *  @returns {Viewer} */
  barChart(options = null) {
    return this.addViewer(VIEWER.BAR_CHART, options);
  }
  /**
     *  Adds a {@link https://datagrok.ai/help/visualize/viewers/box-plot | box plot}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/box-plot}
     *  @param options
     *  @returns {Viewer} */
  boxPlot(options = null) {
    return this.addViewer(VIEWER.BOX_PLOT, options);
  }
  /**
     *  Adds a {@link https://datagrok.ai/help/visualize/viewers/calendar | calendar}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/calendar}
     *  @param options
     *  @returns {Viewer} */
  calendar(options = null) {
    return this.addViewer(VIEWER.CALENDAR, options);
  }
  /**
     *  Adds a {@link https://datagrok.ai/help/visualize/viewers/correlation-plot | correlation plot}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/corr-plot}
     *  @param options
     *  @returns {Viewer} */
  corrPlot(options = null) {
    return this.addViewer(VIEWER.CORR_PLOT, options);
  }
  /**
     *  Adds a {@link https://datagrok.ai/help/visualize/viewers/density-plot | density plot}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/density-plot}
     *  @param options
     *  @returns {Viewer} */
  densityPlot(options = null) {
    return this.addViewer(VIEWER.DENSITY_PLOT, options);
  }
  /**
     *  Adds {@link https://datagrok.ai/help/visualize/viewers/filters | filters}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/filters}
     *  @param options
     *  @returns {Viewer} */
  filters(options = null) {
    return this.addViewer(VIEWER.FILTERS, options);
  }
  /**
     *  Adds default {@link https://datagrok.ai/help/visualize/viewers/form | form}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/form}
     *  @param options
     *  @returns {Viewer} */
  form(options = null) {
    return this.addViewer(VIEWER.FORM, options);
  }
  /**
     *  Adds a {@link https://datagrok.ai/help/visualize/viewers/google-map | geographical map}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/google-map}
     *  @param options
     *  @returns {Viewer} */
  googleMap(options = null) {
    return this.addViewer(VIEWER.GOOGLE_MAP, options);
  }
  /**
     *  Adds a {@link https://datagrok.ai/help/visualize/viewers/heat-map | heat map}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/heat-map}
     *  @param options
     *  @returns {Viewer} */
  heatMap(options = null) {
    return this.addViewer(VIEWER.HEAT_MAP, options);
  }
  /**
     *  Adds a {@link https://datagrok.ai/help/visualize/viewers/line-chart | line chart}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/line-chart}
     *  @param options
     *  @returns {Viewer} */
  lineChart(options = null) {
    return this.addViewer(VIEWER.LINE_CHART, options);
  }
  /**
     *  Adds a {@link https://datagrok.ai/help/visualize/viewers/shape-map | shape map}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/shape-map}
     *  @param options
     *  @returns {Viewer} */
  shapeMap(options = null) {
    return this.addViewer(VIEWER.SHAPE_MAP, options);
  }
  /**
     *  Adds a {@link https://datagrok.ai/help/visualize/viewers/markup | markup viewer}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/markup}
     *  @param options
     *  @returns {Viewer} */
  markup(options = null) {
    return this.addViewer(VIEWER.MARKUP, options);
  }
  /**
     *  Adds a {@link https://datagrok.ai/help/visualize/viewers/matrix-plot | matrix plot}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/matrix-plot}
     *  @param options
     *  @returns {Viewer} */
  matrixPlot(options = null) {
    return this.addViewer(VIEWER.MATRIX_PLOT, options);
  }
  /**
     *  Adds a {@link https://datagrok.ai/help/visualize/viewers/network-diagram | network diagram}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/network-diagram}
     *  @param options
     *  @returns {Viewer} */
  networkDiagram(options = null) {
    return this.addViewer(VIEWER.NETWORK_DIAGRAM, options);
  }
  /**
     *  Adds a {@link https://datagrok.ai/help/visualize/viewers/pc-plot | parallel coordinates plot}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/pc-plot}
     *  @param options
     *  @returns {Viewer} */
  pcPlot(options = null) {
    return this.addViewer(VIEWER.PC_PLOT, options);
  }
  /**
     *  Adds a {@link https://datagrok.ai/help/visualize/viewers/pie-chart | pie chart}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/pie-chart}
     *  @param options
     *  @returns {Viewer} */
  pieChart(options = null) {
    return this.addViewer(VIEWER.PIE_CHART, options);
  }
  /**
     *  Adds a {@link https://datagrok.ai/help/visualize/viewers/scatter-plot | scatter plot}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/scatter-plot}
     *  @param options
     *  @returns {Viewer} */
  scatterPlot(options = null) {
    return this.addViewer(VIEWER.SCATTER_PLOT, options);
  }
  /**
     *  Adds a {@link https://datagrok.ai/help/visualize/viewers/3d-scatter-plot | 3D scatter plot}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/scatter-plot-3d}
     *  @param options
     *  @returns {Viewer} */
  scatterPlot3d(options = null) {
    return this.addViewer(VIEWER.SCATTER_PLOT_3D, options);
  }
  /**
     *  Adds a {@link https://datagrok.ai/help/visualize/viewers/statistics | statistics}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/statistics}
     *  @param options
     *  @returns {Viewer} */
  statistics(options = null) {
    return this.addViewer(VIEWER.STATISTICS, options);
  }
  /**
     *  Adds a {@link https://datagrok.ai/help/visualize/viewers/tile-viewer | tile viewer}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/tile-viewer}
     *  @param options
     *  @returns {Viewer} */
  tileViewer(options = null) {
    return this.addViewer(VIEWER.TILE_VIEWER, options);
  }
  /**
     *  Adds a {@link https://datagrok.ai/help/visualize/viewers/tree-map | tree map}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/tree-map}
     *  @param options
     *  @returns {Viewer} */
  treeMap(options = null) {
    return this.addViewer(VIEWER.TREE_MAP, options);
  }
  /**
     *  Adds a {@link https://datagrok.ai/help/visualize/viewers/trellis-plot | trellis plot}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/trellis-plot}
     *  @param options
     *  @returns {Viewer} */
  trellisPlot(options = null) {
    return this.addViewer(VIEWER.TRELLIS_PLOT, options);
  }
  /**
     *  Adds a {@link https://datagrok.ai/help/visualize/viewers/word-cloud | word cloud}.
     *  Sample: {@link https://public.datagrok.ai/js/samples/ui/viewers/types/word-cloud}
     *  @param options
     *  @returns {Viewer} */
  wordCloud(options = null) {
    return this.addViewer(VIEWER.WORD_CLOUD, options);
  }
  /** Resets view layout, leaving only grid visible. */
  resetLayout() {
    api.grok_View_ResetLayout(this.d);
  }
  /** Detaches and closes the view. */
  detach() {
    api.grok_View_Detach(this.d);
  }
  /** Detaches all viewers. */
  detachViewers() {
    api.grok_View_DetachViewers(this.d);
  }
  /** Returns all viewers.
     * @type {Iterable.<Viewer>} */
  get viewers() {
    return _toIterable(api.grok_View_Get_Viewers(this.d));
  }
  get syncCurrentObject() { return api.grok_TableView_Get_SyncCurrentObject(this.d); }
  set syncCurrentObject(x) { api.grok_TableView_Set_SyncCurrentObject(this.d, x); }
}
/** Base view for working with a collection of objects that reside on the server.
 *  Typically, results are filtered by applying AND operation between two
 *  filters: {@link permanentFilter} (which is set programmatically and is not visible)
 *  and {@link searchValue} entered by the user.
 *
 *  More details on the smart search syntax: {@link https://datagrok.ai/help/overview/smart-search}
 *
 * @extends View */
export class DataSourceCardView extends View {
  /** @constructs DataSourceCardView */
  constructor(d) {
    super(d);
  }
  /**
     * User-specified {@link https://datagrok.ai/help/overview/smart-search | filter expression}.
     * @type {string} */
  get searchValue() {
    return api.grok_DataSourceCardView_Get_SearchValue(this.d);
  }
  set searchValue(s) {
    api.grok_DataSourceCardView_Set_SearchValue(this.d, s);
  }
  /** Programmatically defined invisible
     * {@link https://datagrok.ai/help/overview/smart-search | filter expression}.
     *  @type {string} */
  get permanentFilter() {
    return api.grok_DataSourceCardView_Get_PermanentFilter(this.d);
  }
  set permanentFilter(s) {
    api.grok_DataSourceCardView_Set_PermanentFilter(this.d, s);
  }
}
/** Projects view */
export class ProjectsView extends DataSourceCardView {
  /** @constructs ProjectsView */
  constructor(d) {
    super(d);
  }
  static create(params) {
    return new ProjectsView(api.grok_ProjectsView(params));
  }
}
/** Script view */
export class ScriptView extends View {
  /** @constructs ScriptView */
  constructor(d) {
    super(d);
  }
  static create(script) {
    return new ScriptView(api.grok_ScriptView(script.d));
  }
}
export class ViewLayout extends Entity {
  /** @constructs ViewLayout */
  constructor(d) {
    super(d);
  }
  static fromJson(json) {
    return new ViewLayout(api.grok_ViewLayout_FromJson(json));
  }
  static fromViewState(state) {
    return new ViewLayout(api.grok_ViewLayout_FromViewState(state));
  }
  /** Only defined within the context of the OnViewLayoutXXX events */
  get view() {
    return api.grok_ViewLayout_Get_View(this.d);
  }
  get viewState() {
    return api.grok_ViewLayout_Get_ViewState(this.d);
  }
  set viewState(state) {
    api.grok_ViewLayout_Set_ViewState(this.d, state);
  }
  getUserDataValue(key) {
    return api.grok_ViewLayout_Get_UserDataValue(this.d, key);
  }
  setUserDataValue(key, value) {
    return api.grok_ViewLayout_Set_UserDataValue(this.d, key, value);
  }
  toJson() {
    return api.grok_ViewLayout_ToJson(this.d);
  }
}
export class VirtualView {
  constructor(d) {
    this.d = d;
  }
  static create(verticalScroll = true, maxCols = 100) {
    return new VirtualView(api.grok_VirtualItemView(verticalScroll, maxCols));
  }
  get root() {
    return api.grok_VirtualItemView_Get_Root(this.d);
  }
  setData(length, renderer) {
    api.grok_VirtualItemView_SetData(this.d, length, renderer);
  }
}
//# sourceMappingURL=view.js.map