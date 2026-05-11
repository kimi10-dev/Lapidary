# Lapidary

로컬 Obsidian vault를 웹에서 탐색, 검색, 편집하는 개인용 문서 관리 서버입니다.

## 실행

```bash
npm install
npm run dev
```

기본 주소는 `http://127.0.0.1:3000`입니다.

개발 서버는 필요할 때 사용자가 직접 실행합니다. 코드 변경, 타입체크, 빌드 검증만 필요한 작업에서는 서버를 자동으로 켜지 않습니다.

WSL에서 서버를 실행하고 Windows 브라우저로 접속할 때 Next 개발 서버의 HMR WebSocket이 실패하면 다음 명령을 사용합니다.

```bash
npm run dev:wsl
```

이 오류는 보통 `ws://127.0.0.1:3000/_next/webpack-hmr` 연결 실패나 `Blocked cross-origin request to Next.js dev resource` 경고로 표시됩니다. `next.config.ts`의 `allowedDevOrigins`에 로컬 개발 origin을 등록해야 하며, 설정을 바꾼 뒤에는 dev 서버를 재시작해야 합니다.

환경 변수로 vault를 바로 지정할 수 있습니다.

```bash
LAPIDARY_VAULT_PATH=/path/to/obsidian/vault npm run dev
```

앱 화면에서 vault path를 처음 설정하면 `data/settings.json`에 저장됩니다. 파일 원본은 항상 vault의 Markdown 파일이며, 삭제는 vault 내부 `.lapidary-trash/`로 이동합니다.

## 현재 구현 범위

- vault path 설정
- 폴더 트리 탐색
- Markdown/text 파일 열기
- CodeMirror 기반 편집과 `Ctrl/Cmd + S` 저장
- Markdown preview와 기본 wikilink 검색 연결
- 새 문서/폴더 생성
- 이름 변경/이동
- 휴지통 삭제
- 파일명/본문 검색
- vault root 밖 접근 차단, 절대 경로 차단, symlink 차단
