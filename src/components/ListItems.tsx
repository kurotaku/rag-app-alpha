import * as React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link'
import { signOut } from 'next-auth/react';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { Divider, ListSubheader } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import ApiIcon from '@mui/icons-material/Api';
import TuneIcon from '@mui/icons-material/Tune';
import LiveHelpOutlinedIcon from '@mui/icons-material/LiveHelpOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';
import KeyIcon from '@mui/icons-material/Key';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';

type Props = {
  userRole?: string;
};

const ListItems: React.FC<Props> = ({ userRole = 'STANDARD' }: Props) => {
  const router = useRouter();

  return (
  <>
    <ListItemButton
      component={Link}
      href="/consultations"
      selected={router.pathname.startsWith('/consultations')}
    >
      <ListItemIcon>
        <DashboardIcon />
      </ListItemIcon>
      <ListItemText primary="提案" />
    </ListItemButton>

    <ListItemButton
      component={Link}
      href="/interviews"
      selected={router.pathname.startsWith('/interviews')}
    >
      <ListItemIcon>
        <FactCheckIcon />
      </ListItemIcon>
      <ListItemText primary="インタビュー" />
    </ListItemButton>

    <ListItemButton
      component={Link}
      href="/chats"
      selected={router.pathname.startsWith('/chats')}
    >
      <ListItemIcon>
        <ChatIcon />
      </ListItemIcon>
      <ListItemText primary="チャット" />
    </ListItemButton>

    {['ADMIN', 'POWER'].includes(userRole) && (
      <>
        <Divider sx={{ my: 1 }} />
        <ListSubheader component="div" inset>
          管理者限定
        </ListSubheader>
        <ListItemButton
          component={Link}
          href="/gpt-logs"
          selected={router.pathname.startsWith('/gpt-logs')}
        >
          <ListItemIcon>
            <BorderColorIcon />
          </ListItemIcon>
          <ListItemText primary="GPTログ" />
        </ListItemButton>

        <ListItemButton
          component={Link}
          href="/api-endpints"
          selected={router.pathname.startsWith('/api-endpints')}
        >
          <ListItemIcon>
            <ApiIcon />
          </ListItemIcon>
          <ListItemText primary="APIエンドポイント" />
        </ListItemButton>

        <ListItemButton
          component={Link}
          href="/rag-files"
          selected={router.pathname.startsWith('/rag-files')}
        >
          <ListItemIcon>
            <TextSnippetIcon />
          </ListItemIcon>
          <ListItemText primary="RAGデータ" />
        </ListItemButton>

        <ListItemButton
          component={Link}
          href="/system-parameters"
          selected={router.pathname.startsWith('/system-parameters')}
        >
          <ListItemIcon>
            <TuneIcon />
          </ListItemIcon>
          <ListItemText primary="システムパラメーター" />
        </ListItemButton>

        <ListItemButton
          component={Link}
          href="/questions"
          selected={router.pathname.startsWith('/questions')}
        >
          <ListItemIcon>
            <LiveHelpOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary="質問項目" />
        </ListItemButton>

        <ListItemButton
          component={Link}
          href="/users"
          selected={router.pathname.startsWith('/users')}
        >
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="ユーザー" />
        </ListItemButton>
      </>
    )}

    <Divider sx={{ my: 1 }} />

    <ListItemButton
      component={Link}
      href="/password"
      selected={router.pathname.startsWith('/password')}
    >
      <ListItemIcon>
        <KeyIcon />
      </ListItemIcon>
      <ListItemText primary="パスワード" />
    </ListItemButton>

    <ListItemButton
      onClick={() => {
        signOut({ callbackUrl: '/auth/signin' }); // 任意のログアウト後に遷移するページへの URL
      }}
    >
      <ListItemIcon>
        <LogoutIcon />
      </ListItemIcon>
      <ListItemText primary="ログアウト" />
    </ListItemButton>
  </>
)};
export default ListItems;
