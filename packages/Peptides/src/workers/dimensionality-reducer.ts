import {DimensionalityReducer} from '@datagrok-libraries/utils/src/reduce-dimensionality';

function onMessage(columnData: [], method: string, measure: string, cyclesCount: number): Array<Float32Array> {
  const reducer = new DimensionalityReducer(
    columnData,
    method,
    measure,
    {cycles: cyclesCount},
  );
  return reducer.transform(true);
}

self.onmessage = ({data: {columnData, method, measure, cyclesCount}}) => {
  const embedding = onMessage(columnData, method, measure, cyclesCount);
  self.postMessage({
    embedding: embedding,
  });
};

