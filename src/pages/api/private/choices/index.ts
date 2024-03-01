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

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  switch (req.method) {
    case 'GET':
      const choices = await prisma.choice.findMany({
        orderBy: {id: 'asc'},
        where: {
          questionId: Number(req.query.questionId),
        },
      });
      res.status(200).json(choices);
      break;
    case 'POST':
      const { name, prompt } = req.body;
      const choice = await prisma.choice.create({
        data: {
          name,
          prompt,
          question: {
            connect: {
              id: req.body.questionId,
            },
          },
        },
      });
      res.status(200).json(choice);
      break;
    default:
      res.status(405).json({ message: 'メソッドが許可されていません' });
      break;
  }
}
