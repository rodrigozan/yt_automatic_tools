import { test } from 'node:test';
import assert from 'node:assert/strict';
import { YtVideoSnippetService } from '../src/services/yt_video_snippet.service';
import { YtCommentsService } from '../src/services/yt_comments.service';

test('edita apenas snippet, preserva campos omitidos e confirma status por nova leitura', async () => {
  const original = YtCommentsService.getYoutubeClient;
  let reads = 0;
  let request: any;
  const status = { privacyStatus: 'private', publishAt: '2026-10-29T15:24:00Z' };
  const snippet = { channelId: 'channel', title: 'Antigo', description: 'Descrição', tags: ['tag'], categoryId: '22', defaultLanguage: 'pt' };
  YtCommentsService.getYoutubeClient = async () => ({ videos: {
    list: async () => { reads++; return { data: { items: [{ snippet: reads === 1 ? snippet : { ...snippet, title: 'Novo' }, status }] } }; },
    update: async (args: any) => { request = args; return { data: {} }; },
  } } as any);
  try {
    const result = await YtVideoSnippetService.update('channel', 'video', { title: 'Novo' });
    assert.equal(reads, 2);
    assert.deepEqual(request.part, ['snippet']);
    assert.equal(request.requestBody.status, undefined);
    assert.equal(request.requestBody.snippet.description, 'Descrição');
    assert.deepEqual(request.requestBody.snippet.tags, ['tag']);
    assert.equal(request.requestBody.snippet.categoryId, '22');
    assert.equal(result.verified, true);
    reads = 0;
    await assert.rejects(YtVideoSnippetService.update('other', 'video', { title: 'Novo' }), /não pertence/);
    await assert.rejects(YtVideoSnippetService.update('channel', 'video', { title: '' }), /title inválido/);
  } finally { YtCommentsService.getYoutubeClient = original; }
});
