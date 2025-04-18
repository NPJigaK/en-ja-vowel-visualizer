const LEFT_SHEAR = Math.tan(25 * Math.PI / 180); // 左辺 25°
const TOP = 40, BOTTOM = 40, PAD = 60;

const F1_MIN = 250, F1_MAX = 900;
const F2_MIN = 700, F2_MAX = 2500;

/** F1‑F2 → キャンバス座標（台形） */
export function toScreen(f1: number, f2: number, W = 640, H = 480) {
  // 1. 矩形へ線形写像（F2 高いほど右へ）
  const rx = PAD + (W - PAD * 2) * (F2_MAX - f2) / (F2_MAX - F2_MIN);
  const ry = TOP + (H - TOP - BOTTOM) * (f1 - F1_MIN) / (F1_MAX - F1_MIN);
  // 2. y に応じて x をシアー
  const sx = rx - LEFT_SHEAR * (ry - TOP);
  return { x: sx, y: ry };
}

/** 背景チャート + 基準母音を描画 */
export function drawChart(ctx: CanvasRenderingContext2D) {
  const { canvas } = ctx;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 台形枠
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
  ctx.beginPath();
  const TL = toScreen(F1_MIN, F2_MIN);
  const TR = toScreen(F1_MIN, F2_MAX);
  const BR = toScreen(F1_MAX, F2_MAX);
  const BL = toScreen(F1_MAX, F2_MIN);
  ctx.moveTo(TL.x, TL.y); ctx.lineTo(TR.x, TR.y);
  ctx.lineTo(BR.x, BR.y); ctx.lineTo(BL.x, BL.y);
  ctx.closePath(); ctx.stroke();

  // 横ガイド 2 本
  const mid = (F1_MIN + F1_MAX) / 2;
  const q1 = F1_MIN + (F1_MAX - F1_MIN) / 3;
  [mid, q1].forEach(f1 => {
    const L = toScreen(f1, F2_MIN);
    const R = toScreen(f1, F2_MAX);
    ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.lineTo(R.x, R.y); ctx.stroke();
  });

  // 参照母音データ
  type V = { f1: number; f2: number; label: string; color: string };
  const v: V[] = [
    // 日本語 5 母音
    { f1: 400, f2: 1800, label: 'a', color: 'red' },
    { f1: 300, f2: 2200, label: 'i', color: 'red' },
    { f1: 360, f2: 600, label: 'u', color: 'red' },
    { f1: 500, f2: 2100, label: 'e', color: 'red' },
    { f1: 430, f2: 820, label: 'o', color: 'red' },
    // 英語例
    { f1: 700, f2: 1720, label: 'æ', color: 'blue' },
    { f1: 780, f2: 1100, label: 'ɑ', color: 'blue' },
    { f1: 640, f2: 1200, label: 'ʌ', color: 'blue' },
    { f1: 500, f2: 1500, label: 'ə', color: 'blue' },
    { f1: 270, f2: 2290, label: 'iː', color: 'blue' },
    { f1: 400, f2: 1980, label: 'ɪ', color: 'blue' },
    { f1: 300, f2: 870, label: 'uː', color: 'blue' },
    { f1: 440, f2: 1020, label: 'ʊ', color: 'blue' },
    { f1: 500, f2: 1700, label: 'e', color: 'blue' },
    { f1: 500, f2: 1300, label: 'ɚ', color: 'blue' },
    { f1: 500, f2: 940, label: 'ɔ', color: 'blue' }
  ];

  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  v.forEach(p => {
    const { x, y } = toScreen(p.f1, p.f2);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillText(p.label, x, y - 14);
  });
}
