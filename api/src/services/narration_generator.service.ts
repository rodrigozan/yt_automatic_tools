import fs from 'fs';
import path from 'path';
import { Types } from 'mongoose';
import { OpenRouterService } from './openrouter.service';
import { ChapterModel } from '../models/chapter.model';
import { INarrationFile } from '../models/pipeline_run.model';

export class NarrationGeneratorService {
    private openRouter: OpenRouterService;
    public readonly model: string;
    public readonly voice: string;

    constructor() {
        this.openRouter = new OpenRouterService();
        this.model = process.env.OPENROUTER_MODEL_TTS || 'openai/tts-1';
        this.voice = process.env.OPENROUTER_TTS_VOICE || 'alloy';
    }

    public async generateForRun(
        pipelineRunId: Types.ObjectId,
        existingFiles: INarrationFile[]
    ): Promise<INarrationFile[]> {
        const chapters = await ChapterModel.find({ pipeline_run_id: pipelineRunId, status: 'approved' })
            .sort({ chapter_number: 1 });

        const dir = path.join(process.cwd(), 'assets', 'narrations', String(pipelineRunId));
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const files: INarrationFile[] = [...existingFiles];

        for (const chapter of chapters) {
            const filePath = path.join(dir, `${pipelineRunId}_cap${chapter.chapter_number}.mp3`);
            const already = files.find((f) => f.chapter_number === chapter.chapter_number);

            if (already && fs.existsSync(already.path)) continue;

            const speech = await this.openRouter.textToSpeech({
                model: this.model,
                voice: this.voice,
                input: chapter.text,
            });

            fs.writeFileSync(filePath, speech.audio);

            const withoutChapter = files.filter((f) => f.chapter_number !== chapter.chapter_number);
            files.length = 0;
            files.push(...withoutChapter, { chapter_number: chapter.chapter_number, path: filePath });
        }

        return files.sort((a, b) => a.chapter_number - b.chapter_number);
    }
}
