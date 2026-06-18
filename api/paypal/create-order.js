/* api/paypal/create-order.js — crea la orden de PayPal con importe verificado */
const paypal = require('@paypal/checkout-server-sdk');
const { totalCents } = require('../_lib');

function ppClient() {
  const Env = process.env.PAYPAL_ENV === 'live'
    ? paypal.core.LiveEnvironment
    : paypal.core.SandboxEnvironment;
  return new paypal.core.PayPalHttpClient(
    new Env(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET)
  );
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { items = [], shipping = 0 } = req.body || {};
    const value = (totalCents(items, shipping) / 100).toFixed(2);

    const r = new paypal.orders.OrdersCreateRequest();
    r.requestBody({ intent: 'CAPTURE', purchase_units: [{ amount: { currency_code: 'EUR', value } }] });

    const order = await ppClient().execute(r);
    res.status(200).json({ id: order.result.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
