// api/payment-webhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  let event;
  try {
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { analisis, nombre, email, fechaNacA, fechaNacB, tipoAnalisis, precio } = session.metadata;

    // Registrar en Google Sheets
    const datos = {
      nombre: nombre,
      email: email,
      fechaNacimiento: fechaNacA,
      fechaNacB: fechaNacB || '',
      tipoAnalisis: tipoAnalisis,
      monto: precio,
      moneda: 'usd',
      medioPago: 'Stripe'
    };
    await fetch('https://script.google.com/macros/s/AKfycbxR9KUxjTiHetSCZ1SdPml2nSny7Aw4lgRNCqkniJkfZq0HAKMlM1lgDrhYkUeOelAYRQ/exec', {
      method: 'POST',
      body: JSON.stringify(datos)
    });

    // Redirigir al resultado
    const params = new URLSearchParams({
      nombre: nombre,
      email: email,
      dia: fechaNacA.split('-')[2],
      mes: fechaNacA.split('-')[1],
      anio: fechaNacA.split('-')[0],
      tipo: tipoAnalisis,
      modo: 'pago'
    });
    const destino = analisis === 'individual' ? 'resultado-cruz.html' : 'resultado-comparativo.html';
    return res.redirect(302, `/${destino}?${params.toString()}`);
  }

  res.status(200).json({ received: true });
}