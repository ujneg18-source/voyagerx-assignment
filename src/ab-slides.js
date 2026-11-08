const page = document.querySelector('[data-id="q2-ab"]');
const slides = [...page.querySelectorAll('[data-ab-slide]')];
const previous = page.querySelector('[data-ab-prev]');
const next = page.querySelector('[data-ab-next]');
const status = page.querySelector('[data-ab-status]');
const details = [...page.querySelectorAll('[data-ab-details]')];
let current = 0;

function showSlide(index) {
  current = index;
  slides.forEach((slide, i) => { slide.hidden = i !== current; });
  details.forEach((detail) => { detail.hidden = Number(detail.dataset.abDetails) !== current; });
  previous.disabled = current === 0;
  next.disabled = current === slides.length - 1;
  status.textContent = slides[current].getAttribute('aria-label');
}

previous.addEventListener('click', () => showSlide(current - 1));
next.addEventListener('click', () => showSlide(current + 1));
document.addEventListener('keydown', (event) => {
  if (!page.classList.contains('on') || document.querySelector('dialog[open]') ||
      event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  const index = current + (event.key === 'ArrowRight' ? 1 : -1);
  if (index < 0 || index >= slides.length) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  showSlide(index);
}, true);
