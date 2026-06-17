document.documentElement.classList.add('js');

let lang = 'es';
let cart = [];
let zapCap = '28 pares';
let payMethod = 'bizum';
let curKey = 'clim';
const curPrice = { clim: 64.99, zap: 49.99 };
const EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.JPG', '.PNG'];

const T = {
  es:{
    empty:'Tu cesta está vacía.', cartTitle:'Tu cesta', shipping:'Envío', free:'gratis',
    missing:p=>`Te faltan ${p} para el envío gratis.`, total:'Total',
    gopay:p=>`Pagar ahora · ${p}`, secure:'Pago 100% seguro · IVA incluido',
    checkoutTitle:'Finalizar compra', totalpay:'Total a pagar', method:'Método de pago',
    bizumB:'El más usado en España', cardB:'Visa · Mastercard', ppB:'Protección al comprador',
    pay:p=>`Pagar ${p}`, okTitle:'¡Pedido confirmado!', thanks:'Gracias por tu compra',
    okText:m=>`Pago con ${m} recibido. Te enviaremos la confirmación y el seguimiento por email. Entrega estimada: 24–48 h.`,
    keep:'Seguir comprando', secure2:'Conexión cifrada · Tus datos están protegidos',
    stickyBuy:'¡Comprar ahora!', stickySub:'· IVA incluido · envío gratis',
    clim:'Climatizador Evaporativo', zap:'Zapatero Modular', tarjeta:'tarjeta'
  },
  en:{
    empty:'Your cart is empty.', cartTitle:'Your cart', shipping:'Shipping', free:'free',
    missing:p=>`You're ${p} away from free shipping.`, total:'Total',
    gopay:p=>`Pay now · ${p}`, secure:'100% secure payment · VAT included',
    checkoutTitle:'Checkout', totalpay:'Total to pay', method:'Payment method',
    bizumB:'Most used in Spain', cardB:'Visa · Mastercard', ppB:'Buyer protection',
    pay:p=>`Pay ${p}`, okTitle:'Order confirmed!', thanks:'Thanks for your purchase',
    okText:m=>`Payment with ${m} received. We'll email you the confirmation and tracking. Estimated delivery: 24–48 h.`,
    keep:'Keep shopping', secure2:'Encrypted connection · Your data is protected',
    stickyBuy:'Buy now!', stickySub:'· VAT incl. · free shipping',
    clim:'Evaporative Cooler', zap:'Modular Shoe Rack', tarjeta:'card'
  }
};

function fmt(n){ return lang === 'en' ? '€' + n.toFixed(2) : n.toFixed(2).replace('.', ',') + ' €'; }

/* ---------- IDIOMA ---------- */
function setLang(l){
  lang = l;
  document.documentElement.lang = l;
  document.querySelectorAll('[data-en]').forEach(el => {
    if(el.dataset.es === undefined) el.dataset.es = el.innerHTML.trim();
    el.innerHTML = (l === 'en') ? el.dataset.en : el.dataset.es;
  });
  document.querySelectorAll('.lang-opt').forEach(o => o.classList.toggle('on', o.dataset.l === l));
  updateSticky();
}

/* ---------- GALERIA com auto-detecção de extensão ---------- */
function loadImage(img, onFail){
  let i = 0;
  const tryNext = () => {
    if(i >= EXTS.length){ img.style.display = 'none'; if(onFail) onFail(); return; }
    const ext = EXTS[i++];
    img.onload = () => { img.style.display = 'block'; img.dataset.okExt = ext; };
    img.onerror = tryNext;
    img.src = img.dataset.base + ext;
  };
  tryNext();
}
function setMainThumb(mainId, btn){
  const main = document.getElementById(mainId);
  main.dataset.base = btn.dataset.base;
  loadImage(main);
  btn.parentElement.querySelectorAll('.thumb').forEach(t => t.classList.remove('sel'));
  btn.classList.add('sel');
}

/* ---------- VARIANTE ---------- */
function selVar(el){
  document.querySelectorAll('#vopts .vopt').forEach(o => o.classList.remove('sel'));
  el.classList.add('sel');
  zapCap = el.dataset.cap;
}

/* ---------- CARRINHO / COMPRA ---------- */
function addToCart(name, price){
  const e = cart.find(i => i.name === name);
  if(e) e.qty++; else cart.push({ name, price, qty:1 });
  document.getElementById('cartCount').textContent = cart.reduce((a,i)=>a+i.qty,0);
}
// Comprar ahora -> va directo al checkout (site de venda antes do checkout)
function buyNow(name, price){ addToCart(name, price); show(); checkout(); }
function buyNowClim(){ buyNow(lang==='en'?'Evaporative Cooler Airvecove':'Climatizador Evaporativo Airvecove', 64.99); }
function buyNowZap(){ buyNow((lang==='en'?'Modular Shoe Rack':'Zapatero Modular') + ' (' + zapCap + ')', 49.99); }
function subtotal(){ return cart.reduce((a,i)=>a+i.price*i.qty,0); }

function openCart(){
  const t = T[lang];
  if(!cart.length){
    document.getElementById('modalTitle').textContent = t.cartTitle;
    document.getElementById('modalBody').innerHTML = `<p style="color:#6B675F;text-align:center;padding:18px 0">${t.empty}</p>`;
    show(); return;
  }
  renderCart(); show();
}
function renderCart(){
  const t = T[lang], sub = subtotal(), free = sub >= 59, ship = free ? 0 : 4.99;
  const rows = cart.map(i => `<div class="li"><span>${i.name} ${i.qty>1?'× '+i.qty:''}</span><span>${fmt(i.price*i.qty)}</span></div>`).join('');
  document.getElementById('modalTitle').textContent = t.cartTitle;
  document.getElementById('modalBody').innerHTML = `${rows}
    <div class="li"><span>${t.shipping} ${free?`<span class="ship-free">${t.free}</span>`:''}</span><span>${fmt(ship)}</span></div>
    ${!free?`<div style="font-size:12px;color:#6B675F;margin:2px 0 6px">${t.missing(fmt(59-sub))}</div>`:''}
    <div class="li tot"><span>${t.total}</span><span class="price">${fmt(sub+ship)}</span></div>
    <button class="btn3d cta-buy" style="width:100%;margin-top:6px" onclick="checkout()">${t.gopay(fmt(sub+ship))}</button>
    <p class="secure-note">${t.secure}</p>`;
}
function checkout(){
  const t = T[lang], sub = subtotal(), ship = sub>=59?0:4.99, total = sub+ship;
  document.getElementById('modalTitle').textContent = t.checkoutTitle;
  document.getElementById('modalBody').innerHTML = `
    <div class="li tot" style="border:none;margin:0;padding:0 0 6px"><span>${t.totalpay}</span><span class="price">${fmt(total)}</span></div>
    <div class="paytitle">${t.method}</div>
    <div class="payopt sel" data-m="bizum" onclick="selPay(this)"><span class="ic" style="background:#00C3E3">Bz</span> Bizum <span class="badge">${t.bizumB}</span></div>
    <div class="payopt" data-m="card" onclick="selPay(this)"><span class="ic" style="background:#1A1A1C">··</span> ${lang==='en'?'Card':'Tarjeta'} <span class="badge">${t.cardB}</span></div>
    <div class="payopt" data-m="paypal" onclick="selPay(this)"><span class="ic" style="background:#003087">PP</span> PayPal <span class="badge">${t.ppB}</span></div>
    <button class="btn3d cta-buy" style="width:100%;margin-top:8px" onclick="pay()">${t.pay(fmt(total))}</button>
    <p class="secure-note">${t.secure2}</p>`;
}
function selPay(el){
  document.querySelectorAll('.payopt').forEach(o => o.classList.remove('sel'));
  el.classList.add('sel'); payMethod = el.dataset.m;
}
function pay(){
  const t = T[lang];
  const names = { bizum:'Bizum', card:t.tarjeta, paypal:'PayPal' };
  document.getElementById('modalTitle').textContent = t.okTitle;
  document.getElementById('modalBody').innerHTML = `<div class="done"><div class="ok"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0FB5A6" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg></div>
    <h3 style="font-family:'Fraunces';font-size:21px;margin-bottom:6px">${t.thanks}</h3>
    <p style="color:#6B675F;font-size:14px;margin:0">${t.okText(names[payMethod])}</p></div>
    <button class="btn3d" style="width:100%;margin-top:14px" onclick="resetCart()">${t.keep}</button>`;
}
function resetCart(){ cart = []; document.getElementById('cartCount').textContent = '0'; closeModal(); }
function show(){ document.getElementById('overlay').classList.add('open'); }
function closeModal(){ document.getElementById('overlay').classList.remove('open'); }
function scrollTo2(id){ document.getElementById(id).scrollIntoView(); }

/* ---------- STICKY ---------- */
function updateSticky(){
  const t = T[lang];
  document.getElementById('stickyName').textContent = t[curKey];
  document.getElementById('stickyPrice').textContent = fmt(curPrice[curKey]);
  document.getElementById('stickyBtn').textContent = t.stickyBuy;
  document.getElementById('stickyBtn').className = 'btn3d cta-buy' + (curKey==='zap' ? ' coral' : '');
  document.getElementById('stickySub').textContent = t.stickySub;
}
function stickyBuy(){ curKey==='zap' ? buyNowZap() : buyNowClim(); }

document.addEventListener('DOMContentLoaded', () => {
  // carregar fotos (detecta a extensão automaticamente)
  document.querySelectorAll('img.pphoto[data-base]').forEach(img => loadImage(img));
  document.querySelectorAll('.thumb img[data-base]').forEach(img => loadImage(img, () => {
    const b = img.closest('.thumb'); if(b) b.style.display = 'none';
  }));

  document.getElementById('overlay').addEventListener('click', e => { if(e.target.id === 'overlay') closeModal(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });

  const secObserver = new IntersectionObserver(es => es.forEach(e => {
    if(e.isIntersecting){ curKey = e.target.id === 'zapatero' ? 'zap' : 'clim'; updateSticky(); }
  }), { threshold:.4 });
  ['climatizador','zapatero'].forEach(id => secObserver.observe(document.getElementById(id)));

  const heroObs = new IntersectionObserver(es => es.forEach(e => {
    document.getElementById('sticky').classList.toggle('show', !e.isIntersecting);
  }), { threshold:0 });
  heroObs.observe(document.querySelector('.hero'));

  const reveals = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting) e.target.classList.add('in'); }), { threshold:.12 });
    reveals.forEach(el => io.observe(el));
  } else { reveals.forEach(el => el.classList.add('in')); }
  window.addEventListener('load', () => setTimeout(() => {
    document.querySelectorAll('.reveal:not(.in)').forEach(el => {
      if(el.getBoundingClientRect().top < window.innerHeight + 200) el.classList.add('in');
    });
  }, 300));

  updateSticky();
});
