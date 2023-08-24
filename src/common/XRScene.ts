import { createScene, Deferred, IXRRuntimeSceneItem } from 'xr-core/dist/runtime';
import {
  FlowEdgeSerializer,
  FlowNodeSerializer,
  GetEventBusDelegateMeta,
  IFlowHost,
  IFlowNode,
  Util,
} from 'ah-flow-node';
import { XRRuntime } from './XRRuntime';
import { EventBus } from 'ah-event-bus';

export class XRScene {
  ID!: string;

  title?: string;
  poster?: string;

  logger = this.project.logger.extend('_not_ready_scene_');

  readonly event = new EventBus<
    {
      afterLoaded: {};
    } & GetEventBusDelegateMeta<IFlowHost['event'], 'host:'>
  >();

  private _host = createScene(this.project.engine);
  private _inputNode?: IFlowNode<'ComponentInputNode'>;
  private _outputNode?: IFlowNode<'ComponentOutputNode'>;

  private _disposeList: (() => any)[] = [];

  constructor(readonly project: XRRuntime) {
    this.event.delegate(project.event.delegateReceiver('scene:'));
    this._host.event.delegate(this.event.delegateReceiver('host:'));

    // 监听一些事件
    this._disposeList.push(
      this._host.event.listen('node:output:change', ev => {
        if (ev.key === 'loaded' && this.isLoaded()) {
          this.logger.info('loaded');
          this.event.emit('afterLoaded', {});
        }
      })
    );
  }

  get flowHost() {
    return this._host;
  }

  get flowNodeManager() {
    return this._host.flowNodeManager;
  }

  get flowEdgeManager() {
    return this._host.flowEdgeManager;
  }

  get input() {
    return this._inputNode?.output as any; // 全局的输入是连到 inputNode.output 上的
  }

  get output() {
    return this._outputNode?.input as any; // 全局的输出是连到 outputNode.input 上的
  }

  async _restoreRt(config: IXRRuntimeSceneItem) {
    this.ID = config.ID;
    this.title = config.title;
    this.poster = config.poster;

    this.logger = this.project.logger.extend(this.title || this.ID); // 重置 logger

    this._host.ID = this.ID;
    this._host.componentDefs = config.flowComponents;
    this._host.logger = this.logger.extend('host');

    for (const desc of config.flowNodes) {
      FlowNodeSerializer.restore(this._host, desc);
    }

    for (const desc of config.flowEdges) {
      FlowEdgeSerializer.restore(this._host, desc);
    }

    // 绑定输入/出
    this._inputNode = this._host.flowNodeManager.all.find(n => Util.isFlowNode('ComponentInputNode', n)) as any;
    this._outputNode = this._host.flowNodeManager.all.find(n => Util.isFlowNode('ComponentOutputNode', n)) as any;
  }

  /** 返回 dataURL */
  takeSnapshot = Deferred.wrapAsyncFn(async () => {
    return this._host.capture({ type: 'image/png' });
  });

  /* 是否所有的资源都加载完毕 */
  isLoaded(): boolean {
    const allNodes = this.flowHost.flowNodeManager.all;
    const toCheckNodes = allNodes.filter(n => n.enabled && n._define.output['loaded']);

    for (let i = 0; i < toCheckNodes.length; i++) {
      const node = toCheckNodes[i];
      if (!node.output.loaded) return false;
    }

    return true;
  }

  dispose() {
    this._disposeList.forEach(d => d());
    this._disposeList = [];

    this.event.clear();
    this._host.dispose();
  }
}
