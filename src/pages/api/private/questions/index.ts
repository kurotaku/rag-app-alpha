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
      const questions = await prisma.question.findMany({
        include: {
          choices: true,
        },
      });
      res.status(200).json(questions);
      break;
    case 'POST':
      const { name } = req.body;
      const question = await prisma.question.create({
        data: {
          name,
        },
      });
      res.status(200).json(question);
      break;
    default:
      res.status(405).json({ message: 'メソッドが許可されていません' });
      break;
  }
}
