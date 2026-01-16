export const detectChannelGenre = (text: string): "christian" | "secular" => {
  const t = text.toLowerCase();
  
  // Lista de palavras-chave Cristãs
  if (/worship|gospel|bible|bíblia|jesus|god|deus|louvor|adoracao|church|pray/.test(t)) {
    return "christian";
  } else return "secular"

};