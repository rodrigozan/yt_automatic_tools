import { Request, Response } from "express";
import crypto from "crypto";
import { User } from "../models/user.model";
import { PublishedVideoModel } from "../models/published_video.model";
import { DataDeletionRequest } from "../models/data_deletion_request.model";

function generateCode(): string {
  return crypto.randomBytes(16).toString("hex");
}

function parseSignedRequest(signedRequest: string, appSecret: string): any | null {
  try {
    const [encodedSig, payload] = signedRequest.split(".");
    const sig = Buffer.from(encodedSig.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    const data = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    const expectedSig = crypto.createHmac("sha256", appSecret).update(payload).digest();
    if (!crypto.timingSafeEqual(sig, expectedSig)) return null;
    return data;
  } catch {
    return null;
  }
}

export class DataDeletionController {
  async requestDeletion(req: Request, res: Response) {
    try {
      const { email, signed_request } = req.body as { email?: string; signed_request?: string };
      let targetEmail = email?.trim().toLowerCase();

      if (signed_request && process.env.FACEBOOK_APP_SECRET) {
        const data = parseSignedRequest(signed_request, process.env.FACEBOOK_APP_SECRET);
        if (data?.user_id) {
          targetEmail = data.email || targetEmail;
        }
      }

      if (!targetEmail) {
        return res.status(400).json({ message: "E-mail é obrigatório para solicitar exclusão." });
      }

      const code = generateCode();
      await DataDeletionRequest.create({
        email: targetEmail,
        code,
        status: "pending",
        source: signed_request ? "facebook" : "user",
        facebookSignedRequest: signed_request || undefined,
      });

      const statusUrl = `${req.protocol}://${req.get("host")}/api/data-deletion/status/${code}`;
      const confirmationCode = code;

      setImmediate(async () => {
        try {
          await DataDeletionRequest.updateOne({ code }, { status: "processing" });
          const user = await User.findOne({ email: targetEmail });
          if (user) {
            await PublishedVideoModel.deleteMany({ userId: String(user._id) });
            await User.deleteOne({ email: targetEmail });
          }
          await DataDeletionRequest.updateOne({ code }, { status: user ? "completed" : "not_found", completedAt: new Date() });
        } catch {}
      });

      const isFacebookCallback = !!signed_request;
      if (isFacebookCallback) {
        return res.json({
          url: statusUrl,
          confirmation_code: confirmationCode,
        });
      }

      return res.status(201).json({
        message: "Solicitação de exclusão recebida. Seus dados serão excluídos em até 7 dias.",
        code: confirmationCode,
        statusUrl,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getStatus(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const record = await DataDeletionRequest.findOne({ code });
      if (!record) {
        return res.status(404).json({ message: "Código de solicitação não encontrado." });
      }
      return res.json({
        email: record.email,
        status: record.status,
        requestedAt: record.requestedAt,
        completedAt: record.completedAt,
        code: record.code,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async facebookCallback(req: Request, res: Response) {
    try {
      const signedRequest = (req.body?.signed_request as string) || (req.query?.signed_request as string);
      if (!signedRequest) {
        return res.status(400).json({ message: "signed_request é obrigatório (callback do Facebook)." });
      }
      req.body = { signed_request: signedRequest };
      return this.requestDeletion(req, res);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async instructions(_req: Request, res: Response) {
    return res.json({
      instructions:
        "Para solicitar a exclusão dos seus dados, acesse /exclusao-de-dados no site e informe seu e-mail, ou envie um POST para /api/data-deletion/request com { email }. Você receberá um código para acompanhar o status em /api/data-deletion/status/:code. Para o Facebook Data Deletion Callback, configure esta mesma URL como callback e enviaremos { url, confirmation_code } conforme exigido.",
      requestUrl: "/api/data-deletion/request",
      statusUrlPattern: "/api/data-deletion/status/:code",
      facebookCallbackUrl: "/api/data-deletion/callback",
    });
  }
}
