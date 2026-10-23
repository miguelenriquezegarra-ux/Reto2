import type { LlmAdapter,ModelResponse } from '../../src/llm/adapter.js';
export class ScriptedAdapter implements LlmAdapter {
 index=0;
 constructor(private answers:(ModelResponse|Error)[]){}
 async enviar():Promise<ModelResponse>{const a=this.answers[this.index++];if(a instanceof Error)throw a;return a??{texto:'sin hechos',toolCalls:[],usage:{inputTokens:0,outputTokens:0}};}
}
