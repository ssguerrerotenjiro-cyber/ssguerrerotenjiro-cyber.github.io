// Temple of Strength — página de descarga.
// Rellena los datos de config.js y anima los pétalos de la portada.
(function () {
  'use strict';
  var C = window.TEMPLO || {};

  // -- Datos de config.js ---------------------------------------------------
  function rellenar() {
    var listo = C.apk && C.apk.indexOf('ssguerrerotenjiro-cyber') === -1;
    document.querySelectorAll('[data-apk]').forEach(function (a) {
      if (listo) {
        a.href = C.apk;
        a.removeAttribute('aria-disabled');
      } else {
        a.href = '#instalar';
        a.setAttribute('aria-disabled', 'true');
        var t = a.querySelector('.texto-boton');
        if (t) t.textContent = 'Descarga disponible muy pronto';
      }
    });
    document.querySelectorAll('[data-cfg]').forEach(function (el) {
      var v = C[el.getAttribute('data-cfg')];
      if (v) el.textContent = v;
    });
    document.querySelectorAll('[data-correo]').forEach(function (a) {
      if (!C.correo) return;
      a.href = 'mailto:' + C.correo;
      if (!a.hasAttribute('data-texto-fijo')) a.textContent = C.correo;
    });
    document.querySelectorAll('[data-detalles]').forEach(function (el) {
      var partes = [];
      if (C.version) partes.push('Versión ' + C.version);
      if (C.tamano) partes.push(C.tamano);
      if (C.android) partes.push(C.android);
      el.innerHTML = '';
      partes.forEach(function (p) {
        var s = document.createElement('span');
        s.textContent = p;
        el.appendChild(s);
      });
    });
    var huella = document.getElementById('huella');
    if (huella) {
      if (C.sha256) {
        huella.hidden = false;
        huella.querySelector('code').textContent = C.sha256;
      } else {
        huella.hidden = true;
      }
    }
    document.querySelectorAll('[data-web]').forEach(function (el) {
      if (C.web) {
        el.hidden = false;
        var a = el.querySelector('a');
        if (a) a.href = C.web;
      } else {
        el.hidden = true;
      }
    });
    document.querySelectorAll('[data-sin-web]').forEach(function (el) { el.hidden = !!C.web; });
    document.querySelectorAll('[data-anio]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  function copiarHuella() {
    var b = document.querySelector('[data-copiar]');
    if (!b) return;
    b.addEventListener('click', function () {
      var texto = C.sha256 || '';
      if (!texto) return;
      var fin = function () {
        b.textContent = 'Copiada';
        setTimeout(function () { b.textContent = 'Copiar huella'; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(fin, function () {});
      }
    });
  }

  // -- Pétalos de cerezo (el mismo dibujo que en el chat de Tenshi) ----------
  function petalos() {
    var lienzo = document.querySelector('canvas.petalos');
    if (!lienzo || !lienzo.getContext) return;
    var ctx = lienzo.getContext('2d');
    var reducir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var w = 0, h = 0, dpr = 1, n = 18, visible = true;

    function hash(a, b) { var x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); }

    function medir() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = lienzo.getBoundingClientRect();
      w = r.width; h = r.height;
      lienzo.width = Math.round(w * dpr);
      lienzo.height = Math.round(h * dpr);
      n = w < 600 ? 14 : 24;
    }

    function petalo(s) {
      ctx.beginPath();
      ctx.moveTo(0, s * 0.72);
      ctx.bezierCurveTo(-s * 0.44, s * 0.36, -s * 0.46, -s * 0.36, -s * 0.17, -s * 0.62);
      ctx.quadraticCurveTo(-s * 0.06, -s * 0.68, 0, -s * 0.5);
      ctx.quadraticCurveTo(s * 0.06, -s * 0.68, s * 0.17, -s * 0.62);
      ctx.bezierCurveTo(s * 0.46, -s * 0.36, s * 0.44, s * 0.36, 0, s * 0.72);
      ctx.closePath();
    }

    function pintar(t) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < n; i++) {
        var prof = hash(i, 3);
        var s = 8 + 12 * prof;
        var vel = 0.03 + 0.045 * hash(i, 7);
        var f = ((t * vel + hash(7, i)) % 1 + 1) % 1;
        var y = -30 + f * (h + 60);
        var vaiven = Math.sin(t * (0.5 + hash(i, 13) * 0.6) + i) * (16 + 22 * hash(13, i));
        var x = ((hash(i, 11) * w + vaiven + f * 40 * (hash(i, 17) - 0.3)) % (w + 40) + w + 40) % (w + 40) - 20;
        var giro = t * (0.4 + hash(i, 19) * 0.9) * (hash(19, i) > 0.5 ? 1 : -1) + i;
        var vuelta = Math.cos(t * (0.8 + hash(i, 23) * 1.2) + i * 2);
        var alfa = (0.38 + 0.45 * prof) * Math.min(1, f * 8, (1 - f) * 6);
        if (alfa <= 0.01) continue;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(giro);
        ctx.scale(1, 0.35 + 0.65 * Math.abs(vuelta));
        if (prof > 0.55) {
          var brillo = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 1.3);
          brillo.addColorStop(0, 'rgba(255,143,192,' + (alfa * 0.32) + ')');
          brillo.addColorStop(1, 'rgba(255,143,192,0)');
          ctx.fillStyle = brillo;
          ctx.fillRect(-s * 1.3, -s * 1.3, s * 2.6, s * 2.6);
        }
        var dorso = vuelta < 0;
        var g = ctx.createLinearGradient(0, s * 0.6, 0, -s * 0.6);
        g.addColorStop(0, dorso ? '#E58AB0' : '#FFE4EF');
        g.addColorStop(0.55, dorso ? '#F3A6C6' : '#FFC2DA');
        g.addColorStop(1, dorso ? '#D9799F' : '#F79BC0');
        ctx.globalAlpha = alfa;
        petalo(s);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.globalAlpha = alfa * 0.35;
        ctx.strokeStyle = '#E07AA6';
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(0, s * 0.5); ctx.lineTo(0, -s * 0.3); ctx.stroke();
        ctx.restore();
      }
    }

    medir();
    window.addEventListener('resize', medir);
    if (reducir) { pintar(6); return; }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(lienzo);
    }
    var inicio = performance.now();
    function cuadro(ahora) {
      if (visible && !document.hidden) pintar(3 + (ahora - inicio) / 1000);
      requestAnimationFrame(cuadro);
    }
    requestAnimationFrame(cuadro);
  }

  rellenar();
  copiarHuella();
  petalos();
})();
