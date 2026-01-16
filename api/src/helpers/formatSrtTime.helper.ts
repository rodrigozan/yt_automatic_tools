export const formatSrtTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000); // Milissegundos

  const pad = (n: number) => n.toString().padStart(2, "0");
  const padMs = (n: number) => n.toString().padStart(3, "0");

  // Ex: 00:02:30,500
  return `${pad(h)}:${pad(m)}:${pad(s)},${padMs(ms)}`;
};
