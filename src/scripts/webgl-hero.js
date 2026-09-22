import * as THREE from 'three';

export function initHeroScene(canvas) {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 13);

  function accentColor() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    return new THREE.Color(v || '#4C8DF6');
  }

  var COUNT = 46;
  var positions = new Float32Array(COUNT * 3);
  var basePos = [];
  for (var i = 0; i < COUNT; i++) {
    var p = new THREE.Vector3(
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 6
    );
    basePos.push(p);
    positions[i * 3] = p.x; positions[i * 3 + 1] = p.y; positions[i * 3 + 2] = p.z;
  }

  var pointGeo = new THREE.BufferGeometry();
  pointGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  var pointMat = new THREE.PointsMaterial({
    color: accentColor(), size: 0.11, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  var points = new THREE.Points(pointGeo, pointMat);

  var MAX_LINKS = COUNT * 4;
  var linePositions = new Float32Array(MAX_LINKS * 2 * 3);
  var lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  var lineMat = new THREE.LineBasicMaterial({
    color: accentColor(), transparent: true, opacity: 0.16,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  var lines = new THREE.LineSegments(lineGeo, lineMat);

  var LINK_DIST = 3.6;
  var group = new THREE.Group();
  group.add(points); group.add(lines);
  scene.add(group);

  var mouseX = 0, mouseY = 0, targetRotX = 0, targetRotY = 0;
  var curRotX = 0, curRotY = 0;

  function onMove(x, y) {
    var w = window.innerWidth, h = window.innerHeight;
    mouseX = (x / w) * 2 - 1;
    mouseY = (y / h) * 2 - 1;
    targetRotY = mouseX * 0.35;
    targetRotX = mouseY * 0.22;
  }
  window.addEventListener('mousemove', function (e) { onMove(e.clientX, e.clientY); }, { passive: true });

  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect();
    var w = rect.width, h = rect.height || w * 0.6;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  var themeObserver = new MutationObserver(function () {
    pointMat.color = accentColor();
    lineMat.color = accentColor();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  var clock = new THREE.Clock();
  var frame;
  var visible = true;
  var io = new IntersectionObserver(function (entries) {
    visible = entries[0] && entries[0].isIntersecting;
  });
  io.observe(canvas);

  function tick() {
    frame = requestAnimationFrame(tick);
    if (!visible) return;
    var t = clock.getElapsedTime();

    curRotX += (targetRotX - curRotX) * 0.05;
    curRotY += (targetRotY - curRotY) * 0.05;
    group.rotation.x = curRotX + Math.sin(t * 0.08) * 0.05;
    group.rotation.y = curRotY + t * 0.045;

    var pos = pointGeo.attributes.position.array;
    for (var i = 0; i < COUNT; i++) {
      var bp = basePos[i];
      pos[i * 3] = bp.x + Math.sin(t * 0.4 + i) * 0.18;
      pos[i * 3 + 1] = bp.y + Math.cos(t * 0.35 + i * 1.3) * 0.18;
      pos[i * 3 + 2] = bp.z + Math.sin(t * 0.3 + i * 0.7) * 0.18;
    }
    pointGeo.attributes.position.needsUpdate = true;

    var lp = lineGeo.attributes.position.array;
    var linkCount = 0;
    for (var a = 0; a < COUNT && linkCount < MAX_LINKS; a++) {
      for (var b = a + 1; b < COUNT && linkCount < MAX_LINKS; b++) {
        var dx = pos[a * 3] - pos[b * 3];
        var dy = pos[a * 3 + 1] - pos[b * 3 + 1];
        var dz = pos[a * 3 + 2] - pos[b * 3 + 2];
        var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < LINK_DIST) {
          var o = linkCount * 6;
          lp[o] = pos[a * 3]; lp[o + 1] = pos[a * 3 + 1]; lp[o + 2] = pos[a * 3 + 2];
          lp[o + 3] = pos[b * 3]; lp[o + 4] = pos[b * 3 + 1]; lp[o + 5] = pos[b * 3 + 2];
          linkCount++;
        }
      }
    }
    lineGeo.setDrawRange(0, linkCount * 2);
    lineGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }
  tick();

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { cancelAnimationFrame(frame); } else { tick(); }
  });
}
