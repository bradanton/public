import {RdKitServiceWorkerClient} from './rdkit_service_worker_client';

export class RdKitService {

  readonly _nJobWorkers = 1; // only 1 for now
  _nParallelWorkers: number;
  _jobWorkers: RdKitServiceWorkerClient[] = [];
  _parallelWorkers: RdKitServiceWorkerClient[] = [];
  _jobWorker: RdKitServiceWorkerClient | undefined;
  segmentLength: number = 0;

  constructor() {
    const cpuLogicalCores = window.navigator.hardwareConcurrency;
    this._nParallelWorkers = Math.max(1, cpuLogicalCores - 2);
  }

  async init(webRoot: string): Promise<void> {
    this._parallelWorkers = [];
    this._jobWorkers = [];
    let initWaiters = [];
    for (let i = 0; i < this._nParallelWorkers; ++i) {
      let workerClient = new RdKitServiceWorkerClient();
      if (i < this._nJobWorkers)
        this._jobWorkers[i] = workerClient;
      this._parallelWorkers[i] = workerClient;
      initWaiters.push(workerClient.moduleInit(webRoot));
    }
    await Promise.all(initWaiters);
    this._jobWorker = this._jobWorkers[0];
  }

  async _doParallel(fooScatter: any, fooGather = async (d: any) => []): Promise<any> {
    let promises = [];
    const nWorkers = this._nParallelWorkers;
    for (let i = 0; i < nWorkers; i++) {
      promises[i] = fooScatter(i, nWorkers);
    }
    let data = await Promise.all(promises);
    return fooGather(data);
  }

  async _initParallelWorkers(dict: string[], func: any, postFunc: any): Promise<any> {
    let t = this;
    return this._doParallel(
      async (i: number, nWorkers: number) => {
        const length = dict.length;
        const segmentLength = Math.floor(length / nWorkers);
        t.segmentLength = segmentLength;
        const segment = i < (nWorkers - 1) ?
          dict.slice(i * segmentLength, (i + 1) * segmentLength) :
          dict.slice(i * segmentLength, length);
        return func(i, segment);
      },
      postFunc
    );
  }

  async initMoleculesStructures(dict: string[]): Promise<any> {
    return this._initParallelWorkers(dict, (i: number, segment: any) =>
      this._parallelWorkers[i].initMoleculesStructures(segment),
      async (resultArray: any[]) => resultArray.reduce((acc: any, item: any) => {
        item = item || {molIdxToHash: [], hashToMolblock: {}};
        return {
          molIdxToHash: [...acc.molIdxToHash, ...item.molIdxToHash],
          hashToMolblock: {...acc.hashToMolblock, ...item.hashToMolblock}
        }
      }, {molIdxToHash: [], hashToMolblock: {}}));
  }

  async searchSubstructure(query: string, querySmarts: string) {
    let t = this;
    return this._doParallel(
      async (i: number, nWorkers: number) => {
        return t._parallelWorkers[i].searchSubstructure(query, querySmarts);
      },
      async (data: any) => {
        for (let k = 0; k < data.length; ++k) {
          data[k] = JSON.parse(data[k]);
          data[k] = data[k].map((a: number) => a + t.segmentLength * k);
        }
        return [].concat.apply([], data);
      });
  }

  async initTanimotoFingerprints() {
    return this._initParallelWorkers([], (i: number, segment: any) =>
      this._parallelWorkers[i].initTanimotoFingerprints(), (_: any) => {});
  }

  async getSimilarities(queryMolString: string): Promise<number[]> {
    let t = this;
    return this._doParallel(
      async (i: number, nWorkers: number) => {
        return t._parallelWorkers[i].getSimilarities(queryMolString);
      },
      async (data: any) => {
        return [].concat.apply([], data);
      });
  }

  async initStructuralAlerts(smarts: string[]): Promise<void> {
    for (let i = 0; i < this._jobWorkers.length; ++i) {
      await this._jobWorkers[i].initStructuralAlerts(smarts);
    }
  }

  async getStructuralAlerts(smiles: string): Promise<number[]> {
    // may be round-robin or job stealing in the future
    return (await this._jobWorker!.getStructuralAlerts(smiles)) as number[];
  }

}