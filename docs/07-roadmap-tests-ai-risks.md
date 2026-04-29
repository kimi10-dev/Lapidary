## 22. 개발 로드맵

### Phase 0: 프로젝트 초기화

목표:

- Next.js 프로젝트 생성
- TypeScript strict 설정
- Tailwind/shadcn/ui 설정
- 기본 레이아웃 구성
- SQLite/Drizzle 설정
- Better Auth 기본 연결

완료 조건:

- 로그인 페이지 접근 가능
- DB 생성 가능
- 보호된 페이지 접근 제어 가능

### Phase 1: Vault 읽기

목표:

- vault path 설정
- 폴더 트리 표시
- Markdown 파일 읽기
- preview 표시

완료 조건:

- 브라우저에서 vault 폴더를 탐색할 수 있다.
- `.md` 파일을 열 수 있다.

### Phase 2: 편집과 저장

목표:

- CodeMirror 에디터 연결
- 파일 저장 API 구현
- 충돌 감지 기본 구현
- 저장 상태 UI 구현

완료 조건:

- 브라우저에서 문서를 수정하고 저장하면 실제 vault 파일에 반영된다.

### Phase 3: 생성/삭제/이동

목표:

- 새 문서 생성
- 새 폴더 생성
- 이름 변경
- 이동
- 휴지통 삭제

완료 조건:

- 기본 파일 관리 작업을 웹에서 수행할 수 있다.

### Phase 4: 검색

목표:

- 파일명 검색
- 본문 검색
- 검색 결과 UI
- SQLite FTS 도입

완료 조건:

- vault 전체 문서를 빠르게 검색할 수 있다.

### Phase 5: Obsidian 친화 기능

목표:

- wikilink 렌더링
- wikilink 클릭 이동
- 태그 파싱
- 최근 문서
- 즐겨찾기

완료 조건:

- Obsidian 문서를 웹에서도 자연스럽게 탐색할 수 있다.

### Phase 6: 안정화

목표:

- 보안 점검
- 경로 검증 테스트
- 대용량 vault 성능 개선
- 모바일 UX 개선
- 백업/복원 정책 정리

완료 조건:

- 실사용 가능한 개인용 버전으로 안정화된다.

---

## 23. 테스트 계획

### 23.1 단위 테스트

대상:

- path safety 함수
- vault root 검사
- 확장자 검사
- 파일명 validation
- wikilink parser
- search query normalizer

### 23.2 통합 테스트

대상:

- 파일 읽기 API
- 파일 저장 API
- 파일 생성 API
- 파일 삭제 API
- 파일 이동 API
- 인증 보호 API

### 23.3 보안 테스트

테스트 케이스:

```txt
../../secret.txt
..%2F..%2Fsecret.txt
/path/to/absolute/file
C:\Windows\System32\drivers\etc\hosts
symlink-to-outside
null-byte injection
hidden file access
```

### 23.4 수동 테스트

시나리오:

- 모바일에서 로그인
- 모바일에서 문서 수정
- Obsidian에서 수정 후 Lapidary에서 저장 충돌 감지
- Tailscale 주소로 접근
- 긴 문서 preview
- 대량 폴더 탐색

---

## 24. AI 개발 가이드

AI에게 구현을 맡길 때 프로젝트 규칙을 명확히 전달해야 한다.

### 24.1 고정 규칙

```txt
- Next.js App Router를 사용한다.
- TypeScript strict mode를 사용한다.
- 모든 파일 시스템 API는 서버에서만 실행한다.
- 파일 관련 Route Handler에는 export const runtime = "nodejs"를 명시한다.
- Edge Runtime은 사용하지 않는다.
- 사용자가 입력한 path는 절대 fs API에 직접 전달하지 않는다.
- 모든 path는 vault root 기준 상대경로만 허용한다.
- symlink는 기본적으로 거부한다.
- 삭제는 실제 삭제가 아니라 휴지통 이동으로 구현한다.
- 문서 원본은 SQLite가 아니라 Obsidian vault의 .md 파일이다.
- DB에는 메타데이터와 인덱스만 저장한다.
```

### 24.2 AI에게 줄 첫 구현 프롬프트 예시

```txt
Next.js App Router + TypeScript로 개인용 Obsidian vault 웹 관리 앱 Lapidary를 만들고 싶다.

요구사항:
- Node.js runtime만 사용
- Edge runtime 금지
- vault root 밖 파일 접근 금지
- 모든 파일 경로는 vault root 기준 상대경로만 허용
- path traversal 방어 필수
- symlink 접근 금지
- Markdown 파일 읽기/쓰기 API 구현
- 파일 저장은 atomic write 방식
- UI는 Tailwind + shadcn/ui
- 에디터는 CodeMirror
- DB는 SQLite + Drizzle
- 인증은 Better Auth

먼저 프로젝트 폴더 구조, 핵심 타입, path safety 유틸, vault file service부터 구현해줘.
```

---

## 25. 리스크와 대응

### 25.1 파일 손상 위험

대응:

- atomic write
- 저장 전 충돌 감지
- 휴지통 삭제
- 백업 권장

### 25.2 vault 밖 파일 접근 위험

대응:

- path resolve 검사
- symlink 차단
- 절대경로 입력 금지
- path safety 테스트 작성

### 25.3 Obsidian과 동시 수정 충돌

대응:

- mtime/hash 기반 충돌 감지
- 충돌 시 강제 저장 제한
- 다른 파일로 저장 옵션

### 25.4 모바일 UX 복잡도

대응:

- 초기에는 핵심 편집 UX만 제공
- 파일 트리는 drawer 처리
- 검색 중심 탐색 제공

### 25.5 인덱싱 성능 문제

대응:

- 백그라운드 인덱싱
- 증분 업데이트
- SQLite FTS
- 큰 파일 skip 옵션

---

