export interface ShortFormCheckInput {
  channelType?: string;
  title?: string;
  explicitOverride?: boolean;
}

/**
 * Fonte única de verdade para decidir Shorts/Reels vs. conteúdo longo,
 * compartilhada entre YouTube, Facebook e Instagram.
 */
export function isShortFormContent(input: ShortFormCheckInput): boolean {
  if (typeof input.explicitOverride === "boolean") return input.explicitOverride;

  return (
    input.channelType === "podcast_clip" ||
    input.channelType === "short" ||
    (input.title?.toLowerCase().includes("#short") ?? false)
  );
}
