import { PerformanceManager as _PerformanceManager } from 'xr-impl-bjs/dist/performance';
import { XRRuntime } from '../common';

export class PerformanceManager {
  private _innerPerfMng?: _PerformanceManager;
  private _removeListen: Function;

  constructor(private rt: XRRuntime) {
    this._removeListen = this.rt.event.listen('afterActiveSceneChange', this._reload);
    this._reload();
  }

  private _reload = () => {
    if (this._innerPerfMng) {
      this._innerPerfMng.dispose();
      this._innerPerfMng = undefined;
    }
    if (!this.rt.activeScene) return;

    this._innerPerfMng = new _PerformanceManager(this.rt.activeScene.flowHost);
  };

  calc() {
    if (!this._innerPerfMng) throw new Error('PerformanceManager is not ready');
    return this._innerPerfMng.calc();
  }

  dispose() {
    this._removeListen();
    if (this._innerPerfMng) this._innerPerfMng.dispose();
  }
}
