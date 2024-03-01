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

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  switch (req.method) {
    case 'GET':
      const consultations = await prisma.consultation.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
      res.status(200).json(consultations);
      break;
    case 'POST':
      const { detail, choices, jsonText, apiEndpointId, agentLog, requestId } = req.body;
      const consultation = await prisma.consultation.create({
        data: {
          user: {
            connect: {
              id: user.id,
            },
          },
          apiEndpoint: {
            connect: {
              id: parseInt(apiEndpointId, 10)
            }
          },
          detail,
          choices,
          jsonText,
          agentLog,
          requestId
        },
      });
      res.status(200).json(consultation);
      break;
    default:
      res.status(405).json({ message: 'メソッドが許可されていません' });
      break;
  }
}
