import { Stack } from 'expo-router';
import useColorScheme from '@/hooks/useColorScheme';
import { colors } from '@/theme';

export default function HomeStackLayout() {
  const { isDark } = useColorScheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? colors.blackGray : colors.darkPurple,
        },
      }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="details"
        options={{
          title: 'Details',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
