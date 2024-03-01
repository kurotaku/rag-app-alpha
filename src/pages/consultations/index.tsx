import { GetServerSideProps } from 'next';
import { withAuth } from '@/utils/withAuth';
import { getCommonProps } from '@/utils/getCommonProps';
import { User, PrismaClient, Consultation, ApiEndpoint } from '@prisma/client';
import { UserWithoutTimestamp, SerializableConsultation } from '@/types/types';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import Layout from '@/components/Layout';
import {Pagination, Stack, Chip, Box, Button, Paper, Typography} from '@mui/material';
import { formatDateTime } from '@/utils/formatDate';

const prisma = new PrismaClient();

type Props = {
  currentUser: UserWithoutTimestamp;
  consultations: SerializableConsultation[];
};

const consultationsIndex = (props: Props) => {
  const { t } = useTranslation(['common', 'consultation']);
  const modelName = t('models.consultation');
  const router = useRouter();
  const { deleted } = router.query;

  const [currentPage, setCurrentPage] = useState(parseInt(router.query.page as string) || 1);

  const itemsPerPage = 5;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = props.consultations.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    router.push(`${router.pathname}?page=${value}`, undefined, { shallow: true });
  };

  useEffect(() => {
    const page = parseInt(router.query.page as string) || 1;
    setCurrentPage(page);
  }, [router.query.page]);

  useEffect(() => {
    if (deleted === 'true') {
      toast.success(`${modelName}を削除しました`);
    }
  }, [deleted]);

  const pageTitle = (
    <Stack direction="row" alignItems="center">
      <Typography variant="h6" sx={{fontWeight: 'bold'}}>{modelName}</Typography>
    </Stack>
  )

  return (
    <Layout userRole={props.currentUser.role} title={modelName} pageTitle={pageTitle}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{mb: 3}}>
        <Typography variant='h6' sx={{fontWeight: 'bold'}}>{modelName}一覧</Typography>
        <Link href="/consultations/new" passHref><Button variant="contained">{t('common:new')}</Button></Link>
      </Stack>
      
      {currentItems?.map((consultation, index) => (
        <Link
          key={index}
          href={`/consultations/${consultation.id}`}
          passHref
        >
          <Paper
            sx={{p: 3, mb: 3}}
          >
            <Box sx={{mb: 2}}>
              { consultation.apiEndpoint && (
                <Chip label={consultation.apiEndpoint.name} variant="outlined" sx={{mr: 1}} />
              )}
              {formatDateTime(consultation.createdAt)}<span style={{marginLeft: '8px'}}>{consultation?.user?.name}</span>
            </Box>
            <Box>
              {Object.entries(JSON.parse(consultation.choices)).map(([key, value], index) => (
                <Chip key={index} label={`${key}：${value}`} size="small" sx={{borderRadius: 1, mr: 1}} />
              ))}
              {consultation.detail && (
                <Chip key={index} label={`自由入力：${consultation.detail}`} size="small" sx={{borderRadius: 1, mr: 1}} />
              )}
            </Box>
          </Paper>
        </Link>
      ))}
      <Stack direction="row" justifyContent="flex-end">
        <Pagination
          count={Math.ceil(props.consultations.length / itemsPerPage)}
          page={currentPage}
          onChange={(event, value) => handlePageChange(event, value)}
          variant="outlined"
        />
      </Stack>
    </Layout>
  );
};

export default consultationsIndex;

export const getServerSideProps: GetServerSideProps = withAuth(async (context) => {
  type ExtendedConsultation = Consultation & {
    apiEndpoint?: ApiEndpoint;
    user: User;
  };
  
  const commonProps: { currentUser: UserWithoutTimestamp }  = await getCommonProps(context, ['consultation']);
  if (!commonProps) {
    return { props: {} };
  }

  const consultations: ExtendedConsultation[] = await prisma.consultation.findMany({
    include: {
      apiEndpoint: true,
      user: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const props: Props = {
    ...commonProps,
    consultations: consultations.map((consultation) => {
      const { createdAt, updatedAt, ...userWithoutTimestamps } = consultation.user;
      return(
        {
          ...consultation,
          createdAt: consultation.createdAt.toLocaleString(),
          updatedAt: consultation.updatedAt.toLocaleString(),
          spots: [],
          apiEndpoint: consultation.apiEndpoint ? {
            ...consultation.apiEndpoint,
            createdAt: consultation.apiEndpoint.createdAt.toLocaleString(),
            updatedAt: consultation.apiEndpoint.updatedAt.toLocaleString(),
          } : null,
          user: userWithoutTimestamps
        }
      )
    })
  };

  return {
    props: props,
  };
});
