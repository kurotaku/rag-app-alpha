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

  const clientIp: string = (typeof req.headers['x-forwarded-for'] === 'string' ? req.headers['x-forwarded-for'].split(',')[0] : req.socket.remoteAddress) as string;

  switch (req.method) {
    case 'GET':
      const logs = await prisma.gptLog.findMany({
        where: { userId: user.id },
      });
      res.status(200).json(logs);
      break;
    case 'POST':
      console.log(req.body);
      const {
        gptVendor,
        gptModel,
        promptTokens,
        completionTokens,
        totalTokens,
        prompt,
        response,
        totalPrompts,
        useCase,
        startedAt,
        endedAt,
        responseTime,
        apiEndpointName
      } = req.body;
      try {
        const log = await prisma.gptLog.create({
          data: {
            user: {
              connect: {
                id: user.id,
              },
            },
            gptVendor,
            gptModel,
            promptTokens,
            completionTokens,
            totalTokens,
            prompt,
            response,
            useCase,
            totalPrompts,
            startedAt,
            endedAt,
            responseTime,
            apiEndpointName,
            clientIp: clientIp
          },
        });
        res.status(200).json(log);
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
