import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/user.model";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService {
    async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, 10);
    }

    async comparePassword(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash);
    }

    generateToken(user: any): string {
        const payload = {
            id: user._id,
            email: user.email,
        };
        return jwt.sign(payload, process.env.JWT_SECRET || "secret", {
            expiresIn: "30d",
        });
    }

    async verifyGoogleToken(token: string) {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        return ticket.getPayload();
    }
}
