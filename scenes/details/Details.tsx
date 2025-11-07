import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Image from '@/components/elements/Image';
import ActionButton from '@/components/elements/ActionButton';
import Button from '@/components/elements/Button';
import { toggleWallpaperFavorite, useWallpaperSlice } from '@/slices';
import {
  openSetWallpaperDeepLink,
  saveWallpaperToLibrary,
  showDownloadErrorBanner,
  showDownloadSuccessBanner,
} from '@/services';
import { colors, fonts } from '@/theme';

const { height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.blackGray,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 54,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandText: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.white,
  },
  paletteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,12,16,0.4)',
  },
  previewContainer: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: screenHeight * 0.72,
  },
  footer: {
    padding: 24,
    gap: 18,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 24,
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.white,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  tagText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
});

export default function Details() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { dispatch, items, favorites } = useWallpaperSlice();

  const wallpaper = useMemo(() => items.find(item => item.id === id) ?? items[0], [id, items]);

  const [isSaving, setSaving] = useState(false);
  const [isSetting, setSetting] = useState(false);

  const isFavorite = useMemo(
    () => (wallpaper ? favorites.includes(wallpaper.id) : false),
    [favorites, wallpaper],
  );

  const readableSize = useMemo(() => {
    if (!wallpaper) return '';
    const bytes = wallpaper.size ?? 0;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${bytes} B`;
  }, [wallpaper]);

  const tagLine = useMemo(() => {
    if (!wallpaper?.tags?.length) return '';
    return wallpaper.tags.slice(0, 3).map(tag => `#${tag}`).join(' ');
  }, [wallpaper]);

  const handleToggleFavorite = useCallback(() => {
    if (wallpaper) {
      dispatch(toggleWallpaperFavorite(wallpaper.id));
    }
  }, [dispatch, wallpaper]);

  const handleSave = useCallback(async () => {
    if (!wallpaper || isSaving) return;
    setSaving(true);
    try {
      await saveWallpaperToLibrary(wallpaper);
      showDownloadSuccessBanner();
    } catch (error) {
      showDownloadErrorBanner(error);
    } finally {
      setSaving(false);
    }
  }, [isSaving, wallpaper]);

  const handleSet = useCallback(async () => {
    if (!wallpaper || isSetting) return;
    setSetting(true);
    try {
      await openSetWallpaperDeepLink(wallpaper);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to open wallpaper prompt';
      Alert.alert('Unable to set wallpaper', message);
    } finally {
      setSetting(false);
    }
  }, [isSetting, wallpaper]);

  if (!wallpaper) {
    return (
      <SafeAreaView style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text
          style={{
            color: colors.white,
            fontFamily: fonts.semiBold,
            fontSize: 16,
            marginBottom: 16,
          }}>
          Wallpaper not found
        </Text>
        <Button
          title="Go back"
          onPress={() => router.back()}
          style={{
            backgroundColor: colors.purple,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 22,
          }}
          titleStyle={{ color: colors.white, fontFamily: fonts.semiBold }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <LinearGradient
        colors={['rgba(11,13,24,0.6)', 'rgba(11,13,24,0.0)']}
        locations={[0, 0.3]}
        pointerEvents="none"
        style={styles.header}
      />
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <MaterialCommunityIcons name="waves" size={24} color={colors.white} />
            <Text style={styles.brandText}>Zenith</Text>
          </View>
            <View style={styles.metaRow}>
              {tagLine ? <Text style={styles.tagText}>{tagLine}</Text> : <View />}
              <Text style={styles.tagText}>{readableSize}</Text>
            </View>
              size={24}
              color={isFavorite ? colors.pink : colors.white}
            />
          </Pressable>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: wallpaper.fullUrl }}
            contentFit="cover"
            style={styles.image}
            transition={300}
          />
        </View>
        <LinearGradient
          colors={['rgba(10,12,16,0.0)', 'rgba(10,12,16,0.9)']}
          style={{ paddingTop: 32 }}>
          <View style={styles.footer}>
            <View>
              <Text style={styles.title}>{wallpaper.name}</Text>
              {wallpaper.description ? (
                <Text style={styles.subtitle}>{wallpaper.description}</Text>
              ) : null}
              <View style={styles.metaRow}>
                <Text style={styles.tagText}>
                  {wallpaper.tags
                    ?.slice(0, 3)
                    .map(tag => `#${tag}`)
                    .join(' ')}
                </Text>
                <Text style={styles.tagText}>{Math.round(wallpaper.size / 1024)} KB</Text>
              </View>
            </View>
            <ActionButton
              label={isSetting ? 'Opening…' : 'Set Wallpaper'}
              onPress={handleSet}
              accessibilityLabel="Open system wallpaper prompt"
            />
            <View style={styles.actionRow}>
              <Pressable
                style={styles.secondaryButton}
                onPress={handleSave}
                accessibilityLabel="Save wallpaper"
                disabled={isSaving}>
                <Text style={[styles.secondaryLabel, isSaving && { opacity: 0.7 }]}>
                  {isSaving ? 'Saving…' : 'Save'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.secondaryButton, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                onPress={() => router.back()}
                accessibilityLabel="Go back">
                <Text style={styles.secondaryLabel}>Close</Text>
              </Pressable>
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}
