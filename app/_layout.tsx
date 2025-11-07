import { Fragment, useState, useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import BottomSheetContents from '@/components/layouts/BottomSheetContents';
import BottomSheet from '@/components/elements/BottomSheet';
import { useDataPersist, DataPersistKeys } from '@/hooks';
import useColorScheme from '@/hooks/useColorScheme';
import { loadImages, loadFonts, colors } from '@/theme';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppSlice, hydrateWallpapers } from '@/slices';
import { getUserAsync } from '@/services';
import Provider from '@/providers';
import { User } from '@/types';

// keep the splash screen visible while complete fetching resources
SplashScreen.preventAutoHideAsync();

function Router() {
  const { isDark } = useColorScheme();
  const { dispatch, setUser, setLoggedIn } = useAppSlice();
  const { setPersistData, getPersistData } = useDataPersist();
  const [isOpen, setOpen] = useState(false);

  /**
   * preload assets and user info
   */
  useEffect(() => {
    (async () => {
      try {
        await Promise.all([loadImages(), loadFonts()]);

        const user = await getUserAsync();
        dispatch(setUser(user));
        dispatch(setLoggedIn(!!user));
        if (user) setPersistData<User>(DataPersistKeys.USER, user);

        SplashScreen.hideAsync();
        setOpen(true);
      } catch {
        getPersistData<User>(DataPersistKeys.USER)
          .then(user => {
            if (user) dispatch(setUser(user));
            dispatch(setLoggedIn(!!user));
          })
          .finally(() => {
            SplashScreen.hideAsync();
            setOpen(true);
          });
      }
    })();
  }, [dispatch, getPersistData, setLoggedIn, setPersistData, setUser]);

  useEffect(() => {
    dispatch(hydrateWallpapers());
  }, [dispatch]);

  return (
    <Fragment>
      <Slot />
      <StatusBar style="light" />
      <BottomSheet
        isOpen={isOpen}
        initialOpen
        backgroundStyle={isDark && { backgroundColor: colors.blackGray }}>
        <BottomSheetContents onClose={() => setOpen(false)} />
      </BottomSheet>
    </Fragment>
  );
}

export default function RootLayout() {
  return (
    <Provider>
      <Router />
    </Provider>
  );
}
