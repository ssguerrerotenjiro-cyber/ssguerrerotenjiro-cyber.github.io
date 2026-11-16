// Temple of Strength — el cielo de la portada en 3D.
// La luna creciente con el torii, montañas, niebla, estrellas y su reflejo en
// el agua, dibujados con WebGL. Toma los colores del tema elegido y se ubica
// donde está el logo (.luna-grande), así el diseño lo decide la hoja de estilos.
// Sin WebGL queda el logo de siempre; con «reducir movimiento» o la animación
// en pausa se dibuja un solo cuadro quieto.
(function () {
  'use strict';
  var portada = document.querySelector('.portada');
  var lienzo = document.querySelector('canvas.cielo3d');
  var caja = document.querySelector('.portada .luna-grande');
  if (!portada || !lienzo || !caja) return;

  var gl = null;
  try {
    gl = lienzo.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
  } catch (e) { gl = null; }
  if (!gl) return;

  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision mediump float;',
    'uniform vec2 uRes;uniform float uT,uS,uRot,uTilt,uHor,uRev,uClaro;uniform vec2 uC;uniform vec3 uL;',
    'uniform vec3 uBg,uAc,uLi,uM1,uM2,uLuna;',
    'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}',
    'float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*noise(p);p=p*2.03+vec2(7.1,3.7);a*=.5;}return s;}',
    'float caps(vec3 p,vec3 a,vec3 b,float r){vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-r;}',
    'vec3 giro(vec3 p){float c=cos(uTilt),s=sin(uTilt);p=vec3(p.x,c*p.y+s*p.z,-s*p.y+c*p.z);c=cos(uRot);s=sin(uRot);return vec3(c*p.x-s*p.z,p.y,s*p.x+c*p.z);}',
    'float luna(vec3 p){float d=max(length(p.xy)-1.,.9-length(p.xy-vec2(.30,.10)));vec2 w=vec2(d,abs(p.z)-.075);return min(max(w.x,w.y),0.)+length(max(w,0.))-.03;}',
    'float torii(vec3 p){',
    ' float d=caps(p,vec3(-.491,.328,0.),vec3(-.048,.392,0.),.042);',
    ' d=min(d,caps(p,vec3(-.048,.392,0.),vec3(.395,.328,0.),.042));',
    ' d=min(d,caps(p,vec3(-.419,.228,0.),vec3(.323,.228,0.),.031));',
    ' d=min(d,caps(p,vec3(-.348,.043,0.),vec3(.252,.043,0.),.029));',
    ' d=min(d,caps(p,vec3(-.391,.228,0.),vec3(-.334,-.393,0.),.034));',
    ' d=min(d,caps(p,vec3(.295,.228,0.),vec3(.238,-.393,0.),.034));',
    ' d=min(d,caps(p,vec3(-.048,.228,0.),vec3(-.048,.043,0.),.022));return d;}',
    'vec2 mapa(vec3 p){p=giro(p);float a=luna(p),b=torii(p);return a<b?vec2(a,1.):vec2(b,2.);}',
    'vec3 entorno(vec3 r){vec3 c=mix(uBg*.6,uAc*.45,smoothstep(-.4,.9,r.y));',
    ' c+=vec3(1.)*smoothstep(.10,0.,abs(r.y-.42-.25*r.x))*smoothstep(.95,.1,abs(r.x))*1.4;',
    ' c+=uLi*pow(max(dot(r,normalize(vec3(-.7,.1,.5))),0.),6.)*.9;return c;}',
    'vec4 pieza(vec2 uv){vec2 q=(uv-uC)/uS;if(dot(q,q)>1.42)return vec4(0.);',
    ' vec3 ro=vec3(0.,0.,4.),rd=normalize(vec3(q,-4.));float t=2.7,md=9.;vec2 h=vec2(9.);bool ok=false;',
    ' for(int i=0;i<48;i++){h=mapa(ro+rd*t);md=min(md,h.x);if(h.x<.003){ok=true;break;}t+=h.x*.88;if(t>5.4)break;}',
    ' if(!ok){return vec4(uLi*exp(-md*11.)*.55,0.);}',
    ' vec3 p=ro+rd*t;vec2 e=vec2(.003,0.);',
    ' vec3 n=normalize(vec3(mapa(p+e.xyy).x-mapa(p-e.xyy).x,mapa(p+e.yxy).x-mapa(p-e.yxy).x,mapa(p+e.yyx).x-mapa(p-e.yyx).x));',
    ' vec3 po=giro(p);float nv=max(dot(n,-rd),0.),fr=pow(1.-nv,4.),df=max(dot(n,uL),0.);',
    ' vec3 hv=normalize(uL-rd);float sp=pow(max(dot(n,hv),0.),70.);vec3 rf=entorno(reflect(rd,n));vec3 c;',
    ' if(h.y<1.5){vec3 b=mix(uLuna,uLi,clamp((po.x-po.y)*.42+.5,0.,1.));',
    '  c=b*(.22+.84*df)+b*uAc*(1.-df)*.35+rf*(.07+.55*fr)+sp*1.05;}',
    ' else{c=uLi*(.55+.55*df)+rf*(.05+.5*fr)+sp*.8;}',
    ' return vec4(c,1.);}',
    'float cresta(float x,float s){return noise(vec2(x*1.25+s,s))*.62+noise(vec2(x*3.7+s*2.,s+4.))*.26+noise(vec2(x*9.+s,1.))*.08;}',
    'vec3 fondo(vec2 uv){float y=uv.y-uHor;',
    ' vec3 alto=mix(uBg,uBg*.45,1.-uClaro);vec3 bajo=mix(uBg,uM1,.55);',
    ' vec3 col=mix(bajo,alto,smoothstep(0.,1.7,y));',
    ' col+=uAc*exp(-max(y,0.)*2.4)*mix(.22,.10,uClaro);',
    ' vec2 g=uv*34.;vec2 id=floor(g);float hh=hash(id);vec2 o=(vec2(hash(id+3.1),hash(id+7.7))-.5)*.7;',
    ' float st=step(.90,hh)*smoothstep(.085,0.,length(fract(g)-.5-o));st*=.45+.55*sin(uT*1.4+hh*50.);',
    ' col+=st*vec3(.85,.8,1.)*smoothstep(.1,.6,y)*(1.-uClaro);',
    ' float d=length(uv-uC)/uS;',
    ' col+=uAc*(.36*exp(-d*d*.6)+.09*exp(-d*.85))*uRev*mix(1.,.5,uClaro);',
    ' float lz=exp(-abs(uv.x-uC.x)*1.3)*uRev;',
    ' vec3 c1=mix(uM1,uBg,.15),c2=mix(uM2,uM1,.35),c3=mix(uM2,uBg,.55);',
    ' float h1=.10+.30*cresta(uv.x*.9+uT*.004,3.);float m=1.-smoothstep(h1-.004,h1+.004,y);',
    ' col=mix(col,c1+uAc*.20*exp(-max(h1-y,0.)*26.)*lz,m);',
    ' float h2=.03+.24*cresta(uv.x*1.3+10.+uT*.007,8.);m=1.-smoothstep(h2-.004,h2+.004,y);',
    ' col=mix(col,c2+uAc*.16*exp(-max(h2-y,0.)*34.)*lz,m);',
    ' float h3=-.02+.17*cresta(uv.x*1.9+30.+uT*.011,15.);m=1.-smoothstep(h3-.004,h3+.004,y);',
    ' col=mix(col,c3+uAc*.10*exp(-max(h3-y,0.)*44.)*lz,m);',
    ' float ni=fbm(vec2(uv.x*1.3+uT*.045,y*5.5-uT*.02));col+=mix(uLi,vec3(1.),uClaro)*ni*ni*exp(-abs(y-.07)*5.5)*mix(.5,.35,uClaro);',
    ' return col;}',
    'vec3 mundo(vec2 uv){vec3 c=fondo(uv);vec4 o=pieza(uv);return mix(c,o.rgb,o.a*uRev)+(1.-o.a)*o.rgb*uRev;}',
    'void main(){vec2 uv=(gl_FragCoord.xy-.5*uRes)/min(uRes.x,uRes.y)*2.;vec3 col;',
    ' if(uv.y<uHor){float dp=uHor-uv.y;',
    '  vec2 m=vec2(uv.x+.014*sin(dp*52.-uT*1.5+uv.x*7.)*(.35+dp),uHor+dp*1.04+.012*sin(dp*88.-uT*2.1));',
    '  col=mix(mundo(m)*.42*exp(-dp*.75)+uBg*.6,mundo(m)*.7+uBg*.3,uClaro);',
    '  col+=uLi*exp(-dp*70.)*.14;',
    '  vec4 o=pieza(uv);col=mix(col,o.rgb,o.a*uRev);}',
    ' else col=mundo(uv);',
    ' vec2 v=gl_FragCoord.xy/uRes-.5;col*=1.-dot(v,v)*mix(.75,.25,uClaro);',
    ' col=mix(1.-exp(-col*1.35),col,uClaro);',
    ' col+=(hash(gl_FragCoord.xy+fract(uT)*91.7)-.5)*.03;',
    ' gl_FragColor=vec4(col,1.);}'
  ].join('\n');

  function sombreador(tipo, fuente) {
    var s = gl.createShader(tipo);
    gl.shaderSource(s, fuente);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  var vs = sombreador(gl.VERTEX_SHADER, VS), fs = sombreador(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var att = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(att);
  gl.vertexAttribPointer(att, 2, gl.FLOAT, false, 0, 0);
  var U = {};
  ['uRes', 'uT', 'uS', 'uRot', 'uTilt', 'uHor', 'uRev', 'uClaro', 'uC', 'uL', 'uBg', 'uAc', 'uLi', 'uM1', 'uM2', 'uLuna']
    .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

  // A partir de aquí la portada es 3D: se esconden el logo, las montañas y las
  // estrellas dibujadas a mano (siguen en la página como respaldo).
  portada.classList.add('con-3d');

  // -- Colores del tema ---------------------------------------------------
  function rgb(valor, defecto) {
    var v = (valor || '').trim() || defecto;
    var m = /^#([0-9a-f]{6})$/i.exec(v);
    if (!m) return rgb(defecto, '#000000');
    var n = parseInt(m[1], 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  var colores = {};
  function leerTema() {
    var cs = getComputedStyle(document.documentElement);
    colores.bg = rgb(cs.getPropertyValue('--noche'), '#06050A');
    colores.ac = rgb(cs.getPropertyValue('--violeta'), '#8B5CF6');
    colores.li = rgb(cs.getPropertyValue('--lila'), '#B79CFF');
    colores.m1 = rgb(cs.getPropertyValue('--monte1'), '#1B1233');
    colores.m2 = rgb(cs.getPropertyValue('--monte2'), '#110B20');
    colores.claro = document.documentElement.getAttribute('data-tema') === 'claro' ? 1 : 0;
    // En el tema claro la luna se tiñe del color del tema para que se vea.
    colores.luna = colores.claro ? [0.78, 0.72, 0.95] : [0.957, 0.945, 0.98];
    if (colores.claro) { colores.m1 = rgb('#C9BBE4'); colores.m2 = rgb('#B3A2D8'); }
    pedirCuadro();
  }
  leerTema();
  new MutationObserver(leerTema).observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] });

  // -- Tamaño, con un tope de píxeles que baja solo si el equipo no da --------
  var W = 1, H = 1, escala = 1, tope = 0;
  var movil = Math.min(screen.width, screen.height) < 700;
  var presupuesto = movil ? 520000 : 950000;
  function medir() {
    var r = portada.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var e = dpr * (tope || 1);
    if (W * H * e * e > presupuesto) e = Math.sqrt(presupuesto / (W * H));
    escala = e;
    lienzo.width = Math.round(W * e);
    lienzo.height = Math.round(H * e);
    gl.viewport(0, 0, lienzo.width, lienzo.height);
    pedirCuadro();
  }
  window.addEventListener('resize', medir);

  // -- Interacción: la luna mira hacia el puntero y gira con el desplazamiento --
  var mira = { x: 0, y: 0 }, miraSuave = { x: 0, y: 0 }, giroExtra = 0, giroExtraSuave = 0;
  portada.addEventListener('pointermove', function (e) {
    var r = portada.getBoundingClientRect();
    mira.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    mira.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  portada.addEventListener('pointerleave', function () { mira.x = 0; mira.y = 0; });
  // Tocar la luna la hace dar una vuelta.
  caja.addEventListener('click', function () { giroExtra += Math.PI * 2; pedirCuadro(); });

  // -- Reloj ---------------------------------------------------------------
  var reducir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visible = true, inicio = performance.now(), T = 0, pendiente = false, quietoEn = 6.5;
  var raiz = document.documentElement;
  function quieto() { return reducir || raiz.classList.contains('quieto'); }

  function eo(x) { x = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1 - x, 3); }

  function pintar(t) {
    var asp = Math.min(W, H);
    var r = caja.getBoundingClientRect(), p = portada.getBoundingClientRect();
    // Centro y tamaño de la luna, en las coordenadas del sombreador.
    var cx = (r.left + r.width / 2 - p.left), cy = (r.top + r.height / 2 - p.top);
    var ux = (cx - W / 2) / asp * 2, uy = (H / 2 - cy) / asp * 2;
    var s = (r.width * 0.5) / asp * 2 * 0.86;
    // El horizonte va donde estaban las montañas dibujadas.
    var monte = Math.min(Math.max(160, W * 0.30), 340);
    var hor = (H / 2 - (H - monte * 0.42)) / asp * 2;
    miraSuave.x += (mira.x - miraSuave.x) * 0.06;
    miraSuave.y += (mira.y - miraSuave.y) * 0.06;
    giroExtraSuave += (giroExtra - giroExtraSuave) * 0.06;
    var scroll = window.scrollY || 0;
    var entrada = -Math.PI * 2 * (1 - eo(t / 4.2));
    var rot = 0.5 * Math.sin(t * 0.42 + 0.6) + entrada + miraSuave.x * 0.45 + scroll * 0.0035 + giroExtraSuave;
    var tilt = 0.06 + 0.1 * Math.sin(t * 0.31) - miraSuave.y * 0.25;
    var lx = Math.sin(t * 0.37) * 0.85, ly = 0.5, lz = 0.8, ll = Math.sqrt(lx * lx + ly * ly + lz * lz);
    gl.uniform2f(U.uRes, lienzo.width, lienzo.height);
    gl.uniform1f(U.uT, t);
    gl.uniform2f(U.uC, ux, uy + 0.012 * Math.sin(t * 0.8));
    gl.uniform1f(U.uS, s);
    gl.uniform1f(U.uRot, rot);
    gl.uniform1f(U.uTilt, tilt);
    gl.uniform1f(U.uHor, hor);
    gl.uniform1f(U.uRev, eo((t - 0.2) / 2.2));
    gl.uniform1f(U.uClaro, colores.claro);
    gl.uniform3f(U.uL, lx / ll, ly / ll, lz / ll);
    gl.uniform3fv(U.uBg, colores.bg);
    gl.uniform3fv(U.uAc, colores.ac);
    gl.uniform3fv(U.uLi, colores.li);
    gl.uniform3fv(U.uM1, colores.m1);
    gl.uniform3fv(U.uM2, colores.m2);
    gl.uniform3fv(U.uLuna, colores.luna);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // Si los cuadros salen caros, se baja la resolución (hasta la mitad). Si aun
  // así el equipo no da (sin aceleración gráfica), se vuelve al logo dibujado,
  // para que la página nunca se sienta pesada.
  var muestras = 0, suma = 0, ultimo = 0, apagado = false;
  function apagar() {
    apagado = true;
    portada.classList.remove('con-3d');
    lienzo.style.display = 'none';
    var x = gl.getExtension('WEBGL_lose_context');
    if (x) x.loseContext();
  }
  function ajustarCalidad(dt) {
    if (dt <= 0 || T < 0.6) return; // el primer cuadro compila el sombreador
    suma += Math.min(dt, 400); muestras++;
    if (muestras < 12) return;
    var media = suma / muestras; muestras = 0; suma = 0;
    var t = tope || 1;
    if (media > 26 && t > 0.5) { tope = Math.max(0.5, t * (media > 60 ? 0.6 : 0.8)); medir(); }
    else if (media > 55 && t <= 0.5) apagar();
  }

  function cuadro(ahora) {
    pendiente = false;
    if (apagado || !visible || document.hidden) return;
    if (quieto()) {
      pintar(quietoEn);
      return;
    }
    if (ultimo) ajustarCalidad(ahora - ultimo);
    ultimo = ahora;
    T = (ahora - inicio) / 1000;
    pintar(T);
    pedirCuadro();
  }
  function pedirCuadro() {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(cuadro);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      if (visible) { ultimo = 0; pedirCuadro(); }
    }).observe(portada);
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { ultimo = 0; pedirCuadro(); } });
  window.addEventListener('scroll', function () { if (quieto()) pedirCuadro(); }, { passive: true });
  // La pausa de la portada (js/animar.js) cambia la clase .quieto en <html>.
  new MutationObserver(function () {
    if (!quieto()) { inicio = performance.now() - quietoEn * 1000; ultimo = 0; }
    else quietoEn = T || quietoEn;
    pedirCuadro();
  }).observe(raiz, { attributes: true, attributeFilter: ['class'] });

  // Si el contexto se pierde (pasa en móviles con poca memoria), se vuelve al logo.
  lienzo.addEventListener('webglcontextlost', function (e) { e.preventDefault(); portada.classList.remove('con-3d'); });

  medir();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);
})();
