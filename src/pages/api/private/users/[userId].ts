import type { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { PrismaClient, User } from '@prisma/client';
const prisma = new PrismaClient();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  type UpdateFields = Omit<User, 'id' | 'password' | 'createdAt' | 'updatedAt'>;

  const session = await getServerSession(req, res, authOptions);

  const currentUser: User = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!session) {
    res.status(401).json({ message: '認証されませんでした' });
    return;
  }

  const userId = Number(req.query.userId);
  const user: User = await prisma.user.findUnique({
    where: { id: userId },
  });

  const checkUserRole = () => {
    return user.role !== 'ADMIN' || currentUser.role === 'ADMIN'
  }

  switch (req.method) {
    case 'PUT':
      if (!checkUserRole()) {
        res.status(401).json({ message: 'Adminの操作ができるのはAdminだけです' });
        return
      }

      const { name, role, email } = req.body;
      const updateData: UpdateFields = {
        name,
        role,
        email 
      };
      const updateUser = await prisma.user.update({
        where: { id: userId },
        data: updateData
      });
      res.status(200).json(updateUser);
      break;
    case 'DELETE':
      if (!checkUserRole()) {
        res.status(401).json({ message: 'Adminの操作ができるのはAdminだけです' });
        return
      }
      
      const deleteUser = await prisma.user.delete({
        where: { id: userId },
      });
      res.status(204).json(deleteUser);
      break;
    default:
      res.status(405).json({ message: 'メソッドが許可されていません' });
      break;
  }
};

export default handler;
