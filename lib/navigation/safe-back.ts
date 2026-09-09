import { type Href, useRouter } from 'expo-router';

type BackRouter = Pick<ReturnType<typeof useRouter>, 'back' | 'replace'> & {
  canGoBack?: ReturnType<typeof useRouter>['canGoBack'];
};

export const backOrReplace = (router: BackRouter, fallbackHref: Href) => {
  if (typeof router.canGoBack === 'function' && router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallbackHref);
};
