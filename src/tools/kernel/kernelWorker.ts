/// <reference lib="webworker" />
import { applyKernelRaw, type EdgeMode } from './applyKernel';

interface WorkerInput {
  buffer: ArrayBuffer;
  width: number;
  height: number;
  kernel: number[];
  divisor: number;
  offset: number;
  channels: boolean[];
  edge: EdgeMode;
  absolute?: boolean;
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { buffer, width, height, kernel, divisor, offset, channels, edge, absolute } = e.data;
  const data = new Uint8ClampedArray(buffer);
  const result = applyKernelRaw(data, width, height, kernel, divisor, offset, channels, edge, absolute);
  self.postMessage({ buffer: result.buffer }, [result.buffer]);
};
