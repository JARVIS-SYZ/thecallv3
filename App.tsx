import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableHighlight,
  StyleSheet,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';

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

// 기종별 크기 계산
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

// 키 크기 계산
const getKeySize = () => {
  const screenType = getScreenType();
  const keyMargin = 12;
  const horizontalPadding = 50;
  const availableWidth = width - horizontalPadding;
  const baseKeySize = (availableWidth - (keyMargin * 4)) / 3;
  
  const sizeMultipliers = {
    small: 0.75,
    medium: 0.82,
    standard: 0.88,
    'standard-pro': 0.90,
    large: 0.93,
    xlarge: 0.96,
    xxlarge: 0.98,
    xxxlarge: 1.0
  };
  
  const keySize = baseKeySize * sizeMultipliers[screenType];
  return Math.max(Math.min(keySize, 85), 60);
};

// 폰트 크기 계산
const getFontSizes = () => {
  const screenType = getScreenType();
  
  const fontConfigs = {
    small: { keyNumber: 22, keyLetters: 6, numberDisplay: 22 },
    medium: { keyNumber: hasHomeButton ? 25 : 27, keyLetters: 10, numberDisplay: 35 },
    standard: { keyNumber: 35, keyLetters: 9, numberDisplay: 37 },
    'standard-pro': { keyNumber: 35, keyLetters: 9, numberDisplay: 35 },
    large: { keyNumber: hasHomeButton ? 30 : 32, keyLetters: hasHomeButton ? 10 : 11, numberDisplay: hasHomeButton ? 36 : 38 },
    xlarge: { keyNumber: 33, keyLetters: 11, numberDisplay: 38 },
    xxlarge: { keyNumber: 34, keyLetters: 12, numberDisplay: 42 },
    xxxlarge: { keyNumber: 36, keyLetters: 13, numberDisplay: 44 }
  };
  
  return fontConfigs[screenType];
};

const keySize = getKeySize();
const fontSizes = getFontSizes();

const MagicKeypad = () => {
  const [currentNumber, setCurrentNumber] = useState('');
  const [directCallEnabled, setDirectCallEnabled] = useState(false);
  const [callButtonClickCount, setCallButtonClickCount] = useState(1);

  // 전화번호 포맷팅
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
    
    const newNumber = currentNumber + num;
    const formatted = formatPhoneNumber(newNumber);
    setCurrentNumber(formatted);
  };

  const deleteLastNumber = () => {
    if (currentNumber.length === 0) return;
    
    let newNumber = currentNumber.slice(0, -1);
    if (newNumber.endsWith('-')) {
      newNumber = newNumber.slice(0, -1);
    }
    
    const formatted = formatPhoneNumber(newNumber);
    setCurrentNumber(formatted);
  };

  const handleCallPress = () => {
    // 캘린더 일정 추가 로직 (나중에 구현)
    console.log('통화 버튼 클릭');
    
    // 바로전화 모드 OFF일 때만 클릭 카운트 감소
    if (!directCallEnabled && callButtonClickCount > 0) {
      setCallButtonClickCount(prev => prev - 1);
    }
    
    // 2초 후 입력창 지우기
    setTimeout(() => {
      setCurrentNumber('');
    }, 2000);
  };

  const handleFavoritesPress = () => {
    // 즐겨찾기 버튼: 바로전화 모드 토글
    setDirectCallEnabled(prev => {
      const newMode = !prev;
      // 바로전화 OFF로 변경될 때 통화버튼 카운트를 1로 설정
      if (!newMode) {
        setCallButtonClickCount(1);
      }
      return newMode;
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* 번호 표시 영역 */}
      <View style={styles.displayContainer}>
        <Text style={[styles.numberDisplay, { fontSize: fontSizes.numberDisplay }]}>
          {currentNumber}
        </Text>
      </View>

      {/* 키패드 영역 */}
      <View style={styles.keypadContainer}>
        <View style={styles.keypad}>
          {/* 첫 번째 줄: 1 2 3 */}
          <View style={styles.keypadRow}>
            {[['1', ''], ['2', 'ABC'], ['3', 'DEF']].map(([number, letters], index) => (
              <TouchableHighlight
                key={`row1-${index}`}
                style={[styles.key, { width: keySize, height: keySize, borderRadius: keySize / 2 }]}
                onPress={() => addNumber(number)}
                underlayColor="#555555"
                activeOpacity={1}
              >
                <View style={styles.keyContent}>
                  <Text style={[styles.keyNumber, { fontSize: fontSizes.keyNumber }]}>{number}</Text>
                  {letters ? <Text style={[styles.keyLetters, { fontSize: fontSizes.keyLetters }]}>{letters}</Text> : null}
                </View>
              </TouchableHighlight>
            ))}
          </View>

          {/* 두 번째 줄: 4 5 6 */}
          <View style={styles.keypadRow}>
            {[['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO']].map(([number, letters], index) => (
              <TouchableHighlight
                key={`row2-${index}`}
                style={[styles.key, { width: keySize, height: keySize, borderRadius: keySize / 2 }]}
                onPress={() => addNumber(number)}
                underlayColor="#555555"
                activeOpacity={1}
              >
                <View style={styles.keyContent}>
                  <Text style={[styles.keyNumber, { fontSize: fontSizes.keyNumber }]}>{number}</Text>
                  {letters ? <Text style={[styles.keyLetters, { fontSize: fontSizes.keyLetters }]}>{letters}</Text> : null}
                </View>
              </TouchableHighlight>
            ))}
          </View>

          {/* 세 번째 줄: 7 8 9 */}
          <View style={styles.keypadRow}>
            {[['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ']].map(([number, letters], index) => (
              <TouchableHighlight
                key={`row3-${index}`}
                style={[styles.key, { width: keySize, height: keySize, borderRadius: keySize / 2 }]}
                onPress={() => addNumber(number)}
                underlayColor="#555555"
                activeOpacity={1}
              >
                <View style={styles.keyContent}>
                  <Text style={[styles.keyNumber, { fontSize: fontSizes.keyNumber }]}>{number}</Text>
                  {letters ? <Text style={[styles.keyLetters, { fontSize: fontSizes.keyLetters }]}>{letters}</Text> : null}
                </View>
              </TouchableHighlight>
            ))}
          </View>

          {/* 네 번째 줄: * 0 # */}
          <View style={styles.keypadRow}>
            <TouchableHighlight
              style={[styles.key, { width: keySize, height: keySize, borderRadius: keySize / 2 }]}
              onPress={() => addNumber('*')}
              underlayColor="#555555"
              activeOpacity={1}
            >
              <View style={styles.keyContent}>
                <Text style={[styles.keyNumber, { fontSize: fontSizes.keyNumber }]}>*</Text>
              </View>
            </TouchableHighlight>
            
            <TouchableHighlight
              style={[styles.key, { width: keySize, height: keySize, borderRadius: keySize / 2 }]}
              onPress={() => addNumber('0')}
              underlayColor="#555555"
              activeOpacity={1}
            >
              <View style={styles.keyContent}>
                <Text style={[styles.keyNumber, { fontSize: fontSizes.keyNumber }]}>0</Text>
                <Text style={[styles.keyLetters, { fontSize: fontSizes.keyLetters }]}>+</Text>
              </View>
            </TouchableHighlight>
            
            <TouchableHighlight
              style={[styles.key, { width: keySize, height: keySize, borderRadius: keySize / 2 }]}
              onPress={() => addNumber('#')}
              underlayColor="#555555"
              activeOpacity={1}
            >
              <View style={styles.keyContent}>
                <Text style={[styles.keyNumber, { fontSize: fontSizes.keyNumber }]}>#</Text>
              </View>
            </TouchableHighlight>
          </View>
        </View>

        {/* 하단 버튼들 */}
        <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity 
            style={[styles.callButton, { width: keySize, height: keySize, borderRadius: keySize / 2 }]}
            onPress={handleCallPress}
          >
            <Text style={styles.callButtonText}>📞</Text>
          </TouchableOpacity>
          
          {/* 삭제 버튼 */}
          {currentNumber.length > 0 && (
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={deleteLastNumber}
            >
              <Text style={styles.deleteButtonText}>⌫</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 하단 탭바 */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={handleFavoritesPress}>
          <Text style={styles.tabIcon}>⭐</Text>
          <Text style={styles.tabLabel}>즐겨찾기</Text>
          {/* 바로전화 OFF이고 통화버튼 클릭 카운트가 1일 때만 상태 점 표시 */}
          {!directCallEnabled && callButtonClickCount === 1 && (
            <View style={styles.statusIndicator}>
              <View style={styles.statusDot} />
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabIcon}>🕐</Text>
          <Text style={styles.tabLabel}>최근 통화</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabIcon}>👤</Text>
          <Text style={styles.tabLabel}>연락처</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.tabItem, styles.activeTabItem]}>
          <Text style={[styles.tabIcon, styles.activeTabIcon]}>⌨️</Text>
          <Text style={[styles.tabLabel, styles.activeTabLabel]}>키패드</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabIcon}>📼</Text>
          <Text style={styles.tabLabel}>음성사서함</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  displayContainer: {
    paddingTop: hasHomeButton ? 80 : 120,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
    minHeight: 100,
  },
  numberDisplay: {
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  keypadContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: hasHomeButton ? 20 : 40,
  },
  keypad: {
    alignItems: 'center',
    marginBottom: 30,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  key: {
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  keyContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyNumber: {
    fontWeight: '650',
    color: '#FFFFFF',
  },
  keyLetters: {
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: 2,
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  callButton: {
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButtonText: {
    fontSize: 30,
    color: '#FFFFFF',
  },
  deleteButton: {
    position: 'absolute',
    right: 60,
    top: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  deleteButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingBottom: hasHomeButton ? 10 : 30,
    backgroundColor: '#000000',
  },
  tabItem: {
    alignItems: 'center',
    padding: 5,
    position: 'relative',
  },
  activeTabItem: {},
  tabIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  activeTabIcon: {
    color: '#007AFF',
  },
  tabLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '400',
  },
  activeTabLabel: {
    color: '#007AFF',
  },
  statusIndicator: {
    position: 'absolute',
    top: -5,
    left: '30%',
    marginLeft: -1.5,
  },
  statusDot: {
    width: 2,
    height: 2,
    borderRadius: 1.5,
    backgroundColor: '#666666',
  },
});

export default MagicKeypad;