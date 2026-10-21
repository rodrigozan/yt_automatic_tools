import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface GladiadorYtClaims extends jwt.JwtPayload {
  agentId: "gladiador-dourado";
  channelIds: string[];
  scope: "youtube:publish";
}

declare global {
  namespace Express { interface Request { gladiadorYt?: GladiadorYtClaims } }
}

function allowedChannelIds(): string[] {
  return (process.env.GLADIADOR_YT_CHANNEL_IDS || "").split(",").map((id) => id.trim()).filter(Boolean);
}

export function requireGladiadorYoutube(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.PHANTERCLAW_YT_JWT_SECRET;
  if (!secret) return res.status(503).json({ error: "Publicação do Gladiador não configurada no servidor." });
  const token = req.header("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: "Credencial de publicação ausente." });
  let claims: GladiadorYtClaims;
  try {
    claims = jwt.verify(token, secret, { issuer: "phanterclaw", audience: "yt-automatic-tools" }) as GladiadorYtClaims;
  } catch {
    return res.status(401).json({ error: "Credencial de publicação inválida ou expirada." });
  }
  if (claims.agentId !== "gladiador-dourado" || claims.scope !== "youtube:publish" || !Array.isArray(claims.channelIds)) {
    return res.status(403).json({ error: "Agente sem autorização para publicar no YouTube." });
  }
  const serverAllowlist = allowedChannelIds();
  if (!serverAllowlist.length || claims.channelIds.some((id) => !serverAllowlist.includes(id))) {
    return res.status(403).json({ error: "Canais autorizados do Gladiador não correspondem à configuração do servidor." });
  }
  const requestedChannel = typeof req.body?.channelId === "string" ? req.body.channelId :
    typeof req.query?.channelId === "string" ? req.query.channelId : undefined;
  const publishingYoutube = req.path === "/publisher/publish"
    ? Array.isArray(req.body?.platforms) && req.body.platforms.includes("youtube")
    : req.method !== "GET";
  if ((publishingYoutube || req.method === "GET") && (!requestedChannel || !claims.channelIds.includes(requestedChannel))) {
    return res.status(403).json({ error: "O Gladiador só pode publicar nos canais autorizados." });
  }
  req.gladiadorYt = claims;
  return next();
}
