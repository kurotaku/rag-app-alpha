import { GetServerSideProps } from 'next';
import { withAuth } from '../../utils/withAuth';
import { getCommonProps } from '../../utils/getCommonProps';
import { PrismaClient, ApiEndpoint, EndpointType } from '@prisma/client';
import { UserWithoutTimestamp, SerializableApiEndpoint } from '../../types/types';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import Modal from '../../components/modal/Modal';
import { styled } from '@mui/material/styles';
import { FormControl, FormLabel, TextField, Select, MenuItem, IconButton, Button, Typography, Stack, FormControlLabel, Checkbox } from '@mui/material';
import { Paper, TableContainer, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import Fab from '@/components/button/Fab';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';

const prisma = new PrismaClient();

type Props = {
  currentUser: UserWithoutTimestamp;
  apiEndpoints: SerializableApiEndpoint[];
};

const HeaderTableCell = styled(TableCell)((props) => ({
  fontWeight: 'bold',
  whiteSpace: 'nowrap'
}))

const DataTableCell = styled(TableCell)((props) => ({
  verticalAlign: 'top'
}))

const apiEndpointsIndex = (props: Props) => {
  const { t } = useTranslation(['common', 'apiEndpoint']);
  const modelName = t('models.apiEndpoint');
  const router = useRouter();
  const { deleted } = router.query;

  const [apiEndpoints, setapiEndpoints] = useState(props.apiEndpoints);
  const [apiEndpoint, setApiEndpoint] = useState(null);
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);

  const {
    register,
    setValue,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  const fetchApiEndpoints = async () => {
    const response = await axios.get('/api/private/api-endpoints');
    setapiEndpoints([...response.data]);
  };

  const toggleModal = (e: React.MouseEvent, apiEndpoint = null) => {
    if (e.target === e.currentTarget) {
      if (!isOpenModal) {
        setApiEndpoint(apiEndpoint);
      } else {
        reset();
        setApiEndpoint(null);
      }
      setIsOpenModal(!isOpenModal);
    }
  };

  const endpointTypeValue = watch('endpointType');
  const useRagValue = watch('useRag');

  const createApiEndpoint = async (data) => {
    await axios.post('/api/private/api-endpoints', data, { withCredentials: true });
    toast.success(`${modelName}を作成しました`);
  };

  const editApiEndpoint = (apiEndpoint) => {
    setApiEndpoint(apiEndpoint);
    setValue('endpointType', apiEndpoint.endpointType);
    setValue('useRag', apiEndpoint.useRag);
    setValue('name', apiEndpoint.name);
    setValue('url', apiEndpoint.url);
    setValue('description', apiEndpoint.description);
    setValue('primaryPrompt', apiEndpoint.primaryPrompt);
    setValue('secondaryPrompt', apiEndpoint.secondaryPrompt);
    setValue('tertiaryPrompt', apiEndpoint.tertiaryPrompt);
    setValue('quaternaryPrompt', apiEndpoint.quaternaryPrompt);
    setValue('quinaryPrompt', apiEndpoint.quinaryPrompt);
    setValue('primaryPromptDescription', apiEndpoint.primaryPromptDescription);
    setValue('secondaryPromptDescription', apiEndpoint.secondaryPromptDescription);
    setValue('tertiaryPromptDescription', apiEndpoint.tertiaryPromptDescription);
    setValue('quaternaryPromptDescription', apiEndpoint.quaternaryPromptDescription);
    setValue('quinaryPromptDescription', apiEndpoint.quinaryPromptDescription);
    setIsOpenModal(!isOpenModal);
  };

  const updateApiEndpoint = async (data) => {
    await axios.put(`/api/private/api-endpoints/${apiEndpoint.id}`, data, { withCredentials: true });
    toast.success(`${modelName}を更新しました`);
  };

  const deleteApiEndpoint= async (ApiEndpoint) => {
    try {
      await axios.delete(`/api/private/api-endpoints/${ApiEndpoint.id}`, { withCredentials: true });
      fetchApiEndpoints();
      toast.success(`${modelName}を削除しました`);
    } catch (error) {
      toast.error(`${error}`);
    }
  };

  const onSubmit = async (data) => {
    if(apiEndpoint) {
      await updateApiEndpoint(data);
    } else {
      await createApiEndpoint(data);
    }
    fetchApiEndpoints();
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
                <HeaderTableCell>{t('apiEndpoint:apiEndpoint.endpointType')}</HeaderTableCell>
                <HeaderTableCell>{t('apiEndpoint:apiEndpoint.useRag')}</HeaderTableCell>
                <HeaderTableCell>{t('apiEndpoint:apiEndpoint.name')}</HeaderTableCell>
                <HeaderTableCell>{t('apiEndpoint:apiEndpoint.description')}</HeaderTableCell>
                <HeaderTableCell>{t('apiEndpoint:apiEndpoint.url')}</HeaderTableCell>
                <HeaderTableCell>{t('apiEndpoint:apiEndpoint.primaryPrompt')}</HeaderTableCell>
                <HeaderTableCell>{t('apiEndpoint:apiEndpoint.secondaryPrompt')}</HeaderTableCell>
                <HeaderTableCell>{t('apiEndpoint:apiEndpoint.tertiaryPrompt')}</HeaderTableCell>
                <HeaderTableCell>{t('apiEndpoint:apiEndpoint.quaternaryPrompt')}</HeaderTableCell>
                <HeaderTableCell>{t('apiEndpoint:apiEndpoint.quinaryPrompt')}</HeaderTableCell>
                <HeaderTableCell></HeaderTableCell>
              </TableRow>
          </TableHead>
          <TableBody>
          {apiEndpoints?.map((apiEndpoint, index) => (
            <TableRow key={index}>
              <DataTableCell>{apiEndpoint.endpointType}</DataTableCell>
              <DataTableCell>{String(apiEndpoint.useRag)}</DataTableCell>
              <DataTableCell>{apiEndpoint.name}</DataTableCell>
              <DataTableCell>{apiEndpoint.description}</DataTableCell>
              <DataTableCell>{apiEndpoint.url}</DataTableCell>

              <DataTableCell>
                {apiEndpoint.primaryPromptDescription && (
                  <Typography sx={{fontWeight: 'bold'}}>{apiEndpoint.primaryPromptDescription}</Typography>
                )}
                {apiEndpoint.primaryPrompt}
              </DataTableCell>
              
              <DataTableCell>
                {apiEndpoint.secondaryPromptDescription && (
                  <Typography sx={{fontWeight: 'bold'}}>{apiEndpoint.secondaryPromptDescription}</Typography>
                )}
                {apiEndpoint.secondaryPrompt}
              </DataTableCell>

              <DataTableCell>
                {apiEndpoint.tertiaryPromptDescription && (
                  <Typography sx={{fontWeight: 'bold'}}>{apiEndpoint.tertiaryPromptDescription}</Typography>
                )}
                {apiEndpoint.tertiaryPrompt}
              </DataTableCell>

              <DataTableCell>
                {apiEndpoint.quaternaryPromptDescription && (
                  <Typography sx={{fontWeight: 'bold'}}>{apiEndpoint.quaternaryPromptDescription}</Typography>
                )}
                {apiEndpoint.quaternaryPrompt}
              </DataTableCell>

              <DataTableCell>
                {apiEndpoint.quinaryPromptDescription && (
                  <Typography sx={{fontWeight: 'bold'}}>{apiEndpoint.quinaryPromptDescription}</Typography>
                )}
                {apiEndpoint.quinaryPrompt}
              </DataTableCell>

              <DataTableCell>
                <IconButton aria-label="edit" onClick={() => editApiEndpoint(apiEndpoint)} sx={{mr: 1}}>
                  <EditIcon />
                </IconButton>
                <IconButton aria-label="delete" onClick={() => deleteApiEndpoint(apiEndpoint)}>
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
          <form onSubmit={handleSubmit(onSubmit)} style={{padding: '24px'}}>
            <FormControl fullWidth sx={{mb: 3}}>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}} required>{t('apiEndpoint:apiEndpoint.endpointType')}</FormLabel>
              <Select
                {...register('endpointType', {
                  required: '必須項目です'
                })}
                value={endpointTypeValue}
              >
                {Object.values(EndpointType).map((endpointType, index) => (
                  <MenuItem key={index} value={endpointType}>
                    {endpointType}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{mb: 3}}>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}}>{t('apiEndpoint:apiEndpoint.useRag')}</FormLabel>
              <FormControlLabel
                {...register('useRag')}
                control={<Checkbox checked={useRagValue} />}
                label="RAGを利用する"
              />
            </FormControl>
            
            <FormControl sx={{mb: 3, width: 1}} required>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}} error={Boolean(errors.name)}>{t('apiEndpoint:apiEndpoint.name')}</FormLabel>
              <TextField
                {...register('name', {
                  required: '必須項目です'
                })}
                sx={{ width: 1 }}
                error={Boolean(errors.name)}
                helperText={errors.name ? errors.name.message as string : ''}
              />
            </FormControl>

            <FormControl sx={{mb: 3, width: 1}}>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}}>{t('apiEndpoint:apiEndpoint.description')}</FormLabel>
              <TextField
                {...register('description')}
                multiline
                minRows={1}
              />
            </FormControl>

            <FormControl sx={{mb: 3, width: 1}} required>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}} error={Boolean(errors.url)}>{t('apiEndpoint:apiEndpoint.url')}</FormLabel>
              <TextField
                {...register('url', {
                  required: '必須項目です'
                })}
                sx={{ width: 1 }}
                error={Boolean(errors.url)}
                helperText={errors.url ? errors.url.message as string : ''}
              />
            </FormControl>

            <FormControl sx={{mb: 3, width: 1}}>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}}>{t('apiEndpoint:apiEndpoint.primaryPromptDescription')}</FormLabel>
              <TextField
                {...register('primaryPromptDescription')}
                multiline
                minRows={1}
              />
            </FormControl>

            <FormControl sx={{mb: 3, width: 1}}>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}}>{t('apiEndpoint:apiEndpoint.primaryPrompt')}</FormLabel>
              <TextField
                {...register('primaryPrompt')}
                multiline
                minRows={1}
              />
            </FormControl>
         
            <FormControl sx={{mb: 3, width: 1}}>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}}>{t('apiEndpoint:apiEndpoint.secondaryPromptDescription')}</FormLabel>
              <TextField
                {...register('secondaryPromptDescription')}
                multiline
                minRows={1}
              />
            </FormControl>

            <FormControl sx={{mb: 3, width: 1}}>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}}>{t('apiEndpoint:apiEndpoint.secondaryPrompt')}</FormLabel>
              <TextField
                {...register('secondaryPrompt')}
                multiline
                minRows={1}
              />
            </FormControl>

            <FormControl sx={{mb: 3, width: 1}}>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}}>{t('apiEndpoint:apiEndpoint.tertiaryPromptDescription')}</FormLabel>
              <TextField
                {...register('tertiaryPromptDescription')}
                multiline
                minRows={1}
              />
            </FormControl>

            <FormControl sx={{mb: 3, width: 1}}>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}}>{t('apiEndpoint:apiEndpoint.tertiaryPrompt')}</FormLabel>
              <TextField
                {...register('tertiaryPrompt')}
                multiline
                minRows={1}
              />
            </FormControl>

            <FormControl sx={{mb: 3, width: 1}}>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}}>{t('apiEndpoint:apiEndpoint.quaternaryPromptDescription')}</FormLabel>
              <TextField
                {...register('quaternaryPromptDescription')}
                multiline
                minRows={1}
              />
            </FormControl>

            <FormControl sx={{mb: 3, width: 1}}>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}}>{t('apiEndpoint:apiEndpoint.quaternaryPrompt')}</FormLabel>
              <TextField
                {...register('quaternaryPrompt')}
                multiline
                minRows={1}
              />
            </FormControl>

            <FormControl sx={{mb: 3, width: 1}}>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}}>{t('apiEndpoint:apiEndpoint.quinaryPromptDescription')}</FormLabel>
              <TextField
                {...register('quinaryPromptDescription')}
                multiline
                minRows={1}
              />
            </FormControl>

            <FormControl sx={{mb: 3, width: 1}}>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}}>{t('apiEndpoint:apiEndpoint.quinaryPrompt')}</FormLabel>
              <TextField
                {...register('quinaryPrompt')}
                multiline
                minRows={1}
              />
            </FormControl>

            <Button
              size="large"
              variant="contained"
              type='submit'
            >
              {apiEndpoint ? t('common:update') : t('common:create')}
            </Button>
          </form>
        </Modal>
      )}
    </Layout>
  );
};

export default apiEndpointsIndex;

export const getServerSideProps: GetServerSideProps = withAuth(async (context) => {
  const commonProps: { currentUser: UserWithoutTimestamp }  = await getCommonProps(context, ['apiEndpoint']);
  if (!commonProps) {
    return { props: {} };
  }

  const apiEndpoints: ApiEndpoint[] = await prisma.apiEndpoint.findMany({
    orderBy: {id: 'asc'}
  });

  const props: Props = {
    ...commonProps,
    apiEndpoints: apiEndpoints.map((apiEndpoint) => ({
      ...apiEndpoint,
      createdAt: apiEndpoint.createdAt.toISOString(),
      updatedAt: apiEndpoint.updatedAt.toISOString(),
    })),
  };

  return {
    props: props,
  };
});
