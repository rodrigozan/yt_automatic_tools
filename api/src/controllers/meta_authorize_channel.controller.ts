import { Request, Response } from "express";
import { MetaAuthorizeChannelService } from "../services/meta_authorize_channel.service";

export class MetaAuthorizeChannelController {
  static async auth(req: Request, res: Response) {
    try {
      const { email, channelId } = req.query;
      if (!email || !channelId) {
        return res.status(400).json({ error: "❌ Parâmetros 'email' e 'channelId' são obrigatórios." });
      }

      const url = MetaAuthorizeChannelService.getAuthUrl(String(email), String(channelId));
      if (req.headers.accept?.includes("application/json") || req.xhr) {
        return res.json({ url });
      }
      return res.redirect(url);
    } catch (err: any) {
      console.error("❌ Erro ao gerar URL de autorização Meta:", err.message);
      res.status(500).json({ error: "Erro ao gerar URL de autorização." });
    }
  }

  static async callback(req: Request, res: Response) {
    const code = req.query.code as string;
    const state = req.query.state as string;

    if (!code || !state) {
      return res.status(400).send("Código ou state ausente.");
    }

    try {
      const { email, channelId } = MetaAuthorizeChannelService.decodeState(state);

      const shortLived = await MetaAuthorizeChannelService.exchangeCodeForUserToken(code);
      const longLived = await MetaAuthorizeChannelService.exchangeForLongLivedUserToken(shortLived.access_token);
      const metaUserId = await MetaAuthorizeChannelService.getMetaUserId(longLived.access_token);
      const pages = await MetaAuthorizeChannelService.listUserPages(longLived.access_token);

      if (pages.length === 0) {
        return res
          .status(400)
          .send("Nenhuma Página do Facebook encontrada para esta conta. Verifique se você é administrador de alguma Página.");
      }

      if (pages.length === 1) {
        await MetaAuthorizeChannelService.savePageConnection(email, channelId, pages[0], metaUserId);
        return res.send(`
          <h2>✅ Página "${pages[0].name}" conectada com sucesso!</h2>
          <p>Facebook e (se vinculado) Instagram Business estão prontos para publicação.</p>
        `);
      }

      // Múltiplas Páginas na conta: seletor simples antes de salvar.
      const links = pages
        .map(
          (p) =>
            `<li><a href="/api/meta/select-page?state=${encodeURIComponent(state)}&pageId=${encodeURIComponent(
              p.id
            )}&userToken=${encodeURIComponent(longLived.access_token)}">${p.name}</a></li>`
        )
        .join("");

      return res.send(`
        <h2>Selecione a Página do Facebook para conectar a este canal:</h2>
        <ul>${links}</ul>
      `);
    } catch (err: any) {
      console.error("❌ Erro no callback Meta:", err.message);
      return res.status(500).send("Erro ao processar autenticação com o Meta.");
    }
  }

  static async selectPage(req: Request, res: Response) {
    try {
      const state = req.query.state as string;
      const pageId = req.query.pageId as string;
      const userToken = req.query.userToken as string;

      if (!state || !pageId || !userToken) {
        return res.status(400).send("Parâmetros ausentes.");
      }

      const { email, channelId } = MetaAuthorizeChannelService.decodeState(state);
      const pages = await MetaAuthorizeChannelService.listUserPages(userToken);
      const page = pages.find((p) => p.id === pageId);

      if (!page) {
        return res.status(404).send("Página não encontrada.");
      }

      const metaUserId = await MetaAuthorizeChannelService.getMetaUserId(userToken);
      await MetaAuthorizeChannelService.savePageConnection(email, channelId, page, metaUserId);

      return res.send(`
        <h2>✅ Página "${page.name}" conectada com sucesso!</h2>
        <p>Facebook e (se vinculado) Instagram Business estão prontos para publicação.</p>
      `);
    } catch (err: any) {
      console.error("❌ Erro ao selecionar Página:", err.message);
      return res.status(500).send("Erro ao conectar Página selecionada.");
    }
  }
}
