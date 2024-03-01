import { GetServerSidePropsContext } from 'next';
import { getSession } from 'next-auth/react';
import { GetServerSidePropsResult, GetServerSideProps } from 'next';

// この関数はページのgetServerSideProps関数を引数に取り、ログインが必要なページに対して認証を追加します。
export function withAuth(
  gssp: GetServerSideProps,
): (context: GetServerSidePropsContext) => Promise<GetServerSidePropsResult<any>> {
  return async (context: GetServerSidePropsContext) => {
    const session = await getSession(context);

    if (!session) {
      return {
        redirect: {
          destination: '/auth/signin',
          permanent: false,
        },
      };
    }

    // ログインが確認されたら、元のgetServerSideProps関数を実行します。
    return await gssp(context);
  };
}
