import { GetServerSidePropsContext } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient, User } from '@prisma/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { UserWithoutTimestamp } from '../types/types';

const prisma = new PrismaClient();

export async function getCommonProps(
  context: GetServerSidePropsContext,
  additionalLocales: string[] = [],
): Promise<{
  currentUser: UserWithoutTimestamp;
}> {
  const session = await getSession(context);
  if (!session) {
    return null;
  }

  const user: User = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  const { createdAt, updatedAt, ...UserWithoutTimestampInfo } = user;
  const currentUser: UserWithoutTimestamp = UserWithoutTimestampInfo;

  const locales = ['common', ...additionalLocales];

  return {
    ...(await serverSideTranslations(context.defaultLocale || 'ja', locales)),
    currentUser: currentUser,
  };
}
