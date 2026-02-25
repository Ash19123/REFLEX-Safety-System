import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Easing, Vibration, Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { Accelerometer } from 'expo-sensors';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [shakeCount, setShakeCount] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const flashAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastShakeTime = useRef(0);
  const shakeTimestamps = useRef<number[]>([]);

  useEffect(() => {
    // SOS button pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06, duration: 1500,
          easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1, duration: 1500,
          easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
      ])
    ).start();

    // Shake detection
    Accelerometer.setUpdateInterval(100);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const force = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (force > 1.8 && now - lastShakeTime.current > 400) {
        lastShakeTime.current = now;

        // Keep only shakes within last 3 seconds
        shakeTimestamps.current = [
          ...shakeTimestamps.current.filter(t => now - t < 3000),
          now,
        ];

        const count = shakeTimestamps.current.length;
        setShakeCount(count);

        // Animate the shake dots
        const dotIndex = Math.min(count - 1, 2);
        Animated.sequence([
          Animated.timing(shakeAnims[dotIndex], { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(shakeAnims[dotIndex], { toValue: 0.6, duration: 150, useNativeDriver: true }),
        ]).start();

        if (count >= 3) {
          shakeTimestamps.current = [];
          setShakeCount(0);
          triggerFlash();
          startCountdown();
        }
      }
    });

    return () => sub.remove();
  }, []);

  const triggerFlash = () => {
    Vibration.vibrate([100, 100, 100, 100, 300]);
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  const startCountdown = () => {
    if (countdownRef.current) return;
    setCountdown(5);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownRef.current!);
          countdownRef.current = null;
          router.push('/emergency');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
    setShakeCount(0);
  };

  return (
    <View style={styles.container}>

      {/* Red flash overlay */}
      <Animated.View
        pointerEvents="none"
        style={[styles.flashOverlay, { opacity: flashAnim }]}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>REFLEX ACTIVE</Text>
          </View>
          <Text style={styles.menuIcon}>⚙️</Text>
        </View>

        {/* Greeting */}
        <Text style={styles.greeting}>Hey, stay safe 👋</Text>
        <Text style={styles.greetingSub}>Shake your phone 3x to trigger SOS</Text>

        {/* ── SOS BUTTON or COUNTDOWN ── */}
        {countdown === null ? (
          <TouchableOpacity onPress={startCountdown} activeOpacity={0.85}>
            <Animated.View style={[styles.sosOuter, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.sosMiddle}>
                <View style={styles.sosButton}>
                  <Text style={styles.sosEmoji}>🆘</Text>
                  <Text style={styles.sosLabel}>SOS</Text>
                  <Text style={styles.sosSub}>TAP OR SHAKE</Text>
                </View>
              </View>
            </Animated.View>
          </TouchableOpacity>
        ) : (
          <View style={styles.countdownWrap}>
            <View style={styles.countdownRing}>
              <Text style={styles.countdownNum}>{countdown}</Text>
              <Text style={styles.countdownLabel}>Triggering SOS...</Text>
            </View>
            <TouchableOpacity style={styles.cancelBtn} onPress={cancelCountdown}>
              <Text style={styles.cancelText}>✕  Cancel — I'm Safe</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Shake indicator dots */}
        <View style={styles.shakeRow}>
          {[0, 1, 2].map(i => (
            <Animated.View
              key={i}
              style={[
                styles.shakeDot,
                shakeCount > i && styles.shakeDotActive,
                { transform: [{ scale: shakeAnims[i].interpolate({
                  inputRange: [0, 1], outputRange: [1, 1.4]
                }) }] }
              ]}
            />
          ))}
          <Text style={styles.shakeLabel}>
            {shakeCount > 0 ? `${shakeCount}/3 shakes` : 'Shake to activate'}
          </Text>
        </View>

        {/* AI Monitor Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🤖 AI Monitoring</Text>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>🎙️ Scream Detection</Text>
            <Text style={styles.cardStatus}>✅ Active</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>👁️ Threat Analysis</Text>
            <Text style={styles.cardStatus}>✅ Clear</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>📍 GPS Tracking</Text>
            <Text style={styles.cardStatus}>🟢 Live</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.actionsGrid}>
          {[
            { icon: '🚁', label: 'Drone Dispatch', route: '/drone' },
            { icon: '🚔', label: 'Nearest Police', route: '/emergency' },
            { icon: '📞', label: 'Emergency Call', route: null },
            { icon: '👥', label: 'My Contacts', route: '/contacts' },
          ].map((action, i) => (
            <TouchableOpacity
              key={i}
              style={styles.actionCard}
              onPress={() => action.route && router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080808' },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FF2D2D',
    zIndex: 999,
  },
  scroll: { padding: 20, paddingBottom: 60 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56, marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#141414', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    gap: 8, borderWidth: 1, borderColor: '#2A2A2A',
  },
  statusDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#00E676',
  },
  statusText: {
    color: '#FFF', fontSize: 12,
    fontWeight: '700', letterSpacing: 1.5,
  },
  menuIcon: { fontSize: 22 },

  // Greeting
  greeting: {
    fontSize: 28, fontWeight: '800',
    color: '#FFF', marginBottom: 4,
  },
  greetingSub: {
    fontSize: 14, color: '#555', marginBottom: 32,
  },

  // SOS rings
  sosOuter: {
    alignSelf: 'center',
    width: 230, height: 230, borderRadius: 115,
    borderWidth: 1.5, borderColor: '#FF2D2D30',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#FF2D2D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 30, elevation: 20,
  },
  sosMiddle: {
    width: 190, height: 190, borderRadius: 95,
    borderWidth: 1.5, borderColor: '#FF2D2D60',
    alignItems: 'center', justifyContent: 'center',
  },
  sosButton: {
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: '#FF2D2D',
    alignItems: 'center', justifyContent: 'center',
    gap: 2,
    shadowColor: '#FF2D2D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 20, elevation: 20,
  },
  sosEmoji: { fontSize: 36 },
  sosLabel: {
    fontSize: 28, fontWeight: '900',
    color: '#FFF', letterSpacing: 4,
  },
  sosSub: {
    fontSize: 8, color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
  },

  // Countdown
  countdownWrap: {
    alignItems: 'center', gap: 20,
    marginVertical: 20,
  },
  countdownRing: {
    width: 190, height: 190, borderRadius: 95,
    borderWidth: 3, borderColor: '#FFB300',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FFB300',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 20, elevation: 20,
  },
  countdownNum: {
    fontSize: 80, fontWeight: '900', color: '#FFB300',
  },
  countdownLabel: {
    fontSize: 12, color: '#FFB300', letterSpacing: 1,
  },
  cancelBtn: {
    backgroundColor: '#141414',
    borderRadius: 12, paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  cancelText: {
    color: '#FFF', fontWeight: '700', fontSize: 15,
  },

  // Shake dots
  shakeRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    marginBottom: 28,
  },
  shakeDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#222', borderWidth: 1,
    borderColor: '#444',
  },
  shakeDotActive: {
    backgroundColor: '#FF2D2D',
    borderColor: '#FF2D2D',
    shadowColor: '#FF2D2D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 6, elevation: 6,
  },
  shakeLabel: {
    color: '#444', fontSize: 12, letterSpacing: 1,
  },

  // AI Card
  card: {
    backgroundColor: '#111', borderRadius: 16,
    padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: '#1E1E1E', gap: 12,
  },
  cardTitle: {
    color: '#AA00FF', fontWeight: '700',
    fontSize: 13, letterSpacing: 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  cardLabel: { color: '#666', fontSize: 13 },
  cardStatus: { color: '#666', fontSize: 12 },

  // Actions
  sectionTitle: {
    fontSize: 11, fontWeight: '700',
    color: '#444', letterSpacing: 2, marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  actionCard: {
    width: (width - 52) / 2,
    backgroundColor: '#111', borderRadius: 16,
    padding: 16, gap: 8,
    borderWidth: 1, borderColor: '#1E1E1E',
  },
  actionIcon: { fontSize: 28 },
  actionLabel: {
    color: '#666', fontSize: 13, fontWeight: '600',
  },
});