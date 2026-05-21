import confetti from 'canvas-confetti'

/** 결과 화면 star=3 시 가벼운 폭죽 */
export function celebratePerfect() {
  confetti({
    particleCount: 120,
    spread: 75,
    origin: { y: 0.65 },
    colors: ['#a78bfa', '#f59e0b', '#10b981', '#f43f5e', '#38bdf8'],
    scalar: 0.9,
  })
}

/** 레벨업 — 양 옆에서 쏘는 듀얼 캐논 */
export function celebrateLevelUp() {
  const end = Date.now() + 700
  const colors = ['#a78bfa', '#f59e0b', '#fbbf24', '#fde68a']

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.7 },
      colors,
    })
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.7 },
      colors,
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}

/** 보스 클리어 시 풀스크린 폭발 */
export function celebrateBoss() {
  confetti({
    particleCount: 250,
    spread: 120,
    origin: { y: 0.5 },
    startVelocity: 50,
    colors: ['#f59e0b', '#f43f5e', '#a78bfa', '#10b981'],
  })
}
