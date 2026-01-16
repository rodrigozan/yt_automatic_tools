export const detectChannelType = (name: string) => {
  const n = name.toLowerCase();

  if (/lofi|relax|soaking|sleep|worship|gospel|music|soul|r&b|jazz|soaking|focus/.test(n)) return "music";
  if (/anime|bíblia|bible|story|história/.test(n)) return "story";
  if (/cortes|podcast|clip/.test(n)) return "podcast_clip";

  return "music"; // fallback
}
