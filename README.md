# REFLEX — Instant Emergency Response System

**Team Tech Titans** | HackxAmrita 2026 | Open Innovation Track

---

## Problem Statement

During emergencies — assaults, accidents, medical crises, or public threats — every second matters.

Current safety apps fail because they require unlocking the phone, need multiple taps to trigger SOS, depend heavily on internet connectivity, and only alert contacts with no coordinated response system.

In high-stress situations, users cannot navigate apps. They need instinctive activation.

---

## Our Solution

REFLEX is an instinct-driven, rapid emergency response system designed for everyone.

Not gender-specific. Not location-specific. Not dependent on perfect connectivity.

**Core Concept:** Trigger a full emergency response in under 2 seconds using natural motion — shaking your phone.

---

## Key Features

**Shake-to-Activate SOS**
Works even when the phone is locked, using accelerometer detection via the DeviceMotionEvent API.

**Real-Time GPS Tracking**
Instant location capture with continuous tracking and reverse geocoding for human-readable addresses.

**Smart Drone Dispatch (Simulated)**
The system calculates the closest available drone using the Haversine distance algorithm and assigns it a mission automatically.

**Live Surveillance Dashboard**
A full control center view displaying active emergencies, drone status, mission ETA, and location visualization in real time.

**Coordinated Alert System**
Simultaneous notification to emergency contacts and the control hub, with SMS delivery via Twilio.

**Universal Accessibility Vision**
Designed to support smartphones, low-bandwidth environments, and future SMS fallback integration.

---

## System Architecture

```
REFLEX ECOSYSTEM

Mobile App (React Native)
 |-- Shake Detection (Accelerometer)
 |-- GPS Capture (expo-location)
 |-- SOS Trigger
 |-- Contact Alerts (expo-sms)
 |-- Drone Dispatch Screen

          |
          v

Surveillance Hub (Flask Backend)
 |-- Emergency Logging
 |-- Closest Drone Calculation (Haversine)
 |-- Mission Assignment
 |-- Dashboard Monitoring

          |
          v

Database (SQLite)
 |-- Drones Table
 |-- Emergencies Table
 |-- Missions Table
```

---

## Tech Stack

**Mobile Frontend**
- React Native (Expo SDK 54)
- expo-sensors — shake detection
- expo-location — real-time GPS
- expo-sms — contact alerts
- expo-router — file-based navigation

**Surveillance Dashboard**
- HTML / CSS / JavaScript
- Leaflet.js — real map rendering
- Web Audio API — live scream detection via microphone
- Twilio — SMS alert delivery

**Backend**
- Python Flask
- SQLite
- REST APIs
- Haversine Algorithm for drone distance calculation

**AI (Prototype Scope)**
- TensorFlow Lite — planned scream detection module
- YOLOv8 — planned visual threat analysis

---

## Project Structure

```
REFLEX/
|-- mobile-app/
|   |-- app/
|   |   |-- _layout.tsx
|   |   |-- index.tsx          (splash screen)
|   |   |-- home.tsx           (main dashboard)
|   |   |-- emergency.tsx      (SOS active screen)
|   |   |-- drone.tsx          (drone dispatch)
|   |   |-- contacts.tsx       (emergency contacts)
|
|-- surveillance-hub/
|   |-- server.py
|   |-- database.py
|   |-- templates/
|       |-- dashboard.html
|
|-- docs/
|   |-- ARCHITECTURE.md
|   |-- API.md
|
|-- README.md
```

---

## Quick Start

**1. Start the Backend**

```bash
cd surveillance-hub
pip install flask
python database.py
python server.py
```

Navigate to `http://localhost:5000` to open the surveillance dashboard.

**2. Run the Mobile App**

```bash
cd mobile-app
npx expo start
```

Scan the QR code with Expo Go on your phone. Grant location and microphone permissions when prompted.

---

## Demo Flow

1. Open the Surveillance Dashboard on a laptop in fullscreen
2. Open the Mobile App on your phone via Expo Go
3. Trigger SOS by shaking the phone 3 times or tapping the SOS button
4. Observe the emergency screen activate, GPS lock, and contacts receive SMS
5. Tap Drone Dispatch to assign Alpha Unit and watch it fly to the target on the live map
6. Dashboard updates in real time with drone ETA, AI detection levels, and alert log

---

## Performance Highlights

| Feature | REFLEX |
|---|---|
| Activation Time | ~2 seconds |
| Shake Detection | Accelerometer-based, 3 shakes |
| Cancel Window | 5-second countdown to prevent false alarms |
| GPS Accuracy | +/- 3 meters (device dependent) |
| Drone Allocation Logic | Haversine distance, simulated |
| Contact Alerts | Real SMS via expo-sms and Twilio |
| Dashboard | Live map, AI bars, drone tracking |
| Hardware Drone | Future integration |

---

## Future Roadmap

**Phase 1**
- Real-time WebRTC camera streaming
- Firebase push notifications
- SMS fallback for no-internet scenarios

**Phase 2**
- Real drone hardware control via MAVLink protocol
- Smartwatch integration for wrist-based SOS
- On-device AI scream detection (TensorFlow Lite)

**Phase 3**
- Institutional deployment across campuses and public zones
- City-level drone network coordination
- Integration with official emergency services (112)

---

## Team Tech Titans

| Name | Role |
|---|---|
| Aasritha Lakshmi Dakshinyam | Team Lead|
| Jahnavi Maddala |
| Bhavana Kondaveeti |
| Neha Krithik Lakshmi Durga Nimmala |
| Anisha Desabathula |

Amrita Vishwa Vidyapeetham, Amaravati

> REFLEX — Because Emergency Response Should Be Instinctive.