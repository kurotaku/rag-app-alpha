import { useState, useEffect, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { PrismaClient, ApiEndpoint, Chat, User, RagFile } from '@prisma/client';
import { ChatCompletionRequestMessage, ChatCompletionResponseMessage } from 'openai';
import { ulid } from 'ulid';
import axios, { AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { withAuth } from '@/utils/withAuth';
import { getCommonProps } from '@/utils/getCommonProps';
import { formatDateTime } from '@/utils/formatDate';
import { logGptData } from '@/utils/logGptData';
import { UserWithoutTimestamp, SerializableChat, SerializableMessage, SerializableApiEndpoint, SerializableRagFile } from '@/types/types';
import {TextField, Button, FormControl, FormLabel, Select, SelectChangeEvent, MenuItem, Paper, Box, Avatar, Stack, Typography, Chip} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';
import { theme } from '@/themes';
import { grey } from '@mui/material/colors';
import { teal } from '@mui/material/colors';
import Fab from '@/components/button/Fab';
import Layout from '@/components/Layout';
import Loading from '@/components/form/Loading';
import Modal from '@/components/modal/Modal';

const prisma = new PrismaClient();

type ExtendedChat = Chat & {
  apiEndpoint?: ApiEndpoint;
  user: User;
};

type ChatCompletionRequestMessageWithAgentLog = ChatCompletionRequestMessage & {
  agentLog?: string;
}

type ChatMessage = {
  role: string;
  content: string;
  agentLog?: string;
}

type Props = {
  currentUser: UserWithoutTimestamp;
  gptVendor: string;
  chats: SerializableChat[];
  apiEndpoints: SerializableApiEndpoint[];
  ragFiles: SerializableRagFile[];
};

const ChatsIndex = (props: Props) => {
  const { t } = useTranslation(['common', 'chat']);
  const modelName = t('models.chat');
  const router = useRouter();

  const [isOpenModal, setIsOpenModal] = useState<Boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedApiEndpoint, setSelectedApiEndpoint] = useState<SerializableApiEndpoint>(props.apiEndpoints[0]);
  const [selectedRagFile, setSelectedRagFile] = useState<SerializableRagFile>(props.ragFiles[0]);
  const [chats, setChats] = useState<SerializableChat[] | Chat[]>(props.chats);
  const [chatMessages, setChatMessages] = useState<ChatCompletionRequestMessageWithAgentLog[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat>(null);
  const [message, setMessage] = useState<string>('');
  const [displayPrompts, setDisplayPrompts] = useState<object>({});
  const [logContent, setLogContent] = useState<string>('');
  const [requestId, setRequestId] = useState<string>('');
  
  const {
    register,
    handleSubmit,
    reset
  } = useForm();

  useEffect(() => {
    let interval;
  
    if (isLoading && selectedApiEndpoint.useRag) {
      setLogContent('');

      interval = setInterval(() => {
        axios.get<string>(`${process.env.NEXT_PUBLIC_ENV == 'development' ? process.env.NEXT_PUBLIC_BACKEND_URL : '/backend'}/media/textfiles/output_log_${selectedChat?.requestId || requestId}.txt`)
          .then((response) => {
            setLogContent(response.data);
          })
          .catch((error: Error) => {
            console.error(error);
          });
      }, 5000);
    }
  
    return () => {
      // コンポーネントがアンマウントされるか、isLoading が false になった場合にインターバルをクリア
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading]);

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

  const fetchChats = async () => {
    const responce = await axios.get('/api/private/chats');
    setChats([...responce.data]);
  };

  const fetchChatMessages = async (chatId: number) => {
    const getMessages = await axios.get(`/api/private/chats/${chatId}/messages/`);
    setChatMessages(getMessages.data);
  };

  const toggleModal = (e: React.MouseEvent, chat: Chat | null = null) => {
    setLogContent('');
    setSelectedChat(chat);
    setRequestId(ulid());
    setDisplayPrompts({});

    if(chat){
      fetchChatMessages(chat.id);
    }else{
      setChatMessages([]);
    }

    setIsOpenModal(!isOpenModal);
  };

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      const newMessage: ChatCompletionRequestMessageWithAgentLog = { role: 'user', content: message };
      setChatMessages((prevMessages) => [...prevMessages, newMessage]);
      
      const prevMessages: ChatCompletionRequestMessageWithAgentLog[] = chatMessages.map(({ role, content }) => {
        return { role, content } as ChatCompletionRequestMessageWithAgentLog;
      });

      const prompts = {
        requestId: selectedChat?.requestId || requestId,
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
      await logGptData(callGpt.data, JSON.stringify(prompts), startedAt, props.gptVendor, 'フリーチャット', selectedApiEndpoint?.name);

      // 新規Chatの際の処理
      const createChat = async (): Promise<Chat | null> => {
        if (chatMessages.length == 0) {
          const request: AxiosResponse = await axios.post('/api/private/chats', {name: message.slice(0, 100), apiEndpointId: selectedApiEndpoint.id, requestId: requestId}, {
            withCredentials: true,
          });
          setSelectedChat(request.data);
          return request.data;
        }else{
          return null;
        }
      }
      const newChat: Chat | null = await createChat();

      await axios.post(
        `/api/private/chats/${selectedChat?.id || newChat.id }/messages/`,
        {...newMessage, agentLog: agentLog },
        { withCredentials: true },
      );
      const createAssistantMessage: AxiosResponse = await axios.post(
        `/api/private/chats/${selectedChat?.id || newChat.id }/messages/`,
        { ...gptResponse, agentLog: agentLog },
        { withCredentials: true },
      );

      setChatMessages((prevMessages) => [...prevMessages, createAssistantMessage.data]);

    } catch (error) {
      toast.error(`エラーが発生しました`);
      console.error(error);
    } finally {
      fetchChats();
      reset();
      setMessage('');
      setIsLoading(false);
    }
  };

  const pageTitle = (
    <Stack direction="row" alignItems="center">
      <Typography variant="h6" sx={{fontWeight: 'bold'}}>{modelName}</Typography>
    </Stack>
  )
  
  return (
    <Layout userRole={props.currentUser.role} title={modelName} pageTitle={pageTitle}>

      {chats.map((chat, index) => (
        <Paper
          key={index}
          sx={{p: 3, mb: 2, background: 'white'}}
          onClick={(e) => toggleModal(e, chat)}
        >
          <Box sx={{mb: 1}}>
            <Chip label={chat?.apiEndpoint?.name} variant="outlined" sx={{mr: 1}} />
            {formatDateTime(chat.createdAt)}
            <span style={{marginLeft: '8px'}}>{chat.user.name}</span>
          </Box>
          
          <Typography>{chat.name}</Typography>
        </Paper>
      ))}

      <Fab color="primary" aria-label="add" onClick={toggleModal}>
        <AddIcon onClick={toggleModal} />
      </Fab>

      {isOpenModal && (
        <Modal close={toggleModal}>
          <Box sx={{p: 3}}>
            {chatMessages.map((message, index) => (
              <Paper key={index} sx={{p: 3, mb: 2, background: 'white', wordBreak: 'break-all'}}>
                <Stack direction="row" spacing={2}>
                  {message.role == 'user' ? (
                    <Avatar sx={{background: theme.palette.primary.main}}><PersonOutlineIcon /></Avatar>
                  ) : 
                  (
                    <Avatar sx={{background: teal[500]}}><PsychologyIcon /></Avatar>
                  )}
                  
                  <Typography sx={{whiteSpace: 'break-spaces'}}>{message.content}</Typography>
                </Stack>
              </Paper>
            ))}

            {['ADMIN', 'POWER'].includes(props.currentUser.role) && (
              <>
                {Object.keys(displayPrompts).length > 0 && (
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
                )}

                {selectedApiEndpoint?.useRag && (logContent || chatMessages.length != 0) && (
                  <Box sx={{background: grey[100], borderRadius: 2, p: 3, mb: 3}}>
                    <Stack direction="row" alignItems="center" sx={{mb: 2}}>
                      <LockIcon fontSize="small" sx={{mr: 0.5}} />
                      <Typography variant="body2" sx={{fontWeight: 'bold'}}>このエリアは一定権限以上のユーザーのみ表示されています</Typography>
                    </Stack>

                    <Typography sx={{fontWeight: 'bold'}}>Agentの中間ログ</Typography >
                    
                    <Typography variant="body2" sx={{whiteSpace: 'break-spaces'}}>{logContent || chatMessages.at(-1)?.agentLog}</Typography>
                  </Box>
                )}
              </>
            )}

            {isLoading && (
              <Loading />
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

              {selectedApiEndpoint?.useRag && (
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

              <Box sx={{display: 'flex', alignItems: 'start'}}>
                <FormControl fullWidth>
                  <TextField
                    {...register('message')}
                    placeholder='質問を入力してください'
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
                  sx={{ml: 2}}
                >
                  送信
                </Button>
              </Box>        
            </form>
          </Box>
        </Modal>
      )}
    </Layout>
  );
};

export default ChatsIndex;

export const getServerSideProps: GetServerSideProps = withAuth(async (context) => {
  const commonProps: { currentUser: UserWithoutTimestamp } = await getCommonProps(context, ['chat']);
  if (!commonProps) {
    return { props: {} };
  }

  const chats: ExtendedChat[] = await prisma.chat.findMany({
    include: {
      apiEndpoint: true,
      user: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const apiEndpoints: ApiEndpoint[] = await prisma.apiEndpoint.findMany({
    where: {
      endpointType: "FREE_CHAT"
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
    chats: chats.map((chat) => {
      const { createdAt, updatedAt, ...userWithoutTimestamps } = chat.user;
      return {
        ...chat,
        createdAt: chat.createdAt.toLocaleString(),
        updatedAt: chat.updatedAt.toLocaleString(),
        apiEndpoint: chat.apiEndpoint ? {
          ...chat.apiEndpoint,
          createdAt: chat.apiEndpoint.createdAt.toLocaleString(),
          updatedAt: chat.apiEndpoint.updatedAt.toLocaleString(),
        } : null,
        user: userWithoutTimestamps
      }
    }),
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
  };

  return {
    props: props,
  };
});
