## 10. 기술 스택

### 10.1 권장 스택

```txt
Framework: Next.js App Router
Language: TypeScript
UI: Tailwind CSS + shadcn/ui
Icons: lucide-react
Editor: CodeMirror
Markdown: markdown-it 또는 unified/remark
Auth: Better Auth
DB: SQLite
ORM: Drizzle
SQLite Driver: better-sqlite3
File Watcher: chokidar
Network: Tailscale Serve
Runtime: Node.js
```

### 10.2 선택 이유

#### Next.js

AI 기반 개발에 유리하다. 예제와 레퍼런스가 많고, React 생태계가 넓다. App Router와 Route Handler를 사용하면 UI와 API를 하나의 프로젝트에서 관리할 수 있다.

#### TypeScript

파일 경로, API 요청, DB schema, 문서 메타데이터 타입을 안전하게 관리할 수 있다.

#### SQLite

개인용 로컬 앱에 적합하다. 별도 DB 서버가 필요 없고, 설정이 단순하다.

#### Drizzle

TypeScript 친화적인 ORM이다. SQLite와 잘 맞고 schema 관리가 명확하다.

#### Better Auth

Next.js와 DB 기반 인증을 구성하기 좋다. email/password 로그인과 세션 관리를 구현할 수 있다.

#### CodeMirror

Markdown 편집기에 적합하다. 가볍고 확장성이 좋다.

#### Tailscale Serve

로컬 PC의 Lapidary 서버를 tailnet 안에서 안전하게 노출할 수 있다.

---

## 11. 시스템 아키텍처

### 11.1 전체 구조

```txt
Client Browser
    ↓
Tailscale Serve
    ↓
Next.js Server
    ├─ App UI
    ├─ API Routes
    ├─ Auth Layer
    ├─ Vault File Service
    ├─ Search Service
    ├─ Indexer Worker
    └─ SQLite DB
            ↓
Obsidian Vault on Local File System
```

### 11.2 주요 모듈

#### App UI

- 파일 트리
- 에디터
- 미리보기
- 검색
- 설정

#### API Routes

- 인증된 요청만 처리
- 파일 작업 요청 수신
- 입력값 검증
- 서버 서비스 호출

#### Vault File Service

역할:

- vault root 경로 관리
- 파일 읽기
- 파일 쓰기
- 파일 생성
- 파일 삭제
- 파일 이동
- 파일명 변경
- path safety 검사

#### Search Service

역할:

- 파일명 검색
- 본문 검색
- SQLite FTS 인덱스 조회
- 검색 결과 snippet 생성

#### Indexer Worker

역할:

- vault 스캔
- Markdown 파일 메타데이터 수집
- 본문 인덱싱
- 파일 변경 감지 시 인덱스 업데이트

#### Auth Layer

역할:

- 로그인 처리
- 세션 검증
- 보호된 API 차단

---

## 12. 보안 설계

### 12.1 보안 모델

Lapidary의 보안은 두 층으로 구성한다.

```txt
1차 방어선: Tailscale 네트워크 접근 제한
2차 방어선: Lapidary 자체 로그인 인증
```

Tailscale이 있어도 앱 인증은 필수로 둔다.

### 12.2 파일 경로 보안

가장 중요한 보안 원칙:

**사용자 입력 path를 절대 그대로 파일 시스템 API에 넘기지 않는다.**

모든 경로는 다음 순서로 처리한다.

1. 사용자 입력 path 수신
2. null byte 검사
3. 절대경로 여부 검사
4. vault root 기준으로 resolve
5. 최종 resolved path가 vault root 내부인지 검사
6. symlink 여부 검사
7. 허용된 확장자 또는 허용된 작업인지 검사
8. 파일 작업 실행

금지 예시:

```txt
../../.ssh/id_rsa
/etc/passwd
C:\Users\...\secret.txt
```

### 12.3 Symlink 정책

MVP에서는 symlink를 따라가지 않는다.

이유:

- symlink를 통해 vault 밖 파일에 접근할 수 있다.
- path traversal 방어를 우회할 수 있다.
- 개인용 앱에서는 symlink 지원보다 안전성이 우선이다.

### 12.4 삭제 정책

기본 삭제는 실제 삭제가 아니라 휴지통 이동이다.

예시:

```txt
.vault/.lapidary-trash/2026-04-29/filename.md
```

또는 vault root에 다음 폴더를 생성한다.

```txt
.lapidary-trash/
```

삭제 시 메타데이터:

- 원래 경로
- 삭제 시간
- 삭제한 사용자
- 복원 가능 여부

### 12.5 저장 정책

파일 저장은 atomic write를 사용한다.

순서:

1. 현재 파일의 mtime 확인
2. 충돌 여부 검사
3. 임시 파일에 새 내용 작성
4. fsync 가능하면 수행
5. 기존 파일로 rename
6. 인덱스 업데이트

예시:

```txt
note.md
note.md.tmp-lapidary-xxxx
```

### 12.6 충돌 감지

사용자가 문서를 열었을 때의 `mtime` 또는 content hash를 기억한다.

저장 시점에 실제 파일의 `mtime`이 달라졌다면 충돌로 본다.

충돌 시 옵션:

- 다시 불러오기
- 내 내용을 다른 파일로 저장
- 강제로 덮어쓰기
- diff 보기

MVP에서는 다음 두 개만 제공해도 된다.

- 다시 불러오기
- 다른 파일로 저장

### 12.7 인증 정책

MVP 인증:

- email/password 또는 username/password
- 세션 쿠키
- HttpOnly cookie
- Secure cookie
- SameSite=Lax 또는 Strict
- 비밀번호 해시 저장

관리자 계정:

- 최초 실행 시 생성
- 또는 CLI에서 생성
- 초기 설정 완료 후 공개 회원가입 비활성화

### 12.8 API 보호

모든 `/api/*` 라우트는 기본적으로 인증 필요.

예외:

- `/api/auth/*`
- 최초 setup 확인 API

### 12.9 네트워크 정책

앱 서버는 가능하면 `127.0.0.1`에만 바인딩한다.

```txt
HOST=127.0.0.1
PORT=3000
```

외부 접속은 Tailscale Serve가 담당한다.

---

## 13. 데이터 모델

### 13.1 DB 역할

SQLite는 문서 원본 저장소가 아니다.

SQLite에 저장할 것:

- 사용자
- 세션
- 설정
- 파일 인덱스
- 검색 인덱스
- 최근 문서
- 즐겨찾기
- 삭제 기록

SQLite에 저장하지 않을 것:

- 문서 원본 본문
- 첨부파일 원본
- Obsidian vault 전체 복사본

### 13.2 테이블 초안

#### users

```txt
id
email
name
password_hash
created_at
updated_at
```

#### sessions

Better Auth schema를 따른다.

#### settings

```txt
key
value
updated_at
```

예시 key:

```txt
vault_path
trash_path
show_hidden_files
auto_save_enabled
```

#### file_index

```txt
id
path
name
extension
size
mtime_ms
ctime_ms
content_hash
is_directory
parent_path
created_at
updated_at
```

#### search_index

SQLite FTS용 virtual table.

```txt
path
title
content
```

#### recent_files

```txt
id
path
opened_at
```

#### favorites

```txt
id
path
created_at
```

#### trash_items

```txt
id
original_path
trash_path
deleted_at
restored_at
```

---

