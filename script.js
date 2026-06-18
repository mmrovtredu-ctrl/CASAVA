document.documentElement.classList.add('js');

/* =========================================================================
   CONFIGURACIÓN DE PAGOS  ←  RELLENA ESTO CON TUS DATOS REALES
   -------------------------------------------------------------------------
   Lee el archivo LEEME-PAGOS.md para una explicación paso a paso.
   ========================================================================= */
const PAY_CONFIG = {
  /* --- PayPal --------------------------------------------------------- */
  // Client ID de tu app de PayPal (https://developer.paypal.com → Apps & Credentials)
  // Usa el de "Sandbox" para probar y el "Live" para cobrar de verdad.
  paypalClientId: 'TU_PAYPAL_CLIENT_ID',
  paypalCurrency: 'EUR',
  // Endpoints serverless de Vercel (ya creados en /api). El importe se valida en el servidor.
  paypalCreateEndpoint: '/api/paypal/create-order',
  paypalCaptureEndpoint: '/api/paypal/capture/:id',

  /* --- Stripe (cubre Bizum + Tarjeta) --------------------------------- */
  // OPCIÓN A (sin servidor): enlaces de pago creados en tu panel de Stripe.
  //   https://dashboard.stripe.com/payment-links  → crea un Payment Link por producto,
  //   activa "Card" y "Bizum", y pega aquí la URL (https://buy.stripe.com/....).
  stripePaymentLinks: {
    clim: 'https://buy.stripe.com/TU_ENLACE_CLIMATIZADOR',
    zap:  'https://buy.stripe.com/TU_ENLACE_ZAPATERO'
  },
  // Stripe vía serverless de Vercel (soporta Bizum + Tarjeta con total real)
  stripeCheckoutEndpoint: '/api/create-checkout-session'
};

function payConfigured(v){ return v && !/^TU_|TU_ENLACE|XXXX|YYYY/.test(v); }

/* ========================================================================= */

let lang = 'es';
let cart = [];
let zapCap = '28 pares';
let payMethod = 'bizum';
let curKey = 'clim';
const curPrice = { clim: 64.99, zap: 49.99 };
const EXTS = ['.jpeg', '.jpg', '.png', '.webp', '.JPEG', '.JPG', '.PNG'];

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
    clim:'Climatizador Evaporativo', zap:'Zapatero Modular', tarjeta:'tarjeta',
    ppWait:'Cargando PayPal…',
    ppNotCfg:'⚠️ Configura tu PayPal Client ID en PAY_CONFIG (script.js).',
    ppErr:'No se pudo iniciar el pago con PayPal. Inténtalo de nuevo.',
    stripeNotCfg:'⚠️ Configura tu Stripe Payment Link o el endpoint de Checkout en PAY_CONFIG (script.js).',
    stripeErr:'No se pudo iniciar el pago con Stripe. Inténtalo de nuevo.',
    redirecting:'Redirigiendo a la pasarela segura…'
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
    clim:'Evaporative Cooler', zap:'Modular Shoe Rack', tarjeta:'card',
    ppWait:'Loading PayPal…',
    ppNotCfg:'⚠️ Set your PayPal Client ID in PAY_CONFIG (script.js).',
    ppErr:'Could not start the PayPal payment. Please try again.',
    stripeNotCfg:'⚠️ Set your Stripe Payment Link or Checkout endpoint in PAY_CONFIG (script.js).',
    stripeErr:'Could not start the Stripe payment. Please try again.',
    redirecting:'Redirecting to the secure gateway…'
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
function addToCart(name, price, key){
  const e = cart.find(i => i.name === name);
  if(e) e.qty++; else cart.push({ name, price, qty:1, key: key || curKey });
  document.getElementById('cartCount').textContent = cart.reduce((a,i)=>a+i.qty,0);
}
// Comprar ahora -> va directo al checkout
function buyNow(name, price, key){ addToCart(name, price, key); show(); checkout(); }
function buyNowClim(){ buyNow(lang==='en'?'Evaporative Cooler Airvecove':'Climatizador Evaporativo Airvecove', 64.99, 'clim'); }
function buyNowZap(){ buyNow((lang==='en'?'Modular Shoe Rack':'Zapatero Modular') + ' (' + zapCap + ')', 49.99, 'zap'); }
function subtotal(){ return cart.reduce((a,i)=>a+i.price*i.qty,0); }
function shippingCost(){ return subtotal() >= 59 ? 0 : 4.99; }
function grandTotal(){ return subtotal() + shippingCost(); }
// clave del producto dominante en el carrito (para Payment Links sin backend)
function cartKey(){ return (cart[0] && cart[0].key) || curKey; }

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

/* ---------- CHECKOUT ---------- */
function checkout(){
  const t = T[lang], total = grandTotal();
  document.getElementById('modalTitle').textContent = t.checkoutTitle;
  document.getElementById('modalBody').innerHTML = `
    <div class="li tot" style="border:none;margin:0;padding:0 0 6px"><span>${t.totalpay}</span><span class="price">${fmt(total)}</span></div>
    <div class="paytitle">${t.method}</div>
    <div class="payopt sel" data-m="bizum" onclick="selPay(this)"><span class="ic" style="background:#00C3E3">Bz</span> Bizum <span class="badge">${t.bizumB}</span></div>
    <div class="payopt" data-m="card" onclick="selPay(this)"><span class="ic" style="background:#1A1A1C">··</span> ${lang==='en'?'Card':'Tarjeta'} <span class="badge">${t.cardB}</span></div>
    <div class="payopt" data-m="paypal" onclick="selPay(this)"><span class="ic" style="background:#003087">PP</span> PayPal <span class="badge">${t.ppB}</span></div>
    <div id="payAction" style="margin-top:10px"></div>
    <p class="secure-note">${t.secure2}</p>`;
  payMethod = 'bizum';
  renderPayAction();
}
function selPay(el){
  document.querySelectorAll('.payopt').forEach(o => o.classList.remove('sel'));
  el.classList.add('sel'); payMethod = el.dataset.m;
  renderPayAction();
}
function renderPayAction(){
  const t = T[lang], total = grandTotal(), host = document.getElementById('payAction');
  if(!host) return;
  if(payMethod === 'paypal'){
    host.innerHTML = `<div id="paypalButtons"></div><div id="ppMsg" class="secure-note">${t.ppWait}</div>`;
    renderPayPal(total);
  } else {
    // Bizum y Tarjeta -> Stripe (Stripe Checkout soporta ambos en España)
    host.innerHTML = `<button class="btn3d cta-buy" style="width:100%" onclick="payWithStripe()">${t.pay(fmt(total))}</button>`;
  }
}

/* ---------- PAYPAL (botones reales) ---------- */
function loadPayPalSdk(){
  return new Promise((resolve, reject) => {
    if(window.paypal) return resolve(window.paypal);
    if(!payConfigured(PAY_CONFIG.paypalClientId)) return reject(new Error('paypal-not-configured'));
    const s = document.createElement('script');
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAY_CONFIG.paypalClientId)}&currency=${PAY_CONFIG.paypalCurrency}&intent=capture`;
    s.onload = () => resolve(window.paypal);
    s.onerror = () => reject(new Error('paypal-sdk-failed'));
    document.head.appendChild(s);
  });
}
function renderPayPal(total){
  const t = T[lang];
  loadPayPalSdk().then(paypal => {
    const msg = document.getElementById('ppMsg'); if(msg) msg.remove();
    paypal.Buttons({
      style:{ layout:'vertical', color:'gold', shape:'pill', label:'paypal', height:48 },
      createOrder:(data, actions) => {
        // Producción: que la orden la cree tu backend (importe verificado en servidor)
        if(payConfigured(PAY_CONFIG.paypalCreateEndpoint)){
          return fetch(PAY_CONFIG.paypalCreateEndpoint, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ items: cart, shipping: shippingCost() })
          }).then(r => r.json()).then(d => d.id);
        }
        // Demo/sandbox: orden creada en cliente
        return actions.order.create({
          purchase_units:[{ amount:{ value: total.toFixed(2), currency_code: PAY_CONFIG.paypalCurrency } }]
        });
      },
      onApprove:(data, actions) => {
        if(payConfigured(PAY_CONFIG.paypalCaptureEndpoint)){
          const url = PAY_CONFIG.paypalCaptureEndpoint.replace(':id', data.orderID);
          return fetch(url, { method:'POST' }).then(r => r.json()).then(() => paySuccess('PayPal'));
        }
        return actions.order.capture().then(() => paySuccess('PayPal'));
      },
      onError:(err) => { console.error(err); const h=document.getElementById('payAction'); if(h) h.insertAdjacentHTML('beforeend', `<p class="secure-note">${t.ppErr}</p>`); }
    }).render('#paypalButtons').catch(e => console.error(e));
  }).catch(() => {
    const host = document.getElementById('payAction');
    if(host) host.innerHTML = `<p class="secure-note">${t.ppNotCfg}</p>`;
  });
}

/* ---------- STRIPE (Bizum + Tarjeta) ---------- */
function payWithStripe(){
  const t = T[lang];
  // OPCIÓN B: backend que crea la Checkout Session con el total real
  if(payConfigured(PAY_CONFIG.stripeCheckoutEndpoint)){
    const btn = document.querySelector('#payAction .btn3d');
    if(btn){ btn.disabled = true; btn.textContent = t.redirecting; }
    fetch(PAY_CONFIG.stripeCheckoutEndpoint, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ items: cart, shipping: shippingCost(), method: payMethod, lang })
    })
    .then(r => r.json())
    .then(d => { if(d.url) location.href = d.url; else throw new Error('no-url'); })
    .catch(() => { alert(t.stripeErr); if(btn){ btn.disabled=false; renderPayAction(); } });
    return;
  }
  // OPCIÓN A: Payment Link (sin backend)
  const link = PAY_CONFIG.stripePaymentLinks[cartKey()];
  if(payConfigured(link)){ location.href = link; return; }
  alert(t.stripeNotCfg);
}

/* ---------- ÉXITO ---------- */
function paySuccess(methodName){
  const t = T[lang];
  document.getElementById('modalTitle').textContent = t.okTitle;
  document.getElementById('modalBody').innerHTML = `<div class="done"><div class="ok"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0FB5A6" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg></div>
    <h3 style="font-family:'Fraunces';font-size:21px;margin-bottom:6px">${t.thanks}</h3>
    <p style="color:#6B675F;font-size:14px;margin:0">${t.okText(methodName)}</p></div>
    <button class="btn3d" style="width:100%;margin-top:14px" onclick="resetCart()">${t.keep}</button>`;
  show();
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
  // fotos (detecta a extensão automaticamente)
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

  // Cuando el cliente vuelve desde Stripe/PayPal con ?paid=1 mostramos confirmación
  const params = new URLSearchParams(location.search);
  if(params.get('paid') === '1'){
    const method = params.get('m') || 'Stripe';
    paySuccess(method.charAt(0).toUpperCase() + method.slice(1));
    history.replaceState({}, '', location.pathname);
  }

  updateSticky();
});
