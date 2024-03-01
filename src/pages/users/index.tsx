import { GetServerSideProps } from 'next';
import { withAuth } from '../../utils/withAuth';
import { getCommonProps } from '../../utils/getCommonProps';
import { PrismaClient, User, UserRole } from '@prisma/client';
import { UserWithoutTimestamp, SerializableUser } from '../../types/types';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import Modal from '../../components/modal/Modal';
import { styled } from '@mui/material/styles';
import { FormControl, FormLabel, TextField, Select, MenuItem, IconButton, Button, Alert, Stack, Typography } from '@mui/material';
import { Paper, TableContainer, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import Fab from '@/components/button/Fab';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';

const prisma = new PrismaClient();

type Props = {
  currentUser: UserWithoutTimestamp;
  users: SerializableUser[];
};

const HeaderTableCell = styled(TableCell)((props) => ({
  fontWeight: 'bold',
  whiteSpace: 'nowrap'
}))

const usersIndex = (props: Props) => {
  const { t } = useTranslation(['common', 'user']);
  const modelName = t('models.user');
  const router = useRouter();
  const { deleted } = router.query;

  const [user, setUser] = useState(null);
  const [users, setUsers] = useState(props.users);
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessagel] = useState<string>('');

  const {
    register,
    setValue,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      role: 'STANDARD',
      name: '',
      email: '',
      password: '',
      passwordConfirmation: ''
  }});

  const password = watch("password");
  const userRoleValue = watch('role');

  const fetchUsers = async () => {
    const response = await axios.get('/api/private/users');
    setUsers([...response.data]);
  };

  useEffect(() => {
    if (deleted === 'true') {
      toast.success(`${modelName}を削除しました`);
    }
  }, [deleted]);

  const toggleModal = (e: React.MouseEvent, user = null) => {
    if (e.target === e.currentTarget) {
      if (!isOpenModal) {
        setUser(user);
      } else {
        reset();
        setUser(null);
      }
      setIsOpenModal(!isOpenModal);
    }
  };

  const createUser = async (data) => {
    await axios.post('/api/private/users', data, { withCredentials: true });
    toast.success(`${modelName}を作成しました`);
  };

  const editUser = (user) => {
    setUser(user);
    setValue('role', user.role);
    setValue('name', user.name);
    setValue('email', user.email);
    setIsOpenModal(!isOpenModal);
  };

  const updateUser = async (data) => {
    try {
      await axios.put(`/api/private/users/${user.id}`, data, { withCredentials: true });
      toast.success(`${modelName}を更新しました`);
    } catch(error) {
      if (error.response) {
        setErrorMessagel(error.response.data.message);
        toast.error(`${modelName}の更新に失敗しました`);
      } else {
        console.error(error);
      }
    }
  };

  const deleteUser= async (user) => {
    try {
      await axios.delete(`/api/private/users/${user.id}`, { withCredentials: true });
      fetchUsers();
      toast.success(`${modelName}を削除しました`);
    } catch (error) {
      if (error.response) {
        setErrorMessagel(error.response.data.message);
        toast.error(`${modelName}の削除に失敗しました`);
      } else {
        console.error(error);
      }
    }
  };

  const onSubmit = async (data) => {
    if(user) {
      await updateUser(data);
    } else {
      await createUser(data);
    }
    fetchUsers();
    reset();
    setIsOpenModal(!isOpenModal);
  };

  const pageTitle = (
    <Stack direction="row" alignItems="center">
      <LockIcon fontSize="small" sx={{mr: 1}} />
      <Typography variant="h6" sx={{fontWeight: 'bold'}}>{modelName}</Typography>
    </Stack>
  )

  return (
    <Layout userRole={props.currentUser.role} title={modelName} pageTitle={pageTitle}>
      {errorMessage && (
        <Alert severity="error" sx={{mb: 3}}>{errorMessage}</Alert>
      )}

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
              <TableRow>
                <HeaderTableCell>{t('user:user.id')}</HeaderTableCell>
                <HeaderTableCell>{t('user:user.name')}</HeaderTableCell>
                <HeaderTableCell>{t('user:user.role')}</HeaderTableCell>
                <HeaderTableCell>{t('user:user.email')}</HeaderTableCell>
                <HeaderTableCell></HeaderTableCell>
              </TableRow>
          </TableHead>
          <TableBody>
          {users?.map((user, index) => (
            <TableRow key={index}>
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>{t(`user:UserRole.${user.role}`)}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell sx={{textAlign: 'right'}}>
                <IconButton aria-label="edit" onClick={() => editUser(user)} sx={{mr: 1}}>
                  <EditIcon /> 
                </IconButton>
                <IconButton aria-label="delete" onClick={() => deleteUser(user)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Fab color="primary" aria-label="add" onClick={toggleModal}>
        <AddIcon onClick={toggleModal} />
      </Fab>

      {isOpenModal && (
        <Modal close={toggleModal}>
          <form onSubmit={handleSubmit(onSubmit)} style={{padding: '24px'}}>
            {user?.role != 'ADMIN' && (
              <FormControl fullWidth sx={{mb: 3}}>
                <FormLabel sx={{mb: 1, fontWeight: 'bold'}} required>{t('user:user.role')}</FormLabel>
                <Select
                  {...register('role', {
                    required: '必須項目です'
                  })}
                  value={userRoleValue}
                >
                  {Object.values(UserRole).filter(role => role !== UserRole.ADMIN).map((role, index) => (
                    <MenuItem key={index} value={role}>
                      {t(`user:UserRole.${role}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            <FormControl sx={{mb: 3, width: 1}} required>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}} error={Boolean(errors.name)}>{t('user:user.name')}</FormLabel>
              <TextField
                {...register('name', {
                  required: '必須項目です'
                })}
                sx={{ width: 1 }}
                error={Boolean(errors.name)}
                helperText={errors.name ? errors.name.message as string : ''}
              />
            </FormControl>

            <FormControl sx={{mb: 3, width: 1}} required>
              <FormLabel sx={{mb: 1, fontWeight: 'bold'}} error={Boolean(errors.email)}>{t('user:user.email')}</FormLabel>
              <TextField
                {...register('email', {
                  required: '必須項目です'
                })}
                sx={{ width: 1 }}
                error={Boolean(errors.email)}
                helperText={errors.email ? errors.email.message as string : ''}
              />
            </FormControl>

            {!user ? (
              <>
                <FormControl sx={{mb: 3, width: 1}} required>
                  <FormLabel sx={{mb: 1, fontWeight: 'bold'}} error={Boolean(errors.password)}>{t('user:user.password')}</FormLabel>
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
                      
                <FormControl sx={{mb: 3, width: 1}} required>
                  <FormLabel sx={{mb: 1, fontWeight: 'bold'}} error={Boolean(errors.passwordConfirmation)}>{t('user:user.passwordConfirmation')}</FormLabel>
                  <TextField
                    type="password"
                    {...register('passwordConfirmation', {
                      required: '必須項目です',
                      validate: (value) => {
                        return value === password || "パスワードが一致しません";
                      }
                    })}
                    sx={{ width: 1 }}
                    error={Boolean(errors.passwordConfirmation)}
                    helperText={errors.passwordConfirmation ? errors.passwordConfirmation.message as string : ''}
                  />
                </FormControl>
              </>
            ) : null}
            
            <Button
              size="large"
              variant="contained"
              type='submit'
            >
              {user ? t('common:update') : t('common:create')}
            </Button>
          </form>
        </Modal>
      )}
    </Layout>
  );
};

export default usersIndex;

export const getServerSideProps: GetServerSideProps = withAuth(async (context) => {
  const commonProps: { currentUser: UserWithoutTimestamp }  = await getCommonProps(context, ['user']);
  if (!commonProps) {
    return { props: {} };
  }

  const users: User[] = await prisma.user.findMany({
    orderBy: {id: 'desc'}
  });

  const props: Props = {
    ...commonProps,
    users: users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    })),
  };

  return {
    props: props,
  };
});
