const fs = require("fs");
const path = require("path");
const { validateDownloadToken } = require("./_lib/access-token");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "metodo_nao_permitido" });
  }

  const token = req.query.token;
  const validation = validateDownloadToken(token);
  if (!validation.valid) {
    return res.status(401).json({ ok: false, error: "acesso_negado" });
  }

  const pdfPath = path.join(process.cwd(), "assets", "ebook.pdf");
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ ok: false, error: "arquivo_nao_encontrado" });
  }

  const stat = fs.statSync(pdfPath);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", stat.size);
  res.setHeader("Content-Disposition", "attachment; filename=\"guia-maes-solo-renda-em-casa.pdf\"");
  res.setHeader("Cache-Control", "no-store");

  const stream = fs.createReadStream(pdfPath);
  stream.on("error", () => {
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: "erro_ao_ler_arquivo" });
    } else {
      res.end();
    }
  });
  stream.pipe(res);
};
