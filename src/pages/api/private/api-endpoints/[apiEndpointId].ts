import { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { PrismaClient, ApiEndpoint } from '@prisma/client';
import { Session } from 'next-auth';
const prisma = new PrismaClient();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  type UpdateFields = Omit<ApiEndpoint, 'id' | 'createdAt' | 'updatedAt'>;

  const session: Session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ message: '認証されませんでした' });
    return;
  }

  const apiEndpointId: number = Number(req.query.apiEndpointId);

  switch (req.method) {
    case 'PUT':
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
        quinaryPromptDescription } = req.body;
      const updateData: UpdateFields = {
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
      };
      const updateApiEndpoint = await prisma.apiEndpoint.update({
        where: { id: apiEndpointId },
        data: updateData
      });
      res.status(200).json(updateApiEndpoint);
      break;
    case 'DELETE':
      const deleteApiEndpoint = await prisma.apiEndpoint.delete({
        where: { id: apiEndpointId },
      });
      res.status(204).json(deleteApiEndpoint);
      break;
    default:
      res.status(405).json({ message: 'メソッドが許可されていません' });
      break;
  }
}
