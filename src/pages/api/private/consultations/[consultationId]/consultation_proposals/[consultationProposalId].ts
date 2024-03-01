import { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '../../../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { PrismaClient, ConsultationProposal } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ message: '認証されませんでした' });
    return;
  }

  const consultationProposalId = Number(req.query.consultationProposalId);

  switch (req.method) {
    case 'PUT':
      const { title, content, fullText, isFavorite } = req.body;
      const updateProposal: ConsultationProposal = await prisma.consultationProposal.update({
        where: { id: consultationProposalId },
        data: { title, content, fullText },
      });
      res.status(200).json(updateProposal);
      break;
    case 'DELETE':
      const deleteProposal = await prisma.consultationProposal.delete({
        where: { id: consultationProposalId },
      });
      res.status(204).json(deleteProposal);
      break;
    default:
      res.status(405).json({ message: 'メソッドが許可されていません' });
      break;
  }
}
