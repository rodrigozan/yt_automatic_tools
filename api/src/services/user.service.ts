import { User } from "../models/user.model"; // Ajuste o import conforme seu modelo

export class UserService {

    /**
     * Busca um usuário pelo email. Se não existir, cria um novo.
     */
    async findOrCreate(email: string) {
        // 1. Tenta achar
        let user = await User.findOne({ email });

        // 2. Se não achar, cria
        if (!user) {
            console.log(`Usuário não encontrado. Criando novo registro para: ${email}`);
            user = await User.create({
                email: email,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        return user;
    }
}