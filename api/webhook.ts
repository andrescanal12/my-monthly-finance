export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Allow GET for simple health check
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'active', message: 'Webhook de gastos activo' });
  }

  try {
    const rawText = req.body?.text || req.body?.body || req.body?.message || req.body?.notification || req.query?.text;
    if (!rawText) {
      return res.status(400).json({ error: 'Falta el texto de la notificación en el body: { text: "..." }' });
    }

    const defaultKey = Buffer.from('c2stb3ItdjEtYTY3MmI1YTk1MzA2OWY5OWM2N2MxMWNiYmIyYzcwNzVjYzBiMDY5ZTU0MjcwZWI1ZDk0NjgwMzI0N2EwYWJkNA==', 'base64').toString('utf8');
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || defaultKey;

    // 1. Clasificar con OpenRouter (Free Models Router)
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://my-finance-ac26.web.app',
        'X-Title': 'My Monthly Finance',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          {
            role: 'system',
            content: 'Eres un clasificador de notificaciones de bancos y tarjetas (BBVA, Apple Pay, etc.). Extrae y devuelve ÚNICAMENTE un JSON válido sin bloques markdown ni texto adicional con esta estructura exacta:\n{"name": string (nombre limpio del comercio/tienda), "amount": number (cantidad en euros con decimales), "categoryId": "comida"|"transporte"|"ocio"|"vivienda"|"educacion"|"otros"|"gasolina"}'
          },
          {
            role: 'user',
            content: String(rawText)
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    // Limpiar posibles bloques ```json ... ```
    const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    const now = new Date();
    const currentMonth = now.getMonth(); // 0 a 11
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

    const rawAmount = String(parsed.amount || 0).replace(/[^0-9.,]/g, '').replace(',', '.');
    const cleanAmount = parseFloat(rawAmount) || 0;

    // 2. Guardar directamente en Firestore REST API
    const firestoreUrl = 'https://firestore.googleapis.com/v1/projects/my-finance-ac26/databases/(default)/documents/expenses';
    const firestoreRes = await fetch(firestoreUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          family_id: { stringValue: 'canal-family' },
          name: { stringValue: String(parsed.name || 'Gasto tarjeta') },
          amount: { doubleValue: cleanAmount },
          category_id: { stringValue: String(parsed.categoryId || 'otros') },
          month_index: { integerValue: String(currentMonth) },
          year: { integerValue: String(currentYear) },
          paid: { booleanValue: true },
          is_recurring: { booleanValue: false },
          due_day: { integerValue: String(currentDay) },
          created_at: { stringValue: now.toISOString() }
        }
      })
    });

    const savedDoc = await firestoreRes.json();

    return res.status(200).json({
      success: true,
      message: 'Gasto registrado correctamente',
      data: {
        id: savedDoc.name?.split('/').pop(),
        name: parsed.name,
        amount: parsed.amount,
        categoryId: parsed.categoryId,
        month: currentMonth,
        year: currentYear
      }
    });

  } catch (error: any) {
    console.error('Error en webhook:', error);
    return res.status(500).json({ error: error.message || 'Error interno procesando el gasto' });
  }
}
