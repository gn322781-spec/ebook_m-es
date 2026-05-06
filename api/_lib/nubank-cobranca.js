const DEFAULT_COBRANCA_URL = "https://nubank.com.br/cobranca/Hdhg4R6XkD9v0lu0";

function getCobrancaUrl() {
  return process.env.NUBANK_COBRANCA_URL || DEFAULT_COBRANCA_URL;
}

function extractInputValue(html, inputId) {
  const regex = new RegExp(`<input[^>]*id=["']${inputId}["'][^>]*value=["']([^"']*)["']`, "i");
  const match = html.match(regex);
  return match ? decodeHtmlEntities(match[1]) : "";
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function detectStatus(html) {
  const paidPattern = /cobranca\s+ja\s+foi\s+paga|cobrança\s+já\s+foi\s+paga|pagamento\s+concluido|pagamento\s+concluído|ja\s+recebemos|já\s+recebemos|foi\s+paga/i;
  const expiredPattern = /cobranca\s+expirada|cobrança\s+expirada|cobranca\s+encerrada|cobrança\s+encerrada|cobranca\s+cancelada|cobrança\s+cancelada|vencida/i;
  const hasQrCode = /id=["']brcode["']|Copiar código do QR Code/i.test(html);

  if (paidPattern.test(html)) {
    return "paid";
  }

  if (expiredPattern.test(html)) {
    return "expired";
  }

  if (hasQrCode) {
    return "pending";
  }

  return "unknown";
}

async function fetchCobrancaData() {
  const url = getCobrancaUrl();
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; GabrielCheckoutBot/1.0)",
      Accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar cobrança Nubank: HTTP ${response.status}`);
  }

  const html = await response.text();
  const pixCode = extractInputValue(html, "brcode");
  const pixKey = extractInputValue(html, "pix-alias");
  const amountMatch = html.match(/<strong>\s*(R\$\s*[\d\.,]+)\s*<\/strong>/i);

  return {
    cobrancaUrl: url,
    status: detectStatus(html),
    pixCode,
    pixKey,
    amountText: amountMatch ? amountMatch[1].trim() : "R$ 28,00",
    hasQrCode: Boolean(pixCode),
    scannedAt: new Date().toISOString(),
  };
}

module.exports = {
  fetchCobrancaData,
  getCobrancaUrl,
};
