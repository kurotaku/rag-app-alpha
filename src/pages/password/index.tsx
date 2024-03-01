import { GetServerSideProps } from 'next';
import { withAuth } from '@/utils/withAuth';
import { getCommonProps } from '@/utils/getCommonProps';
import { UserWithoutTimestamp } from '@/types/types';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-toastify';
import Layout from '@/components/Layout';
import { FormControl, FormLabel, TextField, Button, Paper, Alert, Stack, Typography } from '@mui/material';

type Props = {
  currentUser: UserWithoutTimestamp;
};

const passwordIndex = (props: Props) => {
  const { t } = useTranslation(['common', 'user']);
  
  const [errorMessage, setErrorMessagel] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  const newPassword = watch("newPassword");

  const onSubmit = async (data) => {
    try{
      await axios.put(`/api/private/users/password`, data, { withCredentials: true });
      toast.success(`${t('user:user.password')}を更新しました`);
      reset();
    } catch(error) {
      if (error.response) {
        setErrorMessagel(error.response.data.message);
        toast.error(`${t('user:user.password')}の更新に失敗しました`);
      } else {
        console.error(error);
      }
    } 
  };

  const pageTitle = (
    <Stack direction="row" alignItems="center">
      <Typography variant="h6" sx={{fontWeight: 'bold'}}>{t('user:user.password')}</Typography>
    </Stack>
  )

  return (
    <Layout userRole={props.currentUser.role} title={t('user:user.password')} pageTitle={pageTitle}>
      <Paper sx={{p: 3}}>
        {errorMessage && (
          <Alert severity="error" sx={{mb: 3}}>{errorMessage}</Alert>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormControl sx={{mb: 3}} fullWidth required>
            <FormLabel sx={{mb: 1, fontWeight: 'bold'}} error={Boolean(errors.currentPassword)}>{t('user:user.currentPassword')}</FormLabel>
            <TextField
              type="password"
              {...register('currentPassword', {
                required: '必須項目です'
              })}
              sx={{ width: 1 }}
              error={Boolean(errors.currentPassword)}
              helperText={errors.currentPassword ? errors.currentPassword.message as string : ''}
            />
          </FormControl>

          <FormControl sx={{mb: 3}} fullWidth required>
            <FormLabel sx={{mb: 1, fontWeight: 'bold'}} error={Boolean(errors.newPassword)}>{t('user:user.newPassword')}</FormLabel>
            <TextField
              type="password"
              {...register('newPassword', {
                required: '必須項目です',
              })}
              sx={{ width: 1 }}
              error={Boolean(errors.newPassword)}
              helperText={errors.newPassword ? errors.newPassword.message as string : ''}
            />
          </FormControl>

          <FormControl sx={{mb: 3}} fullWidth required>
            <FormLabel sx={{mb: 1, fontWeight: 'bold'}} error={Boolean(errors.newPasswordConfirmation)}>{t('user:user.newPasswordConfirmation')}</FormLabel>
            <TextField
              type="password"
              {...register('newPasswordConfirmation', {
                required: '必須項目です',
                validate: (value) => {
                  return value === newPassword || "パスワードが一致しません";
                }
              })}
              sx={{ width: 1 }}
              error={Boolean(errors.newPasswordConfirmation)}
              helperText={errors.newPasswordConfirmation ? errors.newPasswordConfirmation.message as string : ''}
            />
          </FormControl>
          
          <Button
            size="large"
            variant="contained"
            type='submit'
          >
            {t('common:update')}
          </Button>
        </form>
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

  const props: Props = {
    ...commonProps,
  };

  return {
    props: props,
  };
});
