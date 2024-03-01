import axios from 'axios';

export const logGptData = async (
  gptData: any,
  message: string,
  startedAt: Date,
  gptVendor: string,
  useCase: string,
  apiEndpointName: string
) => {
  const endedAtTime: Date = new Date();
  const responseTime: number = endedAtTime.getTime() - startedAt.getTime();

  try {
    const response = await axios.post(
      '/api/private/gpt-logs',
      {
        gptModel: gptData.model,
        gptVendor: gptVendor,
        promptTokens: gptData.usage.prompt_tokens,
        completionTokens: gptData.usage.completion_tokens,
        totalTokens: gptData.usage.total_tokens,
        prompt: message,
        totalPrompts: JSON.stringify(gptData.totalPrompts),
        response: gptData.choices[0].message.content,
        useCase: useCase,
        startedAt: startedAt,
        endedAt: endedAtTime,
        responseTime: responseTime,
        apiEndpointName: apiEndpointName
      },
      { withCredentials: true }
    );
    return response;
  } catch (error) {
    console.error('Error logging GPT data:', error);
    throw error;
  }
};
