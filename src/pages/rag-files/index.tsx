import { GetServerSideProps } from 'next';
import { withAuth } from '../../utils/withAuth';
import { getCommonProps } from '../../utils/getCommonProps';
import { PrismaClient, RagFile, EndpointType } from '@prisma/client';
import { UserWithoutTimestamp, SerializableRagFile } from '../../types/types';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import Modal from '../../components/modal/Modal';
import { styled } from '@mui/material/styles';
import { FormControl, FormLabel, TextField, Select, MenuItem, IconButton, Button, Typography, Alert, Box, Stack } from '@mui/material';
import { Paper, TableContainer, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import Fab from '@/components/button/Fab';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';

const prisma = new PrismaClient();

type Props = {
  currentUser: UserWithoutTimestamp;
  ragFiles: SerializableRagFile[];
};

const HeaderTableCell = styled(TableCell)((props) => ({
  fontWeight: 'bold',
  whiteSpace: 'nowrap'
}))

const DataTableCell = styled(TableCell)((props) => ({
  verticalAlign: 'top'
}))

const ragFilesIndex = (props: Props) => {
  const { t } = useTranslation(['common', 'ragFile']);
  const modelName = t('models.ragFile');
  const router = useRouter();
  const { deleted } = router.query;

  const [ragFiles, setragFiles] = useState(props.ragFiles);
  const [ragFile, setragFile] = useState(null);
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const fetchRagFiles = async () => {
    const response = await axios.get('/api/private/rag-files');
    setragFiles([...response.data]);
  };

  useEffect(() => {
    if (deleted === 'true') {
      toast.success(`${modelName}を削除しました`);
    }
  }, [deleted]);

  const toggleModal = (e: React.MouseEvent, ragFile = null) => {
    if (e.target === e.currentTarget) {
      if (!isOpenModal) {
        setragFile(ragFile);
      } else {
        reset();
        setragFile(null);
      }
      setIsOpenModal(!isOpenModal);
    }
  };

  const createRagFile = async (data) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/travel/make-vectorstore/`, {ragFileName: data.name}, { withCredentials: true });
      await axios.post('/api/private/rag-files', data, { withCredentials: true });
      toast.success(`${modelName}を作成しました`);
    }
    catch (error) {
      toast.success(`エラーが発生しました`);
    }
  };

  const editRagFile = (ragFile) => {
    setragFile(ragFile);
    setValue('name', ragFile.name);
    setIsOpenModal(!isOpenModal);
  };

  const updateRagFile = async (data) => {
    await axios.put(`/api/private/rag-files/${ragFile.id}`, data, { withCredentials: true });
    toast.success(`${modelName}を更新しました`);
  };

  const deleteRagFile= async (ragFile) => {
    try {
      await axios.delete(`/api/private/rag-files/${ragFile.id}`, { withCredentials: true });
      fetchRagFiles();
      toast.success(`${modelName}を削除しました`);
    } catch (error) {
      toast.error(`${error}`);
    }
  };

  const onSubmit = async (data) => {
    try{
      setIsLoading(true);

      if(ragFile) {
        await updateRagFile(data);
      } else {
        await createRagFile(data);
      }
    } catch(error) {
      toast.error(`エラーが発生しました`);
      console.error(error);
    } finally {
      fetchRagFiles();
      reset();
      setIsLoading(false);
      setIsOpenModal(!isOpenModal);
    }
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
                <HeaderTableCell>{t('ragFile:ragFile.name')}</HeaderTableCell>
                <HeaderTableCell></HeaderTableCell>
              </TableRow>
          </TableHead>
          <TableBody>
          {ragFiles?.map((ragFile, index) => (
            <TableRow key={index}>
              <DataTableCell>{ragFile.name}</DataTableCell>
              <DataTableCell sx={{textAlign: 'right'}}>
                <IconButton aria-label="edit" onClick={() => editRagFile(ragFile)} sx={{mr: 1}}>
                  <EditIcon />
                </IconButton>
                <IconButton aria-label="delete" onClick={() => deleteRagFile(ragFile)}>
                  <DeleteIcon />
                </IconButton>
              </DataTableCell>
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
          <Box component='form' onSubmit={handleSubmit(onSubmit)} sx={{padding: 3}}>
            <Alert severity="info" sx={{mb: 3}}>S3にアップしたファイルと同じファイル名を登録してください</Alert>        

            <FormControl sx={{mb: 3, width: 1}} required>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}} error={Boolean(errors.name)}>{t('ragFile:ragFile.name')}</FormLabel>
              <TextField
                {...register('name', {
                  required: '必須項目です'
                })}
                sx={{ width: 1 }}
                error={Boolean(errors.name)}
                helperText={errors.name ? errors.name.message as string : ''}
                disabled={isLoading}
              />
            </FormControl>

            <Button
              size="large"
              variant="contained"
              type='submit'
              disabled={isLoading}
            >
              {ragFile ? t('common:update') : t('common:create')}
            </Button>
          </Box>
        </Modal>
      )}
    </Layout>
  );
};

export default ragFilesIndex;

export const getServerSideProps: GetServerSideProps = withAuth(async (context) => {
  const commonProps: { currentUser: UserWithoutTimestamp }  = await getCommonProps(context, ['ragFile']);
  if (!commonProps) {
    return { props: {} };
  }

  const ragFiles: RagFile[] = await prisma.ragFile.findMany({
    orderBy: {id: 'asc'}
  });

  const props: Props = {
    ...commonProps,
    ragFiles: ragFiles.map((ragFile) => ({
      ...ragFile,
      createdAt: ragFile.createdAt.toISOString(),
      updatedAt: ragFile.updatedAt.toISOString(),
    })),
  };

  return {
    props: props,
  };
});
