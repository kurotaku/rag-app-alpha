import { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { PrismaClient, RagFile } from '@prisma/client';
import { Session } from 'next-auth';
const prisma = new PrismaClient();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  type UpdateFields = Omit<RagFile, 'id' | 'createdAt' | 'updatedAt'>;

  const session: Session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ message: '認証されませんでした' });
    return;
  }

  const ragFileId: number = Number(req.query.ragFileId);

  switch (req.method) {
    case 'PUT':
      const {
        name,
      } = req.body;
      const updateData: UpdateFields = {
        name,
      };
      const updateRagFile = await prisma.ragFile.update({
        where: { id: ragFileId },
        data: updateData
      });
      res.status(200).json(updateRagFile);
      break;
    case 'DELETE':
      const deleteRagFile = await prisma.ragFile.delete({
        where: { id: ragFileId },
      });
      res.status(204).json(deleteRagFile);
      break;
    default:
      res.status(405).json({ message: 'メソッドが許可されていません' });
      break;
  }
}
