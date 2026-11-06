/*
 * Tema de color de la página. Se carga en la cabecera, antes de pintar, para
 * que no parpadee. Usa la misma clave que la versión web de la app
 * (shared_preferences guarda "flutter.<clave>" con el valor en JSON), así el
 * tema que se elige aquí o en la app web es el mismo.
 */
(function () {
  var FONDOS = {
    tradicional: '#06050A', oscuro: '#0B0B0D', claro: '#F6F3FA', sakura: '#0A0609',
    jade: '#050A09', oceano: '#04070D', carmesi: '#0B0506'
  };
  var CLAVE = 'flutter.tema_templo';
  var raiz = document.documentElement;

  function leer() {
    try {
      var v = localStorage.getItem(CLAVE);
      if (v) {
        v = JSON.parse(v);
        if (v === 'automatico' || FONDOS[v]) return v;
      }
    } catch (e) { /* sin almacenamiento */ }
    return 'tradicional';
  }

  function resolver(e) {
    if (e !== 'automatico') return e;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'claro' : 'tradicional';
  }

  function aplicar(e) {
    var t = resolver(e);
    if (t === 'tradicional') raiz.removeAttribute('data-tema');
    else raiz.setAttribute('data-tema', t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', FONDOS[t]);
  }

  var eleccion = leer();
  aplicar(eleccion);

  if (window.matchMedia) {
    var consulta = window.matchMedia('(prefers-color-scheme: light)');
    var alCambiar = function () { if (eleccion === 'automatico') aplicar(eleccion); };
    if (consulta.addEventListener) consulta.addEventListener('change', alCambiar);
    else if (consulta.addListener) consulta.addListener(alCambiar);
  }

  window.TemploTema = {
    eleccion: function () { return eleccion; },
    elegir: function (e) {
      if (e !== 'automatico' && !FONDOS[e]) return;
      eleccion = e;
      try { localStorage.setItem(CLAVE, JSON.stringify(e)); } catch (x) { /* sin almacenamiento */ }
      aplicar(e);
    }
  };
})();
