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
      const ragFiles = await prisma.ragFile.findMany({
        orderBy: {id: 'asc'}
      });
      res.status(200).json(ragFiles);
      break;
    case 'POST':
      const {
        name,
      } = req.body;
      const ragFile = await prisma.ragFile.create({
        data: {
          name,
        },
      });
      res.status(200).json(ragFile);
      break;
    default:
      res.status(405).json({ message: 'メソッドが許可されていません' });
      break;
  }
}
