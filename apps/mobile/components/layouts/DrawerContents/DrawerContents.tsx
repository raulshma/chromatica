import { StyleSheet, View, Text, FlatList } from 'react-native';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import useColorScheme from '@/hooks/useColorScheme';
import { colors, fonts } from '@/theme';
import {
  useWallpaperSlice,
  toggleWallpaperFavorite,
  loadWallpapers,
} from '@/slices/wallpaper.slice';
import { WallpaperCard } from '@/components/elements/WallpaperCard';
import { useRouter } from 'expo-router';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    textAlign: 'center',
  },
});

export default function DrawerContents() {
  const { isDark } = useColorScheme();
  const router = useRouter();
  const { items, favorites, dispatch } = useWallpaperSlice();

  const favoriteWallpapers = items.filter(w => favorites.includes(w._id));

  useEffect(() => {
    // If there are favorite ids saved but wallpaper items are not loaded,
    // fetch the feed so we can render the favorite items in the drawer.
    if (items.length === 0 && favorites.length > 0) {
      dispatch(loadWallpapers());
    }
  }, [items.length, favorites.length, dispatch]);

  const handleWallpaperPress = (wallpaperId: string) => {
    router.push(`/wallpaper/${wallpaperId}`);
  };

  const handleToggleFavorite = (wallpaperId: string) => {
    dispatch(toggleWallpaperFavorite(wallpaperId));
  };

  const renderWallpaperCard = ({ item }: { item: (typeof items)[0] }) => (
    <View style={{ width: '50%', paddingHorizontal: 4 }}>
      <WallpaperCard
        wallpaper={item}
        onPress={() => handleWallpaperPress(item._id)}
        onToggleFavorite={() => handleToggleFavorite(item._id)}
        isFavorite={favorites.includes(item._id)}
      />
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: isDark ? colors.blackGray : colors.white }]}>
      <View style={[styles.root, { backgroundColor: isDark ? colors.blackGray : colors.white }]}>
        <View
          style={[
            styles.header,
            {
              borderBottomColor: isDark ? colors.lightGrayPurple : colors.blackGray,
            },
          ]}>
          <Text style={[styles.headerTitle, { color: isDark ? colors.white : colors.black }]}>
            Favorites
          </Text>
        </View>

        {favoriteWallpapers.length > 0 ? (
          <FlatList
            data={favoriteWallpapers}
            renderItem={renderWallpaperCard}
            keyExtractor={item => item._id}
            numColumns={2}
            columnWrapperStyle={styles.listContainer}
            scrollEnabled
            contentContainerStyle={{ paddingHorizontal: 8 }}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text
              style={[styles.emptyText, { color: isDark ? colors.lightGrayPurple : colors.black }]}>
              No favorite wallpapers yet{'\n'}Add some to get started!
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
