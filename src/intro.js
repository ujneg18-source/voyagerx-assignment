// 온보딩: 별이 떠 있는 우주 → 별똥별 → VOYAGERx → next astronaut → 과제 확인하기 → 워프
import { $ } from './util.js';
import { go, ids } from './router.js';

const root = $('#onboard');
const cv = $('#stars');
const cx = cv.getContext('2d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

let W, H, DPR, stars = [], raf = null, timers = [], t0 = 0, phase = 'idle';
let comet = null, warp = null;

/* ---------- 별 ---------- */
function makeStars() {
  const n = Math.round((W * H) / 1050);
  stars = Array.from({ length: n }, () => {
    const bright = Math.random() < 0.016;
    return {
      x: Math.random() * W, y: Math.random() * H,
      r: bright ? 1.3 + Math.random() * 0.9 : Math.random() < 0.85 ? 0.35 + Math.random() * 0.55 : 0.9 + Math.random() * 0.5,
      a: bright ? 0.95 : 0.25 + Math.random() * 0.6,
      tw: Math.random() * 6.28, sp: 0.8 + Math.random() * 2.4, z: 0.2 + Math.random() * 0.8,
      blue: Math.random() < (bright ? 0.7 : 0.18), bright,
    };
  });
}
function drawStar(s, t) {
  const a = s.a * (0.55 + 0.45 * Math.sin(t * 0.0012 * s.sp + s.tw));
  const col = s.blue ? '190,220,255' : '255,255,255';
  if (s.bright) {
    const g = cx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 9);
    g.addColorStop(0, `rgba(${col},${0.32 * a})`); g.addColorStop(1, 'rgba(120,170,255,0)');
    cx.fillStyle = g; cx.beginPath(); cx.arc(s.x, s.y, s.r * 9, 0, 6.283); cx.fill();
    cx.strokeStyle = `rgba(${col},${0.35 * a})`; cx.lineWidth = 0.6;
    const L = s.r * 7;
    cx.beginPath(); cx.moveTo(s.x - L, s.y); cx.lineTo(s.x + L, s.y); cx.moveTo(s.x, s.y - L); cx.lineTo(s.x, s.y + L); cx.stroke();
  }
  cx.fillStyle = `rgba(${col},${a})`;
  cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, 6.283); cx.fill();
}

/* ---------- 별똥별 ---------- */
// 직선 궤적 + 테이퍼드 꼬리 + 흩날리는 불티 + 은은한 머리 빛
const easeInOut = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
let sparks = [];
function startComet(now) {
  const m = Math.min(W, H);
  comet = {
    t: now, dur: 1700, hist: [],
    p0: [W * 0.92, H * 0.04], p1: [W * 0.61, H * 0.23], p2: [W * 0.30, H * 0.42],   // 직선(가운데 점이 중점)
    w: Math.max(3.5, m * 0.0065),
  };
  sparks = [];
}
function bez(c, u) {
  const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, d = u * u;
  return [a * c.p0[0] + b * c.p1[0] + d * c.p2[0], a * c.p0[1] + b * c.p1[1] + d * c.p2[1]];
}
function drawComet(now) {
  if (!comet && !sparks.length) return;
  cx.save();
  cx.globalCompositeOperation = 'lighter';
  // 불티
  sparks = sparks.filter((s) => now - s.t < s.life);
  for (const s of sparks) {
    const k = 1 - (now - s.t) / s.life;
    s.x += s.vx; s.y += s.vy; s.vy += 0.004;
    cx.fillStyle = `rgba(${s.c},${0.85 * k})`;
    cx.beginPath(); cx.arc(s.x, s.y, s.r * (0.4 + 0.6 * k), 0, 6.283); cx.fill();
  }
  if (comet) {
    const el = now - comet.t;
    const p = Math.min(1, el / comet.dur);
    const fade = p < 1 ? 1 : Math.max(0, 1 - (el - comet.dur) / 600);
    if (fade <= 0) { comet = null; cx.restore(); return; }
    const u = easeInOut(p);
    const [hx, hy] = bez(comet, u);
    // 꼬리 경로: 곡선 위를 촘촘히 다시 샘플링(매끈하게)
    const span = 0.42 * Math.min(1, u / 0.42) * (p < 1 ? 1 : fade);
    comet.hist = [];
    for (let i = 0; i <= 48; i++) comet.hist.push(bez(comet, Math.max(0, u - span) + (span * i) / 48));
    const H_ = comet.hist;
    // 꼬리: 테이퍼드 리본(머리 쪽 굵고 밝게 → 끝은 가늘고 투명하게), 3겹으로 빛 번짐
    if (H_.length > 2) {
      const head = H_[H_.length - 1], tailEnd = H_[0];
      const ribbon = (wMax, stops) => {
        const L = [], R = [];
        for (let i = 0; i < H_.length; i++) {
          const a = H_[Math.max(0, i - 1)], b = H_[Math.min(H_.length - 1, i + 1)];
          let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const n = Math.hypot(nx, ny) || 1; nx /= n; ny /= n;
          const tt = i / (H_.length - 1); const k = Math.pow(tt, 1.8) * Math.min(1, (1 - tt) * 14 + 0.25) * wMax;
          L.push([H_[i][0] + nx * k, H_[i][1] + ny * k]); R.push([H_[i][0] - nx * k, H_[i][1] - ny * k]);
        }
        const g = cx.createLinearGradient(head[0], head[1], tailEnd[0], tailEnd[1]);
        stops.forEach(([o, c]) => g.addColorStop(o, c));
        cx.fillStyle = g; cx.beginPath(); cx.moveTo(L[0][0], L[0][1]);
        for (const q of L) cx.lineTo(q[0], q[1]);
        for (let i = R.length - 1; i >= 0; i--) cx.lineTo(R[i][0], R[i][1]);
        cx.closePath(); cx.fill();
      };
      ribbon(comet.w * 3.0, [[0, `rgba(110,165,255,${0.12 * fade})`], [0.5, `rgba(90,140,240,${0.04 * fade})`], [1, 'rgba(80,130,230,0)']]);
      ribbon(comet.w * 1.6, [[0, `rgba(170,210,255,${0.4 * fade})`], [0.6, `rgba(130,180,255,${0.15 * fade})`], [1, 'rgba(120,170,255,0)']]);
      ribbon(comet.w * 0.75, [[0, `rgba(255,255,255,${0.95 * fade})`], [0.4, `rgba(220,236,255,${0.45 * fade})`], [1, 'rgba(200,225,255,0)']]);
    }
    // 불티 생성
    if (p < 1) for (let i = 0; i < 3; i++) {
      const blue = Math.random() < 0.55;
      sparks.push({ x: hx + (Math.random() - 0.5) * 6, y: hy + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 0.7, vy: (Math.random() - 0.3) * 0.6,
        r: 0.6 + Math.random() * 1.4, t: now, life: 600 + Math.random() * 900,
        c: blue ? '170,210,255' : '255,250,240' });
    }
    // 머리: 넓은 후광 + 코어 + 가로 빛살
    const R = comet.w * 5.5 * fade;
    let g = cx.createRadialGradient(hx, hy, 0, hx, hy, R);
    g.addColorStop(0, `rgba(210,230,255,${0.4 * fade})`); g.addColorStop(0.35, `rgba(120,170,255,${0.1 * fade})`); g.addColorStop(1, 'rgba(80,130,255,0)');
    cx.fillStyle = g; cx.beginPath(); cx.arc(hx, hy, R, 0, 6.283); cx.fill();
    g = cx.createRadialGradient(hx, hy, 0, hx, hy, comet.w * 1.8);
    g.addColorStop(0, `rgba(255,255,255,${fade})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    cx.fillStyle = g; cx.beginPath(); cx.arc(hx, hy, comet.w * 1.8, 0, 6.283); cx.fill();
    const fl = comet.w * 8 * fade;
    g = cx.createLinearGradient(hx - fl, hy, hx + fl, hy);
    g.addColorStop(0, 'rgba(160,200,255,0)'); g.addColorStop(0.5, `rgba(220,235,255,${0.3 * fade})`); g.addColorStop(1, 'rgba(160,200,255,0)');
    cx.fillStyle = g; cx.fillRect(hx - fl, hy - 0.7, fl * 2, 1.4);
  }
  cx.restore();
}

/* ---------- 워프 ---------- */
function startWarp(now) {
  warp = { t: now };
  const cxp = W / 2, cyp = H / 2;
  stars.forEach((s) => { s.ang = Math.atan2(s.y - cyp, s.x - cxp); s.d = Math.hypot(s.x - cxp, s.y - cyp); });
}
function drawWarp(now) {
  const k = (now - warp.t) / 1000;               // 초
  const speed = 1.2 + k * k * 22;                  // 점점 빨라짐
  const cxp = W / 2, cyp = H / 2, max = Math.hypot(W, H) / 2;
  cx.lineCap = 'round';
  for (const s of stars) {
    const prev = s.d;
    s.d += (s.d * 0.012 + 0.6) * speed;
    if (s.d > max) { s.d = 4 + Math.random() * 40; continue; }
    const x1 = cxp + Math.cos(s.ang) * prev, y1 = cyp + Math.sin(s.ang) * prev;
    const x2 = cxp + Math.cos(s.ang) * s.d, y2 = cyp + Math.sin(s.ang) * s.d;
    const col = s.blue ? '190,220,255' : '255,255,255';
    cx.strokeStyle = `rgba(${col},${Math.min(1, s.a + 0.2)})`;
    cx.lineWidth = s.r * (1 + s.d / max);
    cx.beginPath(); cx.moveTo(x1, y1); cx.lineTo(x2, y2); cx.stroke();
  }
}

/* ---------- 루프 ---------- */
function frame(now) {
  if (phase === 'warp') {
    cx.fillStyle = 'rgba(6,10,16,0.35)'; cx.fillRect(0, 0, W, H);   // 잔상
    drawWarp(now);
  } else {
    cx.clearRect(0, 0, W, H);
    const fadeIn = Math.min(1, (now - t0) / 900);
    cx.globalAlpha = fadeIn;
    for (const s of stars) {
      s.x -= 0.06 * s.z; s.y += 0.025 * s.z;
      if (s.x < -10) s.x = W + 10; if (s.y > H + 10) s.y = -10;
      drawStar(s, now);
    }
    cx.globalAlpha = 1;
    drawComet(now);
  }
  raf = requestAnimationFrame(frame);
}
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = cv.clientWidth; H = cv.clientHeight;
  cv.width = W * DPR; cv.height = H * DPR; cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (phase !== 'warp') makeStars();
}

/* ---------- 시퀀스 ---------- */
const at = (ms, fn) => timers.push(setTimeout(fn, ms));
function setStage(...cls) { root.classList.add(...cls); }
function showAll() { timers.forEach(clearTimeout); timers = []; setStage('s-logo', 's-sub', 's-btn'); }

export function startIntro() {
  stopIntro();
  root.className = ''; $('#fade').style.opacity = 0;
  phase = 'space'; comet = null; warp = null;
  resize(); t0 = performance.now();
  raf = requestAnimationFrame(frame);
  if (reduce) { showAll(); return; }
  at(700, () => startComet(performance.now()));
  at(2550, () => setStage('s-logo'));
  at(3400, () => setStage('s-sub'));
  at(4600, () => { setStage('s-btn'); $('#obGo').focus({ preventScroll: true }); });
}
export function stopIntro() {
  if (raf) cancelAnimationFrame(raf);
  raf = null; timers.forEach(clearTimeout); timers = []; phase = 'idle';
}
export function leave() {
  if (!root.classList.contains('s-btn')) { showAll(); return; }   // 연출 중이면 건너뛰기
  go(ids[0]);
}

// next astronaut 글자 단위로 나누기
const sub = $('.ob-sub');
sub.innerHTML = [...sub.textContent].map((ch, i) =>
  `<span style="transition-delay:${i * 55}ms">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');

$('#obGo').addEventListener('click', leave);
$('.ob-skip').addEventListener('click', showAll);
window.addEventListener('resize', () => { if (raf) resize(); });
