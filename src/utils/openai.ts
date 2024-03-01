import { ChatCompletionRequestMessage } from 'openai';
import { PrismaClient } from '@prisma/client';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

const prisma = new PrismaClient();

const useProxy: boolean = process.env.USE_PROXY === 'true';

const httpsAgent: HttpsProxyAgent<string> | undefined = useProxy 
  ? new HttpsProxyAgent<string>(`http://${process.env.PROXY_HOST}:${parseInt(process.env.PROXY_PORT, 10)}`)
  : undefined;

const axiosInstance: AxiosInstance = axios.create({
  baseURL: 'https://api.openai.com/v1',
  proxy: false,
  httpsAgent,
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

const getOpenAiModelName = async (): Promise<string> => {
  try {
    const parameter = await prisma.systemParameter.findUnique({
      where: {
        key: 'OpenAiModelName',
      }
    });
    return parameter?.value || process.env.OPENAI_API_MODEL_NAME;
  } catch(error) {
    console.error(`システムパラメーター(OpenAiModelName)か、環境変数が正しくありません。：`, error);
  }
}

export async function openaiCompletion(
  systemPrompts: Array<ChatCompletionRequestMessage> | null,
  conversations: Array<ChatCompletionRequestMessage>,
): Promise<AxiosResponse | void> {
  try {
    const gptModel: string = await getOpenAiModelName();
    const completion = await axiosInstance.post('/chat/completions', {
      model: gptModel,
      messages: [...(systemPrompts || []), ...conversations],
    });
    return completion;
  } catch (error: any) {
    console.error('OpenAIへの接続でエラーが発生しました:', error);
  }
}
