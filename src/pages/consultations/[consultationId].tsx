import { ReactNode, useState, useEffect, ChangeEvent } from 'react';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import axios, { AxiosResponse } from 'axios'
import { toast } from 'react-toastify';;
import { withAuth } from '@/utils/withAuth';
import { logGptData } from '@/utils/logGptData';
import { getCommonProps } from '@/utils/getCommonProps';
import { PrismaClient, Consultation, ConsultationMessage, ConsultationProposal, ApiEndpoint, RagFile } from '@prisma/client';
import { UserWithoutTimestamp, SerializableConsultation, SerializableConsultationMessage, SerializableApiEndpoint, SerializableRagFile, SerializableConsultationProposal } from '@/types/types';
import { ChatCompletionRequestMessage, ChatCompletionResponseMessage } from 'openai';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Loading from '@/components/form/Loading';
import LockIcon from '@mui/icons-material/Lock';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { theme } from '@/themes';
import { Avatar, Box, Breadcrumbs, Button, FormControl, MenuItem, Paper, Select, SelectChangeEvent, Stack, TextField, Typography } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { grey } from '@mui/material/colors';
import { teal } from '@mui/material/colors';
import { useForm } from 'react-hook-form';

const prisma = new PrismaClient();

type ChatCompletionRequestMessageWithAgentLog = ChatCompletionRequestMessage & {
  agentLog?: string;
}

type Props = {
  currentUser: UserWithoutTimestamp;
  consultation: SerializableConsultation;
  gptVendor: string;
  apiEndpoints: SerializableApiEndpoint[];
  ragFiles: SerializableRagFile[];
};

type ResponseJson = {
  answer: string;
  proposals?: ConsultationProposal[];
}

const consultationPage: React.FC<Props> = (props: Props) => {
  const { t } = useTranslation(['common', 'consultation']);
  const modelName: string = t('models.consultation');

  const [isLoading, setIsLoading] = useState(false);
  const [selectedApiEndpoint, setSelectedApiEndpoint] = useState<SerializableApiEndpoint>(props.apiEndpoints[0]);
  const [selectedRagFile, setSelectedRagFile] = useState<SerializableRagFile>(props.ragFiles[0]);
  const [messages, setMessages] = useState<ChatCompletionRequestMessageWithAgentLog[]>(props.consultation.consultationMessages as ChatCompletionRequestMessageWithAgentLog[]);
  const [proposals, setProposals] = useState<SerializableConsultationProposal[]>(props.consultation?.consultationProposals);
  const [selectedProposal, setSelectedProposal] = useState<SerializableConsultationProposal>(null)
  const [displayPrompts, setDisplayPrompts] = useState<object>({});
  const [logContent, setLogContent] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [elapsedTimeIntervalId, setElapsedTimeIntervalId] = useState<NodeJS.Timer | null>(null);
  const [logIntervalId, setLogIntervalId] = useState<NodeJS.Timer | null>(null);
  const [hasFetchedProposals, setHasFetchedProposals] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset
  } = useForm();

  useEffect(() => {
    // 提案が空であり、まだフェッチを試みていない場合に限りフェッチを実行
    if (proposals.length === 0 && !hasFetchedProposals) {
      console.log('proposalが空のままページが読み込まれました。フェッチを試みます。');
      fetchProposals();
      setHasFetchedProposals(true); // フェッチを試みたことを記録
    }
  }, [proposals, hasFetchedProposals]);

  const handleApiEndpointChange = (event: SelectChangeEvent) => {
    const newSelectedApiEndpoint = props.apiEndpoints.find(apiEndpoint => apiEndpoint.id.toString() === event.target.value);
    if (newSelectedApiEndpoint) {
      setSelectedApiEndpoint(newSelectedApiEndpoint);
    }
  };

  const handleRagFileChange = (event: SelectChangeEvent) => {
    const newSelectedRagFile = props.ragFiles.find(ragFile => ragFile.id.toString() === event.target.value);
    if (newSelectedRagFile) {
      setSelectedRagFile(newSelectedRagFile);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      handleSubmit(onSubmit)();
    }
  };

  const answerText = (jsonText: string) => {
    const jsonObject = JSON.parse(jsonText);
    if (jsonObject && jsonObject.answer) {
      return Object.values(jsonObject.answer)
    } else {
      console.error('JSON文字列の解析に失敗したか、answerキーがありません');
    }
  }

  const fetchProposals = async () => {
    const responce = await axios.get(
      `/api/private/consultations/${props.consultation.id }/consultation_proposals/`
    );
    setProposals([...responce.data]);
  }

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
          axios.get<string>(`${process.env.NEXT_PUBLIC_ENV == 'development' ? process.env.NEXT_PUBLIC_BACKEND_URL : '/backend'}/media/textfiles/output_log_${props.consultation.requestId}.txt`)
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
      setElapsedTime(0)
      
      // 経過時間のインターバルをクリア
      if (elapsedTimeIntervalId) {
        clearInterval(elapsedTimeIntervalId);
        setElapsedTimeIntervalId(null);
      }
      // ログ取得のインターバルをクリア
      if (selectedApiEndpoint.useRag && logIntervalId) {
        clearInterval(logIntervalId);
        setLogIntervalId(null);
      }
    };
  }, [isLoading]);

  const sendMessage = async (message: string) => {
    const newMessage: ChatCompletionRequestMessageWithAgentLog = { role: 'user', content: message };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    
    const prevMessages: ChatCompletionRequestMessageWithAgentLog[] = messages.map(({ role, content }) => {
      return { role, content } as ChatCompletionRequestMessageWithAgentLog;
    });

    const prompts = {
      requestId: props.consultation.requestId,
      messages: [...prevMessages, newMessage], 
      primaryPrompt: selectedApiEndpoint.primaryPrompt, 
      secondaryPrompt: selectedApiEndpoint.secondaryPrompt,
      tertiaryPrompt: selectedApiEndpoint.tertiaryPrompt,
      quaternaryPrompt: selectedApiEndpoint.quaternaryPrompt,
      quinaryPrompt: selectedApiEndpoint.quinaryPrompt,
      ragFileName: selectedRagFile?.name,
    }

    setDisplayPrompts({
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
    );

    const gptResponse: ChatCompletionResponseMessage = callGpt.data.choices[0].message;
    const agentLog: string | null = callGpt.data?.agentLogs

    setLogContent(agentLog);
    await logGptData(callGpt.data, JSON.stringify(prompts), startedAt, props.gptVendor, '相談詳細', selectedApiEndpoint?.name);

    await axios.post(
      `/api/private/consultations/${props.consultation.id }/consultation_messages/`,
      {...newMessage, agentLog: agentLog },
      { withCredentials: true },
    );
    const createAssistantMessage: AxiosResponse = await axios.post(
      `/api/private/consultations/${props.consultation.id }/consultation_messages/`,
      { ...gptResponse, agentLog: agentLog },
      { withCredentials: true },
    );
    setMessages((prevMessages) => [...prevMessages, createAssistantMessage.data]);

    return callGpt;
  }

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);

      const gptResponse = await sendMessage(message);
      const jsonObject: ResponseJson = JSON.parse(gptResponse.data.choices[0].message.content);

      // 返答のJSONにproposalsが含まれていたらProposalを登録する
      jsonObject?.proposals?.map(async (proposal) => {
        const createProposal = await axios.post(
          `/api/private/consultations/${props.consultation.id }/consultation_proposals/`,
          {...proposal },
          { withCredentials: true },
        );
        setProposals((prevProposals) => [...prevProposals, createProposal.data]);
      });

    } catch (error) {
      toast.error(`エラーが発生しました`);
      console.error(error);
    } finally {
      reset();
      setMessage('');
      setIsLoading(false);
    }
  }

  const createProposalFullText = async (proposal) => {
    setSelectedProposal(proposal);

    const gptResponse = await sendMessage(`（自動メッセージ）${proposal.title}の詳細を考えてください。`);
    const jsonObject: ResponseJson = JSON.parse(gptResponse.data.choices[0].message.content);
    
    if (jsonObject["fullText"] !== undefined) {
      await axios.put(
        `/api/private/consultations/${props.consultation.id }/consultation_proposals/${proposal.id}`,
        {fullText: jsonObject["fullText"]},
        { withCredentials: true },
      );
      fetchProposals();
    }
    
    setSelectedProposal(null);
  }

  const pageTitle = (
    <Stack direction="row" alignItems="center">
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="medium" />}
        aria-label="breadcrumb"
      >
        <Link href='/consultations' passHref><Typography variant="h6" color={theme.palette.text.primary} sx={{fontWeight: 'bold'}}>{modelName}</Typography></Link>
        <Typography variant="h6" sx={{fontWeight: 'bold'}}>{modelName}詳細</Typography>
      </Breadcrumbs>  
    </Stack>
  )

  return (
    <Layout userRole={props.currentUser.role} title={modelName} pageTitle={pageTitle}>
      <Stack direction="row" alignItems="start" spacing={3}>
        <Paper sx={{p: 3, width: '360px', flex: '0 0 auto'}}>
          {messages.map((message, index) => (
            <Stack key={index} direction="row" spacing={2} sx={{mb: 3}}>
              {message.role == 'user' ? (
                <>
                  <Avatar sx={{background: theme.palette.primary.main, mt: `8px !important`}}><PersonOutlineIcon /></Avatar>
                  <Typography variant='body2' sx={{whiteSpace: 'break-spaces', background: grey[100], p: 2, borderRadius: 6}}>{message.content}</Typography>
                </>
                
              ) : 
              (
                <>
                  <Avatar sx={{background: teal[500], mt: `8px !important`}}><PsychologyIcon /></Avatar>
                  <Typography variant='body2' sx={{whiteSpace: 'break-spaces', background: grey[100], p: 2, borderRadius: 6}}>{answerText(message.content) as ReactNode}</Typography>
                </>
                
              )}            
            </Stack>
          ))}

          {isLoading && (
            <Box sx={{mt: 3}}>
              <Loading />
              <p style={{textAlign: 'center'}}>{elapsedTime}秒 経過</p>
              <p>GPTからの返答待ちです</p>
            </Box>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <FormControl fullWidth sx={{mb: 3}}>
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

            {selectedApiEndpoint.useRag && (
              <FormControl fullWidth sx={{mb: 3}}>
                <Select
                  value={selectedRagFile?.id.toString()}
                  onChange={handleRagFileChange}
                  disabled={isLoading}
                >
                  {props.ragFiles.map((ragFile) => (
                    <MenuItem key={ragFile.id} value={ragFile.id.toString()}>
                      {ragFile.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Stack direction="row" alignItems="start">
              <FormControl fullWidth>
                <TextField
                  {...register('message')}
                  placeholder='要望を入力してください'
                  multiline
                  minRows={1}
                  disabled={isLoading || !selectedApiEndpoint}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                    setMessage(e.target.value);
                  }}
                  onKeyDown={(e) => {handleKeyDown(e)}}
                />
              </FormControl>

              <Button
                variant="contained"
                type='submit'
                onSubmit={handleSubmit(onSubmit)}
                disabled={isLoading || !message || !selectedApiEndpoint}
                sx={{ml: 1}}
              >
                送信
              </Button>
            </Stack>        
          </form>
        </Paper>

        <Stack spacing={2}>
          {proposals?.map((proposal: SerializableConsultationProposal, index) => (
            <Paper key={index} sx={{p: 3, whiteSpace: 'break-spaces'}}>
              <Typography sx={{fontWeight: 'bold', mb: 0.5}}>{proposal.title}</Typography>
              <Typography sx={{marginBottom: 2}}>{proposal.content}</Typography>
                {proposal.fullText ? (
                  <Box>
                    <Typography sx={{fontWeight: 'bold', mb: 1}}>詳細</Typography>
                    <Typography>{proposal.fullText}</Typography>
                  </Box>
                ) : (
                  <Stack direction='row' justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      onClick={() => createProposalFullText(proposal)}
                      disabled={!!selectedProposal}
                    >{selectedProposal?.id === proposal.id ? "詳細を作成中" : "詳細を作成する"}</Button>
                  </Stack>
                )}
              
              {selectedProposal?.id === proposal.id && (
                <Stack direction='row' justifyContent="flex-end" sx={{mt: 3}}>
                  <Loading />
                </Stack>
              )}
            </Paper>
            
          ))}
        </Stack>
      </Stack>

      {['ADMIN', 'POWER'].includes(props.currentUser.role) && (
        <>
          {(Object.keys(displayPrompts).length !== 0) && (
            <Box sx={{mb: 3, background: 'white', p: 3, borderRadius: 2, mt: 3}}>
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
          )}
          
          {selectedApiEndpoint.useRag && (
            <Box sx={{background: 'white', borderRadius: 2, p: 3, mb: 3}}>
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
    </Layout>
  );
};
export default consultationPage;

export const getServerSideProps: GetServerSideProps = withAuth(async (context: GetServerSidePropsContext) => {
  const commonProps: { currentUser: UserWithoutTimestamp }  = await getCommonProps(context, ['consultation']);
  if (!commonProps) {
    return { props: {} };
  }

  const { consultationId } = context.params;
  const consultationWithChildren: Consultation & { consultationMessages: ConsultationMessage[], consultationProposals?: ConsultationProposal[] } = (await prisma.consultation.findUnique({
    where: {
      id: Number(consultationId),
    },
    include: {
      consultationMessages: {
        orderBy: {
          createdAt: 'asc'
        },
      },
      consultationProposals: { orderBy: {
        createdAt: 'asc'
      }
    }
    },
    
  })) as Consultation & { consultationMessages: ConsultationMessage[] };

  if (!consultationWithChildren) {
    return {
      notFound: true,
    };
  }

  const apiEndpoints: ApiEndpoint[] = await prisma.apiEndpoint.findMany({
    where: {
      endpointType: "CONSULTATION"
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const ragFiles: RagFile[] = await prisma.ragFile.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  });

  const props: Props = {
    ...commonProps,
    gptVendor: process.env.GPT_VENDOR,
    apiEndpoints: apiEndpoints.map((apiEndpoint) => ({
      ...apiEndpoint,
      createdAt: apiEndpoint.createdAt.toLocaleString(),
      updatedAt: apiEndpoint.updatedAt.toLocaleString(),
    })),
    ragFiles: ragFiles.map((ragFile) => ({
      ...ragFile,
      createdAt: ragFile.createdAt.toLocaleString(),
      updatedAt: ragFile.updatedAt.toLocaleString(),
    })),
    consultation: {
      ...consultationWithChildren,
      createdAt: consultationWithChildren.createdAt.toISOString(),
      updatedAt: consultationWithChildren.updatedAt.toISOString(),
      consultationMessages: consultationWithChildren.consultationMessages.map((consultationMessage) => ({
        ...consultationMessage,
        createdAt: consultationMessage.createdAt.toISOString(),
        updatedAt: consultationMessage.updatedAt.toISOString(),
      })),
      consultationProposals: consultationWithChildren?.consultationProposals.map((consultationProposal) => ({
        ...consultationProposal,
        createdAt: consultationProposal.createdAt.toISOString(),
        updatedAt: consultationProposal.updatedAt.toISOString(),
      })),
    },
  };

  return {
    props: props,
  };
});
