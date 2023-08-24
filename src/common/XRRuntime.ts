import { MemoryFS } from 'ah-memory-fs';
import { BizLogger } from './BizLogger';
import { XRScene } from './XRScene';
import { createEngine, IXRRuntimeConfig } from 'xr-core/dist/runtime';
import { EventBus } from 'ah-event-bus';
import { GetEventBusDelegateMeta } from 'ah-flow-node';

export class XRRuntime {
  constructor(readonly mfs: MemoryFS, private opt?: { engine?: any }) {}

  readonly logger = new BizLogger('XR');
  readonly event = new EventBus<
    {
      afterActiveSceneChange: {};
    } & GetEventBusDelegateMeta<XRScene['event'], 'scene:'>
  >();

  readonly engine = createEngine(this.mfs, this.opt?.engine);
  private _activeScene?: XRScene;

  get activeSceneID(): string | undefined {
    return this.engine.activeSceneID;
  }
  set activeSceneID(ID: string | undefined) {
    this.engine.activeSceneID = ID;
    this.event.emit('afterActiveSceneChange', {});
  }

  get activeScene() {
    return this._activeScene;
  }

  async reload(entryPath = 'runtime.json') {
    this.logger.info('reloading: %s', entryPath);

    const config = await this.mfs.readFileAsJSON<IXRRuntimeConfig>(entryPath);
    if (!config) throw new Error('missing config');

    // restore scene
    const activeSceneID = config.scene.entryID || config.scene.list[0].ID;

    const sceneItem = config.scene.list.find(d => d.ID === activeSceneID);
    if (!sceneItem) throw new Error('active scene ID not found: ' + activeSceneID);

    const sm = new XRScene(this);
    await sm._restoreRt(sceneItem);

    this._activeScene = sm;
    this.activeSceneID = activeSceneID; // 有副作用，所以放这里
  }

  dispose() {
    this.logger.info('disposing');

    if (this.activeScene) this.activeScene.dispose();
    this.engine.dispose();
    this.event.clear();
  }
}
