const { createDownloadToken } = require("./_lib/access-token");
const { fetchCobrancaData } = require("./_lib/nubank-cobranca");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "metodo_nao_permitido" });
  }

  try {
    const data = await fetchCobrancaData();

    if (data.status !== "paid") {
      return res.status(402).json({
        ok: false,
        error: "pagamento_nao_confirmado",
        status: data.status,
      });
    }

    const token = createDownloadToken({ ttlSeconds: 60 * 60 * 6 });
    return res.status(200).json({
      ok: true,
      downloadToken: token,
      downloadUrl: `/download.html?access=${encodeURIComponent(token)}`,
      status: data.status,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "erro_ao_gerar_token",
      message: error.message,
    });
  }
};
