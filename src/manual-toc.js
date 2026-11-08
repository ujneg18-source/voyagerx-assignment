// Q1: short, hierarchical section names with a current-reading indicator.
const toc = document.getElementById('toc');
let entries = [];
let scheduled = false;
let selected = null;

function headerBottom() {
  return document.querySelector('.topnav')?.getBoundingClientRect().bottom || 60;
}

function markCurrent(entry) {
  entries.forEach(item => {
    if (item === entry) item.link.setAttribute('aria-current', 'location');
    else item.link.removeAttribute('aria-current');
  });
}

function updateCurrent() {
  scheduled = false;
  if (!entries.length) return;
  // Near the page bottom a heading cannot always reach the top of the viewport.
  // Keep the clicked item selected until the reader actually scrolls elsewhere.
  if (selected && Math.abs(window.scrollY - selected.top) <= 2) {
    markCurrent(selected.entry);
    return;
  }
  selected = null;
  const threshold = headerBottom() + 32;
  let current = entries[0];
  for (const entry of entries) {
    if (entry.heading.getBoundingClientRect().top <= threshold) current = entry;
    else break;
  }
  markCurrent(current);
}

function scheduleUpdate() {
  if (!scheduled) {
    scheduled = true;
    requestAnimationFrame(updateCurrent);
  }
}

export function renderManualToc(page) {
  entries = [];
  selected = null;
  toc.replaceChildren();
  toc.setAttribute('aria-label', '이 페이지의 목차');
  if (page.dataset.q !== 'q1') return;

  const headings = [...page.querySelectorAll('h2[id], h3[id]')];
  if (!headings.length) return;
  const title = document.createElement('div');
  title.className = 'h';
  title.textContent = '이 페이지에서';
  toc.append(title);

  let section = 0;
  let subsection = 0;
  headings.forEach(heading => {
    const child = heading.tagName === 'H3';
    if (child) subsection += 1;
    else { section += 1; subsection = 0; }
    const number = String(section).padStart(2, '0') + (child ? `.${subsection}` : '');
    const link = document.createElement('a');
    link.className = `toc-entry${child ? ' toc-sub' : ''}`;
    link.href = `#${heading.id}`;
    link.dataset.sc = heading.id;
    const prefix = document.createElement('span');
    prefix.className = 'toc-number';
    prefix.setAttribute('aria-hidden', 'true');
    prefix.textContent = number;
    const label = document.createElement('span');
    label.textContent = heading.dataset.tocLabel || heading.textContent.trim();
    link.append(prefix, label);
    toc.append(link);
    entries.push({ heading, link });
  });
  markCurrent(entries[0]);
  scheduleUpdate();
}

toc.addEventListener('click', event => {
  const link = event.target.closest('.toc-entry');
  const entry = entries.find(item => item.link === link);
  if (!entry) return;
  event.preventDefault();

  const viewport = document.documentElement.clientHeight;
  const scroller = document.scrollingElement || document.documentElement;
  const maximum = Math.max(0, scroller.scrollHeight - viewport);
  const top = Math.min(maximum, Math.max(0,
    window.scrollY + entry.heading.getBoundingClientRect().top - headerBottom() - 24));
  selected = { entry, top };
  // Scroll only the document, without moving the independently scrolling TOC.
  window.scrollTo({ top, behavior: 'instant' });
  markCurrent(entry);
  entry.heading.setAttribute('tabindex', '-1');
  entry.heading.focus({ preventScroll: true });
});

window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', scheduleUpdate, { passive: true });
