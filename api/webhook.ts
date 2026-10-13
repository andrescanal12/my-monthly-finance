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

    let rawText = '';
    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        rawText = parsed.text || parsed.body || parsed.message || parsed.notification || req.body;
      } catch (e) {
        const textMatch = req.body.match(/"text"\s*:\s*"([^"]+)"/);
        rawText = textMatch ? textMatch[1] : req.body;
      }
    } else if (req.body && typeof req.body === 'object') {
      rawText = req.body.text || req.body.body || req.body.message || req.body.notification;
    }
    if (!rawText && req.query?.text) {
      rawText = String(req.query.text);
    }

    if (!rawText) {
      return res.status(400).json({ error: 'Falta el texto de la notificación en el body: { text: "..." }' });
    }

    // 0. Parser ultra-rápido por Regex para notificaciones y emails de BBVA
    const lower = rawText.toLowerCase();

    // Intentar extraer importe con regex estándar de BBVA / banca española
    // ej: "18,50 EUR", "18.50 EUR", "18,50 €", "importe de 18,50"
    const amountMatch = rawText.match(/(?:importe\s*(?:de)?\s*:?\s*|pago\s*(?:de)?\s*:?\s*|compra\s*(?:de)?\s*:?\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:EUR|€|euros)/i) ||
                        rawText.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:EUR|€)/i);

    // Intentar extraer comercio común
    let quickMerchant = '';
    let quickCategory = '';

    const merchants: [RegExp, string, string][] = [
      [/mercadona/i, 'Mercadona', 'comida'],
      [/carrefour/i, 'Carrefour', 'comida'],
      [/lidl/i, 'Lidl', 'comida'],
      [/dia\b/i, 'Supermercado Dia', 'comida'],
      [/aldi/i, 'Aldi', 'comida'],
      [/alcampo/i, 'Alcampo', 'comida'],
      [/eroski/i, 'Eroski', 'comida'],
      [/repsol/i, 'Repsol', 'gasolina'],
      [/cepsa/i, 'Cepsa', 'gasolina'],
      [/bp\b/i, 'Gasolinera BP', 'gasolina'],
      [/galp/i, 'Galp', 'gasolina'],
      [/petroprix/i, 'Petroprix', 'gasolina'],
      [/plenoil/i, 'Plenoil', 'gasolina'],
      [/mcdonald/i, "McDonald's", 'ocio'],
      [/burger\s*king/i, 'Burger King', 'ocio'],
      [/kfc/i, 'KFC', 'ocio'],
      [/telepizza/i, 'Telepizza', 'ocio'],
      [/domino/i, "Domino's Pizza", 'ocio'],
      [/starbucks/i, 'Starbucks', 'ocio'],
      [/uber\s*eats/i, 'Uber Eats', 'ocio'],
      [/glovo/i, 'Glovo', 'ocio'],
      [/just\s*eat/i, 'Just Eat', 'ocio'],
      [/zara/i, 'Zara', 'otros'],
      [/pull\s*&?\s*bear/i, 'Pull & Bear', 'otros'],
      [/stradivarius/i, 'Stradivarius', 'otros'],
      [/bershka/i, 'Bershka', 'otros'],
      [/primark/i, 'Primark', 'otros'],
      [/amazon/i, 'Amazon', 'otros'],
      [/ikea/i, 'IKEA', 'otros'],
      [/leroy\s*merlin/i, 'Leroy Merlin', 'otros'],
      [/media\s*markt/i, 'MediaMarkt', 'otros'],
      [/metro/i, 'Metro', 'transporte'],
      [/renfe/i, 'Renfe', 'transporte'],
      [/uber\b/i, 'Uber', 'transporte'],
      [/cabify/i, 'Cabify', 'transporte'],
      [/bolt/i, 'Bolt', 'transporte'],
    ];

    for (const [pattern, mName, mCat] of merchants) {
      if (pattern.test(rawText)) {
        quickMerchant = mName;
        quickCategory = mCat;
        break;
      }
    }

    let parsed: any = {};

    if (amountMatch && quickMerchant) {
      // Coincidencia instantánea en 0.001 segundos
      const rawNum = amountMatch[1].replace(',', '.');
      parsed = {
        name: quickMerchant,
        amount: parseFloat(rawNum),
        categoryId: quickCategory
      };
    } else {
      // 1. Clasificar con OpenRouter (Free Models Router) si no hubo coincidencia directa
      const defaultKey = Buffer.from('c2stb3ItdjEtYTY3MmI1YTk1MzA2OWY5OWM2N2MxMWNiYmIyYzcwNzVjYzBiMDY5ZTU0MjcwZWI1ZDk0NjgwMzI0N2EwYWJkNA==', 'base64').toString('utf8');
      const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || defaultKey;

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
          reasoning: { effort: 'none' },
          temperature: 0.1,
          max_tokens: 120,
          messages: [
            {
              role: 'system',
              content: 'Eres un clasificador de notificaciones y emails bancarios (BBVA, etc.). Extrae y devuelve ÚNICAMENTE un JSON válido sin markdown con esta estructura exacta:\n{"name": string (nombre limpio del comercio), "amount": number (cantidad en euros con decimales), "categoryId": "comida"|"transporte"|"ocio"|"vivienda"|"educacion"|"otros"|"gasolina"}'
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

      const match = content.match(/\{[\s\S]*?\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch (e) {
          parsed = {};
        }
    }

    // Fallbacks si falta algo
    let name = parsed.name;
    if (!name) {
      name = rawText.slice(0, 30);
    }

    let categoryId = parsed.categoryId;
    const validCategories = ['comida', 'transporte', 'ocio', 'vivienda', 'educacion', 'otros', 'gasolina'];
    if (!validCategories.includes(categoryId)) {
      categoryId = 'otros';
    }

    const now = new Date();
    const currentMonth = now.getMonth(); // 0 a 11
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

    let cleanAmount = 0;
    if (parsed.amount) {
      const raw = String(parsed.amount).replace(/[^0-9.,]/g, '').replace(',', '.');
      cleanAmount = parseFloat(raw) || 0;
    } else {
      const amountMatch = String(rawText).match(/(\d+(?:[.,]\d{1,2})?)/);
      if (amountMatch) {
        cleanAmount = parseFloat(amountMatch[1].replace(',', '.')) || 0;
      }
    }

    // 2. Guardar directamente en Firestore REST API
    const firestoreUrl = 'https://firestore.googleapis.com/v1/projects/my-finance-ac26/databases/(default)/documents/expenses';
    const firestoreRes = await fetch(firestoreUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          family_id: { stringValue: 'canal-family' },
          name: { stringValue: String(name) },
          amount: { doubleValue: cleanAmount },
          category_id: { stringValue: String(categoryId) },
          month_index: { integerValue: String(currentMonth) },
          year: { integerValue: String(currentYear) },
          paid: { booleanValue: true },
          is_recurring: { booleanValue: false },
          due_day: { integerValue: String(currentDay) },
          created_at: { stringValue: now.toISOString() },
          raw_text: { stringValue: String(rawText).slice(0, 500) }
        }
      })
    });

    const savedDoc = await firestoreRes.json();

    return res.status(200).json({
      success: true,
      message: 'Gasto registrado correctamente',
      data: {
        id: savedDoc.name?.split('/').pop(),
        name: name,
        amount: cleanAmount,
        categoryId: categoryId,
        month: currentMonth,
        year: currentYear
      }
    });

  } catch (error: any) {
    console.error('Error en webhook:', error);
    return res.status(500).json({ error: error.message || 'Error interno procesando el gasto' });
  }
}
