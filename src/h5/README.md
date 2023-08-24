{{HEAD}}

# SDK 集成

```typescript
import { loadXRRuntime } from 'xr-runtime-h5';

// 通过发布后生成的 baseURL 和 fileIndex，初始化 SDK
const runtime = await loadXRRuntime({
  container: document.getElementById('container'),
  mfs: {
    url: '<baseURL>',
    indexKey: '<fileIndex>',
  },
});

// api 驱动场景变化
// 比如这个切换场景主模型的功能：
function updateModel() {
  // 通过名字获取节点
  const modelNode = runtime.activeScene.flowNodeManager.lookup('主模型节点');

  // 直接修改节点属性即可生效
  modelNode.url = '<模型 URL 地址>';

  // 还可以调整模型位置等
  modelNode.position = { x: 10, y: 20, z: 100 };
}
```
