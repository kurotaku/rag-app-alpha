import { ChatCompletionRequestMessage } from 'openai';
import { PrismaClient } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import https from 'https';

const prisma = new PrismaClient();

const useProxy: boolean = process.env.USE_PROXY === 'true';

const customHttpsAgent = new https.Agent({
  rejectUnauthorized: false
});

let httpsAgent;
if (useProxy) {
  const proxyUrl = `http://${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`;
  httpsAgent = new HttpsProxyAgent(proxyUrl);
}

const getAzureGptDeployment = async (): Promise<string> => {
  try {
    const parameter = await prisma.systemParameter.findUnique({
      where: {
        key: 'AzureGptDeployment',
      }
    });
    return parameter?.value || process.env.AZURE_OPENAI_API_DEPROYMENT;
  } catch(error) {
    console.error(`システムパラメーター(AzureGptDeployment)か、環境変数が正しくありません。：`, error);
  }
}

const getAzureGptVersion = async (): Promise<string> => {
  try {
    const parameter = await prisma.systemParameter.findUnique({
      where: {
        key: 'AzureGptVersion',
      }
    });
    return parameter?.value || process.env.AZURE_OPENAI_API_VERSION;
  } catch(error) {
    console.error(`システムパラメーター(AzureGptVersion)か、環境変数が正しくありません。：`, error);
  }
}

const createAxiosInstance = async (): Promise<AxiosInstance> => {
  const azureGptDeployment: string = await getAzureGptDeployment();

  return axios.create({
    baseURL: `${process.env.AZURE_OPENAI_API_ENDPOINT}/${azureGptDeployment}`,
    proxy: false,
    ...(useProxy && { httpsAgent: httpsAgent }),
    httpsAgent: customHttpsAgent,
    headers: {
      'api-key': `${process.env.AZURE_OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
}

export async function openaiCompletion(
  systemPrompts: Array<ChatCompletionRequestMessage> | null,
  conversations: Array<ChatCompletionRequestMessage>,
) {
  const axiosInstance: AxiosInstance = await createAxiosInstance();
  const azureGptVersion: string = await getAzureGptVersion();

  try {
    const completion = await axiosInstance.post(
      `/chat/completions?api-version=${azureGptVersion}`,
      {
        messages: [...(systemPrompts || []), ...conversations],
      },
    );
    return completion;
  } catch (error: any) {
    // TODO: 表示されてないのて修正必要
    console.error('AzureOpenAIへの接続でエラーが発生しました:', error);
  }
}
