export function extractJson<T = any>(content: string): T {
    const trimmed = content.trim();
    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const jsonString = fencedMatch ? fencedMatch[1].trim() : trimmed;
    return JSON.parse(jsonString) as T;
}
