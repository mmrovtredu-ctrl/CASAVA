/* api/_lib.js — utilidades compartidas (el prefijo "_" hace que Vercel NO lo
   convierta en endpoint). Precios de confianza definidos en el servidor. */

const CATALOG = {
  clim: { name: 'Climatizador Evaporativo Airvecove', cents: 6499 },
  zap:  { name: 'Zapatero Modular',                   cents: 4999 }
};

function lineItemsFrom(items = []) {
  return items.map(it => {
    const p = CATALOG[it.key] || CATALOG.clim;
    return { product: p, qty: Math.max(1, parseInt(it.qty || 1, 10)), name: it.name || p.name };
  });
}

function totalCents(items = [], shipping = 0) {
  const sub = lineItemsFrom(items).reduce((a, l) => a + l.product.cents * l.qty, 0);
  return sub + Math.round((shipping || 0) * 100);
}

// origen del sitio para las URLs de retorno (usa SITE_URL si está definido)
function siteOrigin(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  const proto = (req.headers['x-forwarded-proto'] || 'https');
  return `${proto}://${req.headers.host}`;
}

module.exports = { CATALOG, lineItemsFrom, totalCents, siteOrigin };
