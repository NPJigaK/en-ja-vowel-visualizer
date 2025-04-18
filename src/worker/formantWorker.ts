// ① glue JS は ESM なので普通に import
import initWasm, * as wasm from '../wasm/vowel_visualizer.js';
import wasmUrl from '../wasm/vowel_visualizer_bg.wasm?url';

const SAMPLE_RATE = 48_000;
// await initWasm('../wasm/vowel_visualizer_bg.wasm');
await initWasm({ module_or_path: wasmUrl });

self.onmessage = ({ data }: MessageEvent<Float32Array>) => {
  const { f1, f2 } = wasm.formant(data, SAMPLE_RATE);
  if (f1 || f2) postMessage({ f1, f2 });
};
