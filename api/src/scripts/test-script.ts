import 'dotenv/config';
import mongoose from 'mongoose';
import { MetadataService } from '../services/video_metadata_generator.service';

const runTest = async () => {
    console.log(">> Iniciando Teste de Integração...");

    if (!process.env.DB_URI) return console.error("❌ DB_URI missing");

    try {
        await mongoose.connect(process.env.DB_URI);
        const service = new MetadataService();

        // Caminho do arquivo de teste
        const filePath = "D:/YT Channels/Aslan Lofi/musics/Janeiro/02/youtubbe_chapters.txt";

        const input = {
            theme: "Lofi Worship Beats to Pray",
            niche: "Music",
            musicGenre: "Lofi Worship",
            language: "English",
            timestampFile: filePath
        };

        const result = await service.create(input);

        console.log("\n---------------------------------------------------");
        console.log(`✅ ID: ${result._id}`);
        console.log("---------------------------------------------------");
        console.log(`\n📝 [TÍTULO]: ${result.generatedTitle}`);

        console.log(`\n📄 [DESCRIÇÃO COMPLETA GERADA]:\n`);
        console.log(result.generatedDescription);

        console.log("\n---------------------------------------------------");

    } catch (error) {
        console.error("❌ Erro:", error);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();