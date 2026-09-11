import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { getDuration } from '../helpers/getDuration.helper';
import { IVisualPrompt, INarrationFile } from '../models/pipeline_run.model';

const WIDTH = 1920;
const HEIGHT = 1080;

function escapeForConcatList(filePath: string): string {
    return filePath.replace(/'/g, "'\\''");
}

export class NarrativeVideoAssemblerService {
    public async assemble(
        pipelineRunId: string,
        narrationFiles: INarrationFile[],
        visualPrompts: IVisualPrompt[]
    ): Promise<string> {
        const workDir = path.join(process.cwd(), 'assets', 'narrative_videos', pipelineRunId);
        if (!fs.existsSync(workDir)) fs.mkdirSync(workDir, { recursive: true });

        const chapterVideos: string[] = [];
        const sortedNarrations = [...narrationFiles].sort((a, b) => a.chapter_number - b.chapter_number);

        for (const narration of sortedNarrations) {
            const chapterPrompts = visualPrompts
                .filter((vp) => vp.chapter_number === narration.chapter_number && vp.image_path)
                .sort((a, b) => a.time_range.localeCompare(b.time_range));

            if (!chapterPrompts.length) continue;

            const chapterVideoPath = path.join(workDir, `cap${narration.chapter_number}.mp4`);
            await this.buildChapterVideo(
                narration.path,
                chapterPrompts.map((p) => p.image_path!),
                chapterVideoPath,
                workDir,
                narration.chapter_number
            );
            chapterVideos.push(chapterVideoPath);
        }

        if (!chapterVideos.length) {
            throw new Error('Nenhum vídeo de capítulo pôde ser montado — faltam imagens geradas para os capítulos narrados');
        }

        const finalVideoPath = path.join(workDir, 'final_video.mp4');
        await this.concatChapterVideos(chapterVideos, finalVideoPath, workDir);

        return finalVideoPath;
    }

    private async buildChapterVideo(
        audioPath: string,
        imagePaths: string[],
        outputPath: string,
        workDir: string,
        chapterNumber: number
    ): Promise<void> {
        const totalDuration = await getDuration(audioPath);
        const perImageDuration = totalDuration / imagePaths.length;

        const listPath = path.join(workDir, `_list_cap${chapterNumber}.txt`);
        const lines: string[] = [];

        for (const img of imagePaths) {
            lines.push(`file '${escapeForConcatList(img)}'`);
            lines.push(`duration ${perImageDuration.toFixed(3)}`);
        }
        lines.push(`file '${escapeForConcatList(imagePaths[imagePaths.length - 1])}'`);
        fs.writeFileSync(listPath, lines.join('\n'));

        const silentVideoPath = path.join(workDir, `_silent_cap${chapterNumber}.mp4`);

        execSync(
            `ffmpeg -y -f concat -safe 0 -i "${listPath}" -vf "scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease,pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2,format=yuv420p" -r 25 "${silentVideoPath}"`,
            { stdio: 'inherit' }
        );

        execSync(
            `ffmpeg -y -i "${silentVideoPath}" -i "${audioPath}" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -shortest "${outputPath}"`,
            { stdio: 'inherit' }
        );

        fs.unlinkSync(listPath);
        fs.unlinkSync(silentVideoPath);
    }

    private async concatChapterVideos(chapterVideos: string[], outputPath: string, workDir: string): Promise<void> {
        const listPath = path.join(workDir, '_final_list.txt');
        const lines = chapterVideos.map((v) => `file '${escapeForConcatList(v)}'`);
        fs.writeFileSync(listPath, lines.join('\n'));

        execSync(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`, { stdio: 'inherit' });

        fs.unlinkSync(listPath);
    }
}
