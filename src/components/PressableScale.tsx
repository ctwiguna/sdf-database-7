import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { motion } from '../theme';
import { useReduceMotion } from '../lib/useReduceMotion';

type Props = PressableProps & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  dimTo?: number;
  children: React.ReactNode;
};

export function PressableScale({ scaleTo = 0.97, dimTo = 0.94, style, children, ...rest }: Props) {
  const pressed = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotion();

  const handlePressIn = () => {
    Animated.timing(pressed, {
      toValue: 1,
      duration: motion.duration.press,
      easing: motion.easing.out,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(pressed, {
      toValue: 0,
      duration: motion.duration.fast,
      easing: motion.easing.out,
      useNativeDriver: true,
    }).start();
  };

  const scale = pressed.interpolate({ inputRange: [0, 1], outputRange: [1, reduceMotion ? 1 : scaleTo] });
  const opacity = pressed.interpolate({ inputRange: [0, 1], outputRange: [1, dimTo] });

  return (
    <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>
      {children}
      <Pressable style={StyleSheet.absoluteFill} onPressIn={handlePressIn} onPressOut={handlePressOut} {...rest} />
    </Animated.View>
  );
}
