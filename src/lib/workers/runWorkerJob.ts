export type WorkerJobMessage<TResult> =
  | { type: 'progress'; percent: number }
  | { type: 'done'; result: TResult }
  | { type: 'error'; message: string };

export interface WorkerJobHandlers<TResult> {
  onProgress: (percent: number) => void;
  onDone: (result: TResult) => void;
  onError: (message: string, workerLoadFailed: boolean) => void;
}

export function runWorkerJob<TRequest, TResult>(
  workerUrl: URL,
  request: TRequest,
  handlers: WorkerJobHandlers<TResult>,
): void {
  const worker = new Worker(workerUrl, { type: 'module' });

  worker.onerror = () => {
    handlers.onError('', true);
    worker.terminate();
  };

  worker.onmessage = (event: MessageEvent<WorkerJobMessage<TResult>>) => {
    const message = event.data;
    if (message.type === 'progress') {
      handlers.onProgress(message.percent);
    } else if (message.type === 'done') {
      handlers.onDone(message.result);
      worker.terminate();
    } else {
      handlers.onError(message.message, false);
      worker.terminate();
    }
  };

  worker.postMessage(request);
}
