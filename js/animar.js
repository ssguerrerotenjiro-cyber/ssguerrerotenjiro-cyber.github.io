// Temple of Strength — lo que se mueve en la página (fuera del cielo 3D).
// Entradas al desplazarse, cifras que cuentan, barras que se llenan, Tenshi que
// escribe, la ceremonia, el templo que crece, las capturas de la app y la barra
// de descarga en el teléfono. Con «reducir movimiento» todo aparece completo.
(function () {
  'use strict';
  var raiz = document.documentElement;
  var reducir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CLAVE_QUIETO = 'templo.quieto';
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function cl(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function eo(x) { x = cl(x); return 1 - Math.pow(1 - x, 3); }
  function miles(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

  // -- Pausa de la animación (se recuerda en este navegador) -----------------
  var guardado = null;
  try { guardado = localStorage.getItem(CLAVE_QUIETO); } catch (e) { /* sin almacenamiento */ }
  if (guardado === '1') raiz.classList.add('quieto');
  var bPausa = $('[data-pausa]');
  function marcarPausa() {
    if (!bPausa) return;
    var q = raiz.classList.contains('quieto');
    bPausa.setAttribute('aria-pressed', String(q));
    bPausa.setAttribute('aria-label', q ? 'Reanudar la animación' : 'Pausar la animación');
    bPausa.title = q ? 'Reanudar la animación' : 'Pausar la animación';
    var t = $('.texto-pausa', bPausa);
    if (t) t.textContent = q ? 'Reanudar' : 'Pausar';
  }
  if (bPausa) {
    if (reducir) bPausa.hidden = true;
    bPausa.addEventListener('click', function () {
      var q = !raiz.classList.contains('quieto');
      raiz.classList.toggle('quieto', q);
      try { localStorage.setItem(CLAVE_QUIETO, q ? '1' : '0'); } catch (e) { /* sin almacenamiento */ }
      marcarPausa();
    });
    marcarPausa();
  }

  // Sin animaciones: todo visible y completo desde el principio.
  var animar = !reducir && 'IntersectionObserver' in window;
  if (animar) raiz.classList.add('anima');

  // -- El título entra palabra por palabra -----------------------------------
  var h1 = $('.portada h1');
  if (h1 && animar) {
    var palabras = h1.textContent.trim().split(/\s+/);
    h1.setAttribute('aria-label', h1.textContent.trim());
    h1.textContent = '';
    palabras.forEach(function (p, i) {
      var s = document.createElement('span');
      s.className = 'palabra';
      s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--i', i);
      s.textContent = p;
      h1.appendChild(s);
      if (i < palabras.length - 1) h1.appendChild(document.createTextNode(' '));
    });
  }

  // -- Piezas que se animan al entrar en pantalla ----------------------------
  function escribir(el, d) {
    var tx = el.getAttribute('data-escribe');
    if (!animar) { el.textContent = tx; return; }
    var t0 = performance.now() + d;
    (function paso(ahora) {
      var u = cl((ahora - t0) / (tx.length * 32));
      el.textContent = tx.slice(0, Math.floor(u * tx.length));
      if (u < 1) requestAnimationFrame(paso); else el.classList.add('listo');
    })(performance.now());
  }
  function contar(el, d) {
    var fin = +el.getAttribute('data-cuenta');
    if (!animar) { el.textContent = miles(fin); return; }
    var t0 = performance.now() + d, dur = 1400;
    (function paso(ahora) {
      var u = eo((ahora - t0) / dur);
      el.textContent = miles(Math.round(u * fin));
      if (u < 1) requestAnimationFrame(paso);
    })(performance.now());
  }
  function activar(el) {
    el.classList.add('visto');
    $$('[data-llena]', el).concat(el.hasAttribute('data-llena') ? [el] : []).forEach(function (b) {
      b.style.setProperty('--llena', b.getAttribute('data-llena'));
    });
    $$('[data-cuenta]', el).forEach(function (c) { contar(c, +(c.getAttribute('data-retraso') || 0)); });
    $$('[data-escribe]', el).forEach(function (c) { escribir(c, +(c.getAttribute('data-retraso') || 0)); });
    if (el.hasAttribute('data-ceremonia')) ceremonia(el);
    if (el.hasAttribute('data-templo')) templo.auto();
  }
  var piezas = $$('[data-revela]');
  if (animar) {
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { activar(e.target); obs.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    piezas.forEach(function (p) { obs.observe(p); });
  }

  // -- La ceremonia: ensō, sello, cifras y el XP que cruza al nivel 5 --------
  function ceremonia(sec) {
    var lienzo = $('canvas.enso', sec), sello = $('.hanko', sec), xp = $('.xp-barra', sec), nivel = $('.xp-nivel', sec);
    var ctx = lienzo && lienzo.getContext ? lienzo.getContext('2d') : null;
    function rnd(i, k) { var x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }
    function dibujar(p, oro) {
      if (!ctx) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2), r = lienzo.getBoundingClientRect();
      lienzo.width = Math.round(r.width * dpr); lienzo.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var cx = r.width / 2, cy = r.height / 2, R = Math.min(r.width, r.height) * 0.4;
      var N = 150, a0 = -1.95, vuelta = Math.PI * 1.9, m = Math.floor(N * p);
      var cs = getComputedStyle(raiz);
      var c1 = oro ? cs.getPropertyValue('--oro').trim() || '#D9A441' : cs.getPropertyValue('--violeta').trim() || '#8B5CF6';
      ctx.lineCap = 'round';
      ctx.strokeStyle = c1;
      for (var i = 0; i < m; i++) {
        var u = i / N, a = a0 + vuelta * u, a2 = a0 + vuelta * (i + 1.4) / N;
        var w = R * 0.11 * (0.25 + 0.75 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.25 + 0.08)), 0.55)) * (1 - 0.55 * u);
        var seco = u > 0.62 ? (rnd(i, 9) < (u - 0.62) * 1.7 ? 0.25 : 1) : 1;
        ctx.globalAlpha = 0.92 * seco;
        ctx.lineWidth = w;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.lineTo(cx + Math.cos(a2) * R, cy + Math.sin(a2) * R); ctx.stroke();
        if (i % 2 === 0) {
          var R2 = R + w * 0.75 * (rnd(i, 10) - 0.5) * 2;
          ctx.lineWidth = Math.max(0.6, w * 0.12); ctx.globalAlpha = 0.45;
          ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R2, cy + Math.sin(a) * R2); ctx.lineTo(cx + Math.cos(a2) * R2, cy + Math.sin(a2) * R2); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }
    if (!animar) {
      dibujar(1, true);
      if (xp) xp.style.width = '22%';
      if (nivel) { nivel.textContent = 'Nivel 5 · Discípulo'; nivel.classList.add('oro'); }
      sec.classList.add('subio');
      return;
    }
    var t0 = performance.now();
    (function paso(ahora) {
      var l = (ahora - t0) / 1000;
      var sube = l > 3.0;
      dibujar(eo((l - 0.2) / 1.5), sube);
      if (sello) sello.classList.toggle('puesto', l > 1.3);
      if (xp) {
        var a = eo((l - 2.0) / 1.0), b = eo((l - 3.3) / 0.9);
        xp.style.width = (sube ? b * 22 : 62 + 38 * a) + '%';
      }
      if (nivel && sube && !sec.classList.contains('subio')) {
        nivel.textContent = 'Nivel 5 · Discípulo'; nivel.classList.add('oro'); sec.classList.add('subio');
      }
      if (l < 4.6) requestAnimationFrame(paso);
    })(t0);
    window.addEventListener('resize', function () { dibujar(1, sec.classList.contains('subio')); });
  }

  // -- El templo que crece: un control y ocho imágenes reales ----------------
  var templo = (function () {
    var sec = $('[data-templo]');
    if (!sec) return { auto: function () {} };
    var rango = $('input[type="range"]', sec), img = $('img.templo-img', sec), etiqueta = $('.templo-cuenta', sec), nombre = $('.templo-pieza', sec);
    var PASOS = [
      ['0 kg', 'Solo la sala principal. Todo empieza aquí.'],
      ['5 t', 'El sendero: las primeras piedras marcan el camino.'],
      ['25 t', 'El torii: la puerta se levanta.'],
      ['60 t', 'El estanque: el agua refleja la luna.'],
      ['120 t', 'La campana: suena al amanecer.'],
      ['220 t', 'El jardín seco: arena rastrillada y tres rocas.'],
      ['400 t', 'La pagoda: cinco pisos sobre el bosque.'],
      ['750 t', 'El bosque de bambú cierra el templo.']
    ];
    var cargadas = {};
    function precargar(i) {
      if (i < 0 || i > 7 || cargadas[i]) return;
      cargadas[i] = new Image();
      cargadas[i].src = 'img/app/templo-' + i + '.webp';
    }
    function mostrar(i) {
      i = Math.max(0, Math.min(7, i | 0));
      rango.value = i;
      img.src = 'img/app/templo-' + i + '.webp';
      img.alt = 'El templo de la Casa con ' + i + ' de 7 piezas levantadas';
      etiqueta.textContent = PASOS[i][0] + ' · ' + i + ' de 7 piezas';
      nombre.textContent = PASOS[i][1];
      rango.setAttribute('aria-valuetext', PASOS[i][0] + ', ' + i + ' de 7 piezas');
      precargar(i + 1);
    }
    var tocado = false, reloj = null;
    rango.addEventListener('input', function () { tocado = true; if (reloj) clearInterval(reloj); mostrar(+rango.value); });
    mostrar(+rango.value || 0);
    return {
      auto: function () {
        if (!animar || tocado || raiz.classList.contains('quieto')) { if (!tocado) mostrar(7); return; }
        for (var i = 0; i < 8; i++) precargar(i);
        var i = 0;
        mostrar(0);
        reloj = setInterval(function () {
          i++;
          if (tocado || i > 7) { clearInterval(reloj); return; }
          mostrar(i);
        }, 1100);
      }
    };
  })();

  // -- Capturas de la app: carrusel con flechas y puntos ----------------------
  $$('[data-carrusel]').forEach(function (car) {
    var pista = $('.pista', car), tarjetas = $$('.pista > li', car), puntos = $('.puntos', car);
    var ant = $('[data-ant]', car), sig = $('[data-sig]', car);
    var botones = tarjetas.map(function (t, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Ver captura ' + (i + 1) + ' de ' + tarjetas.length);
      b.addEventListener('click', function () { ir(i); });
      puntos.appendChild(b);
      return b;
    });
    function actual() {
      var c = pista.scrollLeft + pista.clientWidth / 2, mejor = 0, d = 1e9;
      tarjetas.forEach(function (t, i) {
        var m = t.offsetLeft + t.offsetWidth / 2, dd = Math.abs(m - c);
        if (dd < d) { d = dd; mejor = i; }
      });
      return mejor;
    }
    function ir(i) {
      i = Math.max(0, Math.min(tarjetas.length - 1, i));
      var t = tarjetas[i];
      pista.scrollTo({ left: t.offsetLeft - (pista.clientWidth - t.offsetWidth) / 2, behavior: reducir ? 'auto' : 'smooth' });
    }
    function marcar() {
      var a = actual();
      botones.forEach(function (b, i) { b.setAttribute('aria-current', i === a ? 'true' : 'false'); });
      tarjetas.forEach(function (t, i) { t.classList.toggle('activa', i === a); });
      ant.disabled = a === 0;
      sig.disabled = a === tarjetas.length - 1;
    }
    ant.addEventListener('click', function () { ir(actual() - 1); });
    sig.addEventListener('click', function () { ir(actual() + 1); });
    pista.addEventListener('scroll', function () { window.requestAnimationFrame(marcar); }, { passive: true });
    pista.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); ir(actual() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); ir(actual() - 1); }
    });
    window.addEventListener('resize', marcar);
    marcar();
  });

  // -- Cuerpo de Ranked: hombre o mujer ---------------------------------------
  $$('[data-cuerpo]').forEach(function (fig) {
    var img = $('img', fig);
    $$('[data-genero]', fig).forEach(function (b) {
      b.addEventListener('click', function () {
        var g = b.getAttribute('data-genero');
        $$('[data-genero]', fig).forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        fig.classList.add('cambia');
        setTimeout(function () {
          img.src = 'img/app/cuerpo-' + g + '.webp';
          img.alt = g === 'm' ? 'Cuerpo de mujer de Ranked, cada músculo con el color de su rango' : 'Cuerpo de hombre de Ranked, cada músculo con el color de su rango';
          fig.classList.remove('cambia');
        }, reducir ? 0 : 180);
      });
    });
  });

  // Sin animaciones, todo se completa al cargar (después de preparar el templo).
  if (!animar) piezas.forEach(activar);

  // -- Barra de descarga en el teléfono ---------------------------------------
  var barra = $('.barra-descarga');
  if (barra && 'IntersectionObserver' in window) {
    var vistos = new Set();
    var vigilar = $$('.portada .descarga, .cierre .descarga, #instalar');
    var o2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) vistos.add(e.target); else vistos.delete(e.target); });
      var pasoPortada = window.scrollY > window.innerHeight * 0.6;
      barra.classList.toggle('mostrar', pasoPortada && vistos.size === 0);
    });
    vigilar.forEach(function (v) { o2.observe(v); });
    window.addEventListener('scroll', function () {
      var pasoPortada = window.scrollY > window.innerHeight * 0.6;
      barra.classList.toggle('mostrar', pasoPortada && vistos.size === 0);
    }, { passive: true });
  }
})();
