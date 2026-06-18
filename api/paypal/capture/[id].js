/* api/paypal/capture/[id].js — captura el pago aprobado (/api/paypal/capture/ORDER_ID) */
const paypal = require('@paypal/checkout-server-sdk');

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
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing order id' });

    const r = new paypal.orders.OrdersCaptureRequest(id);
    r.requestBody({});
    const capture = await ppClient().execute(r);

    res.status(200).json({ status: capture.result.status });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
