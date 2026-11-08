// Q2 데모: 현행(네이버 재현) · 입력 마스크 · 날짜 범위 선택기
import { $ } from './util.js';
import { selectDatePart, validDateRange, dateHeading } from './date-range.js';

const TODAY = { y: 2026, m: 11, d: 8 };
const MIN_Y = 1990;
const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => (d ? `${d.y}.${pad(d.m)}.${pad(d.d)}` : '');
const dim = (y, m) => new Date(y, m, 0).getDate();
const key = (d) => d.y * 10000 + d.m * 100 + d.d;
const isFuture = (d) => key(d) > key(TODAY);
const CAL = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="2.5" width="13" height="12" rx="1.5" fill="none" stroke="currentColor"/><path d="M1.5 6h13M5 1v3M11 1v3" stroke="currentColor"/><g fill="currentColor"><rect x="4" y="8" width="1.6" height="1.4"/><rect x="7.2" y="8" width="1.6" height="1.4"/><rect x="10.4" y="8" width="1.6" height="1.4"/><rect x="4" y="11" width="1.6" height="1.4"/><rect x="7.2" y="11" width="1.6" height="1.4"/></g></svg>';

/* ---------- 현행: 네이버 뉴스 기간 필터 재현 ---------- */
// 칩은 누르면 바로 바뀜 · '1시간'은 시간 목록이 펼쳐짐 · '직접입력'은 년·월·일 스크롤 리스트
(function () {
  const root = $('#demoNv'); if (!root) return;
  const bar = root.querySelector('.nv-bar'), panel = root.querySelector('.nv-panel'), hours = root.querySelector('.nv-hours');
  const CHIPS = [['전체', 0], ['1시간', 0], ['1일', 1], ['1주', 7], ['1개월', '1m'], ['3개월', '3m'], ['6개월', '6m'], ['1년', '1y']];
  const CHEV = (up) => `<svg class="chev" width="11" height="7" viewBox="0 0 11 7" aria-hidden="true"><path d="${up ? 'M1 6l4.5-4.5L10 6' : 'M1 1l4.5 4.5L10 1'}" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>`;
  let S = { ...TODAY }, E = { ...TODAY }, k = 's', sel = 0, open = 'di', hourN = 1;   // 처음에는 직접입력을 펼쳐 둠
  const ROW = 32, VIEW = 150;

  function back(spec) {
    const d = new Date(TODAY.y, TODAY.m - 1, TODAY.d);
    if (typeof spec === 'number') d.setDate(d.getDate() - spec);
    else { const n = parseInt(spec, 10); spec.endsWith('y') ? d.setFullYear(d.getFullYear() - n) : d.setMonth(d.getMonth() - n); }
    return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
  }
  function drawBar() {
    bar.innerHTML = '<span class="lab">기간</span>' + CHIPS.map(([t], i) => {
      if (i === 1) return `<button class="nv-chip${sel === 1 ? ' on' : ''}${open === 'h' ? ' open' : ''}" data-i="1">${hourN}시간 ${CHEV(open === 'h')}</button>`;
      return `<button class="nv-chip${sel === i ? ' on' : ''}" data-i="${i}">${t}</button>`;
    }).join('') + `<button class="nv-chip di${sel === 'di' ? ' on' : ''}${open === 'di' ? ' open' : ''}">직접입력 ${CHEV(open === 'di')}</button>`;
    panel.classList.toggle('open', open === 'di');
    hours.classList.toggle('open', open === 'h');
  }
  function drawHours() {
    hours.innerHTML = Array.from({ length: 23 }, (_, i) => `<div class="nv-hrow${sel === 1 && hourN === i + 1 ? ' sel' : ''}" data-h="${i + 1}">${i + 1}시간</div>`).join('');
  }
  const cur = () => (k === 's' ? S : E);
  function clamp(d) { if (d.d > dim(d.y, d.m)) d.d = dim(d.y, d.m); if (isFuture(d)) Object.assign(d, TODAY); }
  function drawFields() {
    root.querySelectorAll('.nv-field').forEach((f) => {
      f.classList.toggle('on', f.dataset.k === k);
      f.innerHTML = CAL + `<span>${fmt(f.dataset.k === 's' ? S : E)}.</span>`;
    });
  }
  function drawCols(scroll) {
    const c = cur(); clamp(c);
    const L = { y: [], m: [], d: [] };
    for (let y = MIN_Y; y <= TODAY.y; y++) L.y.push([y, false]);
    for (let m = 1; m <= 12; m++) L.m.push([m, c.y === TODAY.y && m > TODAY.m]);
    for (let d = 1; d <= dim(c.y, c.m); d++) L.d.push([d, isFuture({ y: c.y, m: c.m, d })]);
    root.querySelectorAll('.nv-list').forEach((el) => {
      const u = el.dataset.u, top = el.scrollTop;
      el.innerHTML = L[u].map(([v, off]) => `<div class="nv-row${c[u] === v ? ' sel' : ''}${off ? ' off' : ''}" data-v="${v}">${v}</div>`).join('');
      el.scrollTop = scroll ? Math.max(0, L[u].findIndex(([v]) => v === c[u]) * ROW - ((el.clientHeight || VIEW) - ROW)) : top;
    });
    drawFields();
  }
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('.nv-chip'); if (!b) return;
    if (b.classList.contains('di')) { open = open === 'di' ? null : 'di'; if (open) { k = 's'; drawBar(); drawCols(true); } else drawBar(); return; }
    const i = +b.dataset.i;
    if (i === 1) { open = open === 'h' ? null : 'h'; drawHours(); drawBar(); return; }
    sel = i; open = open === 'di' ? 'di' : null;
    const spec = CHIPS[i][1]; E = { ...TODAY }; S = spec ? back(spec) : { ...TODAY };
    drawBar(); if (open === 'di') drawCols(true);
  });
  hours.addEventListener('click', (e) => {
    const r = e.target.closest('.nv-hrow'); if (!r) return;
    hourN = +r.dataset.h; sel = 1; open = null; S = { ...TODAY }; E = { ...TODAY }; drawBar();
  });
  root.querySelectorAll('.nv-list').forEach((el) => el.addEventListener('click', (e) => {
    const r = e.target.closest('.nv-row'); if (!r || r.classList.contains('off')) return;
    cur()[el.dataset.u] = +r.dataset.v; drawCols(false);
  }));
  root.querySelectorAll('.nv-field').forEach((f) => (f.onclick = () => { k = f.dataset.k; drawCols(true); }));
  root.querySelector('.nv-apply').onclick = () => { if (key(S) > key(E)) [S, E] = [E, S]; sel = 'di'; open = null; drawBar(); };
  drawBar(); drawCols(true);

  // Both frames use one measured height, even when the date panel is closed.
  const row = root.closest('.q2-use-row');
  function syncHeight() {
    if (!row || !root.offsetParent) return;
    row.style.removeProperty('--q2-demo-height');
    const panelOpen = panel.classList.contains('open');
    const hoursOpen = hours.classList.contains('open');
    panel.classList.add('open'); hours.classList.remove('open');
    const height = Math.ceil(root.getBoundingClientRect().height);
    panel.classList.toggle('open', panelOpen);
    hours.classList.toggle('open', hoursOpen);
    row.style.setProperty('--q2-demo-height', `${height}px`);
  }
  window.addEventListener('resize', syncHeight);
  new MutationObserver(() => {
    syncHeight();
    if (root.offsetParent && open === 'di') drawCols(true);
  }).observe(root.closest('.page'), { attributes: true, attributeFilter: ['class'] });
  requestAnimationFrame(syncHeight);
  document.fonts?.ready.then(syncHeight);
})();

/* ---------- 개선안 ①: 입력 마스크 ---------- */
(function () {
  const root = $('#demoMi'); if (!root) return;
  const ins = [...root.querySelectorAll('input')], btn = root.querySelector('.btn'), hint = root.querySelector('.hint'), res = root.querySelector('.result');
  const HINT = hint.textContent;
  const parse = (v) => { const m = v.match(/^(\d{4})\.(\d{2})\.(\d{2})$/); return m ? { y: +m[1], m: +m[2], d: +m[3] } : null; };
  const valid = (v) => { const d = parse(v); return !!d && d.y >= MIN_Y && d.m >= 1 && d.m <= 12 && d.d >= 1 && d.d <= dim(d.y, d.m) && !isFuture(d); };
  function check() {
    let err = '';
    ins.forEach((i) => {
      const bad = i.value.length === 10 && !valid(i.value); i.classList.toggle('bad', bad);
      if (bad) { const d = parse(i.value); err = d && isFuture(d) ? '미래 날짜는 고를 수 없어요.' : d && d.y < MIN_Y ? `${MIN_Y}년 이후 날짜만 검색할 수 있어요.` : '없는 날짜예요. 월은 01~12, 일은 그 달의 마지막 날까지예요.'; }
    });
    if (!err && valid(ins[0].value) && valid(ins[1].value) && ins[0].value > ins[1].value) err = '종료일이 시작일보다 앞서 있어요.';
    hint.textContent = err || HINT; hint.classList.toggle('err', !!err);
    btn.disabled = !!err || !ins.every((i) => valid(i.value));
  }
  ins.forEach((i, n) => {
    i.addEventListener('input', () => {
      const d = i.value.replace(/\D/g, '').slice(0, 8);
      let v = d.slice(0, 4); if (d.length > 4) v += '.' + d.slice(4, 6); if (d.length > 6) v += '.' + d.slice(6, 8);
      i.value = v; if (n === 0 && d.length === 8 && valid(v)) ins[1].focus(); res.textContent = ''; check();
    });
    i.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !btn.disabled) btn.click(); });
  });
  btn.onclick = () => { res.className = 'result ok'; res.textContent = `${ins[0].value} ~ ${ins[1].value} 기간으로 검색해요`; };
  check();
})();

/* ---------- 개선안 ②: 시작일·종료일 달력 ---------- */
(function () {
  const root = $('#demoRp'); if (!root) return;
  const calendars = root.querySelector('.dual-calendars'), summary = root.querySelector('.dual-summary'), btn = root.querySelector('.tbtn'), res = root.querySelector('.result');
  const modal=root.querySelector('.dual-modal'), trigger=root.querySelector('.rp-trigger'), value=root.querySelector('.rp-val');
  trigger.onclick=()=>{views=['y','y'];draw();modal.showModal();};
  root.querySelector('.rp-close').onclick=()=>modal.close();
  modal.addEventListener('close',()=>trigger.focus());
  modal.addEventListener('click',e=>{if(e.target!==modal)return;const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close();});
  let dates = [null, null];
  let cursors = [{...TODAY}, {...TODAY}];
  let views = ['y','y'];
  function draw() {
    calendars.innerHTML = cursors.map((c, i) => {
      const date = dates[i];
      const view=views[i], decade=Math.floor(c.y/10)*10;
      let h = `<section class="dual-calendar" data-side="${i}"><h3>검색 ${i ? '종료일' : '시작일'}</h3><div class="dual-date">${dateHeading(date)}</div><div class="seg">${[['y','연도'],['m','월'],['d','일']].map(([v,label])=>`<button data-view="${v}" class="${v===view?'on':''}">${label}</button>`).join('')}<span class="seg-pill" style="transform:translateX(${['y','m','d'].indexOf(view)*100}%)"></span></div>`;
      h += `<div class="rp-head"><button class="arr" data-shift="-1" aria-label="이전">‹</button><span class="ttl">${view==='y'?decade+'년대':c.y+'년'+(view==='d'?' '+c.m+'월':'')}</span><button class="arr" data-shift="1" aria-label="다음">›</button></div>`;
      if(view==='y') {
        h+='<div class="rp-decs">'+[1990,2000,2010,2020].map(y=>`<button class="rp-dec${y===decade?' on':''}" data-decade="${y}">${String(y).slice(2)}s</button>`).join('')+'</div><div class="rp-grid ym y5">';
        for(let y=decade;y<decade+10;y++)h+=`<button class="rp-cell${y===date?.y?' edge':''}" data-year="${y}" ${y<MIN_Y||y>TODAY.y?'disabled':''}>${y}</button>`;
        return h+'</div></section>';
      }
      if(view==='m') {
        h+='<div class="rp-grid ym">';
        for(let m=1;m<=12;m++)h+=`<button class="rp-cell${c.y===date?.y&&m===date?.m?' edge':''}" data-month="${m}" ${c.y===TODAY.y&&m>TODAY.m?'disabled':''}>${m}월</button>`;
        return h+'</div></section>';
      }
      h += '<div class="rp-grid d">' + '일월화수목금토'.split('').map(w=>`<span class="wd">${w}</span>`).join('');
      for(let n=0;n<new Date(c.y,c.m-1,1).getDay();n++) h += '<span></span>';
      for(let d=1;d<=dim(c.y,c.m);d++) {
        const o={y:c.y,m:c.m,d}, k=key(o), off=isFuture(o)||(i===1&&dates[0]&&k<key(dates[0]));
        const edge=dates.some(v=>v&&key(v)===k), inside=dates[0]&&dates[1]&&k>key(dates[0])&&k<key(dates[1]);
        h += `<button class="rp-cell${edge?' edge':inside?' in':''}" data-day="${d}" aria-label="${fmt(o)}" ${off?'disabled':''}>${d}</button>`;
      }
      return h+'</div></section>';
    }).join('');
    summary.textContent=dates[0]||dates[1]?`${dates[0]?fmt(dates[0]):'시작일 선택'} ~ ${dates[1]?fmt(dates[1]):'종료일 선택'}`:'기간을 선택해 주세요';
    if(dates.every(Boolean)&&!validDateRange(dates)) summary.textContent+=' · 종료일이 시작일보다 앞서 있어요';
    btn.disabled=!validDateRange(dates);
  }
  calendars.addEventListener('click',e=>{
    const target=e.target.closest('button'), panel=target?.closest('[data-side]');if(!panel||target.disabled)return;
    const side=+panel.dataset.side,c=cursors[side];
    if(target.dataset.view){views[side]=target.dataset.view;draw();return;}
    if(target.dataset.decade){c.y=+target.dataset.decade;draw();return;}
    if(target.dataset.year||target.dataset.month||target.dataset.day){
      const part=target.dataset.year?'year':target.dataset.month?'month':'day';
      const date=selectDatePart(c,part,+target.dataset[part],TODAY,MIN_Y);
      if(!date)return;
      dates[side]=date;cursors[side]={...date};
      if(part==='year')views[side]='m';
      if(part==='month')views[side]='d';
      res.textContent='';res.className='result';draw();return;
    }
    if(target.dataset.shift){const delta=+target.dataset.shift;
      if(views[side]==='d'){const d=new Date(c.y,c.m-1+delta,1);c.y=d.getFullYear();c.m=d.getMonth()+1;}
      else c.y+=delta*(views[side]==='y'?10:1);
      c.y=Math.max(MIN_Y,Math.min(TODAY.y,c.y));if(c.y===TODAY.y)c.m=Math.min(c.m,TODAY.m);draw();return;}
  });
  root.querySelector('.rp-reset').onclick=()=>{dates=[null,null];cursors=[{...TODAY},{...TODAY}];res.textContent='';res.className='result';views=['y','y'];value.textContent='기간을 선택하세요';draw();};
  btn.onclick=()=>{if(!validDateRange(dates))return;value.textContent=`${fmt(dates[0])} ~ ${fmt(dates[1])}`;modal.close();res.className='result ok';res.textContent=`${fmt(dates[0])} ~ ${fmt(dates[1])} 기간으로 검색해요`;};
  draw();
})();
