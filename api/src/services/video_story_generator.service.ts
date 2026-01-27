import { spawn } from 'child_process';
import path from 'path';

export class VideoStoryGeneratorService {

    public async executeProcess(workDir: string, musicPath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            // Ajuste o caminho relativo conforme a estrutura do seu build/dist
            const pythonScript = path.resolve(__dirname, '../../index.py');

            const pythonProcess = spawn('py', [pythonScript, workDir, musicPath]);

            pythonProcess.stdout.on('data', (data) => {
                console.log(`[Python Stdout]: ${data.toString()}`);
            });

            pythonProcess.stderr.on('data', (data) => {
                console.error(`[Python Stderr]: ${data.toString()}`);
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    resolve('Processamento de vídeo concluído com sucesso.');
                } else {
                    reject(new Error(`O script Python encerrou com erro. Código: ${code}`));
                }
            });
        });
    }
}