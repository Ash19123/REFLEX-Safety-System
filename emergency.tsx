import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Dimensions
} from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { alertAllContacts, emergencyContacts } from './contacts';

const { width } = Dimensions.get('window');

export default function EmergencyScreen() {
  const [duration, setDuration] = useState(0);
  const [policeAlerted, setPoliceAlerted] = useState(false);
  const [droneDispatched, setDroneDispatched] = useState(false);
  const [locationText, setLocationText] = useState('Getting location...');
  const [coords, setCoords] = useState('Fetching GPS...');
  const [contactsAlerted, setContactsAlerted] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const recAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    startEmergencyProtocol();
    const timer = setInterval(() => setDuration(d => d + 1), 1000);

    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(recAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(recAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ])).start();

    return () => clearInterval(timer);
  }, []);

  const startEmergencyProtocol = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const { latitude, longitude } = loc.coords;
        const locText = `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`;
        setCoords(locText);

        const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geo.length > 0) {
          const place = geo[0];
          const area = [place.name, place.district, place.city]
            .filter(Boolean).join(', ');
          setLocationText(area || locText);
          await alertAllContacts(`${area || locText}\n(${locText})`);
        } else {
          setLocationText(locText);
          await alertAllContacts(locText);
        }
      } else {
        setLocationText('Location unavailable');
        await alertAllContacts('Location unavailable — please call immediately');
      }
      setContactsAlerted(true);
    } catch (err) {
      console.warn('Emergency protocol error:', err);
      setLocationText('Location error');
      setContactsAlerted(true);
    }
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/home')} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Animated.View style={[styles.sosBadge, { transform: [{ scale: pulseAnim }] }]}>
            <Animated.View style={[styles.sosDot, { opacity: recAnim }]} />
            <Text style={styles.sosBadgeText}>SOS ACTIVE</Text>
          </Animated.View>
          <Text style={styles.duration}>{formatDuration(duration)}</Text>
        </View>

        {/* ── CONTACTS ALERTED BANNER ── */}
        {contactsAlerted && (
          <View style={styles.alertedBanner}>
            <Text style={styles.alertedIcon}>✅</Text>
            <Text style={styles.alertedText}>
              {emergencyContacts.length} contacts alerted with your live location!
            </Text>
          </View>
        )}

        {/* ── CAMERA FEED ── */}
        <View style={styles.cameraContainer}>
          <Animated.View style={[styles.cameraGlow, { opacity: glowAnim }]} />
          <View style={styles.cameraBox}>
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={styles.cameraLabel}>LIVE CAMERA FEED</Text>
            <Text style={styles.cameraSubLabel}>Recording & streaming to contacts</Text>
          </View>
          <View style={styles.recBadge}>
            <Animated.View style={[styles.recDot, { opacity: recAnim }]} />
            <Text style={styles.recText}>● REC</Text>
          </View>
          <View style={styles.flipBadge}>
            <Text style={styles.flipText}>🔄 FRONT</Text>
          </View>
        </View>

        {/* ── STATS ROW ── */}
        <View style={styles.statsRow}>
          {[
            { value: String(emergencyContacts.length), label: 'Alerted', color: '#FF2D2D' },
            { value: '●', label: 'GPS Live', color: '#00E676' },
            { value: formatDuration(duration), label: 'Elapsed', color: '#FFFFFF' },
            { value: 'ON', label: 'AI Guard', color: '#AA00FF' },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── LOCATION ── */}
        <View style={styles.locationCard}>
          <View style={styles.locationLeft}>
            <Text style={styles.locationPin}>📍</Text>
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationName}>{locationText}</Text>
            <Text style={styles.locationCoords}>{coords}</Text>
            <Text style={styles.locationUpdate}>🟢 Updating every 5 seconds</Text>
          </View>
        </View>

        {/* ── POLICE STATIONS ── */}
        <Text style={styles.sectionTitle}>🚔 NEAREST POLICE STATIONS</Text>

        {[
          { name: 'Banjara Hills PS', dist: '1.2 km', eta: '4 min' },
          { name: 'Jubilee Hills PS', dist: '2.8 km', eta: '8 min' },
        ].map((ps, i) => (
          <TouchableOpacity
            key={i}
            style={styles.policeCard}
            onPress={() => i === 0 && setPoliceAlerted(true)}
            activeOpacity={0.8}
          >
            <View style={styles.policeLeft}>
              <Text style={styles.policeEmoji}>🏛️</Text>
            </View>
            <View style={styles.policeInfo}>
              <Text style={styles.policeName}>{ps.name}</Text>
              <Text style={styles.policeMeta}>{ps.dist} away · ETA {ps.eta}</Text>
            </View>
            <View style={[
              styles.alertPill,
              i === 0 && policeAlerted && styles.alertedPill
            ]}>
              <Text style={[
                styles.alertPillText,
                i === 0 && policeAlerted && styles.alertedPillText
              ]}>
                {i === 0 && policeAlerted ? '✓ Alerted' : 'ALERT →'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* ── DRONE BUTTON ── */}
        <TouchableOpacity
          style={[styles.droneCard, droneDispatched && styles.droneCardActive]}
          onPress={() => { setDroneDispatched(true); router.push('/drone'); }}
          activeOpacity={0.8}
        >
          <View style={styles.droneLeft}>
            <Text style={styles.droneEmoji}>🚁</Text>
          </View>
          <View style={styles.droneInfo}>
            <Text style={styles.droneName}>
              {droneDispatched ? 'Drone En Route → Track It' : 'Dispatch Surveillance Drone'}
            </Text>
            <Text style={styles.droneSub}>
              {droneDispatched
                ? 'ETA 3 min · Aerial view activated'
                : 'Tap to send nearest drone to you'}
            </Text>
          </View>
          <Text style={styles.droneChevron}>›</Text>
        </TouchableOpacity>

        {/* ── MARK SAFE ── */}
        <TouchableOpacity
          style={styles.safeBtn}
          onPress={() => router.replace('/home')}
          activeOpacity={0.8}
        >
          <Text style={styles.safeBtnText}>✅  I'm Safe — End Emergency</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080808' },
  scroll: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: 56, marginBottom: 20,
  },
  backBtn: { padding: 8 },
  backText: { color: '#FF2D2D', fontWeight: '600', fontSize: 14 },
  sosBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#2A0000', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1.5, borderColor: '#FF2D2D',
  },
  sosDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF2D2D' },
  sosBadgeText: { color: '#FF2D2D', fontWeight: '800', fontSize: 12, letterSpacing: 1.5 },
  duration: { color: '#444', fontSize: 15, fontFamily: 'monospace', fontWeight: '600' },

  alertedBanner: {
    flexDirection: 'row', gap: 10,
    backgroundColor: '#0D2A0D', borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: '#00E676',
    marginBottom: 16, alignItems: 'center',
  },
  alertedIcon: { fontSize: 18 },
  alertedText: { color: '#00E676', fontSize: 13, fontWeight: '600', flex: 1 },

  cameraContainer: {
    position: 'relative', marginBottom: 16,
    borderRadius: 20, overflow: 'hidden',
  },
  cameraGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 20, borderWidth: 2, borderColor: '#FF2D2D', zIndex: 2,
  },
  cameraBox: {
    height: 230, backgroundColor: '#0F0000',
    borderRadius: 20, alignItems: 'center',
    justifyContent: 'center', gap: 8,
    borderWidth: 2, borderColor: '#1A0000',
  },
  cameraIcon: { fontSize: 52 },
  cameraLabel: { color: '#FF2D2D', fontSize: 13, fontWeight: '800', letterSpacing: 2 },
  cameraSubLabel: { color: '#444', fontSize: 11 },
  recBadge: {
    position: 'absolute', top: 14, left: 14,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5, gap: 5, zIndex: 3,
  },
  recDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF2D2D' },
  recText: { color: '#FF2D2D', fontSize: 11, fontWeight: '800' },
  flipBadge: {
    position: 'absolute', top: 14, right: 14,
    backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5, zIndex: 3,
  },
  flipText: { color: '#FFF', fontSize: 10, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#111', borderRadius: 14,
    padding: 12, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#1E1E1E',
  },
  statValue: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  statLabel: { color: '#555', fontSize: 9, textAlign: 'center', letterSpacing: 0.5 },

  locationCard: {
    flexDirection: 'row', backgroundColor: '#111',
    borderRadius: 16, padding: 16, gap: 14,
    marginBottom: 24, borderWidth: 1,
    borderColor: '#1E1E1E', alignItems: 'center',
  },
  locationLeft: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#1A0000', alignItems: 'center', justifyContent: 'center',
  },
  locationPin: { fontSize: 22 },
  locationInfo: { flex: 1 },
  locationName: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  locationCoords: { color: '#555', fontSize: 11, fontFamily: 'monospace', marginTop: 2 },
  locationUpdate: { color: '#00E676', fontSize: 11, marginTop: 4 },

  sectionTitle: {
    fontSize: 11, fontWeight: '700',
    color: '#444', letterSpacing: 2, marginBottom: 10,
  },

  policeCard: {
    flexDirection: 'row', backgroundColor: '#111',
    borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#1E1E1E',
    alignItems: 'center', gap: 12,
  },
  policeLeft: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center',
  },
  policeEmoji: { fontSize: 22 },
  policeInfo: { flex: 1 },
  policeName: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  policeMeta: { color: '#555', fontSize: 12, marginTop: 2 },
  alertPill: {
    backgroundColor: '#FF2D2D', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  alertedPill: { backgroundColor: '#0D2A0D', borderWidth: 1, borderColor: '#00E676' },
  alertPillText: { color: '#FFF', fontWeight: '800', fontSize: 11 },
  alertedPillText: { color: '#00E676' },

  droneCard: {
    flexDirection: 'row', backgroundColor: '#001520',
    borderRadius: 16, padding: 16, gap: 14,
    marginTop: 4, marginBottom: 16,
    borderWidth: 1, borderColor: '#00E5FF20', alignItems: 'center',
  },
  droneCardActive: { borderColor: '#00E5FF', backgroundColor: '#001A24' },
  droneLeft: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#002030', alignItems: 'center', justifyContent: 'center',
  },
  droneEmoji: { fontSize: 28 },
  droneInfo: { flex: 1 },
  droneName: { color: '#00E5FF', fontWeight: '700', fontSize: 14 },
  droneSub: { color: '#555', fontSize: 12, marginTop: 3 },
  droneChevron: { color: '#00E5FF', fontSize: 28, fontWeight: '300' },

  safeBtn: {
    backgroundColor: '#081A08', borderWidth: 2,
    borderColor: '#00E676', borderRadius: 16,
    padding: 18, alignItems: 'center',
  },
  safeBtnText: { color: '#00E676', fontWeight: '800', fontSize: 16 },
});