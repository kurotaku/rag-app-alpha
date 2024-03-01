import React, { ReactNode, useState, useRef, ChangeEvent } from 'react';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { ChatCompletionRequestMessage } from 'openai';
import { theme } from '@/themes';
import { withAuth } from '@/utils/withAuth';
import { getCommonProps } from '@/utils/getCommonProps';
import { logGptData } from '@/utils/logGptData';
import { PrismaClient, ApiEndpoint } from '@prisma/client';
import { UserWithoutTimestamp, SerializableConsultation, SerializableConsultationMessage, SerializableApiEndpoint, SerializableRagFile, SerializableConsultationProposal } from '@/types/types';
import Layout from '@/components/Layout';
import Loading from '@/components/form/Loading';
import { Avatar, Box, Button, FormControl, MenuItem, Paper, Select, SelectChangeEvent, Stack, TextField, Typography } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PsychologyIcon from '@mui/icons-material/Psychology';
import LockIcon from '@mui/icons-material/Lock';
import { grey } from '@mui/material/colors';
import { teal } from '@mui/material/colors';

const prisma = new PrismaClient();

type Props = {
  currentUser: UserWithoutTimestamp;
  gptVendor: string;
  apiEndpoints: SerializableApiEndpoint[];
};

const InterviewIndexPage = (props: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedApiEndpoint, setSelectedApiEndpoint] = useState<SerializableApiEndpoint>(props.apiEndpoints[0]);
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [displayPrompts, setDisplayPrompts] = useState<object>({});
  const [proposals, setProposals] = useState<[]>([]);

  const modelName: string = 'インタビュー'

  const {
    register,
    handleSubmit,
    reset
  } = useForm();

  const handleApiEndpointChange = (event: SelectChangeEvent) => {
    const newSelectedApiEndpoint = props.apiEndpoints.find(apiEndpoint => apiEndpoint.id.toString() === event.target.value);
    if (newSelectedApiEndpoint) {
      setSelectedApiEndpoint(newSelectedApiEndpoint);
    }
  };

  const handleKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      handleSubmit(onSubmit)();
    }
  };
  
  const questionText = (jsonText: string) => {
    const jsonObject = JSON.parse(jsonText);

    if (jsonObject && jsonObject.question) {
      return Object.values(jsonObject.question)
    } else {
      console.error('JSON文字列の解析に失敗したか、questionキーがありません');
    }
  }

  const callGpt = async (text: string) => {
    setIsLoading(true);
    setProposals([]);
    setMessages((prevMessages) => [...prevMessages, { role: 'user', content: text }]);

    const newMessage: ChatCompletionRequestMessage = { role: 'user', content: userInput };

    const prompts = {
      messages: [newMessage],
      primaryPrompt: selectedApiEndpoint.primaryPrompt, 
      secondaryPrompt: selectedApiEndpoint.secondaryPrompt,
      tertiaryPrompt: selectedApiEndpoint.tertiaryPrompt,
      quaternaryPrompt: selectedApiEndpoint.quaternaryPrompt,
      quinaryPrompt: selectedApiEndpoint.quinaryPrompt,
    }

    setDisplayPrompts({
      ユーザーの入力: userInput,
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

    await logGptData(callGpt.data, JSON.stringify(prompts), startedAt, props.gptVendor, 'インタビュー', selectedApiEndpoint?.name);
  
    const assistantMessage = callGpt.data.choices[0].message.content;
    
    setMessages((prevMessages) => [...prevMessages, {role: 'assistant', content: assistantMessage}]);
    setProposals(JSON.parse(assistantMessage).proposals);

    reset();
    setUserInput('');
    setIsLoading(false);
  }

  const onSubmit = async (data) => {
    callGpt(userInput);
  }

  const pageTitle = (
    <Stack direction="row" alignItems="center">
      <Typography variant="h6" sx={{fontWeight: 'bold'}}>{modelName}</Typography>
    </Stack>
  )

  return (
    <Layout userRole={props.currentUser.role} title={modelName} pageTitle={pageTitle}>
      <Stack direction="row" alignItems="start" spacing={3}>
        <Paper sx={{p: 3, width: '100%', maxWidth: '720px', flex: '0 0 auto'}}>
          {messages.map((message, index) => (
            <>
              {message.role == 'user' ? (
                <Stack key={index} direction="row" spacing={2} sx={{mb: 3}}>
                  <Avatar sx={{background: theme.palette.primary.main, mt: `8px !important`}}><PersonOutlineIcon /></Avatar>
                  <Typography variant='body2' sx={{whiteSpace: 'break-spaces', background: grey[100], p: 2, borderRadius: 6}}>{message.content}</Typography>
                </Stack>
                
              ) : 
              (
                <Box key={index}>
                  <Stack direction="row" spacing={2} sx={{mb: 3}}>
                    <Avatar sx={{background: teal[500], mt: `8px !important`}}><PsychologyIcon /></Avatar>
                    <Typography variant='body2' sx={{whiteSpace: 'break-spaces', background: grey[100], p: 2, borderRadius: 6}}>{questionText(message.content) as ReactNode}</Typography>
                  </Stack>

                  <Stack direction="row" spacing={2} sx={{mb: 3}}>
                    {JSON.parse(message.content).choices.map((choice, index) => (
                      <Button
                        variant="outlined"
                        key={index}
                        onClick={() => callGpt(choice)}
                        sx={{borderRadius: 8}}
                      >
                        {choice}
                      </Button>
                    ))}
                  </Stack>
                </Box>
              )}
            </>
          ))}

          {isLoading && (
            <Box sx={{mt: 3}}>
              <Loading />
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

            <Stack direction="row" alignItems="start">
              <FormControl fullWidth>
                <TextField
                  {...register('message')}
                  placeholder='要望を入力してください'
                  multiline
                  minRows={1}
                  disabled={isLoading || !selectedApiEndpoint}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                    setUserInput(e.target.value);
                  }}
                  onKeyDown={(e) => {handleKeyDown(e)}}
                />
              </FormControl>

              <Button
                variant="contained"
                type='submit'
                onSubmit={handleSubmit(onSubmit)}
                disabled={isLoading || !userInput || !selectedApiEndpoint}
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
              <Typography sx={{mb: 2}}>{proposal.content}</Typography>
            </Paper>
          ))}
        </Stack>
      </Stack>

      {['ADMIN', 'POWER'].includes(props.currentUser.role) && (
        <>
          {Object.keys(displayPrompts).length > 0 && (
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
        </>
      )}
    </Layout>
  );
}

export default InterviewIndexPage

export const getServerSideProps: GetServerSideProps = withAuth(async (context: GetServerSidePropsContext) => {
  const commonProps: { currentUser: UserWithoutTimestamp }  = await getCommonProps(context, ['consultation']);
  if (!commonProps) {
    return { props: {} };
  }

  const apiEndpoints: ApiEndpoint[] = await prisma.apiEndpoint.findMany({
    where: {
      endpointType: "INTERVIEW"
    },
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
  };

  return {
    props: props,
  };
});
