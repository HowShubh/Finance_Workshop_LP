/* Zoom-link page (/zoomlink): the countdown, and the swap from "the link
   lands here" to the actual join button.

   This page is meant to be shared early — on a slide, in the calendar
   invite, as a QR code — so its address has to be stable and it has to say
   something useful weeks before the session as well as on the day. */

const LIVE = {
  /* The Zoom join link. Empty until Zoom issues it.

     While it is empty the page shows where the link will be instead of a
     dead button, and hides the QR block — a QR code pointing at nothing is
     worse than no QR code. Fill this in, regenerate assets/live-qr.svg for
     the same URL, and both switch on. */
  joinUrl: 'https://zoom.tagmango.com/redirect/webinar/single/6adc2d1c27a087f3b627c632',

  // Set true once assets/live-qr.svg encodes joinUrl.
  hasQr: true,


  // Session start, as UTC: 24 Oct 2026, 12:00 PM IST.
  startsAt: Date.UTC(2026, 9, 24, 6, 30, 0),

  // How long the room stays open, so the page keeps saying "live now"
  // rather than flipping back the moment the clock hits zero.
  liveMinutes: 250
};

/* ---------- The link ---------- */

function applyLink() {
  const join = document.querySelector('[data-join]');
  const wait = document.querySelector('[data-wait]');
  const qr = document.querySelector('[data-qr]');

  if (LIVE.joinUrl) {
    join.href = LIVE.joinUrl;
    join.hidden = false;
    wait.hidden = true;
    if (LIVE.hasQr && qr) {
      const img = qr.querySelector('[data-qr-src]');
      if (img) img.src = img.dataset.qrSrc;
      qr.hidden = false;
    }
  }
}


/* ---------- Countdown ---------- */

function initCountdown() {
  const box = document.querySelector('[data-countdown]');
  const title = document.querySelector('[data-live-note]');
  if (!box) return;

  const cells = {
    d: box.querySelector('[data-d]'),
    h: box.querySelector('[data-h]'),
    m: box.querySelector('[data-m]'),
    s: box.querySelector('[data-s]')
  };
  const pad = n => String(n).padStart(2, '0');
  const endsAt = LIVE.startsAt + LIVE.liveMinutes * 60000;

  function tick() {
    const now = Date.now();
    const left = LIVE.startsAt - now;

    if (left > 0) {
      cells.d.textContent = String(Math.floor(left / 86400000));
      cells.h.textContent = pad(Math.floor(left / 3600000) % 24);
      cells.m.textContent = pad(Math.floor(left / 60000) % 60);
      cells.s.textContent = pad(Math.floor(left / 1000) % 60);
      return;
    }

    /* Once it starts, a counter running backwards from zero is noise. The
       room is open for liveMinutes, then the page reads as finished. */
    box.hidden = true;
    if (title) {
      title.textContent = now < endsAt
        ? 'We are live on Zoom right now. Tap the button to join.'
        : 'This session has finished. The recording is sent to you within 24–48 hours.';
    }
    clearInterval(timer);
  }

  const timer = setInterval(tick, 1000);
  tick();
}

applyLink();
initCountdown();
