const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { analisis, nombre, email, fechaNacA, fechaNacB, tipoAnalisis, precio } = req.body;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Análisis ${analisis === 'individual' ? 'Individual' : 'Comparativo'} - Protocolo Cruz Maya`,
        },
        unit_amount: Math.round(parseFloat(precio) * 100),
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `https://protocolo-cruz-maya.vercel.app/resultado-${analisis}.html?nombre=${nombre}&email=${email}&dia=${fechaNacA.split('-')[2]}&mes=${fechaNacA.split('-')[1]}&anio=${fechaNacA.split('-')[0]}&tipo=${tipoAnalisis}&modo=pago`,
    cancel_url: 'https://protocolo-cruz-maya.vercel.app/index.html',
    metadata: {
      analisis, nombre, email, fechaNacA, fechaNacB, tipoAnalisis, precio
    }
  });

  res.status(200).json({ url: session.url });
}