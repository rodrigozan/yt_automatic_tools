import { Request, Response } from 'express';
import { VideoIndividualGeneratorService } from '../services/video_individual_generator.service';

export class VideoIndividualGeneratorController {

  private service: VideoIndividualGeneratorService;

  constructor() {
    this.service = new VideoIndividualGeneratorService();
  }

  /**
   * POST /video/generate_individual
   *
   * Body:
   *   sourceDir    {string} – pasta com imagens (01.jpeg…) e mp3s (01 - ….mp3)
   *   outputDir    {string} – (opcional) pasta de saída; usa sourceDir se omitida
   *   loopDuration {number} – (opcional) duração do loop visual em segundos (padrão 20)
   */
  public generate_individual = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sourceDir, outputDir } = req.body;

      if (!sourceDir) {
        res.status(400).json({
          error: 'Parâmetro obrigatório ausente: sourceDir é necessário.'
        });
        return;
      }

      console.log(`\n📁 Iniciando geração individual para: ${sourceDir}`);

      const result = await this.service.generate({
        sourceDir,
        outputDir
      });

      const message = {
        message: result.success
          ? 'Todos os vídeos individuais gerados com sucesso!'
          : `Geração concluída com ${result.errors.length} erro(s).`,
        data: result
      };

      console.log(message.message);

      res.status(200).json(message);

    } catch (error: any) {
      console.error('Erro no controller de geração individual:', error);
      res.status(500).json({
        error: 'Falha ao gerar vídeos individuais.',
        details: error.message
      });
    }
  };
}
