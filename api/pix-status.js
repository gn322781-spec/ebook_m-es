const { fetchCobrancaData } = require("./_lib/nubank-cobranca");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "metodo_nao_permitido" });
  }

  try {
    const data = await fetchCobrancaData();
    return res.status(200).json({
      ok: true,
      ...data,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "erro_ao_consultar_pix",
      message: error.message,
    });
  }
};
