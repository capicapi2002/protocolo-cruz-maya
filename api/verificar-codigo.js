// api/verificar-codigo.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { codigo } = req.body;

  if (!codigo) {
    return res.status(400).json({ valido: false, error: 'Código no proporcionado' });
  }

  // Leer la variable de entorno (nunca se expone al frontend)
  const codigoMaestro = process.env.CODIGO_MAESTRO;

  if (codigo === codigoMaestro) {
    return res.status(200).json({ valido: true });
  } else {
    return res.status(200).json({ valido: false });
  }
}