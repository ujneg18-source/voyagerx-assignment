// Keep small instruction screenshots readable without changing their originals.
const viewer = document.querySelector('#lightbox');
const image = viewer.querySelector('img');
const title = viewer.querySelector('#lightbox-title');
let opener = null;

function openImage(trigger, img) {
  opener = trigger;
  image.src = trigger.dataset.full || img.src;
  image.alt = img.alt;
  title.textContent = img.alt || '전체 화면';
  viewer.showModal();
  document.body.classList.add('image-viewing');
}

document.addEventListener('click', event => {
  const button = event.target.closest('.shot-open');
  if (button) {
    openImage(button, button.querySelector('img'));
    return;
  }
  const img = event.target.closest('figure img');
  if (img) openImage(img, img);
});

document.querySelector('#lightbox-close').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', event => {
  if (event.target !== viewer) return;
  const bounds = viewer.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) viewer.close();
});
viewer.addEventListener('close', () => {
  document.body.classList.remove('image-viewing');
  opener?.focus({ preventScroll: true });
  image.removeAttribute('src');
});
