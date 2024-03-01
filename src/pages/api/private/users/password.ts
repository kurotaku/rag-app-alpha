import type { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '@/pages/api//auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import bcrypt from 'bcryptjs';
import { PrismaClient, User } from '@prisma/client';
const prisma = new PrismaClient();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  type UpdateFields = Pick<User, 'password' >;

  try {
    const session: Session = await getServerSession(req, res, authOptions);

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!session) {
      res.status(401).json({ message: '認証されませんでした' });
      return;
    }

    switch (req.method) {
      case 'PUT':
        const { currentPassword, newPassword } = req.body;

        // 現在のユーザーパスワードが提供された現在のパスワードと一致するか確認
        const isMatch = await bcrypt.compare(currentPassword, currentUser.password);

        if (!isMatch) {
          // パスワードが一致しない場合
          res.status(401).json({ message: '現在のパスワードが正しくありません' });
          return;
        }

        // パスワードが一致する場合、新しいパスワードで更新
        const updateData: UpdateFields = {
          password: bcrypt.hashSync(newPassword, 10),
        };

        const updateUser = await prisma.user.update({
          where: { id: currentUser.id },
          data: updateData
        });

        res.status(200).json(updateUser);
        break;
      default:
        res.status(405).json({ message: 'メソッドが許可されていません' });
        break;
    }
  } catch (error) {
    res.status(500).json({ message: 'エラーが発生しました', error: error.message });
  }
};

export default handler;
