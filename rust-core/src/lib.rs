use wasm_bindgen::prelude::*;
use num_complex::Complex32;
use std::cmp::Ordering;

#[wasm_bindgen]
pub struct Formant {
    #[wasm_bindgen(getter)] pub f1: f32,
    #[wasm_bindgen(getter)] pub f2: f32,
}

#[wasm_bindgen]
pub fn formant(buffer: &[f32], sample_rate: u32) -> Formant {
    // ─── 0. 無音判定 ───
    let energy: f32 = buffer.iter().map(|s| s * s).sum();
    if energy < 1e-7 {
        return Formant { f1: 0.0, f2: 0.0 };
    }

    // ─── 1. プリエンファシス ───
    let mut pre = Vec::with_capacity(buffer.len());
    let mut prev = 0.0;
    for &s in buffer {
        pre.push(s - 0.97 * prev);
        prev = s;
    }

    // ─── 2. Levinson–Durbin ───
    let order = 16;
    let (a, _err) = levinson(&pre, order);

    // ─── 3. 極 → フォルマント ───
    let mut f: Vec<f32> = poly_roots(&a)
        .into_iter()
        .filter(|c| c.im > 0.0)
        .map(|c| (c.arg() * sample_rate as f32) / (2.0 * std::f32::consts::PI))
        .filter(|f| *f > 90.0 && *f < 3500.0 && f.is_finite())
        .collect();

    f.sort_by(|a, b| match (a.is_nan(), b.is_nan()) {
        (false, false) => a.partial_cmp(b).unwrap_or(Ordering::Equal),
        (true,  false) => Ordering::Greater,
        (false, true ) => Ordering::Less,
        (true,  true ) => Ordering::Equal,
    });

    Formant {
        f1: *f.get(0).unwrap_or(&0.0),
        f2: *f.get(1).unwrap_or(&0.0),
    }
}

// ---------- DSP ヘルパ ----------

fn levinson(x: &[f32], p: usize) -> (Vec<f32>, f32) {
    let mut r = vec![0.0f32; p + 1];
    for i in 0..=p {
        for j in 0..x.len() - i {
            r[i] += x[j] * x[j + i];
        }
        r[i] /= x.len() as f32;
    }

    let mut a = vec![0.0f32; p + 1]; a[0] = 1.0;
    let mut e = r[0];

    for k in 1..=p {
        let mut lambda = 0.0;
        for j in 0..k {
            lambda += a[j] * r[k - j];
        }
        lambda /= e;

        let mut a_new = a.clone();
        a_new[k] = -lambda;
        for j in 1..k {
            a_new[j] -= lambda * a[k - j];
        }
        a = a_new;
        e *= 1.0 - lambda * lambda;
    }
    (a, e)
}

fn poly_roots(a: &[f32]) -> Vec<Complex32> {
    let n = a.len() - 1;
    let mut roots: Vec<Complex32> = (0..n).map(|k| {
        let theta = 2.0 * std::f32::consts::PI * (k as f32) / (n as f32);
        Complex32::from_polar(1.0, theta)
    }).collect();

    for _ in 0..60 {
        for i in 0..n {
            let r_i = roots[i];                 // ← コピーして借用競合を解消
            let mut denom = Complex32::new(1.0, 0.0);
            for j in 0..n {
                if i != j { denom *= r_i - roots[j]; }
            }
            roots[i] = r_i - eval_poly(a, r_i) / denom;
        }
    }
    roots
}

fn eval_poly(a: &[f32], z: Complex32) -> Complex32 {
    let mut acc = Complex32::new(0.0, 0.0);
    for &coef in a.iter().rev() {
        acc = acc * z + Complex32::new(coef, 0.0);
    }
    acc
}
