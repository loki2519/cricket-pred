import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';

const NUM_BARS = 12;

/**
 * Single-master-value spinner — no desync ever.
 *
 * One Animated.Value goes 0→1 (looping, linear, 1200ms).
 * Each bar's opacity is derived via interpolation:
 *   - max brightness when the "cursor" reaches that bar
 *   - fades out linearly as the cursor passes it
 * Direction: clockwise (bar 0 → 1 → 2 … 11 → 0 …)
 */
const AppleSpinner = ({ size, color = '#ff7a00', style }) => {
  const master = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(master, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [master]);

  // Build interpolated opacity for bar i
  // The cursor moves 0→1 across one revolution.
  // Bar i is "at" phase = i/NUM_BARS.
  // opacity = 1 when cursor is exactly at bar i, fades to ~0 by next cycle.
  const makeOpacity = (barIndex) => {
    const pts = NUM_BARS + 1; // 13 control points (0 … 12/12=1)
    const inputRange  = [];
    const outputRange = [];

    for (let s = 0; s < pts; s++) {
      const phase = s / NUM_BARS;
      inputRange.push(phase);

      // How many steps has the cursor moved PAST bar i?
      // (wrap-around so the fade is continuous across the 0/1 boundary)
      const dist = ((s - barIndex) + NUM_BARS) % NUM_BARS;
      // dist=0 → opacity 1 (freshly lit), dist=NUM_BARS-1 → opacity ~0
      outputRange.push(parseFloat((1 - dist / NUM_BARS).toFixed(4)));
    }

    return master.interpolate({ inputRange, outputRange });
  };

  // Fixed 28px container, 11px tall × 4px wide spokes
  const dim    = 28;
  const barH   = 9;
  const barW   = 4;
  const barTop = 2;
  const radius = dim / 2;

  return (
    <View style={[{ width: dim, height: dim, alignSelf: 'center' }, style]}>
      {Array.from({ length: NUM_BARS }).map((_, i) => {
        const angleDeg = i * (360 / NUM_BARS); // 0, 30, 60 … 330
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              width: barW,
              height: barH,
              left: radius - barW / 2,
              top: barTop,
              borderRadius: barW / 2,
              backgroundColor: color,
              opacity: makeOpacity(i),
              transform: [
                { translateY: radius - barTop },
                { rotate: `${angleDeg}deg` },
                { translateY: -(radius - barTop) },
              ],
            }}
          />
        );
      })}
    </View>
  );
};

export default AppleSpinner;
