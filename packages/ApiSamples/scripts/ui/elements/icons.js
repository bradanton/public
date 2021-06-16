// Font-awesome icons

ui.dialog('Icons')
  .add(ui.divH([
    ui.divText('Font Awesome icons'),
    ui.iconFA('question'),
    ui.iconFA('info'),
    ui.iconFA('cogs')
  ]))
  .add(ui.div([
    ui.divText('Special items'),
    ui.icons.settings(() => grok.shell.info('click'), 'Settings'),
    ui.icons.help(() => grok.shell.info('click'), 'Help'),
    ui.icons.close(() => grok.shell.info('click'), 'Close'),
  ], 'd4-dialog-header'))
  .show();