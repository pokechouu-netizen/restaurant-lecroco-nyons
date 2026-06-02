/* ============================================
   LE CROC'O — JAVASCRIPT PRINCIPAL
   UI interactions uniquement
   Le contenu est géré par cms-render.js (data/*.json)
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {


  /* ============================================
     NAV SCROLL
     ============================================ */
  const nav = document.querySelector('.nav');

  function handleNavScroll() {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();


  /* ============================================
     MOBILE MENU
     ============================================ */
  const burger = document.querySelector('.nav-burger');
  const mobileOverlay = document.querySelector('.nav-mobile-overlay');

  if (burger && mobileOverlay) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      mobileOverlay.classList.toggle('active');
      document.body.style.overflow = mobileOverlay.classList.contains('active') ? 'hidden' : '';
    });

    mobileOverlay.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('active');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }


  /* ============================================
     SCROLL REVEAL ANIMATIONS
     ============================================ */
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));


  /* ============================================
     PHONE OVERLAY
     ============================================ */
  const phoneOverlay = document.querySelector('.phone-overlay');
  const phoneTriggers = document.querySelectorAll('[data-phone-trigger]');
  const phoneClose = document.querySelector('.phone-overlay-close');

  function openPhoneOverlay() {
    if (phoneOverlay) {
      phoneOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closePhoneOverlay() {
    if (phoneOverlay) {
      phoneOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  phoneTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openPhoneOverlay();
    });
  });

  if (phoneClose) {
    phoneClose.addEventListener('click', closePhoneOverlay);
  }

  if (phoneOverlay) {
    phoneOverlay.addEventListener('click', (e) => {
      if (e.target === phoneOverlay) closePhoneOverlay();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && phoneOverlay.classList.contains('active')) {
        closePhoneOverlay();
      }
    });

    // Copy to clipboard
    phoneOverlay.querySelectorAll('.btn-phone-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const number = btn.getAttribute('data-copy');
        if (!number) return;

        const original = btn.innerHTML;
        const svgEl = btn.querySelector('svg');
        const svgHtml = svgEl ? svgEl.outerHTML : '';

        navigator.clipboard.writeText(number).then(() => {
          btn.classList.add('copied');
          btn.innerHTML = svgHtml + ' Copié !';
          setTimeout(() => {
            btn.innerHTML = original;
            btn.classList.remove('copied');
          }, 2000);
        }).catch(() => {
          const input = document.createElement('input');
          input.value = number;
          document.body.appendChild(input);
          input.select();
          document.execCommand('copy');
          document.body.removeChild(input);
          btn.classList.add('copied');
          btn.innerHTML = svgHtml + ' Copié !';
          setTimeout(() => {
            btn.innerHTML = original;
            btn.classList.remove('copied');
          }, 2000);
        });
      });
    });
  }


  /* ============================================
     SMOOTH SCROLL
     ============================================ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      try {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const offset = nav.offsetHeight + 20;
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      } catch (_) { /* invalid selector */ }
    });
  });

});
