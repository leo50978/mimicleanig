const promoDialog = document.getElementById('promoDialog');
const promoStatus = document.getElementById('promoStatus');
const promoVideo = document.getElementById('promoVideo');
const filmImages = [
  'assets/clino-film-home.webp', 'assets/clino-film-kitchen.webp',
  'assets/clino-film-office.webp', 'assets/clino-film-yacht-wash.webp',
  'assets/clino-film-yacht-interior.webp', 'assets/clino-film-yacht-glass.webp',
  'assets/clino-film-yacht-cabin.webp'
];
let filmUrl = '';
let generating = false;
const loadImage = src => new Promise((resolve, reject) => {
  const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src;
});
async function generateFilm() {
  if (generating) return;
  if (filmUrl) { promoVideo.src = filmUrl; promoVideo.play().catch(() => {}); return; }
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
    promoStatus.textContent = 'Video playback is unavailable in this browser. Explore the yacht cleaning services below.';
    return;
  }
  generating = true;
  try {
    const images = await Promise.all(filmImages.map(loadImage));
    const canvas = document.createElement('canvas'); canvas.width = 960; canvas.height = 540;
    const ctx = canvas.getContext('2d');
    const stream = canvas.captureStream(24);
    const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type));
    if (!mimeType) throw new Error('No supported recording format');
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2200000 });
    const parts = [];
    recorder.ondataavailable = event => { if (event.data.size) parts.push(event.data); };
    const complete = new Promise((resolve, reject) => {
      recorder.onerror = () => reject(new Error('Recording failed'));
      recorder.onstop = () => resolve(new Blob(parts, { type: mimeType }));
    });
    promoStatus.textContent = 'Creating your 7-scene Clino film…';
    recorder.start();
    const start = performance.now();
    const duration = 1050;
    const draw = now => {
      const elapsed = now - start;
      const slide = Math.min(images.length - 1, Math.floor(elapsed / duration));
      const progress = (elapsed % duration) / duration;
      const image = images[slide];
      const scale = Math.max(canvas.width / image.width, canvas.height / image.height) * (1.015 + .035 * progress);
      const w = image.width * scale, h = image.height * scale;
      ctx.drawImage(image, (canvas.width-w)/2 - progress*8, (canvas.height-h)/2);
      const gradient = ctx.createLinearGradient(0,280,0,540);
      gradient.addColorStop(0,'rgba(13,26,64,0)'); gradient.addColorStop(1,'rgba(13,26,64,.78)');
      ctx.fillStyle = gradient; ctx.fillRect(0,250,960,290);
      ctx.fillStyle = '#b8f4ff'; ctx.font = '800 18px Nunito Sans, sans-serif'; ctx.fillText('FLORIDA HOME & YACHT CLEANING', 54, 423);
      ctx.fillStyle = '#ffffff'; ctx.font = '700 43px "DM Sans", sans-serif'; ctx.fillText(['Every detail, cared for.','Fresh spaces, ready to enjoy.','A clearer view, on the water.','Polished with a lighter touch.','A calm cabin starts here.','A brighter boat, inside and out.','Make room for a perfect day.'][slide], 54, 474);
      if (elapsed < duration * images.length) requestAnimationFrame(draw); else recorder.stop();
    };
    requestAnimationFrame(draw);
    const blob = await complete;
    filmUrl = URL.createObjectURL(blob);
    promoVideo.src = filmUrl;
    promoVideo.load();
    promoStatus.textContent = 'Your Clino film is ready.';
    await promoVideo.play();
  } catch (error) {
    console.error('Clino promo video could not be generated.', error);
    promoStatus.textContent = 'The film could not be prepared here. You can still explore our services or call Clino.';
  } finally { generating = false; }
}
document.getElementById('openPromo')?.addEventListener('click', () => { promoDialog.showModal(); generateFilm(); });
document.querySelector('[data-close-promo]')?.addEventListener('click', () => { promoVideo.pause(); promoDialog.close(); });
promoDialog?.addEventListener('click', event => { if (event.target === promoDialog) { promoVideo.pause(); promoDialog.close(); } });
promoDialog?.addEventListener('close', () => promoVideo.pause());
