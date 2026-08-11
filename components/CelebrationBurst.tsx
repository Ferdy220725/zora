"use client";

type CelebrationVariant = 'love' | 'trophy' | 'rocket' | 'cap' | 'bolt';

interface VariantConfig {
  icon: string;
  decor: string[];
  labels: string[];
  glowColor: string;
  glowColor2: string;
  labelBg: string;
  labelColor: string;
  motion: 'pop' | 'rise';
}

const VARIANTS: Record<CelebrationVariant, VariantConfig> = {
  love: {
    icon: '💖',
    decor: ['✨', '⭐', '💛', '✨', '⭐', '💫', '✨', '⭐'],
    labels: ['Zora • Tugas selesai!', 'Zora • Mantap!', 'Zora • Kerja bagus!'],
    glowColor: 'rgba(250,199,117,0.5)',
    glowColor2: 'rgba(212,83,126,0.22)',
    labelBg: '#fff4e0',
    labelColor: '#7a4a1f',
    motion: 'pop',
  },
  trophy: {
    icon: '🏆',
    decor: ['✨', '⭐', '🎉', '✨', '⭐', '🎊'],
    labels: ['Zora • Pencapaian baru!', 'Zora • Level up!'],
    glowColor: 'rgba(250,199,117,0.5)',
    glowColor2: 'rgba(212,140,20,0.22)',
    labelBg: '#fff4e0',
    labelColor: '#7a4a1f',
    motion: 'pop',
  },
  rocket: {
    icon: '🚀',
    decor: ['✨', '💨', '⭐', '✨', '💨', '⭐'],
    labels: ['Zora • Meluncur selesai!', 'Zora • Terus melesat!'],
    glowColor: 'rgba(120,170,255,0.5)',
    glowColor2: 'rgba(70,110,220,0.22)',
    labelBg: '#e6f0ff',
    labelColor: '#1f3d7a',
    motion: 'rise',
  },
  cap: {
    icon: '🎓',
    decor: ['✨', '📘', '⭐', '✨', '📗', '⭐'],
    labels: ['Zora • Satu langkah lebih maju!', 'Zora • Mantap, lanjutkan!'],
    glowColor: 'rgba(150,200,140,0.5)',
    glowColor2: 'rgba(80,140,70,0.22)',
    labelBg: '#eaf6e6',
    labelColor: '#2e5a24',
    motion: 'pop',
  },
  bolt: {
    icon: '⚡',
    decor: ['✨', '🔥', '⭐', '✨', '🔥', '⭐'],
    labels: ['Zora • Semangat terus!', 'Zora • Konsisten banget!'],
    glowColor: 'rgba(255,180,90,0.55)',
    glowColor2: 'rgba(220,90,40,0.25)',
    labelBg: '#fff0e0',
    labelColor: '#8a3a10',
    motion: 'pop',
  },
};

function injectStylesOnce() {
  if (document.getElementById('zora-celebration-styles')) return;
  const style = document.createElement('style');
  style.id = 'zora-celebration-styles';
  style.textContent = `
    @keyframes zoraPop {
      0% { transform: translate(-50%,-50%) scale(0.3) rotate(-8deg); opacity: 0; filter: blur(4px); }
      100% { transform: translate(-50%,-50%) scale(1) rotate(0deg); opacity: 1; filter: blur(0px); }
    }
    @keyframes zoraRise {
      0% { transform: translate(-50%,-50%) translateY(30px) scale(0.4) rotate(-6deg); opacity: 0; filter: blur(4px); }
      60% { transform: translate(-50%,-50%) translateY(-8px) scale(1.08) rotate(2deg); opacity: 1; filter: blur(0px); }
      100% { transform: translate(-50%,-50%) translateY(0) scale(1) rotate(0deg); }
    }
    @keyframes zoraSway {
      0%, 100% { transform: translate(-50%,-50%) scale(1) rotate(-1.5deg); }
      50% { transform: translate(-50%,-50%) scale(1.035) rotate(1.5deg); }
    }
    @keyframes zoraOrbitSlow {
      0% { transform: translate(-50%,-50%) rotate(0deg); }
      100% { transform: translate(-50%,-50%) rotate(360deg); }
    }
    @keyframes zoraGlow {
      0% { opacity: 0; transform: translate(-50%,-50%) scale(0.5); }
      35% { opacity: 0.9; }
      100% { opacity: 0; transform: translate(-50%,-50%) scale(1.5); }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Munculkan animasi apresiasi "gift" ala TikTok.
 * @param variant - opsional. Kalau tidak diisi, dipilih acak dari 5 tema yang ada.
 */
export function fireCelebration(variant?: CelebrationVariant) {
  if (typeof document === 'undefined') return;
  injectStylesOnce();

  const keys = Object.keys(VARIANTS) as CelebrationVariant[];
  const v = VARIANTS[variant ?? keys[Math.floor(Math.random() * keys.length)]];
  const labelText = v.labels[Math.floor(Math.random() * v.labels.length)];

  const cx = '50%', cy = '42%';
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position: fixed; inset: 0; z-index: 9999; pointer-events: none;';
  document.body.appendChild(wrap);

  const glow = document.createElement('div');
  glow.style.cssText = `position:absolute; left:${cx}; top:${cy}; width:280px; height:280px; border-radius:50%;
    filter: blur(6px);
    background: radial-gradient(circle, ${v.glowColor} 0%, ${v.glowColor2} 45%, transparent 75%);
    animation: zoraGlow 1.3s cubic-bezier(.25,.7,.4,1) forwards;`;
  wrap.appendChild(glow);
  setTimeout(() => glow.remove(), 1300);

  const orbit = document.createElement('div');
  orbit.style.cssText = `position:absolute; left:${cx}; top:${cy}; width:0; height:0;
    animation: zoraOrbitSlow 6s cubic-bezier(.3,0,.7,1) infinite;`;
  wrap.appendChild(orbit);

  v.decor.forEach((d, i) => {
    const angle = (360 / v.decor.length) * i + (Math.random() * 10 - 5);
    const radius = 72 + Math.random() * 22;
    const item = document.createElement('span');
    item.textContent = d;
    item.style.cssText = `position:absolute; left:0; top:0; font-size:${13 + Math.random() * 9}px;
      opacity:0; transform: rotate(${angle}deg) translate(0px) rotate(-${angle}deg) scale(0.4);
      transition: opacity 0.7s cubic-bezier(.25,.7,.3,1) ${0.35 + i * 0.06}s,
                  transform 0.7s cubic-bezier(.25,.7,.3,1) ${0.35 + i * 0.06}s;`;
    orbit.appendChild(item);
    requestAnimationFrame(() => {
      item.style.opacity = '0.9';
      item.style.transform = `rotate(${angle}deg) translate(${radius}px) rotate(-${angle}deg) scale(1)`;
    });
  });

  const icon = document.createElement('div');
  const animName = v.motion === 'rise' ? 'zoraRise' : 'zoraPop';
  icon.style.cssText = `position:absolute; left:${cx}; top:${cy}; font-size:66px;
    animation: ${animName} 0.55s cubic-bezier(.2,.9,.25,1.05) forwards;`;
  icon.textContent = v.icon;
  wrap.appendChild(icon);
  setTimeout(() => { icon.style.animation = 'zoraSway 1.6s ease-in-out infinite'; }, 550);

  const label = document.createElement('p');
  label.style.cssText = `position:absolute; left:${cx}; top:calc(${cy} + 88px); transform: translate(-50%,6px);
    margin:0; font-size:14px; font-weight:700; color:${v.labelColor}; background:${v.labelBg};
    padding:5px 16px; border-radius:999px; box-shadow:0 4px 14px rgba(0,0,0,0.1);
    opacity:0; white-space:nowrap;
    transition: opacity 0.5s cubic-bezier(.25,.7,.3,1) 0.45s,
                transform 0.5s cubic-bezier(.25,.7,.3,1) 0.45s;`;
  label.textContent = labelText;
  wrap.appendChild(label);
  requestAnimationFrame(() => {
    label.style.opacity = '1';
    label.style.transform = 'translate(-50%,0)';
  });

  setTimeout(() => {
    [orbit, icon, label].forEach((el) => {
      (el as HTMLElement).style.transition = 'opacity 0.6s cubic-bezier(.4,0,1,1), transform 0.6s cubic-bezier(.4,0,1,1), filter 0.6s ease-in';
      (el as HTMLElement).style.opacity = '0';
      (el as HTMLElement).style.filter = 'blur(3px)';
    });
    icon.style.transform = 'translate(-50%,-50%) scale(0.85) translateY(-14px)';
  }, 2100);
  setTimeout(() => wrap.remove(), 2750);
}