## 19. 상태 관리

### 19.1 클라이언트 상태

관리할 상태:

- 현재 열린 파일
- 파일 트리 열림 상태
- 에디터 내용
- 저장 상태
- 검색어
- 검색 결과
- preview/editor mode
- sidebar open 상태

도구:

- React state
- TanStack Query 선택 가능
- Zustand 선택 가능

MVP에서는 과도한 상태관리 라이브러리 없이 시작 가능.

### 19.2 서버 상태

서버에서 관리할 상태:

- 세션
- 설정
- 파일 인덱스
- 검색 인덱스
- 최근 문서

---

## 20. 에러 처리

### 20.1 주요 에러 코드

```txt
UNAUTHORIZED
FORBIDDEN
INVALID_PATH
PATH_OUTSIDE_VAULT
FILE_NOT_FOUND
FILE_ALREADY_EXISTS
FILE_CONFLICT
FILE_TOO_LARGE
UNSUPPORTED_FILE_TYPE
VAULT_NOT_CONFIGURED
INDEX_NOT_READY
INTERNAL_ERROR
```

### 20.2 사용자 메시지 원칙

- 기술적 에러를 그대로 노출하지 않는다.
- 사용자에게 다음 행동을 알려준다.
- 위험한 작업 실패 시 파일을 손상시키지 않는다.

예시:

```txt
이 파일은 열 수 없습니다. Vault 밖의 경로를 가리키고 있을 수 있습니다.
```

```txt
이 문서는 다른 프로그램에서 수정되었습니다. 다시 불러온 뒤 저장해주세요.
```

---

## 21. 배포 및 실행

### 21.1 로컬 실행

개발:

```bash
npm install
npm run dev
```

프로덕션:

```bash
npm run build
npm start
```

### 21.2 환경 변수

```env
LAPIDARY_HOST=127.0.0.1
LAPIDARY_PORT=3000
DATABASE_URL=file:./data/lapidary.sqlite
BETTER_AUTH_SECRET=change-me
BETTER_AUTH_URL=https://your-device.tailnet-name.ts.net
LAPIDARY_VAULT_PATH=/path/to/obsidian/vault
```

### 21.3 Tailscale Serve

예상 구조:

```txt
localhost:3000 → Tailscale Serve → tailnet HTTPS URL
```

앱은 로컬에만 바인딩하고, tailnet 접근은 Tailscale에서 처리한다.

### 21.4 자동 실행

운영 방식 후보:

- systemd service
- macOS LaunchAgent
- Windows Task Scheduler
- PM2
- Docker Compose

MVP에서는 OS별 자동 실행 문서는 후순위로 두고, 수동 실행부터 지원한다.

---

