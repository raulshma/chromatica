import { Drawer } from 'expo-router/drawer';
import DrawerContents from '@/components/layouts/DrawerContents';

export default function DrawerWithTabsLayout() {
  return (
    <Drawer
      drawerContent={DrawerContents}
      screenOptions={{
        headerShown: false,
        drawerType: 'back',
        drawerStyle: { width: 320 },
      }}>
      <Drawer.Screen name="(tabs)" options={{ title: 'Tabs' }} />
    </Drawer>
  );
}
