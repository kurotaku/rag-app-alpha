import { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session: Session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ message: '認証されませんでした' });
    return;
  }

  switch (req.method) {
    case 'GET':
      const users = await prisma.user.findMany({
        orderBy: {id: 'desc'}
      });
      res.status(200).json(users);
      break;
    case 'POST':
      const {
        role,
        name,
        email,
        password
      } = req.body;
      const createUser = await prisma.user.create({
        data: {
          role,
          name,
          email,
          password: bcrypt.hashSync(password, 10),
        },
      });
      res.status(200).json(createUser);
      break;
    default:
      res.status(405).json({ message: 'メソッドが許可されていません' });
      break;
  }
}
