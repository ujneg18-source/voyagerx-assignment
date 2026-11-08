// 라우터: 상단 세그먼트 탭, 사이드바, 목차, 이전·다음
import { $ } from './util.js';
import { startIntro, stopIntro, leave } from './intro.js';
import { renderManualToc } from './manual-toc.js';
const Q={q1:"유진영 사용 설명서",q2:"네이버 뉴스 날짜 입력",q3:"Vrew AI 목소리 3가지",q4:"Vrew 고객 문의"};
export const pages=[...document.querySelectorAll('.page')];
export const ids=pages.map(p=>p.dataset.id);
const tabs=$('#tabs');
const ind=document.createElement('span'); ind.className='seg-ind'; tabs.appendChild(ind);
Object.entries(Q).forEach(([k,v])=>{const b=document.createElement('button');b.className='tab';b.dataset.q=k;b.innerHTML=`<b>${k.toUpperCase()}</b>${v}`;b.onclick=()=>go(pages.find(p=>p.dataset.q===k).dataset.id);tabs.appendChild(b)});
function moveInd(){const on=tabs.querySelector('.tab.on'); if(!on) return; ind.style.width=on.offsetWidth+'px'; ind.style.transform=`translateX(${on.offsetLeft-4}px)`;}
window.addEventListener('resize',moveInd);

export function go(id){
  if(!ids.includes(id)) id=ids[0];
  stopIntro();
  $('#onboard').style.display='none'; $('#app').style.display='block';
  const i=ids.indexOf(id), pg=pages[i], q=pg.dataset.q;
  pages.forEach(p=>p.classList.toggle('on',p===pg));
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('on',t.dataset.q===q));
  $('#sbTitle').textContent=Q[q];
  $('#sbList').innerHTML=pages.filter(p=>p.dataset.q===q).map(p=>{
    const label=p.dataset.id==='q4-pause'
      ? '<span class="sb-prefix">문의 2 ·</span> <span class="sb-label"><span class="sb-subject">머뭇거린 부분</span> 지우기</span>'
      : p.dataset.title;
    return `<button class="sb-link${p===pg?' on':''}" data-go="${p.dataset.id}">${label}</button>`;
  }).join('');
  document.querySelector('.layout').classList.toggle('has-toc',q==='q1');
  renderManualToc(pg);
  requestAnimationFrame(moveInd);
  const pv=pages[i-1]?.dataset.q===q?pages[i-1]:null, nx=pages[i+1]?.dataset.q===q?pages[i+1]:null;
  $('#prev').disabled=!pv; $('#next').disabled=!nx;
  $('#prevNm').textContent=pv?pv.dataset.title:'';
  $('#nextNm').textContent=nx?nx.dataset.title:'';
  history.replaceState(null,'','#'+id); window.scrollTo(0,0);
}
export function home(){ $('#app').style.display='none'; $('#onboard').style.display='block'; history.replaceState(null,'',location.pathname); startIntro(); }
function cur(){ return ids.indexOf(location.hash.slice(1)); }
document.addEventListener('click',e=>{
  const g=e.target.closest('[data-go]'); if(g){e.preventDefault();go(g.dataset.go);return}
});
$('#prev').onclick=()=>{const i=cur();if(pages[i-1]?.dataset.q===pages[i]?.dataset.q)go(ids[i-1]);}; $('#next').onclick=()=>{const i=cur();if(pages[i+1]?.dataset.q===pages[i]?.dataset.q)go(ids[i+1]);}; $('#home').onclick=home;
document.addEventListener('keydown',e=>{
  if(document.querySelector('dialog[open]') || e.target.closest('input,textarea,select,[contenteditable="true"],.table-scroll')) return;
  if(e.key==='Escape') return;
  const c=cur();
  if(c<0){ if(e.key==='ArrowRight'||e.key==='Enter'){e.preventDefault();leave();} return; }
  if(e.key==='ArrowRight' && c<ids.length-1) go(ids[c+1]);
  if(e.key==='ArrowLeft'){ if(c>0) go(ids[c-1]); else home(); }
});
window.addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(ids.includes(h)&&!document.querySelector('.page.on[data-id="'+h+'"]'))go(h)});

