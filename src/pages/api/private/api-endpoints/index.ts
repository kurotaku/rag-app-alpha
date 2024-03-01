import { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ message: '認証されませんでした' });
    return;
  }

  switch (req.method) {
    case 'GET':
      const apiEndpoints = await prisma.apiEndpoint.findMany({
        orderBy: {id: 'asc'}
      });
      res.status(200).json(apiEndpoints);
      break;
    case 'POST':
      const {
        endpointType,
        useRag,
        name,
        description,
        url,
        primaryPrompt,
        secondaryPrompt,
        tertiaryPrompt,
        quaternaryPrompt,
        quinaryPrompt,
        primaryPromptDescription,
        secondaryPromptDescription,
        tertiaryPromptDescription,
        quaternaryPromptDescription,
        quinaryPromptDescription
      } = req.body;
      const apiEndpoint = await prisma.apiEndpoint.create({
        data: {
          endpointType,
          useRag,
          name,
          description,
          url,
          primaryPrompt,
          secondaryPrompt,
          tertiaryPrompt,
          quaternaryPrompt,
          quinaryPrompt,
          primaryPromptDescription,
          secondaryPromptDescription,
          tertiaryPromptDescription,
          quaternaryPromptDescription,
          quinaryPromptDescription
        },
      });
      res.status(200).json(apiEndpoint);
      break;
    default:
      res.status(405).json({ message: 'メソッドが許可されていません' });
      break;
  }
}
