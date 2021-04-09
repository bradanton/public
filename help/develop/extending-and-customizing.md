!-- TITLE: Extending and customizing Datagrok -->
<!-- SUBTITLE: -->

# Extending and customizing Datagrok

Datagrok is built highly extensible, composable and customizable. Many parts of the Datagrok platform can be
enhanced by plugins using our [JavaScript API](js-api.md). The plugins are structured and delivered to the platform
using [Datagrok packages](develop.md#packages). Many features of the platform, such as a
[Timelines](https://github.com/datagrok-ai/public/tree/master/packages/Viewers) or
[Sunburst](https://github.com/datagrok-ai/public/tree/master/packages/Sunburst) viewers,
as well as a [Cheminformatics package](https://github.com/datagrok-ai/public/tree/master/packages/Chem),
are already built as plugins. It is straightforward to create your own ones,
using the [existing packages](https://github.com/datagrok-ai/public/tree/master/packages) as examples, and
following our [guides](develop.md), [API samples](https://public.datagrok.ai/js), [how-to's](how-to/develop-custom-viewer.md), and [exercises](exercises.md).

Both the existing extensions and your own-made ones are intended highly customizable. For instance,
look at some properties of the [grid viewer](visualize/viewers/grid.md), where you can set which tooltips
to display, which grid lines to present, and even add [conditional color coding](visualize/viewers/grid.md#color-coding)! Datagrok also provides for introducing your own [custom properties]() specific to your plugins.

## What can be extended

With using our [JavaScript API](js-api.md), you can create your own:

* [functions](overview/functions/function.md), which may be written in any [scripting language we support]
  (develop/scripting.md), and later be reused in various contexts, including other functions, or called directly
  from Datagrok UI or the [console](overview/navigation.md#console)  
* [visualizations (viewers)](visualize/viewers.md) — to view data in new ways, in addition to our 30+ viewers
* [file viewers](develop/how-to/custom-file-viewers.md) — to support new data formats in addition to many
  we already recognize
* [cell renderers](visualize/viewers/grid.md#custom-cell-renderers) — to visualize certain semantic types,
  such as [molecules](https://github.com/datagrok-ai/public/blob/master/packages/Chem/src/rdkit_cell_renderer.js) or [nucleotide sequences](https://github.com/datagrok-ai/public/tree/master/packages/Sequence/web-logo-viewer),
  in their native-looking renders, inside contexts such as a grid cell, a tooltip, or an axis label in a viewer
* [semantic type detectors](develop/how-to/semantic-type-detector.md) — to attach semantic types to columns of particular data types to later re-use this knowledge
* Web [applications](develop/how-to/build-an-app.md) focused on specific tasks, such as an interactive dashboard
  or a data set browser, as [the one for Chembl](https://github.com/datagrok-ai/public/tree/master/packages/ChemblBrowser)
* menus, which may be embed into virtually any context inside the Datagrok UI, such as a
  [top menu](https://public.datagrok.ai/js/samples/ui/menu) or a [context menu](https://public.datagrok.ai/js/samples/events/viewer-events) of a viewer
* [info panels](develop/how-to/build-info-panel.md), which augment datasets with all possible kinds of computable
  information based on the original dataset contents
* [connections](access/data-connection.md), to add new public or in-house data sources to the Datagrok instance,
  such as [Chembl](https://www.ebi.ac.uk/chembl/) or [ENA](https://www.ebi.ac.uk/ena/browser/),
* custom [filters](https://github.com/datagrok-ai/public/blob/master/packages/Widgets/src/filters/radio_button_filter.js),
  which allow adding a filtering mask to an active dataset; in addition, viewers themselves may act as filters,
  and filtering through one viewer shall reflect the state in all the other active viewers
* [accordion sections](develop/ui.md#accordions) — accordion is an area on the left of the Datagrok UI,
  useful for additional custom functionality

## What can be customized

## Getting started

Let's get a taste of plugin development with a simple extension, which embeds to Datagrok through the main menu.

## Creating your first plugin

## The main function

## Deploying the plugin

## Overview of the API

## Overview of some examples

<!-- Grid properties, etc. TBD -->