import { useState } from 'react';
import { getCsrfToken, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { CtxOrReq } from 'next-auth/client/_utils';
import Head from 'next/head';
import { useForm } from 'react-hook-form';
import { Grid, FormControl, FormLabel, TextField, Button, Alert } from '@mui/material';

interface FormInput {
  email?: string;
  password?: string;
}

const Login = ({ csrfToken }: { csrfToken: string | undefined }) => {
  const router = useRouter();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm<FormInput>();

  const signInUser = async (data: FormInput) => {
    await signIn<any>('credentials', {
      redirect: false,
      email: data.email,
      password: data.password,
      callbackUrl: `${window.location.origin}`,
    }).then((res) => {
      if (res?.error) {
        setError('Email,Passwordを正しく入力してください');
      } else {
        router.push('/');
      }
    });
  };

  return (
    <>
      <Head>
        <title>ログイン</title>
        <meta charSet='utf-8' />
        <meta name='viewport' content='initial-scale=1.0, width=device-width' />
      </Head>
      <Grid container alignItems={"center"} justifyContent="center">
        <Grid item xs={3}>
          {error && (
            <Alert severity='error' sx={{mb: 3}}>{error}</Alert>
          )}
          <form onSubmit={handleSubmit(signInUser)}>
            <input name='csrfToken' type='hidden' defaultValue={csrfToken} />
            
            <FormControl sx={{mb: 3, width: 1}} required>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}} error={Boolean(errors.email)}>Email</FormLabel>
              <TextField
                {...register('email', {
                  required: '必須項目です'
                })}
                sx={{ width: 1 }}
                error={Boolean(errors.email)}
                helperText={errors.email ? errors.email.message as string : ''}
              />
            </FormControl>

            <FormControl sx={{mb: 3, width: 1}} required>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}} error={Boolean(errors.password)}>Password</FormLabel>
              <TextField 
                type="password"
                {...register('password', {
                  required: '必須項目です'
                })}
                sx={{ width: 1 }}
                error={Boolean(errors.password)}
                helperText={errors.password ? errors.password.message as string : ''}
              />
            </FormControl>

            <Button
              size="large"
              variant="contained"
              type='submit'
            >
              ログイン
            </Button>
          </form>
        </Grid>
      </Grid>
    </>
  );
};

export default Login;

// POSTリクエスト（サインイン・サインアウトなど）に必要なCSRFトークンを返却する
export const getServerSideProps = async (context: CtxOrReq | undefined) => {
  return {
    props: {
      title: 'login',
      csrfToken: await getCsrfToken(context),
    },
  };
};
