/* Painterly procedural tarot art — canvas, soft light + texture (no copyright art) V1.1.0 */
(function (global) {
  const cache = new Map();

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function noiseLayer(ctx, w, h, rnd, alpha) {
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (rnd() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = (alpha * 255) | 0;
    }
    ctx.putImageData(img, 0, 0);
  }

  function softVignette(ctx, w, h, color, strength) {
    const g = ctx.createRadialGradient(w * 0.5, h * 0.42, w * 0.1, w * 0.5, h * 0.5, w * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, color.replace('ALPHA', String(strength)));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function paintWash(ctx, w, h, c0, c1, c2, rnd) {
    const base = ctx.createLinearGradient(0, 0, 0, h);
    base.addColorStop(0, c0);
    base.addColorStop(0.45, c1);
    base.addColorStop(1, c2);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    // soft blobs of light
    for (let i = 0; i < 5; i++) {
      const x = rnd() * w;
      const y = rnd() * h * 0.7;
      const r = w * (0.18 + rnd() * 0.28);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,245,255,${0.08 + rnd() * 0.12})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function glowOrb(ctx, x, y, r, rgba) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function paintMoon(ctx, x, y, r, rnd) {
    glowOrb(ctx, x, y, r * 1.8, 'rgba(230,210,255,0.35)');
    const g = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.1, x, y, r);
    g.addColorStop(0, '#fff8ff');
    g.addColorStop(0.55, '#e8d4f8');
    g.addColorStop(1, '#a888c8');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // crescent cut
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x + r * 0.38, y - r * 0.08, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    // soft edge relight
    glowOrb(ctx, x - r * 0.2, y, r * 0.9, 'rgba(255,240,255,0.15)');
  }

  function paintSun(ctx, x, y, r) {
    glowOrb(ctx, x, y, r * 2.2, 'rgba(255,220,140,0.4)');
    const g = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, r * 0.1, x, y, r);
    g.addColorStop(0, '#fff6d0');
    g.addColorStop(0.5, '#f0c860');
    g.addColorStop(1, '#c87830');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,150,0.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r * 1.15, y + Math.sin(a) * r * 1.15);
      ctx.lineTo(x + Math.cos(a) * r * 1.55, y + Math.sin(a) * r * 1.55);
      ctx.stroke();
    }
  }

  function paintStar(ctx, x, y, r, color) {
    glowOrb(ctx, x, y, r * 2, color.replace('1)', '0.35)'));
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 === 0 ? r : r * 0.4;
      const px = x + Math.cos(a) * rad;
      const py = y + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  function paintCup(ctx, x, y, s, tone) {
    glowOrb(ctx, x, y - s * 0.2, s * 1.4, 'rgba(160,200,240,0.3)');
    ctx.fillStyle = tone;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.45, y - s * 0.5);
    ctx.quadraticCurveTo(x - s * 0.55, y + s * 0.1, x - s * 0.15, y + s * 0.25);
    ctx.lineTo(x - s * 0.12, y + s * 0.55);
    ctx.lineTo(x + s * 0.12, y + s * 0.55);
    ctx.lineTo(x + s * 0.15, y + s * 0.25);
    ctx.quadraticCurveTo(x + s * 0.55, y + s * 0.1, x + s * 0.45, y - s * 0.5);
    ctx.closePath();
    ctx.fill();
    const liq = ctx.createLinearGradient(x, y - s * 0.45, x, y);
    liq.addColorStop(0, 'rgba(200,230,255,0.85)');
    liq.addColorStop(1, 'rgba(100,150,210,0.5)');
    ctx.fillStyle = liq;
    ctx.fillRect(x - s * 0.32, y - s * 0.42, s * 0.64, s * 0.28);
    glowOrb(ctx, x, y - s * 0.7, s * 0.45, 'rgba(255,255,255,0.35)');
  }

  function paintWand(ctx, x, y, s, tone) {
    glowOrb(ctx, x, y - s * 0.5, s, 'rgba(255,160,100,0.3)');
    ctx.strokeStyle = tone;
    ctx.lineWidth = Math.max(3, s * 0.12);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.15, y + s * 0.65);
    ctx.quadraticCurveTo(x + s * 0.1, y, x, y - s * 0.55);
    ctx.stroke();
    // flame
    const g = ctx.createRadialGradient(x, y - s * 0.7, 0, x, y - s * 0.7, s * 0.4);
    g.addColorStop(0, '#fff0c0');
    g.addColorStop(0.4, '#ff9a50');
    g.addColorStop(1, 'rgba(255,80,40,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y - s * 0.7, s * 0.22, s * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function paintSword(ctx, x, y, s, tone) {
    glowOrb(ctx, x, y, s * 1.2, 'rgba(180,200,230,0.28)');
    const blade = ctx.createLinearGradient(x - s * 0.2, y - s * 0.7, x + s * 0.2, y + s * 0.4);
    blade.addColorStop(0, '#f0f4ff');
    blade.addColorStop(0.5, tone);
    blade.addColorStop(1, '#607090');
    ctx.fillStyle = blade;
    ctx.beginPath();
    ctx.moveTo(x, y - s * 0.75);
    ctx.lineTo(x + s * 0.12, y + s * 0.2);
    ctx.lineTo(x, y + s * 0.35);
    ctx.lineTo(x - s * 0.12, y + s * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c8a878';
    ctx.fillRect(x - s * 0.28, y + s * 0.18, s * 0.56, s * 0.08);
    ctx.fillRect(x - s * 0.07, y + s * 0.26, s * 0.14, s * 0.35);
  }

  function paintPentacle(ctx, x, y, s, tone) {
    glowOrb(ctx, x, y, s * 1.3, 'rgba(180,220,140,0.3)');
    const g = ctx.createRadialGradient(x - s * 0.2, y - s * 0.2, s * 0.1, x, y, s * 0.7);
    g.addColorStop(0, '#f0e8b0');
    g.addColorStop(0.5, tone);
    g.addColorStop(1, '#4a6840');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, s * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,240,180,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, s * 0.48, 0, Math.PI * 2);
    ctx.stroke();
    paintStar(ctx, x, y, s * 0.32, 'rgba(255,245,200,0.95)');
  }

  function majorMotif(ctx, w, h, card, rnd) {
    const cx = w * 0.5;
    const cy = h * 0.48;
    const id = card.id;
    if (id === 'major-0') {
      // path horizon + star
      ctx.fillStyle = 'rgba(80,60,120,0.35)';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.72);
      ctx.quadraticCurveTo(w * 0.5, h * 0.55, w, h * 0.75);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();
      paintStar(ctx, cx, cy - h * 0.08, w * 0.12, 'rgba(255,240,200,0.95)');
      glowOrb(ctx, cx + w * 0.18, cy + h * 0.1, w * 0.2, 'rgba(255,200,220,0.25)');
    } else if (id === 'major-1' || id === 'major-2') {
      paintMoon(ctx, cx + (id === 'major-2' ? 0 : -w * 0.05), cy - h * 0.02, w * 0.22, rnd);
      for (let i = 0; i < 3; i++) paintStar(ctx, w * (0.2 + i * 0.25), h * (0.22 + rnd() * 0.1), 4 + rnd() * 3, 'rgba(255,240,210,0.8)');
    } else if (id === 'major-3' || id === 'major-17' || id === 'major-19') {
      if (id === 'major-19') paintSun(ctx, cx, cy, w * 0.22);
      else if (id === 'major-17') {
        paintStar(ctx, cx, cy - h * 0.05, w * 0.16, 'rgba(200,230,255,0.95)');
        paintStar(ctx, cx - w * 0.22, cy + h * 0.12, w * 0.06, 'rgba(255,220,240,0.85)');
        paintStar(ctx, cx + w * 0.2, cy + h * 0.08, w * 0.05, 'rgba(255,240,200,0.85)');
      } else {
        // empress — bloom
        glowOrb(ctx, cx, cy, w * 0.35, 'rgba(255,180,200,0.35)');
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          glowOrb(ctx, cx + Math.cos(a) * w * 0.18, cy + Math.sin(a) * w * 0.14, w * 0.1, 'rgba(255,160,190,0.4)');
        }
        paintStar(ctx, cx, cy, w * 0.1, 'rgba(255,230,240,0.9)');
      }
    } else if (id === 'major-13' || id === 'major-16') {
      // dramatic tower/death sky
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = `rgba(255,200,160,${0.15 + rnd() * 0.2})`;
        ctx.lineWidth = 1 + rnd() * 2;
        ctx.beginPath();
        const x0 = w * (0.3 + rnd() * 0.4);
        ctx.moveTo(x0, h * 0.15);
        ctx.lineTo(x0 + (rnd() - 0.5) * w * 0.2, h * 0.55);
        ctx.stroke();
      }
      glowOrb(ctx, cx, cy, w * 0.28, id === 'major-16' ? 'rgba(255,120,80,0.35)' : 'rgba(140,100,180,0.4)');
    } else if (id === 'major-18') {
      paintMoon(ctx, cx, cy, w * 0.26, rnd);
    } else if (id === 'major-21' || id === 'major-10') {
      // wreath / wheel
      ctx.strokeStyle = 'rgba(220,200,255,0.55)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, w * 0.28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, w * 0.18, 0, Math.PI * 2);
      ctx.stroke();
      paintStar(ctx, cx, cy, w * 0.1, 'rgba(255,240,200,0.9)');
    } else {
      // generic major — luminous sigil
      glowOrb(ctx, cx, cy, w * 0.32, 'rgba(200,170,255,0.4)');
      paintStar(ctx, cx, cy, w * 0.14, 'rgba(255,235,255,0.92)');
      for (let i = 0; i < 5; i++) {
        paintStar(ctx, rnd() * w, rnd() * h * 0.55, 2 + rnd() * 3, 'rgba(255,240,220,0.7)');
      }
    }
  }

  function minorMotif(ctx, w, h, card, rnd) {
    const cx = w * 0.5;
    const cy = h * 0.46;
    const s = w * 0.38;
    const suit = card.suit;
    const tone =
      suit === 'wands' ? '#e87850' :
      suit === 'cups' ? '#6898c8' :
      suit === 'swords' ? '#8898b8' : '#88a868';
    // atmospheric suit wash
    glowOrb(ctx, cx, cy, w * 0.4, suit === 'wands' ? 'rgba(255,140,80,0.22)' :
      suit === 'cups' ? 'rgba(120,170,230,0.25)' :
      suit === 'swords' ? 'rgba(160,180,210,0.22)' : 'rgba(140,190,120,0.22)');

    const n = card.num;
    const court = { P: 1, N: 1, Q: 1, K: 1, A: 1 };
    const count = court[n] ? 1 : Math.min(4, parseInt(n, 10) || 1);

    if (suit === 'cups') {
      if (count === 1) paintCup(ctx, cx, cy, s, tone);
      else {
        for (let i = 0; i < Math.min(count, 3); i++) {
          paintCup(ctx, cx + (i - 1) * w * 0.22, cy + (i === 1 ? -h * 0.04 : h * 0.06), s * 0.55, tone);
        }
      }
    } else if (suit === 'wands') {
      if (count === 1) paintWand(ctx, cx, cy, s, tone);
      else {
        for (let i = 0; i < Math.min(count, 3); i++) {
          paintWand(ctx, cx + (i - 1) * w * 0.2, cy, s * 0.6, tone);
        }
      }
    } else if (suit === 'swords') {
      if (count === 1) paintSword(ctx, cx, cy, s, tone);
      else {
        for (let i = 0; i < Math.min(count, 3); i++) {
          paintSword(ctx, cx + (i - 1) * w * 0.18, cy + i * 2, s * 0.55, tone);
        }
      }
    } else {
      if (count === 1) paintPentacle(ctx, cx, cy, s, tone);
      else {
        for (let i = 0; i < Math.min(count, 3); i++) {
          paintPentacle(ctx, cx + (i - 1) * w * 0.2, cy + (i === 1 ? -8 : 6), s * 0.5, tone);
        }
      }
    }
    // court crown hint
    if (n === 'Q' || n === 'K') {
      paintStar(ctx, cx, cy - h * 0.28, w * 0.06, 'rgba(255,230,180,0.9)');
    }
  }

  function paletteFor(card) {
    if (card.arcana === 'major') {
      return ['#2a1848', '#4a3078', '#1a1030'];
    }
    const map = {
      wands: ['#3a2018', '#6a3828', '#1a100c'],
      cups: ['#182838', '#2a4868', '#0c141e'],
      swords: ['#1c2430', '#3a4860', '#0e1218'],
      pentacles: ['#1c2818', '#3a5030', '#0e160c']
    };
    return map[card.suit] || ['#241838', '#3a2860', '#140c20'];
  }

  function renderFace(card, w, h) {
    const key = 'face:' + card.id + ':' + w + 'x' + h;
    if (cache.has(key)) return cache.get(key);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const rnd = mulberry32(hashStr(card.id + '-face'));
    const [c0, c1, c2] = paletteFor(card);
    paintWash(ctx, w, h, c0, c1, c2, rnd);

    // parchment oval stage
    const stage = ctx.createRadialGradient(w * 0.5, h * 0.45, w * 0.05, w * 0.5, h * 0.5, w * 0.55);
    stage.addColorStop(0, 'rgba(255,245,235,0.22)');
    stage.addColorStop(0.55, 'rgba(230,210,245,0.1)');
    stage.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = stage;
    ctx.fillRect(0, 0, w, h);

    if (card.arcana === 'major') majorMotif(ctx, w, h, card, rnd);
    else minorMotif(ctx, w, h, card, rnd);

    // film grain
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    noiseLayer(ctx, w, h, rnd, 0.12);
    ctx.restore();

    softVignette(ctx, w, h, 'rgba(10,4,24,ALPHA)', 0.55);
    // warm top light
    glowOrb(ctx, w * 0.5, h * 0.08, w * 0.45, 'rgba(255,230,250,0.12)');

    // ornate inner frame hint
    ctx.strokeStyle = 'rgba(230,210,255,0.28)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(6, 6, w - 12, h - 12);

    const url = canvas.toDataURL('image/jpeg', 0.92);
    cache.set(key, url);
    return url;
  }

  function renderBack(w, h) {
    const key = 'back:' + w + 'x' + h;
    if (cache.has(key)) return cache.get(key);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const rnd = mulberry32(0x0ac1e);
    paintWash(ctx, w, h, '#1a1030', '#3a2468', '#12081f', rnd);
    // velvet center
    glowOrb(ctx, w * 0.5, h * 0.45, w * 0.42, 'rgba(140,90,200,0.45)');
    glowOrb(ctx, w * 0.5, h * 0.55, w * 0.35, 'rgba(80,40,120,0.5)');
    paintMoon(ctx, w * 0.48, h * 0.42, w * 0.16, rnd);
    paintStar(ctx, w * 0.72, h * 0.28, w * 0.04, 'rgba(255,230,180,0.9)');
    paintStar(ctx, w * 0.28, h * 0.62, w * 0.03, 'rgba(200,220,255,0.85)');
    paintStar(ctx, w * 0.68, h * 0.64, w * 0.025, 'rgba(255,200,220,0.8)');
    // filigree ring
    ctx.strokeStyle = 'rgba(220,190,255,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.45, w * 0.28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(220,190,255,0.2)';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.45, w * 0.34, 0, Math.PI * 2);
    ctx.stroke();
    // border
    ctx.strokeStyle = 'rgba(201,182,228,0.5)';
    ctx.lineWidth = 3;
    ctx.strokeRect(5, 5, w - 10, h - 10);
    ctx.strokeStyle = 'rgba(232,212,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(11, 11, w - 22, h - 22);
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    noiseLayer(ctx, w, h, rnd, 0.14);
    ctx.restore();
    softVignette(ctx, w, h, 'rgba(8,2,20,ALPHA)', 0.6);
    const url = canvas.toDataURL('image/jpeg', 0.92);
    cache.set(key, url);
    return url;
  }

  global.OracleArt = { renderFace, renderBack };
})(typeof window !== 'undefined' ? window : global);
