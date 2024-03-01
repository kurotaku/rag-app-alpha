import { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!session) {
    res.status(401).json({ message: '認証されませんでした' });
    return;
  }

  switch (req.method) {
    case 'GET':
      const chats = await prisma.chat.findMany({
        // 全ユーザーのチャットを共有するのでコメントアウト
        // where: { userId: user.id },
        include: {
          user: true,
          apiEndpoint: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      res.status(200).json(chats);
      break;
    case 'POST':
      const {
        name,
        apiEndpointId,
        requestId,
      } = req.body;
      try {
        const chat = await prisma.chat.create({
          data: {
            user: {
              connect: {
                id: user.id,
              },
            },
            apiEndpoint: {
              connect: {
                id: apiEndpointId
              }
            },
            name,
            requestId
          },
        });
        res.status(200).json(chat);
      } catch (error) {
        console.log(error);
        res.status(200).json(error);
      }

      break;
    default:
      res.status(405).json({ message: 'メソッドが許可されていません' });
      break;
  }
}
