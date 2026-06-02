/* ============================================
   LE CROC'O — JAVASCRIPT PRINCIPAL
   Google Sheets integration + UI interactions
   Onglets : MENU_DU_JOUR, INFORMATIONS, CARTE, HORAIRES
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ============================================
     CONFIGURATION GOOGLE SHEET
     ============================================
     INSTRUCTIONS :
     1. Creer un Google Sheet avec les onglets : MENU_DU_JOUR, INFORMATIONS, CARTE, HORAIRES
     2. Publier le Google Sheet : Fichier > Partager > Publier sur le Web (tout le document, CSV)
     3. Copier l'ID du Google Sheet (la partie entre /d/ et /edit dans l'URL)
     4. Remplacer 'VOTRE_GOOGLE_SHEET_ID' ci-dessous par cet ID
  */
  const GOOGLE_SHEET_ID = '12d_jRE5PRCqx6ebGAMjYhem_YRE2Z8l9AYtHvueKWbY';

  // URLs pour chaque onglet (format CSV via Google Sheets publish)
  const SHEET_URLS = {
    menuDuJour:   `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=MENU_DU_JOUR`,
    informations: `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=INFORMATIONS`,
    carte:        `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=CARTE`,
    horaires:     `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=HORAIRES`,
    photos:       `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=PHOTOS`
  };


  /* ============================================
     PARSE CSV
     ============================================ */
  function parseCSV(csvText) {
    const rows = [];
    let current = '';
    let inQuotes = false;
    const lines = csvText.split('\n');

    for (const line of lines) {
      if (inQuotes) {
        current += '\n' + line;
      } else {
        current = line;
      }

      const quoteCount = (current.match(/"/g) || []).length;
      inQuotes = quoteCount % 2 !== 0;

      if (!inQuotes) {
        const row = [];
        let cell = '';
        let insideQuotes = false;

        for (let i = 0; i < current.length; i++) {
          const char = current[i];
          if (char === '"') {
            if (insideQuotes && current[i + 1] === '"') {
              cell += '"';
              i++;
            } else {
              insideQuotes = !insideQuotes;
            }
          } else if (char === ',' && !insideQuotes) {
            row.push(cell.trim());
            cell = '';
          } else {
            cell += char;
          }
        }
        row.push(cell.trim());

        if (row.some(c => c !== '')) {
          rows.push(row);
        }
        current = '';
      }
    }

    return rows;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Convertit "5.9 EUR" -> "5,90 e" (format Google Sheets -> affichage francais)
  function formatPrix(raw) {
    if (!raw) return '';
    const match = raw.match(/^([\d.]+)\s*EUR$/i);
    if (!match) return raw;
    const num = parseFloat(match[1]);
    if (isNaN(num)) return raw;
    return num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  }

  // "Glaces Artisanales" -> "glaces-artisanales"
  function slugify(str) {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }


  /* ============================================
     FETCH & RENDER : MENU DU JOUR
     Colonnes : Titre | Description | Prix | Formule
     ============================================ */
  async function loadMenuDuJour() {
    try {
      const response = await fetch(SHEET_URLS.menuDuJour);
      if (!response.ok) return;

      const csv = await response.text();
      const rows = parseCSV(csv);
      if (rows.length < 2) return;

      const dataRows = rows.slice(1);
      const firstRow = dataRows[0];

      if (firstRow) {
        const prix = firstRow[2];
        const formule = firstRow[3];

        if (prix) {
          const heroPrice = document.getElementById('hero-menu-price');
          const menuPrice = document.getElementById('menu-price');
          const prixFormate = formatPrix(prix);
          if (heroPrice) heroPrice.textContent = prixFormate;
          if (menuPrice) menuPrice.textContent = prixFormate;
        }

        if (formule) {
          const heroFormula = document.getElementById('hero-menu-formula');
          const menuFormula = document.getElementById('menu-formula');
          if (heroFormula) heroFormula.textContent = formule;
          if (menuFormula) menuFormula.innerHTML = '<p>' + escapeHTML(formule) + '</p>';
        }
      }

      const menuItems = document.getElementById('menu-items');
      if (menuItems) {
        let html = '';
        for (const row of dataRows) {
          const titre = row[0] || '';
          const description = row[1] || '';
          if (titre) {
            html += `
              <div class="menu-item">
                <div class="menu-item-title">${escapeHTML(titre)}</div>
                ${description ? `<div class="menu-item-desc">${escapeHTML(description)}</div>` : ''}
              </div>
            `;
          }
        }
        if (html) menuItems.innerHTML = html;
      }
    } catch (e) {
      // Fallback content stays visible
    }
  }


  /* ============================================
     FETCH & RENDER : INFORMATIONS
     Colonnes : Type | Valeur
     ============================================ */
  async function loadInformations() {
    try {
      const response = await fetch(SHEET_URLS.informations);
      if (!response.ok) return;

      const csv = await response.text();
      const rows = parseCSV(csv);
      if (rows.length < 2) return;

      const dataRows = rows.slice(1);
      const data = {};

      for (const row of dataRows) {
        const type = (row[0] || '').toLowerCase().trim();
        const valeur = (row[1] || '').trim();
        data[type] = valeur;
      }

      if (data['jour calme']) {
        const el = document.getElementById('jour-calme');
        if (el) el.textContent = data['jour calme'];
      }

      if (data['jour marché'] || data['jour marche']) {
        const el = document.getElementById('jour-marche');
        if (el) el.textContent = data['jour marché'] || data['jour marche'];
      }

      const message = data['message spécial'] || data['message special'] || data['message'];
      if (message) {
        const container = document.getElementById('info-message-special');
        const text = document.getElementById('info-message-text');
        if (container && text) {
          text.textContent = message;
          container.style.display = 'block';
        }
      }
    } catch (e) {
      // Fallback
    }
  }


  /* ============================================
     FETCH & RENDER : CARTE
     Colonnes : CATEGORIE | NOM_PLAT | DESCRIPTION | PRIX | ORDRE

     La colonne A pilote les onglets et sections :
       - "Plats"              -> onglet "Plats", section "Plats"
       - "Plats - Viandes"   -> onglet "Plats", section "Viandes"
       - "Desserts"          -> onglet "Desserts", section "Desserts"
       - "Nouveaute"         -> onglet "Nouveaute" cree automatiquement

     Le client peut ajouter n'importe quelle categorie :
     les onglets et sections sont generes dynamiquement depuis le Sheet.
     ============================================ */
  async function loadCarte() {
    try {
      const response = await fetch(SHEET_URLS.carte);
      if (!response.ok) return;

      const csv = await response.text();
      const rows = parseCSV(csv);
      if (rows.length < 2) return;

      const dataRows = rows.slice(1);

      // Trier par ORDRE (colonne E, index 4)
      dataRows.sort((a, b) => {
        const oA = parseInt(a[4]) || 999;
        const oB = parseInt(b[4]) || 999;
        return oA - oB;
      });

      // Grouper : parent (avant " - ") -> sous-categorie -> plats
      // L'ordre d'insertion dans la Map preserve l'ordre d'apparition dans le Sheet
      const tabsMap = new Map();

      for (const row of dataRows) {
        const categorie = (row[0] || '').trim();
        const nom       = (row[1] || '').trim();
        const description = (row[2] || '').trim();
        const prix      = (row[3] || '').trim();

        if (!nom) continue;

        const dashIdx = categorie.indexOf(' - ');
        const parent  = dashIdx !== -1 ? categorie.slice(0, dashIdx).trim() : categorie;
        const sousCat = dashIdx !== -1 ? categorie.slice(dashIdx + 3).trim() : categorie;

        if (!tabsMap.has(parent)) tabsMap.set(parent, new Map());
        if (!tabsMap.get(parent).has(sousCat)) tabsMap.get(parent).set(sousCat, []);
        tabsMap.get(parent).get(sousCat).push({ nom, description, prix });
      }

      if (tabsMap.size === 0) return;

      const tabsContainer   = document.querySelector('.carte-tabs');
      const contentContainer = document.getElementById('carte-content');
      if (!tabsContainer || !contentContainer) return;

      let tabsHTML   = '';
      let panelsHTML = '';
      let first = true;

      for (const [parent, categories] of tabsMap) {
        const slug = 'dyn-' + slugify(parent);
        const activeClass = first ? ' active' : '';
        const ariaSelected = first ? 'true' : 'false';

        tabsHTML += `<button class="carte-tab${activeClass}" data-tab="${slug}" role="tab" aria-selected="${ariaSelected}">${escapeHTML(parent)}</button>`;

        panelsHTML += `<div class="carte-panel${activeClass}" id="panel-${slug}" role="tabpanel">`;

        for (const [sousCat, plats] of categories) {
          panelsHTML += '<div class="carte-categorie">';
          panelsHTML += `<h3 class="carte-categorie-titre">${escapeHTML(sousCat)}</h3>`;
          panelsHTML += '<div class="carte-items">';

          for (const plat of plats) {
            panelsHTML += '<div class="carte-item">';
            panelsHTML += '<div class="carte-item-info">';
            panelsHTML += `<div class="carte-item-nom">${escapeHTML(plat.nom)}</div>`;
            if (plat.description) {
              panelsHTML += `<div class="carte-item-desc">${escapeHTML(plat.description)}</div>`;
            }
            panelsHTML += '</div>';
            if (plat.prix) {
              panelsHTML += `<div class="carte-item-prix">${escapeHTML(formatPrix(plat.prix))}</div>`;
            }
            panelsHTML += '</div>';
          }

          panelsHTML += '</div></div>';
        }

        panelsHTML += '</div>';
        first = false;
      }

      tabsContainer.innerHTML   = tabsHTML;
      contentContainer.innerHTML = panelsHTML;

      // Gestion des clics sur les onglets
      const newTabs   = tabsContainer.querySelectorAll('.carte-tab');
      const newPanels = contentContainer.querySelectorAll('.carte-panel');

      newTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          newTabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
          newPanels.forEach(p => p.classList.remove('active'));
          tab.classList.add('active');
          tab.setAttribute('aria-selected', 'true');
          const panel = document.getElementById('panel-' + tab.getAttribute('data-tab'));
          if (panel) panel.classList.add('active');
        });
      });

    } catch (e) {
      // Fallback content stays visible
    }
  }


  /* ============================================
     FETCH & RENDER : HORAIRES
     Colonnes : JOUR | MIDI | SOIR | ORDRE
     Trier par ORDRE
     ============================================ */
  async function loadHoraires() {
    try {
      const response = await fetch(SHEET_URLS.horaires);
      if (!response.ok) return;

      const csv = await response.text();
      const rows = parseCSV(csv);
      if (rows.length < 2) return;

      const dataRows = rows.slice(1);

      // Trier par ORDRE (colonne D, index 3)
      dataRows.sort((a, b) => {
        const oA = parseInt(a[3]) || 999;
        const oB = parseInt(b[3]) || 999;
        return oA - oB;
      });

      const container = document.getElementById('horaires-sheet');
      if (!container) return;

      let html = '<div class="jour-header"><span>Jour</span><span>Midi</span><span>Soir</span></div>';
      for (const row of dataRows) {
        const jour = (row[0] || '').trim();
        const midi = (row[1] || '').trim();
        const soir = (row[2] || '').trim();

        if (!jour) continue;

        const isFerme = midi.toLowerCase().includes('ferm') && (!soir || soir.toLowerCase().includes('ferm'));
        const midiClass = midi.toLowerCase().includes('ferm') ? ' ferme' : '';
        const soirClass = soir.toLowerCase().includes('ferm') ? ' ferme' : '';

        html += `<div class="jour${isFerme ? ' jour-closed' : ''}">`;
        html += `<span class="jour-name">${escapeHTML(jour)}</span>`;
        html += `<span class="jour-midi${midiClass}">${escapeHTML(midi || '—')}</span>`;
        html += `<span class="jour-soir${soirClass}">${escapeHTML(soir || '—')}</span>`;
        html += `</div>`;
      }

      container.innerHTML = html;

      // Highlight today
      const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const today = days[new Date().getDay()];
      container.querySelectorAll('.jour').forEach(el => {
        const dayName = el.querySelector('.jour-name');
        if (dayName && dayName.textContent === today) {
          el.classList.add('jour-today');
        }
      });
    } catch (e) {
      // Fallback content stays visible
    }
  }


  /* ============================================
     FETCH & RENDER : PHOTOS
     Colonnes : NOM_FICHIER | EMPLACEMENT | DESCRIPTION | LIEN_IMAGE
     Si LIEN_IMAGE (col D) contient une URL, remplace la photo sur le site
     Le client colle une URL directe d image (ex: imgbb, postimages, google drive)
     ============================================ */
  async function loadPhotos() {
    try {
      const response = await fetch(SHEET_URLS.photos);
      if (!response.ok) return;

      const csv = await response.text();
      const rows = parseCSV(csv);
      if (rows.length < 2) return;

      const dataRows = rows.slice(1);

      for (const row of dataRows) {
        const nomFichier = (row[0] || '').trim();
        const lienImage = (row[4] || '').trim(); // colonne E = lien_image

        if (!nomFichier || !lienImage) continue;
        // Ignorer si c est le placeholder
        if (lienImage === '-') continue;

        // Trouver toutes les images dont le src contient le nom du fichier
        const images = document.querySelectorAll('img');
        for (const img of images) {
          const src = img.getAttribute('src') || '';
          if (src.includes(nomFichier)) {
            img.setAttribute('src', lienImage);
            if (img.hasAttribute('srcset')) {
              img.removeAttribute('srcset');
            }
          }
        }
      }
    } catch (e) {
      // Fallback : les images locales restent affichees
    }
  }


  /* ============================================
     LANCER LES CHARGEMENTS
     ============================================ */
  if (GOOGLE_SHEET_ID !== 'VOTRE_GOOGLE_SHEET_ID') {
    loadMenuDuJour();
    loadInformations();
    loadCarte();
    loadHoraires();
    loadPhotos();
  }


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
    phoneOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closePhoneOverlay() {
    phoneOverlay.classList.remove('active');
    document.body.style.overflow = '';
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
          // Fallback pour les navigateurs sans clipboard API
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
