/* Learn to Earn Through Content — behaviour on top of home.js:
   the enrol bar that only appears once the visitor scrolls, and the
   WhatsApp-style voice note in the testimonials. */

/* ---------- Enrol bar ----------

   home.js shows its bar from the first paint on desktop and as soon as
   the hero button leaves on a phone. This page's bar uses its own
   attribute (data-le-sticky, which home.js ignores) and comes in once
   the visitor has scrolled past the hero's Enroll button. It then stays
   until the page's closing Enroll band comes into view (or the visitor
   scrolls back up to the hero). The Enroll buttons in between don't
   hide it: doing that made it slide out and back in three times on
   the way down. */
(function () {
  const bar = document.querySelector('[data-le-sticky]');
  if (!bar) return;
  if (!('IntersectionObserver' in window)) { bar.classList.add('is-in'); return; }

  const hero = document.querySelector('.lp-hero [data-buy]');
  const closing = document.querySelector('main .lp-cta-ink[data-buy]');
  const visible = new Set();
  let scrolled = window.scrollY > 0;

  function update() {
    bar.classList.toggle('is-in', scrolled && visible.size === 0);
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
    update();
  }, { rootMargin: '0px 0px -40px 0px' });
  [hero, closing].forEach((el) => el && io.observe(el));

  window.addEventListener('scroll', () => {
    if (scrolled) return;
    scrolled = true;
    update();
  }, { passive: true });
})();

/* ---------- Voice note ----------

   Starts by itself when the card is mostly in view. Browsers only allow
   sound without a tap once the visitor has interacted with the page, so
   if play() is refused the button pulses and the hint asks for a tap
   instead — the visitor can always pause or play it themselves.

   Playback the page started on its own is paused again if the card is
   scrolled away; playback the visitor started is left alone. */
(function () {
  const card = document.querySelector('[data-voice]');
  if (!card) return;

  const audio = card.querySelector('[data-voice-audio]');
  const toggle = card.querySelector('[data-voice-toggle]');
  const wave = card.querySelector('[data-voice-wave]');
  const timeEl = card.querySelector('[data-voice-time]');
  const speedBtn = card.querySelector('[data-voice-speed]');
  const hint = card.querySelector('[data-voice-hint]');

  /* Loudness of the recording in 56 slices (RMS, 0–100), measured from
     the file. Stretched so a steady talker still reads as a waveform. */
  const LEVELS = [77,80,79,88,82,85,100,85,92,91,84,90,96,86,87,82,85,89,84,95,87,89,82,87,78,86,89,87,84,89,96,99,93,93,98,87,82,98,96,97,82,86,88,79,83,96,84,79,81,85,84,79,89,87,88,88];
  const lo = Math.min(...LEVELS), hi = Math.max(...LEVELS);
  const bars = LEVELS.map((v, i) => {
    const b = document.createElement('i');
    // a little per-bar wobble so neighbouring equal values don't flatten out
    const wobble = (Math.sin(i * 1.7) + 1) * 9;
    b.style.height = Math.round(22 + ((v - lo) / (hi - lo)) * 60 + wobble) + '%';
    wave.appendChild(b);
    return b;
  });

  const FALLBACK_DURATION = 488; // 8:08, until metadata arrives
  const fmt = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const duration = () => (isFinite(audio.duration) && audio.duration) || FALLBACK_DURATION;

  function paint() {
    const p = audio.currentTime / duration();
    const lit = Math.round(p * bars.length);
    bars.forEach((b, i) => b.classList.toggle('on', i < lit));
    timeEl.textContent = fmt(audio.currentTime) + ' / ' + fmt(duration());
    wave.setAttribute('aria-valuenow', String(Math.round(p * 100)));
  }

  function setState() {
    const playing = !audio.paused;
    card.classList.toggle('is-playing', playing);
    toggle.setAttribute('aria-label', playing ? 'Pause the voice note' : 'Play the voice note');
    if (playing) { card.classList.remove('needs-tap'); hint.textContent = 'Playing · tap to pause'; }
    else if (audio.currentTime > 0) hint.textContent = 'Paused · tap to resume';
  }

  let autoStarted = false;
  let userTouched = false;

  toggle.addEventListener('click', () => {
    userTouched = true;
    autoStarted = false;
    if (audio.paused) audio.play().catch(() => {}); else audio.pause();
  });

  const speeds = [1, 1.5, 2];
  speedBtn.addEventListener('click', () => {
    const next = speeds[(speeds.indexOf(audio.playbackRate) + 1) % speeds.length] || 1;
    audio.playbackRate = next;
    speedBtn.textContent = next + '×';
  });

  function seekTo(clientX) {
    const r = wave.getBoundingClientRect();
    audio.currentTime = Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * duration();
    paint();
  }
  wave.addEventListener('click', (e) => { userTouched = true; seekTo(e.clientX); });
  wave.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') audio.currentTime = Math.min(duration(), audio.currentTime + 10);
    else if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 10);
    else return;
    e.preventDefault();
    paint();
  });

  audio.addEventListener('timeupdate', paint);
  audio.addEventListener('loadedmetadata', paint);
  audio.addEventListener('play', setState);
  audio.addEventListener('pause', setState);
  audio.addEventListener('ended', () => { audio.currentTime = 0; paint(); hint.textContent = 'Tap play to listen again'; });

  if (!('IntersectionObserver' in window)) return;

  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      if (userTouched || !audio.paused || audio.ended) return;
      audio.play().then(() => { autoStarted = true; }).catch(() => {
        card.classList.add('needs-tap');
        hint.textContent = 'Tap play to listen';
      });
    } else if (autoStarted && !audio.paused) {
      audio.pause();
    }
  }, { threshold: 0.6 }).observe(card);
})();
