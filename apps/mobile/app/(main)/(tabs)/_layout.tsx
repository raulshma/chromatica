import { Tabs } from 'expo-router';
import useColorScheme from '@/hooks/useColorScheme';
import { AntDesign } from '@expo/vector-icons';
import { colors } from '@/theme';
import { StyleSheet, View, Text } from 'react-native';
import { fonts } from '@/theme';

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabBarLabelStyle: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
  },
});

export default function TabLayout() {
  const { isDark } = useColorScheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarInactiveTintColor: colors.gray,
        tabBarInactiveBackgroundColor: isDark ? colors.blackGray : colors.white,
        tabBarActiveTintColor: colors.lightPurple,
        tabBarActiveBackgroundColor: isDark ? colors.blackGray : colors.white,
        tabBarStyle: {
          display: 'none',
        },
        tabBarLabelStyle: styles.tabBarLabelStyle,
        tabBarIconStyle: {
          marginBottom: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <AntDesign name="home" size={24} color={color} />
            </View>
          ),
          tabBarLabel: ({ color, focused }) => (
            <Text style={[styles.tabBarLabelStyle, { color }]}>Home</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <AntDesign name="profile" size={24} color={color} />
            </View>
          ),
          tabBarLabel: ({ color, focused }) => (
            <Text style={[styles.tabBarLabelStyle, { color }]}>Profile</Text>
          ),
        }}
      />
    </Tabs>
  );
}
