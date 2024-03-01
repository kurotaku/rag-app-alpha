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
      const systemParameters = await prisma.systemParameter.findMany({
        orderBy: {id: 'asc'}
      });
      res.status(200).json(systemParameters);
      break;
    case 'POST':
      const { key, value, defaultValue, description } = req.body;
      const systemParameter = await prisma.systemParameter.create({
        data: {
          key,
          value,
          defaultValue,
          description,
        },
      });
      res.status(200).json(systemParameter);
      break;
    default:
      res.status(405).json({ message: 'メソッドが許可されていません' });
      break;
  }
}
