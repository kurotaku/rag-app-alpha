import { User, Question, Choice, SystemParameter, GptLog, ApiEndpoint, Chat, Message, RagFile, Consultation, ConsultationMessage, ConsultationProposal } from '@prisma/client';

export type UserForToken = Pick<User, 'id' | 'email'>;

export type CommonProps = {
  currentUser: UserWithoutTimestamp;
}

export type UserWithoutTimestamp = Omit<User, 'createdAt' | 'updatedAt'>

export type SerializableUser = Omit<User, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type SerializableQuestion = Omit<Question, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
  choices: SerializableChoice[];
};

export type SerializableChoice = Omit<Choice, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
  questionName: string;
};

export type SerializableSystemParameter = Omit<SystemParameter, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type SerializableApiEndpoint = Omit<ApiEndpoint, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type SerializableRagFile = Omit<RagFile, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type SerializableChat = Omit<Chat, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
  apiEndpoint?: SerializableApiEndpoint;
  user?: UserWithoutTimestamp;
};

export type SerializableMessage = Omit<Message, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
}

export type SerializableConsultation = Omit<Consultation, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
  consultationMessages?: SerializableConsultationMessage[]
  consultationProposals?: SerializableConsultationProposal[]
  apiEndpoint?: SerializableApiEndpoint;
  user?: UserWithoutTimestamp;
};

export type SerializableConsultationMessage = Omit<ConsultationMessage, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type SerializableConsultationProposal = Omit<ConsultationProposal, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type SerializableGptLog = Omit<
  GptLog,
  'startedAt' | 'endedAt' | 'createdAt' | 'updatedAt'
> & {
  startedAt: string;
  endedAt: string;
  createdAt: string;
  updatedAt: string;
  user: UserWithoutTimestamp;
};
