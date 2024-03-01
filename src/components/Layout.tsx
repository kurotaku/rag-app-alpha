import React, { ReactNode } from 'react';
import { theme } from '@/themes';
import Head from 'next/head';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import { purple, cyan } from '@mui/material/colors';
import CssBaseline from '@mui/material/CssBaseline';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Container from '@mui/material/Container';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ListItems from '@/components/ListItems';

const env: string = process.env.NEXT_PUBLIC_ENV || 'development'

const drawerWidth: number = 260;

const EnvLabel = styled('div')({
  padding: '8px',
  textAlign: 'center',
  color: 'white',
  fontWeight: 'bold',
  fontSize: '12px',
})


interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  background: 'white',
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  boxShadow: '0px 0px 4px rgba(0, 0, 0, .1)'
  , 
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    '& .MuiDrawer-paper': {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: 'border-box',
      ...(!open && {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
          width: theme.spacing(9),
        },
      }),
    },
  }),
);

type Props = {
  children?: ReactNode;
  title?: string;
  pageTitle?: ReactNode;
  userRole?: string;
};

// TODO remove, this demo shouldn't need to reset the theme.
const defaultTheme = createTheme();

const Layout: React.FC<Props> = ({ children, pageTitle, title = 'GPT APP', userRole = 'STANDARD' }: Props) => {
  const [open, setOpen] = React.useState(true);
  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <ThemeProvider theme={theme}>
      <Head>
        <title>{title}</title>
        <meta charSet='utf-8' />
        <meta name='viewport' content='initial-scale=1.0, width=device-width' />
      </Head>

      {env === 'development' && (
        <EnvLabel sx={{background: cyan[500]}}>
          この環境は開発環境です
        </EnvLabel>
      )}
      {env === 'staging' && (
        <EnvLabel sx={{background: purple[500]}}>
          この環境はステージング環境です
        </EnvLabel>
      )}

      <Box sx={{ display: 'flex', position: 'relative'}}>
        <CssBaseline />
        <AppBar position="absolute" open={open}>
          <Toolbar
            sx={{
              pr: '24px', // keep right padding when drawer closed
            }}
          >
            <IconButton
              edge="start"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{
                marginRight: '36px',
                ...(open && { display: 'none' }),
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              component="h1"
              variant="h6"
              color="#000"
              noWrap
              sx={{ flexGrow: 1 }}
            >
              {pageTitle}
            </Typography>
          </Toolbar>
        </AppBar>
        <Drawer variant="permanent" open={open}>
          <Toolbar
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              px: [1],
            }}
          >
            <IconButton onClick={toggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Divider />
          <List component="nav">
            <ListItems userRole={userRole} />
          </List>
        </Drawer>
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            minHeight: '100vh',
            overflow: 'auto',
          }}
        >
          <Toolbar />
          <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
            {children}
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
export default Layout;
