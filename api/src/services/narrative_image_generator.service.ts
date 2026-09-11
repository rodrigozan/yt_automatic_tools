import fs from 'fs';
import path from 'path';
import { Types } from 'mongoose';
import { OpenRouterService } from './openrouter.service';
import { IVisualPrompt } from '../models/pipeline_run.model';

export class NarrativeImageGeneratorService {
    private openRouter: OpenRouterService;
    public readonly model: string;

    constructor() {
        this.openRouter = new OpenRouterService();
        this.model = process.env.OPENROUTER_MODEL_IMAGE || 'google/gemini-2.5-flash-image';
    }

    public async generateForRun(
        pipelineRunId: Types.ObjectId,
        visualPrompts: IVisualPrompt[]
    ): Promise<IVisualPrompt[]> {
        const dir = path.join(process.cwd(), 'assets', 'narrative_images', String(pipelineRunId));
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const updated: IVisualPrompt[] = [];

        for (let i = 0; i < visualPrompts.length; i++) {
            const vp = visualPrompts[i];

            if (vp.image_path && fs.existsSync(vp.image_path)) {
                updated.push(vp);
                continue;
            }

            const filePath = path.join(dir, `cap${vp.chapter_number}_${String(i).padStart(3, '0')}.png`);

            if (fs.existsSync(filePath)) {
                updated.push({ ...vp, image_path: filePath });
                continue;
            }

            const image = await this.openRouter.generateImage({ model: this.model, prompt: vp.prompt });
            fs.writeFileSync(filePath, image.image);

            updated.push({ ...vp, image_path: filePath });
        }

        return updated;
    }
}
