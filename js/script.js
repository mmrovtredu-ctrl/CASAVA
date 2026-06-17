// Marca que o JS está ativo: o CSS só esconde os .reveal quando existe .js.
// Assim, se o JS falhar, todo o conteúdo do produto continua visível.
document.documentElement.classList.add('js');

const fmt = n => n.toFixed(2).replace('.', ',') + ' €';
let cart = [];
let zapCap = '28 pares';
let payMethod = 'bizum';

function selVar(el){
  document.querySelectorAll('#vopts .vopt').forEach(o => o.classList.remove('sel'));
  el.classList.add('sel');
  zapCap = el.dataset.cap;
}
function buyZapatero(){ buy('Zapatero Modular (' + zapCap + ')', 49.99); }

function addToCart(name, price){
  const e = cart.find(i => i.name === name);
  if(e) e.qty++; else cart.push({ name, price, qty:1 });
  document.getElementById('cartCount').textContent = cart.reduce((a,i)=>a+i.qty,0);
}
function buy(name, price){ addToCart(name, price); openCart(); }
function subtotal(){ return cart.reduce((a,i)=>a+i.price*i.qty,0); }

function openCart(){
  if(!cart.length){
    document.getElementById('modalTitle').textContent = 'Tu cesta';
    document.getElementById('modalBody').innerHTML = '<p style="color:#6B675F;text-align:center;padding:18px 0">Tu cesta está vacía.</p>';
    show(); return;
  }
  renderCart(); show();
}

function renderCart(){
  document.getElementById('modalTitle').textContent = 'Tu cesta';
  const sub = subtotal(), free = sub >= 59, ship = free ? 0 : 4.99;
  const rows = cart.map(i => `<div class="li"><span>${i.name} ${i.qty>1?'× '+i.qty:''}</span><span>${fmt(i.price*i.qty)}</span></div>`).join('');
  document.getElementById('modalBody').innerHTML = `${rows}
    <div class="li"><span>Envío ${free?'<span class="ship-free">gratis</span>':''}</span><span>${free?'0,00 €':fmt(ship)}</span></div>
    ${!free?`<div style="font-size:12px;color:#6B675F;margin:2px 0 6px">Te faltan ${fmt(59-sub)} para el envío gratis.</div>`:''}
    <div class="li tot"><span>Total</span><span class="price">${fmt(sub+ship)}</span></div>
    <button class="btn3d" style="width:100%;margin-top:6px" onclick="checkout()">Ir a pagar · ${fmt(sub+ship)}</button>
    <p class="secure-note">Pago 100% seguro · IVA incluido</p>`;
}

function checkout(){
  const sub = subtotal(), ship = sub >= 59 ? 0 : 4.99, total = sub + ship;
  document.getElementById('modalTitle').textContent = 'Finalizar compra';
  document.getElementById('modalBody').innerHTML = `
    <div class="li tot" style="border:none;margin:0;padding:0 0 6px"><span>Total a pagar</span><span class="price">${fmt(total)}</span></div>
    <div class="paytitle">Método de pago</div>
    <div class="payopt sel" data-m="bizum" onclick="selPay(this)"><span class="ic" style="background:#00C3E3">Bz</span> Bizum <span class="badge">El más usado en España</span></div>
    <div class="payopt" data-m="card" onclick="selPay(this)"><span class="ic" style="background:#1A1A1C">··</span> Tarjeta <span class="badge">Visa · Mastercard</span></div>
    <div class="payopt" data-m="paypal" onclick="selPay(this)"><span class="ic" style="background:#003087">PP</span> PayPal <span class="badge">Protección al comprador</span></div>
    <button class="btn3d" style="width:100%;margin-top:8px" onclick="pay()">Pagar ${fmt(total)}</button>
    <p class="secure-note">Conexión cifrada · Tus datos están protegidos</p>`;
}
function selPay(el){
  document.querySelectorAll('.payopt').forEach(o => o.classList.remove('sel'));
  el.classList.add('sel'); payMethod = el.dataset.m;
}
function pay(){
  const L = { bizum:'Bizum', card:'tarjeta', paypal:'PayPal' };
  document.getElementById('modalTitle').textContent = '¡Pedido confirmado!';
  document.getElementById('modalBody').innerHTML = `<div class="done"><div class="ok"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0FB5A6" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg></div>
    <h3 style="font-family:'Fraunces';font-size:21px;margin-bottom:6px">Gracias por tu compra</h3>
    <p style="color:#6B675F;font-size:14px;margin:0">Pago con ${L[payMethod]} recibido. Te enviaremos la confirmación y el seguimiento por email. Entrega estimada: 24–48 h.</p></div>
    <button class="btn3d" style="width:100%;margin-top:14px" onclick="resetCart()">Seguir comprando</button>`;
}
function resetCart(){ cart = []; document.getElementById('cartCount').textContent = '0'; closeModal(); }
function show(){ document.getElementById('overlay').classList.add('open'); }
function closeModal(){ document.getElementById('overlay').classList.remove('open'); }
function scrollTo2(id){ document.getElementById(id).scrollIntoView(); }

let current = { name:'Climatizador Evaporativo', price:64.99, fn:()=>buy('Climatizador Evaporativo Airvecove',64.99) };
function stickyBuy(){ current.fn(); }

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('overlay').addEventListener('click', e => { if(e.target.id === 'overlay') closeModal(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });

  // sticky bar tracks which product is in view
  const secObserver = new IntersectionObserver(es => es.forEach(e => {
    if(e.isIntersecting){
      if(e.target.id === 'zapatero'){
        current = { name:'Zapatero Modular', price:49.99, fn:buyZapatero };
        document.getElementById('stickyName').textContent = 'Zapatero Modular';
        document.getElementById('stickyPrice').textContent = '49,99 €';
        document.getElementById('stickyBtn').className = 'btn3d coral';
      } else if(e.target.id === 'climatizador'){
        current = { name:'Climatizador Evaporativo', price:64.99, fn:()=>buy('Climatizador Evaporativo Airvecove',64.99) };
        document.getElementById('stickyName').textContent = 'Climatizador Evaporativo';
        document.getElementById('stickyPrice').textContent = '64,99 €';
        document.getElementById('stickyBtn').className = 'btn3d';
      }
    }
  }), { threshold:.4 });
  ['climatizador','zapatero'].forEach(id => secObserver.observe(document.getElementById(id)));

  // show sticky after hero
  const heroObs = new IntersectionObserver(es => es.forEach(e => {
    document.getElementById('sticky').classList.toggle('show', !e.isIntersecting);
  }), { threshold:0 });
  heroObs.observe(document.querySelector('.hero'));

  // reveal-on-scroll
  const reveals = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting) e.target.classList.add('in'); }), { threshold:.12 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }
  // Fallback: garante que tudo apareça mesmo se o observer não disparar
  window.addEventListener('load', () => setTimeout(() => {
    document.querySelectorAll('.reveal:not(.in)').forEach(el => {
      if(el.getBoundingClientRect().top < window.innerHeight + 200) el.classList.add('in');
    });
  }, 300));
});
