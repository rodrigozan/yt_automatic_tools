import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";

config();

export class YtMetadataService {
  private static genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  private static model = this.genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  /**
   * Gera metadados usando o arquivo de capítulos já existente (youtube_chapters.txt)
   */
  static async generateFromChapters(
    theme: string,
    style: "christian" | "secular",
    chaptersContent: string // O conteúdo cru do arquivo .txt
  ) {
    let contextInstruction = "";
    if (style === "christian") {
      contextInstruction = "Context: This is a Christian/Gospel context. Focus on faith, God, worship, and spiritual uplifting.";
    } else if (style === "secular") {
      contextInstruction = "Context: This is a Secular/Life context. Focus on human emotion, motivation, feelings, and lifestyle.";
    } else {
      contextInstruction = "Context: General music appreciation. Focus on the musical quality, the artist, and the vibe.";
    }
    
    const prompt = `
      You are a world-class YouTube SEO expert for a Music Channel.
      
      INPUT DATA:
      - Theme/Title idea: "${theme}"
      - Spiritual/Ideological Context: ${style}
      - Tracklist provided below:
      ${chaptersContent}
      
      TRACKLIST PROVIDED (Do not change timestamps, just copy exactly):
      ${chaptersContent}

     TASK:
      Analyze the "Theme" to determine the musical genre and energy level (e.g., Sad, Hype, Relaxing, Aggressive, Nostalgic).
      Generate a JSON object with 'title', 'description', and 'tags' that perfectly matches this energy.

      ### JSON STRUCTURE REQUIREMENTS:
      
      - **Section 1 (Intro):** 2 paragraphs describing the feeling of the music. 
           *CRITICAL:* Match the tone to the music! 
           - If it's Sleep/Lofi -> use soothing, calm words (night, peace).
           - If it's Workout/Rock -> use energetic, powerful words (power, grind).
           - If it's Sad/Emotional -> use touching, deep words.
           - If Christian -> Connect the music to the spiritual context provided.
         
         - **Section 2 (Tracklist):** - Header: "🎵 Tracklist:"
           - Copy the provided tracklist EXACTLY.
         
         - **Section 3 (Featured Quote/Message):**
           - Header based on context (e.g., "📖 Verse of the Day" for Christian, "💡 Quote of the Day" for Secular, or "💬 Message" for General).
           - Insert a quote, verse, or lyric that matches the mood of the playlist.
         
         - **Section 4 (Best Situations):**
           - Header: "✨ Perfect for:"
           - Bullet points listing 4 situations where this music fits best (e.g., "Driving at night", "Heavy lifting", "Prayer time", "Studying").
         
         - **Section 5 (Hashtags):**
           - 5 to 8 hashtags relevant to the specific genre and theme.

      REQUIREMENTS FOR TITLE:
      - Must be catchy, high CTR.
      - Must include the main genre/theme keywords.

      REQUIREMENTS FOR TAGS:
      - Array of 15-20 relevant keywords (mix of broad and long-tail).
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const jsonResponse = JSON.parse(result.response.text());

      return {
        title: jsonResponse.title,
        description: jsonResponse.description,
        tags: jsonResponse.tags
      };
    } catch (error) {
      console.error("Gemini Error:", error);
      throw new Error("Falha ao gerar metadados com IA");
    }
  }
}