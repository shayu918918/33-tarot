(() => {
  'use strict';
  const cards = Array.isArray(window.TAROT_CARDS) ? window.TAROT_CARDS : [];
  const $ = id => document.getElementById(id);
  const dialog = $('reading-dialog');
  const views = [$('drawing-view'), $('reading-view'), $('reading-error')];
  const animations = new Set();
  const sound = window.TarotSound || { available: false, enabled: false, unlock() {}, stop() {}, cut() {}, fan() {}, lift() {}, flip() {}, reveal() {} };
  let sequence = 0;
  let busy = false;
  let pendingCard = null;
  let returnFocus = null;

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const valid = token => token === sequence && dialog.open;
  const text = (id, value) => { $(id).textContent = value; };
  function cancelAnimations() {
    animations.forEach(animation => animation.cancel());
    animations.clear();
  }
  function setBusy(value) {
    busy = value;
    $('draw-main').disabled = value;
    $('draw-again').disabled = value;
  }
  function setView(id) {
    views.forEach(view => { view.hidden = view.id !== id; });
    dialog.setAttribute('aria-labelledby', id === 'drawing-view' ? 'drawing-title' : id === 'reading-error' ? 'error-title' : 'dialog-title');
    dialog.scrollTop = 0;
  }
  function openDialog(opener) {
    if (!dialog.open) {
      returnFocus = opener || document.activeElement;
      dialog.showModal();
      document.body.classList.add('dialog-open');
    }
  }
  async function play(element, frames, options, token) {
    if (!valid(token)) return false;
    if (reducedMotion() || !element.animate) {
      const final = frames[frames.length - 1];
      for (const key of ['transform', 'opacity']) if (final[key] !== undefined) element.style[key] = final[key];
      return valid(token);
    }
    const animation = element.animate(frames, { fill: 'forwards', ...options });
    animations.add(animation);
    try { await animation.finished; } catch (_) { return false; }
    return valid(token);
  }
  function decodeImage(src) {
    const image = new Image();
    image.src = src;
    if (image.decode) return image.decode();
    return new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
  }
  function randomCard() {
    if (!window.crypto?.getRandomValues) return cards[Math.floor(Math.random() * cards.length)];
    const value = new Uint32Array(1);
    const limit = 0x100000000 - (0x100000000 % cards.length);
    do { window.crypto.getRandomValues(value); } while (value[0] >= limit);
    return cards[value[0] % cards.length];
  }
  function resetStage() {
    cancelAnimations();
    sound.stop();
    $('card-pile').replaceChildren();
    $('chosen-card').style.display = 'none';
    $('chosen-card').style.transform = '';
    $('chosen-card').style.opacity = '1';
    $('card-flipper').style.transform = '';
    $('reading-image').style.transform = '';
    $('reading-copy').style.opacity = '';
    $('reading-copy').style.transform = '';
    text('drawing-status', '牌正在慢慢展开。');
  }
  function makeBack() {
    const back = document.createElement('div');
    back.className = 'pile-card card-back';
    $('card-pile').append(back);
    return back;
  }
  async function showReading(card, token, fromRect) {
    if (!valid(token)) return;
    const image = $('reading-image');
    image.src = card.image;
    image.width = card.width; image.height = card.height;
    image.alt = `${card.roman} ${card.name}，33的塔罗牌`;
    text('reading-numeral', card.roman);
    text('dialog-title', card.name);
    text('reading-english', card.english);
    text('reading-message', card.message);
    text('reading-interpretation', card.upright);
    setView('reading-view');
    const target = image.getBoundingClientRect();
    const cardFrames = fromRect && target.width && target.height ? [
      { transform: `translate(${fromRect.left + fromRect.width / 2 - target.left - target.width / 2}px,${fromRect.top + fromRect.height / 2 - target.top - target.height / 2}px) scale(${fromRect.width / target.width},${fromRect.height / target.height})` },
      { transform: 'translate(0,0) scale(1)' }
    ] : [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }];
    const results = await Promise.all([
      play(image, cardFrames, { duration: 590, easing: 'cubic-bezier(.2,.8,.18,1)' }, token),
      play($('reading-copy'), [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 520, delay: 140, easing: 'cubic-bezier(.2,.75,.2,1)' }, token)
    ]);
    if (!valid(token) || results.some(result => !result)) return;
    setBusy(false);
    $('dialog-title').focus({ preventScroll: true });
  }
  function showError(token) {
    if (!valid(token)) return;
    cancelAnimations();
    sound.stop();
    setBusy(false);
    setView('reading-error');
    $('retry-reading').focus({ preventScroll: true });
  }
  async function reveal(card, token, ritual) {
    // Start the actual card download before the first movement.
    const decoded = decodeImage(card.image).then(() => true, () => false);
    try {
      if (!ritual || reducedMotion()) {
        if (!(await decoded)) return showError(token);
        if (!valid(token)) return;
        if (ritual) { sound.flip(0); sound.reveal(.1); }
        return showReading(card, token);
      }
      const backs = Array.from({ length: 7 }, makeBack);
      const entered = await Promise.all(backs.map((back, i) => play(back, [
        { opacity: 0, transform: `translate(${(i - 3) * 1.2}px,40px) rotate(0deg) scale(.94)` },
        { opacity: 1, transform: `translate(${(i - 3) * 1.2}px,${(i - 3) * -.6}px) rotate(0deg) scale(1)` }
      ], { duration: 200, delay: i * 14, easing: 'cubic-bezier(.15,.75,.2,1)' }, token)));
      if (entered.some(result => !result)) return;
      text('drawing-status', '正在切牌。');
      sound.cut();
      const cut = await Promise.all(backs.map((back, i) => {
        const x = (i - 3) * 1.2;
        const y = (i - 3) * -.6;
        const upper = i >= 4;
        return play(back, [
          { transform: `translate(${x}px,${y}px) rotate(0deg)`, offset: 0 },
          { transform: `translate(${x + (upper ? 38 : -13)}px,${y + (upper ? -15 : 4)}px) rotate(${upper ? 4 : -2}deg)`, offset: .43 },
          { transform: `translate(${x + (upper ? -18 : 7)}px,${y + (upper ? 6 : -2)}px) rotate(${upper ? -2 : 1}deg)`, offset: .77 },
          { transform: `translate(${x}px,${y}px) rotate(0deg)`, offset: 1 }
        ], { duration: 390, easing: 'cubic-bezier(.3,.05,.23,1)' }, token);
      }));
      if (cut.some(result => !result)) return;
      text('drawing-status', '牌正在慢慢展开。');
      sound.fan();
      const sample = backs[3];
      const maxAngle = window.innerWidth <= 600 ? 11 : 18;
      const radians = maxAngle * Math.PI / 180;
      const halfWidth = (sample.offsetWidth * Math.cos(radians) + sample.offsetHeight * Math.sin(radians)) / 2;
      const spread = Math.max(20, Math.min(154, $('card-stage').clientWidth / 2 - halfWidth - 14));
      const fanTransforms = backs.map((_, i) => {
        const position = (i - 3) / 3;
        return `translate(${position * spread}px,${position * position * 25}px) rotate(${position * maxAngle}deg)`;
      });
      const fanned = await Promise.all(backs.map((back, i) => play(back, [
        { transform: `translate(${(i - 3) * 1.2}px,${(i - 3) * -.6}px) rotate(0deg)` },
        { transform: fanTransforms[i] }
      ], { duration: 490, delay: Math.abs(i - 3) * 19, easing: 'cubic-bezier(.18,.78,.16,1)' }, token)));
      if (fanned.some(result => !result)) return;
      const chosen = $('chosen-card');
      chosen.style.display = 'block';
      sound.lift();
      // Hand the central card to the independent, two-sided card element.
      // Cancel its old animation before hiding it; a filled opacity keyframe wins over inline opacity.
      backs[3].style.visibility = 'hidden';
      text('drawing-status', '这一张，留给此刻的你。');
      const lifted = await Promise.all([
        play(chosen, [{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-12px) scale(1.035)' }], { duration: 360, easing: 'cubic-bezier(.16,.85,.2,1)' }, token),
        ...backs.filter((_, i) => i !== 3).map(back => {
          const i = backs.indexOf(back);
          return play(back, [{ opacity: 1, transform: fanTransforms[i] }, { opacity: 0, transform: `${fanTransforms[i]} translateY(27px) scale(.97)` }], { duration: 310, easing: 'cubic-bezier(.3,.2,.4,1)' }, token);
        })
      ]);
      if (lifted.some(result => !result)) return;
      if (!(await decoded)) return showError(token);
      if (!valid(token)) return;
      const front = $('reveal-image'); front.src = card.image;
      if (front.decode) await front.decode();
      if (!valid(token)) return;
      sound.flip();
      if (!(await play($('card-flipper'), [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(180deg)' }], { duration: 740, easing: 'cubic-bezier(.28,.65,.14,1)' }, token))) return;
      sound.reveal();
      text('drawing-status', card.name);
      if (!(await play(chosen, [{ transform: 'translateY(-12px) scale(1.035)' }, { transform: 'translateY(-12px) scale(1.035)' }], { duration: 160 }, token))) return;
      const from = chosen.getBoundingClientRect();
      await showReading(card, token, from);
    } catch (_) { showError(token); }
  }
  function begin(card, opener, ritual = true) {
    if (busy) return;
    sound.unlock();
    const token = ++sequence;
    pendingCard = card;
    resetStage(); setBusy(true); setView('drawing-view'); openDialog(opener);
    reveal(card, token, ritual);
  }
  function renderGallery() {
    const grid = $('card-grid');
    grid.replaceChildren();
    for (const card of cards) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'gallery-card';
      button.setAttribute('aria-label', `查看${card.name}的解语`);
      const picture = document.createElement('div'); picture.className = 'gallery-image';
      const image = document.createElement('img'); image.src = card.thumbnail; image.alt = ''; image.loading = 'lazy'; image.decoding = 'async'; image.width = card.width; image.height = card.height;
      picture.append(image);
      const title = document.createElement('span'); title.className = 'gallery-name';
      const numeral = document.createElement('span'); numeral.className = 'gallery-number'; numeral.textContent = card.roman;
      title.append(numeral, document.createTextNode(card.name)); button.append(picture, title);
      button.addEventListener('click', () => begin(card, button, false)); grid.append(button);
    }
  }
  $('draw-main').addEventListener('click', event => { if (cards.length === 22) begin(randomCard(), event.currentTarget); });
  $('draw-again').addEventListener('click', () => begin(randomCard(), null));
  $('close-dialog').addEventListener('click', () => dialog.close());
  $('retry-reading').addEventListener('click', () => { if (pendingCard) begin(pendingCard, null, false); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    ++sequence; cancelAnimations(); sound.stop(); setBusy(false); document.body.classList.remove('dialog-open'); returnFocus?.focus({ preventScroll: true });
  });
  const soundButton = $('sound-toggle');
  function updateSoundButton() {
    soundButton.hidden = !sound.available;
    soundButton.setAttribute('aria-pressed', String(sound.enabled));
    soundButton.setAttribute('aria-label', sound.enabled ? '关闭音效' : '开启音效');
    soundButton.title = sound.enabled ? '音效已开启' : '音效已关闭';
  }
  soundButton.addEventListener('click', () => { sound.toggle(); updateSoundButton(); });
  updateSoundButton();
  if (cards.length === 22) renderGallery();
  else { $('draw-main').disabled = true; text('hero-title', '牌组暂时没有加载好，请刷新页面。'); }
  if (!reducedMotion() && $('draw-main').animate) {
    const portrait = document.querySelector('.hero-portrait');
    (portrait.decode ? portrait.decode() : Promise.resolve()).then(() => {
      portrait.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 900, easing: 'cubic-bezier(.2,.7,.2,1)' });
    }).catch(() => {});
  }
})();
