import { GetServerSideProps } from 'next';
import { withAuth } from '../utils/withAuth';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useSession, getSession } from 'next-auth/react';
import { UserWithoutTimestamp } from '../types/types';
import { getCommonProps } from '../utils/getCommonProps';
import Layout from '../components/Layout';
import { Typography } from '@mui/material';

type Props = {
  currentUser: UserWithoutTimestamp;
};

const IndexPage = (props: Props) => {
  const { t } = useTranslation('common');

  return (
    <Layout userRole={props.currentUser.role} title={t('home')}>
      <Typography>{props.currentUser.name}さん。こんにちは。</Typography>
    </Layout>
  );
};
export default IndexPage;

export const getServerSideProps: GetServerSideProps = withAuth(async (context) => {
  const commonProps: { currentUser: UserWithoutTimestamp }  = await getCommonProps(context);
  if (!commonProps) {
    return { props: {} };
  }

  const session = await getSession(context);
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  return {
    props: {
      ...commonProps,
      ...(await serverSideTranslations(context.defaultLocale || 'ja', ['common'])),
    },
  };
});
