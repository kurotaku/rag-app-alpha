import { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '../../../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { PrismaClient, User, ConsultationProposal } from '@prisma/client';
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
      const proposals: ConsultationProposal[] = await prisma.consultationProposal.findMany({
        where: { consultationId: consultationId },
        orderBy: {
          id: 'asc'
        }
      });
      res.status(200).json(proposals);
      break;
    case 'POST':
      const { title, content } = req.body;
      const proposal: ConsultationProposal = await prisma.consultationProposal.create({
        data: {
          title,
          content,
          consultationId: consultationId,
        },
      });
      res.status(200).json(proposal);
      break;
    default:
      res.status(405).json({ message: 'Method not allowed' });
      break;
  }
}