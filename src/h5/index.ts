import { ExternalImpl, FILE_INDEX_BLOCK_ID, MemoryFS, NetworkAdapter } from 'ah-memory-fs';
import { XRRuntime, DefaultBizLogger as RTDefaultBizLogger } from '../common';
import * as bjsImpl from 'xr-impl-bjs';
import { setup as XRSetup } from 'xr-core/dist/runtime';

export * from '../common';

// impl setup
ExternalImpl.ArrayBufferToString = data => new TextDecoder().decode(data);
ExternalImpl.StringToArrayBuffer = data => new TextEncoder().encode(data);

XRSetup();
bjsImpl.setup(RTDefaultBizLogger);

export type ILoadOpt = {
  container: string | HTMLElement;
  mfs: { url: string; indexKey: string } | MemoryFS;
  extra?: any;
};

export async function loadXRRuntime(opt: ILoadOpt) {
  // 清空 https://reactjs.org/docs/react-dom.html
  const container = typeof opt.container === 'string' ? document.getElementById(opt.container) : opt.container;
  if (!container) throw new Error('container not found: ' + opt.container);

  container.innerHTML = '';

  const mfs = (opt.mfs as MemoryFS).readFile
    ? (opt.mfs as MemoryFS)
    : await MemoryFS.create(() =>
        NetworkAdapter.create((opt.mfs as any).url, url => fetch(url).then(rsp => rsp.arrayBuffer()), {
          rewrite: (url, path, baseURL) => {
            // rewrite 目录索引
            if (path === FILE_INDEX_BLOCK_ID) return NetworkAdapter.joinURL(baseURL, (opt.mfs as any).indexKey);
            return url;
          },
        })
      );

  const canvas = bjsImpl.createViewerCanvas();
  container.appendChild(canvas);

  const rt = new XRRuntime(mfs, { ...opt.extra, engine: { canvas, ...opt.extra?.engine } });
  await rt.reload();

  return rt;
}
