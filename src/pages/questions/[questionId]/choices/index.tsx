import { GetServerSideProps } from 'next';
import { withAuth } from '../../../../utils/withAuth';
import { getCommonProps } from '../../../../utils/getCommonProps';
import { PrismaClient, Question } from '@prisma/client';
import { UserWithoutTimestamp, SerializableQuestion } from '../../../../types/types';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import Link from 'next/link';
import { toast } from 'react-toastify';
import Layout from '../../../../components/Layout';
import Modal from '../../../../components/modal/Modal';
import { styled } from '@mui/material/styles';
import { FormControl, FormLabel, TextField, IconButton, Button, Stack, Typography, Breadcrumbs } from '@mui/material';
import { Paper, TableContainer, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import Fab from '@/components/button/Fab';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { theme } from '@/themes';

const prisma = new PrismaClient();

type Props = {
  currentUser: UserWithoutTimestamp;
  question: SerializableQuestion;
};

const HeaderTableCell = styled(TableCell)((props) => ({
  fontWeight: 'bold',
  whiteSpace: 'nowrap'
}))

const questionsIndex: React.FC<Props> = (props: Props) => {
  const { t } = useTranslation(['common', 'choice']);
  const modelName = t('models.choice');
  const parentModelName = t('models.question');
  const router = useRouter();
  const { deleted } = router.query;

  const [choices, setChoices] = useState(props.question.choices);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);

  const {
    register,
    setValue,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  const fetchChoices = async () => {
    const response = await axios.get(`/api/private/choices?questionId=${props.question.id}`);
    setChoices([...response.data]);
  };

  useEffect(() => {
    if (deleted === 'true') {
      toast.success(`${modelName}を削除しました`);
    }
  }, [deleted]);

  const toggleModal = (e: React.MouseEvent, choice = null) => {
    if (e.target === e.currentTarget) {
      if (!isOpenModal) {
        setSelectedChoice(choice);
      } else {
        reset();
        setSelectedChoice(null);
      }
      setIsOpenModal(!isOpenModal);
    }
  };

  const createChoice = async (data) => {
    const params = {
      ...data,
      questionId: props.question.id,
    };

    await axios.post('/api/private/choices', params, { withCredentials: true });
    toast.success(`${modelName}を作成しました`);
  };

  const editChoice = (choice) => {
    setSelectedChoice(choice);
    setValue('name', choice.name);
    setValue('prompt', choice.prompt);
    setIsOpenModal(!isOpenModal);
  };

  const updateChoice = async (data) => {
    await axios.put(`/api/private/choices/${selectedChoice.id}`, data, { withCredentials: true });
    toast.success(`${modelName}を更新しました`);
  };

  const deleteChoice = async (choice) => {
    await axios.delete(`/api/private/choices/${choice.id}`, { withCredentials: true });
    fetchChoices();
    toast.success(`${modelName}を削除しました`);
  };

  const onSubmit = async (data) => {
    if(selectedChoice) {
      await updateChoice(data);
    } else {
      await createChoice(data);
    }
    fetchChoices();
    reset();
    setIsOpenModal(!isOpenModal);
  };

  const pageTitle = (
    <Stack direction="row" alignItems="center">
      <LockIcon fontSize="small" sx={{mr: 1}} />
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="medium" />}
        aria-label="breadcrumb"
      >
        <Link href='/questions' passHref><Typography variant="h6" color={theme.palette.text.primary} sx={{fontWeight: 'bold'}}>{parentModelName}</Typography></Link>
        <Typography variant="h6" sx={{fontWeight: 'bold'}}>{props.question.name}</Typography>
      </Breadcrumbs>  
    </Stack>
  )

  return (
    <Layout userRole={props.currentUser.role} title={parentModelName} pageTitle={pageTitle}>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
              <TableRow>
                <HeaderTableCell>{t('choice:choice.name')}</HeaderTableCell>
                <HeaderTableCell>{t('choice:choice.prompt')}</HeaderTableCell>
                <HeaderTableCell></HeaderTableCell>
              </TableRow>
          </TableHead>
          <TableBody>
          {choices?.map((choice, index) => (
            <TableRow key={index}>
              <TableCell>{choice.name}</TableCell>
              <TableCell>{choice.prompt}</TableCell>
              <TableCell sx={{textAlign: 'right'}}>
                <IconButton aria-label="edit" onClick={() => editChoice(choice)} sx={{mr: 1}}>
                  <EditIcon />
                </IconButton>
                <IconButton aria-label="delete" onClick={() => deleteChoice(choice)}>
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
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}} error={Boolean(errors.name)}>{t('choice:choice.name')}</FormLabel>
              <TextField
                {...register('name', {
                  required: '必須項目です'
                })}
                sx={{ width: 1 }}
                error={Boolean(errors.name)}
                helperText={errors.name ? errors.name.message as string : ''}
              />
            </FormControl>

            <FormControl sx={{mb: 3, width: 1}} required>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}} error={Boolean(errors.prompt)}>{t('choice:choice.prompt')}</FormLabel>
              <TextField
                {...register('prompt', {
                  required: '必須項目です'
                })}
                multiline
                minRows={4}
                error={Boolean(errors.prompt)}
                helperText={errors.prompt ? errors.prompt.message as string : ''}
              />
            </FormControl>

            <Button
              size="large"
              variant="contained"
              type='submit'
            >
              {selectedChoice ? t('common:update') : t('common:create')}
            </Button>
          </form>
        </Modal>
      )}
    </Layout>
  );
};

export default questionsIndex;

export const getServerSideProps: GetServerSideProps = withAuth(async (context) => {
  const commonProps: { currentUser: UserWithoutTimestamp }  = await getCommonProps(context, ['choice']);
  if (!commonProps) {
    return { props: {} };
  }

  const { questionId } = context.params;

  const questionWithChoices = await prisma.question.findUnique({
    where: {
      id: Number(questionId),
    },
    include: {
      choices: {
        orderBy: {
          id: 'asc'
        }
      },
    },
  });

  if (!questionWithChoices) {
    return {
      notFound: true,
    };
  }

  const props: Props = {
    ...commonProps,
    question: {
      ...questionWithChoices,
      createdAt: questionWithChoices.createdAt.toISOString(),
      updatedAt: questionWithChoices.updatedAt.toISOString(),
      choices: questionWithChoices.choices.map((choice) => ({
        ...choice,
        questionName: questionWithChoices.name,
        createdAt: choice.createdAt.toISOString(),
        updatedAt: choice.updatedAt.toISOString(),
      })),
    },
  };

  return {
    props: props,
  };
});
