import { GetServerSideProps } from 'next';
import { withAuth } from '../../utils/withAuth';
import { getCommonProps } from '../../utils/getCommonProps';
import { PrismaClient, Question } from '@prisma/client';
import { UserWithoutTimestamp, SerializableQuestion } from '../../types/types';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import Link from 'next/link';
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
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

const prisma = new PrismaClient();

type Props = {
  currentUser: UserWithoutTimestamp;
  questions: SerializableQuestion[];
};

const HeaderTableCell = styled(TableCell)((props) => ({
  fontWeight: 'bold',
  whiteSpace: 'nowrap'
}))

const questionsIndex = (props: Props) => {
  const { t } = useTranslation(['common', 'question']);
  const modelName = t('models.question');
  const router = useRouter();
  const { deleted } = router.query;

  const [questions, setQuestions] = useState(props.questions);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);

  const {
    register,
    setValue,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  const fetchQuestions = async () => {
    const response = await axios.get('/api/private/questions');
    setQuestions([...response.data]);
  };

  useEffect(() => {
    if (deleted === 'true') {
      toast.success(`${modelName}を削除しました`);
    }
  }, [deleted]);

  const toggleModal = (e: React.MouseEvent, Question = null) => {
    if (e.target === e.currentTarget) {
      if (!isOpenModal) {
        setSelectedQuestion(Question);
      } else {
        reset();
        setSelectedQuestion(null);
      }
      setIsOpenModal(!isOpenModal);
    }
  };

  const createQuestion = async (data) => {
    const params = {
      ...data,
    };

    await axios.post('/api/private/questions', params, { withCredentials: true });
    toast.success(`${modelName}を作成しました`);
  };

  const editQuestion = (Question) => {
    setSelectedQuestion(Question);
    setValue('name', Question.name);
    setIsOpenModal(!isOpenModal);
  };

  const updateQuestion = async (data) => {
    await axios.put(`/api/private/questions/${selectedQuestion.id}`, data, { withCredentials: true });
    toast.success(`${modelName}を更新しました`);
  };

  const deleteQuestion = async (Question) => {
    try {
      await axios.delete(`/api/private/questions/${Question.id}`, { withCredentials: true });
      fetchQuestions();
      toast.success(`${modelName}を削除しました`);
    } catch (error) {
      toast.error(`${error}`);
    }
  };

  const onSubmit = async (data) => {
    if(selectedQuestion) {
      await updateQuestion(data);
    } else {
      await createQuestion(data);
    }
    fetchQuestions();
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
                <HeaderTableCell>{t('question:question.name')}</HeaderTableCell>
                <HeaderTableCell>{t('question:question.choices')}</HeaderTableCell>
                <HeaderTableCell></HeaderTableCell>
                <HeaderTableCell></HeaderTableCell>
              </TableRow>
          </TableHead>
          <TableBody>
          {questions?.map((question, index) => (
            <TableRow key={index}>
              <TableCell>{question.name}</TableCell>
              <TableCell>{question.choices?.map((choice) => choice.name).join(', ')}</TableCell>
              <TableCell sx={{textAlign: 'right'}}>
                <IconButton aria-label="edit" onClick={() => editQuestion(question)} sx={{mr: 1}}>
                  <EditIcon />
                </IconButton>
                <IconButton aria-label="delete" onClick={() => deleteQuestion(question)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
              <TableCell sx={{textAlign: 'right'}}>
                <Link href={`/questions/${question.id}/choices`} passHref>
                  <IconButton aria-label="detail">
                    <KeyboardArrowRightIcon />
                  </IconButton>
                </Link>
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
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}} error={Boolean(errors.name)}>{t('question:question.name')}</FormLabel>
              <TextField
                {...register('name', {
                  required: '必須項目です'
                })}
                sx={{ width: 1 }}
                error={Boolean(errors.name)}
                helperText={errors.name ? errors.name.message as string : ''}
              />
            </FormControl>

            <Button
              size="large"
              variant="contained"
              type='submit'
            >
              {selectedQuestion ? t('common:update') : t('common:create')}
            </Button>
          </form>
        </Modal>
      )}
    </Layout>
  );
};

export default questionsIndex;

export const getServerSideProps: GetServerSideProps = withAuth(async (context) => {
  const commonProps: { currentUser: UserWithoutTimestamp }  = await getCommonProps(context, ['question']);
  if (!commonProps) {
    return { props: {} };
  }

  const questionsWithChoices = await prisma.question.findMany({
    include: {
      choices: true,
    },
  });

  const props: Props = {
    ...commonProps,
    questions: questionsWithChoices.map((question) => ({
      ...question,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
      choices: question.choices.map((choice) => ({
        ...choice,
        createdAt: choice.createdAt.toISOString(),
        updatedAt: choice.updatedAt.toISOString(),
        questionName: question.name,
      })),
    })),
  };

  return {
    props: props,
  };
});
