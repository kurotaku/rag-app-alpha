import { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { PrismaClient, Choice } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  type UpdateFields = Pick<Choice, 'name' |  'prompt'>;
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ message: '認証されませんでした' });
    return;
  }

  const choiceId = Number(req.query.choiceId);

  switch (req.method) {
    case 'GET':
      const getChoice = await prisma.choice.findUnique({
        where: { id: choiceId },
      });
      res.status(204).json(getChoice);
      break;
      case 'PUT':
        const updateData: UpdateFields = {
          name: req.body.name,
          prompt: req.body.prompt,
        };
        const updateChoice = await prisma.choice.update({
          where: { id: choiceId },
          data: updateData
        });
        res.status(200).json(updateChoice);
        break;
    case 'DELETE':
      const deleteChoice = await prisma.choice.delete({
        where: { id: choiceId },
      });
      res.status(204).json(deleteChoice);
      break;
    default:
      res.status(405).json({ message: 'メソッドが許可されていません' });
      break;
  }
}
