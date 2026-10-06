(() => {
  const header = document.querySelector('.site-header');
  const nav = document.getElementById('navLinks');
  const openButton = document.querySelector('.menu-button');
  const closeButton = document.querySelector('.menu-close');
  const backdrop = document.querySelector('.backdrop');
  const mobile = matchMedia('(max-width:760px)');
  function setMenu(open, focus = true) {
    if (!nav || !openButton) return;
    nav.classList.toggle('open', open);
    if (backdrop) { backdrop.hidden = !open; backdrop.classList.toggle('open', open); }
    openButton.setAttribute('aria-expanded', String(open));
    openButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.setAttribute('aria-hidden', String(mobile.matches && !open));
    document.body.classList.toggle('menu-open', open);
    if (open) closeButton?.focus(); else if (focus) openButton.focus();
  }
  if (nav) {
    nav.setAttribute('aria-hidden', String(mobile.matches));
    openButton?.addEventListener('click', () => setMenu(openButton.getAttribute('aria-expanded') !== 'true'));
    closeButton?.addEventListener('click', () => setMenu(false));
    backdrop?.addEventListener('click', () => setMenu(false));
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false, false)));
    mobile.addEventListener('change', event => { setMenu(false, false); nav.setAttribute('aria-hidden', String(event.matches)); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && openButton?.getAttribute('aria-expanded') === 'true') setMenu(false); });
  }
  if (header) {
    let previous = window.scrollY;
    let ticking = false;
    const updateHeader = () => {
      const y = window.scrollY;
      const down = y > previous;
      header.classList.toggle('is-scrolled', y > 60);
      if (openButton?.getAttribute('aria-expanded') !== 'true') header.classList.toggle('is-hidden', down && y > 140);
      previous = Math.max(0, y);
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(updateHeader); ticking = true; } }, { passive: true });
  }
  document.querySelectorAll('.filter[data-filter]').forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('.filter[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.querySelectorAll('.service-grid [data-kind]').forEach(card => { card.hidden = filter !== 'all' && card.dataset.kind !== filter; });
  }));
  const dialog = document.getElementById('articleDialog');
  const dialogContent = document.getElementById('articleContent');
  document.querySelectorAll('[data-article]').forEach(button => button.addEventListener('click', () => {
    const template = document.getElementById(`story-${button.dataset.article}`);
    if (!template || !dialog || !dialogContent) return;
    dialogContent.replaceChildren(template.content.cloneNode(true));
    dialog.showModal();
  }));
  document.querySelector('.dialog-close')?.addEventListener('click', () => dialog?.close());
  dialog?.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  document.querySelectorAll('.newsletter-form').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    const button = form.querySelector('button');
    let note = form.querySelector('[role="status"]');
    if (!note) { note = document.createElement('p'); note.setAttribute('role', 'status'); note.className = 'article-meta'; form.append(note); }
    note.textContent = 'Newsletter sign-ups are coming soon. Browse the latest stories here in the meantime.';
  }));
  const animate = () => {
    if (!window.gsap || !window.ScrollTrigger || matchMedia('(prefers-reduced-motion:reduce)').matches) {
      document.querySelectorAll('.rise').forEach(item => { item.style.opacity = 1; item.style.transform = 'none'; });
      document.querySelectorAll('[data-count]').forEach(item => { item.textContent = `${item.dataset.count}${item.dataset.suffix || ''}`; });
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('.rise').forEach((item, index) => gsap.fromTo(item, { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: .75, delay: Math.min(index % 3, 2) * .06, ease: 'power3.out', scrollTrigger: { trigger: item, start: 'top 88%', once: true } }));
    gsap.utils.toArray('h1,.section-title').forEach((heading, index) => {
      if (heading.dataset.letterReady) return;
      heading.dataset.letterReady = 'true';
      const text = heading.textContent.trim();
      heading.setAttribute('aria-label', text);
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);
      textNodes.forEach(node => {
        const fragment = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) fragment.append(document.createTextNode(part));
          else {
            const word = document.createElement('span'); word.className = 'letter-word';
            [...part].forEach(char => { const span = document.createElement('span'); span.setAttribute('aria-hidden', 'true'); span.className = 'letter-char'; span.textContent = char; word.append(span); });
            fragment.append(word);
          }
        });
        node.replaceWith(fragment);
      });
      gsap.fromTo(heading.querySelectorAll('.letter-char'), { yPercent: 70, opacity: 0, rotateX: -45 }, { yPercent: 0, opacity: 1, rotateX: 0, duration: .45, stagger: .018, ease: 'power3.out', delay: index === 0 ? .15 : 0, scrollTrigger: index ? { trigger: heading, start: 'top 85%', once: true } : undefined });
    });
    document.querySelectorAll('[data-count]').forEach(item => {
      const state = { value: 0 }; const end = Number(item.dataset.count);
      gsap.to(state, { value: end, snap: { value: 1 }, duration: 1.5, ease: 'power2.out', onUpdate: () => { item.textContent = `${Math.round(state.value)}${item.dataset.suffix || ''}`; }, scrollTrigger: { trigger: item, start: 'top 90%', once: true } });
    });
  };
  window.addEventListener('load', animate, { once: true });
})();
