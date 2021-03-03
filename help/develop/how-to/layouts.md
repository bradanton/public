<!-- TITLE: Use Layouts -->

# Layouts

[Layouts](../../visualize/view-layout.md) capture how visualizations are displayed relative to each
other in a table view. This allows reusing visual templates across different data. Such UI-first
approach, when you sketch out the desired view and save the state to come back to it later, forms a
contrast to the programmatic step-by-step construction of the view in the code (see JavaScript API
for [viewers](manipulate-viewers.md) and [grid](customize-grid.md)). Layouts contain viewer settings,
positions, and relevant metadata that determine where a layout can be further suggested.

Table of contents:
  - [Creating Layouts](#creating-layouts)
  - [Working with Layouts via Server API](#server-api)
  - [Applying Layouts to New Data](#applying-layouts-to-new-data)
  - [Storing Metadata in Layouts](#storing-metadata)

## Creating Layouts

Layouts are created from views, and views, in turn, can be restored from layouts. When you save a
layout to a server repository (by choosing `View | Layout | Save to Gallery` in the top menu or
hitting _Ctrl + S_) or download it as a file (`View | Layout | Download`), internally you are
working with objects of `ViewLayout` class. There are several ways to obtain its instance: saving
existing views and constructing layouts from `JSON`. Let's start by getting a layout of the
currently open view:

```js
let layout = grok.shell.v.saveLayout();
```

This is quite explicit, there is just one caveat: this method can only be applied to
[table views](../../overview/table-view.md). The same holds for its counterpart `loadLayout`
method that applies a previously saved layout to the given view. Here is an example:

```js
let view = grok.shell.addTableView(grok.data.demo.demog());
let layout = view.saveLayout();
view.addViewer('Histogram', { value: 'age' });
view.grid.columns.rowHeader.width = 100;
view.loadLayout(layout);
```

In the above code snippet, we modify the view after saving its initial layout, so
`loadLayout` in the last line rolls back these changes.

In addition, there is a way to create a layout from `JSON`. The `JSON` describing it may come from a
[user data storage](https://public.datagrok.ai/js/samples/ui/views/layouts), a file containing a
downloaded layout, or from directly serializing an instance via `layout.toJson()`.

```js
let tableId = '';
let layoutJson = '';

grok.data.openTable(tableId).then(t => {
  let view = grok.shell.addTableView(t);
  view.loadLayout(DG.ViewLayout.fromJson(layoutJson));
});
```

## Server API

The `grok.dapi.layouts` endpoint provides common functionality inherited from
[HttpDataSource](https://datagrok.ai/js-api/HttpDataSource) that is responsible for handling collections
of entities stored on the server. Developers can save layouts, find them by id, filter the list of entities
according to [certain criteria](../../overview/smart-search.md), and so on.

## Applying Layouts to New Data

Since layouts are designed to be reusable, it is essential to determine whether they can be applied
to a new dataset. There is a special method that finds a list of appropriate layouts for a given table:

```js
let df = grok.data.demo.demog();
let view = grok.shell.addTableView(df);
grok.dapi.layouts.getApplicable(df).then(layouts => view.loadLayout(layouts[0]));
```

This method checks whether all the columns the layout was originally applied to can be mapped
to the columns of the specified table. The matching mechanism consists of the following steps:

  1. Column names and column types match
  2. Both columns have the same [layout-id](../../discover/tags.md#layout-id)
  3. Both columns have the same [semantic type](../../discover/tags.md#quality)

<!-- ## Storing Metadata -->

See also:
  - [View Layout](../../visualize/view-layout.md)
  - [Table View](../../overview/table-view.md)
  - [User Data Storage](../user-data-storage.md)
  - [JavaScript API Samples: Layout Permissions and Metadata](https://public.datagrok.ai/js/samples/dapi/layouts-and-permissions)
  - [JavaScript API Samples: Saving Layouts to User Data Storage](https://public.datagrok.ai/js/samples/ui/views/layouts)