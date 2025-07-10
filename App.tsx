import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableHighlight,
  StyleSheet,
  StatusBar,
  TextInput,
  ScrollView,
  Linking,
  Vibration,
  Alert,
  PermissionsAndroid,
  Platform,
  Animated,
  KeyboardAvoidingView,
  Dimensions,
  AppState,
  Modal,
} from 'react-native';

// ========================================================================================
// 🔴 라이브러리 IMPORT 비활성화 (나중에 하나씩 활성화)
// ========================================================================================

// 🟢 SFSymbol은 활성화
import { SFSymbol } from 'react-native-sfsymbols';

// 🔴 라이브러리 Mock 객체들
let Clipboard: any;
let AsyncStorage: any;
let Contacts: any;
let ScreenBrightness: any;
let CalendarEvents: any;

// 카메라 관련 - 안전한 방식으로 추가
let CameraView: any = null;
let cameraDevicesHook: any = () => ({ back: null, front: null });
let cameraPermissionHook: any = () => ({ hasPermission: false, requestPermission: () => Promise.resolve('denied') });
let CameraRoll: any = null;
let isCameraAvailable = false;

// 🟢 Clipboard 활성화
try {
  Clipboard = require('@react-native-clipboard/clipboard').default;
  console.log('📋 Clipboard library 활성화 성공');
} catch (e) {
  console.warn('📋 Clipboard library 비활성화 (Mock 사용)');
  Clipboard = { 
    setString: (text) => {
      console.log('📋 Mock Clipboard.setString:', text);
      return Promise.resolve();
    }, 
    getString: () => {
      console.log('📋 Mock Clipboard.getString');
      return Promise.resolve('');
    } 
  };
}

// 🟢 AsyncStorage 활성화
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
  console.log('💾 AsyncStorage library 활성화 성공');
} catch (e) {
  console.warn('💾 AsyncStorage library 비활성화 (Mock 사용)');
  AsyncStorage = { 
    getItem: (key) => {
      console.log('💾 Mock AsyncStorage.getItem:', key);
      return Promise.resolve(null);
    }, 
    setItem: (key, value) => {
      console.log('💾 Mock AsyncStorage.setItem:', key, value);
      return Promise.resolve();
    } 
  };
}

// 🟢 Contacts 활성화 시도
try {
  Contacts = require('react-native-contacts').default;
  console.log('📞 Contacts library 활성화 성공:', !!Contacts);
  console.log('📞 Contacts methods:', Object.keys(Contacts || {}));
} catch (e) {
  console.warn('📞 Contacts library 비활성화 (Mock 사용):', e.message);
  Contacts = null;
}

// 🔴 ScreenBrightness Mock
console.warn('🔆 ScreenBrightness library 비활성화 (Mock 사용)');
ScreenBrightness = { 
  getBrightness: () => {
    console.log('🔆 Mock ScreenBrightness.getBrightness');
    return Promise.resolve(0.5);
  },
  setBrightness: (brightness) => {
    console.log('🔆 Mock ScreenBrightness.setBrightness:', brightness);
    return Promise.resolve();
  }
};

// 🟢 CalendarEvents 활성화 시도
try {
  CalendarEvents = require('react-native-calendar-events').default;
  console.log('📅 CalendarEvents library 활성화 성공:', !!CalendarEvents);
} catch (e) {
  console.warn('📅 CalendarEvents library 비활성화 (Mock 사용):', e.message);
  CalendarEvents = { 
    requestPermissions: () => {
      console.log('📅 Mock CalendarEvents.requestPermissions');
      return Promise.resolve('denied');
    },
    saveEvent: (title, details) => {
      console.log('📅 Mock CalendarEvents.saveEvent:', title, details);
      return Promise.resolve();
    },
    checkPermissions: () => {
      console.log('📅 Mock CalendarEvents.checkPermissions');
      return Promise.resolve('denied');
    }
  };
}

// 🟢 카메라 라이브러리 활성화 시도
try {
  const VisionCameraLib = require('react-native-vision-camera');
  if (VisionCameraLib && VisionCameraLib.Camera) {
    CameraView = VisionCameraLib.Camera;
    cameraDevicesHook = VisionCameraLib.useCameraDevices;
    cameraPermissionHook = VisionCameraLib.useCameraPermission;
    isCameraAvailable = true;
    console.log('📸 VisionCamera library 활성화 성공');
  } else {
    throw new Error('VisionCamera 컴포넌트를 찾을 수 없음');
  }
} catch (e) {
  console.warn('📸 VisionCamera library 비활성화 (Mock 사용):', e.message);
  isCameraAvailable = false;
}

// 🟢 CameraRoll 활성화 시도
try {
  CameraRoll = require('@react-native-camera-roll/camera-roll').CameraRoll;
  console.log('📷 CameraRoll library 활성화 성공:', !!CameraRoll);
} catch (e) {
  console.warn('📷 CameraRoll library 비활성화 (Mock 사용):', e.message);
  CameraRoll = null;
}

// ========================================================================================
// 🟢 다국어 및 UI 설정
// ========================================================================================

// 다국어 텍스트 정의
const translations = {
  ko: {
    // 하단 탭
    favorites: '즐겨찾기',
    recents: '최근 통화',
    contacts: '연락처',
    keypad: '키패드',
    voicemail: '음성 사서함',
    
    // 메인 화면
    addNumber: '번호 추가',
    
    // 설정 화면
    settings: 'Settings',
    done: '완료',
    shortcuts: '단축어',
    shortcutDownload: '단축어 다운로드',
    shortcutDesc: '전화를 걸어주는 단축어 입니다',
    directCallMode: '📞 바로전화 모드',
    directCallToggle: '즐겨찾기 버튼으로 토글 (현재: {status})',
    directCallDesc: `즐겨찾기 버튼을 누를 때마다 바로전화 모드가 ON ↔ OFF로 토글됩니다
• 점 없음: 바로전화 모드 ON
• 점 있음: 바로전화 모드 OFF

바로전화 ON:
• Auto mode: "target phone" 연락처 편집
• 통화버튼: 항상 "target phone" 캘린더 생성

바로전화 OFF:
• Auto mode: 통화버튼 클릭 횟수에 따라 동작
  - 점 있을 때(첫 상태): "unknown phone" 연락처 편집
  - 점 없을 때(통화버튼 클릭 후): "target phone" 연락처 편집
• 통화버튼 캘린더: 점 있음 → "unknown phone", 점 없음 → "target phone"`,
    
    trickCamera: '🎥 비밀 카메라',
    cameraAutoStart: '비밀 카메라 자동 시작 기능',
    cameraDesc: `ON: 앱 실행 시 즉시 비밀카메라 화면으로 시작됩니다
• 음성사서함 버튼 1초 이상 누르기는 이 설정과 무관하게 항상 사용 가능합니다
• 검정 화면을 더블 탭하면 완전 무음으로 사진이 촬영됩니다
• 왼쪽 상단에 작은 점으로만 상태 표시 (파란색=대기, 녹색=완료)
• 촬영 완료 후 2초 뒤 키패드로 자동 복귀합니다
• 왼쪽 상단 영역을 터치하면 언제든 수동으로 종료하여 키패드로 이동 가능합니다`,
    
    vibrationSettings: '🔊 진동 설정',
    vibrationFeedback: '전체 진동 피드백',
    vibrationDesc: `🔛 ON: 모든 기능에서 진동 피드백 활성화
• Auto mode 실행 시 진동
• 즐겨찾기 버튼 토글 시 진동
• 트릭 카메라 기능 사용 시 진동
• 통화 버튼 클릭 시 진동

🔇 OFF: 모든 진동 비활성화`,
    
    languageSettings: '🌍 언어 설정',
    language: '언어',
    selectLanguage: '언어를 선택하세요',
    
    phoneSettings: '전화번호 설정',
    targetPhone: 'target phone',
    targetPhonePlaceholder: '예: 010-1234-5678',
    targetPhoneDesc: `• 바로전화 모드가 ON일때: Auto mode에서 이 번호의 연락처를 편집합니다
• 바로전화 모드가 OFF일때: 통화버튼을 누른 후(점 사라진 상태) Auto mode에서 이 번호의 연락처를 편집합니다`,
    unknownPhone: 'unknown phone',
    unknownPhonePlaceholder: '예: 010-9999-9999',
    unknownPhoneDesc: '바로전화 모드가 OFF일때: 통화버튼을 한 번도 누르지 않은 상태라면 unknown phone의 연락처를 편집합니다',
    
    helpTitle: '✅ 현재 사용 가능한 기능들',
    helpContent: `• 설정 화면: 연락처 버튼 3초간 누르기
• Auto mode: 전화번호 완성 5초 뒤 자동 처리 (항상 활성화)
• 통화 버튼: 캘린더 일정 추가 (단축어 트리거/target phone or unknown phone)
• 즐겨찾기 버튼: 바로전화 모드 토글 (점으로 상태 표시)
• 음성사서함 버튼 길게 누르기: 트릭 카메라
• 진동 피드백: 모든 주요 기능에서 햅틱 지원

📞 바로전화 모드 토글:
• 점 없음 = 바로전화 ON: "target phone" 캘린더 생성
• 점 있음 = 바로전화 OFF: "unknown phone" → "target phone" 순서

🎥 트릭 카메라:
• 검정 화면을 빠르게 두 번 탭하여 무음 촬영
• 왼쪽 상단 작은 점: 파란색(대기) → 녹색(완료)
• 2초 후 자동 키패드 복귀

⚡ Auto mode (항상 활성화):
• 전화번호 완성시 5초 후 자동으로 연락처 편집

📱 디바이스 정보:
• 화면 크기: {screenSize}
• 화면 타입: {screenType}
• 홈버튼: {homeButton}
• 키 크기: {keySize}px
• 예상 기종: {deviceModel}
• 카메라: {cameraStatus} | 저장: {storageStatus}`,
    
    // 권한 관련 추가
    permissionDenied: '권한이 거부되었습니다',
    permissionRequired: '권한이 필요합니다',
    retryPermission: '권한을 다시 요청하시겠습니까?',
    grantPermission: '권한 허용',
    skipPermission: '건너뛰기',
    
    on: 'ON',
    off: 'OFF',
    hasHomeButton: '있음',
    noHomeButton: '없음',
    contactSearchDisabled: '홈버튼 있는 기종은 비활성화 (번호 추가 텍스트만 표시)',
    contactSearchEnabled: 'T9 방식 이름 검색 활성화 (연락처 매칭 및 추가 버튼)',
    available: '✅',
    unavailable: '❌',
  },
};

// 화면 크기 정보
const { width, height } = Dimensions.get('window');

// 홈버튼 유무 감지
const hasHomeButton = (() => {
  if (width === 320 && height === 568) return true; // iPhone SE 1세대
  if (width === 375 && height === 667) return true; // iPhone SE 2/3세대, iPhone 6/7/8
  if (width === 414 && height === 736) return true; // iPhone 6/7/8 Plus
  if (height <= 750) return true; // 기타 홈버튼이 있는 구형 기종들
  return false;
})();

// 기종별 크기 계산 함수들
const getScreenType = () => {
  if (width === 320 && height === 568) return 'small';
  if (width <= 375) return 'medium';
  if (width <= 393) return 'standard';
  if (width <= 402) return 'standard-pro';
  if (width <= 414) return 'large';
  if (width <= 430) return 'xlarge';
  if (width <= 440) return 'xxlarge';
  return 'xxxlarge';
};

const getLayoutConfig = () => {
  const screenType = getScreenType();
  
  const layoutConfigs = {
    small: {
      displayContainer: { paddingTop: hasHomeButton ? 50 : 80, paddingBottom: 8, minHeight: 70 },
      addContactButton: { size: 30, right: 20, top: hasHomeButton ? 85 : 55 },
      contactMatch: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, maxHeight: 100 },
      keypad: { marginBottom: hasHomeButton ? 15 : 25, keyMargin: 10, rowMargin: hasHomeButton ? 14 : 16 },
      bottomButtons: { paddingBottom: hasHomeButton ? 25 : 45, marginTop: hasHomeButton ? -5 : -8 },
      deleteButton: { sizeMultiplier: 0.75, right: 55 },
      tabBar: { paddingVertical: 5, paddingBottom: hasHomeButton ? 0 : 20, iconSize: 20, labelSize: hasHomeButton ? 8 : 9, labelMarginTop: hasHomeButton ? 14 : 13 }
    },
    medium: {
      displayContainer: { paddingTop: hasHomeButton ? 55 : 90, paddingBottom: hasHomeButton ? 10 : 8, minHeight: hasHomeButton ? 75 : 65 },
      addContactButton: { size: 32, right: 22, top: hasHomeButton ? 95 : 65 },
      contactMatch: { paddingHorizontal: 22, paddingTop: hasHomeButton ? 0 : 10, paddingBottom: hasHomeButton ? 0 : 14, maxHeight: hasHomeButton ? 0 : 110 },
      keypad: { marginBottom: hasHomeButton ? 18 : 25, keyMargin: 11, rowMargin: hasHomeButton ? 15 : 17 },
      bottomButtons: { paddingBottom: hasHomeButton ? 28 : 50, marginTop: hasHomeButton ? -5 : -8 },
      deleteButton: { sizeMultiplier: 0.78, right: 60 },
      tabBar: { paddingVertical: 5, paddingBottom: hasHomeButton ? 0 : 22, iconSize: 22, labelSize: hasHomeButton ? 9 : 10, labelMarginTop: hasHomeButton ? 15 : 14 }
    },
    standard: {
      displayContainer: { paddingTop: 95, paddingBottom: 0, minHeight: 60 },
      addContactButton: { size: 34, right: 24, top: 68 },
      contactMatch: { paddingHorizontal: 24, paddingTop: 0, paddingBottom: 10, maxHeight: 115 },
      keypad: { marginBottom: 25, keyMargin: 12, rowMargin: 18 },
      bottomButtons: { paddingBottom: 52, marginTop: -15 },
      deleteButton: { sizeMultiplier: 0.80, right: 62 },
      tabBar: { paddingVertical: 6, paddingBottom: 24, iconSize: 24, labelSize: 10, labelMarginTop: 15 }
    },
    'standard-pro': {
      displayContainer: { paddingTop: 98, paddingBottom: 0, minHeight: 62 },
      addContactButton: { size: 35, right: 25, top: 70 },
      contactMatch: { paddingHorizontal: 25, paddingTop: 10, paddingBottom: 15, maxHeight: 118 },
      keypad: { marginBottom: 26, keyMargin: 12, rowMargin: 18 },
      bottomButtons: { paddingBottom: 54, marginTop: -13 },
      deleteButton: { sizeMultiplier: 0.82, right: 64 },
      tabBar: { paddingVertical: 6, paddingBottom: 25, iconSize: 24, labelSize: 10, labelMarginTop: 15 }
    },
    large: {
      displayContainer: { paddingTop: hasHomeButton ? 65 : 100, paddingBottom: hasHomeButton ? 12 : 0, minHeight: hasHomeButton ? 80 : 65 },
      addContactButton: { size: hasHomeButton ? 36 : 38, right: hasHomeButton ? 26 : 28, top: hasHomeButton ? 105 : 75 },
      contactMatch: { paddingHorizontal: hasHomeButton ? 26 : 28, paddingTop: hasHomeButton ? 0 : 12, paddingBottom: hasHomeButton ? 0 : 16, maxHeight: hasHomeButton ? 0 : 125 },
      keypad: { marginBottom: hasHomeButton ? 20 : 28, keyMargin: hasHomeButton ? 12 : 13, rowMargin: hasHomeButton ? 16 : 19 },
      bottomButtons: { paddingBottom: hasHomeButton ? 32 : 56, marginTop: hasHomeButton ? -6 : -10 },
      deleteButton: { sizeMultiplier: hasHomeButton ? 0.82 : 0.85, right: hasHomeButton ? 64 : 66 },
      tabBar: { paddingVertical: 6, paddingBottom: hasHomeButton ? 0 : 26, iconSize: hasHomeButton ? 24 : 26, labelSize: hasHomeButton ? 9 : 11, labelMarginTop: hasHomeButton ? 16 : 16 }
    },
    xlarge: {
      displayContainer: { paddingTop: 105, paddingBottom: 0, minHeight: 68 },
      addContactButton: { size: 40, right: 30, top: 78 },
      contactMatch: { paddingHorizontal: 30, paddingTop: 12, paddingBottom: 18, maxHeight: 130 },
      keypad: { marginBottom: 30, keyMargin: 14, rowMargin: 20 },
      bottomButtons: { paddingBottom: 58, marginTop: -12 },
      deleteButton: { sizeMultiplier: 0.88, right: 68 },
      tabBar: { paddingVertical: 7, paddingBottom: 28, iconSize: 26, labelSize: 11, labelMarginTop: 16 }
    },
    xxlarge: {
      displayContainer: { paddingTop: 108, paddingBottom: 0, minHeight: 70 },
      addContactButton: { size: 42, right: 32, top: 80 },
      contactMatch: { paddingHorizontal: 32, paddingTop: 12, paddingBottom: 20, maxHeight: 135 },
      keypad: { marginBottom: 32, keyMargin: 15, rowMargin: 22 },
      bottomButtons: { paddingBottom: 60, marginTop: -14 },
      deleteButton: { sizeMultiplier: 0.90, right: 70 },
      tabBar: { paddingVertical: 8, paddingBottom: 30, iconSize: 28, labelSize: 12, labelMarginTop: 17 }
    },
    xxxlarge: {
      displayContainer: { paddingTop: 115, paddingBottom: 0, minHeight: 75 },
      addContactButton: { size: 45, right: 35, top: 85 },
      contactMatch: { paddingHorizontal: 35, paddingTop: 15, paddingBottom: 22, maxHeight: 140 },
      keypad: { marginBottom: 35, keyMargin: 16, rowMargin: 24 },
      bottomButtons: { paddingBottom: 65, marginTop: -16 },
      deleteButton: { sizeMultiplier: 0.92, right: 75 },
      tabBar: { paddingVertical: 8, paddingBottom: 32, iconSize: 30, labelSize: 13, labelMarginTop: 18 }
    }
  };
  
  return layoutConfigs[screenType];
};

const getFontSizes = () => {
  const screenType = getScreenType();
  
  const fontConfigs = {
    small: { keyNumber: 22, keyLetters: 6, numberDisplay: 22, title: 16, base: 12, desc: 9 },
    medium: { keyNumber: hasHomeButton ? 25 : 27, keyLetters: hasHomeButton ? 10 : 10, numberDisplay: hasHomeButton ? 35 : 35, title: hasHomeButton ? 18 : 20, base: hasHomeButton ? 15 : 14, desc: hasHomeButton ? 10 : 11 },
    standard: { keyNumber: 35, keyLetters: 9, numberDisplay: 37, title: 22, base: 15, desc: 12 },
    'standard-pro': { keyNumber: 35, keyLetters: 9, numberDisplay: 35, title: 23, base: 15, desc: 12 },
    large: { keyNumber: hasHomeButton ? 30 : 32, keyLetters: hasHomeButton ? 10 : 11, numberDisplay: hasHomeButton ? 36 : 38, title: hasHomeButton ? 23 : 25, base: hasHomeButton ? 16 : 17, desc: hasHomeButton ? 13 : 14 },
    xlarge: { keyNumber: 33, keyLetters: 11, numberDisplay: 38, title: 26, base: 18, desc: 15 },
    xxlarge: { keyNumber: 34, keyLetters: 12, numberDisplay: 42, title: 27, base: 18, desc: 15 },
    xxxlarge: { keyNumber: 36, keyLetters: 13, numberDisplay: 44, title: 28, base: 19, desc: 16 }
  };
  
  return fontConfigs[screenType];
};

const getKeySize = () => {
  const screenType = getScreenType();
  const layoutConfig = getLayoutConfig();
  const keyMargin = layoutConfig.keypad.keyMargin;
  const horizontalPadding = 50;
  const availableWidth = width - horizontalPadding;
  const baseKeySize = (availableWidth - (keyMargin * 4)) / 3;
  
  const sizeMultipliers = {
    small: 0.75, medium: 0.82, standard: 0.88, 'standard-pro': 0.90,
    large: 0.93, xlarge: 0.96, xxlarge: 0.98, xxxlarge: 1.0
  };
  
  const keySize = baseKeySize * sizeMultipliers[screenType];
  return Math.max(Math.min(keySize, 85), 60);
};

// 계산된 값들
const keySize = getKeySize();
const fontSizes = getFontSizes();
const layoutConfig = getLayoutConfig();
const titleFontSize = fontSizes.title;
const baseFontSize = fontSizes.base;
const descFontSize = fontSizes.desc;

// ========================================================================================
// 🟢 컴포넌트들
// ========================================================================================

// 언어 드롭다운 컴포넌트
const LanguageDropdown = ({ language, onLanguageChange, t }: { 
  language: string; 
  onLanguageChange: (lang: string) => void; 
  t: (key: string) => string; 
}) => {
  const [showModal, setShowModal] = useState(false);
  
  const languages = [
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
  ];
  
  const selectedLanguage = languages.find(lang => lang.code === language);
  
  return (
    <>
      <TouchableOpacity 
        style={styles.languageSelector}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.languageSelectorContent}>
          <Text style={styles.languageLabel}>{t('language')}</Text>
          <View style={styles.selectedLanguage}>
            <Text style={styles.languageFlag}>{selectedLanguage?.flag}</Text>
            <Text style={styles.languageName}>{selectedLanguage?.name}</Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </View>
        </View>
      </TouchableOpacity>
      
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={styles.languageModal}>
            <Text style={styles.modalTitle}>{t('selectLanguage')}</Text>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  language === lang.code && styles.selectedOption
                ]}
                onPress={() => {
                  onLanguageChange(lang.code);
                  setShowModal(false);
                }}
              >
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <Text style={[
                  styles.languageOptionText,
                  language === lang.code && styles.selectedOptionText
                ]}>
                  {lang.name}
                </Text>
                {language === lang.code && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const MagicKeypad = () => {
  // ========================================================================================
  // 🟢 상태 관리
  // ========================================================================================
  
  const [currentNumber, setCurrentNumber] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showTrickCamera, setShowTrickCamera] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [deleteTimer, setDeleteTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [autoProcessTimer, setAutoProcessTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [voicemailLongPressTimer, setVoicemailLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [contactsLongPressTimer, setContactsLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [zeroLongPressTimer, setZeroLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isZeroLongPressed, setIsZeroLongPressed] = useState(false);
  const [clearNumberTimer, setClearNumberTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [callButtonClickCount, setCallButtonClickCount] = useState(1);
  const [matchedContacts, setMatchedContacts] = useState<any[]>([]);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [shortcuts, setShortcuts] = useState({
    targetPhone: '',
    unknownPhone: '',
    sharp: '',
    star: '',
    call: ''
  });
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [directCallEnabled, setDirectCallEnabled] = useState(false);
  const [hasContactsPermission, setHasContactsPermission] = useState(false);
  const [hasCalendarPermission, setHasCalendarPermission] = useState(false);
  const [language, setLanguage] = useState('ko');
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const [hasAutoStartedCamera, setHasAutoStartedCamera] = useState(false);
  
  // 애니메이션 관련 상태
  const [numberFadeAnim] = useState(new Animated.Value(0));
  const [elementsFadeAnim] = useState(new Animated.Value(0));
  const [isFirstInput, setIsFirstInput] = useState(true);

  // ========================================================================================
  // 🟢 유틸리티 함수들
  // ========================================================================================

  // 현재 언어에 맞는 번역 함수
  const t = (key: string, params?: Record<string, string>) => {
    let text = translations[language as keyof typeof translations]?.[key as keyof typeof translations[keyof typeof translations]] || key;
    
    if (params) {
      Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, params[param]);
      });
    }
    
    return text;
  };

  // T9 매핑 테이블
  const t9Map: { [key: string]: string[] } = {
    '2': ['a', 'b', 'c', 'ㄱ', 'ㄲ', 'ㅋ'],
    '3': ['d', 'e', 'f', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅌ'],
    '4': ['g', 'h', 'i', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅍ'],
    '5': ['j', 'k', 'l', 'ㅅ', 'ㅆ', 'ㅈ', 'ㅉ', 'ㅊ'],
    '6': ['m', 'n', 'o', 'ㅇ', 'ㅎ'],
    '7': ['p', 'q', 'r', 's'],
    '8': ['t', 'u', 'v'],
    '9': ['w', 'x', 'y', 'z']
  };

  // 연락처 매칭 함수 (원본 버전으로 복원)
  const matchContacts = () => {
    if (!currentNumber || currentNumber === '' || allContacts.length === 0) {
      setMatchedContacts([]);
      return;
    }

    const numbersOnly = currentNumber.replace(/[^0-9]/g, '');
    if (numbersOnly.length === 0) {
      setMatchedContacts([]);
      return;
    }

    const matched: any[] = [];
    let count = 0;
    const maxResults = 20;

    for (const contact of allContacts) {
      if (count >= maxResults) break;
      
      let isMatched = false;
      let matchType = '';

      // 전화번호 매칭 (우선순위)
      if (contact.phoneNumbers) {
        for (const phone of contact.phoneNumbers) {
          const cleanPhone = phone.number.replace(/[^0-9]/g, '');
          if (cleanPhone.startsWith(numbersOnly)) {
            isMatched = true;
            matchType = 'phone';
            break;
          }
        }
      }

      // T9 이름 매칭 (전화번호 매칭이 안 된 경우만)
      if (!isMatched && contact.displayName && numbersOnly.length >= 2) {
        const name = contact.displayName.toLowerCase().replace(/[^a-z가-힣]/g, '');
        if (isSimpleT9Match(name, numbersOnly)) {
          isMatched = true;
          matchType = 't9';
        }
      }

      if (isMatched) {
        let fullName = contact.displayName;
        if (!fullName || fullName.trim() === '') {
          const names = [];
          if (contact.familyName) names.push(contact.familyName);
          if (contact.givenName) names.push(contact.givenName);
          if (contact.middleName) names.push(contact.middleName);
          fullName = names.join(' ');
          
          if (!fullName || fullName.trim() === '') {
            fullName = '이름 없음';
          }
        }

        matched.push({
          ...contact,
          matchType,
          fullName: fullName,
          displayName: fullName,
          primaryPhone: contact.phoneNumbers?.[0]?.number || ''
        });
        count++;
      }
    }

    // 전화번호 매칭을 우선순위로 정렬
    matched.sort((a, b) => {
      if (a.matchType === 'phone' && b.matchType === 't9') return -1;
      if (a.matchType === 't9' && b.matchType === 'phone') return 1;
      return 0;
    });

    setMatchedContacts(matched);
  };

  // 간단한 T9 매칭
  const isSimpleT9Match = (name: string, numbers: string): boolean => {
    if (name.length === 0 || numbers.length === 0) return false;
    
    let nameIndex = 0;
    let numberIndex = 0;

    while (nameIndex < name.length && numberIndex < numbers.length) {
      const char = name[nameIndex];
      const number = numbers[numberIndex];
      
      if (/[a-z]/.test(char)) {
        if (t9Map[number]?.includes(char)) {
          numberIndex++;
        }
      }
      nameIndex++;
    }

    return numberIndex === numbers.length;
  };

  // 전화번호에서 일치하는 부분 하이라이트
  const renderHighlightedPhone = (phone: string, inputNumbers: string) => {
    if (!inputNumbers) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const formattedPhone = formatPhoneNumber(cleanPhone);
      return <Text style={{ color: '#8E8E93' }}>{formattedPhone}</Text>;
    }
    
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanInput = inputNumbers.replace(/[^0-9]/g, '');
    const formattedPhone = formatPhoneNumber(cleanPhone);
    
    if (cleanPhone.startsWith(cleanInput)) {
      const inputLength = cleanInput.length;
      let matchedLength = 0;
      let charCount = 0;
      
      for (let i = 0; i < formattedPhone.length && charCount < inputLength; i++) {
        if (/[0-9]/.test(formattedPhone[i])) {
          charCount++;
        }
        matchedLength = i + 1;
      }
      
      const matchedPart = formattedPhone.substring(0, matchedLength);
      const remainingPart = formattedPhone.substring(matchedLength);
      
      return (
        <Text>
          <Text style={{ color: '#FFFFFF' }}>{matchedPart}</Text>
          <Text style={{ color: '#8E8E93' }}>{remainingPart}</Text>
        </Text>
      );
    }
    
    return <Text style={{ color: '#8E8E93' }}>{formattedPhone}</Text>;
  };

  // 연락처 로드 함수
  const loadAllContacts = async () => {
    try {
      console.log('📞 연락처 로드 시작');
      const contacts = await Contacts.getAll();
      setAllContacts(contacts);
      console.log(`✅ 연락처 로드 완료: ${contacts.length}개`);
    } catch (error) {
      console.log('❌ 연락처 불러오기 실패:', error);
    }
  };

  // 연락처 권한 요청 함수
  const requestContactsPermission = async () => {
    console.log('🔍 requestContactsPermission 함수 시작');
    
    if (!Contacts) {
      console.log('❌ Contacts 라이브러리가 없어서 권한 요청 불가');
      setHasContactsPermission(false);
      return false;
    }

    try {
      if (Platform.OS === 'android') {
        console.log('🤖 Android 권한 요청 시작');
        
        const currentPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS
        );
        console.log('🔍 현재 연락처 권한 상태:', currentPermission);
        
        if (currentPermission) {
          console.log('✅ 이미 연락처 권한이 있음');
          setHasContactsPermission(true);
          await loadAllContacts();
          return true;
        }
        
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: '연락처 접근 권한',
            message: '연락처 매칭 기능을 위해 연락처 접근 권한이 필요합니다.',
            buttonNeutral: '나중에',
            buttonNegative: '거부',
            buttonPositive: '허용',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('✅ 연락처 권한 허용됨');
          setHasContactsPermission(true);
          await loadAllContacts();
          return true;
        } else {
          console.log('❌ 연락처 권한 거부됨');
          setHasContactsPermission(false);
          return false;
        }
      } else {
        // iOS의 경우
        console.log('🍎 iOS 연락처 권한 확인 시작');
        
        try {
          await loadAllContacts();
          console.log('✅ iOS 연락처 권한 및 로드 성공');
          setHasContactsPermission(true);
          return true;
        } catch (error) {
          console.log('❌ iOS 연락처 권한 거부됨:', error.message);
          setHasContactsPermission(false);
          return false;
        }
      }
    } catch (error) {
      console.log('❌ 연락처 권한 요청 중 오류:', error);
      setHasContactsPermission(false);
      return false;
    }
  };

  // 전화번호 완성 여부 체크 함수
  const checkPhoneNumberComplete = (number: string): boolean => {
    const numbersOnly = number.replace(/[^0-9]/g, '');
    return numbersOnly.length >= 7 && numbersOnly.length <= 15;
  };

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (number: string) => {
    const numbersOnly = number.replace(/[^0-9]/g, '');
    
    if (numbersOnly.length === 11 && /^01[0-9]/.test(numbersOnly)) {
      return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 7)}-${numbersOnly.slice(7)}`;
    }
    else if (numbersOnly.length >= 8 && numbersOnly.length <= 9 && numbersOnly.startsWith('02')) {
      if (numbersOnly.length === 8) {
        return `${numbersOnly.slice(0, 2)}-${numbersOnly.slice(2, 5)}-${numbersOnly.slice(5)}`;
      } else {
        return `${numbersOnly.slice(0, 2)}-${numbersOnly.slice(2, 6)}-${numbersOnly.slice(6)}`;
      }
    }
    else if (numbersOnly.length >= 9 && numbersOnly.length <= 10 && /^0[3-6]/.test(numbersOnly)) {
      if (numbersOnly.length === 9) {
        return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 6)}-${numbersOnly.slice(6)}`;
      } else {
        return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 7)}-${numbersOnly.slice(7)}`;
      }
    }
    else if (numbersOnly.length >= 7) {
      if (numbersOnly.length <= 7) {
        return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3)}`;
      } else if (numbersOnly.length <= 10) {
        return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 6)}-${numbersOnly.slice(6)}`;
      } else {
        const firstGroup = numbersOnly.length === 11 ? 3 : 4;
        return `${numbersOnly.slice(0, firstGroup)}-${numbersOnly.slice(firstGroup, firstGroup + 4)}-${numbersOnly.slice(firstGroup + 4)}`;
      }
    }
    else {
      if (numbersOnly.length <= 3) {
        return numbersOnly;
      } else {
        return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3)}`;
      }
    }
  };

  // 예상 기종 이름 가져오기 함수
  const getDeviceModelName = () => {
    if (width === 320 && height === 568) return language === 'ko' ? 'iPhone SE (1세대)' : 'iPhone SE (1st gen)';
    if (width === 375 && height === 667) return language === 'ko' ? 'iPhone SE (2/3세대) 또는 iPhone 6/7/8' : 'iPhone SE (2nd/3rd gen) or iPhone 6/7/8';
    if (width === 375 && height === 812) return language === 'ko' ? 'iPhone X/XS 또는 iPhone 12 mini' : 'iPhone X/XS or iPhone 12 mini';
    if (width === 390 && height === 844) return 'iPhone 12/13/14';
    if (width === 393 && height === 852) return language === 'ko' ? 'iPhone 15/15 Pro 또는 iPhone 16' : 'iPhone 15/15 Pro or iPhone 16';
    if (width === 402 && height === 874) return 'iPhone 16 Pro';
    if (width === 414 && height === 736) return 'iPhone 6/7/8 Plus';
    if (width === 414 && height === 896) return language === 'ko' ? 'iPhone 11/XR 또는 iPhone XS Max/11 Pro Max' : 'iPhone 11/XR or iPhone XS Max/11 Pro Max';
    if (width === 428 && height === 926) return 'iPhone 12/13/14 Pro Max';
    if (width === 430 && height === 932) return language === 'ko' ? 'iPhone 15 Plus 또는 iPhone 16 Plus' : 'iPhone 15 Plus or iPhone 16 Plus';
    if (width === 440 && height === 956) return language === 'ko' ? 'iPhone 15 Pro Max 또는 iPhone 16 Pro Max' : 'iPhone 15 Pro Max or iPhone 16 Pro Max';
    return language === 'ko' ? `기타 또는 미래 기종 (${width}x${height})` : `Other or future model (${width}x${height})`;
  };

  // ========================================================================================
  // 🟢 초기화 및 설정 관리
  // ========================================================================================

  // 카메라 자동시작 체크
  useEffect(() => {
    console.log('🔍 카메라 자동시작 체크:', {
      isSettingsLoaded,
      cameraEnabled,
      isCameraAvailable,
      hasCameraRoll: !!CameraRoll,
      showTrickCamera,
      hasAutoStartedCamera
    });
    
    if (isSettingsLoaded && cameraEnabled && isCameraAvailable && CameraRoll && !showTrickCamera && !hasAutoStartedCamera) {
      console.log('🎥 카메라 자동시작 조건 충족 - 트릭 카메라 모드로 전환');
      setShowTrickCamera(true);
      setHasAutoStartedCamera(true);
    }
  }, [cameraEnabled, isSettingsLoaded]);

  // 앱 초기화
  useEffect(() => {
    console.log('🚀 앱 초기화 시작');
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      console.log('📄 설정 로드 시작...');
      
      // 🟢 저장된 설정 로드
      try {
        const saved = await AsyncStorage.getItem('magicKeypadSettings');
        if (saved) {
          const settings = JSON.parse(saved);
          setShortcuts(settings.shortcuts || shortcuts);
          setVibrationEnabled(settings.vibrationEnabled !== undefined ? settings.vibrationEnabled : true);
          setCameraEnabled(settings.cameraEnabled !== undefined ? settings.cameraEnabled : false);
          setDirectCallEnabled(settings.directCallEnabled !== undefined ? settings.directCallEnabled : false);
          setLanguage(settings.language || 'ko');
          console.log('✅ 저장된 설정 로드 완료');
        } else {
          console.log('📄 저장된 설정 없음 - 기본값 사용');
        }
      } catch (settingsError) {
        console.log('❌ 설정 로드 실패:', settingsError);
      }
      
      // 🟢 캘린더 권한 요청 (모든 기종)
      console.log('📅 캘린더 권한 요청 시작');
      setTimeout(async () => {
        try {
          const calendarPermission = await CalendarEvents.requestPermissions();
          console.log('📅 캘린더 권한 결과:', calendarPermission);
          
          if (calendarPermission === 'authorized') {
            setHasCalendarPermission(true);
            console.log('✅ 캘린더 권한 허용됨');
          } else {
            setHasCalendarPermission(false);
            console.log('❌ 캘린더 권한 거부됨');
          }
        } catch (calendarError) {
          console.log('❌ 캘린더 권한 요청 실패:', calendarError);
          setHasCalendarPermission(false);
        }
      }, 500);
      
      // 홈버튼이 없는 기종에서만 연락처 권한 요청
      if (!hasHomeButton) {
        console.log('📞 홈버튼 없는 기종 - 연락처 권한 요청 시작');
        
        setTimeout(async () => {
          const hasPermission = await requestContactsPermission();
          
          if (!hasPermission) {
            setTimeout(() => {
              Alert.alert(
                '연락처 권한 안내',
                '연락처 매칭 기능을 사용하려면 연락처 권한을 허용해주세요.\n\n권한 없이도 기본 기능은 모두 사용 가능합니다.',
                [
                  { text: '설정으로 이동', onPress: () => Linking.openSettings() },
                  { text: '나중에', style: 'cancel' }
                ]
              );
            }, 500);
          }
        }, 1000);
      } else {
        console.log('📞 홈버튼 있는 기종 - 연락처 매칭 비활성화');
        setHasContactsPermission(false);
      }
      
      console.log('✅ 설정 로드 완료');
      setIsSettingsLoaded(true);
    } catch (error) {
      console.log('❌ 설정 불러오기 실패:', error);
    }
  };

  const saveSettings = async (
    newShortcuts: typeof shortcuts, 
    newVibrationEnabled: boolean, 
    newCameraEnabled: boolean, 
    newDirectCallEnabled: boolean,
    newLanguage: string
  ) => {
    try {
      console.log('💾 설정 저장 중...');
      
      const settings = {
        shortcuts: newShortcuts,
        vibrationEnabled: newVibrationEnabled,
        cameraEnabled: newCameraEnabled,
        directCallEnabled: newDirectCallEnabled,
        language: newLanguage
      };
      
      await AsyncStorage.setItem('magicKeypadSettings', JSON.stringify(settings));
      
      setShortcuts(newShortcuts);
      setVibrationEnabled(newVibrationEnabled);
      setCameraEnabled(newCameraEnabled);
      setDirectCallEnabled(newDirectCallEnabled);
      setLanguage(newLanguage);
      console.log('✅ 설정 저장 완료');
    } catch (error) {
      console.log('❌ 설정 저장 실패:', error);
    }
  };

  // ========================================================================================
  // 🟢 자동 처리 로직
  // ========================================================================================

  // 자동 처리 체크 및 타이머 설정
  const handleAutoProcessCheck = () => {
    if (autoProcessTimer) {
      clearTimeout(autoProcessTimer);
      setAutoProcessTimer(null);
    }

    if (!checkPhoneNumberComplete(currentNumber)) {
      return;
    }

    console.log('⏰ Auto mode 5초 타이머 시작');
    const timer = setTimeout(() => {
      performAutoProcess();
    }, 5000);

    setAutoProcessTimer(timer);
  };

  // 자동 처리 실행
  const performAutoProcess = async () => {
    if (!checkPhoneNumberComplete(currentNumber)) {
      return;
    }
    
    try {
      if (directCallEnabled) {
        // 바로모드 ON: 타겟번호 처리
        if (shortcuts.targetPhone.trim()) {
          await Clipboard.setString(shortcuts.targetPhone);
          console.log('✅ Auto mode: 타겟번호 클립보드 복사');
        }
        
        // 🟢 실제 연락처 편집 활성화
        if (shortcuts.targetPhone.trim() && hasContactsPermission && Contacts) {
          try {
            const cleanTargetPhone = shortcuts.targetPhone.replace(/[^0-9]/g, '');
            const contacts = await Contacts.getAll();
            
            const targetContact = contacts.find((contact: any) =>
              contact.phoneNumbers.some((phoneNum: any) => {
                const cleanPhone = phoneNum.number.replace(/[^0-9]/g, '');
                return cleanPhone.includes(cleanTargetPhone) || cleanTargetPhone.includes(cleanPhone);
              })
            );

            if (targetContact) {
              const updatedContact = {
                ...targetContact,
                displayName: currentNumber,
                familyName: currentNumber,
                givenName: '',
                middleName: '',
              };

              await Contacts.updateContact(updatedContact);
              console.log('✅ Auto mode: 타겟번호 연락처 편집 완료');
              
              // 성공 진동 피드백
              if (vibrationEnabled) {
                if (Platform.OS === 'ios') {
                  Vibration.vibrate([0, 100, 50, 100]);
                } else {
                  Vibration.vibrate([100, 50, 100]);
                }
              }
            } else {
              console.log('⚠️ 타겟번호와 일치하는 연락처를 찾을 수 없음');
            }
          } catch (contactError) {
            console.log('❌ 타겟번호 연락처 편집 실패:', contactError);
          }
        } else {
          console.log('ℹ️ 연락처 편집 조건 미충족 (권한/라이브러리/번호 확인)');
        }
      } else {
        // 바로모드 OFF: 통화버튼 클릭 횟수에 따라 결정
        if (callButtonClickCount === 0) {
          // 통화버튼 눌린 후: 타겟번호 처리
          if (shortcuts.targetPhone.trim()) {
            await Clipboard.setString(shortcuts.targetPhone);
            console.log('✅ Auto mode: 타겟번호 클립보드 복사');
          }
          
          // 🟢 실제 연락처 편집 활성화
          if (shortcuts.targetPhone.trim() && hasContactsPermission && Contacts) {
            try {
              const cleanTargetPhone = shortcuts.targetPhone.replace(/[^0-9]/g, '');
              const contacts = await Contacts.getAll();
              
              const targetContact = contacts.find((contact: any) =>
                contact.phoneNumbers.some((phoneNum: any) => {
                  const cleanPhone = phoneNum.number.replace(/[^0-9]/g, '');
                  return cleanPhone.includes(cleanTargetPhone) || cleanTargetPhone.includes(cleanPhone);
                })
              );

              if (targetContact) {
                const updatedContact = {
                  ...targetContact,
                  displayName: currentNumber,
                  familyName: currentNumber,
                  givenName: '',
                  middleName: '',
                };

                await Contacts.updateContact(updatedContact);
                console.log('✅ Auto mode: 타겟번호 연락처 편집 완료');
                
                // 성공 진동 피드백
                if (vibrationEnabled) {
                  if (Platform.OS === 'ios') {
                    Vibration.vibrate([0, 100, 50, 100]);
                  } else {
                    Vibration.vibrate([100, 50, 100]);
                  }
                }
              } else {
                console.log('⚠️ 타겟번호와 일치하는 연락처를 찾을 수 없음');
              }
            } catch (contactError) {
              console.log('❌ 타겟번호 연락처 편집 실패:', contactError);
            }
          }
        } else {
          // 통화버튼 안 눌린 상태: 없는번호 처리
          if (shortcuts.unknownPhone.trim()) {
            await Clipboard.setString(shortcuts.unknownPhone);
            console.log('✅ Auto mode: 없는번호 클립보드 복사');
          }
          
          // 🟢 실제 연락처 편집 활성화
          if (shortcuts.unknownPhone.trim() && hasContactsPermission && Contacts) {
            try {
              const cleanUnknownPhone = shortcuts.unknownPhone.replace(/[^0-9]/g, '');
              const contacts = await Contacts.getAll();
              
              const targetContact = contacts.find((contact: any) =>
                contact.phoneNumbers.some((phoneNum: any) => {
                  const cleanPhone = phoneNum.number.replace(/[^0-9]/g, '');
                  return cleanPhone.includes(cleanUnknownPhone) || cleanUnknownPhone.includes(cleanPhone);
                })
              );

              if (targetContact) {
                const updatedContact = {
                  ...targetContact,
                  displayName: currentNumber,
                  familyName: currentNumber,
                  givenName: '',
                  middleName: '',
                };

                await Contacts.updateContact(updatedContact);
                console.log('✅ Auto mode: 없는번호 연락처 편집 완료');
                
                // 성공 진동 피드백
                if (vibrationEnabled) {
                  if (Platform.OS === 'ios') {
                    Vibration.vibrate([0, 100, 50, 100]);
                  } else {
                    Vibration.vibrate([100, 50, 100]);
                  }
                }
              } else {
                console.log('⚠️ 없는번호와 일치하는 연락처를 찾을 수 없음');
              }
            } catch (contactError) {
              console.log('❌ 없는번호 연락처 편집 실패:', contactError);
            }
          }
        }
      }
      
    } catch (error) {
      console.log('❌ Auto mode 실행 실패:', error);
    }
  };

  // ========================================================================================
  // 🟢 이벤트 핸들러들
  // ========================================================================================

  // 번호 변경시 연락처 매칭 및 자동 처리 체크
  useEffect(() => {
    // 홈버튼이 없는 기종에서만 연락처 매칭 실행
    if (!hasHomeButton && currentNumber) {
      matchContacts();
    } else {
      // 홈버튼이 있는 기종이거나 번호가 없으면 매칭 결과 지우기
      setMatchedContacts([]);
    }
    
    // 항상 자동 처리 활성화
    handleAutoProcessCheck();
  }, [currentNumber, directCallEnabled, callButtonClickCount]);

  // 연락처 로드 완료시에만 매칭 재실행 (홈버튼이 없는 기종만)
  useEffect(() => {
    if (!hasHomeButton && currentNumber && allContacts.length > 0) {
      matchContacts();
    } else if (hasHomeButton) {
      // 홈버튼이 있는 기종에서는 항상 매칭 결과를 지움
      setMatchedContacts([]);
    }
  }, [allContacts]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (longPressTimer) clearTimeout(longPressTimer);
      if (deleteTimer) clearInterval(deleteTimer);
      if (autoProcessTimer) clearTimeout(autoProcessTimer);
      if (voicemailLongPressTimer) clearTimeout(voicemailLongPressTimer);
      if (contactsLongPressTimer) clearTimeout(contactsLongPressTimer);
      if (zeroLongPressTimer) clearTimeout(zeroLongPressTimer);
      if (clearNumberTimer) clearTimeout(clearNumberTimer);
    };
  }, [longPressTimer, deleteTimer, autoProcessTimer, voicemailLongPressTimer, contactsLongPressTimer, zeroLongPressTimer, clearNumberTimer]);

  // 번호 입력
  const addNumber = (num: string) => {
    const numbersOnly = currentNumber.replace(/[^0-9]/g, '');
    if (numbersOnly.length >= 15) return;
    
    // 모든 타이머 정리
    if (autoProcessTimer) {
      clearTimeout(autoProcessTimer);
      setAutoProcessTimer(null);
    }
    if (deleteTimer) {
      clearInterval(deleteTimer);
      setDeleteTimer(null);
    }
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    if (clearNumberTimer) {
      clearTimeout(clearNumberTimer);
      setClearNumberTimer(null);
    }
    
    const newNumber = currentNumber + num;
    const formatted = formatPhoneNumber(newNumber);
    
    if (isFirstInput && currentNumber === '') {
      setIsFirstInput(false);
      
      Animated.timing(numberFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      Animated.timing(elementsFadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }).start();
    }
    
    setCurrentNumber(formatted);
  };

  // 번호 삭제
  const deleteLastNumber = () => {
    if (currentNumber.length === 0) return;
    
    if (autoProcessTimer) {
      clearTimeout(autoProcessTimer);
      setAutoProcessTimer(null);
    }
    if (clearNumberTimer) {
      clearTimeout(clearNumberTimer);
      setClearNumberTimer(null);
    }
    
    let newNumber = currentNumber.slice(0, -1);
    if (newNumber.endsWith('-')) {
      newNumber = newNumber.slice(0, -1);
    }
    
    const formatted = formatPhoneNumber(newNumber);
    setCurrentNumber(formatted);
    
    if (formatted === '') {
      setIsFirstInput(true);
      numberFadeAnim.setValue(0);
      elementsFadeAnim.setValue(0);
    }
  };

  const startContinuousDelete = () => {
    const timer = setInterval(() => {
      setCurrentNumber(prev => {
        if (prev.length === 0) {
          return prev;
        }
        
        let newNumber = prev.slice(0, -1);
        if (newNumber.endsWith('-')) {
          newNumber = newNumber.slice(0, -1);
        }
        
        const formatted = formatPhoneNumber(newNumber);
        
        if (formatted === '') {
          setIsFirstInput(true);
          numberFadeAnim.setValue(0);
          elementsFadeAnim.setValue(0);
        }
        
        return formatted;
      });
    }, 100);
    
    setDeleteTimer(timer);
  };

  const stopContinuousDelete = () => {
    if (deleteTimer) {
      clearInterval(deleteTimer);
      setDeleteTimer(null);
    }
  };

  // 통화 버튼 처리
  const setBrightnessToFixed = async () => {
    try {
      let eventTitle = 'target phone';
      
      if (directCallEnabled) {
        eventTitle = 'target phone';
      } else {
        if (callButtonClickCount === 1) {
          eventTitle = 'unknown phone';
        } else {
          eventTitle = 'target phone';
        }
      }
      
      if (!directCallEnabled && callButtonClickCount > 0) {
        setCallButtonClickCount(prev => prev - 1);
      }
      
      // 🟢 실제 캘린더 일정 추가
      if (hasCalendarPermission && CalendarEvents) {
        try {
          const now = new Date();
          const endTime = new Date(now.getTime() + 60 * 1000); // 1분 후
          
          const eventDetails = {
            title: eventTitle,
            startDate: now.toISOString(),
            endDate: endTime.toISOString(),
            notes: `MagicKeypad 통화 버튼으로 생성된 ${eventTitle} 일정입니다.`,
          };
          
          await CalendarEvents.saveEvent(eventDetails.title, eventDetails);
          console.log(`✅ 캘린더 일정 추가 완료: ${eventTitle}`);
          
        } catch (calendarError) {
          console.log('❌ 캘린더 일정 추가 실패:', calendarError);
        }
      } else {
        console.log(`📅 캘린더 일정 추가: ${eventTitle} (권한 없음 또는 라이브러리 없음)`);
      }
      
      if (vibrationEnabled) {
        if (Platform.OS === 'ios') {
          Vibration.vibrate([0, 50]);
        } else {
          Vibration.vibrate(100);
        }
      }
      
      if (clearNumberTimer) {
        clearTimeout(clearNumberTimer);
      }
      
      const timer = setTimeout(() => {
        setCurrentNumber('');
        setIsFirstInput(true);
        numberFadeAnim.setValue(0);
        elementsFadeAnim.setValue(0);
        setMatchedContacts([]);
      }, 2000);
      
      setClearNumberTimer(timer);
      
    } catch (error) {
      console.log('❌ 통화 버튼 기능 실행 실패:', error);
    }
  };

  // 음성사서함 버튼 길게 누르기
  const handleVoicemailLongPress = async () => {
    if (!isCameraAvailable) {
      console.log('❌ 카메라 라이브러리 없음');
      Alert.alert('🎥 트릭 카메라', 'Camera 라이브러리를 추가하면 실제 기능이 활성화됩니다.', [
        { text: '확인', style: 'default' }
      ]);
      return;
    }

    if (!CameraRoll) {
      console.log('❌ CameraRoll 라이브러리 없음');
      Alert.alert('🎥 트릭 카메라', 'CameraRoll 라이브러리를 추가하면 저장 기능이 활성화됩니다.', [
        { text: '확인', style: 'default' }
      ]);
      return;
    }

    try {
      console.log('🎥 트릭 카메라 모드 시작');
      setShowTrickCamera(true);
    } catch (error) {
      console.log('❌ 트릭 카메라 실행 실패:', error);
      Alert.alert('🎥 트릭 카메라', '카메라 실행에 실패했습니다.', [
        { text: '확인', style: 'default' }
      ]);
    }
  };

  // 연락처 버튼 길게 누르기
  const handleContactsLongPressStart = () => {
    const timer = setTimeout(() => {
      setShowSettings(true);
    }, 3000);
    setContactsLongPressTimer(timer);
  };

  const handleContactsLongPressEnd = () => {
    if (contactsLongPressTimer) {
      clearTimeout(contactsLongPressTimer);
      setContactsLongPressTimer(null);
    }
  };

  // '0' 버튼 길게 누르기
  const handleZeroPress = () => {
    if (!isZeroLongPressed) {
      addNumber('0');
    }
    setIsZeroLongPressed(false);
  };

  const handleZeroLongPress = () => {
    setIsZeroLongPressed(true);
    addNumber('+');
  };

  // 언어 변경 핸들러
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    saveSettings(shortcuts, vibrationEnabled, cameraEnabled, directCallEnabled, newLanguage);
  };

  // ========================================================================================
  // 🟢 렌더링
  // ========================================================================================

  // 트릭 카메라 화면 표시
  if (showTrickCamera && isCameraAvailable) {
    return (
      <TrickCameraScreen 
        onClose={() => {
          setShowTrickCamera(false);
        }}
        vibrationEnabled={vibrationEnabled}
      />
    );
  }

  // 설정 화면 표시
  if (showSettings) {
    return (
      <SettingsScreen 
        shortcuts={shortcuts}
        vibrationEnabled={vibrationEnabled}
        cameraEnabled={cameraEnabled}
        directCallEnabled={directCallEnabled}
        language={language}
        isCameraAvailable={isCameraAvailable}
        isCameraRollAvailable={!!CameraRoll}
        onSave={(newShortcuts, newVibrationEnabled, newCameraEnabled, newDirectCallEnabled, newLanguage) => {
          saveSettings(newShortcuts, newVibrationEnabled, newCameraEnabled, newDirectCallEnabled, newLanguage);
        }}
        onClose={() => setShowSettings(false)}
        t={t}
        hasHomeButton={hasHomeButton}
        screenSize={`${width}x${height}`}
        screenType={getScreenType()}
        keySize={Math.round(keySize)}
        deviceModel={getDeviceModelName()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* 번호 표시 영역 */}
      <View style={[
        styles.displayContainer,
        {
          paddingTop: layoutConfig.displayContainer.paddingTop,
          paddingBottom: layoutConfig.displayContainer.paddingBottom,
          minHeight: layoutConfig.displayContainer.minHeight,
        }
      ]}>
        <Animated.View
          style={{
            opacity: currentNumber.length > 0 ? numberFadeAnim : 1,
            minHeight: 44,
            justifyContent: 'center',
          }}
        >
          <Text 
            style={[
              styles.numberDisplay,
              currentNumber.length >= 8 && currentNumber.length < 11 && {
                fontSize: fontSizes.numberDisplay * 1,
                letterSpacing: -0.9,
                maxWidth: width * 0.95,
              },
              currentNumber.length >= 11 && currentNumber.length < 14 && {
                fontSize: fontSizes.numberDisplay * 1,
                letterSpacing: -0.9,
                maxWidth: width * 0.95,
              },
              currentNumber.length >= 14 && {
                fontSize: fontSizes.numberDisplay * 0.9,
                letterSpacing: -0.7,
                maxWidth: width * 0.95,
              }
            ]}
          >
            {currentNumber}
          </Text>
        </Animated.View>
        
        {/* 홈버튼이 있는 기종: 번호 추가 텍스트만 표시 */}
        {hasHomeButton && currentNumber.length > 0 && (
          <Animated.View
            style={{
              opacity: elementsFadeAnim,
              marginTop: 8,
              alignItems: 'center',
            }}
          >
            <Text style={styles.addNumberText}>{t('addNumber')}</Text>
          </Animated.View>
        )}
      </View>

      {/* 연락처 추가 버튼 (홈버튼이 없는 기종만) */}
      {!hasHomeButton && currentNumber.length > 0 && (
        <Animated.View
          style={[
            styles.addContactButton,
            {
              opacity: elementsFadeAnim,
              right: layoutConfig.addContactButton.right,
              top: layoutConfig.addContactButton.top,
              width: layoutConfig.addContactButton.size,
              height: layoutConfig.addContactButton.size,
              borderRadius: layoutConfig.addContactButton.size / 2,
            },
          ]}
        >
          <TouchableOpacity>
            <SFSymbol 
              name="person.crop.circle.badge.plus" 
              size={layoutConfig.addContactButton.size * 0.7} 
              color="#007AFF" 
              weight="regular" 
            />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* 연락처 매칭 영역 (홈버튼이 없는 기종만) - 원본 디자인으로 복원 */}
      {!hasHomeButton && matchedContacts.length > 0 && (
        <Animated.View 
          style={[
            styles.contactMatchContainer,
            {
              opacity: elementsFadeAnim,
              paddingHorizontal: layoutConfig.contactMatch.paddingHorizontal,
              paddingTop: layoutConfig.contactMatch.paddingTop,
              paddingBottom: layoutConfig.contactMatch.paddingBottom,
              maxHeight: layoutConfig.contactMatch.maxHeight,
              transform: [
                {
                  translateY: elementsFadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [15, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity 
            style={styles.primaryContactItem}
            onPress={() => {
              const phoneNumber = matchedContacts[0].primaryPhone;
              if (phoneNumber) {
                const formatted = formatPhoneNumber(phoneNumber);
                setCurrentNumber(formatted);
              }
            }}
          >
            <View style={styles.contactIcon}>
              <SFSymbol 
                name="person.crop.circle" 
                size={18} 
                color="#FFFFFF" 
                weight="regular" 
              />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactSingleLine} numberOfLines={1} ellipsizeMode="tail">
                <Text style={{ color: '#8E8E93' }}>
                  {(() => {
                    const name = matchedContacts[0].displayName || matchedContacts[0].fullName || "이름 없음";
                    return name.length > 5 ? name.substring(0, 5) + "⋯" : name;
                  })()}
                </Text>
                <Text style={{ color: '#8E8E93' }}>, </Text>
                {renderHighlightedPhone(matchedContacts[0].primaryPhone, currentNumber.replace(/[^0-9]/g, ''))}
              </Text>
            </View>
          </TouchableOpacity>

          {matchedContacts.length > 1 && (
            <TouchableOpacity style={styles.additionalContactsItem}>
              <View style={styles.contactIcon}>
                <SFSymbol 
                  name="person.2.fill" 
                  size={18} 
                  color="#FFFFFF" 
                  weight="regular" 
                />
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactSingleLine, { color: '#8E8E93' }]}>
                  {language === 'ko' ? `그 외 ${matchedContacts.length - 1}개...` : `${matchedContacts.length - 1} more...`}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* 키패드 영역 */}
      <View style={[
        styles.keypadContainer,
        {
          marginTop: hasHomeButton ? 60 : 30,
        }
      ]}>
        <View style={[
          styles.keypad,
          {
            marginBottom: layoutConfig.keypad.marginBottom,
          }
        ]}>
          {/* 첫 번째 줄: 1 2 3 */}
          <View style={[
            styles.keypadRow,
            {
              marginBottom: layoutConfig.keypad.rowMargin,
            }
          ]}>
            {[['1', ''], ['2', 'ABC'], ['3', 'DEF']].map(([number, letters], index) => (
              <TouchableHighlight
                key={`row1-${index}`}
                style={[
                  styles.key,
                  {
                    marginHorizontal: layoutConfig.keypad.keyMargin,
                  }
                ]}
                onPress={() => addNumber(number)}
                underlayColor="#555555"
                activeOpacity={1}
              >
                <View style={styles.keyContent}>
                  <Text style={styles.keyNumber}>{number}</Text>
                  {letters ? <Text style={styles.keyLetters}>{letters}</Text> : null}
                </View>
              </TouchableHighlight>
            ))}
          </View>

          {/* 두 번째 줄: 4 5 6 */}
          <View style={[
            styles.keypadRow,
            {
              marginBottom: layoutConfig.keypad.rowMargin,
            }
          ]}>
            {[['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO']].map(([number, letters], index) => (
              <TouchableHighlight
                key={`row2-${index}`}
                style={[
                  styles.key,
                  {
                    marginHorizontal: layoutConfig.keypad.keyMargin,
                  }
                ]}
                onPress={() => addNumber(number)}
                underlayColor="#555555"
                activeOpacity={1}
              >
                <View style={styles.keyContent}>
                  <Text style={styles.keyNumber}>{number}</Text>
                  {letters ? <Text style={styles.keyLetters}>{letters}</Text> : null}
                </View>
              </TouchableHighlight>
            ))}
          </View>

          {/* 세 번째 줄: 7 8 9 */}
          <View style={[
            styles.keypadRow,
            {
              marginBottom: layoutConfig.keypad.rowMargin,
            }
          ]}>
            {[['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ']].map(([number, letters], index) => (
              <TouchableHighlight
                key={`row3-${index}`}
                style={[
                  styles.key,
                  {
                    marginHorizontal: layoutConfig.keypad.keyMargin,
                  }
                ]}
                onPress={() => addNumber(number)}
                underlayColor="#555555"
                activeOpacity={1}
              >
                <View style={styles.keyContent}>
                  <Text style={styles.keyNumber}>{number}</Text>
                  {letters ? <Text style={styles.keyLetters}>{letters}</Text> : null}
                </View>
              </TouchableHighlight>
            ))}
          </View>

          {/* 네 번째 줄: * 0 # */}
          <View style={[
            styles.keypadRow,
            {
              marginBottom: layoutConfig.keypad.rowMargin,
            }
          ]}>
            <TouchableHighlight
              style={[
                styles.key,
                {
                  marginHorizontal: layoutConfig.keypad.keyMargin,
                }
              ]}
              onPress={() => addNumber('*')}
              underlayColor="#555555"
              activeOpacity={1}
            >
              <View style={styles.keyContent}>
                <Text style={styles.keyNumber}>*</Text>
              </View>
            </TouchableHighlight>
            
            <TouchableHighlight
              style={[
                styles.key,
                {
                  marginHorizontal: layoutConfig.keypad.keyMargin,
                }
              ]}
              onPress={handleZeroPress}
              onLongPress={handleZeroLongPress}
              delayLongPress={800}
              underlayColor="#555555"
              activeOpacity={1}
            >
              <View style={styles.keyContent}>
                <Text style={styles.keyNumber}>0</Text>
                <Text style={styles.keyLetters}>+</Text>
              </View>
            </TouchableHighlight>
            
            <TouchableHighlight
              style={[
                styles.key,
                {
                  marginHorizontal: layoutConfig.keypad.keyMargin,
                }
              ]}
              onPress={() => addNumber('#')}
              underlayColor="#555555"
              activeOpacity={1}
            >
              <View style={styles.keyContent}>
                <Text style={styles.keyNumber}>#</Text>
              </View>
            </TouchableHighlight>
          </View>
        </View>

        {/* 하단 버튼들 */}
        <View style={[
          styles.bottomButtonsContainer,
          {
            paddingBottom: layoutConfig.bottomButtons.paddingBottom,
            marginTop: layoutConfig.bottomButtons.marginTop,
          }
        ]}>
          <TouchableOpacity 
            style={[
              styles.callButton,
              {
                marginTop: layoutConfig.bottomButtons.marginTop,
              }
            ]}
            onPress={setBrightnessToFixed}
          >
            <SFSymbol 
              name="phone.fill" 
              size={keySize * 0.4} 
              color="#FFFFFF" 
              weight="medium" 
            />
          </TouchableOpacity>
          
          {/* 삭제 버튼 */}
          {currentNumber.length > 0 && (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  right: layoutConfig.deleteButton.right,
                  top: 0,
                  opacity: elementsFadeAnim,
                },
              ]}
            >
              <TouchableOpacity 
                style={[
                  styles.deleteButton,
                  {
                    width: keySize * layoutConfig.deleteButton.sizeMultiplier,
                    height: keySize * layoutConfig.deleteButton.sizeMultiplier,
                    borderRadius: (keySize * layoutConfig.deleteButton.sizeMultiplier) / 2,
                  }
                ]}
                onPressIn={() => {
                  if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    setLongPressTimer(null);
                  }
                  if (deleteTimer) {
                    clearInterval(deleteTimer);
                    setDeleteTimer(null);
                  }
                  if (autoProcessTimer) {
                    clearTimeout(autoProcessTimer);
                    setAutoProcessTimer(null);
                  }
                  if (clearNumberTimer) {
                    clearTimeout(clearNumberTimer);
                    setClearNumberTimer(null);
                  }
                  
                  deleteLastNumber();
                  
                  const timer = setTimeout(() => {
                    startContinuousDelete();
                  }, 500);
                  setLongPressTimer(timer);
                }}
                onPressOut={() => {
                  if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    setLongPressTimer(null);
                  }
                  if (deleteTimer) {
                    clearInterval(deleteTimer);
                    setDeleteTimer(null);
                  }
                }}
                activeOpacity={0.6}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                  {/* 뒤에 하얀색 outline 버전 */}
                  <SFSymbol 
                    name="delete.left"
                    size={keySize * 0.33} 
                    color="#FFFFFF" 
                    weight="medium" 
                  />
                  {/* 앞에 원래 fill 버전 (절대 위치로 겹치기) */}
                  <SFSymbol 
                    name="delete.left.fill" 
                    size={keySize * 0.34} 
                    color="#333333" 
                    weight="medium" 
                    style={{ position: 'absolute' }}
                  />
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>

      {/* 하단 탭바 */}
      <View style={[
        styles.tabBar,
        {
          paddingVertical: layoutConfig.tabBar.paddingVertical,
          paddingBottom: layoutConfig.tabBar.paddingBottom,
        }
      ]}>
        <TouchableOpacity 
          style={[
            styles.tabItem,
            {
              paddingBottom: hasHomeButton ? 1 : 15,
            }
          ]}
          onPress={() => {
            setDirectCallEnabled(prev => {
              const newMode = !prev;
              if (!newMode) {
                setCallButtonClickCount(1);
              }
              
              if (vibrationEnabled) {
                if (Platform.OS === 'ios') {
                  Vibration.vibrate([0, 100]);
                } else {
                  Vibration.vibrate(100);
                }
              }
              
              return newMode;
            });
          }}
        >
          <SFSymbol 
            name="star.fill" 
            size={layoutConfig.tabBar.iconSize} 
            color="rgba(255,255,255,0.6)" 
            weight="regular" 
          />
          <Text style={[
            styles.tabLabel,
            {
              fontSize: layoutConfig.tabBar.labelSize,
              marginTop: layoutConfig.tabBar.labelMarginTop,
            }
          ]}>{t('favorites')}</Text>
          {!directCallEnabled && callButtonClickCount === 1 && (
            <View style={styles.statusIndicator}>
              <View style={styles.statusDot} />
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={[
          styles.tabItem,
          {
            paddingBottom: hasHomeButton ? 1 : 15,
          }
        ]}>
          <SFSymbol 
            name="clock.fill" 
            size={layoutConfig.tabBar.iconSize} 
            color="rgba(255,255,255,0.6)" 
            weight="regular" 
          />
          <Text style={[
            styles.tabLabel,
            {
              fontSize: layoutConfig.tabBar.labelSize,
              marginTop: layoutConfig.tabBar.labelMarginTop,
            }
          ]}>{t('recents')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabItem,
            {
              paddingBottom: hasHomeButton ? 1 : 15,
            }
          ]}
          onPressIn={handleContactsLongPressStart}
          onPressOut={handleContactsLongPressEnd}
        >
          <SFSymbol 
            name="person.circle.fill" 
            size={layoutConfig.tabBar.iconSize} 
            color="rgba(255,255,255,0.6)" 
            weight="regular" 
          />
          <Text style={[
            styles.tabLabel,
            {
              fontSize: layoutConfig.tabBar.labelSize,
              marginTop: layoutConfig.tabBar.labelMarginTop,
            }
          ]}>{t('contacts')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[
          styles.tabItem, 
          styles.activeTabItem,
          {
            paddingBottom: hasHomeButton ? 1 : 15,
          }
        ]}>
          <SFSymbol 
            name="circle.grid.3x3.fill" 
            size={layoutConfig.tabBar.iconSize} 
            color="#007AFF" 
            weight="medium" 
          />
          <Text style={[
            styles.tabLabel, 
            styles.activeTabLabel,
            {
              fontSize: layoutConfig.tabBar.labelSize,
              marginTop: layoutConfig.tabBar.labelMarginTop,
            }
          ]}>{t('keypad')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabItem,
            {
              paddingBottom: hasHomeButton ? 1 : 15,
            }
          ]}
          onPressIn={() => {
            const timer = setTimeout(() => {
              handleVoicemailLongPress();
            }, 1000);
            setVoicemailLongPressTimer(timer);
          }}
          onPressOut={() => {
            if (voicemailLongPressTimer) {
              clearTimeout(voicemailLongPressTimer);
              setVoicemailLongPressTimer(null);
            }
          }}
        >
          <SFSymbol 
            name="recordingtape" 
            size={layoutConfig.tabBar.iconSize} 
            color="rgba(255,255,255,0.6)" 
            weight="regular" 
          />
          <Text style={[
            styles.tabLabel,
            {
              fontSize: layoutConfig.tabBar.labelSize,
              marginTop: layoutConfig.tabBar.labelMarginTop,
            }
          ]}>{t('voicemail')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ========================================================================================
// 🟢 트릭 카메라 컴포넌트
// ========================================================================================

const TrickCameraScreen = ({ onClose, vibrationEnabled }: {
  onClose: () => void;
  vibrationEnabled: boolean;
}) => {
  const [isActive, setIsActive] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState('checking');
  const [device, setDevice] = useState<any>(null);
  const [captured, setCaptured] = useState(false);
  const cameraRef = useRef<any>(null);

  // 카메라 디바이스 로드
  useEffect(() => {
    const loadCameraDevice = async () => {
      if (!isCameraAvailable) {
        console.log('❌ 카메라 라이브러리 사용 불가');
        return;
      }
      
      try {
        const { Camera } = require('react-native-vision-camera');
        
        console.log('📷 카메라 권한 체크');
        let permission = await Camera.getCameraPermissionStatus();
        
        if (permission === 'denied' || permission === 'not-determined') {
          permission = await Camera.requestCameraPermission();
        }
        
        setPermissionStatus(permission);
        
        if (permission === 'granted') {
          const devices = await Camera.getAvailableCameraDevices();
          const backDevice = devices.find((device: any) => device.position === 'back');
          const selectedDevice = backDevice || devices[0];
          
          console.log(`✅ 카메라 디바이스 선택: ${selectedDevice?.name || 'Unknown'}`);
          setDevice(selectedDevice);
        }
        
      } catch (error) {
        console.log('❌ 카메라 초기화 실패:', error);
        setPermissionStatus('error');
      }
    };

    loadCameraDevice();
  }, []);

  // 무음 촬영 함수
  const takeSilentPhoto = async () => {
    if (captured || isCapturing || !cameraRef.current || !device || permissionStatus !== 'granted') {
      console.log('❌ 촬영 조건 불충족');
      if (vibrationEnabled) {
        Vibration.vibrate(300);
      }
      return;
    }

    try {
      setIsCapturing(true);
      setCaptured(true);

      console.log('📸 촬영 시작');

      // 성공 피드백
      if (vibrationEnabled) {
        if (Platform.OS === 'ios') {
          Vibration.vibrate([0, 100, 50, 100]);
        } else {
          Vibration.vibrate([100, 50, 100]);
        }
      }

      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'speed',
        skipMetadata: true,
        flash: 'off',
        enableShutterSound: false,
      });

      if (photo?.path) {
        console.log(`✅ 촬영 성공: ${photo.path}`);
        
        // 저장 시도
        if (CameraRoll) {
          try {
            await CameraRoll.saveAsset(photo.path, {
              type: 'photo',
              album: 'MagicKeypad'
            });
            console.log('✅ 사진 저장 성공');
          } catch (saveError) {
            console.log('❌ 사진 저장 실패:', saveError);
          }
        }
      }

      // 2초 후 종료
      setTimeout(() => {
        console.log('📸 촬영 완료 - 화면 종료');
        onClose();
      }, 2000);

    } catch (error) {
      console.log('❌ 촬영 실패:', error);
      
      if (vibrationEnabled) {
        Vibration.vibrate([300, 100, 300, 100, 300]);
      }
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } finally {
      setIsCapturing(false);
    }
  };

  // 더블 탭 감지
  const handleScreenTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    if (lastTapTime && (now - lastTapTime) < DOUBLE_PRESS_DELAY) {
      takeSilentPhoto();
      setLastTapTime(0);
    } else {
      setLastTapTime(now);
      
      if (vibrationEnabled) {
        if (Platform.OS === 'ios') {
          Vibration.vibrate([0, 30]);
        } else {
          Vibration.vibrate(30);
        }
      }
    }
  };

  // 권한 거부된 경우
  if (permissionStatus === 'denied') {
    return (
      <View style={styles.cameraContainer}>
        <StatusBar hidden={true} />
        <TouchableOpacity
          style={styles.blackScreen}
          onPress={onClose}
          activeOpacity={1}
        >
          <View style={styles.cameraStatusDot}>
            <View style={[styles.dot, styles.redDot]} />
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // 정상적인 무음 카메라 모드
  return (
    <View style={styles.cameraContainer}>
      <StatusBar hidden={true} />
      
      {/* 숨겨진 카메라 */}
      {device && permissionStatus === 'granted' && CameraView && (
        <CameraView
          ref={cameraRef}
          style={styles.hiddenCamera}
          device={device}
          isActive={isActive && !captured}
          photo={true}
          onError={(error) => {
            console.log('❌ 카메라 에러:', error);
            setTimeout(() => onClose(), 2000);
          }}
          onInitialized={() => {
            console.log('✅ 카메라 초기화 완료');
          }}
        />
      )}
      
      {/* 완전 검정 화면 + 터치 감지 */}
      <TouchableOpacity 
        style={styles.blackScreen}
        onPress={handleScreenTap}
        activeOpacity={1}
      >
        {/* 왼쪽 상단 터치 영역 (수동 종료용) */}
        <TouchableOpacity
          style={styles.exitTouchArea}
          onPress={onClose}
          activeOpacity={1}
        >
          <View style={styles.cameraStatusDot}>
            <View style={[
              styles.dot,
              captured ? styles.greenDot : styles.blueDot
            ]} />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};

// ========================================================================================
// 🟢 설정 화면 컴포넌트
// ========================================================================================

const SettingsScreen = ({ 
  shortcuts, 
  vibrationEnabled, 
  cameraEnabled, 
  directCallEnabled, 
  language,
  isCameraAvailable, 
  isCameraRollAvailable, 
  onSave, 
  onClose,
  t,
  hasHomeButton,
  screenSize,
  screenType,
  keySize,
  deviceModel
}: {
  shortcuts: { targetPhone: string; unknownPhone: string; sharp: string; star: string; call: string };
  vibrationEnabled: boolean;
  cameraEnabled: boolean;
  directCallEnabled: boolean;
  language: string;
  isCameraAvailable: boolean;
  isCameraRollAvailable: boolean;
  onSave: (shortcuts: { targetPhone: string; unknownPhone: string; sharp: string; star: string; call: string }, vibration: boolean, camera: boolean, directCall: boolean, language: string) => void;
  onClose: () => void;
  t: (key: string, params?: Record<string, string>) => string;
  hasHomeButton: boolean;
  screenSize: string;
  screenType: string;
  keySize: number;
  deviceModel: string;
}) => {
  const [newShortcuts, setNewShortcuts] = useState(shortcuts);
  const [newVibrationEnabled, setNewVibrationEnabled] = useState(vibrationEnabled);
  const [newCameraEnabled, setNewCameraEnabled] = useState(cameraEnabled);
  const [newLanguage, setNewLanguage] = useState(language);

  const handleSave = () => {
    onSave(newShortcuts, newVibrationEnabled, newCameraEnabled, directCallEnabled, newLanguage);
    onClose();
  };

  return (
    <View style={styles.settingsContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <View style={styles.settingsHeader}>
        <Text style={[styles.settingsTitle, { fontSize: titleFontSize }]}>{t('settings')}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.closeButton, { fontSize: baseFontSize + 2 }]}>{t('done')}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.settingsContent}
          contentContainerStyle={{ paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
        >
          {/* 언어 설정 섹션 */}
          <View style={styles.settingSection}>
            <Text style={styles.sectionTitle}>{t('languageSettings')}</Text>
            <LanguageDropdown 
              language={newLanguage}
              onLanguageChange={setNewLanguage}
              t={t}
            />
          </View>

          {/* 단축어 다운로드 섹션 */}
          <View style={styles.settingSection}>
            <Text style={styles.sectionTitle}>{t('shortcuts')}</Text>
            <TouchableOpacity 
              style={styles.shortcutDownloadBox}
              onPress={() => {
                Linking.openURL('https://www.icloud.com/shortcuts/0d0f8d4315ec49139e152adc98cb7488')
                  .catch(err => console.log('링크 열기 실패'));
              }}
            >
              <View style={styles.shortcutDownloadContent}>
                <View style={styles.shortcutIcon}>
                  <Text style={styles.shortcutIconText}>⚡</Text>
                </View>
                <View style={styles.shortcutInfo}>
                  <Text style={styles.shortcutTitle}>{t('shortcutDownload')}</Text>
                  <Text style={styles.shortcutDesc}>
                    {t('shortcutDesc')}
                  </Text>
                </View>
                <View style={styles.shortcutArrow}>
                  <Text style={styles.shortcutArrowText}>→</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* 바로전화 모드 안내 */}
          <View style={styles.settingSection}>
            <Text style={[styles.sectionTitle, { fontSize: titleFontSize - 4 }]}>{t('directCallMode')}</Text>
            <View style={styles.vibrationSetting}>
              <View style={styles.autoProcessLabelContainer}>
                <Text style={[styles.vibrationLabel, { fontSize: baseFontSize }]}>
                  {t('directCallToggle', { status: directCallEnabled ? t('on') : t('off') })}
                </Text>
                <Text style={[styles.autoProcessDesc, { fontSize: descFontSize }]}>
                  {t('directCallDesc')}
                </Text>
              </View>
            </View>
          </View>

          {/* 트릭카메라 설정 */}
          <View style={styles.settingSection}>
            <Text style={styles.sectionTitle}>{t('trickCamera')}</Text>
            
            <TouchableOpacity 
              style={[
                styles.vibrationSetting,
                (!isCameraAvailable || !isCameraRollAvailable) && styles.disabledSetting
              ]}
              onPress={() => {
                if (isCameraAvailable && isCameraRollAvailable) {
                  setNewCameraEnabled(!newCameraEnabled);
                } else {
                  Alert.alert('🎥 트릭 카메라', '현재 카메라 라이브러리가 없습니다.\nCamera 라이브러리를 추가하면 실제 기능이 활성화됩니다.', [
                    { text: '확인', style: 'default' }
                  ]);
                }
              }}
            >
              <View style={styles.autoProcessLabelContainer}>
                <Text style={[
                  styles.vibrationLabel,
                  (!isCameraAvailable || !isCameraRollAvailable) && styles.disabledLabel
                ]}>
                  {t('cameraAutoStart')} {(!isCameraAvailable || !isCameraRollAvailable) && '(Mock 모드)'}
                </Text>
                <Text style={styles.autoProcessDesc}>
                  {t('cameraDesc')}
                </Text>
              </View>
              <View style={[
                styles.toggleSwitch, 
                newCameraEnabled && isCameraAvailable && isCameraRollAvailable && styles.toggleActive,
                (!isCameraAvailable || !isCameraRollAvailable) && styles.disabledToggle
              ]}>
                <View style={[
                  styles.toggleSlider, 
                  newCameraEnabled && isCameraAvailable && isCameraRollAvailable && styles.sliderActive
                ]} />
              </View>
            </TouchableOpacity>
          </View>

          {/* 진동 설정 */}
          <View style={styles.settingSection}>
            <Text style={styles.sectionTitle}>{t('vibrationSettings')}</Text>
            <TouchableOpacity 
              style={styles.vibrationSetting}
              onPress={() => setNewVibrationEnabled(!newVibrationEnabled)}
            >
              <View style={styles.autoProcessLabelContainer}>
                <Text style={styles.vibrationLabel}>{t('vibrationFeedback')}</Text>
                <Text style={styles.autoProcessDesc}>
                  {t('vibrationDesc')}
                </Text>
              </View>
              <View style={[styles.toggleSwitch, newVibrationEnabled && styles.toggleActive]}>
                <View style={[styles.toggleSlider, newVibrationEnabled && styles.sliderActive]} />
              </View>
            </TouchableOpacity>
          </View>

          {/* 전화번호 설정 */}
          <View style={styles.settingSection}>
            <Text style={styles.sectionTitle}>{t('phoneSettings')}</Text>
            
            <View style={styles.shortcutInputGroup}>
              <Text style={styles.shortcutLabel}>{t('targetPhone')}</Text>
              <TextInput
                style={styles.shortcutInput}
                value={newShortcuts.targetPhone}
                onChangeText={(text) => setNewShortcuts(prev => ({...prev, targetPhone: text}))}
                placeholder={t('targetPhonePlaceholder')}
                placeholderTextColor="#8E8E93"
                keyboardType="default"
                returnKeyType="next"
                blurOnSubmit={false}
              />
              <Text style={styles.functionDesc}>
                {t('targetPhoneDesc')}
              </Text>
            </View>

            <View style={[styles.shortcutInputGroup, { marginTop: 15 }]}>
              <Text style={styles.shortcutLabel}>{t('unknownPhone')}</Text>
              <TextInput
                style={styles.shortcutInput}
                value={newShortcuts.unknownPhone}
                onChangeText={(text) => setNewShortcuts(prev => ({...prev, unknownPhone: text}))}
                placeholder={t('unknownPhonePlaceholder')}
                placeholderTextColor="#8E8E93"
                keyboardType="default"
                returnKeyType="done"
                blurOnSubmit={true}
              />
              <Text style={styles.functionDesc}>
                {t('unknownPhoneDesc')}
              </Text>
            </View>
          </View>

          <View style={styles.helpText}>
            <Text style={styles.helpTitle}>{t('helpTitle')}</Text>
            <Text style={styles.helpContent}>
              {t('helpContent', {
                contactSearchStatus: hasHomeButton ? t('contactSearchDisabled') : t('contactSearchEnabled'),
                screenSize: screenSize,
                screenType: screenType,
                homeButton: hasHomeButton ? t('hasHomeButton') : t('noHomeButton'),
                keySize: keySize.toString(),
                deviceModel: deviceModel,
                cameraStatus: isCameraAvailable ? t('available') : t('unavailable'),
                storageStatus: isCameraRollAvailable ? t('available') : t('unavailable')
              })}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ========================================================================================
// 🟢 스타일시트
// ========================================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  displayContainer: {
    paddingHorizontal: 0,
    position: 'relative',
    alignItems: 'center',
  },
  numberDisplay: {
    fontSize: fontSizes.numberDisplay,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  addNumberText: {
    fontSize: baseFontSize,
    color: '#007AFF',
    fontWeight: '400',
  },
  addContactButton: {
    position: 'absolute',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactMatchContainer: {
    marginTop: 0,
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  primaryContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: 'transparent',
    borderRadius: 12,
    marginBottom: 2,
    width: '90%',
  },
  additionalContactsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 15,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderTopWidth: 0.33,
    borderTopColor: '#333333',
    marginTop: 2,
    width: '90%',
  },
  contactIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactSingleLine: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '400',
  },
  keypadContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: hasHomeButton ? 0 : 0,
    marginBottom: 0,
  },
  keypad: {
    alignItems: 'center',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  key: {
    width: keySize,
    height: keySize,
    borderRadius: keySize / 2,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyNumber: {
    fontSize: fontSizes.keyNumber,
    fontWeight: '650',
    color: '#FFFFFF',
  },
  keyLetters: {
    fontSize: fontSizes.keyLetters,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: 2,
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
    position: 'relative',
  },
  callButton: {
    width: keySize,
    height: keySize,
    borderRadius: keySize / 2,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 0,
    backgroundColor: '#000000',
  },
  tabItem: {
    alignItems: 'center',
    padding: 3,
  },
  activeTabItem: {},
  tabLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '400',
  },
  activeTabLabel: {
    color: '#007AFF',
  },
  statusIndicator: {
    position: 'absolute',
    top: -8,
    left: '30%',
    marginLeft: -1.5,
  },
  statusDot: {
    width: 2,
    height: 2,
    borderRadius: 1.5,
    backgroundColor: '#666666',
  },
  // 카메라 화면 스타일
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  blackScreen: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  hiddenCamera: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  exitTouchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  cameraStatusDot: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  blueDot: {
    backgroundColor: '#007AFF',
  },
  greenDot: {
    backgroundColor: '#34C759',
  },
  redDot: {
    backgroundColor: '#FF3B30',
  },
  // 설정 화면 스타일
  settingsContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 60,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333333',
  },
  settingsTitle: {
    fontSize: titleFontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    fontSize: baseFontSize + 2,
    color: '#007AFF',
    fontWeight: '500',
  },
  settingsContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  settingSection: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  vibrationSetting: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vibrationLabel: {
    color: '#FFFFFF',
    fontSize: baseFontSize,
  },
  autoProcessLabelContainer: {
    flex: 1,
    marginRight: 15,
  },
  autoProcessDesc: {
    color: '#8E8E93',
    fontSize: descFontSize,
    marginTop: 4,
    lineHeight: 16,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    backgroundColor: '#333333',
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#34C759',
  },
  toggleSlider: {
    width: 26,
    height: 26,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
  },
  sliderActive: {
    alignSelf: 'flex-end',
  },
  shortcutInputGroup: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 15,
  },
  shortcutLabel: {
    fontSize: baseFontSize,
    color: '#8E8E93',
    marginBottom: 8,
  },
  shortcutInput: {
    backgroundColor: '#333333',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: baseFontSize,
    marginBottom: 10,
  },
  functionDesc: {
    fontSize: descFontSize,
    color: '#8E8E93',
    lineHeight: 18,
  },
  helpText: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 15,
    marginBottom: 30,
  },
  helpTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: baseFontSize,
  },
  helpContent: {
    color: '#8E8E93',
    fontSize: descFontSize,
    lineHeight: 20,
  },
  shortcutDownloadBox: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  shortcutDownloadContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shortcutIconText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  shortcutInfo: {
    flex: 1,
  },
  shortcutTitle: {
    fontSize: baseFontSize,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  shortcutDesc: {
    fontSize: descFontSize,
    color: '#8E8E93',
    lineHeight: 16,
  },
  shortcutArrow: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortcutArrowText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },
  disabledSetting: {
    opacity: 0.6,
  },
  disabledLabel: {
    color: '#8E8E93',
  },
  disabledToggle: {
    backgroundColor: '#222222',
  },
  // 언어 드롭다운 스타일
  languageSelector: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 15,
  },
  languageSelectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageLabel: {
    fontSize: baseFontSize,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  selectedLanguage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageFlag: {
    fontSize: 18,
    marginRight: 8,
  },
  languageName: {
    fontSize: baseFontSize,
    color: '#8E8E93',
    marginRight: 8,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#8E8E93',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageModal: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    minWidth: 200,
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: baseFontSize + 2,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 5,
  },
  selectedOption: {
    backgroundColor: '#007AFF',
  },
  languageOptionText: {
    fontSize: baseFontSize,
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default MagicKeypad;