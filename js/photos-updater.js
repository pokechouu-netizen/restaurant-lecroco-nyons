/**
 * Photos Updater — Remplace les images du site par celles du Google Sheet
 * Le Google Sheet "CROCO" onglet PHOTOS contient :
 *   - colonne A : section (nom lisible de la section du site)
 *   - colonne B : nom_fichier (fichier local correspondant)
 *   - colonne C : lien_photo (URL directe de l'image de remplacement)
 * Si lien_photo est renseigné (ni vide, ni "-"), l'image correspondante est remplacée.
 */
(function () {
  var SHEET_ID = '12d_jRE5PRCqx6ebGAMjYhem_YRE2Z8l9AYtHvueKWbY';
  var GID = '326192332'; // onglet PHOTOS
  var CSV_URL =
    'https://docs.google.com/spreadsheets/d/' +
    SHEET_ID +
    '/gviz/tq?tqx=out:csv&gid=' +
    GID;

  function parseCSV(text) {
    var rows = [];
    var current = '';
    var inQuotes = false;
    var row = [];
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (inQuotes) {
        if (ch === '"' && text[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          row.push(current);
          current = '';
        } else if (ch === '\n' || ch === '\r') {
          if (ch === '\r' && text[i + 1] === '\n') i++;
          row.push(current);
          current = '';
          if (row.length > 1) rows.push(row);
          row = [];
        } else {
          current += ch;
        }
      }
    }
    row.push(current);
    if (row.length > 1) rows.push(row);
    return rows;
  }

  function convertPcloudLink(url) {
    // Convertir un lien pCloud de partage en lien direct via l'edge function
    var match = url.match(/e\.pcloud\.link\/publink\/show\?code=([A-Za-z0-9]+)/);
    if (match) {
      return '/pcloud-image?code=' + match[1];
    }
    return url;
  }

  function applyPhotos(rows) {
    var header = rows[0];
    var colFichier = header.indexOf('nom_fichier');
    var colPhoto = header.indexOf('lien_photo');
    if (colFichier === -1 || colPhoto === -1) return;

    for (var i = 1; i < rows.length; i++) {
      var fichier = (rows[i][colFichier] || '').trim();
      var url = (rows[i][colPhoto] || '').trim();
      if (!fichier || !url || url === '-' || url === '') continue;

      // Convertir les liens pCloud en liens directs
      url = convertPcloudLink(url);

      var images = document.querySelectorAll('img');
      for (var j = 0; j < images.length; j++) {
        var src = images[j].getAttribute('src') || '';
        if (src.indexOf(fichier) !== -1) {
          images[j].setAttribute('src', url);
          if (images[j].hasAttribute('srcset')) {
            images[j].removeAttribute('srcset');
          }
        }
      }
    }
  }

  fetch(CSV_URL)
    .then(function (r) { return r.text(); })
    .then(function (csv) {
      var rows = parseCSV(csv);
      if (rows.length > 1) applyPhotos(rows);
    })
    .catch(function (err) {
      console.warn('Photos updater: impossible de charger le Google Sheet', err);
    });
})();
