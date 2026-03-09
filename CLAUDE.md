# Royal Puzzle 2

Gem Match-3 퍼즐 게임. Phaser 3 기반 HTML5 Canvas.

## 빌드 명령어

```bash
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # tsc + vite build → dist/
npm run preview  # 빌드 결과 미리보기
npm run test     # vitest 테스트 실행
```

## 기술 스택

- **엔진**: Phaser 3.90
- **언어**: TypeScript
- **빌드**: Vite 6
- **테스트**: Vitest
- **배포**: Vercel (main push 시 자동 배포)
- **에셋**: gemini CLI + nanobanana 스타일

## 프로젝트 구조

```
src/
├── main.ts          # 엔트리포인트
├── config.ts        # 게임 설정 (390x844, 8x10 보드)
├── core/            # EventManager, ObjectPool
├── data/            # 레벨 데이터 (JSON)
├── game/            # 핵심 로직 (Board, Booster, Level, types)
├── scenes/          # Phaser 씬 (Boot, Map, Game, Result)
└── ui/              # HUD
public/
├── assets/          # 스프라이트 에셋
├── manifest.json    # PWA
└── sw.js            # Service Worker
```

## 게임 메커니즘 (Gem-Match3 차용)

- 5가지 보석 (Red/Blue/Green/Yellow/Purple)
- 3레이어 셀 (메인/언더레이/오버레이)
- 부스터 5종 (HRocket/VRocket/TNT/LightBall/Missile)
- 부스터 합체 10종
- UI 부스터 4종 (Hammer/Shuffle/Arrow/Cannon)
- TNT 파동형 폭발, LightBall FindMostCommon 패턴
