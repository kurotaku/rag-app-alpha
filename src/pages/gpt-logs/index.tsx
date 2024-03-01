import { GetServerSideProps } from 'next';
import { withAuth } from '../../utils/withAuth';
import { getCommonProps } from '../../utils/getCommonProps';
import { PrismaClient, User, GptLog } from '@prisma/client';
import { UserWithoutTimestamp, SerializableGptLog } from '../../types/types';
import { useTranslation } from 'next-i18next';
import { formatDateTime } from '../../utils/formatDate';
import Layout from '../../components/Layout';
import { styled } from '@mui/material/styles';
import { Paper, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Stack, Typography } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

const prisma = new PrismaClient();

type Props = {
  currentUser: UserWithoutTimestamp;
  gptLogs: SerializableGptLog[];
};

type ExtendedGptLog = GptLog & {
  user?: User;
};

const HeaderTableCell = styled(TableCell)(() => ({
  fontWeight: 'bold',
  whiteSpace: 'nowrap'
}))

const gptLogsIndex: React.FC<Props> = (props: Props) => {
  const { t } = useTranslation(['common', 'gptLog']);
  const modelName = t('models.gptLog');

  const pageTitle = (
    <Stack direction="row" alignItems="center">
      <LockIcon fontSize="small" sx={{mr: 1}} />
      <Typography variant="h6" sx={{fontWeight: 'bold'}}>{modelName}</Typography>
    </Stack>
  )

  return (
    <Layout userRole={props.currentUser.role} title={modelName} pageTitle={pageTitle}>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
              <TableRow>
                <HeaderTableCell>{t('gptLog:gptLog.useCase')}</HeaderTableCell>
                <HeaderTableCell>{t('gptLog:gptLog.apiEndpointName')}</HeaderTableCell>
                <HeaderTableCell>{t('gptLog:gptLog.user.name')}</HeaderTableCell>
                <HeaderTableCell>{t('gptLog:gptLog.clientIp')}</HeaderTableCell>
                <HeaderTableCell>{t('gptLog:gptLog.gptVendor')}</HeaderTableCell>
                <HeaderTableCell>{t('gptLog:gptLog.gptModel')}</HeaderTableCell>
                <HeaderTableCell>{t('gptLog:gptLog.startedAt')}</HeaderTableCell>
                <HeaderTableCell>{t('gptLog:gptLog.endedAt')}</HeaderTableCell>
                <HeaderTableCell>{t('gptLog:gptLog.responseTime')}</HeaderTableCell>
                <HeaderTableCell>{t('gptLog:gptLog.promptTokens')}</HeaderTableCell>
                <HeaderTableCell>{t('gptLog:gptLog.completionTokens')}</HeaderTableCell>
                <HeaderTableCell>{t('gptLog:gptLog.totalTokens')}</HeaderTableCell>
              </TableRow>
          </TableHead>
          <TableBody>
          {props.gptLogs?.map((gptLog, index) => (
            <TableRow key={index}>
              <TableCell>{gptLog.useCase}</TableCell>
              <TableCell>{gptLog.apiEndpointName}</TableCell>
              <TableCell>{gptLog.user.name}</TableCell>
              <TableCell>{gptLog.clientIp}</TableCell>
              <TableCell>{gptLog.gptVendor}</TableCell>
              <TableCell>{gptLog.gptModel}</TableCell>
              <TableCell>{formatDateTime(gptLog.startedAt)}</TableCell>
              <TableCell>{formatDateTime(gptLog.endedAt)}</TableCell>
              <TableCell>{Math.floor(gptLog.responseTime / 1000)}秒</TableCell>
              <TableCell>{gptLog.promptTokens}</TableCell>
              <TableCell>{gptLog.completionTokens}</TableCell>
              <TableCell>{gptLog.totalTokens}</TableCell>
            </TableRow>
          ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Layout>
  );
};

export default gptLogsIndex;

export const getServerSideProps: GetServerSideProps = withAuth(async (context) => {
  const commonProps: { currentUser: UserWithoutTimestamp }  = await getCommonProps(context, ['gptLog']);
  if (!commonProps) {
    return { props: {} };
  }

  const gptLogsWithUser: ExtendedGptLog[] = await prisma.gptLog.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      user: true,
    },
  });

  const props: Props = {
    ...commonProps,
    gptLogs: gptLogsWithUser.map((gptLog) => {
      const { createdAt, updatedAt, ...userWithoutTimestamps } = gptLog.user;
      return {
        ...gptLog,
        startedAt: gptLog.startedAt.toLocaleString(),
        endedAt: gptLog.endedAt.toLocaleString(),
        createdAt: gptLog.createdAt.toLocaleString(),
        updatedAt: gptLog.updatedAt.toLocaleString(),
        user: userWithoutTimestamps
      }
    })
  };

  return {
    props: props,
  };
});
