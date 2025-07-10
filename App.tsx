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

// 🟢 이 줄이 주석 해제되어 있어야 함
import { SFSymbol } from 'react-native-sfsymbols';


// 🔴 2. 라이브러리 Mock 객체들
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

// 🔴 3. Clipboard Mock → 실제 라이브러리로 교체
try {
  Clipboard = require('@react-native-clipboard/clipboard').default;  // 🟢 활성화
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

// 🔴 4. AsyncStorage Mock → 실제 라이브러리로 교체
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;  // 🟢 활성화
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

// 🟢 수정 후 (주석 해제)
try {
  Contacts = require('react-native-contacts').default;  // 🟢 활성화
  console.log('📞 Contacts library 활성화 성공');
} catch (e) {
  console.warn('📞 Contacts library 비활성화 (Mock 사용)');
}

// 🔴 6. ScreenBrightness Mock
// try {
//   ScreenBrightness = require('react-native-screen-brightness').default;  // 🔴 비활성화
// } catch (e) {
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
// }

// 🔴 7. CalendarEvents Mock
// try {
//   CalendarEvents = require('react-native-calendar-events').default;  // 🔴 비활성화
// } catch (e) {
  console.warn('📅 CalendarEvents library 비활성화 (Mock 사용)');
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
// }

// 🔴 8. 카메라 라이브러리 Mock (비활성화)
// try {
//   const VisionCameraLib = require('react-native-vision-camera');  // 🔴 비활성화
//   if (VisionCameraLib && VisionCameraLib.Camera) {
//     CameraView = VisionCameraLib.Camera;
//     cameraDevicesHook = VisionCameraLib.useCameraDevices;
//     cameraPermissionHook = VisionCameraLib.useCameraPermission;
//     isCameraAvailable = true;
//   }
// } catch (e) {
  console.warn('📸 Camera library 비활성화 (Mock 사용)');
  isCameraAvailable = false;
// }

// 🔴 9. CameraRoll Mock
// try {
//   CameraRoll = require('@react-native-camera-roll/camera-roll').CameraRoll;  // 🔴 비활성화
// } catch (e) {
  console.warn('📷 CameraRoll library 비활성화 (Mock 사용)');
  CameraRoll = null;
// }

// ========================================================================================
// 🟢 여기서부터는 원본 코드와 동일 (라이브러리 관련 부분만 수정됨)
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
• Auto mode: 전화번호 완성 5초 뒤 자동 처리 (항상 활성화) [MOCK 모드]
• 통화 버튼: 캘린더 일정 추가 (단축어 트리거/target phone or unknown phone) [MOCK 모드]
• 즐겨찾기 버튼: 바로전화 모드 토글 (점으로 상태 표시)
• 음성사서함 버튼 길게 누르기: 트릭 카메라 [MOCK 모드]
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

// 홈버튼 유무 감지 (더 정확한 기준)
const hasHomeButton = (() => {
  // iPhone SE 1세대: 320x568
  if (width === 320 && height === 568) return true;
  // iPhone SE 2/3세대, iPhone 6/7/8: 375x667
  if (width === 375 && height === 667) return true;
  // iPhone 6/7/8 Plus: 414x736
  if (width === 414 && height === 736) return true;
  // 기타 홈버튼이 있는 구형 기종들 (높이 750px 이하)
  if (height <= 750) return true;
  // 그 외는 모두 홈버튼 없는 기종
  return false;
})();

// 기종별 크기 계산 함수들 (Pro 모델 포함 정확한 분류)
const getScreenType = () => {
  // iPhone SE 1세대
  if (width === 320 && height === 568) return 'small';
  
  // iPhone SE 2/3세대, iPhone 6/7/8, iPhone X/XS, iPhone 12 mini
  if (width <= 375) return 'medium';
  
  // iPhone 12/13/14, iPhone 15/15 Pro, iPhone 16
  if (width <= 393) return 'standard';
  
  // iPhone 16 Pro (402x874)
  if (width <= 402) return 'standard-pro';
  
  // iPhone 6/7/8 Plus, iPhone 11/XR, iPhone XS Max/11 Pro Max
  if (width <= 414) return 'large';
  
  // iPhone 12/13/14 Pro Max, iPhone 15 Plus
  if (width <= 430) return 'xlarge';
  
  // iPhone 15 Pro Max, iPhone 16 Plus
  if (width <= 440) return 'xxlarge';
  
  // 미래 기종 대응
  return 'xxxlarge';
};

const getLayoutConfig = () => {
  const screenType = getScreenType();
  
  const layoutConfigs = {
    small: {
      // iPhone SE 1세대 (320x568)
      displayContainer: {
        paddingTop: hasHomeButton ? 50 : 80,
        paddingBottom: 8,
        minHeight: 70
      },
      addContactButton: {
        size: 30,
        right: 20,
        top: hasHomeButton ? 85 : 55
      },
      contactMatch: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 12,
        maxHeight: 100
      },
      keypad: {
        marginBottom: hasHomeButton ? 15 : 25,
        keyMargin: 10,
        rowMargin: hasHomeButton ? 14 : 16
      },
      bottomButtons: {
        paddingBottom: hasHomeButton ? 25 : 45,
        marginTop: hasHomeButton ? -5 : -8
      },
      deleteButton: {
        sizeMultiplier: 0.75,
        right: 55
      },
      tabBar: {
        paddingVertical: 5,
        paddingBottom: hasHomeButton ? 0 : 20,
        iconSize: 20,
        labelSize: hasHomeButton ? 8 : 9,
        labelMarginTop: hasHomeButton ? 14 : 13
      }
    },
    medium: {
      // iPhone SE 2/3세대, iPhone 6/7/8, iPhone X/XS, iPhone 12 mini
      displayContainer: {
        paddingTop: hasHomeButton ? 55 : 90,
        paddingBottom: hasHomeButton ? 10 : 8,
        minHeight: hasHomeButton ? 75 : 65
      },
      addContactButton: {
        size: 32,
        right: 22,
        top: hasHomeButton ? 95 : 65
      },
      contactMatch: {
        paddingHorizontal: 22,
        paddingTop: hasHomeButton ? 0 : 10,
        paddingBottom: hasHomeButton ? 0 : 14,
        maxHeight: hasHomeButton ? 0 : 110
      },
      keypad: {
        marginBottom: hasHomeButton ? 18 : 25,
        keyMargin: 11,
        rowMargin: hasHomeButton ? 15 : 17
      },
      bottomButtons: {
        paddingBottom: hasHomeButton ? 28 : 50,
        marginTop: hasHomeButton ? -5 : -8
      },
      deleteButton: {
        sizeMultiplier: 0.78,
        right: 60
      },
      tabBar: {
        paddingVertical: 5,
        paddingBottom: hasHomeButton ? 0 : 22,
        iconSize: 22,
        labelSize: hasHomeButton ? 9 : 10,
        labelMarginTop: hasHomeButton ? 15 : 14
      }
    },
    standard: {
      // iPhone 12/13/14, iPhone 15/15 Pro, iPhone 16
      displayContainer: {
        paddingTop: 95,
        paddingBottom: 0,
        minHeight: 60
      },
      addContactButton: {
        size: 34,
        right: 24,
        top: 68
      },
      contactMatch: {
        paddingHorizontal: 24,
        paddingTop: 0,
        paddingBottom: 10,
        maxHeight: 115
      },
      keypad: {
        marginBottom: 25,
        keyMargin: 12,
        rowMargin: 18
      },
      bottomButtons: {
        paddingBottom: 52,
        marginTop: -15
      },
      deleteButton: {
        sizeMultiplier: 0.80,
        right: 62
      },
      tabBar: {
        paddingVertical: 6,
        paddingBottom: 24,
        iconSize: 24,
        labelSize: 10,
        labelMarginTop: 15
      }
    },
    'standard-pro': {
      // iPhone 16 Pro (402x874)
      displayContainer: {
        paddingTop: 98,
        paddingBottom: 0,
        minHeight: 62
      },
      addContactButton: {
        size: 35,
        right: 25,
        top: 70
      },
      contactMatch: {
        paddingHorizontal: 25,
        paddingTop: 10,
        paddingBottom: 15,
        maxHeight: 118
      },
      keypad: {
        marginBottom: 26,
        keyMargin: 12,
        rowMargin: 18
      },
      bottomButtons: {
        paddingBottom: 54,
        marginTop: -13
      },
      deleteButton: {
        sizeMultiplier: 0.82,
        right: 64
      },
      tabBar: {
        paddingVertical: 6,
        paddingBottom: 25,
        iconSize: 24,
        labelSize: 10,
        labelMarginTop: 15
      }
    },
    large: {
      // iPhone 6/7/8 Plus, iPhone 11/XR, iPhone XS Max/11 Pro Max
      displayContainer: {
        paddingTop: hasHomeButton ? 65 : 100,
        paddingBottom: hasHomeButton ? 12 : 0,
        minHeight: hasHomeButton ? 80 : 65
      },
      addContactButton: {
        size: hasHomeButton ? 36 : 38,
        right: hasHomeButton ? 26 : 28,
        top: hasHomeButton ? 105 : 75
      },
      contactMatch: {
        paddingHorizontal: hasHomeButton ? 26 : 28,
        paddingTop: hasHomeButton ? 0 : 12,
        paddingBottom: hasHomeButton ? 0 : 16,
        maxHeight: hasHomeButton ? 0 : 125
      },
      keypad: {
        marginBottom: hasHomeButton ? 20 : 28,
        keyMargin: hasHomeButton ? 12 : 13,
        rowMargin: hasHomeButton ? 16 : 19
      },
      bottomButtons: {
        paddingBottom: hasHomeButton ? 32 : 56,
        marginTop: hasHomeButton ? -6 : -10
      },
      deleteButton: {
        sizeMultiplier: hasHomeButton ? 0.82 : 0.85,
        right: hasHomeButton ? 64 : 66
      },
      tabBar: {
        paddingVertical: 6,
        paddingBottom: hasHomeButton ? 0 : 26,
        iconSize: hasHomeButton ? 24 : 26,
        labelSize: hasHomeButton ? 9 : 11,
        labelMarginTop: hasHomeButton ? 16 : 16
      }
    },
    xlarge: {
      // iPhone 12/13/14 Pro Max, iPhone 15 Plus
      displayContainer: {
        paddingTop: 105,
        paddingBottom: 0,
        minHeight: 68
      },
      addContactButton: {
        size: 40,
        right: 30,
        top: 78
      },
      contactMatch: {
        paddingHorizontal: 30,
        paddingTop: 12,
        paddingBottom: 18,
        maxHeight: 130
      },
      keypad: {
        marginBottom: 30,
        keyMargin: 14,
        rowMargin: 20
      },
      bottomButtons: {
        paddingBottom: 58,
        marginTop: -12
      },
      deleteButton: {
        sizeMultiplier: 0.88,
        right: 68
      },
      tabBar: {
        paddingVertical: 7,
        paddingBottom: 28,
        iconSize: 26,
        labelSize: 11,
        labelMarginTop: 16
      }
    },
    xxlarge: {
      // iPhone 15 Pro Max, iPhone 16 Plus
      displayContainer: {
        paddingTop: 108,
        paddingBottom: 0,
        minHeight: 70
      },
      addContactButton: {
        size: 42,
        right: 32,
        top: 80
      },
      contactMatch: {
        paddingHorizontal: 32,
        paddingTop: 12,
        paddingBottom: 20,
        maxHeight: 135
      },
      keypad: {
        marginBottom: 32,
        keyMargin: 15,
        rowMargin: 22
      },
      bottomButtons: {
        paddingBottom: 60,
        marginTop: -14
      },
      deleteButton: {
        sizeMultiplier: 0.90,
        right: 70
      },
      tabBar: {
        paddingVertical: 8,
        paddingBottom: 30,
        iconSize: 28,
        labelSize: 12,
        labelMarginTop: 17
      }
    },
    xxxlarge: {
      // 미래 기종 대응
      displayContainer: {
        paddingTop: 115,
        paddingBottom: 0,
        minHeight: 75
      },
      addContactButton: {
        size: 45,
        right: 35,
        top: 85
      },
      contactMatch: {
        paddingHorizontal: 35,
        paddingTop: 15,
        paddingBottom: 22,
        maxHeight: 140
      },
      keypad: {
        marginBottom: 35,
        keyMargin: 16,
        rowMargin: 24
      },
      bottomButtons: {
        paddingBottom: 65,
        marginTop: -16
      },
      deleteButton: {
        sizeMultiplier: 0.92,
        right: 75
      },
      tabBar: {
        paddingVertical: 8,
        paddingBottom: 32,
        iconSize: 30,
        labelSize: 13,
        labelMarginTop: 18
      }
    }
  };
  
  return layoutConfigs[screenType];
};

const getFontSizes = () => {
  const screenType = getScreenType();
  
  const fontConfigs = {
    small: {
      // iPhone SE 1세대 (320x568)
      keyNumber: 22,
      keyLetters: 6,
      numberDisplay: 22,
      title: 16,
      base: 12,
      desc: 9
    },
    medium: {
      // iPhone SE 2/3세대, iPhone 6/7/8, iPhone X/XS, iPhone 12 mini (375x667~812)
      keyNumber: hasHomeButton ? 25 : 27,
      keyLetters: hasHomeButton ? 10 : 10,
      numberDisplay: hasHomeButton ? 35 : 35,
      title: hasHomeButton ? 18 : 20,
      base: hasHomeButton ? 15 : 14,
      desc: hasHomeButton ? 10 : 11
    },
    standard: {
      // iPhone 12/13/14, iPhone 15/15 Pro, iPhone 16 (390~393x844~852)
      keyNumber: 35,
      keyLetters: 9,
      numberDisplay: 37,
      title: 22,
      base: 15,
      desc: 12
    },
    'standard-pro': {
      // iPhone 16 Pro (402x874)
      keyNumber: 35,
      keyLetters: 9,
      numberDisplay: 35,
      title: 23,
      base: 15,
      desc: 12
    },
    large: {
      // iPhone 6/7/8 Plus, iPhone 11/XR, iPhone XS Max/11 Pro Max (414x736~896)
      keyNumber: hasHomeButton ? 30 : 32,
      keyLetters: hasHomeButton ? 10 : 11,
      numberDisplay: hasHomeButton ? 36 : 38,
      title: hasHomeButton ? 23 : 25,
      base: hasHomeButton ? 16 : 17,
      desc: hasHomeButton ? 13 : 14
    },
    xlarge: {
      // iPhone 12/13/14 Pro Max, iPhone 15 Plus (428~430x926~932)
      keyNumber: 33,
      keyLetters: 11,
      numberDisplay: 38,
      title: 26,
      base: 18,
      desc: 15
    },
    xxlarge: {
      // iPhone 15 Pro Max, iPhone 16 Plus (440x956~932)
      keyNumber: 34,
      keyLetters: 12,
      numberDisplay: 42,
      title: 27,
      base: 18,
      desc: 15
    },
    xxxlarge: {
      // 미래 기종 대응
      keyNumber: 36,
      keyLetters: 13,
      numberDisplay: 44,
      title: 28,
      base: 19,
      desc: 16
    }
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
    small: 0.75,           // iPhone SE 1세대
    medium: 0.82,          // iPhone SE 2/3세대, iPhone 6/7/8, iPhone X/XS, iPhone 12 mini
    standard: 0.88,        // iPhone 12/13/14, iPhone 15/15 Pro, iPhone 16
    'standard-pro': 0.90,  // iPhone 16 Pro
    large: 0.93,           // iPhone 6/7/8 Plus, iPhone 11/XR, iPhone XS Max/11 Pro Max
    xlarge: 0.96,          // iPhone 12/13/14 Pro Max, iPhone 15 Plus
    xxlarge: 0.98,         // iPhone 15 Pro Max, iPhone 16 Plus
    xxxlarge: 1.0          // 미래 기종
  };
  
  const keySize = baseKeySize * sizeMultipliers[screenType];
  return Math.max(Math.min(keySize, 85), 60); // 최소 60, 최대 85
};

// 계산된 값들
const keySize = getKeySize();
const fontSizes = getFontSizes();
const layoutConfig = getLayoutConfig();
const titleFontSize = fontSizes.title;
const baseFontSize = fontSizes.base;
const descFontSize = fontSizes.desc;

// 언어 드롭다운 컴포넌트
const LanguageDropdown = ({ 
  language, 
  onLanguageChange, 
  t 
}: { 
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
  // 🆕 초기화 관련 상태 (간소화 - 카메라 자동시작 비활성화)
  const [isInitializing, setIsInitializing] = useState(false);
  const [showInitialBlackScreen, setShowInitialBlackScreen] = useState(false);

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
  const [language, setLanguage] = useState('ko'); // 기본 언어는 한국어
  
  // 애니메이션 관련 상태
  const [numberFadeAnim] = useState(new Animated.Value(0));
  const [elementsFadeAnim] = useState(new Animated.Value(0));
  const [isFirstInput, setIsFirstInput] = useState(true);

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

  // 🆕 간소화된 초기화
  useEffect(() => {
    console.log('🚀 앱 초기화 시작 (Mock 모드)');
    loadSettings();
  }, []);

  // 전화번호 완성 여부 체크 함수
  const checkPhoneNumberComplete = (number: string): boolean => {
    const numbersOnly = number.replace(/[^0-9]/g, '');
    return numbersOnly.length >= 7 && numbersOnly.length <= 15;
  };

  // 자동 처리 체크 및 타이머 설정
  const handleAutoProcessCheck = () => {
    if (autoProcessTimer) {
      clearTimeout(autoProcessTimer);
      setAutoProcessTimer(null);
    }

    if (!checkPhoneNumberComplete(currentNumber)) {
      return;
    }

    console.log('⏰ Auto mode 5초 타이머 시작 (Mock 모드)');
    const timer = setTimeout(() => {
      performAutoProcess();
    }, 5000);

    setAutoProcessTimer(timer);
  };

  // 자동 처리 실행 (Mock 버전)
  const performAutoProcess = async () => {
    if (!checkPhoneNumberComplete(currentNumber)) {
      return;
    }
    
    try {
      if (directCallEnabled) {
        // 바로모드 ON: 타겟번호 클립보드 복사 + 타겟번호의 연락처 수정
        if (shortcuts.targetPhone.trim()) {
          await Clipboard.setString(shortcuts.targetPhone);
          console.log('✅ Auto mode: 타겟번호 클립보드 복사 (Mock)');
        }
        
        console.log('✅ Auto mode: 타겟번호 연락처 편집 완료 (Mock)');
        
        // 성공 진동 피드백
        if (vibrationEnabled) {
          if (Platform.OS === 'ios') {
            Vibration.vibrate([0, 100, 50, 100]);
          } else {
            Vibration.vibrate([100, 50, 100]);
          }
        }
      } else {
        // 바로모드 OFF: 통화버튼 클릭 횟수에 따라 결정
        if (callButtonClickCount === 0) {
          // 통화버튼 눌린 후: 타겟번호 처리
          if (shortcuts.targetPhone.trim()) {
            await Clipboard.setString(shortcuts.targetPhone);
            console.log('✅ Auto mode: 타겟번호 클립보드 복사 (Mock)');
          }
          
          console.log('✅ Auto mode: 타겟번호 연락처 편집 완료 (Mock)');
          
          // 성공 진동 피드백
          if (vibrationEnabled) {
            if (Platform.OS === 'ios') {
              Vibration.vibrate([0, 100, 50, 100]);
            } else {
              Vibration.vibrate([100, 50, 100]);
            }
          }
        } else {
          // 통화버튼 안 눌린 상태: 없는번호 처리
          if (shortcuts.unknownPhone.trim()) {
            await Clipboard.setString(shortcuts.unknownPhone);
            console.log('✅ Auto mode: 없는번호 클립보드 복사 (Mock)');
          }
          
          console.log('✅ Auto mode: 없는번호 연락처 편집 완료 (Mock)');
          
          // 성공 진동 피드백
          if (vibrationEnabled) {
            if (Platform.OS === 'ios') {
              Vibration.vibrate([0, 100, 50, 100]);
            } else {
              Vibration.vibrate([100, 50, 100]);
            }
          }
        }
      }
      
    } catch (error) {
      console.log('❌ Auto mode 실행 실패:', error);
    }
  };

  // 번호 변경시 연락처 매칭 및 자동 처리 체크 (간소화)
  useEffect(() => {
    // 홈버튼이 없는 기종에서만 연락처 매칭 시도 (Mock 모드에서는 빈 배열)
    if (!hasHomeButton && currentNumber) {
      setMatchedContacts([]); // Mock 모드에서는 항상 빈 배열
    } else {
      setMatchedContacts([]);
    }
    
    // 항상 자동 처리 활성화
    handleAutoProcessCheck();
  }, [currentNumber, directCallEnabled, callButtonClickCount]);

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

  const loadSettings = async () => {
    try {
      console.log('📄 설정 로드 중... (Mock 모드)');
      // Mock 설정 로드
      console.log('✅ 설정 로드 완료 (Mock 모드)');
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
      console.log('💾 설정 저장 중... (Mock 모드)');
      setShortcuts(newShortcuts);
      setVibrationEnabled(newVibrationEnabled);
      setCameraEnabled(newCameraEnabled);
      setDirectCallEnabled(newDirectCallEnabled);
      setLanguage(newLanguage);
      console.log('✅ 설정 저장 완료 (Mock 모드)');
    } catch (error) {
      console.log('❌ 설정 저장 실패:', error);
    }
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

  // 📞 버튼: 캘린더에 조건별 일정 추가 + 2초 후 입력창 지우기 + 통화버튼 클릭 카운트 감소 (Mock)
  const setBrightnessToFixed = async () => {
    try {
      // 캘린더 일정 제목 결정
      let eventTitle = 'target phone'; // 기본값
      
      if (directCallEnabled) {
        // 바로전화 모드 ON: 항상 "타겟"
        eventTitle = 'target phone';
      } else {
        // 바로전화 모드 OFF: 통화버튼 클릭 횟수에 따라 결정
        if (callButtonClickCount === 1) {
          // 점이 있는 상태 (첫 번째 클릭) → "없는 번호"
          eventTitle = 'unknown phone';
        } else {
          // 점이 없는 상태 (두 번째 이후 클릭) → "타겟 번호"  
          eventTitle = 'target phone';
        }
      }
      
      // 바로전화 모드 OFF일 때만 클릭 카운트 감소 (1 → 0)
      if (!directCallEnabled && callButtonClickCount > 0) {
        setCallButtonClickCount(prev => prev - 1);
      }
      
      // 캘린더 일정 추가 (Mock)
      console.log(`📅 캘린더 일정 추가: ${eventTitle} (Mock 모드)`);
      
      // 진동 피드백
      if (vibrationEnabled) {
        if (Platform.OS === 'ios') {
          Vibration.vibrate([0, 50]);
        } else {
          Vibration.vibrate(100);
        }
      }
      
      // 2초 후 입력창 지우기
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

  // 음성사서함 버튼 길게 누르기 (트릭 카메라 실행) - Mock 알림
  const handleVoicemailLongPress = async () => {
    console.log('🎥 트릭 카메라 모드 (Mock 모드)');
    Alert.alert('🎥 트릭 카메라', '트릭 카메라 기능이 Mock 모드로 실행됩니다.\n실제 카메라 라이브러리를 추가하면 정상 작동합니다.', [
      { text: '확인', style: 'default' }
    ]);
  };

  // 연락처 버튼 길게 누르기 (설정창 진입)
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

  // '0' 버튼 길게 누르기 (+ 입력)
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
    // 설정을 즉시 저장
    saveSettings(shortcuts, vibrationEnabled, cameraEnabled, directCallEnabled, newLanguage);
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
              // 점진적 크기 조정 - 더 자연스럽게
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

      {/* 연락처 매칭 영역 (홈버튼이 없는 기종만) - Mock 모드에서는 비어있음 */}
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
          {/* Mock 모드에서는 연락처 매칭 결과가 없음 */}
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
                  <SFSymbol 
                    name="delete.left"
                    size={keySize * 0.33} 
                    color="#FFFFFF" 
                    weight="medium" 
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
            // 즐겨찾기 버튼: 바로전화 모드 토글
            setDirectCallEnabled(prev => {
              const newMode = !prev;
              // 바로전화 OFF로 변경될 때 통화버튼 카운트를 1로 설정
              if (!newMode) {
                setCallButtonClickCount(1);
              }
              
              // 진동 피드백
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
          {/* 바로전화 OFF이고 통화버튼 클릭 카운트가 1일 때만 상태 점 표시 */}
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
        
        {/* 연락처 버튼 - 설정 화면 진입 */}
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
        
        {/* 음성사서함 버튼 - 카메라 기능 */}
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

// 설정 화면 컴포넌트
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

        {/* 트릭카메라 오토 기능 설정 (Mock 모드 안내) */}
        <View style={styles.settingSection}>
          <Text style={styles.sectionTitle}>{t('trickCamera')}</Text>
          
          <TouchableOpacity 
            style={[
              styles.vibrationSetting,
              (!isCameraAvailable || !isCameraRollAvailable) && styles.disabledSetting
            ]}
            onPress={() => {
              Alert.alert('🎥 트릭 카메라', '현재 Mock 모드입니다.\nCamera 라이브러리를 추가하면 실제 기능이 활성화됩니다.', [
                { text: '확인', style: 'default' }
              ]);
            }}
          >
            <View style={styles.autoProcessLabelContainer}>
              <Text style={[
                styles.vibrationLabel,
                (!isCameraAvailable || !isCameraRollAvailable) && styles.disabledLabel
              ]}>
                {t('cameraAutoStart')} (Mock 모드)
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
          
          {/* 편집할 대상 전화번호 */}
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

          {/* 없는번호 (항상 표시) */}
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