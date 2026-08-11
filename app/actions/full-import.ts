'use server';

import { mastra } from '@/mastra';

export async function fullImportAction(
  title: string,
  fandom: string,
  characters: string,
  premise: string,
  storyText: string,
) {
  try {
    const workflow = mastra.getWorkflow('fullImportWorkflow');

    const run = await workflow.createRun({
      resourceId: `import-${Date.now()}`,
    });

    const result = await run.start({
      inputData: { title, fandom, characters, premise, storyText },
    });

    if (result.status !== 'success') {
      return { success: false, error: '导入过程中出现错误，请重试。' };
    }

    return { success: true, projectId: result.result.projectId };
  } catch (error) {
    console.error('全量导入失败:', error);
    return { success: false, error: '导入过程中出现错误，请重试。' };
  }
}