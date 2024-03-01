import { GetServerSideProps } from 'next';
import { withAuth } from '../../utils/withAuth';
import { getCommonProps } from '../../utils/getCommonProps';
import { PrismaClient, SystemParameter } from '@prisma/client';
import { UserWithoutTimestamp, SerializableSystemParameter } from '../../types/types';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import Modal from '../../components/modal/Modal';
import { styled } from '@mui/material/styles';
import { FormControl, FormLabel, TextField, IconButton, Button, Stack, Typography } from '@mui/material';
import { Paper, TableContainer, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import Fab from '@/components/button/Fab';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';

const prisma = new PrismaClient();

type Props = {
  currentUser: UserWithoutTimestamp;
  systemParameters: SerializableSystemParameter[];
};

const HeaderTableCell = styled(TableCell)((props) => ({
  fontWeight: 'bold',
  whiteSpace: 'nowrap'
}))


const systemParametersIndex = (props: Props) => {
  const { t } = useTranslation(['common', 'systemParameter']);
  const modelName = t('models.systemParameter');
  const router = useRouter();
  const { deleted } = router.query;

  const [systemParameters, setsystemParameters] = useState(props.systemParameters);
  const [selectedParameter, setSelectedParameter] = useState(null);
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);

  const {
    register,
    setValue,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  const fetchSystemParameters = async () => {
    const response = await axios.get('/api/private/system-parameters');
    setsystemParameters([...response.data]);
  };

  useEffect(() => {
    if (deleted === 'true') {
      toast.success(`${modelName}を削除しました`);
    }
  }, [deleted]);

  const toggleModal = (e: React.MouseEvent, systemParameter = null) => {
    if (e.target === e.currentTarget) {
      if (!isOpenModal) {
        setSelectedParameter(systemParameter);
      } else {
        reset();
        setSelectedParameter(null);
      }
      setIsOpenModal(!isOpenModal);
    }
  };

  const createSystemParameter = async (data) => {
    await axios.post('/api/private/system-parameters', data, { withCredentials: true });
    toast.success(`${modelName}を作成しました`);
  };

  const editSystemParameter = (systemParameter) => {
    setSelectedParameter(systemParameter);
    setValue('key', systemParameter.key);
    setValue('description', systemParameter.description);
    setValue('value', systemParameter.value);
    setValue('defaultValue', systemParameter.defaultValue);
    setIsOpenModal(!isOpenModal);
  };

  const updateSystemParameter = async (data) => {
    await axios.put(`/api/private/system-parameters/${selectedParameter.id}`, data, { withCredentials: true });
    toast.success(`${modelName}を更新しました`);
  };

  const deleteSystemParameter = async (systemParameter) => {
    await axios.delete(`/api/private/system-parameters/${systemParameter.id}`, { withCredentials: true });
    fetchSystemParameters();
    toast.success(`${modelName}を削除しました`);
  };

  const onSubmit = async (data) => {
    if(selectedParameter) {
      await updateSystemParameter(data);
    } else {
      await createSystemParameter(data);
    }
    fetchSystemParameters();
    reset();
    setIsOpenModal(!isOpenModal);
  };

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
                <HeaderTableCell>{t('systemParameter:systemParameter.key')}</HeaderTableCell>
                <HeaderTableCell>{t('systemParameter:systemParameter.description')}</HeaderTableCell>
                <HeaderTableCell>{t('systemParameter:systemParameter.value')}</HeaderTableCell>
                <HeaderTableCell>{t('systemParameter:systemParameter.defaultValue')}</HeaderTableCell>
                <HeaderTableCell></HeaderTableCell>
              </TableRow>
          </TableHead>
          <TableBody>
          {systemParameters?.map((systemParameter, index) => (
            <TableRow key={index}>
              <TableCell>{systemParameter.key}</TableCell>
              <TableCell>{systemParameter.description}</TableCell>
              <TableCell>{systemParameter.value}</TableCell>
              <TableCell>{systemParameter.defaultValue}</TableCell>
              <TableCell sx={{textAlign: 'right'}}>
                <IconButton aria-label="edit" onClick={() => editSystemParameter(systemParameter)} sx={{mr: 1}}>
                  <EditIcon />
                </IconButton>
                <IconButton aria-label="delete" onClick={() => deleteSystemParameter(systemParameter)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Fab color="primary" aria-label="add" onClick={toggleModal}>
        <AddIcon onClick={toggleModal} />
      </Fab>

      {isOpenModal && (
        <Modal close={toggleModal}>
          <form onSubmit={handleSubmit(onSubmit)} style={{padding: '24px'}}>
            <FormControl sx={{mb: 3, width: 1}} required>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}} error={Boolean(errors.key)}>{t('systemParameter:systemParameter.key')}</FormLabel>
              <TextField
                {...register('key', {
                  required: '必須項目です'
                })}
                sx={{ width: 1 }}
                error={Boolean(errors.key)}
                helperText={errors.key ? errors.key.message as string : ''}
              />
            </FormControl>

            <FormControl sx={{mb: 3, width: 1}}>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}}>{t('systemParameter:systemParameter.description')}</FormLabel>
              <TextField
                {...register('description')}
                multiline
                minRows={4}
              />
            </FormControl>

            <FormControl sx={{mb: 3, width: 1}} required>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}} error={Boolean(errors.value)}>{t('systemParameter:systemParameter.value')}</FormLabel>
              <TextField
                {...register('value', {
                  required: '必須項目です'
                })}
                multiline
                minRows={4}
                error={Boolean(errors.value)}
                helperText={errors.value ? errors.value.message as string : ''}
              />
            </FormControl>

            <FormControl sx={{mb: 3, width: 1}}>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}}>{t('systemParameter:systemParameter.defaultValue')}</FormLabel>
              <TextField
                {...register('defaultValue')}
                multiline
                minRows={4}
              />
            </FormControl>

            <Button
              size="large"
              variant="contained"
              type='submit'
            >
              {selectedParameter ? t('common:update') : t('common:create')}
            </Button>
          </form>
        </Modal>
      )}
    </Layout>
  );
};

export default systemParametersIndex;

export const getServerSideProps: GetServerSideProps = withAuth(async (context) => {
  const commonProps: { currentUser: UserWithoutTimestamp }  = await getCommonProps(context, ['systemParameter']);
  if (!commonProps) {
    return { props: {} };
  }

  const systemParameters: SystemParameter[] = await prisma.systemParameter.findMany({
    orderBy: {id: 'asc'}
  });

  const props: Props = {
    ...commonProps,
    systemParameters: systemParameters.map((systemParameter) => ({
      ...systemParameter,
      createdAt: systemParameter.createdAt.toISOString(),
      updatedAt: systemParameter.updatedAt.toISOString(),
    })),
  };

  return {
    props: props,
  };
});
