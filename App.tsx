import React, { useState, useEffect, useRef, useCallback} from 'react';
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
// 📚 라이브러리 IMPORT 및 설정
// ========================================================================================

// ✅ SFSymbol 활성화
import { SFSymbol } from 'react-native-sfsymbols';

// 📦 라이브러리 변수 선언
let Clipboard: any;
let AsyncStorage: any;
let Contacts: any;
let CalendarEvents: any;

// 📸 카메라 관련 변수
let CameraView: any = null;
let cameraDevicesHook: any = () => ({ back: null, front: null });
let cameraPermissionHook: any = () => ({ hasPermission: false, requestPermission: () => Promise.resolve('denied') });
let CameraRoll: any = null;
let isCameraAvailable = false;

// ✅ Clipboard 라이브러리 로드
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

// ✅ AsyncStorage 라이브러리 로드
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

// ✅ Contacts 라이브러리 로드
try {
  Contacts = require('react-native-contacts').default;
  console.log('📞 Contacts library 활성화 성공:', !!Contacts);
  console.log('📞 Contacts methods:', Object.keys(Contacts || {}));
} catch (e) {
  console.warn('📞 Contacts library 비활성화 (Mock 사용):', e.message);
  Contacts = null;
}

// ✅ CalendarEvents 라이브러리 로드
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

// ✅ VisionCamera 라이브러리 로드
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

// ✅ CameraRoll 라이브러리 로드
try {
  CameraRoll = require('@react-native-camera-roll/camera-roll').CameraRoll;
  console.log('📷 CameraRoll library 활성화 성공:', !!CameraRoll);
} catch (e) {
  console.warn('📷 CameraRoll library 비활성화 (Mock 사용):', e.message);
  CameraRoll = null;
}

// ========================================================================================
// 🌍 다국어 및 UI 설정
// ========================================================================================

// 다국어 텍스트 정의
const translations = {
  ko: {
   // 하단 탭 (기본)
   favorites: '즐겨찾기',
   recents: '최근 통화',
   contacts: '연락처',
   keypad: '키패드',
   voicemail: '음성 사서함',
   
   // 하단 탭 (기본모드 전용)
   favoritesDefault: '바로전화',
   recentsDefault: '미사용',
   contactsDefault: '설정(3초)',
   keypadDefault: '정보',
   voicemailDefault: '퀵카메라(1초)',
 
   // 메인 화면
   addNumber: '번호 추가',
 
   // 설정 화면
   settings: 'Settings',
   done: '완료',
   shortcuts: '단축어',
   shortcutDownload: '단축어 & Lecture 보러가기',
   shortcutDesc: '전화를 걸어주는 단축어와 자세한 사용법을 확인하세요',

   // 설정창 자동 시작
   settingsAutoStart: '⚙️ 설정창 자동 시작',
   settingsAutoStartToggle: '앱 시작 시 설정창 열기',
   settingsAutoStartDesc: `ON: 앱 실행 시 즉시 설정창으로 시작됩니다
 • 퀵카메라와 동시에 ON인 경우 설정창이 우선됩니다
 • 설정을 자주 변경하는 경우 유용합니다`,
 
   // 바로전화 모드
   directCallMode: '📞 바로전화 모드',
   directCallToggle: '즐겨찾기 버튼으로 토글 (현재: {status})',
   directCallDesc: `즐겨찾기 버튼을 누르면 바로전화 모드가 ON ↔ OFF로 토글됩니다
 • 점 없음: 바로전화 모드 ON
 • 점 있음: 바로전화 모드 OFF`,
 
   // 퀵 카메라
   quickCamera: '📷 퀵 카메라',
   cameraAutoStart: '퀵 카메라 자동 시작 기능',
   cameraDesc: `ON: 앱 실행 시 즉시 퀵카메라 화면으로 시작됩니다
 • 음성사서함 버튼 1초 이상 누르기는 이 설정과 무관하게 항상 사용 가능합니다
 • 검정 화면을 더블 탭하면 완전 무음으로 사진이 촬영됩니다
 • 왼쪽 상단에 작은 점으로만 상태 표시 (파란색=대기, 녹색=완료)
 • 촬영 완료 후 2초 뒤 키패드로 자동 복귀합니다
 • 왼쪽 상단 영역을 터치하면 언제든 수동으로 종료하여 키패드로 이동 가능합니다`,

   // 카메라 모드 (새로 추가)
   cameraMode: '카메라 모드',
   selectCameraMode: '카메라 모드를 선택하세요',
   cameraNormalMode: '일반 모드',
   cameraBlackMode: '다크 모드',
   cameraModeDesc: `일반 모드: 실제 카메라 화면을 보면서 촬영 (화면 터치로 촬영)
다크 모드: 완전한 검정 화면으로 촬영 (더블탭으로 촬영)`,

   // 기존 텍스트 수정
   cameraBlackModeDesc: `카메라 촬영 방식을 선택할 수 있습니다.`,
 
   // 진동 설정
   vibrationSettings: '📳 진동 설정',
   vibrationFeedback: '전체 진동 피드백',
   vibrationDesc: `📳 ON: 모든 기능에서 진동 피드백 활성화
 • Auto mode 실행 시 진동
 • 즐겨찾기 버튼 토글 시 진동
 • 퀵 카메라 기능 사용 시 진동
 • 통화 버튼 클릭 시 진동
 
 📳 OFF: 모든 진동 비활성화`,
 
   // 언어 설정
   languageSettings: '🌍 언어 설정',
   language: '언어',
   selectLanguage: '언어를 선택하세요',
 
   // 테마 설정
   themeSettings: '🎨 테마 설정',
   themeLabel: '앱 테마',
   themeDesc: '다크모드와 라이트모드를 선택하실수있습니다.',
   defaultTheme: '설명모드',
   darkOriginalTheme: '다크모드',
   lightTheme: '라이트모드',
   selectTheme: '테마를 선택하세요',
 
   // 전화번호 설정
   phoneSettings: '전화번호 설정',
   targetPhone: 'target phone',
   targetPhonePlaceholder: '예: 010-1234-5678',
   targetPhoneDesc: `• 바로전화 모드가 ON일때: TargetPhone으로 전화를 겁니다.
 • 바로전화 모드가 OFF일때: 통화버튼을 누르면 바로전화모드가 켜집니다.`,
   unknownPhone: 'unknown phone',
   unknownPhonePlaceholder: '예: 010-9999-9999',
   unknownPhoneDesc: '바로전화 모드가 OFF일때: 통화버튼을 누르면 UnknownPhone으로 전화를 건뒤 바로전화모드가 켜집니다.',
 
   // 도움말
   helpTitle: '✅ 현재 사용 가능한 기능들',
   helpContent: `• 설정 화면: 연락처 버튼 3초간 누르기
 • Auto mode: 전화번호 완성 5초 뒤 자동 처리 (항상 활성화)
 • 통화 버튼: 타겟 번호 혹은 없는 번호 전화
 • 즐겨찾기 버튼: 바로전화 모드 토글 (점으로 상태 표시)
 • 음성사서함 버튼 길게 누르기: 퀵 카메라
 • 진동 피드백: 모든 주요 기능에서 햅틱 지원
 
 📞 바로전화 모드 토글:
 • 점 없음 = 바로전화 ON: "target phone" 
 • 점 있음 = 바로전화 OFF: "unknown phone" → "target phone" 순서
 
 📷 Quick Camera:
 • 검정 화면을 빠르게 두 번 탭하여 무음 촬영
 • 왼쪽 상단 작은 점: 파란색(대기) → 녹색(완료)
 • 2초 후 자동 키패드 복귀
 
 ♾️ Auto mode (항상 활성화):
 • 7자리 이상 전화번호 완성시 5초 후 자동으로 값을 가져옵니다.
 
 📱 디바이스 정보:
 • 화면 크기: {screenSize}
 • 화면 타입: {screenType}
 • 홈버튼: {homeButton}
 • 키 크기: {keySize}px
 • 예상 기종: {deviceModel}
 • 카메라: {cameraStatus} | 저장: {storageStatus}`,
 
   // 권한 관련
   permissionDenied: '권한이 거부되었습니다',
   permissionRequired: '권한이 필요합니다',
   retryPermission: '권한을 다시 요청하시겠습니까?',
   grantPermission: '권한 허용',
   skipPermission: '건너뛰기',
 
   // 기타
   on: 'ON',
   off: 'OFF',
   hasHomeButton: '있음',
   noHomeButton: '없음',
   contactSearchDisabled: '홈버튼 있는 기종은 비활성화 (번호 추가 텍스트만 표시)',
   contactSearchEnabled: 'T9 방식 이름 검색 활성화 (연락처 매칭 및 추가 버튼)',
   available: '✅',
   unavailable: '❌',
 },
 en: {
   // Bottom Tab (기본)
   favorites: 'Favorites',
   recents: 'Recents',
   contacts: 'Contacts',
   keypad: 'Keypad',
   voicemail: 'Voicemail',
   
   // Bottom Tab (기본모드 전용)
   favoritesDefault: 'Direct Call',
   recentsDefault: 'Unused',
   contactsDefault: 'Settings(3s)',
   keypadDefault: 'Info',
   voicemailDefault: 'Camera(1s)',
 
   // Main Screen
   addNumber: 'Add Number',
 
   // Settings Screen
   settings: 'Settings',
   done: 'Done',
   shortcuts: 'Shortcuts',
   shortcutDownload: 'Shortcuts & Lecture',
   shortcutDesc: 'Download shortcuts and check detailed usage guide',

   // Settings Auto Start
   settingsAutoStart: '⚙️ Settings Auto Start',
   settingsAutoStartToggle: 'Open settings on app start',
   settingsAutoStartDesc: `ON: Launches the settings screen immediately on app start
 • If both Quick Camera and Settings Auto Start are ON, Settings takes priority
 • Useful when frequently changing settings`,
 
   // Direct Call Mode
   directCallMode: '📞 Direct Call Mode',
   directCallToggle: 'Toggle with Favorites button (Current: {status})',
   directCallDesc: `Press the Favorites button to toggle Direct Call Mode ON ↔ OFF
 • No dot: Direct Call Mode ON
 • Dot: Direct Call Mode OFF`,
 
   // Quick Camera
   quickCamera: '📷 Quick Camera',
   cameraAutoStart: 'Quick Camera Auto-Start',
   cameraDesc: `ON: Launches the Quick Camera screen immediately on app start
 • Long-pressing the Voicemail button is always available regardless of this setting
 • Double-tap the black screen to take a completely silent photo
 • Status indicated by a small dot in the top-left (blue = ready, green = done)
 • Returns to the keypad automatically after 2 seconds
 • Tap the top-left area to manually exit at any time`,

   // Camera Mode (새로 추가)
   cameraMode: 'Camera Mode',
   selectCameraMode: 'Select Camera Mode',
   cameraNormalMode: 'Normal Mode',
   cameraBlackMode: 'Dark Mode',
   cameraModeDesc: `Normal Mode: View actual camera preview while capturing (tap to capture)
Dark Mode: Complete black screen (double-tap to capture)`,

   // 기존 텍스트 수정
   cameraBlackModeDesc: `Choose your preferred camera capture method.`,
 
   // Vibration Settings
   vibrationSettings: '📳 Vibration Settings',
   vibrationFeedback: 'Enable Haptic Feedback',
   vibrationDesc: `📳 ON: Haptic feedback for all features
 • Vibration on Auto mode execution
 • Vibration on Favorites button toggle
 • Vibration on Quick Camera usage
 • Vibration on Call button press
 
 📳 OFF: All vibrations disabled`,
 
   // Language Settings
   languageSettings: '🌍 Language Settings',
   language: 'Language',
   selectLanguage: 'Select Language',
 
   // Theme Settings
   themeSettings: '🎨 Theme Settings',
   themeLabel: 'App Theme',
   themeDesc: 'Choose between Dark Mode and Light Mode.',
   defaultTheme: 'Tutorial Mode',
   darkOriginalTheme: 'Dark Mode',
   lightTheme: 'Light Mode',
   selectTheme: 'Select Theme',
 
   // Phone Settings
   phoneSettings: 'Phone Settings',
   targetPhone: 'Target Phone',
   targetPhonePlaceholder: 'e.g., 010-1234-5678',
   targetPhoneDesc: `• When Direct Call Mode is ON: Calls TargetPhone.
 • When Direct Call Mode is OFF: Press call button to enable Direct Call Mode.`,
 
   unknownPhone: 'Unknown Phone',
   unknownPhonePlaceholder: 'e.g., 010-9999-9999',
   unknownPhoneDesc: 'When Direct Call Mode is OFF: Press call button to call UnknownPhone, then Direct Call Mode turns ON.',
 
   // Help
   helpTitle: '✅ Available Features',
   helpContent: `• Settings screen: Long-press the contacts button for 3 seconds
 • Auto mode: Auto-process 5 seconds after number completion (always active)
 • Call button: Call target number or unknown number
 • Favorites button: Toggle Direct Call Mode (dot indicates status)
 • Long-press Voicemail button: Quick Camera
 • Haptic feedback: All main features
 
 📞 Direct Call Mode Toggle:
 • No dot = Direct Call ON: "target phone" 
 • Dot = Direct Call OFF: "unknown phone" → "target phone" sequence
 
 📷 Quick Camera:
 • Double-tap the black screen for silent capture
 • Top-left dot: blue (ready) → green (done)
 • Returns to keypad after 2 seconds
 
 ♾️ Auto mode (always active):
 • Auto-retrieves values 5 seconds after completing 7+ digit phone number.
 
 📱 Device Info:
 • Screen Size: {screenSize}
 • Screen Type: {screenType}
 • Home Button: {homeButton}
 • Key Size: {keySize}px
 • Model: {deviceModel}
 • Camera: {cameraStatus} | Storage: {storageStatus}`,
 
   // Permissions
   permissionDenied: 'Permission Denied',
   permissionRequired: 'Permission Required',
   retryPermission: 'Retry Permission?',
   grantPermission: 'Grant Permission',
   skipPermission: 'Skip',
 
   // Misc
   on: 'ON',
   off: 'OFF',
   hasHomeButton: 'With Home Button',
   noHomeButton: 'Without Home Button',
   contactSearchDisabled: 'Disabled on devices with Home Button (shows only Add Number)',
   contactSearchEnabled: 'Enable T9 name search (contact matching & Add button)',
   available: '✅',
   unavailable: '❌',
 },
 ja: {
   // 下部タブ (기본)
   favorites: 'お気に入り',
   recents: '最近',
   contacts: '連絡先',
   keypad: 'キーパッド',
   voicemail: 'ボイスメール',
   
   // 下部タブ (기본모드 전용)
   favoritesDefault: 'ダイレクト通話',
   recentsDefault: '未使用',
   contactsDefault: '設定(3秒)',
   keypadDefault: '情報',
   voicemailDefault: 'カメラ(1秒)',
 
   // メイン画面
   addNumber: '番号を追加',
 
   // 設定画面
   settings: '設定',
   done: '完了',
   shortcuts: 'Shortcuts',
   shortcutDownload: 'Shortcuts & Lecture',
   shortcutDesc: 'ショートカットのダウンロードと詳細な使用方法を確認',

   // 設定画面自動起動
   settingsAutoStart: '⚙️ 設定画面自動起動',
   settingsAutoStartToggle: 'アプリ起動時に設定画面を開く',
   settingsAutoStartDesc: `ON：アプリ起動時に即座に設定画面を表示
 • Quick Cameraと設定自動起動が両方ONの場合、設定画面が優先されます
 • 設定を頻繁に変更する場合に便利です`,
 
   // ダイレクトコールモード
   directCallMode: '📞 ダイレクトコールモード',
   directCallToggle: 'お気に入りボタンで切り替え (現在: {status})',
   directCallDesc: `お気に入りボタンをタップしてダイレクトコールモードをON ↔ OFFに切り替え
 • ドットなし：ダイレクトコールモードON
 • ドットあり：ダイレクトコールモードOFF
 
 ダイレクトコールON:
 • Auto mode："targetPhone" の連絡先を編集
 • 通話ボタン：常に "targetPhone" のカレンダーイベントを作成
 
 ダイレクトコールOFF:
 • Auto mode：通話ボタンのクリック回数によって動作
   - ドットあり（初期状態）："unknownPhone" の連絡先を編集
   - ドットなし（ボタン押下後）："targetPhone" の連絡先を編集
 • 通話ボタンのカレンダーイベント：ドットあり → "unknownPhone"、ドットなし → "targetPhone"`,
 
   // クイックカメラ
   quickCamera: '📷 Quick Camera',
   cameraAutoStart: 'Quick Camera自動起動',
   cameraDesc: `ON：アプリ起動時に即座にQuick Camera画面を表示
 • ボイスメールボタンの長押しはこの設定に関係なく常に使用可能
 • 黒い画面をダブルタップすると完全に無音で写真を撮影
 • 左上の小さなドットで状態を表示（青＝待機、緑＝完了）
 • 撮影後2秒で自動的にキーパッドに戻る
 • 左上エリアをタップするといつでも手動で終了してキーパッドに移動可能`,

   // カメラモード (새로 추가)
   cameraMode: 'カメラモード',
   selectCameraMode: 'カメラモードを選択',
   cameraNormalMode: '通常モード',
   cameraBlackMode: 'ダークモード',
   cameraModeDesc: `通常モード：実際のカメラプレビューを見ながら撮影（タップで撮影）
ダークモード：完全な黒画面で秘密撮影（ダブルタップで撮影）`,

   // 기존 텍스트 수정
   cameraBlackModeDesc: `お好みのカメラ撮影方式を選択できます。`,
 
   // バイブレーション設定
   vibrationSettings: '📳 バイブレーション設定',
   vibrationFeedback: 'ハプティックフィードバックを有効にする',
   vibrationDesc: `📳 ON：すべての機能でハプティックフィードバックを有効化
 • Auto mode実行時に振動
 • お気に入りボタン切り替え時に振動
 • Quick Camera使用時に振動
 • 通話ボタン押下時に振動
 
 📳 OFF：すべての振動を無効化`,
 
   // 言語設定
   languageSettings: '🌍 言語設定',
   language: '言語',
   selectLanguage: '言語を選択',
 
   // テーマ設定
   themeSettings: '🎨 テーマ設定',
   themeLabel: 'アプリテーマ',
   themeDesc: 'キーパッド、背景、通話ボタンの色を一括変更します',
   defaultTheme: 'チュートリアルモード',
   darkOriginalTheme: 'ダークモード',
   lightTheme: 'ライトモード',
   selectTheme: 'テーマを選択',
 
   // 電話設定
   phoneSettings: '電話設定',
   targetPhone: 'targetPhone',
   targetPhonePlaceholder: '例: 010-1234-5678',
   targetPhoneDesc: `• ダイレクトコールモードON時：Auto modeがこの連絡先を編集
 • ダイレクトコールモードOFF時：通話ボタン（ドットなし）を押した後、Auto modeがこの連絡先を編集`,
 
   unknownPhone: 'unknownPhone',
   unknownPhonePlaceholder: '例: 010-9999-9999',
   unknownPhoneDesc: 'ダイレクトコールモードOFF時、通話ボタンが未押下の場合：Auto modeがこの連絡先を編集',
 
   // ヘルプ
   helpTitle: '✅ 利用可能な機能',
   helpContent: `• 設定画面：連絡先ボタンを3秒間長押し
 • Auto mode：番号入力完了後5秒で自動処理（常に有効）
 • 通話ボタン：ターゲットの番号または存在しない番号に電話をかける。
 • お気に入りボタン：ダイレクトコールモードを切り替え（ドットで状態表示）
 • ボイスメールボタン長押し：Quick Camera
 • ハプティックフィードバック：主要機能すべてに対応
 
 📞 ダイレクトコールモード切り替え：
 • ドットなし = ダイレクトコールON："targetPhone"のカレンダーイベントを作成
 • ドットあり = ダイレクトコールOFF："unknownPhone"→"targetPhone"の連絡先を編集
 
 📷 Quick Camera：
 • 黒い画面をダブルタップしてサイレント撮影
 • 左上のドット：青（待機）→緑（完了）
 • 2秒後にキーパッドに戻る
 
 ♾️ Auto mode（常に有効）：
 • 番号入力完了後5秒で連絡先を編集
 
 📱 デバイス情報：
 • 画面サイズ：{screenSize}
 • 画面タイプ：{screenType}
 • ホームボタン：{homeButton}
 • キーサイズ：{keySize}px
 • モデル：{deviceModel}
 • カメラ：{cameraStatus} | ストレージ：{storageStatus}`,
 
   // 権限関連
   permissionDenied: '権限が拒否されました',
   permissionRequired: '権限が必要です',
   retryPermission: '権限を再試行しますか？',
   grantPermission: '権限を許可',
   skipPermission: 'スキップ',
 
   // その他
   on: 'ON',
   off: 'OFF',
   hasHomeButton: 'ホームボタンあり',
   noHomeButton: 'ホームボタンなし',
   contactSearchDisabled: 'ホームボタンありのデバイスでは無効（番号追加のみ表示）',
   contactSearchEnabled: 'T9方式の名前検索を有効化（連絡先マッチ＆追加ボタン）',
   available: '✅',
   unavailable: '❌',
 },
};

// 📱 화면 크기 및 기종 감지
const { width, height } = Dimensions.get('window');

// 홈버튼 유무 감지 함수
const hasHomeButton = (() => {
  if (width === 320 && height === 568) return true; // iPhone SE 1세대
  if (width === 375 && height === 667) return true; // iPhone SE 2/3세대, iPhone 6/7/8
  if (width === 414 && height === 736) return true; // iPhone 6/7/8 Plus
  if (height <= 750) return true; // 기타 홈버튼이 있는 구형 기종들
  return false;
})();

// 📏 화면 타입 분류 함수
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

// 📐 레이아웃 설정 함수
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
      contactMatch: { paddingHorizontal: 40, paddingTop: 12, paddingBottom: 18, maxHeight: 130 },
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

// 🔤 폰트 크기 설정 함수
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

// ⌨️ 키 크기 계산 함수
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

// 🎯 계산된 값들
const keySize = getKeySize();
const fontSizes = getFontSizes();
const layoutConfig = getLayoutConfig();
const titleFontSize = fontSizes.title;
const baseFontSize = fontSizes.base;
const descFontSize = fontSizes.desc;

// ========================================================================================
// 🎛️ 언어 드롭다운 컴포넌트
// ========================================================================================

const LanguageDropdown = ({ language, onLanguageChange, t, themeColors }: { 
  language: string; 
  onLanguageChange: (lang: string) => void; 
  t: (key: string) => string; 
  themeColors: any;
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
        style={[styles.languageSelector, { backgroundColor: themeColors.container }]}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.languageSelectorContent}>
          <Text style={[styles.languageLabel, { color: themeColors.text }]}>{t('language')}</Text>
          <View style={styles.selectedLanguage}>
            <Text style={styles.languageFlag}>{selectedLanguage?.flag}</Text>
            <Text style={[styles.languageName, { color: themeColors.textSecondary }]}>{selectedLanguage?.name}</Text>
            <Text style={[styles.dropdownArrow, { color: themeColors.textSecondary }]}>▼</Text>
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
          <View style={[styles.languageModal, { backgroundColor: themeColors.container }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>{t('selectLanguage')}</Text>
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
                  { color: themeColors.text },
                  language === lang.code && styles.selectedOptionText
                ]}>
                  {lang.name}
                </Text>
                {language === lang.code && (
                  <Text style={[styles.checkmark, { color: themeColors.text }]}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

// ========================================================================================
// 🎨 테마 드롭다운 컴포넌트
// ========================================================================================

const ThemeDropdown = ({ theme, onThemeChange, t, themeColors }: { 
  theme: string; 
  onThemeChange: (theme: string) => void; 
  t: (key: string) => string; 
  themeColors: any;
}) => {
  const [showModal, setShowModal] = useState(false);
  
  const themes = [
    { code: 'default', name: t('defaultTheme'), keypad: '#4A90E2', background: '#FFFFFF', callButton: '#FF6B35', preview: '#4A90E2' },
    { code: 'dark', name: t('darkOriginalTheme'), keypad: '#34C759', background: '#000000', callButton: '#34C759', preview: '#34C759' },
    { code: 'light', name: t('lightTheme'), keypad: '#666666', background: '#FFFFFF', callButton: '#34C759', preview: '#666666' },
  ];
  
  const selectedTheme = themes.find(themeItem => themeItem.code === theme) || themes[0];
  
  return (
    <>
      <TouchableOpacity 
        style={[styles.themeSelector, { backgroundColor: themeColors.container }]}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.themeSelectorContent}>
          <Text style={[styles.themeLabel, { color: themeColors.text }]}>{t('themeLabel')}</Text>
          <View style={styles.selectedTheme}>
            <View style={[styles.colorPreview, { backgroundColor: selectedTheme.preview }]} />
            <Text style={[styles.themeName, { color: themeColors.textSecondary }]}>{selectedTheme.name}</Text>
            <Text style={[styles.dropdownArrow, { color: themeColors.textSecondary }]}>▼</Text>
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
          <View style={[styles.themeModal, { backgroundColor: themeColors.container }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>{t('selectTheme')}</Text>
            {themes.map((themeOption) => (
              <TouchableOpacity
                key={themeOption.code}
                style={[
                  styles.themeOption,
                  theme === themeOption.code && styles.selectedOption
                ]}
                onPress={() => {
                  onThemeChange(themeOption.code);
                  setShowModal(false);
                }}
              >
                <View style={[styles.colorPreview, { backgroundColor: themeOption.preview }]} />
                <Text style={[
                  styles.themeOptionText,
                  { color: themeColors.text },
                  theme === themeOption.code && styles.selectedOptionText
                ]}>
                  {themeOption.name}
                </Text>
                {theme === themeOption.code && (
                  <Text style={[styles.checkmark, { color: themeColors.text }]}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};
const CameraModeDropdown = ({ cameraBlackMode, onCameraModeChange, t, themeColors }: { 
  cameraBlackMode: boolean; 
  onCameraModeChange: (blackMode: boolean) => void; 
  t: (key: string) => string; 
  themeColors: any;
}) => {
  const [showModal, setShowModal] = useState(false);
  
  const modes = [
    { code: false, name: t('cameraNormalMode'), icon: '📹' },
    { code: true, name: t('cameraBlackMode'), icon: '⚫' },
  ];
  
  const selectedMode = modes.find(mode => mode.code === cameraBlackMode) || modes[0];
  
  return (
    <>
      <TouchableOpacity 
        style={[styles.cameraModeSelector, { backgroundColor: themeColors.container }]}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.cameraModeSelectorContent}>
          <Text style={[styles.cameraModeLabel, { color: themeColors.text }]}>{t('cameraMode')}</Text>
          <View style={styles.selectedCameraMode}>
            <Text style={styles.cameraModeIcon}>{selectedMode.icon}</Text>
            <Text style={[styles.cameraModeName, { color: themeColors.textSecondary }]}>{selectedMode.name}</Text>
            <Text style={[styles.dropdownArrow, { color: themeColors.textSecondary }]}>▼</Text>
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
          <View style={[styles.cameraModeModal, { backgroundColor: themeColors.container }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>{t('selectCameraMode')}</Text>
            {modes.map((mode) => (
              <TouchableOpacity
                key={mode.code.toString()}
                style={[
                  styles.cameraModeOption,
                  cameraBlackMode === mode.code && styles.selectedOption
                ]}
                onPress={() => {
                  onCameraModeChange(mode.code);
                  setShowModal(false);
                }}
              >
                <Text style={styles.cameraModeIcon}>{mode.icon}</Text>
                <Text style={[
                  styles.cameraModeOptionText,
                  { color: themeColors.text },
                  cameraBlackMode === mode.code && styles.selectedOptionText
                ]}>
                  {mode.name}
                </Text>
                {cameraBlackMode === mode.code && (
                  <Text style={[styles.checkmark, { color: themeColors.text }]}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};


// ========================================================================================
// 📱 메인 키패드 컴포넌트
// ========================================================================================

const MagicKeypad = () => {
  // 🏁 상태 관리
  const [currentNumber, setCurrentNumber] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showQuickCamera, setShowQuickCamera] = useState(false);
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
  const [settingsEnabled, setSettingsEnabled] = useState(false);
  const [directCallEnabled, setDirectCallEnabled] = useState(false);
  const [theme, setTheme] = useState('default'); // 통합 테마 상태
  const [cameraBlackMode, setCameraBlackMode] = useState(false); // 카메라 일반 모드가 기본값
  const [hasContactsPermission, setHasContactsPermission] = useState(false);
  const [hasCalendarPermission, setHasCalendarPermission] = useState(false);
  const [language, setLanguage] = useState('ko');
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const [hasAutoStartedCamera, setHasAutoStartedCamera] = useState(false);
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [justClosedSettings, setJustClosedSettings] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  // 🎭 애니메이션 관련 상태
  const [numberFadeAnim] = useState(new Animated.Value(0));
  const [elementsFadeAnim] = useState(new Animated.Value(0));
  const [isFirstInput, setIsFirstInput] = useState(true);

  // ========================================================================================
  // 🛠️ 유틸리티 함수들
  // ========================================================================================

  // 🌍 번역 함수
  const t = (key: string, params?: Record<string, string>) => {
    let text = translations[language as keyof typeof translations]?.[key as keyof typeof translations[keyof typeof translations]] || key;
    
    if (params) {
      Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, params[param]);
      });
    }
    
    return text;
  };

  // 🎨 테마 설정 가져오기 함수
  const getThemeColors = () => {
    switch (theme) {
      case 'default':
        return {
          background: '#FFFFFF',
          keypad: '#000000',
          callButton: '#000000',
          text: '#000000',
          textSecondary: '#8E8E93',
          container: '#F2F2F7',
          border: '#E5E5EA',
          keyText: '#FFFFFF',
          keyLetters: '#FFFFFF',
          deleteButton: '#8E8E93',
          tabIcon: '#666666',
          contactText: '#000000',
          contactSecondary: '#8E8E93'
        };
      case 'dark':
        return {
          background: '#000000',
          keypad: '#333333',
          callButton: '#34C759',
          text: '#FFFFFF',
          textSecondary: '#8E8E93',
          container: '#1C1C1E',
          border: '#333333',
          keyText: '#FFFFFF',
          keyLetters: '#FFFFFF',
          deleteButton: '#333333',
          tabIcon: 'rgba(255,255,255,0.6)',
          contactText: '#FFFFFF',
          contactSecondary: '#8E8E93'
        };
      case 'light':
        return {
          background: '#F2F2F7',
          keypad: '#D1D1D6',
          callButton: '#34C759',
          text: '#000000',
          textSecondary: '#8E8E93',
          container: '#FFFFFF',
          border: '#E5E5EA',
          keyText: '#000000',
          keyLetters: '#000000',
          deleteButton: '#8E8E93',
          tabIcon: '#A0A0A5',
          contactText: '#000000',
          contactSecondary: '#8E8E93'
        };
      default:
        return {
          background: '#FFFFFF',
          keypad: '#4A90E2',
          callButton: '#FF6B35',
          text: '#000000',
          textSecondary: '#8E8E93',
          container: '#F2F2F7',
          border: '#E5E5EA',
          keyText: '#FFFFFF',
          keyLetters: '#FFFFFF',
          deleteButton: '#8E8E93',
          tabIcon: 'rgba(0,0,0,0.6)',
          contactText: '#000000',
          contactSecondary: '#8E8E93'
        };
    }
  };

  // 📞 T9 매핑 테이블 (연락처 검색용)
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

  // 📱 기종 이름 가져오기 함수
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

  // 📞 전화번호 포맷팅 함수
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

  // ✅ 전화번호 완성 여부 체크 함수
  const checkPhoneNumberComplete = (number: string): boolean => {
    const numbersOnly = number.replace(/[^0-9]/g, '');
    return numbersOnly.length >= 7 && numbersOnly.length <= 15;
  };

  // ========================================================================================
  // 📞 연락처 관련 함수들
  // ========================================================================================

  // 📥 연락처 로드 함수
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

  // 🔐 연락처 권한 요청 함수
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

  // 🔍 연락처 매칭 함수
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

  // 🔤 간단한 T9 매칭
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

  // 🎨 전화번호 하이라이트 렌더링
  const renderHighlightedPhone = (phone: string, inputNumbers: string) => {
    const themeColors = getThemeColors();
    
    if (!inputNumbers) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const formattedPhone = formatPhoneNumber(cleanPhone);
      return <Text style={{ color: themeColors.contactSecondary }}>{formattedPhone}</Text>;
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
          <Text style={{ color: themeColors.contactText }}>{matchedPart}</Text>
          <Text style={{ color: themeColors.contactSecondary }}>{remainingPart}</Text>
        </Text>
      );
    }
    
    return <Text style={{ color: themeColors.contactSecondary }}>{formattedPhone}</Text>;
  };

  // ========================================================================================
  // ⚙️ 설정 및 초기화 함수들
  // ========================================================================================

  // 📱 자동시작 기능 체크
  useEffect(() => {
    console.log('🔍 자동시작 기능 체크:', {
      isSettingsLoaded,
      isFirstRun,
      settingsEnabled,
      cameraEnabled,
      isCameraAvailable,
      hasCameraRoll: !!CameraRoll,
      showSettings,
      showQuickCamera,
      hasAutoStartedCamera,
      justClosedSettings
    });
    
    // 설정창을 방금 닫았다면 자동시작 로직 건너뛰기
    if (justClosedSettings) {
      console.log('⏭️ 설정창 방금 닫음 - 자동시작 건너뛰기');
      return;
    }
    
    if (isSettingsLoaded && !showSettings && !showQuickCamera) {
      // 첫 실행이면 무조건 설정창 열기
      if (isFirstRun) {
        console.log('🎉 첫 실행 감지 - 설정창으로 전환');
        setShowSettings(true);
        return;
      }
      
      // 설정창 자동시작이 활성화된 경우
      if (settingsEnabled) {
        console.log('⚙️ 설정창 자동시작 - 설정창으로 전환');
        setShowSettings(true);
        return;
      }
      
      // 설정창이 비활성화되어 있고 카메라 자동시작이 활성화된 경우
      if (cameraEnabled && isCameraAvailable && CameraRoll && !hasAutoStartedCamera) {
        console.log('🎥 퀵카메라 자동시작 - 퀵카메라 모드로 전환');
        setShowQuickCamera(true);
        setHasAutoStartedCamera(true);
      }
    }
  }, [isFirstRun, settingsEnabled, cameraEnabled, isSettingsLoaded, justClosedSettings]);

  // 🚀 앱 초기화
  useEffect(() => {
    console.log('🚀 앱 초기화 시작');
    loadSettings();
  }, []);

  // 📄 설정 로드 함수
  const loadSettings = async () => {
    try {
      console.log('📄 설정 로드 시작...');
      
      // 저장된 설정 로드
      try {
        const saved = await AsyncStorage.getItem('magicKeypadSettings');
        if (saved) {
          const settings = JSON.parse(saved);
          setShortcuts(settings.shortcuts || shortcuts);
          setVibrationEnabled(settings.vibrationEnabled !== undefined ? settings.vibrationEnabled : true);
          setCameraEnabled(settings.cameraEnabled !== undefined ? settings.cameraEnabled : false);
          setSettingsEnabled(settings.settingsEnabled !== undefined ? settings.settingsEnabled : false);
          setCameraBlackMode(settings.cameraBlackMode !== undefined ? settings.cameraBlackMode : false);
          setDirectCallEnabled(settings.directCallEnabled !== undefined ? settings.directCallEnabled : false);
          setLanguage(settings.language || 'ko');
          setTheme(settings.theme || 'default'); // 테마 로드
          setIsFirstRun(false); // 저장된 설정이 있으면 첫 실행이 아님
          console.log('✅ 저장된 설정 로드 완료');
        } else {
          console.log('📄 저장된 설정 없음 - 첫 실행으로 판단');
          setIsFirstRun(true); // 저장된 설정이 없으면 첫 실행
          // 🔥 추가: 첫 실행 시 카메라 모드를 일반 모드로 설정
          setCameraBlackMode(false);
        }
      } catch (settingsError) {
        console.log('❌ 설정 로드 실패:', settingsError);
        setIsFirstRun(true); // 로드 실패 시에도 첫 실행으로 처리
        // 🔥 추가: 로드 실패 시에도 카메라 모드를 일반 모드로 설정
        setCameraBlackMode(false);
      }
      
      // 📅 캘린더 권한 요청 (모든 기종)
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
      
      // 📞 연락처 권한 요청 (홈버튼이 없는 기종만)
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

  // 💾 설정 저장 함수
  const saveSettings = async (
    newShortcuts: typeof shortcuts, 
    newVibrationEnabled: boolean, 
    newCameraEnabled: boolean, 
    newCameraBlackMode: boolean,
    newSettingsEnabled: boolean,
    newDirectCallEnabled: boolean,
    newLanguage: string,
    newTheme: string
  ) => {
    try {
      console.log('💾 설정 저장 중...');
      
      const settings = {
        shortcuts: newShortcuts,
        vibrationEnabled: newVibrationEnabled,
        cameraEnabled: newCameraEnabled,
        cameraBlackMode: newCameraBlackMode,
        settingsEnabled: newSettingsEnabled,
        directCallEnabled: newDirectCallEnabled,
        language: newLanguage,
        theme: newTheme
      };
      
      await AsyncStorage.setItem('magicKeypadSettings', JSON.stringify(settings));
      
      setShortcuts(newShortcuts);
      setVibrationEnabled(newVibrationEnabled);
      setCameraEnabled(newCameraEnabled);
      setCameraBlackMode(newCameraBlackMode);
      setSettingsEnabled(newSettingsEnabled);
      setDirectCallEnabled(newDirectCallEnabled);
      setLanguage(newLanguage);
      setTheme(newTheme);
      console.log('✅ 설정 저장 완료');
    } catch (error) {
      console.log('❌ 설정 저장 실패:', error);
    }
  };

  // ========================================================================================
  // ⚡ 자동 처리 로직
  // ========================================================================================

  // ⏰ 자동 처리 체크 및 타이머 설정
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

  // 🔄 자동 처리 실행
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
        
        // 연락처 편집
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
          
          // 연락처 편집
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
          
          // 연락처 편집
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
  // 🎮 이벤트 핸들러들
  // ========================================================================================

  // 📱 번호 변경시 연락처 매칭 및 자동 처리 체크
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

  // 📞 연락처 로드 완료시에만 매칭 재실행 (홈버튼이 없는 기종만)
  useEffect(() => {
    if (!hasHomeButton && currentNumber && allContacts.length > 0) {
      matchContacts();
    } else if (hasHomeButton) {
      // 홈버튼이 있는 기종에서는 항상 매칭 결과를 지움
      setMatchedContacts([]);
    }
  }, [allContacts]);

  // 🧹 컴포넌트 언마운트 시 타이머 정리
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

  // ➕ 번호 입력
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

  // ⌫ 번호 삭제
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

  // 🔁 연속 삭제 시작
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

  // ⏹️ 연속 삭제 중지
  const stopContinuousDelete = () => {
    if (deleteTimer) {
      clearInterval(deleteTimer);
      setDeleteTimer(null);
    }
  };

 // 📞 바로전화 버튼 처리
 const handleDirectCall = async () => {
  try {
    // 바로전화 모드가 켜져있는 경우
    if (directCallEnabled) {
      // 타겟번호로 캘린더 이벤트 생성
      if (shortcuts.targetPhone.trim() && hasCalendarPermission) {
        try {
          const eventTitle = 'target phone';
          const eventDetails = {
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 3600000).toISOString(),
            allDay: false,
            location: '',
            notes: ''
          };
          
          await CalendarEvents.saveEvent(eventTitle, eventDetails);
          console.log('✅ 통화버튼: 타겟번호 캘린더 이벤트 생성');
        } catch (error) {
          console.log('❌ 캘린더 이벤트 생성 실패:', error);
        }
      }
    } else {
      // 바로전화 모드가 꺼져있는 경우
      if (callButtonClickCount === 0) {
        // 이미 한 번 눌린 상태: 타겟번호로 캘린더 이벤트 생성
        if (shortcuts.targetPhone.trim() && hasCalendarPermission) {
          try {
            const eventTitle = 'target phone';
            const eventDetails = {
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 3600000).toISOString(),
              allDay: false,
              location: '',
              notes: ''
            };
            
            await CalendarEvents.saveEvent(eventTitle, eventDetails);
            console.log('✅ 통화버튼: 타겟번호 캘린더 이벤트 생성');
          } catch (error) {
            console.log('❌ 캘린더 이벤트 생성 실패:', error);
          }
        }
        
        // 바로전화 모드 켜기
        setDirectCallEnabled(true);
        console.log('✅ 바로전화 모드 ON으로 전환');
      } else {
        // 첫 번째 클릭: 없는번호로 캘린더 이벤트 생성
        if (shortcuts.unknownPhone.trim() && hasCalendarPermission) {
          try {
            const eventTitle = 'unknown phone';
            const eventDetails = {
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 3600000).toISOString(),
              allDay: false,
              location: '',
              notes: ''
            };
            
            await CalendarEvents.saveEvent(eventTitle, eventDetails);
            console.log('✅ 통화버튼: 없는번호 캘린더 이벤트 생성');
          } catch (error) {
            console.log('❌ 캘린더 이벤트 생성 실패:', error);
          }
        }
        
        // 클릭 카운트 감소 (점 제거)
        setCallButtonClickCount(0);
        console.log('✅ 통화버튼 클릭 카운트: 0');
      }
    }
    
    // 📳 진동 피드백
    if (vibrationEnabled) {
      if (Platform.OS === 'ios') {
        Vibration.vibrate([0, 50]);
      } else {
        Vibration.vibrate(100);
      }
    }
    
    // 🗑️ 2초 후 입력창 지우기
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
    console.log('❌ 바로전화 기능 실행 실패:', error);
  }
};

  // 🎥 음성사서함 버튼 길게 누르기 (퀵카메라 실행)
  const handleVoicemailLongPress = async () => {
    if (!isCameraAvailable) {
      console.log('❌ 카메라 라이브러리 없음');
      Alert.alert('🎥 퀵 카메라', 'Camera 라이브러리를 추가하면 실제 기능이 활성화됩니다.', [
        { text: '확인', style: 'default' }
      ]);
      return;
    }

    if (!CameraRoll) {
      console.log('❌ CameraRoll 라이브러리 없음');
      Alert.alert('🎥 퀵 카메라', 'CameraRoll 라이브러리를 추가하면 저장 기능이 활성화됩니다.', [
        { text: '확인', style: 'default' }
      ]);
      return;
    }

    try {
      console.log('🎥 퀵카메라 모드 시작');
      setShowQuickCamera(true);
    } catch (error) {
      console.log('❌ 퀵카메라 실행 실패:', error);
      Alert.alert('🎥 퀵 카메라', '카메라 실행에 실패했습니다.', [
        { text: '확인', style: 'default' }
      ]);
    }
  };

  // ⚙️ 연락처 버튼 길게 누르기 (설정창 진입)
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

  // 0️⃣ '0' 버튼 길게 누르기 (+ 입력)
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

  // 🌍 언어 변경 핸들러
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    saveSettings(shortcuts, vibrationEnabled, cameraEnabled, settingsEnabled, directCallEnabled, newLanguage, theme);
  };

  // ========================================================================================
  // 🎨 렌더링
  // ========================================================================================

  // ✅ 정보 화면 표시
  if (showInfo) {
    return (
      <InfoScreen 
        onClose={() => setShowInfo(false)}
        language={language}
        theme={theme}
      />
    );
  }

  // 🎥 퀵카메라 화면 표시
  if (showQuickCamera && isCameraAvailable) {
    return (
      <QuickCameraScreen 
      onClose={() => {
        setShowQuickCamera(false);
      }}
      vibrationEnabled={vibrationEnabled}
      blackMode={cameraBlackMode}
    />
    );
  }

  // ⚙️ 설정 화면 표시
  if (showSettings) {
    return (
      <SettingsScreen 
        shortcuts={shortcuts}
        vibrationEnabled={vibrationEnabled}
        cameraEnabled={cameraEnabled}
        cameraBlackMode={cameraBlackMode} 
        settingsEnabled={settingsEnabled}
        directCallEnabled={directCallEnabled}
        language={language}
        theme={theme}
        isCameraAvailable={isCameraAvailable}
        isCameraRollAvailable={!!CameraRoll}
        onSave={(newShortcuts, newVibrationEnabled, newCameraEnabled, newCameraBlackMode, newSettingsEnabled, newDirectCallEnabled, newLanguage, newTheme) => {
          if (isFirstRun) {
            setIsFirstRun(false);
          }
          saveSettings(newShortcuts, newVibrationEnabled, newCameraEnabled, newCameraBlackMode, newSettingsEnabled, newDirectCallEnabled, newLanguage, newTheme);
        }}
        onClose={() => {
          setShowSettings(false);
          setJustClosedSettings(true);
          setTimeout(() => {
            setJustClosedSettings(false);
          }, 3000);
        }}
        t={t}
        hasHomeButton={hasHomeButton}
        screenSize={`${width}x${height}`}
        screenType={getScreenType()}
        keySize={Math.round(keySize)}
        deviceModel={getDeviceModelName()}
      />
    );
  }

  // 📱 메인 키패드 화면
  const themeColors = getThemeColors();
  const keyBackgroundColor = themeColors.keypad;
  const callButtonBackgroundColor = themeColors.callButton;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={themeColors.background} />
      
      {/* 📞 번호 표시 영역 */}
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
              { color: themeColors.text },
              // Router by SYZ 스타일링 (기본모드에서 숫자가 없을 때)
              (!currentNumber && theme === 'default') && {
                fontSize: fontSizes.numberDisplay * 0.8,
                fontWeight: '600',
                color: '#666666',
              },
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
            {currentNumber || (theme === 'default' ? 'Router by SYZ' : '')}
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
            <Text style={[styles.addNumberText, { color: '#007AFF' }]}>{t('addNumber')}</Text>
          </Animated.View>
        )}
      </View>

      {/* 👤 연락처 추가 버튼 (홈버튼이 없는 기종만) */}
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
          {theme === 'default' ? (
  <Text style={{ fontSize: layoutConfig.addContactButton.size * 0.7, color: '#007AFF' }}>👤➕</Text>
) : (
              <SFSymbol 
                name="person.crop.circle.badge.plus" 
                size={layoutConfig.addContactButton.size * 0.7} 
                color="#007AFF" 
                weight="regular" 
              />
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* 📋 연락처 매칭 영역 (홈버튼이 없는 기종만) */}
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
              {theme === 'default' ? (
                <View style={[styles.customPersonIcon, { borderColor: themeColors.contactText }]} />
              ) : (
                <SFSymbol 
                  name="person.crop.circle" 
                  size={18} 
                  color={theme === 'light' ? '#000000' : '#FFFFFF'} 
                  weight="regular" 
                />
              )}
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactSingleLine, { color: themeColors.contactText }]} numberOfLines={1} ellipsizeMode="tail">
                <Text style={{ color: themeColors.contactSecondary }}>
                  {(() => {
                    const name = matchedContacts[0].displayName || matchedContacts[0].fullName || "이름 없음";
                    return name.length > 5 ? name.substring(0, 5) + "⋯" : name;
                  })()}
                </Text>
                <Text style={{ color: themeColors.contactSecondary }}>, </Text>
                {renderHighlightedPhone(matchedContacts[0].primaryPhone, currentNumber.replace(/[^0-9]/g, ''))}
              </Text>
            </View>
          </TouchableOpacity>

          {matchedContacts.length > 1 && (
            <TouchableOpacity style={styles.additionalContactsItem}>
              <View style={styles.contactIcon}>
                {theme === 'default' ? (
                  <View style={styles.customPersonsIcon}>
                    <View style={[styles.customPersonSmall, { left: 2, borderColor: themeColors.contactText }]} />
                    <View style={[styles.customPersonSmall, { right: 2, borderColor: themeColors.contactText }]} />
                  </View>
                ) : (
                  <SFSymbol 
                    name="person.2.fill" 
                    size={18} 
                    color={theme === 'light' ? '#000000' : '#FFFFFF'} 
                    weight="regular" 
                  />
                )}
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactSingleLine, { color: themeColors.contactSecondary }]}>
                  {language === 'ko' ? `그 외 ${matchedContacts.length - 1}개...` : `${matchedContacts.length - 1} more...`}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* ⌨️ 키패드 영역 */}
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
                  theme === 'default' && styles.squareKey,
                  {
                    marginHorizontal: layoutConfig.keypad.keyMargin,
                    backgroundColor: keyBackgroundColor,
                  }
                ]}
                onPress={() => addNumber(number)}
                underlayColor={theme === 'default' ? '#333333' : (theme === 'dark' ? '#555555' : '#BFBFBF')}
                activeOpacity={1}
              >
                <View style={styles.keyContent}>
                  <Text style={[styles.keyNumber, { color: themeColors.keyText }]}>{number}</Text>
                  {letters ? <Text style={[styles.keyLetters, { color: themeColors.keyLetters }]}>{letters}</Text> : null}
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
                  theme === 'default' && styles.squareKey,
                  {
                    marginHorizontal: layoutConfig.keypad.keyMargin,
                    backgroundColor: keyBackgroundColor,
                  }
                ]}
                onPress={() => addNumber(number)}
                underlayColor={theme === 'default' ? '#333333' : (theme === 'dark' ? '#2E8B57' : '#555555')}
                activeOpacity={1}
              >
                <View style={styles.keyContent}>
                  <Text style={[styles.keyNumber, { color: themeColors.keyText }]}>{number}</Text>
                  {letters ? <Text style={[styles.keyLetters, { color: themeColors.keyLetters }]}>{letters}</Text> : null}
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
                  theme === 'default' && styles.squareKey,
                  {
                    marginHorizontal: layoutConfig.keypad.keyMargin,
                    backgroundColor: keyBackgroundColor,
                  }
                ]}
                onPress={() => addNumber(number)}
                underlayColor={theme === 'default' ? '#333333' : (theme === 'dark' ? '#2E8B57' : '#555555')}
                activeOpacity={1}
              >
                <View style={styles.keyContent}>
                  <Text style={[styles.keyNumber, { color: themeColors.keyText }]}>{number}</Text>
                  {letters ? <Text style={[styles.keyLetters, { color: themeColors.keyLetters }]}>{letters}</Text> : null}
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
                theme === 'default' && styles.squareKey,
                {
                  marginHorizontal: layoutConfig.keypad.keyMargin,
                  backgroundColor: keyBackgroundColor,
                }
              ]}
              onPress={() => addNumber('*')}
              underlayColor={theme === 'default' ? '#333333' : (theme === 'dark' ? '#555555' : '#BFBFBF')}
              activeOpacity={1}
            >
              <View style={styles.keyContent}>
                <Text style={[styles.keyNumber, { color: themeColors.keyText }]}>*</Text>
              </View>
            </TouchableHighlight>
            
            <TouchableHighlight
              style={[
                styles.key,
                theme === 'default' && styles.squareKey,
                {
                  marginHorizontal: layoutConfig.keypad.keyMargin,
                  backgroundColor: keyBackgroundColor,
                }
              ]}
              onPress={handleZeroPress}
              onLongPress={handleZeroLongPress}
              delayLongPress={800}
              underlayColor={theme === 'default' ? '#333333' : (theme === 'dark' ? '#555555' : '#BFBFBF')}
              activeOpacity={1}
            >
              <View style={styles.keyContent}>
                <Text style={[styles.keyNumber, { color: themeColors.keyText }]}>0</Text>
                <Text style={[styles.keyLetters, { color: themeColors.keyLetters }]}>+</Text>
              </View>
            </TouchableHighlight>
            
            <TouchableHighlight
              style={[
                styles.key,
                theme === 'default' && styles.squareKey,
                {
                  marginHorizontal: layoutConfig.keypad.keyMargin,
                  backgroundColor: keyBackgroundColor,
                }
              ]}
              onPress={() => addNumber('#')}
              underlayColor={theme === 'default' ? '#333333' : (theme === 'dark' ? '#555555' : '#BFBFBF')}
              activeOpacity={1}
            >
              <View style={styles.keyContent}>
                <Text style={[styles.keyNumber, { color: themeColors.keyText }]}>#</Text>
              </View>
            </TouchableHighlight>
          </View>
        </View>

        {/* 🔘 하단 버튼들 */}
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
              theme === 'default' && styles.squareCallButton,
              {
                backgroundColor: callButtonBackgroundColor,
                marginTop: layoutConfig.bottomButtons.marginTop,
              }
            ]}
            onPress={handleDirectCall}
          >
{theme === 'default' ? (
  <Text style={{ fontSize: keySize * 0.4, color: '#FFFFFF' }}>📅</Text>
) : (
              <SFSymbol 
                name="phone.fill" 
                size={keySize * 0.4} 
                color="#FFFFFF" 
                weight="medium" 
              />
            )}
          </TouchableOpacity>
          
          {/* ⌫ 삭제 버튼 */}
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
                {theme === 'default' ? (
  <Text style={{ fontSize: keySize * 0.33, color: themeColors.tabIcon }}>⌫</Text>
) : (
                    <>
                      <SFSymbol 
                        name="delete.left"
                        size={keySize * 0.33} 
                        color="#FFFFFF" 
                        weight="medium" 
                      />
                      <SFSymbol 
                        name="delete.left.fill" 
                        size={keySize * 0.34} 
                        color={themeColors.deleteButton} 
                        weight="medium" 
                        style={{ position: 'absolute' }}
                      />
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>

      {/* 📋 하단 탭바 */}
      <View style={[
        styles.tabBar,
        {
          paddingVertical: layoutConfig.tabBar.paddingVertical,
          paddingBottom: layoutConfig.tabBar.paddingBottom,
          backgroundColor: themeColors.background,
        }
      ]}>
        {/* ⭐ 즐겨찾기/바로전화 버튼 */}
        <TouchableOpacity 
          style={[
            styles.tabItem,
            {
              paddingBottom: hasHomeButton ? 1 : 15,
            }
          ]}
          onPress={() => {
            // 🔧 수정: 모든 테마에서 토글 로직 실행
            setDirectCallEnabled(prev => {
              const newMode = !prev;
              if (!newMode) {
                // 바로전화 모드 OFF로 전환시 카운트 리셋
                setCallButtonClickCount(1);
              } else {
                // 바로전화 모드 ON으로 전환시 카운트를 0으로 (점 제거)
                setCallButtonClickCount(0);
              }
              
              if (vibrationEnabled) {
                if (Platform.OS === 'ios') {
                  Vibration.vibrate([0, 100]);
                } else {
                  Vibration.vibrate(100);
                }
              }
              
              console.log(`✅ 즐겨찾기 버튼: 바로전화 모드 ${newMode ? 'ON' : 'OFF'}`);
              
              return newMode;
            });
          }}
        >
{theme === 'default' ? (
  <Text style={{ fontSize: layoutConfig.tabBar.iconSize, color: themeColors.tabIcon }}>📞</Text>
) : (
            <SFSymbol 
              name="star.fill" 
              size={layoutConfig.tabBar.iconSize} 
              color={themeColors.tabIcon} 
              weight="regular" 
            />
          )}
          <Text style={[
            styles.tabLabel,
            { color: themeColors.tabIcon },
            {
              fontSize: layoutConfig.tabBar.labelSize,
              marginTop: layoutConfig.tabBar.labelMarginTop,
            }
          ]}>{theme === 'default' ? t('favoritesDefault') : t('favorites')}</Text>
          {!directCallEnabled && callButtonClickCount === 1 && (
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: themeColors.tabIcon }]} />
            </View>
          )}
        </TouchableOpacity>
        
        {/* 🕐 최근통화/미사용 버튼 */}
        <TouchableOpacity style={[
          styles.tabItem,
          {
            paddingBottom: hasHomeButton ? 1 : 15,
            opacity: theme === 'default' ? 0.3 : 1,
          }
        ]}>
{theme === 'default' ? (
  <Text style={{ fontSize: layoutConfig.tabBar.iconSize, color: themeColors.tabIcon }}>❌</Text>
) : (
            <SFSymbol 
              name="clock.fill" 
              size={layoutConfig.tabBar.iconSize} 
              color={themeColors.tabIcon} 
              weight="regular" 
            />
          )}
          <Text style={[
            styles.tabLabel,
            { color: themeColors.tabIcon },
            {
              fontSize: layoutConfig.tabBar.labelSize,
              marginTop: layoutConfig.tabBar.labelMarginTop,
            }
          ]}>{theme === 'default' ? t('recentsDefault') : t('recents')}</Text>
        </TouchableOpacity>
        
        {/* 👤 연락처/설정 버튼 */}
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
{theme === 'default' ? (
  <Text style={{ fontSize: layoutConfig.tabBar.iconSize, color: themeColors.tabIcon }}>⚙️</Text>
) : (
            <SFSymbol 
              name="person.circle.fill" 
              size={layoutConfig.tabBar.iconSize} 
              color={themeColors.tabIcon} 
              weight="regular" 
            />
          )}
          <Text style={[
            styles.tabLabel,
            { color: themeColors.tabIcon },
            {
              fontSize: layoutConfig.tabBar.labelSize,
              marginTop: layoutConfig.tabBar.labelMarginTop,
            }
          ]}>{theme === 'default' ? t('contactsDefault') : t('contacts')}</Text>
        </TouchableOpacity>
        
        {/* ⌨️ 키패드/정보 버튼 */}
        <TouchableOpacity 
          style={[
            styles.tabItem, 
            styles.activeTabItem,
            {
              paddingBottom: hasHomeButton ? 1 : 15,
            }
          ]}
          onPress={() => {
            if (theme === 'default') {
              setShowInfo(true);
            }
          }}
        >
{theme === 'default' ? (
  <Text style={{ fontSize: layoutConfig.tabBar.iconSize, color: '#007AFF' }}>ℹ️</Text>
) : (
            <SFSymbol 
              name="circle.grid.3x3.fill" 
              size={layoutConfig.tabBar.iconSize} 
              color="#007AFF" 
              weight="medium" 
            />
          )}
          <Text style={[
            styles.tabLabel, 
            styles.activeTabLabel,
            {
              fontSize: layoutConfig.tabBar.labelSize,
              marginTop: layoutConfig.tabBar.labelMarginTop,
            }
          ]}>{theme === 'default' ? t('keypadDefault') : t('keypad')}</Text>
        </TouchableOpacity>
        
        {/* 🎵 음성사서함/퀵카메라 버튼 */}
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
{theme === 'default' ? (
  <Text style={{ fontSize: layoutConfig.tabBar.iconSize, color: themeColors.tabIcon }}>📷</Text>
) : (
            <SFSymbol 
              name="recordingtape" 
              size={layoutConfig.tabBar.iconSize} 
              color={themeColors.tabIcon} 
              weight="regular" 
            />
          )}
          <Text style={[
            styles.tabLabel,
            { color: themeColors.tabIcon },
            {
              fontSize: layoutConfig.tabBar.labelSize,
              marginTop: layoutConfig.tabBar.labelMarginTop,
            }
          ]}>{theme === 'default' ? t('voicemailDefault') : t('voicemail')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ========================================================================================
// ℹ️ 정보 화면 컴포넌트
// ========================================================================================

const InfoScreen = ({ onClose, language, theme }: { 
  onClose: () => void; 
  language: string; 
  theme: string; 
}) => {
  const getInfoThemeColors = () => {
    switch (theme) {
      case 'default':
        return {
          background: '#FFFFFF',
          text: '#000000',
          textSecondary: '#666666',
          backButton: '#007AFF',
        };
      case 'dark':
        return {
          background: '#000000',
          text: '#FFFFFF',
          textSecondary: '#8E8E93',
          backButton: '#007AFF',
        };
      case 'light':
        return {
          background: '#F2F2F7',
          text: '#000000',
          textSecondary: '#666666',
          backButton: '#007AFF',
        };
      default:
        return {
          background: '#FFFFFF',
          text: '#000000',
          textSecondary: '#666666',
          backButton: '#007AFF',
        };
    }
  };

  const infoThemeColors = getInfoThemeColors();

  const getInfoText = () => {
    switch (language) {
      case 'ko':
        return `Router는 언제 어디서나 환상적인 전화를 이용한 퍼포먼스를 즐길 수 있게 해 주는 현대적인 마술 앱입니다. 관객이 직접 전화번호를 입력하고 통화 버튼을 누르면 마술사의 개입 없이 실시간으로 전화가 연결됩니다. 그 과정에서 수신자는 관객이 선택한 숫자, 카드, 그림 등 어떤 정보라도 정확히 맞히는 놀라운 순간을 만들어 낼 수 있습니다.

이 효과의 창시자이자 Diverter를 만든 **마크 크리스틴(Marc Kerstein)** 님께, 앱 출시를 허락해 주신 데 대해 무한한 존경과 감사를 드립니다.

아낌없는 조언을 통해 Router가 세상으로 나올 수 있도록 도와주신 **meanskim님, 주호영님, 황두성님, AB님**에게 감사의 말씀 전합니다.`;
      case 'ja':
        return `Routerは、いつでもどこでも素晴らしい電話を使ったパフォーマンスを楽しめる現代的なマジックアプリです。観客が直接電話番号を入力し、通話ボタンを押すと、マジシャンの介入なしにリアルタイムで電話が接続されます。その瞬間、受信者は観客が選んだ数字、カード、絵など、どんな情報でも正確に当てる驚くべき瞬間を作り出すことができます。

この効果の創始者であり、Diverterを作った**マーク・カースタイン（Marc Kerstein）**氏に、アプリリリースを許可していただいたことに対し、無限の敬意と感謝を表します。

惜しみないアドバイスを通じてRouterが世に出ることができるよう助けてくださった**meanskim様、주호영様、황두성様、AB様**に感謝の言葉をお伝えします。`;
      default:
        return `Router is a modern magic app that lets you enjoy spectacular phone performances anytime, anywhere. When spectators enter a phone number and press the call button themselves, the call connects in real time with no intervention from the magician. In that moment, the person on the other end can astonishingly reveal any information the audience has chosen—numbers, cards, drawings, and more.

With infinite respect and gratitude to **Marc Kerstein**, creator of *Diverter* and originator of this effect, for granting permission to release this app.

We extend our heartfelt thanks to **meanskim, JuHoYeong, HwangDooSeong, and AB** for their generous advice and support in bringing Router to the world.`;
    }
  };

  return (
    <View style={[styles.infoContainer, { backgroundColor: infoThemeColors.background }]}>
      <StatusBar barStyle={theme === 'light' || theme === 'default' ? 'dark-content' : 'light-content'} backgroundColor={infoThemeColors.background} />
      
      {/* 상단 네비게이션 */}
      <View style={styles.infoHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onClose}
        >
          <Text style={[styles.backArrow, { color: infoThemeColors.backButton }]}>←</Text>
        </TouchableOpacity>
      </View>
      
      {/* 정보 콘텐츠 */}
      <ScrollView 
        style={styles.infoContent}
        contentContainerStyle={styles.infoContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.infoText, { color: infoThemeColors.text }]}>
          {getInfoText()}
        </Text>
      </ScrollView>
    </View>
  );
};

// ========================================================================================
// 🎥 퀵카메라 컴포넌트
// ========================================================================================

// ========================================================================================
// 🎥 퀵카메라 컴포넌트 (완전 수정 버전)
// ========================================================================================

// ========================================================================================
// 🎥 퀵카메라 컴포넌트 (에러 수정 완료 버전)
// ========================================================================================

const QuickCameraScreen = ({ onClose, vibrationEnabled, blackMode }) => {
  const [isActive, setIsActive] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState('checking');
  const [device, setDevice] = useState(null);
  const [cameraState, setCameraState] = useState('waiting');
  const [blinkAnimation] = useState(new Animated.Value(1));
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  // 필요한 ref들
  const cameraRef = useRef(null);
  const captureInProgressRef = useRef(false);
  const componentMountedRef = useRef(true);

  // 🔥 1. safeSetIsActive 함수 (가장 먼저 정의)
  const safeSetIsActive = useCallback((active) => {
    if (captureInProgressRef.current) {
      console.log('⚠️ 촬영 중이므로 isActive 변경 무시:', active);
      return;
    }
    
    console.log('📸 isActive 변경:', active);
    setIsActive(active);
  }, []);

  // 🔥 2. resetToWaiting 함수
  const resetToWaiting = useCallback(() => {
    if (!componentMountedRef.current) return;
    
    console.log('🔄 대기 상태로 복구');
    setCameraState('waiting');
    captureInProgressRef.current = false;
    blinkAnimation.setValue(1);
  }, []);

  // 🔥 3. startBlinkAnimation 함수
  const startBlinkAnimation = useCallback(() => {
    const blink = () => {
      if (!componentMountedRef.current || cameraState !== 'saveFailed') return;
      
      Animated.sequence([
        Animated.timing(blinkAnimation, {
          toValue: 0.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        if (componentMountedRef.current && cameraState === 'saveFailed') {
          blink();
        }
      });
    };
    blink();
  }, [cameraState]);

  // 🔥 4. handleCameraError 함수 (takeSilentPhoto보다 먼저 정의)
  const handleCameraError = useCallback((error) => {
    console.log('❌ 카메라 onError:', error.code, error.message);
    
    if (!componentMountedRef.current) return;
    
    // 권한 관련 오류
    if (error.code === 'permission-denied') {
      setPermissionStatus('denied');
      return;
    }
    
    // 설정 충돌 감지 및 해결
    if (error.code === 'configuration-error' || 
        error.code === 'device-error' ||
        error.message.includes('configure') ||
        error.message.includes('Preview Layer stopped')) {
      
      console.log('🔧 카메라 설정 충돌 감지 - 재시작 시도');
      
      // 촬영 중이 아닐 때만 재시작
      if (!captureInProgressRef.current) {
        safeSetIsActive(false);
        setTimeout(() => {
          if (componentMountedRef.current && !captureInProgressRef.current) {
            safeSetIsActive(true);
            console.log('🔄 카메라 재시작 완료');
          }
        }, 1000);
      } else {
        console.log('⚠️ 촬영 중이므로 재시작 건너뛰기');
      }
      return;
    }
    
    // 기타 오류
    setCameraState('saveFailed');
    captureInProgressRef.current = false;
    startBlinkAnimation();
    
    setTimeout(() => {
      if (componentMountedRef.current) {
        resetToWaiting();
      }
    }, 3000);
  }, [safeSetIsActive, startBlinkAnimation, resetToWaiting]);

  // 📷 카메라 디바이스 로드
  useEffect(() => {
    const loadCameraDevice = async () => {
      componentMountedRef.current = true;
      
      if (!isCameraAvailable) {
        console.log('❌ 카메라 라이브러리 사용 불가');
        return;
      }
      
      try {
        const { Camera } = require('react-native-vision-camera');
        
        console.log('📷 카메라 권한 체크 시작');
        
        let permission = await Camera.getCameraPermissionStatus();
        console.log('🔍 현재 권한 상태:', permission);
        
        if (permission === 'denied' || permission === 'not-determined') {
          console.log('🔐 권한 요청 시작');
          permission = await Camera.requestCameraPermission();
        }
        
        if (!componentMountedRef.current) {
          console.log('⚠️ 컴포넌트 언마운트됨 - 초기화 중단');
          return;
        }
        
        setPermissionStatus(permission);
        
        if (permission === 'granted') {
          console.log('✅ 카메라 권한 획득, 디바이스 로드 시작');
          
          const devices = await Camera.getAvailableCameraDevices();
          
          if (!devices || devices.length === 0) {
            throw new Error('사용 가능한 카메라 디바이스가 없습니다');
          }
          
          const backDevice = devices.find(device => device.position === 'back');
          const selectedDevice = backDevice || devices[0];
          
          if (!componentMountedRef.current) {
            return;
          }
          
          console.log(`✅ 카메라 디바이스 선택: ${selectedDevice.name}`);
          setDevice(selectedDevice);
          
          setTimeout(() => {
            if (componentMountedRef.current) {
              setIsCameraReady(true);
              console.log('📷 카메라 준비 단계 1 완료');
              
              setTimeout(() => {
                if (componentMountedRef.current && !captureInProgressRef.current) {
                  safeSetIsActive(true);
                  console.log('✅ 카메라 완전 활성화');
                }
              }, 500);
            }
          }, 1000);
          
        } else {
          console.log('❌ 카메라 권한 거부됨:', permission);
        }
        
      } catch (error) {
        console.log('❌ 카메라 초기화 실패:', error.message);
        if (componentMountedRef.current) {
          setPermissionStatus('error');
        }
      }
    };

    loadCameraDevice();
    
    return () => {
      console.log('🧹 카메라 컴포넌트 클린업');
      componentMountedRef.current = false;
    };
  }, [safeSetIsActive]);

  // 📸 안전한 촬영 함수
  const takeSilentPhoto = useCallback(async () => {
    console.log('📸 촬영 시도 시작');
    
    // 중복 촬영 방지 강화
    if (captureInProgressRef.current || cameraState !== 'waiting') {
      console.log('⚠️ 촬영이 이미 진행 중이거나 대기 상태가 아님');
      return;
    }
    
    // 기본 조건 체크
    if (!componentMountedRef.current || 
        !cameraRef.current || 
        !device || 
        !isCameraReady || 
        !isActive ||
        permissionStatus !== 'granted') {
      
      console.log('❌ 촬영 조건 불충족');
      if (vibrationEnabled) {
        Vibration.vibrate(300);
      }
      return;
    }
    
    // 촬영 시작 - 상태 잠금
    captureInProgressRef.current = true;
    setCameraState('capturing');
    console.log('🔒 촬영 잠금 설정');

    try {
      if (vibrationEnabled) {
        Vibration.vibrate(50);
      }

      console.log('📷 takePhoto 실행');
      
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      });

      if (!componentMountedRef.current || !photo?.path) {
        console.log('⚠️ 촬영 후 검증 실패');
        return;
      }

      console.log('✅ 촬영 성공');
      setCameraState('saving');

      // 저장 처리
      if (CameraRoll) {
        try {
          const photoPath = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
          console.log('💾 저장 시작');
          
          await CameraRoll.saveAsset(photoPath, { type: 'photo' });
          
          if (!componentMountedRef.current) return;
          
          console.log('✅ 저장 완료');
          setCameraState('saved');
          
          if (vibrationEnabled) {
            Vibration.vibrate([100, 50, 100]);
          }

          setTimeout(() => {
            if (componentMountedRef.current) {
              console.log('🚪 자동 종료');
              onClose();
            }
          }, 2000);

        } catch (saveError) {
          console.log('❌ 저장 실패:', saveError.message);
          
          if (!componentMountedRef.current) return;
          
          setCameraState('saveFailed');
          if (vibrationEnabled) {
            Vibration.vibrate(500);
          }
          startBlinkAnimation();
          
          setTimeout(() => resetToWaiting(), 3000);
        }
      } else {
        setCameraState('saved');
        setTimeout(() => onClose(), 2000);
      }

    } catch (error) {
      console.log('❌ 촬영 실패:', error.message);
      
      if (!componentMountedRef.current) return;
      
      setCameraState('saveFailed');
      if (vibrationEnabled) {
        Vibration.vibrate([300, 100, 300]);
      }
      startBlinkAnimation();
      
      setTimeout(() => resetToWaiting(), 3000);
    } finally {
      console.log('🔓 촬영 잠금 해제');
      captureInProgressRef.current = false;
    }
  }, [device, isCameraReady, isActive, permissionStatus, cameraState, vibrationEnabled, startBlinkAnimation, resetToWaiting]);

  // 👆 화면 터치 처리
  const handleScreenTap = useCallback(() => {
    if (!componentMountedRef.current) return;
    
    if (captureInProgressRef.current || cameraState !== 'waiting' || !isActive) {
      console.log('⚠️ 터치 무시 - 촬영 불가능한 상태');
      return;
    }
    
    if (blackMode) {
      const now = Date.now();
      const DOUBLE_PRESS_DELAY = 500;
      
      if (lastTapTime && (now - lastTapTime) < DOUBLE_PRESS_DELAY) {
        console.log('👆 더블탭 감지 - 촬영 시작');
        takeSilentPhoto();
        setLastTapTime(0);
      } else {
        console.log('👆 첫 번째 탭');
        setLastTapTime(now);
        if (vibrationEnabled) {
          Vibration.vibrate(30);
        }
      }
    } else {
      console.log('👆 일반모드 탭 - 촬영 시작');
      takeSilentPhoto();
    }
  }, [blackMode, lastTapTime, takeSilentPhoto, vibrationEnabled, cameraState, isActive]);

  // 상태별 점 색상
  const getDotColor = () => {
    switch (cameraState) {
      case 'waiting': return styles.blueDot;
      case 'capturing':
      case 'saving':
      case 'saved': return styles.greenDot;
      case 'saveFailed': return styles.redDot;
      default: return styles.blueDot;
    }
  };

  // 권한 거부/오류 화면
  if (permissionStatus === 'denied' || permissionStatus === 'error') {
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

  // 메인 카메라 화면
  return (
    <View style={styles.cameraContainer}>
      <StatusBar hidden={true} />
      
      {/* 카메라 뷰 */}
      {device && permissionStatus === 'granted' && CameraView && (
        <CameraView
          ref={cameraRef}
          style={blackMode ? styles.hiddenCamera : styles.visibleCamera}
          device={device}
          isActive={isActive}
          photo={true}
          onError={handleCameraError} // ✅ 이제 함수가 정의되어 있음
          onInitialized={() => {
            console.log('✅ 카메라 onInitialized 호출됨');
          }}
        />
      )}

      {/* 블랙 모드 오버레이 */}
      {blackMode && (
        <TouchableOpacity 
          style={styles.blackScreen}
          onPress={handleScreenTap}
          activeOpacity={1}
        >
          <TouchableOpacity
            style={styles.exitTouchArea}
            onPress={onClose}
            activeOpacity={1}
          >
            <View style={styles.cameraStatusDot}>
              <Animated.View 
                style={[
                  styles.dot,
                  getDotColor(),
                  cameraState === 'saveFailed' && { opacity: blinkAnimation }
                ]} 
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* 일반 모드 오버레이 */}
      {!blackMode && (
        <>
          <TouchableOpacity 
            style={styles.cameraOverlay}
            onPress={handleScreenTap}
            activeOpacity={0.8}
          />
          <TouchableOpacity
            style={styles.exitTouchAreaVisible}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <View style={[styles.cameraStatusDotVisible, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
              <Animated.View 
                style={[
                  styles.dot,
                  getDotColor(),
                  cameraState === 'saveFailed' && { opacity: blinkAnimation }
                ]} 
              />
            </View>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

// ========================================================================================
// ⚙️ 설정 화면 컴포넌트
// ========================================================================================

const SettingsScreen = ({ 
  shortcuts, 
  vibrationEnabled, 
  cameraEnabled,
  cameraBlackMode, 
  settingsEnabled,
  directCallEnabled, 
  language,
  theme,
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
  cameraBlackMode: boolean;
  settingsEnabled: boolean;
  directCallEnabled: boolean;
  language: string;
  theme: string;
  isCameraAvailable: boolean;
  isCameraRollAvailable: boolean;
  onSave: (shortcuts: any, vibration: boolean, camera: boolean, cameraBlackMode: boolean, settings: boolean, directCall: boolean, language: string, theme: string) => void; // 수정됨
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
  const [newCameraBlackMode, setNewCameraBlackMode] = useState(cameraBlackMode);  // 이 줄 추가
  const [newSettingsEnabled, setNewSettingsEnabled] = useState(settingsEnabled);
  const [newLanguage, setNewLanguage] = useState(language);
  const [newTheme, setNewTheme] = useState(theme); // 테마 상태

  const handleLanguageChange = (newLanguage: string) => {
    setNewLanguage(newLanguage);
    // 언어 변경 시 바로 저장하고 메인 컴포넌트에 적용
    onSave(newShortcuts, newVibrationEnabled, newCameraEnabled, newCameraBlackMode, newSettingsEnabled, directCallEnabled, newLanguage, newTheme);
  };
  
  const handleThemeChange = (newTheme: string) => {
    setNewTheme(newTheme);
    // 테마 변경 시 바로 저장하고 메인 컴포넌트에 적용
    onSave(newShortcuts, newVibrationEnabled, newCameraEnabled, newCameraBlackMode, newSettingsEnabled, directCallEnabled, newLanguage, newTheme);
  };

  const handleSave = () => {
    onSave(newShortcuts, newVibrationEnabled, newCameraEnabled, newCameraBlackMode, newSettingsEnabled, directCallEnabled, newLanguage, newTheme);
    onClose();
  };

  // 설정 화면용 테마 색상 가져오기
  const getSettingsThemeColors = () => {
    switch (theme) {
      case 'default':
        return {
          background: '#000000',
          text: '#FFFFFF',
          textSecondary: '#8E8E93',
          container: '#1C1C1E',
          border: '#333333'
        };
      case 'dark':
        return {
          background: '#000000',
          text: '#FFFFFF',
          textSecondary: '#8E8E93',
          container: '#1C1C1E',
          border: '#333333'
        };
      case 'light':
        return {
          background: '#FFFFFF',
          text: '#000000',
          textSecondary: '#666666',
          container: '#F2F2F7',
          border: '#E5E5EA'
        };
      default:
        return {
          background: '#000000',
          text: '#FFFFFF',
          textSecondary: '#8E8E93',
          container: '#1C1C1E',
          border: '#333333'
        };
    }
  };

  const settingsThemeColors = getSettingsThemeColors();

  return (
    <View style={[styles.settingsContainer, { backgroundColor: settingsThemeColors.background }]}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={settingsThemeColors.background} />
      
      <View style={[styles.settingsHeader, { borderBottomColor: settingsThemeColors.border }]}>
        <Text style={[styles.settingsTitle, { fontSize: titleFontSize, color: settingsThemeColors.text }]}>{t('settings')}</Text>
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
          {/* 🌍 언어 설정 섹션 */}
          <View style={styles.settingSection}>
            <Text style={[styles.sectionTitle, { color: settingsThemeColors.text }]}>{t('languageSettings')}</Text>
            <LanguageDropdown 
              language={newLanguage}
              onLanguageChange={handleLanguageChange}
              t={t}
              themeColors={settingsThemeColors}
            />
          </View>

          {/* 🎨 테마 설정 섹션 */}
          <View style={styles.settingSection}>
            <Text style={[styles.sectionTitle, { color: settingsThemeColors.text }]}>{t('themeSettings')}</Text>
            <ThemeDropdown 
              theme={newTheme}
              onThemeChange={handleThemeChange}
              t={t}
              themeColors={settingsThemeColors}
            />
            <Text style={[styles.functionDesc, { marginTop: 10, paddingHorizontal: 15, color: settingsThemeColors.textSecondary }]}>
              {t('themeDesc')}
            </Text>
          </View>

          {/* ⚡ 단축어 다운로드 섹션 */}
          <View style={styles.settingSection}>
            <Text style={[styles.sectionTitle, { color: settingsThemeColors.text }]}>{t('shortcuts')}</Text>
            <TouchableOpacity 
              style={[styles.shortcutDownloadBox, { backgroundColor: settingsThemeColors.container }]}
              onPress={() => {
                Linking.openURL('https://right-bottom-c41.notion.site/Router-by-SYZ-23302a8a36fa805a8024e0371b8e9e62?source=copy_link')
                  .catch(err => console.log('링크 열기 실패'));
              }}
            >
              <View style={styles.shortcutDownloadContent}>
                <View style={styles.shortcutIcon}>
                  <Text style={styles.shortcutIconText}>⚡</Text>
                </View>
                <View style={styles.shortcutInfo}>
                  <Text style={[styles.shortcutTitle, { color: settingsThemeColors.text }]}>{t('shortcutDownload')}</Text>
                  <Text style={[styles.shortcutDesc, { color: settingsThemeColors.textSecondary }]}>
                    {t('shortcutDesc')}
                  </Text>
                </View>
                <View style={styles.shortcutArrow}>
                  <Text style={styles.shortcutArrowText}>→</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* ⚙️ 설정창 자동 시작 */}
          <View style={styles.settingSection}>
            <Text style={[styles.sectionTitle, { color: settingsThemeColors.text }]}>{t('settingsAutoStart')}</Text>
            <TouchableOpacity 
              style={[styles.vibrationSetting, { backgroundColor: settingsThemeColors.container }]}
              onPress={() => setNewSettingsEnabled(!newSettingsEnabled)}
            >
              <View style={styles.autoProcessLabelContainer}>
                <Text style={[styles.vibrationLabel, { color: settingsThemeColors.text }]}>{t('settingsAutoStartToggle')}</Text>
                <Text style={[styles.autoProcessDesc, { color: settingsThemeColors.textSecondary }]}>
                  {t('settingsAutoStartDesc')}
                </Text>
              </View>
              <View style={[styles.toggleSwitch, newSettingsEnabled && styles.toggleActive]}>
                <View style={[styles.toggleSlider, newSettingsEnabled && styles.sliderActive]} />
              </View>
            </TouchableOpacity>
          </View>

          {/* 📞 바로전화 모드 안내 */}
          <View style={styles.settingSection}>
            <Text style={[styles.sectionTitle, { fontSize: titleFontSize - 4, color: settingsThemeColors.text }]}>{t('directCallMode')}</Text>
            <View style={[styles.vibrationSetting, { backgroundColor: settingsThemeColors.container }]}>
              <View style={styles.autoProcessLabelContainer}>
                <Text style={[styles.vibrationLabel, { fontSize: baseFontSize, color: settingsThemeColors.text }]}>
                  {t('directCallToggle', { status: directCallEnabled ? t('on') : t('off') })}
                </Text>
                <Text style={[styles.autoProcessDesc, { fontSize: descFontSize, color: settingsThemeColors.textSecondary }]}>
                  {t('directCallDesc')}
                </Text>
              </View>
            </View>
          </View>

          {/* 🎥 퀵카메라 설정 */}
<View style={styles.settingSection}>
  <Text style={[styles.sectionTitle, { color: settingsThemeColors.text }]}>{t('quickCamera')}</Text>
  
  {/* 카메라 자동시작 토글 */}
  <TouchableOpacity 
    style={[
      styles.vibrationSetting,
      { backgroundColor: settingsThemeColors.container },
      (!isCameraAvailable || !isCameraRollAvailable) && styles.disabledSetting
    ]}
    onPress={() => {
      if (isCameraAvailable && isCameraRollAvailable) {
        setNewCameraEnabled(!newCameraEnabled);
      } else {
        Alert.alert('🎥 퀵 카메라', '현재 카메라 라이브러리가 없습니다.\nCamera 라이브러리를 추가하면 실제 기능이 활성화됩니다.', [
          { text: '확인', style: 'default' }
        ]);
      }
    }}
  >
    <View style={styles.autoProcessLabelContainer}>
      <Text style={[
        styles.vibrationLabel,
        { color: settingsThemeColors.text },
        (!isCameraAvailable || !isCameraRollAvailable) && styles.disabledLabel
      ]}>
        {t('cameraAutoStart')} {(!isCameraAvailable || !isCameraRollAvailable) && '(Mock 모드)'}
      </Text>
      <Text style={[styles.autoProcessDesc, { color: settingsThemeColors.textSecondary }]}>
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

  {/* 카메라 모드 드롭다운 (기존 토글 대신) */}
  <View style={{ marginTop: 15 }}>
    <CameraModeDropdown 
      cameraBlackMode={newCameraBlackMode}
      onCameraModeChange={(blackMode) => {
        if (isCameraAvailable && isCameraRollAvailable) {
          setNewCameraBlackMode(blackMode);
        } else {
          Alert.alert('🎥 퀵 카메라', '현재 카메라 라이브러리가 없습니다.', [
            { text: '확인', style: 'default' }
          ]);
        }
      }}
      t={t}
      themeColors={settingsThemeColors}
    />
    <Text style={[styles.functionDesc, { marginTop: 10, paddingHorizontal: 15, color: settingsThemeColors.textSecondary }]}>
      {t('cameraModeDesc')}
    </Text>
  </View>
</View>

          {/* 📳 진동 설정 */}
          <View style={styles.settingSection}>
            <Text style={[styles.sectionTitle, { color: settingsThemeColors.text }]}>{t('vibrationSettings')}</Text>
            <TouchableOpacity 
              style={[styles.vibrationSetting, { backgroundColor: settingsThemeColors.container }]}
              onPress={() => setNewVibrationEnabled(!newVibrationEnabled)}
            >
              <View style={styles.autoProcessLabelContainer}>
                <Text style={[styles.vibrationLabel, { color: settingsThemeColors.text }]}>{t('vibrationFeedback')}</Text>
                <Text style={[styles.autoProcessDesc, { color: settingsThemeColors.textSecondary }]}>
                  {t('vibrationDesc')}
                </Text>
              </View>
              <View style={[styles.toggleSwitch, newVibrationEnabled && styles.toggleActive]}>
                <View style={[styles.toggleSlider, newVibrationEnabled && styles.sliderActive]} />
              </View>
            </TouchableOpacity>
          </View>

          {/* 📞 전화번호 설정 */}
          <View style={styles.settingSection}>
            <Text style={[styles.sectionTitle, { color: settingsThemeColors.text }]}>{t('phoneSettings')}</Text>
            
            <View style={[styles.shortcutInputGroup, { backgroundColor: settingsThemeColors.container }]}>
              <Text style={[styles.shortcutLabel, { color: settingsThemeColors.textSecondary }]}>{t('targetPhone')}</Text>
              <TextInput
                style={[styles.shortcutInput, { color: settingsThemeColors.text }]}
                value={newShortcuts.targetPhone}
                onChangeText={(text) => setNewShortcuts(prev => ({...prev, targetPhone: text}))}
                placeholder={t('targetPhonePlaceholder')}
                placeholderTextColor={settingsThemeColors.textSecondary}
                keyboardType="default"
                returnKeyType="next"
                blurOnSubmit={false}
              />
              <Text style={[styles.functionDesc, { color: settingsThemeColors.textSecondary }]}>
                {t('targetPhoneDesc')}
              </Text>
            </View>

            <View style={[styles.shortcutInputGroup, { backgroundColor: settingsThemeColors.container, marginTop: 15 }]}>
              <Text style={[styles.shortcutLabel, { color: settingsThemeColors.textSecondary }]}>{t('unknownPhone')}</Text>
              <TextInput
                style={[styles.shortcutInput, { color: settingsThemeColors.text }]}
                value={newShortcuts.unknownPhone}
                onChangeText={(text) => setNewShortcuts(prev => ({...prev, unknownPhone: text}))}
                placeholder={t('unknownPhonePlaceholder')}
                placeholderTextColor={settingsThemeColors.textSecondary}
                keyboardType="default"
                returnKeyType="done"
                blurOnSubmit={true}
              />
              <Text style={[styles.functionDesc, { color: settingsThemeColors.textSecondary }]}>
                {t('unknownPhoneDesc')}
              </Text>
            </View>
          </View>

          {/* ℹ️ 도움말 */}
          <View style={[styles.helpText, { backgroundColor: settingsThemeColors.container }]}>
            <Text style={[styles.helpTitle, { color: settingsThemeColors.text }]}>{t('helpTitle')}</Text>
            <Text style={[styles.helpContent, { color: settingsThemeColors.textSecondary }]}>
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
// 🎨 스타일시트
// ========================================================================================

const styles = StyleSheet.create({
  // 메인 컨테이너
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // 번호 표시 영역
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
  
  // 연락처 관련
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
  customPersonIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  customPersonsIcon: {
    width: 18,
    height: 18,
    position: 'relative',
  },
  customPersonSmall: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    position: 'absolute',
    top: 3,
  },
  
  // 키패드
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  squareKey: {
    borderRadius: 8,
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
  
  // 하단 버튼들
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
  squareCallButton: {
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // 탭바
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
  
  // 카메라 화면
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
  
  // 설정 화면
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
  
  // 언어 드롭다운
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

  // 테마 드롭다운 스타일
  themeSelector: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 15,
  },
  themeSelectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeLabel: {
    fontSize: baseFontSize,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  selectedTheme: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeName: {
    fontSize: baseFontSize,
    color: '#8E8E93',
    marginRight: 8,
  },
  themeModal: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    minWidth: 200,
    maxWidth: 300,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 5,
  },
  themeOptionText: {
    fontSize: baseFontSize,
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
  },
  colorPreview: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },

  // 정보 화면 스타일
  infoContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  infoHeader: {
    paddingTop: 60,
    paddingLeft: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 24,
    fontWeight: '600',
    color: '#007AFF',
  },
  infoContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoContentContainer: {
    paddingBottom: 40,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000000',
    textAlign: 'left',
  },
  visibleCamera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  cameraStatusDotVisible: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitTouchAreaVisible: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
   // 카메라 모드 드롭다운 스타일
   cameraModeSelector: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 15,
  },
  cameraModeSelectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cameraModeLabel: {
    fontSize: baseFontSize,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  selectedCameraMode: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cameraModeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  cameraModeName: {
    fontSize: baseFontSize,
    color: '#8E8E93',
    marginRight: 8,
  },
  cameraModeModal: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    minWidth: 200,
    maxWidth: 300,
  },
  cameraModeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 5,
  },
  cameraModeOptionText: {
    fontSize: baseFontSize,
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
  },
});

export default MagicKeypad;