import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';
import * as rxjs from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {initSearch, powerSearch, queriesSearch} from "./search/power-search";
import {widgetHost, WIDGETS_STORAGE } from './utils';

interface UserWidgetSettings {
  factoryName?: string;
  caption?: string;
  ignored?: boolean;
}

interface UserWidgetsSettings {
  [index: string]: UserWidgetSettings;
}

let settings: UserWidgetsSettings;

export function welcomeView() {
  let input = ui.element('input', 'ui-input-editor') as HTMLInputElement;
  input.placeholder = 'Search everywhere. Try "aspirin" or "7JZK"';
  let inputHost = ui.div([
    ui.iconFA('search'),
    ui.div([
      input
    ], 'ui-input-root,ui-input-type-ahead')
  ], 'd4-search-bar');

  let searchHost = ui.block([], 'power-pack-search-host');
  let widgetsHost = ui.div([], 'power-pack-widgets-host');
  let viewHost = ui.div([widgetsHost, searchHost]);
  grok.shell.newView('Welcome', [inputHost, viewHost], 'power-pack-welcome-view');

  let widgetFunctions = DG.Func.find({returnType: 'widget'});

  grok.dapi.userDataStorage.get(WIDGETS_STORAGE).then((settings) => {
    for (let f of widgetFunctions) {
      if (!settings[f.name] || settings[f.name].ignored)
        f.apply().then(function (w: DG.Widget) {
          w.factory = f;
          widgetsHost.appendChild(widgetHost(w));
        }).catch((e) => {
          console.error(`Unable to execute function ${f.name}`, e);
        });
    }
  });

  initSearch();

  rxjs.fromEvent(input, 'input').pipe(debounceTime(300)).subscribe(_ => {
    let search = input.value !== '';
    widgetsHost.style.display = (search ? 'none' : '');
    searchHost.style.display = (search ? '' : 'none');
    powerSearch(input.value, searchHost);
  });
}