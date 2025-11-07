import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const shimmerColors = ['#1b1f2b', '#22283a', '#1b1f2b'];

function WallpaperCardSkeleton() {
  return (
    <View style={styles.card}>
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        colors={shimmerColors}
        style={styles.shimmer}
      />
    </View>
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
    backgroundColor: '#161924',
  },
  shimmer: {
    flex: 1,
  },
});

export default memo(WallpaperCardSkeleton);
