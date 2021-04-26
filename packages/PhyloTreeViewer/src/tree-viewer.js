export class PhyloTreeViewer extends DG.JsViewer {
  constructor() {
    super();
    this.radialLayout = this.bool('radialLayout', false);
    this.fontSize = this.string('fontSize', '9px');
    this.nodeIdColumnName = this.string('nodeIdColumnName', 'node');
    this.selection = this.string('selection', 'descendants', { choices: [
      'none', 'path to root', 'descendants', 'path to root & descendants'
    ]});
    this.tooltipOffset = 10;
    this.defaultSize = 400;
    this.root.style = 'position: absolute; left: 0; right: 0; top: 0; bottom: 0;';
    this.tree = d3.layout.phylotree();
  }

  onTableAttached() {
    this.newick = this.dataFrame.getTag('.newick');
    this.parsedNewick = JSON.parse(this.dataFrame.getTag('.newickJson'));
    this.nodeSourceColumn = this.dataFrame.col(this.nodeIdColumnName);

    this.subs.push(this.dataFrame.onCurrentRowChanged.subscribe(() => this.render(false)));
    this.subs.push(DG.debounce(ui.onSizeChanged(this.root), 50).subscribe((_) => this.render()));
    this.render();

    d3.select(this.root).selectAll('.node > text')
      .on('mouseover', d => {
        ui.tooltip.show(
          ui.span([`${d.name}, parent: ${d.parent.name}`]),
          d3.event.x + this.tooltipOffset,
          d3.event.y + this.tooltipOffset);
      })
      .on('mouseout', () => ui.tooltip.hide());

    d3.select(this.root).selectAll('.internal-node')
      .on('mouseover', d => {
        ui.tooltip.show(
          ui.span([d.name + (d.name ? `, ` : '') + `children: ${d.children.length}`]),
          d3.event.x + this.tooltipOffset,
          d3.event.y + this.tooltipOffset);
      })
      .on('mouseout', () => ui.tooltip.hide());
  }

  onPropertyChanged() { this.render(); }

  render(redraw = true) {
    if (redraw) {
      $(this.root).empty();

      if (this.newick == null) {
        this.root.appendChild(ui.divText('Newick tag not found.', 'd4-viewer-error'));
        return;
      }

      const svg = d3.select(this.root).append("svg");

      this.tree
        .svg(svg)
        .options({
          'left-right-spacing': 'fit-to-size',
          'top-bottom-spacing': 'fit-to-size',
          zoom: true,
        })
        .size([
          this.root.parentElement.clientHeight || this.defaultSize,
          this.root.parentElement.clientWidth || this.defaultSize
        ])
        .font_size(parseInt(this.fontSize))
        .radial(this.radialLayout);

      this.tree(this.parsedNewick).layout();
    }

    if (!this.nodeSourceColumn) return;

    const nodeName = this.nodeSourceColumn.get(this.dataFrame.currentRow.idx);
    if (nodeName) {
      this.tree.modify_selection(() => false);
      if (this.selection === 'none') return;

      const node = this.tree.get_node_by_name(nodeName);
      if (nodeName === 'root' || node.depth === 0) return;

      const selection = (this.selection === 'path to root') ?
      this.tree.path_to_root(node) : (this.selection === 'descendants') ?
      this.tree.select_all_descendants(node, true, true) : (this.selection === 'path to root & descendants') ?
      this.tree.path_to_root(node).concat(this.tree.select_all_descendants(node, true, true)) : [];

      this.tree.modify_selection(selection);
    }
  }
}