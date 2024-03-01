import { appWithTranslation } from 'next-i18next';
import nextI18NextConfig from '../../next-i18next.config.js';
import { SessionProvider } from 'next-auth/react';
import { ToastContainer, Slide } from 'react-toastify';
import '../styles/global.scss';
import 'react-toastify/dist/ReactToastify.css';

const App = ({ Component, pageProps: { session, ...pageProps } }) => (
  <SessionProvider session={session}>
    <ToastContainer position='bottom-right' transition={Slide} />
    <Component {...pageProps} />
  </SessionProvider>
);

export default appWithTranslation(App, nextI18NextConfig);
