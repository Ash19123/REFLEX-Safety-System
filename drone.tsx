import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Easing, Dimensions
} from 'react-native';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function DroneScreen() {
  const [dispatched, setDispatched] = useState(false);
  const [eta, setEta] = useState(180);
  const [selectedDrone, setSelectedDrone] = useState<number | null>(null);
  const scanAnim = useRef(new Animated.Value(0)).current;
  const droneX = useRef(new Animated.Value(0)).current;
  const droneY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();

    // Radar scan loop
    Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1, duration: 2000,
        easing: Easing.linear, useNativeDriver: true,
      })
    ).start();
  }, []);

  const dispatch = (index: number) => {
    setSelectedDrone(index);
    setDispatched(true);

    // Drone flies across radar
    Animated.parallel([
      Animated.timing(droneX, {
        toValue: 1, duration: 8000,
        easing: Easing.inOut(Easing.ease), useNativeDriver: false,
      }),
      Animated.timing(droneY, {
        toValue: 1, duration: 8000,
        easing: Easing.inOut(Easing.ease), useNativeDriver: false,
      }),
    ]).start();

    // Pulse while flying
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ])
    ).start();

    // ETA countdown
    const interval = setInterval(() => {
      setEta(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const formatEta = (s: number) => {
    if (s === 0) return 'ON SITE';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const scanRotate = scanAnim.interpolate({
    inputRange: [0, 1], outputRange: ['0deg', '360deg'],
  });

  const dronePosX = droneX.interpolate({
    inputRange: [0, 1], outputRange: [20, 140],
  });
  const dronePosY = droneY.interpolate({
    inputRange: [0, 0.5, 1], outputRange: [30, 10, 80],
  });

  const DRONES = [
    { name: 'Alpha Unit', dist: '0.8 km', battery: 87, status: 'STANDBY' },
    { name: 'Bravo Unit', dist: '1.4 km', battery: 72, status: 'STANDBY' },
    { name: 'Charlie Unit', dist: '2.1 km', battery: 94, status: 'PATROL' },
  ];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>DRONE COMMAND</Text>
          <View style={[styles.modePill, dispatched && styles.modePillActive]}>
            <Text style={styles.modePillText}>
              {dispatched ? (eta === 0 ? '🟢 ON SITE' : '🔵 EN ROUTE') : '⚪ STANDBY'}
            </Text>
          </View>
        </View>

        {/* ── RADAR MAP ── */}
        <View style={styles.radarContainer}>
          {/* Grid lines */}
          <View style={styles.radarGrid}>
            <View style={[styles.gridLine, styles.gridH]} />
            <View style={[styles.gridLine, styles.gridV]} />
          </View>

          {/* Concentric rings */}
          {[180, 130, 80, 40].map((size, i) => (
            <View key={i} style={[styles.radarRing, {
              width: size, height: size, borderRadius: size / 2,
              opacity: 0.1 + i * 0.08,
            }]} />
          ))}

          {/* Rotating scan line */}
          <Animated.View style={[styles.scanWrap, { transform: [{ rotate: scanRotate }] }]}>
            <View style={styles.scanLine} />
          </Animated.View>

          {/* User pin (center) */}
          <View style={styles.userPin}>
            <Animated.View style={[styles.userPingOuter, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.userPingInner} />
            <Text style={styles.userPinText}>📍</Text>
          </View>

          {/* Flying drone */}
          {dispatched && (
            <Animated.View style={[styles.droneMarker, { left: dronePosX, top: dronePosY }]}>
              <Text style={styles.droneMarkerIcon}>🚁</Text>
              {eta > 0 && (
                <View style={styles.etaBubble}>
                  <Text style={styles.etaBubbleText}>{formatEta(eta)}</Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* Corner labels */}
          <Text style={styles.radarLabel}>LIVE AERIAL</Text>
          <Text style={styles.radarCoords}>17.4126°N 78.4071°E</Text>
        </View>

        {/* ── ETA CARD (when dispatched) ── */}
        {dispatched && (
          <View style={styles.etaCard}>
            <View style={styles.etaLeft}>
              <Text style={styles.etaLabel}>ETA</Text>
              <Text style={styles.etaValue}>{formatEta(eta)}</Text>
            </View>
            <View style={styles.etaMiddle}>
              <Text style={styles.etaDroneName}>
                {DRONES[selectedDrone!].name}
              </Text>
              <Text style={styles.etaStatus}>
                {eta === 0
                  ? '✅ Drone has arrived on site'
                  : '🚁 Flying to your location...'}
              </Text>
            </View>
            <Text style={styles.etaIcon}>{eta === 0 ? '✅' : '🚁'}</Text>
          </View>
        )}

        {/* ── DRONE LIST ── */}
        <Text style={styles.sectionTitle}>AVAILABLE DRONES</Text>

        {DRONES.map((drone, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.droneCard,
              selectedDrone === i && styles.droneCardSelected,
              drone.status === 'PATROL' && styles.droneCardBusy,
            ]}
            onPress={() => drone.status === 'STANDBY' && !dispatched && dispatch(i)}
            activeOpacity={drone.status === 'STANDBY' ? 0.7 : 1}
          >
            {/* Icon */}
            <View style={[styles.droneIconWrap,
              selectedDrone === i ? styles.droneIconActive : styles.droneIconDefault
            ]}>
              <Text style={styles.droneEmoji}>🚁</Text>
            </View>

            {/* Info */}
            <View style={styles.droneInfo}>
              <View style={styles.droneRow}>
                <Text style={styles.droneName}>{drone.name}</Text>
                <View style={[styles.statusPill,
                  drone.status === 'PATROL' ? styles.statusBusy : styles.statusReady
                ]}>
                  <Text style={styles.statusPillText}>{drone.status}</Text>
                </View>
              </View>
              <Text style={styles.droneMeta}>
                {drone.dist} away · 🔋 {drone.battery}% · 📷 Camera
              </Text>
            </View>

            {/* Arrow / Check */}
            {selectedDrone === i
              ? <Text style={styles.checkIcon}>✓</Text>
              : drone.status === 'STANDBY' && !dispatched
              ? <Text style={styles.arrowIcon}>›</Text>
              : null
            }
          </TouchableOpacity>
        ))}

        {/* ── CAPABILITIES ── */}
        <Text style={styles.sectionTitle}>SURVEILLANCE HUB</Text>
        <View style={styles.capsGrid}>
          {[
            { icon: '🎙️', label: 'Scream Detection', on: true },
            { icon: '👁️', label: 'Threat Analysis', on: true },
            { icon: '⚡', label: 'Assault Detection', on: true },
            { icon: '📡', label: 'Live Feed', on: dispatched },
          ].map((cap, i) => (
            <View key={i} style={[styles.capCard, cap.on && styles.capCardOn]}>
              <Text style={styles.capIcon}>{cap.icon}</Text>
              <Text style={[styles.capLabel, cap.on && styles.capLabelOn]}>{cap.label}</Text>
              <Text style={styles.capStatus}>{cap.on ? '✅' : '⏸'}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080808' },
  scroll: { paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: { padding: 8 },
  backText: { color: '#00E5FF', fontWeight: '600', fontSize: 14 },
  title: {
    color: '#FFF', fontWeight: '800',
    fontSize: 15, letterSpacing: 2,
  },
  modePill: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20, paddingHorizontal: 12,
    paddingVertical: 5, borderWidth: 1,
    borderColor: '#333',
  },
  modePillActive: {
    backgroundColor: '#001A2A',
    borderColor: '#00E5FF',
  },
  modePillText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  // Radar
  radarContainer: {
    height: 220,
    backgroundColor: '#020D10',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderColor: '#00E5FF15',
    overflow: 'hidden',
    marginBottom: 16,
  },
  radarGrid: {
    position: 'absolute',
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#00E5FF08',
  },
  gridH: { width: '100%', height: 1 },
  gridV: { width: 1, height: '100%' },
  radarRing: {
    position: 'absolute',
    borderWidth: 1, borderColor: '#00E5FF',
  },
  scanWrap: {
    position: 'absolute',
    width: 90, height: 1,
    left: '50%', top: '50%',
  },
  scanLine: {
    width: 90, height: 1,
    backgroundColor: '#00E5FF',
    opacity: 0.6,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  userPin: {
    position: 'absolute',
    alignItems: 'center', justifyContent: 'center',
  },
  userPingOuter: {
    position: 'absolute',
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: '#FF2D2D',
    backgroundColor: '#FF2D2D10',
  },
  userPingInner: {
    position: 'absolute',
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#FF2D2D30',
  },
  userPinText: { fontSize: 22, zIndex: 2 },
  droneMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  droneMarkerIcon: { fontSize: 26 },
  etaBubble: {
    backgroundColor: '#00E5FF',
    borderRadius: 6, paddingHorizontal: 5,
    paddingVertical: 2, marginTop: 2,
  },
  etaBubbleText: { color: '#000', fontSize: 9, fontWeight: '800' },
  radarLabel: {
    position: 'absolute', top: 10, left: 14,
    color: '#00E5FF', fontSize: 9,
    fontWeight: '700', letterSpacing: 2,
  },
  radarCoords: {
    position: 'absolute', bottom: 10, right: 14,
    color: '#00E5FF50', fontSize: 9,
    fontFamily: 'monospace',
  },

  // ETA Card
  etaCard: {
    flexDirection: 'row',
    backgroundColor: '#001520',
    borderRadius: 16, padding: 16,
    marginHorizontal: 20, marginBottom: 20,
    borderWidth: 1, borderColor: '#00E5FF',
    alignItems: 'center', gap: 14,
  },
  etaLeft: { alignItems: 'center', minWidth: 52 },
  etaLabel: { color: '#00E5FF', fontSize: 9, fontWeight: '700', letterSpacing: 2 },
  etaValue: { color: '#00E5FF', fontWeight: '900', fontSize: 26 },
  etaMiddle: { flex: 1 },
  etaDroneName: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  etaStatus: { color: '#555', fontSize: 12, marginTop: 3 },
  etaIcon: { fontSize: 26 },

  // Section title
  sectionTitle: {
    fontSize: 11, fontWeight: '700',
    color: '#444', letterSpacing: 2,
    marginBottom: 10, marginHorizontal: 20,
  },

  // Drone cards
  droneCard: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    alignItems: 'center',
    gap: 12,
  },
  droneCardSelected: {
    borderColor: '#00E5FF',
    backgroundColor: '#001520',
  },
  droneCardBusy: { opacity: 0.45 },
  droneIconWrap: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
  },
  droneIconDefault: { backgroundColor: '#1A1A1A' },
  droneIconActive: { backgroundColor: '#002030' },
  droneEmoji: { fontSize: 26 },
  droneInfo: { flex: 1, gap: 4 },
  droneRow: {
    flexDirection: 'row',
    alignItems: 'center', gap: 8,
  },
  droneName: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  statusPill: {
    borderRadius: 20, paddingHorizontal: 8,
    paddingVertical: 2, borderWidth: 1,
  },
  statusReady: {
    backgroundColor: '#0D2A0D',
    borderColor: '#00E676',
  },
  statusBusy: {
    backgroundColor: '#1A1000',
    borderColor: '#FFB300',
  },
  statusPillText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  droneMeta: { color: '#555', fontSize: 12 },
  checkIcon: { color: '#00E5FF', fontSize: 20, fontWeight: '900' },
  arrowIcon: { color: '#444', fontSize: 28, fontWeight: '200' },

  // Capabilities
  capsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 10, paddingHorizontal: 20,
  },
  capCard: {
    width: (width - 50) / 2,
    backgroundColor: '#111',
    borderRadius: 14, padding: 14,
    gap: 6, borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  capCardOn: {
    borderColor: '#00E67620',
    backgroundColor: '#0A140A',
  },
  capIcon: { fontSize: 22 },
  capLabel: { color: '#555', fontSize: 12, flex: 1 },
  capLabelOn: { color: '#CCC' },
  capStatus: { fontSize: 14 },
});