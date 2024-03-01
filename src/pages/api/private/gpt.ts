import type { NextApiRequest, NextApiResponse } from 'next';
import { ChatCompletionRequestMessage, ChatCompletionResponseMessage } from 'openai';
import { openaiCompletion } from '@/utils/openai';
import { openaiCompletion as azureOpenaiCompletion } from '@/utils/azureOpenai';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'メソッドが許可されていません' });
    return;
  }

  const userInputs = req.body.userInputs ? req.body.userInputs : '';
  const primaryPrompt = req.body.primaryPrompt ? req.body.primaryPrompt : '';
  const secondaryPrompt: string | null = req.body.secondaryPrompt;

  const systemPrompts: ChatCompletionRequestMessage[] = [
    {
      role: 'system',
      content: userInputs + primaryPrompt,
    },
  ];

  let conversations: ChatCompletionRequestMessage[];

  if (secondaryPrompt) {
    conversations =  [{
      role: 'user',
      content: secondaryPrompt,
    }];
  } else {
    conversations = req.body.messages;
  }

  const gptVendor: string = process.env.GPT_VENDOR || 'OPENAI';

  try {
    const completion =
      gptVendor == 'OPENAI'
        ? await openaiCompletion(systemPrompts, conversations)
        : await azureOpenaiCompletion(systemPrompts, conversations);
    
    if (!completion || !completion.data) {
      throw new Error('completionのデータの取得に失敗しました。');
    }

    res.status(200).json({
      ...completion.data,
      totalPrompts: { ...systemPrompts.map((prompt) => prompt.content) },
    });
    return;
  } catch (error) {
      res.status(500).json(`GPTへのリクエストに失敗しました：${error}`);
      return;
  }
};

export default handler;
