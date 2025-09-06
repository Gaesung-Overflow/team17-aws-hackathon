# 레트로 아케이드 스타일 UI 구현 가이드

## 전체 디자인 철학

80년대 아케이드 게임의 네온사인과 CRT 모니터 느낌을 현대적으로 재해석한 사이버펑크 스타일

## 1. 기본 색상 팔레트 및 CSS 변수

```css
:root {
  --neon-green: #00ff41;
  --neon-cyan: #00ffff;
  --neon-pink: #ff0080;
  --neon-yellow: #ffff00;
  --neon-red: #ff0040;
  --dark-bg: #0a0a0a;
  --panel-bg: rgba(0, 20, 40, 0.9);
}
```

## 2. 배경 스타일

```css
/* 그라데이션 + 방사형 네온 효과 */
background:
  radial-gradient(
    circle at 20% 80%,
    rgba(255, 0, 255, 0.1) 0%,
    transparent 50%
  ),
  radial-gradient(
    circle at 80% 20%,
    rgba(0, 255, 255, 0.1) 0%,
    transparent 50%
  ),
  linear-gradient(135deg, #000000 0%, #111111 100%);
```

## 3. 네온 글로우 효과

```css
.neon-glow-green {
  color: var(--neon-green);
  text-shadow:
    0 0 5px var(--neon-green),
    0 0 10px var(--neon-green);
}

.neon-glow-cyan {
  color: var(--neon-cyan);
  text-shadow:
    0 0 5px var(--neon-cyan),
    0 0 10px var(--neon-cyan);
}
```

## 4. 레트로 폰트 스타일

```css
.retro-font {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.retro-title {
  font-size: 2.5rem;
  background: linear-gradient(45deg, var(--neon-cyan), var(--neon-pink));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
}
```

## 5. 패널 및 컨테이너

```css
.retro-panel {
  background: var(--panel-bg);
  border: 2px solid var(--neon-cyan);
  border-radius: 10px;
  padding: 20px;
  box-shadow:
    0 0 20px rgba(0, 255, 255, 0.3),
    inset 0 0 20px rgba(0, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}
```

## 6. 버튼 스타일

```css
.retro-button {
  background: linear-gradient(45deg, var(--neon-green), var(--neon-cyan));
  border: none;
  color: black;
  padding: 12px 24px;
  font-weight: bold;
  text-transform: uppercase;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
}

.retro-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 25px rgba(0, 255, 255, 0.7);
}
```

## 7. 입력 요소 (슬라이더, 셀렉트)

```css
.retro-slider {
  background: var(--dark-bg);
  border: 1px solid var(--neon-green);
  accent-color: var(--neon-green);
}

.retro-select {
  background: var(--dark-bg);
  color: var(--neon-green);
  border: 1px solid var(--neon-green);
  padding: 4px 8px;
  border-radius: 3px;
}
```

## 8. 게임보드 CRT 효과

```css
.arcade-crt-effect {
  position: relative;
  filter: contrast(1.2) brightness(1.1);
}

.arcade-crt-effect::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(transparent 50%, rgba(0, 255, 0, 0.03) 50%);
  background-size: 100% 4px;
  pointer-events: none;
  z-index: 1000;
}

.arcade-scanlines {
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 255, 0, 0.05) 2px,
    rgba(0, 255, 0, 0.05) 4px
  );
}
```

## 9. 플로팅 UI 스타일

```css
.arcade-info-panel {
  background: rgba(0, 10, 20, 0.95);
  border: 1px solid var(--neon-cyan);
  border-radius: 8px;
  padding: 12px;
  box-shadow:
    0 0 20px rgba(0, 255, 255, 0.4),
    inset 0 0 10px rgba(0, 255, 255, 0.1);
  backdrop-filter: blur(15px);
}
```

## 10. 애니메이션 효과

```css
/* 깜빡이는 경고 효과 */
.warning-flash {
  animation: warningFlash 0.5s infinite alternate;
}

@keyframes warningFlash {
  0% {
    background-color: transparent;
  }
  100% {
    background-color: rgba(255, 0, 0, 0.3);
  }
}

/* 네온 펄스 효과 */
.neon-pulse {
  animation: neonPulse 2s ease-in-out infinite alternate;
}

@keyframes neonPulse {
  from {
    text-shadow:
      0 0 5px var(--neon-cyan),
      0 0 10px var(--neon-cyan);
  }
  to {
    text-shadow:
      0 0 10px var(--neon-cyan),
      0 0 20px var(--neon-cyan);
  }
}
```

## 11. 클래스 네이밍 컨벤션

- `retro-*`: 기본 레트로 스타일 요소
- `arcade-*`: 게임보드 관련 아케이드 효과
- `neon-glow-*`: 네온 글로우 효과 (색상별)
- `*-panel`: 패널/컨테이너 스타일

## 12. 반응형 고려사항

```css
@media (max-width: 768px) {
  .retro-panel {
    padding: 15px;
    margin: 10px;
  }

  .retro-title {
    font-size: 1.8rem;
  }
}
```

## 적용 원칙

1. **일관성**: 모든 UI 요소에 동일한 색상 팔레트와 네온 효과 적용
2. **계층구조**: 중요도에 따라 글로우 강도와 색상 차별화
3. **가독성**: 네온 효과가 텍스트 가독성을 해치지 않도록 조절
4. **성능**: 과도한 그림자/블러 효과로 인한 성능 저하 방지
5. **접근성**: 색상만으로 정보를 전달하지 않고 텍스트/아이콘 병행

## 구현 예시

### 기본 컴포넌트 구조

```tsx
<div className="retro-panel">
  <h3 className="retro-font neon-glow-cyan">TITLE</h3>
  <button className="retro-button">ACTION</button>
  <input className="retro-slider" type="range" />
</div>
```

### 플로팅 UI 구조

```tsx
<div className="arcade-info-panel">
  <div className="retro-font neon-glow-green">STATUS</div>
  <div className="arcade-scanlines">{/* 게임 정보 */}</div>
</div>
```

이 가이드를 따르면 일관된 80년대 아케이드 스타일의 사이버펑크 UI를 구현할 수 있습니다.
