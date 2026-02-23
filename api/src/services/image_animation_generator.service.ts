import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export class ImageAnimationService {

    // Removi o musicPath, pois não precisamos mais da duração da música aqui
    public async generate_video(imagePath: string, loopDuration: number = 20): Promise<string> {
        const videoResources = path.resolve("./assets/video_resources");

        if (!fs.existsSync(videoResources)) {
            fs.mkdirSync(videoResources, { recursive: true });
        }

        const particles = path.join(videoResources, "particles.mp4");
        const lights = path.join(videoResources, "overlay.mp4");
        const tempParticles = path.join(videoResources, "temp_particles.mp4");

        // Nome do arquivo base curto (loop)
        const outputLoopPath = path.join(videoResources, "visual_loop_base.mp4");

        console.log(`🎬 Gerando loop base de vídeo (${loopDuration}s)...`);

        try {
            let finalImagePath = imagePath;

            if (!fs.existsSync(finalImagePath)) {
                throw new Error(`Imagem não encontrada: ${finalImagePath}`);
            }

            // Se for um diretório, pega a primeira imagem válida
            if (fs.lstatSync(finalImagePath).isDirectory()) {
                const files = fs.readdirSync(finalImagePath);
                const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
                const firstImage = files.find(file =>
                    validExtensions.includes(path.extname(file).toLowerCase())
                );

                if (!firstImage) {
                    throw new Error(`Nenhuma imagem válida encontrada no diretório: ${finalImagePath}`);
                }

                finalImagePath = path.join(finalImagePath, firstImage);
                console.log(`📸 Imagem selecionada do diretório: ${finalImagePath}`);
            }

            // Gera camada de partículas (Duração fixa curta)
            execSync(
                `ffmpeg -stream_loop -1 -i "${particles}" -loop 1 -i "${finalImagePath}" -t ${loopDuration} ` +
                `-filter_complex "[1:v][0:v]scale2ref[img][vid];[vid]format=rgba,colorchannelmixer=aa=0.25[ov];[img][ov]overlay,format=yuv420p" ` +
                `-shortest -y "${tempParticles}"`,
                { stdio: "inherit" }
            );

            // Gera camada de luzes sobre as partículas (Arquivo Final Curto)
            execSync(
                `ffmpeg -stream_loop -1 -i "${lights}" -i "${tempParticles}" -t ${loopDuration} ` +
                `-filter_complex "[0:v]format=rgba,colorchannelmixer=aa=0.2[ov];[1:v][ov]overlay,format=yuv420p" ` +
                `-shortest -y "${outputLoopPath}"`,
                { stdio: "inherit" }
            );

            // Remove temporário intermediário para economizar espaço
            if (fs.existsSync(tempParticles)) fs.unlinkSync(tempParticles);

            console.log("✅ Loop visual base criado com sucesso:", outputLoopPath);
            return outputLoopPath;

        } catch (error) {
            console.error("Falha ao gerar o vídeo base:", error);
            throw error;
        }
    }
}