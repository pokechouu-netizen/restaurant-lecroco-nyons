/* ============================================
   LE CROC'O — EFFETS WOW
   Particles, Parallax, Tilt, Counter, Glow
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ============================================
     PARTICLES — Hero background
     ============================================ */
  const canvas = document.getElementById('particles-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animId;
    let w, h;

    function resizeCanvas() {
      const hero = canvas.closest('.hero');
      w = canvas.width = hero.offsetWidth;
      h = canvas.height = hero.offsetHeight;
    }

    function createParticles() {
      particles = [];
      const count = Math.floor((w * h) / 12000);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 2 + 0.5,
          dx: (Math.random() - 0.5) * 0.4,
          dy: (Math.random() - 0.5) * 0.3 - 0.15,
          o: Math.random() * 0.4 + 0.1,
          pulse: Math.random() * Math.PI * 2
        });
      }
    }

    function drawParticles() {
      ctx.clearRect(0, 0, w, h);
      const t = Date.now() * 0.001;

      for (const p of particles) {
        p.x += p.dx;
        p.y += p.dy;
        p.pulse += 0.02;

        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        const alpha = p.o * (0.6 + 0.4 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 162, 90, ${alpha})`;
        ctx.fill();
      }

      // Draw subtle connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const alpha = 0.06 * (1 - dist / 100);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(212, 162, 90, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(drawParticles);
    }

    resizeCanvas();
    createParticles();
    drawParticles();

    window.addEventListener('resize', () => {
      resizeCanvas();
      createParticles();
    });

    // Pause particles when hero not visible
    const heroObs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!animId) drawParticles();
      } else {
        cancelAnimationFrame(animId);
        animId = null;
      }
    });
    heroObs.observe(canvas.closest('.hero'));
  }


  /* ============================================
     PARALLAX — Hero background (desktop only)
     ============================================ */
  if (window.innerWidth > 600) {
    const parallaxBg = document.querySelector('.parallax-bg');
    const heroContent = document.querySelector('.hero-content');

    function handleParallax() {
      const scrollY = window.scrollY;
      const heroH = window.innerHeight;

      if (scrollY < heroH * 1.2) {
        if (parallaxBg) {
          const offset = scrollY * 0.3;
          parallaxBg.style.transform = `scale(1.05) translateY(${offset}px)`;
        }
        if (heroContent) {
          heroContent.style.transform = `translateY(${scrollY * 0.15}px)`;
          heroContent.style.opacity = Math.max(0, 1 - scrollY / (heroH * 0.7));
        }
      }
    }

    window.addEventListener('scroll', handleParallax, { passive: true });
  }


  /* ============================================
     SCROLL PROGRESS BAR
     ============================================ */
  const progressBar = document.getElementById('scroll-progress');

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? scrollTop / docHeight : 0;
    if (progressBar) {
      progressBar.style.transform = `scaleX(${progress})`;
    }
  }

  window.addEventListener('scroll', updateProgress, { passive: true });


  /* ============================================
     COUNTER ANIMATION
     ============================================ */
  const counters = document.querySelectorAll('.counter-value[data-target]');

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'));
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 2000;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      el.textContent = current + suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }

  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => counterObs.observe(c));


  /* ============================================
     TILT EFFECT — Cards (desktop only)
     ============================================ */
  if (window.innerWidth > 600) {
    const tiltCards = document.querySelectorAll('.info-block, .engagement-card');

    tiltCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

        card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(600px) rotateX(0) rotateY(0) translateY(0)';
        card.style.transition = 'transform 0.5s ease';
        setTimeout(() => { card.style.transition = ''; }, 500);
      });
    });
  }


  /* ============================================
     MAGNETIC BUTTONS
     ============================================ */
  const magneticBtns = document.querySelectorAll('.btn-primary, .btn-accent');

  magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px) scale(1.05)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
      btn.style.transition = 'transform 0.3s ease';
      setTimeout(() => { btn.style.transition = ''; }, 300);
    });
  });


  /* ============================================
     REVEAL SCALE — For images & special blocks
     ============================================ */
  const revealScaleEls = document.querySelectorAll('.reveal-scale');
  const scaleObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        scaleObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealScaleEls.forEach(el => scaleObs.observe(el));


  /* ============================================
     PARALLAX SECTIONS — Subtle depth (desktop only)
     ============================================ */
  if (window.innerWidth > 600) {
    const sections = document.querySelectorAll('.histoire, .engagements, .infos');

    function sectionParallax() {
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const visible = rect.top < window.innerHeight && rect.bottom > 0;

        if (visible) {
          const centerOffset = (rect.top + rect.height / 2 - window.innerHeight / 2);
          const deco = section.querySelector('.histoire-deco-leaf, .hero-croco-deco');
          if (deco) {
            deco.style.transform = `translateY(${centerOffset * 0.08}px)`;
          }
        }
      });
    }

    window.addEventListener('scroll', sectionParallax, { passive: true });
  }


  /* ============================================
     MOBILE CAROUSELS — dots + scroll sync
     Run once on load, no resize re-init needed.
     CSS handles showing/hiding carousel layout.
     ============================================ */
  if (window.innerWidth <= 600) {
    document.querySelectorAll('[data-carousel]').forEach(container => {
      const items = Array.from(container.children);
      if (items.length < 2) return;

      const dotsWrapper = document.createElement('div');
      dotsWrapper.className = 'carousel-dots';

      items.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        dot.addEventListener('click', () => {
          items[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });
        dotsWrapper.appendChild(dot);
      });

      container.after(dotsWrapper);

      container.addEventListener('scroll', () => {
        const scrollLeft = container.scrollLeft;
        const containerW = container.offsetWidth;
        let closest = 0;
        let minDist = Infinity;

        items.forEach((item, i) => {
          const center = item.offsetLeft + item.offsetWidth / 2 - scrollLeft - containerW / 2;
          const dist = Math.abs(center);
          if (dist < minDist) {
            minDist = dist;
            closest = i;
          }
        });

        dotsWrapper.querySelectorAll('.carousel-dot').forEach((d, i) => {
          d.classList.toggle('active', i === closest);
        });
      }, { passive: true });
    });
  }


  /* ============================================
     FACEBOOK WIDGET — responsive iframe
     ============================================ */
  const fbContainer = document.getElementById('fb-widget-container');
  if (fbContainer) {
    function loadFbWidget() {
      const w = Math.min(500, Math.floor(fbContainer.offsetWidth));
      const h = window.innerWidth <= 600 ? 500 : 600;
      fbContainer.innerHTML = `<iframe
        src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fcroco.nyons%2F%3Flocale%3Dfr_FR&tabs=timeline&width=${w}&height=${h}&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=false&appId"
        width="${w}" height="${h}"
        style="border:none; overflow:hidden;"
        scrolling="no"
        frameborder="0"
        allowfullscreen="true"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        loading="lazy"
        title="Publications Facebook Le Croc'O Nyons"></iframe>`;
    }

    // Load on first intersection (lazy)
    const fbObs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        loadFbWidget();
        fbObs.disconnect();
      }
    }, { rootMargin: '200px' });
    fbObs.observe(fbContainer);
  }


  /* ============================================
     CARTE TABS
     ============================================ */
  const carteTabs = document.querySelectorAll('.carte-tab');
  const cartePanels = document.querySelectorAll('.carte-panel');

  carteTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');

      carteTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      cartePanels.forEach(p => p.classList.remove('active'));
      const panel = document.getElementById('panel-' + target);
      if (panel) panel.classList.add('active');
    });
  });


  /* ============================================
     LIGHTBOX — Galerie photos
     ============================================ */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const galerieItems = document.querySelectorAll('.galerie-item img');
  let currentIdx = 0;

  function openLightbox(idx) {
    currentIdx = idx;
    lightboxImg.src = galerieItems[idx].src;
    lightboxImg.alt = galerieItems[idx].alt;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function navigate(dir) {
    currentIdx = (currentIdx + dir + galerieItems.length) % galerieItems.length;
    lightboxImg.style.transform = 'scale(0.9)';
    lightboxImg.style.opacity = '0';
    setTimeout(() => {
      lightboxImg.src = galerieItems[currentIdx].src;
      lightboxImg.alt = galerieItems[currentIdx].alt;
      lightboxImg.style.transform = '';
      lightboxImg.style.opacity = '';
    }, 150);
  }

  galerieItems.forEach((img, i) => {
    img.closest('.galerie-item').addEventListener('click', () => openLightbox(i));
  });

  if (lightbox) {
    lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox-prev').addEventListener('click', () => navigate(-1));
    lightbox.querySelector('.lightbox-next').addEventListener('click', () => navigate(1));

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    });

    // Swipe support mobile
    let touchStartX = 0;
    lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(diff) > 50) {
        navigate(diff > 0 ? -1 : 1);
      }
    }, { passive: true });
  }


  /* ============================================
     SMOOTH FADE-IN on page load
     ============================================ */
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.6s ease';
  requestAnimationFrame(() => {
    document.body.style.opacity = '1';
  });


  /* ============================================
     HIDE SCROLL INDICATOR on scroll
     ============================================ */
  const scrollIndicator = document.querySelector('.hero-scroll-indicator');
  if (scrollIndicator) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 100) {
        scrollIndicator.style.opacity = '0';
        scrollIndicator.style.transition = 'opacity 0.5s ease';
      } else {
        scrollIndicator.style.opacity = '';
      }
    }, { passive: true });
  }

});
