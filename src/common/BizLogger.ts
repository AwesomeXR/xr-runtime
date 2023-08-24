import { IBaseAppender, ILoggerLevel, Logger, ConsoleAppender } from 'ah-logger';

export class BizLogger extends Logger {
  constructor(readonly name: string) {
    super(name, [new ConsoleAppender(), new SLSAppender(name)]);
  }
}

export class SLSAppender implements IBaseAppender {
  constructor(private name: string) {}

  private sendRaw(data: Record<string, string | number>): void {
    const uploadData = { ...data, APIVersion: '0.6.0' };

    const img = document.createElement('img');
    const query = new URLSearchParams(uploadData).toString();
    img.src = `https://zdclient.cn-hangzhou.log.aliyuncs.com/logstores/arsdk/track_ua.gif?${query}`;
  }

  private send(namespace: string, type: string, label: string, value: string | number) {
    return this.sendRaw({ namespace, type, label, value });
  }

  append(level: ILoggerLevel, fmt: string, ...args: any): void {
    if (level === ILoggerLevel.ERROR) {
      this.send(this.name, 'error', 'msg', fmt + ':' + args.join(','));
    }
  }
}

export const DefaultBizLogger = new BizLogger('XR.RT');
