// Color tokens for JS effects
const COLORS = {
  blue: getComputedStyle(document.documentElement).getPropertyValue('--blue') || '#2b6cff'
};

// Theme persistence + Dark mode toggle
const modeToggle = document.getElementById('modeToggle');
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') document.body.classList.add('theme-light');
updateToggleIcon();
modeToggle?.addEventListener('click', () => {
  document.body.classList.toggle('theme-light');
  const theme = document.body.classList.contains('theme-light') ? 'light' : 'dark';
  localStorage.setItem('theme', theme);
  updateToggleIcon();
});
function updateToggleIcon(){
  if (!modeToggle) return;
  const light = document.body.classList.contains('theme-light');
  modeToggle.textContent = light ? '☀' : '☾';
}

// Custom cursor with hover expansion
const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');
let cursorX = 0, cursorY = 0, ringX = 0, ringY = 0;
document.addEventListener('pointermove', (e) => {
  cursorX = e.clientX; cursorY = e.clientY;
  cursorDot.style.left = cursorX + 'px';
  cursorDot.style.top = cursorY + 'px';
});
// Smooth follow for ring
function animateRing(){
  ringX += (cursorX - ringX) * 0.15;
  ringY += (cursorY - ringY) * 0.15;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top = ringY + 'px';
  requestAnimationFrame(animateRing);
}
animateRing();
// Change on interactive elements
['a','button','.tilt','.magnetic'].forEach(sel => {
  document.querySelectorAll(sel).forEach(el => {
    el.addEventListener('mouseenter', () => cursorRing.classList.add('active'));
    el.addEventListener('mouseleave', () => cursorRing.classList.remove('active'));
  });
});

// Hide custom cursor on touch devices
function isTouch(){ return matchMedia('(pointer: coarse)').matches }
if (isTouch()){
  cursorDot.style.display = 'none';
  cursorRing.style.display = 'none';
}

// Magnetic buttons/links
const magneticStrength = 0.25; // adjust pull strength
document.querySelectorAll('.magnetic').forEach((el) => {
  const bounds = () => el.getBoundingClientRect();
  el.addEventListener('mousemove', (e) => {
    const b = bounds();
    const relX = e.clientX - (b.left + b.width/2);
    const relY = e.clientY - (b.top + b.height/2);
    el.style.transform = `translate(${relX * magneticStrength}px, ${relY * magneticStrength}px)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'translate(0,0)';
  });
});

// Smooth scrolling for on-page anchors with header offset
const header = document.querySelector('.site-header');
const headerHeight = () => (header ? header.getBoundingClientRect().height : 0);
function smoothScrollTo(target){
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - headerHeight() - 8;
  window.scrollTo({ top: y, behavior: 'smooth' });
}
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    if (href && href.length > 1){
      e.preventDefault();
      smoothScrollTo(href);
      history.pushState(null, '', href);
    }
  });
});

// 3D Tilt on cards
document.querySelectorAll('.tilt').forEach((card) => {
  const maxTilt = 10; // degrees
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width; // 0..1
    const py = (e.clientY - r.top) / r.height; // 0..1
    const rx = (py - 0.5) * -2 * maxTilt;
    const ry = (px - 0.5) * 2 * maxTilt;
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(10px)`;
  });
  card.addEventListener('pointerleave', () => {
    card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)';
  });
});

// Intersection Observer scroll reveals (bidirectional)
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(ent => {
    if (ent.isIntersecting){
      ent.target.classList.add('in');
    } else {
      ent.target.classList.remove('in');
    }
  })
},{ threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Animated neural network background
const canvas = document.getElementById('neural-canvas');
const ctx = canvas.getContext('2d');
let width, height, points;

function resize(){
  width = canvas.width = window.innerWidth * devicePixelRatio;
  height = canvas.height = window.innerHeight * devicePixelRatio;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.scale(devicePixelRatio, devicePixelRatio);
  initPoints();
}
window.addEventListener('resize', resize);

function initPoints(){
  const count = Math.min(120, Math.floor((window.innerWidth * window.innerHeight)/14000));
  points = Array.from({length: count}).map(() => ({
    x: Math.random()*window.innerWidth,
    y: Math.random()*window.innerHeight,
    vx: (Math.random()-0.5)*0.6,
    vy: (Math.random()-0.5)*0.6
  }));
}

function step(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // Draw connections
  for (let i=0;i<points.length;i++){
    const p = points[i];
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > window.innerWidth) p.vx *= -1;
    if (p.y < 0 || p.y > window.innerHeight) p.vy *= -1;
    // nodes
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.2, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(43,108,255,0.7)';
    ctx.fill();
    for (let j=i+1;j<points.length;j++){
      const q = points[j];
      const dx = p.x - q.x, dy = p.y - q.y;
      const d2 = dx*dx + dy*dy;
      const maxDist2 = 140*140;
      if (d2 < maxDist2){
        const a = 1 - d2/maxDist2; // alpha
        ctx.strokeStyle = `rgba(43,108,255,${0.25*a})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(step);
}

resize();
requestAnimationFrame(step);

// Respect prefers-reduced-motion
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  // Reduce animation intensity
  points?.forEach(p => { p.vx*=0.3; p.vy*=0.3; });
}

// Contact form (Formspree) - async submit with feedback
const form = document.getElementById('contact-form');
const statusEl = document.getElementById('form-status');
if (form){
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = 'Sending…';
    const data = new FormData(form);
    try{
      const res = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok){
        statusEl.textContent = 'Thank you! Your message has been sent.';
        form.reset();
      } else {
        statusEl.textContent = 'Oops, something went wrong. Please try again later.';
      }
    } catch(err){
      statusEl.textContent = 'Network error. Please try again.';
    }
  });
}
