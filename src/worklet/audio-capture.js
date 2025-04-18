class CaptureProcessor extends AudioWorkletProcessor {
    constructor() { super(); this.buf = new Float32Array(960); this.off = 0; }
  
    process(inputs) {
      const input = inputs[0][0];
      if (!input) return true;
      for (let i = 0; i < input.length; i++) {
        this.buf[this.off++] = input[i];
        if (this.off === this.buf.length) {
          // 転送可能オブジェクトでゼロコピー
          const chunk = this.buf.slice();
          this.port.postMessage(chunk, [chunk.buffer]);
          this.off = 0;
        }
      }
      return true;
    }
  }
  registerProcessor('capture-processor', CaptureProcessor);
  