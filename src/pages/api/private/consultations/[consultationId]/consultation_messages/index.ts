import { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '../../../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { PrismaClient, ConsultationMessage, User } from '@prisma/client';
import { Session } from 'next-auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session: Session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const consultationId: number = Number(req.query.consultationId);

  const user: User = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  switch (req.method) {
    case 'GET':
      const consultationMessages: ConsultationMessage[] = await prisma.consultationMessage.findMany({
        where: { consultationId: consultationId },
        orderBy: {
          id: 'asc'
        }
      });
      res.status(200).json(consultationMessages);
      break;
    case 'POST':
      const { role, content, agentLog } = req.body;
      const consultationMessage: ConsultationMessage = await prisma.consultationMessage.create({
        data: {
          role,
          content,
          agentLog,
          consultationId: consultationId,
          userId: user.id,
        },
      });
      res.status(200).json(consultationMessage);
      break;
    default:
      res.status(405).json({ message: 'Method not allowed' });
      break;
  }
}