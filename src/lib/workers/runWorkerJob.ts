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
  worker: Worker,
  request: TRequest,
  handlers: WorkerJobHandlers<TResult>,
): void {
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
    } else if (message.type === 'error') {
      handlers.onError(message.message, false);
      worker.terminate();
    }
  };

  worker.postMessage(request);
}
