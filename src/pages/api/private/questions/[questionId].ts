import { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { PrismaClient, Question } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  type UpdateFields = Pick<Question, 'name'>;
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ message: '認証されませんでした' });
    return;
  }

  const questionId = Number(req.query.questionId);

  switch (req.method) {
    case 'GET':
      const getQuestion = await prisma.question.findUnique({
        where: { id: questionId },
      });
      res.status(204).json(getQuestion);
      break;
      case 'PUT':
        const updateData: UpdateFields = {
          name: req.body.name,
        };
        const updateQuestion = await prisma.question.update({
          where: { id: questionId },
          data: updateData
        });
        res.status(200).json(updateQuestion);
        break;
    case 'DELETE':
      const deleteQuestion = await prisma.question.delete({
        where: { id: questionId },
      });
      res.status(204).json(deleteQuestion);
      break;
    default:
      res.status(405).json({ message: 'メソッドが許可されていません' });
      break;
  }
}
