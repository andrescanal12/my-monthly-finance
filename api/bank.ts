import type { VercelRequest, VercelResponse } from "@vercel/node";

const GOCARDLESS_API_BASE = "https://bankaccountdata.gocardless.com/api/v2";

// Helper para obtener token de GoCardless
async function getGoCardlessToken(secretId: string, secretKey: string): Promise<string> {
  const res = await fetch(`${GOCARDLESS_API_BASE}/token/new/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret_id: secretId,
      secret_key: secretKey,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error autenticando con GoCardless: ${err}`);
  }

  const data = await res.json();
  return data.access;
}

// Clasificación rápida de categorías por comercio
function categorizeMerchant(name: string): "comida" | "transporte" | "ocio" | "vivienda" | "educacion" | "otros" | "gasolina" {
  const n = name.toLowerCase();
  if (/mercadona|carrefour|lidl|dia|aldi|eroski|alcampo|supermercado|fruteria|panaderia|carniceria/.test(n)) {
    return "comida";
  }
  if (/repsol|cepsa|bp|galp|shell|petroprix|gasolinera|combustible|plenoil/.test(n)) {
    return "gasolina";
  }
  if (/metro|renfe|uber|cabify|bolt|taxi|billete|peaje|autobus|vueling|ryanair/.test(n)) {
    return "transporte";
  }
  if (/netflix|spotify|hbo|cine|restaurante|bar|cafeteria|mcdonalds|burger|foster|telepizza|steam|playstation/.test(n)) {
    return "ocio";
  }
  if (/ikea|leroy|amazon|zara|pull|stradivarius|primark|farmacia/.test(n)) {
    return "otros";
  }
  if (/alquiler|hipoteca|luz|agua|gas|endesa|iberdrola|naturgy|comunidad/.test(n)) {
    return "vivienda";
  }
  return "otros";
}

export default async function handler(req: any, res: any) {
  // Configuración de CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const action = req.query.action || (req.body && req.body.action);

  try {
    // 1. Probar credenciales / Obtener Token
    if (action === "test-auth") {
      const { secretId, secretKey } = req.body || {};
      if (!secretId || !secretKey) {
        return res.status(400).json({ error: "Faltan secretId y secretKey" });
      }
      await getGoCardlessToken(secretId, secretKey);
      return res.status(200).json({ success: true, message: "Credenciales válidas" });
    }

    // 2. Listar Bancos disponibles (por defecto España)
    if (action === "institutions") {
      const country = req.query.country || "es";
      const { secretId, secretKey } = req.body || {};
      if (!secretId || !secretKey) {
        return res.status(400).json({ error: "Credenciales requeridas" });
      }
      const token = await getGoCardlessToken(secretId, secretKey);

      const bankRes = await fetch(`${GOCARDLESS_API_BASE}/institutions/?country=${country}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!bankRes.ok) {
        throw new Error("No se pudo obtener la lista de bancos");
      }

      const banks = await bankRes.json();
      return res.status(200).json({ success: true, banks });
    }

    // 3. Crear Enlace de Autorización PSD2 con el Banco (ej. BBVA)
    if (action === "connect-bank") {
      const { secretId, secretKey, institutionId, redirectUrl } = req.body || {};
      if (!secretId || !secretKey || !institutionId) {
        return res.status(400).json({ error: "Faltan parámetros (institutionId, credenciales)" });
      }

      const token = await getGoCardlessToken(secretId, secretKey);
      const redirect = redirectUrl || "https://my-finance-ac26.web.app/?bank_connected=true";

      const reqRes = await fetch(`${GOCARDLESS_API_BASE}/requisitions/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          redirect: redirect,
          institution_id: institutionId,
          reference: `wallet-sync-${Date.now()}`,
          user_language: "ES",
        }),
      });

      if (!reqRes.ok) {
        const err = await reqRes.text();
        throw new Error(`Error creando autorización bancaria: ${err}`);
      }

      const reqData = await reqRes.json();
      return res.status(200).json({
        success: true,
        requisitionId: reqData.id,
        authUrl: reqData.link,
      });
    }

    // 4. Comprobar estado de la conexión
    if (action === "check-status") {
      const { secretId, secretKey, requisitionId } = req.body || {};
      if (!secretId || !secretKey || !requisitionId) {
        return res.status(400).json({ error: "Faltan parámetros" });
      }

      const token = await getGoCardlessToken(secretId, secretKey);
      const statusRes = await fetch(`${GOCARDLESS_API_BASE}/requisitions/${requisitionId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!statusRes.ok) {
        throw new Error("No se pudo verificar el estado de la conexión");
      }

      const statusData = await statusRes.json();
      return res.status(200).json({
        success: true,
        status: statusData.status, // "LN" significa Linked (Conectado)
        accountsCount: statusData.accounts?.length || 0,
        accounts: statusData.accounts || [],
      });
    }

    // 5. Sincronizar movimientos de la tarjeta / cuenta desde el Banco
    if (action === "sync-transactions") {
      const { secretId, secretKey, requisitionId, autoSaveToFirestore } = req.body || {};
      if (!secretId || !secretKey || !requisitionId) {
        return res.status(400).json({ error: "Faltan parámetros de sincronización" });
      }

      const token = await getGoCardlessToken(secretId, secretKey);

      // Obtener las cuentas del usuario
      const reqRes = await fetch(`${GOCARDLESS_API_BASE}/requisitions/${requisitionId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!reqRes.ok) throw new Error("No se encontró la conexión bancaria");
      const reqData = await reqRes.json();
      const accounts = reqData.accounts || [];

      if (accounts.length === 0) {
        return res.status(200).json({
          success: false,
          message: "Aún no has autorizado la cuenta en la pasarela de tu banco.",
        });
      }

      const importedExpenses: any[] = [];

      for (const accountId of accounts) {
        // Pedir transacciones a GoCardless
        const txRes = await fetch(`${GOCARDLESS_API_BASE}/accounts/${accountId}/transactions/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!txRes.ok) continue;
        const txData = await txRes.json();
        const booked = txData.transactions?.booked || [];
        const pending = txData.transactions?.pending || [];
        const allTransactions = [...pending, ...booked];

        for (const tx of allTransactions) {
          const rawAmount = parseFloat(tx.transactionAmount?.amount || "0");
          // Solo nos interesan los gastos (cantidades negativas en banco)
          if (rawAmount >= 0) continue;

          const amount = Math.abs(rawAmount);
          const rawTitle =
            tx.creditorName ||
            tx.remittanceInformationUnstructured ||
            tx.remittanceInformationUnstructuredArray?.[0] ||
            "Compra con Tarjeta";

          const categoryId = categorizeMerchant(rawTitle);
          const txDate = new Date(tx.bookingDate || tx.valueDate || Date.now());

          const expensePayload = {
            name: rawTitle.slice(0, 40).trim(),
            amount: amount,
            categoryId: categoryId,
            month: txDate.getMonth(),
            year: txDate.getFullYear(),
            dueDay: txDate.getDate(),
            transactionId: tx.transactionId || `${txDate.getTime()}-${amount}`,
          };

          importedExpenses.push(expensePayload);

          // Si se solicita guardar automáticamente en Firestore
          if (autoSaveToFirestore) {
            try {
              await fetch("https://firestore.googleapis.com/v1/projects/my-finance-ac26/databases/(default)/documents/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  fields: {
                    family_id: { stringValue: "canal-family" },
                    name: { stringValue: expensePayload.name },
                    amount: { doubleValue: expensePayload.amount },
                    category_id: { stringValue: expensePayload.categoryId },
                    month_index: { integerValue: String(expensePayload.month) },
                    year: { integerValue: String(expensePayload.year) },
                    paid: { booleanValue: true },
                    is_recurring: { booleanValue: false },
                    due_day: { integerValue: String(expensePayload.dueDay) },
                    created_at: { stringValue: txDate.toISOString() },
                    source: { stringValue: "open-banking-gocardless" },
                  },
                }),
              });
            } catch (e) {
              console.error("Error guardando en Firestore:", e);
            }
          }
        }
      }

      return res.status(200).json({
        success: true,
        count: importedExpenses.length,
        transactions: importedExpenses,
        message: `Sincronizados ${importedExpenses.length} movimientos de tarjeta exitosamente`,
      });
    }

    return res.status(400).json({ error: "Acción no reconocida" });
  } catch (err: any) {
    console.error("Error en api/bank:", err);
    return res.status(500).json({ error: err.message || "Error interno del servidor bancario" });
  }
}
