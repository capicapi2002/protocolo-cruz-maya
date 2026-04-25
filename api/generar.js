// api/generar.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  try {
    const { prompt, tipo } = req.body; // <--- ahora recibe también "tipo"
    if (!prompt) return res.status(400).json({ error: 'Falta el prompt' });

    // Leer conocimiento.txt desde el servidor (nunca se expone)
    let conocimiento = '';
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'conocimiento.txt');
      conocimiento = fs.readFileSync(filePath, 'utf8');
    } catch (e) {
      conocimiento = 'ERROR: No se pudo cargar la base de conocimiento.';
    }

    const promptCompleto = `Usa EXCLUSIVAMENTE este conocimiento:\n${conocimiento}\n\n${prompt}`;

    // Seleccionar el grupo de keys según el tipo de análisis
    let keys = [];
    if (tipo === 'comparativo') {
      keys = [
        process.env.GEMINI_COMP_KEY_1,
        process.env.GEMINI_COMP_KEY_2,
        process.env.GEMINI_COMP_KEY_3
      ].filter(Boolean);
    } else {
      // Por defecto, individual
      keys = [
        process.env.GEMINI_IND_KEY_1,
        process.env.GEMINI_IND_KEY_2,
        process.env.GEMINI_IND_KEY_3
      ].filter(Boolean);
    }

    if (keys.length === 0) {
      return res.status(500).json({ error: `No hay API keys configuradas para el tipo "${tipo || 'individual'}".` });
    }

    let ultimoError;
    for (let i = 0; i < keys.length; i++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${keys[i]}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptCompleto }] }],
              generationConfig: { temperature: 0.85, maxOutputTokens: 4000 }
            })
          }
        );
        if (response.status === 429) {
          ultimoError = new Error('Límite excedido');
          continue;
        }
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error?.message || `Error ${response.status}`);
        }
        const data = await response.json();
        const texto = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!texto || texto.length < 100) throw new Error('Respuesta vacía');
        return res.status(200).json({ texto });
      } catch (error) {
        ultimoError = error;
        if (!error.message.includes('Límite excedido')) break;
      }
    }
    throw ultimoError || new Error('Todas las claves fallaron');
  } catch (error) {
    console.error('Error en el proxy:', error);
    return res.status(500).json({ error: error.message || 'Error interno' });
  }
}