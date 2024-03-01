import { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '../../../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { PrismaClient, Message, User } from '@prisma/client';
import { Session } from 'next-auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session: Session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const chatId: number = Number(req.query.chatId);

  const user: User = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  switch (req.method) {
    case 'GET':
      const messages: Message[] = await prisma.message.findMany({
        where: { chatId: chatId },
        orderBy: {
          id: 'asc'
        }
      });
      res.status(200).json(messages);
      break;
    case 'POST':
      const { role, content, agentLog } = req.body;
      const message: Message = await prisma.message.create({
        data: {
          role,
          content,
          agentLog,
          chatId: chatId,
          userId: user.id,
        },
      });
      res.status(200).json(message);
      break;
    default:
      res.status(405).json({ message: 'Method not allowed' });
      break;
  }
}