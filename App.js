import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
  withRepeat,
  withSequence,
  Easing
} from 'react-native-reanimated';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture
} from 'react-native-gesture-handler';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- CONFIGURATION ---
const VERSION = "8.0 Genesis Native";
const HARDCODED_API_KEY = "AIzaSyDaJsBfCuPzQejo73TC72_lGCbfB6iLyU8"; 
const { width } = Dimensions.get('window');

// --- TEXTES ---
const TEXTS = {
  fr: {
    welcome: "Bienvenue sur Flow",
    selectLang: "Choisir la langue",
    whatsName: "Comment t'appelles-tu ?",
    namePlace: "Ton prénom...",
    pickHabits: "Choisis tes bases",
    start: "Lancer l'expérience",
    profile: "Profil",
    empty: "Zone vide",
    emptySub: "Ajoute des tâches via l'IA",
    listening: "Je vous écoute...",
    pressToSpeak: "Appuyez pour parler",
    level: "Niveau",
    streak: "Série",
    done: "Fait",
    aiIntro: (name) => `Bonjour ${name} ! Prêt à exploser tes objectifs ?`,
    aiAdded: (count) => `J'ai ajouté ${count} carte(s) au Flow.`,
  }
};

const CATEGORIES = {
  Work: { id: 'Work', label: "Work", icon: 'briefcase', iconLib: Feather, gradient: ['#3b82f6', '#06b6d4'] },
  Health: { id: 'Health', label: "Health", icon: 'dumbbell', iconLib: FontAwesome5, gradient: ['#10b981', '#2dd4bf'] },
  Personal: { id: 'Personal', label: "Perso", icon: 'heart', iconLib: Feather, gradient: ['#ec4899', '#fb7185'] },
  Social: { id: 'Social', label: "Social", icon: 'coffee', iconLib: Feather, gradient: ['#f97316', '#facc15'] },
  Other: { id: 'Other', label: "Misc", icon: 'star', iconLib: Feather, gradient: ['#6366f1', '#a855f7'] }
};

const PRESET_HABITS = [
  { id: 'h1', title: "Drink Water", fr: "Boire de l'eau", category: 'Health', xp: 50 },
  { id: 'h2', title: "Read 10 pages", fr: "Lire 10 pages", category: 'Personal', xp: 100 },
  { id: 'h3', title: "Meditation", fr: "Méditation", category: 'Health', xp: 150 },
  { id: 'h4', title: "Check Emails", fr: "Vérifier emails", category: 'Work', xp: 80 },
];

// --- UTILS ---
const getStorage = async (key, def) => {
  try { const v = await AsyncStorage.getItem(key); return v ? JSON.parse(v) : def; } 
  catch { return def; }
}
const setStorage = async (key, val) => {
  try { await AsyncStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// --- COMPONENTS ---

const AuroraBackground = () => (
  <View style={styles.auroraContainer}>
    <LinearGradient colors={['#F2F2F7', '#E5E5EA']} style={StyleSheet.absoluteFill} />
    <View style={styles.glassOverlay} />
  </View>
);

const Onboarding = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState('fr');
  const [name, setName] = useState("");
  const [selectedHabits, setSelectedHabits] = useState([]);
  const t = TEXTS.fr; // Simplifié pour démo

  const toggleHabit = (habit) => {
    if (selectedHabits.find(h => h.id === habit.id)) {
      setSelectedHabits(prev => prev.filter(h => h.id !== habit.id));
    } else {
      setSelectedHabits(prev => [...prev, { ...habit, title: habit.fr }]);
    }
  };

  const renderStep = () => {
    if (step === 0) return (
      <View style={styles.stepContainer}>
        <Text style={styles.title}>{t.whatsName}</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t.namePlace} autoFocus />
        {name.length > 0 && (
          <TouchableOpacity onPress={() => setStep(1)} style={styles.btn}>
            <Text style={styles.btnText}>Continuer</Text>
          </TouchableOpacity>
        )}
      </View>
    );
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.title}>{t.pickHabits}</Text>
        <ScrollView style={{maxHeight: 400}}>
          {PRESET_HABITS.map(h => {
             const isSel = selectedHabits.find(sh => sh.id === h.id);
             return (
               <TouchableOpacity key={h.id} onPress={() => toggleHabit(h)} style={[styles.habitItem, isSel && styles.habitSel]}>
                 <Text style={[styles.habitText, isSel && {color:'#fff'}]}>{h.fr}</Text>
                 {isSel && <Feather name="check" size={20} color="#fff" />}
               </TouchableOpacity>
             )
          })}
        </ScrollView>
        <TouchableOpacity onPress={() => onComplete({lang, name, habits: selectedHabits})} style={styles.btn}>
            <Text style={styles.btnText}>{t.start} ({selectedHabits.length})</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return <SafeAreaView style={styles.centerContainer}>{renderStep()}</SafeAreaView>;
};

const TaskCard = ({ task, index, onSwipe }) => {
  const translateX = useSharedValue(0);
  
  const gesture = Gesture.Pan()
    .onUpdate((e) => { if(index===0) translateX.value = e.translationX; })
    .onEnd((e) => {
       if(index!==0) return;
       if(e.translationX > 100) translateX.value = withTiming(width, {}, () => runOnJS(onSwipe)(task.id, 'done', task.xp));
       else if(e.translationX < -100) translateX.value = withTiming(-width, {}, () => runOnJS(onSwipe)(task.id, 'skip'));
       else translateX.value = withSpring(0);
    });

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: index===0 ? 1 : 0.95 }],
    opacity: index===0 ? 1 : 0.8,
    top: index * 10,
    zIndex: 100 - index
  }));

  const Cat = CATEGORIES[task.category] || CATEGORIES.Other;
  const Icon = Cat.iconLib;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, rStyle]}>
        <View style={styles.cardHeader}>
          <View style={styles.badge}><Text style={styles.badgeText}>{Cat.label}</Text></View>
          <Text style={styles.xpText}>+{task.xp} XP</Text>
        </View>
        <View style={styles.cardBody}>
          <LinearGradient colors={Cat.gradient} style={styles.cardIcon}>
             <Icon name={Cat.icon} size={40} color="#fff" />
          </LinearGradient>
          <Text style={styles.cardTitle}>{task.title}</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

export default function App() {
  const [onboarded, setOnboarded] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('flow');

  useEffect(() => {
    getStorage('flow_onboarded', false).then(val => {
      if(val) {
        setOnboarded(true);
        getStorage('flow_tasks', []).then(setTasks);
      }
    });
  }, []);

  useEffect(() => { if(onboarded) setStorage('flow_tasks', tasks); }, [tasks, onboarded]);

  const handleOnboard = (data) => {
    const newTasks = data.habits.map(h => ({...h, id: Math.random().toString(), done:false}));
    setTasks(newTasks);
    setStorage('flow_onboarded', true);
    setOnboarded(true);
  };

  const handleSwipe = (id, type) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  if(!onboarded) return <Onboarding onComplete={handleOnboard} />;

  return (
    <GestureHandlerRootView style={{flex:1}}>
      <AuroraBackground />
      <SafeAreaView style={{flex:1}}>
        <View style={styles.header}><Text style={styles.headerTitle}>FLOW OS</Text></View>
        
        <View style={styles.mainContainer}>
           {tasks.length > 0 ? (
             tasks.map((t, i) => <TaskCard key={t.id} task={t} index={i} onSwipe={handleSwipe} />).reverse()
           ) : (
             <View style={styles.empty}><Text>Aucune tâche.</Text></View>
           )}
        </View>

        <View style={styles.dock}>
           <TouchableOpacity onPress={() => setView('flow')}><Feather name="layers" size={24} color="#007AFF" /></TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  auroraContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: '#F2F2F7' },
  centerContainer: { flex: 1, justifyContent: 'center', padding: 20 },
  stepContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 24, elevation: 5, shadowOpacity: 0.1, shadowRadius: 10 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { height: 50, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 15, fontSize: 18, marginBottom: 20 },
  btn: { backgroundColor: '#007AFF', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  habitItem: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderColor: '#eee', justifyContent: 'space-between', alignItems: 'center' },
  habitSel: { backgroundColor: '#007AFF', borderRadius: 12, borderBottomWidth: 0 },
  habitText: { fontSize: 16 },
  
  header: { height: 50, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontWeight: '900', color: '#ccc', letterSpacing: 2 },
  mainContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { position: 'absolute', width: width*0.85, height: 400, backgroundColor: '#fff', borderRadius: 30, padding: 20, justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  badge: { padding: 5, backgroundColor: '#eee', borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#555' },
  xpText: { fontWeight: 'bold', color: '#999' },
  cardBody: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardIcon: { width: 80, height: 80, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  dock: { position: 'absolute', bottom: 30, alignSelf: 'center', width: 200, height: 60, backgroundColor: '#fff', borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  empty: { opacity: 0.5 }
});

