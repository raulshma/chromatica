import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Image from '@/components/elements/Image';
import { colors, fonts } from '@/theme';
import type { Wallpaper } from '@/types';

interface WallpaperCardProps {
  wallpaper: Wallpaper;
  onPress: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
}

const CARD_GRADIENT = ['rgba(10,12,16,0.0)', 'rgba(10,12,16,0.55)'];

function WallpaperCardComponent({
  wallpaper,
  onPress,
  onToggleFavorite,
  isFavorite,
}: WallpaperCardProps) {
  const title = useMemo(() => wallpaper.name ?? 'Wallpaper', [wallpaper.name]);

  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityLabel={`View ${title}`}>
      <Image source={{ uri: wallpaper.previewUrl }} contentFit="cover" style={styles.image} />
      <LinearGradient colors={CARD_GRADIENT} style={styles.overlay} />
      <View style={styles.metaContainer}>
        <View>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {wallpaper.tags?.length ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {wallpaper.tags.slice(0, 2).join(' • ')}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          hitSlop={12}
          onPress={onToggleFavorite}
          style={styles.favoriteButton}>
          <MaterialCommunityIcons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite ? colors.pink : colors.white}
          />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    flex: 1,
    aspectRatio: 0.65,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 18,
    marginHorizontal: 8,
    backgroundColor: colors.blackGray,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  metaContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.white,
  },
  subtitle: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.lightGrayPurple,
  },
  favoriteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 12, 16, 0.35)',
  },
});

export default memo(WallpaperCardComponent);
