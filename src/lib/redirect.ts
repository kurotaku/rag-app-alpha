import { NextRouter } from 'next/router';

export const redirect = (router: NextRouter, target: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  router.replace(target);
};
