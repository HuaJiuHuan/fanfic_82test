import { Mastra } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';
import { writingAgent } from './agents/writing-agent';
import { editorAgent } from './agents/editor-agent';
import { settingAgent } from './agents/setting-agent';
import { fullImportWorkflow } from './workflows/full-import';

export const mastra = new Mastra({
  agents: { writingAgent, editorAgent, settingAgent },
  workflows: { fullImportWorkflow },
  storage: new LibSQLStore({
    id: 'fanfic-mastra-storage',
    url: 'file:./mastra/mastra.db',
  }),
});