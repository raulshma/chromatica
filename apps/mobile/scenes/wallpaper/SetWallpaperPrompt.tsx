import { useCallback, useMemo } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Image from '@/components/elements/Image';
import ActionButton from '@/components/elements/ActionButton';
import Button from '@/components/elements/Button';
import { useWallpaperSlice } from '@/slices';
import { colors, fonts } from '@/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.blackGray,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 21,
  },
  instructions: {
    marginTop: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 20,
    gap: 12,
    backgroundColor: 'rgba(12,14,22,0.6)',
  },
  stepText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.white,
    lineHeight: 21,
  },
  preview: {
    marginTop: 24,
    borderRadius: 28,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 9 / 16,
  },
  footerButtons: {
    marginTop: 32,
    gap: 12,
  },
});

async function openSystemWallpaperSettings() {
  if (Platform.OS === 'android') {
    const intentUrl = 'intent:#Intent;action=android.intent.action.SET_WALLPAPER;end';
    const fallbackUrl = 'package:com.android.settings';
    try {
      if (await Linking.canOpenURL(intentUrl)) {
        await Linking.openURL(intentUrl);
        return;
      }
      if (await Linking.canOpenURL(fallbackUrl)) {
        await Linking.openURL(fallbackUrl);
        return;
      }
    } catch (error) {
      // fall through to generic alert below
    }
  }

  const iosUrl = 'App-Prefs:Wallpaper';
  try {
    if (await Linking.canOpenURL(iosUrl)) {
      await Linking.openURL(iosUrl);
      return;
    }
  } catch (error) {
    // ignore
  }

  Alert.alert('Try manually', 'Open your device wallpaper settings to finish applying this image.');
}

export default function SetWallpaperPrompt() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; src?: string }>();
  const { items } = useWallpaperSlice();

  const wallpaper = useMemo(() => {
    if (params.id) {
      const match = items.find(item => item._id === params.id);
      if (match) return match;
    }
    if (params.src) {
      return {
        _id: params.src,
        uploadThingFileKey: params.src,
        fileName: 'Zenith Wallpaper',
        displayName: 'Zenith Wallpaper',
        previewUrl: params.src,
        fullUrl: params.src,
        size: 0,
        uploadedAt: new Date().toISOString(),
      };
    }
    return undefined;
  }, [items, params.id, params.src]);

  const handleSettingsPress = useCallback(() => {
    openSystemWallpaperSettings();
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <LinearGradient
        colors={['rgba(34,44,86,0.65)', 'rgba(12,14,22,0.95)']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Set Wallpaper</Text>
        <Text style={styles.subtitle}>
          Apply this Zenith wallpaper using your device settings. Follow the quick guide below and
          tap “Open Settings” to finish.
        </Text>
        <View style={styles.instructions}>
          <Text style={styles.stepText}>1. Ensure the wallpaper is saved to your photos.</Text>
          <Text style={styles.stepText}>
            2. Tap “Open Settings” and choose the wallpaper picker option.
          </Text>
          <Text style={styles.stepText}>3. Select Zenith wallpaper and confirm.</Text>
        </View>
        {wallpaper ? (
          <View style={styles.preview}>
            <Image
              source={{ uri: wallpaper.fullUrl }}
              contentFit="cover"
              style={styles.previewImage}
            />
          </View>
        ) : null}
        <View style={styles.footerButtons}>
          <ActionButton
            label="Open Settings"
            onPress={handleSettingsPress}
            accessibilityLabel="Open system wallpaper settings"
          />
          <Pressable
            onPress={() => router.back()}
            style={{
              borderRadius: 26,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.24)',
              paddingVertical: 16,
              alignItems: 'center',
            }}
            accessibilityLabel="Close">
            <Text style={{ fontFamily: fonts.semiBold, fontSize: 16, color: colors.white }}>
              Done
            </Text>
          </Pressable>
          <Button
            title="View in gallery"
            onPress={() =>
              router.push({ pathname: '(main)/(tabs)/home/details', params: { id: params.id } })
            }
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderRadius: 18,
              paddingVertical: 12,
            }}
            titleStyle={{ color: colors.white, fontFamily: fonts.semiBold }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
