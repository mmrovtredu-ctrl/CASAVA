/* api/create-checkout-session.js — Stripe Checkout (Bizum + Tarjeta) */
const Stripe = require('stripe');
const { lineItemsFrom, siteOrigin } = require('./_lib');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { items = [], shipping = 0, method } = req.body || {};
    const origin = siteOrigin(req);

    const lines = lineItemsFrom(items).map(l => ({
      quantity: l.qty,
      price_data: {
        currency: 'eur',
        unit_amount: l.product.cents,
        product_data: { name: l.name }
      }
    }));
    if (shipping > 0) {
      lines.push({
        quantity: 1,
        price_data: { currency: 'eur', unit_amount: Math.round(shipping * 100), product_data: { name: 'Envío' } }
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // Bizum requiere tu cuenta Stripe en España y moneda EUR
      payment_method_types: method === 'bizum' ? ['bizum', 'card'] : ['card', 'bizum'],
      line_items: lines,
      success_url: `${origin}/?paid=1&m=${method || 'stripe'}`,
      cancel_url: `${origin}/?canceled=1`
    });

    res.status(200).json({ url: session.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
