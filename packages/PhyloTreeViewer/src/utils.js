export function newickToDf(newick, filename) {
  let parent = null;
  let i = 0;
  const parsedNewick = d3.layout.newick_parser(newick);
  const obj = parsedNewick.json;
  const nodes = [], parents = [], distances = [], annotations = [];

  function traverse(obj) {
    if (obj === null || typeof obj != 'object' ) return;
    if (!Array.isArray(obj)) {
      let name = obj.name;
      if (!name) name = obj.name = `node-${i}`, i++;
      nodes.push(name);
      distances.push(obj.attribute ? parseFloat(obj.attribute) : null);
      annotations.push(obj.annotation);
      parents.push(parent);
      if (obj.children) parent = name;
    }
    Object.values(obj).forEach(value => traverse(value));
  }
  traverse(obj);

  const columns = [
    DG.Column.fromList('string', 'node', nodes),
    DG.Column.fromList('string', 'parent', parents),
  ];

  if (distances.some(d => d !== null)) {
    columns.push(DG.Column.fromList('double', 'distance', distances));
  }

  if (annotations.some(a => !!a)) {
    columns.push(DG.Column.fromList('string', 'annotation', annotations));
  }

  const df = DG.DataFrame.fromColumns(columns);

  df.name = `df-${filename.slice(0, -4)}`;
  df.setTag('.newick', newick);
  df.setTag('.newickJson', JSON.stringify(parsedNewick));

  return df;
};