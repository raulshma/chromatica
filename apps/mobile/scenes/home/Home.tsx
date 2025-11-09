import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, FlatList, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import BottomSheet from '@/components/elements/BottomSheet';
import { WallpaperCard, WallpaperCardSkeleton } from '@/components/elements/WallpaperCard';
import Button from '@/components/elements/Button';
import useColorScheme from '@/hooks/useColorScheme';
import { loadWallpapers, toggleWallpaperFavorite, useWallpaperSlice } from '@/slices';
import { colors, fonts } from '@/theme';
import type { Wallpaper } from '@chromatica/shared';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerActionsContainer: {
    width: 48,
    height: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.white,
  },
  headerSubtitle: {
    display: 'none',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 120,
    paddingTop: 8,
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.white,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  refreshAccent: {
    height: 180,
  },
});

export default function Home() {
  const router = useRouter();
  const { isDark } = useColorScheme();
  const { dispatch, hydrated, items, favorites, status, error } = useWallpaperSlice();
  const [isSheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (hydrated && status === 'idle') {
      dispatch(loadWallpapers());
    }
  }, [dispatch, hydrated, status]);

  const onRefresh = useCallback(() => {
    dispatch(loadWallpapers());
  }, [dispatch]);

  const renderItem = useCallback(
    ({ item }: { item: Wallpaper }) => (
      <WallpaperCard
        wallpaper={item}
        onPress={() =>
          router.push({ pathname: '(main)/(tabs)/home/details', params: { id: item._id } })
        }
        onToggleFavorite={() => dispatch(toggleWallpaperFavorite(item._id))}
        isFavorite={favorites.includes(item._id)}
      />
    ),
    [router, dispatch, favorites],
  );

  const keyExtractor = useCallback((item: Wallpaper) => item._id, []);

  const skeletonIds = useMemo(() => Array.from({ length: 6 }, (_, index) => index), []);

  const listData = useMemo(
    () => (status === 'loading' && !items.length ? [] : items),
    [items, status],
  );

  const showEmpty = !error && status !== 'loading' && items.length === 0;

  const header = (
    <View style={styles.header}>
      <View style={styles.headerIconContainer}>
        <MaterialCommunityIcons name="wallpaper" size={28} color={colors.white} />
      </View>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Aura Walls</Text>
      </View>
      <View style={styles.headerActionsContainer}>
        <Pressable onPress={() => {}} accessibilityLabel="Search wallpapers">
          <MaterialCommunityIcons name="magnify" size={24} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.root, isDark && { backgroundColor: colors.blackGray }]}>
      <LinearGradient
        colors={['rgba(70,87,175,0.35)', 'rgba(17,23,56,0.85)']}
        style={StyleSheet.absoluteFill}
      />
      {error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <Button
            title="Try again"
            style={{
              marginTop: 24,
              backgroundColor: colors.purple,
              borderRadius: 22,
              paddingHorizontal: 24,
              paddingVertical: 12,
            }}
            titleStyle={{ color: colors.white, fontFamily: fonts.semiBold, fontSize: 16 }}
            onPress={onRefresh}
          />
        </View>
      ) : showEmpty ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No wallpapers yet</Text>
          <Text style={styles.emptySubtitle}>
            Pull down to refresh and fetch the latest Zenith wallpapers.
          </Text>
          <Button
            title="Refresh"
            style={{
              marginTop: 24,
              backgroundColor: colors.purple,
              borderRadius: 22,
              paddingHorizontal: 24,
              paddingVertical: 12,
            }}
            titleStyle={{ color: colors.white, fontFamily: fonts.semiBold, fontSize: 16 }}
            onPress={onRefresh}
          />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={keyExtractor}
          numColumns={2}
          ListHeaderComponent={header}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              tintColor={colors.white}
              refreshing={status === 'refreshing'}
              onRefresh={onRefresh}
            />
          }
          ListFooterComponent={
            status === 'refreshing' ? <View style={styles.refreshAccent} /> : null
          }
        />
      )}
      {status === 'loading' && !items.length ? (
        <FlatList
          data={skeletonIds}
          keyExtractor={index => `sk-${index}`}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={[styles.listContent, { paddingTop: 24 }]}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={() => <WallpaperCardSkeleton />}
        />
      ) : null}
      <Pressable
        style={styles.floatingButton}
        onPress={() => setSheetOpen(true)}
        accessibilityLabel="Open favorites">
        <MaterialCommunityIcons name="star" size={24} color={colors.white} />
      </Pressable>
      <BottomSheet isOpen={isSheetOpen} onChange={index => index === -1 && setSheetOpen(false)}>
        <View style={{ padding: 24 }}>
          <Text
            style={{
              fontFamily: fonts.semiBold,
              fontSize: 18,
              color: colors.white,
              marginBottom: 16,
            }}>
            Favorites
          </Text>
          {favorites.length === 0 ? (
            <Text
              style={{ fontFamily: fonts.regular, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
              Save wallpapers you love to get started.
            </Text>
          ) : (
            favorites.map(id => {
              const item = items.find(w => w._id === id);
              if (!item) return null;
              return (
                <Button
                  key={id}
                  title={item.name}
                  onPress={() => {
                    setSheetOpen(false);
                    router.push({ pathname: '(main)/(tabs)/home/details', params: { id } });
                  }}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderRadius: 18,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    marginBottom: 12,
                  }}
                  titleStyle={{ color: colors.white, fontFamily: fonts.semiBold }}
                />
              );
            })
          )}
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
