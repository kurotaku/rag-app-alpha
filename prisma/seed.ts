import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('=========== Creating Users ===========');

  await prisma.user.create({
    data: {
      role: 'ADMIN',
      name: 'Admin',
      email: 'admin@test.com',
      password: bcrypt.hashSync('password', 10),
    },
  });

  await prisma.user.create({
    data: {
      role: 'POWER',
      name: 'テスト管理者ユーザー',
      email: 'power@test.com',
      password: bcrypt.hashSync('password', 10),
    },
  });

  await prisma.user.create({
    data: {
      role: 'STANDARD',
      name: 'テストユーザー',
      email: 'test@test.com',
      password: bcrypt.hashSync('password', 10),
    },
  });

  console.log('=========== Questions ===========');

  const gender = await prisma.question.create({
    data: {
      name: '性別',
    },
  });

  const currentOccupation = await prisma.question.create({
    data: {
      name: '現在の職業',
    },
  });

  console.log('=========== Choices ===========');

  const travelTypeChoices = [
    { question: gender, name: '男性', prompt: '性別: 男性' },
    { question: gender, name: '女性', prompt: '性別: 女性' },
    { question: currentOccupation, name: '高校生', prompt: '現在の職業: 高校生' },
    { question: currentOccupation, name: '大学生', prompt: '現在の職業: 大学生' },
    { question: currentOccupation, name: '社会人', prompt: '現在の職業: 社会人' },
  ];

  for (const choice of travelTypeChoices) {
    await prisma.choice.create({
      data: {
        question: {
          connect: {
            id: choice.question.id,
          },
        },
        name: choice.name,
        prompt: choice.prompt,
      },
    });
  }

  console.log('=========== ApiEndpoint ===========');
  let primaryPrompt;

  primaryPrompt = `あなたは進路アドバイザーです。
私が、職業選択のヒントになりそうなことを伝えるので、ヒアリングを繰り返して、
私に適した職業を提案してください。
  `;
  
  await prisma.apiEndpoint.create({
    data: {
      endpointType: 'FREE_CHAT',
      useRag: false,
      name: '進路チャットアドバイザー',
      description: '進路アドバイザーとして、適した職業を提案してくれます。',
      url: `/api/private/gpt`,
      primaryPromptDescription: 'システムプロンプト',
      primaryPrompt: primaryPrompt,
    },
  });

  primaryPrompt = `私が、みたい映画のヒントになるようなことをいうので、
それに合わせた映画を選んでお薦めしてください。
映画は一度に必ず3つ答えてください。
お薦めした理由と、映画の見どころも必ず添えてください。
  `;

  await prisma.apiEndpoint.create({
    data: {
      endpointType: 'FREE_CHAT',
      useRag: false,
      name: '映画紹介チャット',
      description: '進路アドバイザーとして、適した職業を提案してくれます。',
      url: `/api/private/gpt`,
      primaryPromptDescription: 'システムプロンプト',
      primaryPrompt: primaryPrompt,
    },
  });

  primaryPrompt = `あなたは進路の相談になる人です。
  
  私からの、進路の希望に対して、以下の項目を答え続けてください。

  - 私との相談のやりとりを含んだ、提案の根拠やコンセプトなどの返答(answer)
  -- 提案(proposals)
  --- 提案のタイトルを「はいかがですか？」などの提案の疑問文形式で(title)
  --- "300文字程度で提案の詳細(content)
  
  を返答してください。proposalsは必ず3つください。
  回答は必ず以下の #出力形式とサンプルその1 もしくは # 出力形式とサンプルその2 もしくは # 出力形式とサンプルその3 のjson形式でお願いします。ソースコード内で使用するのでjson形式以外ものは含めないでください。
  
  # 出力形式とサンプルその1
  {
    "answer": "わかりました。では、このような考えてこのような提案を用意してみました。",
    "proposals": [
      {
        "title": "論理的な思考を活かして人を助ける、弁護士を目指すのはいかがですか？",
        "content": "300文字程度で提案の詳細",
      }
    ]
  }

  # 出力形式とサンプルその2
  {
    "answer": "会話の内容が入ります。",
  }

  # 出力形式とサンプルその3
  {
    "answer": "わかりました。XXXXの詳細を考えてみました。",
    "fullText": "その職業に就くための方法やキャリアパス、必要な能力や資格などを含めて、詳細な提案内容を1000文字以上で"
  }

  私が提案への追加の要望を伝えているときは # 出力形式とサンプルその1
  私が提案が欲しいわけではない質問を疑問文でしてきた場合は # 出力形式とサンプルその2
  私が「（自動メッセージ）XXXX(あなたが過去に提案してくれたproposalsのtitle)の詳細を考えてください。」と言ってきてきたときは # 出力形式とサンプルその3
  の形式でお願いします。

  # 出力形式とサンプルその1の提案を考えて理由は必ず入れてください。

  json形式以外の文言は一切不要です。回答をプログラムで使います。

`;

  await prisma.apiEndpoint.create({
    data: {
      endpointType: 'CONSULTATION',
      useRag: false,
      name: '進路提案',
      description: '進路提案のエンドポイント',
      url: `/api/private/gpt`,
      primaryPrompt: primaryPrompt,
      primaryPromptDescription: 'システムプロンプト'
    },
  });

  primaryPrompt = `進路を提案してほしいです。
  
  こちらの希望にあった進路になるように、質問を繰り返してほしいです。
  質問の選択肢は20文字以内のものを考えてください。
  質問と回答を繰り返し、回答事項が増えていくに連れて、提案してくれるプランがブラッシュアップされていくことを期待しています。
  プランは必ず3つ以上は毎回提案して下さい。
  
  回答はjson形式でお願いします。ソースコード内で使用するのでjson形式以外ものは含めないでください。
  以下はjsonのフォーマットです。

  {
    "question": "質問の内容が入ります。",
    "choices": ["選択肢のテキスト1", "選択肢のテキスト2", "選択肢のテキスト3"],
    "proposals": [
      {
        "title": "論理的な思考を活かして人を助ける、弁護士を目指すのはいかがですか？",
        "content": "300文字程度で提案の詳細",
      }
    ]
  }
`;

  await prisma.apiEndpoint.create({
    data: {
      endpointType: 'INTERVIEW',
      useRag: false,
      name: '進路希望インタビュー',
      description: '進路希望インタビューのエンドポイント',
      url: `/api/private/gpt`,
      primaryPrompt: primaryPrompt,
      primaryPromptDescription: 'システムプロンプト'
    },
  });

  console.log('=========== SystemParameter ===========');

  await prisma.systemParameter.create({
    data: {
      key: 'AzureGptDeployment',
      description: 'Azure OpenAIのdeploymentの選択',
      value: process.env.AZURE_OPENAI_API_DEPROYMENT,
      defaultValue: process.env.AZURE_OPENAI_API_DEPROYMENT,
    },
  });

  await prisma.systemParameter.create({
    data: {
      key: 'AzureGptVersion',
      description: 'Azure OpenAIのversionの選択',
      value: process.env.AZURE_OPENAI_API_VERSION,
      defaultValue: process.env.AZURE_OPENAI_API_VERSION,
    },
  });

  await prisma.systemParameter.create({
    data: {
      key: 'OpenAiModelName',
      description: 'OpenAIのModelの選択',
      value: process.env.OPENAI_API_MODEL_NAME,
      defaultValue: process.env.OPENAI_API_MODEL_NAME,
    },
  });

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
