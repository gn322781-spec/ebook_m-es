const crypto = require("crypto");

function toBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(base64 + padding, "base64").toString("utf8");
}

function getTokenSecret() {
  return process.env.DOWNLOAD_TOKEN_SECRET || "troque-esta-chave-em-producao";
}

function signPayload(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

function createDownloadToken(options = {}) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const ttlSeconds = Number(options.ttlSeconds || 3600);
  const payload = {
    kind: "ebook-download-access",
    iat: nowSeconds,
    exp: nowSeconds + ttlSeconds,
    source: options.source || "pix-cobranca",
  };

  const payloadEncoded = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(payloadEncoded, getTokenSecret());
  return `${payloadEncoded}.${signature}`;
}

function validateDownloadToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false, reason: "token_invalido" };
  }

  const [payloadEncoded, providedSignature] = token.split(".");
  const expectedSignature = signPayload(payloadEncoded, getTokenSecret());

  if (
    !providedSignature ||
    providedSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))
  ) {
    return { valid: false, reason: "assinatura_invalida" };
  }

  let payload;
  try {
    payload = JSON.parse(fromBase64Url(payloadEncoded));
  } catch (error) {
    return { valid: false, reason: "payload_invalido" };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!payload.exp || nowSeconds > payload.exp) {
    return { valid: false, reason: "token_expirado" };
  }

  if (payload.kind !== "ebook-download-access") {
    return { valid: false, reason: "token_incorreto" };
  }

  return { valid: true, payload };
}

module.exports = {
  createDownloadToken,
  validateDownloadToken,
};
