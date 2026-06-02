/* ============================================
   LE CROC'O — CMS RENDERER
   Fetche les fichiers data/*.json et injecte dans le HTML
   Remplace l'ancienne intégration Google Sheets
   ============================================ */

(async function () {

  function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function set(selector, text) {
    const el = document.querySelector(selector);
    if (el) el.textContent = text;
  }

  function setHTML(selector, html) {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = html;
  }

  function setAttr(selector, attr, val) {
    const el = document.querySelector(selector);
    if (el) el.setAttribute(attr, val);
  }

  async function fetchJSON(path) {
    try {
      const r = await fetch(path + '?v=' + Date.now());
      return r.ok ? r.json() : null;
    } catch (e) {
      return null;
    }
  }

  // ============================================
  // CHARGER TOUS LES JSON EN PARALLELE
  // ============================================
  const [info, menuDuJour, dishes, photos] = await Promise.all([
    fetchJSON('/data/info.json'),
    fetchJSON('/data/menu-du-jour.json'),
    fetchJSON('/data/dishes.json'),
    fetchJSON('/data/photos.json')
  ]);


  // ============================================
  // INFO : coordonnées, réseaux sociaux, horaires
  // ============================================
  if (info) {
    // Téléphone
    document.querySelectorAll('[href="tel:+33475261843"], .phone-number').forEach(el => {
      if (el.tagName === 'A') el.href = 'tel:' + info.phone;
      else el.textContent = info.phone_display;
    });
    document.querySelectorAll('.btn-phone-copy').forEach(el => {
      const num = info.phone.replace('+33', '0').replace(/\s/g,'');
      el.setAttribute('data-copy', num);
    });

    // Réseaux sociaux
    document.querySelectorAll('a[href*="instagram.com"]').forEach(a => {
      a.href = info.social.instagram;
    });
    document.querySelectorAll('a[href*="facebook.com"]').forEach(a => {
      a.href = info.social.facebook;
    });

    // Adresse
    document.querySelectorAll('a[href*="maps"]').forEach(a => {
      if (!a.href.includes('output=embed')) a.href = info.maps_url;
    });

    // Jours spéciaux
    const jourCalme = document.getElementById('jour-calme');
    if (jourCalme && info.jour_calme) jourCalme.textContent = info.jour_calme;

    const jourMarche = document.getElementById('jour-marche');
    if (jourMarche && info.jour_marche) jourMarche.textContent = info.jour_marche;

    // Message spécial
    if (info.message_special) {
      const container = document.getElementById('info-message-special');
      const text = document.getElementById('info-message-text');
      if (container && text) {
        text.textContent = info.message_special;
        container.style.display = 'block';
      }
    }

    // Footer copyright
    const footer = document.querySelector('.footer-copyright');
    if (footer && info.copyright) footer.textContent = info.copyright;

    // Horaires
    renderHoraires(info.horaires);
  }


  // ============================================
  // HORAIRES
  // ============================================
  function renderHoraires(horaires) {
    const container = document.getElementById('horaires-sheet');
    if (!container || !horaires) return;

    const days = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
    const today = days[new Date().getDay()];

    let html = '<div class="jour-header"><span>Jour</span><span>Midi</span><span>Soir</span></div>';
    for (const row of horaires) {
      const isFerme = row.midi.toLowerCase().includes('ferm') && row.soir.toLowerCase().includes('ferm');
      const midiClass = row.midi.toLowerCase().includes('ferm') ? ' ferme' : '';
      const soirClass = row.soir.toLowerCase().includes('ferm') ? ' ferme' : '';
      const todayClass = row.jour === today ? ' jour-today' : '';

      html += `<div class="jour${isFerme ? ' jour-closed' : ''}${todayClass}">`;
      html += `<span class="jour-name">${esc(row.jour)}</span>`;
      html += `<span class="jour-midi${midiClass}">${esc(row.midi || '—')}</span>`;
      html += `<span class="jour-soir${soirClass}">${esc(row.soir || '—')}</span>`;
      html += `</div>`;
    }
    container.innerHTML = html;
  }


  // ============================================
  // MENU DU JOUR
  // ============================================
  if (menuDuJour) {
    // Prix
    const menuPrice = document.getElementById('menu-price');
    const heroPrice = document.getElementById('hero-menu-price');
    if (menuPrice) menuPrice.textContent = menuDuJour.prix;
    if (heroPrice) heroPrice.textContent = menuDuJour.prix;

    // Formule
    const menuFormula = document.getElementById('menu-formula');
    const heroFormula = document.getElementById('hero-menu-formula');
    if (menuFormula) menuFormula.innerHTML = '<p>' + esc(menuDuJour.formule) + '</p>';
    if (heroFormula) heroFormula.textContent = menuDuJour.formule;

    // Items du menu
    const menuItems = document.getElementById('menu-items');
    if (menuItems && menuDuJour.items && menuDuJour.items.length) {
      const html = menuDuJour.items
        .filter(item => item.titre)
        .map(item => `
          <div class="menu-item">
            <div class="menu-item-title">${esc(item.titre)}</div>
            ${item.description ? `<div class="menu-item-desc">${esc(item.description)}</div>` : ''}
          </div>`)
        .join('');
      if (html) menuItems.innerHTML = html;
    }
  }


  // ============================================
  // LA CARTE — onglets dynamiques
  // ============================================
  if (dishes) {
    renderCarte(dishes);
  }

  function renderCarte(d) {
    const tabsContainer = document.querySelector('.carte-tabs');
    const contentContainer = document.getElementById('carte-content');
    if (!tabsContainer || !contentContainer) return;

    function slugify(s) {
      return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    function platsList(items, compact) {
      if (!items || !items.length) return '';
      const cls = compact ? 'carte-items carte-items-compact' : 'carte-items';
      return `<div class="${cls}">` +
        items.map(p => `
          <div class="carte-item">
            <div class="carte-item-info">
              <div class="carte-item-nom">${esc(p.nom)}</div>
              ${p.description ? `<div class="carte-item-desc">${esc(p.description)}</div>` : ''}
            </div>
            ${p.prix ? `<div class="carte-item-prix">${esc(p.prix)}</div>` : ''}
          </div>`).join('') +
        `</div>`;
    }

    function categorie(titre, items, compact) {
      if (!items || !items.length) return '';
      return `
        <div class="carte-categorie">
          <h3 class="carte-categorie-titre">${esc(titre)}</h3>
          ${platsList(items, compact)}
        </div>`;
    }

    // Définition des onglets
    const tabs = [
      {
        slug: 'plats', label: 'Le Menu',
        html: () => [
          categorie('Entrées', d.entrees),
          categorie('Plats', d.plats),
          categorie('Fromages', d.fromages)
        ].join('')
      },
      {
        slug: 'desserts', label: 'Desserts',
        html: () => categorie('Desserts', d.desserts)
      },
      {
        slug: 'glaces', label: 'Glaces & Sorbets',
        html: () => [
          categorie('Glaces Artisanales', d.glaces_artisanales, true),
          categorie('Sorbets Plein Fruit', d.sorbets, true),
          d.glaces_tarifs && d.glaces_tarifs.length ? `
            <div class="carte-glaces-tarifs">
              ${d.glaces_tarifs.map(t => `<span class="carte-tarif-tag">${esc(t.label)} — ${esc(t.prix)}</span>`).join('')}
            </div>` : ''
        ].join('')
      },
      {
        slug: 'boissons', label: 'Boissons',
        html: () => [
          categorie('Alcools', d.boissons_alcools, true),
          categorie('Sans Alcool', d.boissons_sans_alcool, true),
          categorie('Les Vins', d.vins, true),
          categorie('Boissons Chaudes', d.boissons_chaudes, true)
        ].join('')
      },
      {
        slug: 'enfants', label: 'Enfants & Goûter',
        html: () => [
          categorie('Menu Enfant', d.enfants_menu),
          categorie('À l\'heure du Goûter', d.gouter)
        ].join('')
      }
    ];

    // Générer les onglets et panels
    let tabsHTML = '';
    let panelsHTML = '';

    tabs.forEach((tab, i) => {
      const active = i === 0 ? ' active' : '';
      tabsHTML += `<button class="carte-tab${active}" data-tab="${tab.slug}" role="tab" aria-selected="${i === 0}">${esc(tab.label)}</button>`;
      panelsHTML += `<div class="carte-panel${active}" id="panel-${tab.slug}" role="tabpanel">${tab.html()}</div>`;
    });

    tabsContainer.innerHTML = tabsHTML;
    contentContainer.innerHTML = panelsHTML;

    // Click handlers
    const newTabs = tabsContainer.querySelectorAll('.carte-tab');
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
  }


  // ============================================
  // PHOTOS
  // ============================================
  if (photos) {
    // Hero background
    if (photos.hero) {
      const heroImg = document.querySelector('.hero-bg-image');
      if (heroImg) heroImg.src = photos.hero;
    }

    // Photo histoire
    if (photos.histoire) {
      const histImg = document.querySelector('.histoire-image-wrapper img');
      if (histImg) histImg.src = photos.histoire;
    }

    // Galerie
    if (photos.galerie && photos.galerie.length) {
      const galerieGrid = document.querySelector('.galerie-grid');
      if (galerieGrid) {
        galerieGrid.innerHTML = photos.galerie.map(p => `
          <div class="galerie-item">
            <img src="${esc(p.src)}" alt="${esc(p.alt)}" loading="lazy">
          </div>`).join('');
      }
    }
  }

  // Signaler que le rendu est terminé (pour main.js)
  document.dispatchEvent(new CustomEvent('cms:rendered'));

})();
