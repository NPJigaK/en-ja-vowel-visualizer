import { drawChart, toScreen } from './chart';
const canvas = document.getElementById('chart') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
drawChart(ctx);

const audioCtx = new AudioContext({ sampleRate: 48_000 });

// ① Worker 起動
const worker = new Worker(new URL('./worker/formantWorker.ts', import.meta.url), { type: 'module' });
worker.onmessage = ({ data }: MessageEvent<{f1:number,f2:number}>) => {
  drawChart(ctx);
  const { x, y } = toScreen(data.f1, data.f2);
  ctx.fillStyle = 'lime';
  ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI*2); ctx.fill();
};

// ② Worklet登録 → Node生成
await audioCtx.audioWorklet.addModule('/src/worklet/audio-capture.js');
const node = new AudioWorkletNode(audioCtx, 'capture-processor');

// Worklet → Worker にチャンクを転送
node.port.onmessage = ({ data }: MessageEvent<Float32Array>) => worker.postMessage(data, [data.buffer]);

// ③ マイク開始ボタン
document.getElementById('startBtn')!.onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioCtx.createMediaStreamSource(stream).connect(node);
  node.connect(audioCtx.destination);
};
