import { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { PrismaClient, SystemParameter } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  type UpdateFields = Pick<SystemParameter, 'key' | 'value' | 'defaultValue' | 'description'>;

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ message: '認証されませんでした' });
    return;
  }

  const systemParameterId = Number(req.query.systemParameterId);

  switch (req.method) {
    case 'PUT':
      const updateData: UpdateFields = {
        key: req.body.key,
        value: req.body.value,
        defaultValue: req.body.defaultValue,
        description: req.body.description,
      };
      const updateSystemParameter = await prisma.systemParameter.update({
        where: { id: systemParameterId },
        data: updateData
      });
      res.status(200).json(updateSystemParameter);
      break;
    case 'DELETE':
      const deletesystemParameter = await prisma.systemParameter.delete({
        where: { id: systemParameterId },
      });
      res.status(204).json(deletesystemParameter);
      break;
    default:
      res.status(405).json({ message: 'メソッドが許可されていません' });
      break;
  }
}
