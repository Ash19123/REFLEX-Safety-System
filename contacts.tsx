import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Alert, Animated
} from 'react-native';
import { router } from 'expo-router';
import * as SMS from 'expo-sms';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

// Global contacts store (in production use AsyncStorage)
export let emergencyContacts: Contact[] = [
  { id: '1', name: 'Mom', phone: '+91 99999 00001', relationship: 'Mother' },
  { id: '2', name: 'Riya', phone: '+91 99999 00002', relationship: 'Best Friend' },
];

export function getContacts() { return emergencyContacts; }

export async function alertAllContacts(locationText: string) {
  const isAvailable = await SMS.isAvailableAsync();
  if (!isAvailable) return;

  const phones = emergencyContacts.map(c => c.phone);
  if (phones.length === 0) return;

  const message = `🚨 EMERGENCY ALERT!\n\n${emergencyContacts[0]?.name ?? 'Your contact'} has triggered SOS on REFLEX.\n\n📍 Location: ${locationText}\n\nPlease respond immediately or call them now!`;

  await SMS.sendSMSAsync(phones, message);
}

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>(emergencyContacts);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');

  const addContact = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Required', 'Please enter name and phone number');
      return;
    }
    if (contacts.length >= 5) {
      Alert.alert('Max 5 contacts', 'Remove a contact before adding a new one');
      return;
    }
    const newContact: Contact = {
      id: String(Date.now()),
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship.trim() || 'Contact',
    };
    const updated = [...contacts, newContact];
    setContacts(updated);
    emergencyContacts = updated;
    setName(''); setPhone(''); setRelationship('');
    setShowForm(false);
  };

  const removeContact = (id: string) => {
    Alert.alert('Remove Contact', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: () => {
          const updated = contacts.filter(c => c.id !== id);
          setContacts(updated);
          emergencyContacts = updated;
        }
      }
    ]);
  };

  const testAlert = async () => {
    Alert.alert(
      '📱 Test Alert',
      `This will send a TEST SMS to all ${contacts.length} contacts. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Test', onPress: async () => {
            await alertAllContacts('TEST - Banjara Hills, Hyderabad (17.4126° N, 78.4071° E)');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>EMERGENCY CONTACTS</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            These people get an instant SMS with your live location the moment you trigger SOS
          </Text>
        </View>

        {/* Contacts list */}
        <Text style={styles.sectionTitle}>YOUR TRUSTED CIRCLE ({contacts.length}/5)</Text>

        {contacts.map((contact, i) => (
          <View key={contact.id} style={styles.contactCard}>
            {/* Avatar */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{contact.name[0].toUpperCase()}</Text>
            </View>

            {/* Info */}
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactPhone}>{contact.phone}</Text>
              <View style={styles.relPill}>
                <Text style={styles.relText}>{contact.relationship}</Text>
              </View>
            </View>

            {/* Priority badge */}
            {i === 0 && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryText}>PRIMARY</Text>
              </View>
            )}

            {/* Remove */}
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeContact(contact.id)}
            >
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add contact form */}
        {showForm ? (
          <View style={styles.form}>
            <Text style={styles.formTitle}>➕ Add New Contact</Text>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Mom, Best Friend"
              placeholderTextColor="#444"
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 98765 43210"
              placeholderTextColor="#444"
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Relationship</Text>
            <TextInput
              style={styles.input}
              value={relationship}
              onChangeText={setRelationship}
              placeholder="e.g. Mother, Best Friend, Brother"
              placeholderTextColor="#444"
            />

            <View style={styles.formBtns}>
              <TouchableOpacity
                style={styles.cancelFormBtn}
                onPress={() => setShowForm(false)}
              >
                <Text style={styles.cancelFormText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addContact}>
                <Text style={styles.saveBtnText}>Save Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          contacts.length < 5 && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowForm(true)}
            >
              <Text style={styles.addBtnText}>+ Add Emergency Contact</Text>
            </TouchableOpacity>
          )
        )}

        {/* Test SMS button */}
        {contacts.length > 0 && (
          <TouchableOpacity style={styles.testBtn} onPress={testAlert}>
            <Text style={styles.testBtnIcon}>📱</Text>
            <View>
              <Text style={styles.testBtnTitle}>Test Alert SMS</Text>
              <Text style={styles.testBtnSub}>Send a test message to all contacts</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* What contacts receive */}
        <Text style={styles.sectionTitle}>WHAT THEY RECEIVE</Text>
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewHeaderText}>📱 SMS Message Preview</Text>
          </View>
          <View style={styles.previewBody}>
            <Text style={styles.previewText}>
              🚨 EMERGENCY ALERT!{'\n\n'}
              Your contact has triggered SOS on REFLEX.{'\n\n'}
              📍 Location: Banjara Hills, Hyderabad{'\n'}
              (17.4126° N, 78.4071° E){'\n\n'}
              Please respond immediately or call them now!
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080808' },
  scroll: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56, marginBottom: 20,
  },
  backBtn: { padding: 8 },
  backText: { color: '#FF2D2D', fontWeight: '600', fontSize: 14 },
  title: {
    color: '#FFF', fontWeight: '800',
    fontSize: 13, letterSpacing: 1.5,
  },

  infoBanner: {
    flexDirection: 'row', gap: 12,
    backgroundColor: '#001A2A',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#00E5FF20',
    marginBottom: 24, alignItems: 'flex-start',
  },
  infoIcon: { fontSize: 20 },
  infoText: { color: '#888', fontSize: 13, lineHeight: 20, flex: 1 },

  sectionTitle: {
    fontSize: 11, fontWeight: '700',
    color: '#444', letterSpacing: 2, marginBottom: 12,
  },

  contactCard: {
    flexDirection: 'row', backgroundColor: '#111',
    borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#1E1E1E',
    alignItems: 'center', gap: 12,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#FF2D2D20',
    borderWidth: 1.5, borderColor: '#FF2D2D',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    color: '#FF2D2D', fontWeight: '800', fontSize: 20,
  },
  contactInfo: { flex: 1, gap: 4 },
  contactName: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  contactPhone: { color: '#555', fontSize: 12, fontFamily: 'monospace' },
  relPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#1A1A1A',
    borderRadius: 20, paddingHorizontal: 8,
    paddingVertical: 2, marginTop: 2,
  },
  relText: { color: '#666', fontSize: 10 },
  primaryBadge: {
    backgroundColor: '#FF2D2D20',
    borderRadius: 20, paddingHorizontal: 8,
    paddingVertical: 4, borderWidth: 1,
    borderColor: '#FF2D2D',
  },
  primaryText: { color: '#FF2D2D', fontSize: 9, fontWeight: '800' },
  removeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#1A1A1A',
    alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { color: '#555', fontSize: 14 },

  addBtn: {
    borderWidth: 1.5, borderColor: '#FF2D2D',
    borderStyle: 'dashed', borderRadius: 16,
    padding: 16, alignItems: 'center', marginBottom: 16,
  },
  addBtnText: { color: '#FF2D2D', fontWeight: '700', fontSize: 14 },

  form: {
    backgroundColor: '#111', borderRadius: 16,
    padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#2A2A2A', gap: 8,
  },
  formTitle: { color: '#FFF', fontWeight: '700', fontSize: 15, marginBottom: 4 },
  inputLabel: { color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  input: {
    backgroundColor: '#1A1A1A', borderRadius: 10,
    padding: 12, color: '#FFF', fontSize: 14,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  formBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelFormBtn: {
    flex: 1, backgroundColor: '#1A1A1A',
    borderRadius: 10, padding: 12,
    alignItems: 'center', borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cancelFormText: { color: '#666', fontWeight: '600' },
  saveBtn: {
    flex: 1, backgroundColor: '#FF2D2D',
    borderRadius: 10, padding: 12, alignItems: 'center',
  },
  saveBtnText: { color: '#FFF', fontWeight: '700' },

  testBtn: {
    flexDirection: 'row', gap: 14,
    backgroundColor: '#0D2A0D',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#00E67640',
    alignItems: 'center', marginBottom: 24,
  },
  testBtnIcon: { fontSize: 28 },
  testBtnTitle: { color: '#00E676', fontWeight: '700', fontSize: 14 },
  testBtnSub: { color: '#555', fontSize: 12, marginTop: 2 },

  previewCard: {
    backgroundColor: '#111', borderRadius: 16,
    overflow: 'hidden', borderWidth: 1,
    borderColor: '#1E1E1E', marginBottom: 16,
  },
  previewHeader: {
    backgroundColor: '#1A1A1A', padding: 12,
    borderBottomWidth: 1, borderColor: '#2A2A2A',
  },
  previewHeaderText: { color: '#666', fontWeight: '700', fontSize: 12 },
  previewBody: { padding: 16 },
  previewText: { color: '#888', fontSize: 13, lineHeight: 22 },
});