import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { User } from "../models/user.model";
import { validateEmail } from "../utils/validate_email.utils";

const authService = new AuthService();

export class AuthController {
    async register(req: Request, res: Response) {
        try {
            const { email, password, name } = req.body;

            if (!validateEmail(email)) {
                return res.status(400).json({ message: "E-mail inválido" });
            }

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: "User already exists" });
            }

            const hashedPassword = await authService.hashPassword(password);
            const user = await User.create({
                email,
                password: hashedPassword,
                name,
            });

            const token = authService.generateToken(user);
            res.status(201).json({ user, token });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            if (!validateEmail(email)) {
                return res.status(400).json({ message: "E-mail inválido" });
            }

            const user: any = await User.findOne({ email });
            if (!user || !user.password) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            const isMatch = await authService.comparePassword(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            const token = authService.generateToken(user);
            res.json({ user, token });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async googleLogin(req: Request, res: Response) {
        try {
            const { token } = req.body;
            const payload = await authService.verifyGoogleToken(token);

            if (!payload) {
                return res.status(401).json({ message: "Invalid Google token" });
            }

            let user: any = await User.findOne({ email: payload.email });

            if (!user) {
                user = await User.create({
                    email: payload.email,
                    name: payload.name,
                    picture: payload.picture,
                    googleId: payload.sub,
                });
            } else if (!user.googleId) {
                user.googleId = payload.sub;
                if (!user.picture) user.picture = payload.picture;
                await user.save();
            }

            const authToken = authService.generateToken(user);
            res.json({ user, token: authToken });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}
