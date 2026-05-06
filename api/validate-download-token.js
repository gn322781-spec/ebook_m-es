const { validateDownloadToken } = require("./_lib/access-token");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "metodo_nao_permitido" });
  }

  const token = req.query.token;
  const validation = validateDownloadToken(token);

  if (!validation.valid) {
    return res.status(401).json({
      ok: false,
      error: validation.reason,
    });
  }

  return res.status(200).json({
    ok: true,
    payload: validation.payload,
  });
};
