import { GetServerSideProps } from 'next';
import { withAuth } from '@/utils/withAuth';
import { getCommonProps } from '@/utils/getCommonProps';
import { logGptData } from '@/utils/logGptData';
import { PrismaClient, Consultation, ApiEndpoint, ConsultationProposal } from '@prisma/client';
import { UserWithoutTimestamp, SerializableQuestion, SerializableApiEndpoint } from '@/types/types';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ulid } from 'ulid';
import { ChatCompletionRequestMessage } from 'openai';
import { theme } from '@/themes';
import Layout from '@/components/Layout';
import ButtonSelect from '@/components/form/ButtonSelect';
import Loading from '@/components/form/Loading';
import { FormControl, FormLabel, TextField, Button, Paper, Alert, Stack, Typography, Select, SelectChangeEvent, MenuItem, Box, Breadcrumbs } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { grey } from '@mui/material/colors';

const prisma = new PrismaClient();

type Props = {
  currentUser: UserWithoutTimestamp;
  gptVendor: string;
  questions: SerializableQuestion[];
  apiEndpoints: SerializableApiEndpoint[];
};

type ResponseJson = {
  answer: string;
  proposals?: ConsultationProposal[];
}

const passwordIndex = (props: Props) => {
  const { t } = useTranslation(['common', 'user']);
  const modelName = t('models.consultation');
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedApiEndpoint, setSelectedApiEndpoint] = useState<SerializableApiEndpoint>(props.apiEndpoints[0]);
  const [isAllSelected, setIsAllSelected] = useState<Boolean>(false);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string | null>>({});
  const [displayPrompts, setDisplayPrompts] = useState<object>({});
  const [logContent, setLogContent] = useState<string>('');
  const [errorMessage, setErrorMessagel] = useState<string>('');
  const [requestId, setRequestId] = useState<string>(ulid());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [elapsedTimeIntervalId, setElapsedTimeIntervalId] = useState<NodeJS.Timer | null>(null);
  const [logIntervalId, setLogIntervalId] = useState<NodeJS.Timer | null>(null);

  const {
    register,
    setValue,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  const handleSelectionChange = (name: string, value: string) => {
    setSelectedChoices((prevChoices) => ({
      ...prevChoices,
      [name]: value,
    }));
  };

  const handleApiEndpointChange = (event: SelectChangeEvent) => {
    const newSelectedApiEndpoint = props.apiEndpoints.find(apiEndpoint => apiEndpoint.id.toString() === event.target.value);
    if (newSelectedApiEndpoint) {
      setSelectedApiEndpoint(newSelectedApiEndpoint);
    }
  };

  useEffect(() => {
    const allSelected =
      Object.values(selectedChoices).length === props.questions.length &&
      Object.values(selectedChoices).every((value) => value !== null);
      setIsAllSelected(allSelected);
  }, [selectedChoices, props.questions]);

  useEffect(() => {
    if (isLoading) {
      // 経過時間の追跡を開始
      const newElapsedTimeIntervalId = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000);
      setElapsedTimeIntervalId(newElapsedTimeIntervalId);
      
      if(selectedApiEndpoint.useRag){
        // ログ取得の処理を開始
        const newLogIntervalId = setInterval(() => {
          axios.get<string>(`${process.env.NEXT_PUBLIC_ENV == 'development' ? process.env.NEXT_PUBLIC_BACKEND_URL : '/backend'}/media/textfiles/output_log_${requestId}.txt`)
            .then((response) => {
              setLogContent(response.data);
            })
            .catch((error: Error) => {
              console.error(error);
            });
        }, 10000);
        setLogIntervalId(newLogIntervalId);
      }      
    }

    return () => {
      // 経過時間のインターバルをクリア
      if (elapsedTimeIntervalId) {
        clearInterval(elapsedTimeIntervalId);
        setElapsedTimeIntervalId(null);
      }
      // ログ取得のインターバルをクリア
      if (selectedApiEndpoint?.useRag && logIntervalId) {
        clearInterval(logIntervalId);
        setLogIntervalId(null);
      }
    };
  }, [isLoading]);

  const onSubmit = async (data) => {
    setIsLoading(true);

    let userInputs = '';
    let choicesJson = {};

    const allChoices = props.questions.flatMap((question) => question.choices);
    if(data.selectedChoices){
      Object.values(data.selectedChoices).forEach((selectedChoiceId) => {
        const matchingChoice = allChoices.find((choice) => choice.id.toString() === selectedChoiceId);
        if (matchingChoice) {
          userInputs += matchingChoice.prompt + '\n';
          choicesJson[matchingChoice.questionName] = matchingChoice.name;
        }
      });
    }
    

    userInputs += data.detail;
    const newMessage: ChatCompletionRequestMessage = { role: 'user', content: userInputs };

    const prompts = {
      requestId: requestId,
      messages: [newMessage],
      primaryPrompt: selectedApiEndpoint.primaryPrompt, 
      secondaryPrompt: selectedApiEndpoint.secondaryPrompt,
      tertiaryPrompt: selectedApiEndpoint.tertiaryPrompt,
      quaternaryPrompt: selectedApiEndpoint.quaternaryPrompt,
      quinaryPrompt: selectedApiEndpoint.quinaryPrompt,
    }

    setDisplayPrompts({
      ユーザーの入力: userInputs,
      ...(selectedApiEndpoint.primaryPromptDescription && selectedApiEndpoint.primaryPrompt && { [selectedApiEndpoint.primaryPromptDescription]: selectedApiEndpoint.primaryPrompt }),
      ...(selectedApiEndpoint.primaryPromptDescription && selectedApiEndpoint.secondaryPrompt && { [selectedApiEndpoint.primaryPromptDescription]: selectedApiEndpoint.secondaryPrompt }),
      ...(selectedApiEndpoint.primaryPromptDescription && selectedApiEndpoint.tertiaryPrompt && { [selectedApiEndpoint.primaryPromptDescription]: selectedApiEndpoint.tertiaryPrompt }),
      ...(selectedApiEndpoint.primaryPromptDescription && selectedApiEndpoint.quaternaryPrompt && { [selectedApiEndpoint.primaryPromptDescription]: selectedApiEndpoint.quaternaryPrompt }),
      ...(selectedApiEndpoint.primaryPromptDescription && selectedApiEndpoint.quinaryPrompt && { [selectedApiEndpoint.primaryPromptDescription]: selectedApiEndpoint.quinaryPrompt }),
    });

    const startedAt: Date = new Date();

    const callGpt = await axios.post(
      selectedApiEndpoint.url,
      prompts,
      // { withCredentials: true },
    );

    await logGptData(callGpt.data, JSON.stringify(prompts), startedAt, props.gptVendor, '相談作成', selectedApiEndpoint?.name);

    const consultationCreateParams = {
      ...data,
      choices: JSON.stringify(choicesJson),
      jsonText: callGpt.data.choices[0].message.content,
      apiEndpointId: selectedApiEndpoint.id,
      agentLogs: callGpt.data?.agentLogs,
      requestId: requestId,
      detail: data.detail
    };

    const createConsultation = await axios.post('/api/private/consultations', consultationCreateParams, { withCredentials: true });

    if (createConsultation.status === 200) {
      toast.success(`${modelName}を作成しました`);

      const newConsultation: Consultation = createConsultation.data;

      await axios.post(
        `/api/private/consultations/${newConsultation.id }/consultation_messages/`,
        {...newMessage, agentLog: newConsultation.agentLog },
        { withCredentials: true },
      );

      await axios.post(
        `/api/private/consultations/${newConsultation.id }/consultation_messages/`,
        {...callGpt.data.choices[0].message, agentLog: newConsultation.agentLog },
        { withCredentials: true },
      );

      const jsonObject: ResponseJson = JSON.parse(callGpt.data.choices[0].message.content);

      jsonObject?.proposals.map(async (proposal) => (
        await axios.post(
          `/api/private/consultations/${newConsultation.id }/consultation_proposals/`,
          {...proposal },
          { withCredentials: true },
        )
      ));

      router.push(`/consultations/${newConsultation.id}`);
    } else {
      toast.error('エラーが発生しました。');
    }
  };

  const pageTitle = (
    <Stack direction="row" alignItems="center">
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="medium" />}
        aria-label="breadcrumb"
      >
        <Link href='/consultations' passHref><Typography variant="h6" color={theme.palette.text.primary} sx={{fontWeight: 'bold'}}>{modelName}</Typography></Link>
        <Typography variant="h6" sx={{fontWeight: 'bold'}}>{t('common:new')}</Typography>
      </Breadcrumbs>  
    </Stack>
  )

  return (
    <Layout userRole={props.currentUser.role} title={t('common:models.consultation')} pageTitle={pageTitle}>
      <Paper sx={{p: 3}}>

        {errorMessage && (
          <Alert severity="error" sx={{mb: 3}}>{errorMessage}</Alert>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormControl fullWidth sx={{mb: 4}}>
            <FormLabel sx={{mb: 1, fontWeight: 'bold'}}>{t('models.apiEndpoint')}</FormLabel>
            <Select
              value={selectedApiEndpoint?.id.toString()}
              onChange={handleApiEndpointChange}
              disabled={isLoading}
            >
              {props.apiEndpoints.map((apiEndpoint) => (
                <MenuItem key={apiEndpoint.id} value={apiEndpoint.id.toString()}>
                  {apiEndpoint.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {props.questions?.map((question, index) => (
            <FormControl fullWidth key={index} sx={{mb: 3}}>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}}>{question.name}</FormLabel>
              <ButtonSelect
                name={'selectedChoices.' + question.name}
                choices={question.choices}
                setValue={setValue}
                onSelectionChange={handleSelectionChange}
              />
            </FormControl>
          ))}

          <FormControl sx={{mb: 3, width: 1}}>
            <FormLabel sx={{mb: 1, fontWeight: 'bold'}}>自由入力</FormLabel>
            <TextField
              {...register('detail')}
              multiline
              minRows={1}
            />
          </FormControl>
          
          <Button
            size="large"
            variant="contained"
            type='submit'
            disabled={isLoading || !isAllSelected || !selectedApiEndpoint}
          >
            {t('common:submit')}
          </Button>
        </form>

        {isLoading && (
          <Box sx={{mt: 3}}>
            <Loading />
            <p style={{textAlign: 'center'}}>{elapsedTime}秒 経過</p>
            <p>GPTからの返答待ちです</p>

            {['ADMIN', 'POWER'].includes(props.currentUser.role) && (
              <>
                <Box sx={{mb: 3, background: grey[100], p: 3, borderRadius: 2}}>
                  <Stack direction="row" alignItems="center" sx={{mb: 2}}>
                    <LockIcon fontSize="small" sx={{mr: 0.5}} />
                    <Typography variant="body2" sx={{fontWeight: 'bold'}}>このエリアは一定権限以上のユーザーのみ表示されています</Typography>
                  </Stack>
                
                  {Object.entries(displayPrompts).map(([key, value]) => (
                    <>
                      <Typography sx={{fontWeight: 'bold'}}>{key}</Typography >
                      <Typography variant="body2" sx={{mb: 2, whiteSpace: 'break-spaces'}}>{value}</Typography>
                    </>
                  ))}
                </Box>
                
                {selectedApiEndpoint.useRag && (
                  <Box sx={{background: grey[100], borderRadius: 2, p: 3, mb: 3}}>
                    <Stack direction="row" alignItems="center" sx={{mb: 2}}>
                      <LockIcon fontSize="small" sx={{mr: 0.5}} />
                      <Typography variant="body2" sx={{fontWeight: 'bold'}}>このエリアは一定権限以上のユーザーのみ表示されています</Typography>
                    </Stack>

                    <Typography sx={{fontWeight: 'bold'}}>Agentの中間ログ</Typography >
                    
                    <Typography variant="body2" sx={{whiteSpace: 'break-spaces'}}>{logContent}</Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        )}
      </Paper>
    </Layout>
  );
};

export default passwordIndex;

export const getServerSideProps: GetServerSideProps = withAuth(async (context) => {
  const commonProps: { currentUser: UserWithoutTimestamp }  = await getCommonProps(context, ['user']);
  if (!commonProps) {
    return { props: {} };
  }

  const apiEndpoints: ApiEndpoint[] = await prisma.apiEndpoint.findMany({
    where: {
      endpointType: "CONSULTATION"
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const questionWithChoices = await prisma.question.findMany({
    include: {
      choices: true,
    },
  });

  const props: Props = {
    ...commonProps,
    gptVendor: process.env.GPT_VENDOR,
    questions: questionWithChoices.map((question) => ({
      ...question,
      createdAt: question.createdAt.toLocaleString(),
      updatedAt: question.updatedAt.toLocaleString(),
      choices: question.choices.map((choice) => ({
        ...choice,
        createdAt: choice.createdAt.toLocaleString(),
        updatedAt: choice.updatedAt.toLocaleString(),
        questionName: question.name,
      })),
    })),
    apiEndpoints: apiEndpoints.map((apiEndpoint) => ({
      ...apiEndpoint,
      createdAt: apiEndpoint.createdAt.toLocaleString(),
      updatedAt: apiEndpoint.updatedAt.toLocaleString(),
    }))
  };

  return {
    props: props,
  };
});
