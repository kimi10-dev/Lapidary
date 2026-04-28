# Lapidary 기획문서

## 1. 제품 개요

### 1.1 제품명

**Lapidary**

Lapidary는 보석을 감정하고 세공하는 사람 또는 기술을 뜻한다. Obsidian vault를 하나의 원석처럼 보고, 사용자가 웹을 통해 문서를 들여다보고, 다듬고, 정리할 수 있게 해주는 개인용 문서 관리 인터페이스라는 의미를 담는다.

### 1.2 한 줄 설명

**로컬 PC에 있는 Obsidian 문서 저장소를 웹에서 안전하게 보고, 검색하고, 편집할 수 있게 해주는 개인용 문서 관리 서버.**

### 1.3 제품 컨셉

Lapidary는 Obsidian 자체를 대체하지 않는다. Obsidian vault를 원본 저장소로 유지하면서, 외부 기기에서 접근 가능한 웹 인터페이스를 제공한다.

사용자는 로컬 PC에서 Lapidary 서버를 실행하고, Tailscale을 통해 개인 네트워크 안에서 웹으로 접속한다. 모바일, 태블릿, 다른 PC에서도 인증 후 Obsidian 문서를 열람하고 수정할 수 있다.

### 1.4 핵심 가치

- Obsidian vault를 그대로 사용한다.
- 문서 원본은 항상 로컬 `.md` 파일이다.
- 외부 클라우드에 문서를 올리지 않는다.
- Tailscale과 앱 자체 인증을 조합해 안전하게 접근한다.
- 모바일 브라우저에서도 문서를 빠르게 보고 수정할 수 있다.
- 복잡한 협업 도구가 아니라 개인 문서 관리에 집중한다.

---

## 2. 문제 정의

### 2.1 현재 문제

Obsidian은 로컬 문서 관리에 강력하지만, 다음 문제가 있다.

- 외부 기기에서 로컬 vault에 접근하기 어렵다.
- 모바일에서 특정 PC의 Obsidian 문서를 바로 수정하기 어렵다.
- Obsidian Sync를 쓰지 않는 경우 동기화 구성이 번거롭다.
- 로컬 PC에 있는 vault를 웹에서 간단히 열람하거나 편집하는 방법이 부족하다.
- 파일 시스템을 직접 조작하려면 원격 데스크톱이나 SSH 등 불편한 방법이 필요하다.

### 2.2 Lapidary가 해결할 문제

Lapidary는 다음 문제를 해결한다.

- 로컬 vault를 웹 UI로 탐색한다.
- Markdown 문서를 브라우저에서 읽고 수정한다.
- 새 문서를 생성한다.
- 문서를 삭제, 이동, 이름 변경한다.
- 문서 검색을 제공한다.
- Tailscale 기반 개인 네트워크에서 안전하게 접근한다.
- 별도 클라우드 저장소 없이 로컬 파일을 원본으로 유지한다.

---

## 3. 대상 사용자

### 3.1 1차 사용자

**Obsidian을 로컬 PC에서 사용하고, 외부 기기에서 자신의 문서를 보고 수정하고 싶은 개인 사용자.**

특징:

- 개발자 또는 파워유저 성향
- Tailscale 같은 개인 네트워크 도구 사용 가능
- 로컬 파일 기반 문서 관리를 선호
- 클라우드 업로드를 꺼리거나 직접 관리하고 싶어함
- 모바일에서 빠르게 메모를 확인하거나 수정하고 싶어함

### 3.2 2차 사용자

- 홈서버 사용자
- 개인 위키 사용자
- Markdown 기반 지식 저장소 사용자
- Obsidian vault를 여러 기기에서 관리하고 싶은 사용자

### 3.3 비대상 사용자

초기 버전에서는 다음 사용자는 주요 대상이 아니다.

- 여러 명이 동시에 협업하는 팀
- Google Docs 같은 실시간 공동 편집을 기대하는 사용자
- 클라우드 SaaS 형태의 문서 관리 제품을 원하는 사용자
- Obsidian을 사용하지 않는 일반 문서 관리 사용자

---

## 4. 제품 목표와 비목표

### 4.1 목표

MVP 기준 목표:

1. 로컬 Obsidian vault를 웹에서 탐색할 수 있다.
2. Markdown 파일을 열람할 수 있다.
3. Markdown 파일을 편집하고 저장할 수 있다.
4. 새 문서를 생성할 수 있다.
5. 문서를 삭제하거나 휴지통으로 이동할 수 있다.
6. 파일명 변경과 폴더 이동을 지원한다.
7. 로그인 기반 인증을 제공한다.
8. vault root 밖의 파일에는 절대 접근할 수 없다.
9. 모바일 브라우저에서도 사용할 수 있다.
10. Tailscale 환경에서 안정적으로 동작한다.

### 4.2 비목표

초기 버전에서 하지 않을 것:

- Obsidian 플러그인 완전 호환
- 실시간 다중 사용자 공동 편집
- 자체 클라우드 동기화
- 완전한 Git 클라이언트
- PDF, Word, Excel 등 비Markdown 문서 편집
- 공개 인터넷 배포용 SaaS
- 복잡한 권한 관리
- 조직/팀/워크스페이스 기능

---

## 5. 핵심 제품 원칙

### 5.1 Local-first

문서 원본은 항상 로컬 파일 시스템의 Obsidian vault다. DB는 보조 인덱스와 메타데이터 저장소로만 사용한다.

### 5.2 Safe-by-default

파일 삭제, 이동, 덮어쓰기 같은 위험한 작업은 안전장치를 둔다.

- 삭제는 기본적으로 휴지통 이동
- 저장 전 충돌 감지
- vault root 밖 접근 차단
- symlink 접근 제한
- path traversal 방지

### 5.3 Thin interface

Lapidary는 Obsidian의 대체품이 아니라, Obsidian vault를 외부에서 다루는 얇은 웹 인터페이스다.

### 5.4 Fast enough, not overengineered

개인용 도구이므로 처음부터 과도한 분산 구조를 만들지 않는다. 단, 검색, 인덱싱, 파일 감지는 나중에 확장 가능하게 분리한다.

---

## 6. 주요 사용 시나리오

### 6.1 모바일에서 문서 확인

1. 사용자가 휴대폰 브라우저에서 Lapidary에 접속한다.
2. 로그인한다.
3. vault 폴더 트리에서 문서를 찾는다.
4. Markdown preview로 내용을 확인한다.
5. 필요하면 편집 모드로 전환해 수정한다.
6. 저장한다.

### 6.2 외부 PC에서 빠른 수정

1. 사용자가 외부 PC에서 Tailscale 주소로 접속한다.
2. 로그인한다.
3. 최근 문서 목록에서 문서를 연다.
4. 내용을 수정한다.
5. 저장한다.
6. 로컬 PC의 Obsidian vault에 바로 반영된다.

### 6.3 새 문서 작성

1. 사용자가 특정 폴더를 선택한다.
2. `New note` 버튼을 누른다.
3. 파일명을 입력한다.
4. 기본 Markdown 템플릿으로 새 문서가 생성된다.
5. 에디터가 열린다.
6. 작성 후 저장한다.

### 6.4 문서 정리

1. 사용자가 파일 트리에서 문서를 선택한다.
2. 이름 변경 또는 이동을 선택한다.
3. 대상 폴더를 선택한다.
4. 시스템이 충돌 파일명을 검사한다.
5. 문서를 이동한다.
6. 검색 인덱스를 갱신한다.

### 6.5 문서 검색

1. 사용자가 검색창에 키워드를 입력한다.
2. 제목, 경로, 본문에서 검색한다.
3. 결과 목록을 표시한다.
4. 사용자가 결과를 선택한다.
5. 해당 문서를 연다.

---

## 7. MVP 범위

### 7.1 MVP 필수 기능

#### 인증

- 로그인
- 로그아웃
- 세션 유지
- 초기 관리자 계정 생성
- 비밀번호 기반 인증

#### Vault 설정

- vault root path 설정
- vault 유효성 검사
- 설정 저장

#### 파일 탐색

- 폴더 트리 조회
- Markdown 파일 목록 표시
- 폴더 접기/펼치기
- 현재 선택 파일 하이라이트

#### 문서 읽기

- `.md` 파일 열기
- Markdown 원문 표시
- Markdown preview 표시
- 파일 메타데이터 표시
  - 파일명
  - 경로
  - 수정일
  - 크기

#### 문서 편집

- Markdown 에디터
- 저장
- 저장 상태 표시
- 변경 여부 표시
- 저장 단축키
- 편집/미리보기 전환

#### 문서 생성

- 새 파일 생성
- 새 폴더 생성
- 중복 파일명 검사
- `.md` 확장자 자동 보정

#### 문서 삭제

- 휴지통 이동
- 삭제 확인 다이얼로그
- 실제 삭제 옵션은 초기 버전에서 숨기거나 비활성화

#### 문서 이름 변경/이동

- 파일명 변경
- 폴더 이동
- 중복 경로 검사
- vault root 밖 이동 차단

#### 검색

- 파일명 검색
- 본문 검색
- 검색 결과 목록
- 결과 클릭 시 문서 열기

#### 보안

- 로그인하지 않은 요청 차단
- vault root 밖 접근 차단
- path traversal 방어
- symlink 접근 제한
- API 요청 validation

### 7.2 MVP 제외 기능

- 실시간 공동 편집
- Git 연동
- 백링크 그래프
- 고급 태그 관리
- Obsidian plugin API 호환
- 이미지 업로드 UX 고도화
- 사용자 다중 권한 관리
- 웹소켓 기반 실시간 업데이트
- 모바일 앱
- 데스크톱 앱

---

## 8. 정보 구조

### 8.1 주요 화면

1. Login
2. Initial Setup
3. Vault Dashboard
4. Document View/Edit
5. Search Results
6. Settings

### 8.2 화면 구조

#### Vault Dashboard

```txt
+------------------------------------------------------+
| Top Bar: Lapidary / Search / User menu               |
+----------------------+-------------------------------+
| Sidebar              | Main Panel                    |
| - File tree          | - Document editor/preview     |
| - Recent files       | - Metadata                    |
| - Favorites          |                               |
+----------------------+-------------------------------+
```

#### 모바일 구조

```txt
+---------------------------+
| Top Bar                   |
+---------------------------+
| Search                    |
+---------------------------+
| Document / Tree Toggle    |
+---------------------------+
| Editor or Preview         |
+---------------------------+
```

모바일에서는 사이드바를 drawer로 처리한다.

---

## 9. UX 상세

### 9.1 파일 트리

기능:

- 폴더 접기/펼치기
- 파일 클릭 시 문서 열기
- 우클릭 또는 메뉴 버튼
  - 새 문서
  - 새 폴더
  - 이름 변경
  - 이동
  - 삭제
- 폴더 단위 lazy loading 가능

파일 표시 규칙:

- `.md` 파일 우선 표시
- 숨김 파일은 기본적으로 숨김
- `.obsidian` 폴더는 기본적으로 숨김
- 설정에서 숨김 파일 표시 가능

### 9.2 문서 에디터

기능:

- Markdown 원문 편집
- 저장 버튼
- `Cmd/Ctrl + S` 저장
- 변경사항 있음 표시
- 저장 성공/실패 토스트
- 마지막 저장 시간 표시

상태:

- `Saved`
- `Unsaved changes`
- `Saving...`
- `Conflict detected`
- `Read only`

### 9.3 Preview

기능:

- Markdown 렌더링
- 제목, 리스트, 코드블록, 테이블 지원
- Obsidian wikilink 기본 렌더링
  - `[[문서명]]`
  - `[[문서명|별칭]]`
- 내부 링크 클릭 시 해당 문서 열기

MVP에서는 Obsidian의 모든 문법을 완벽히 지원하지 않아도 된다.

### 9.4 검색

검색창 UX:

- 상단 고정 검색창
- `Cmd/Ctrl + K`로 열기
- 검색 결과는 파일명, 경로, 본문 일부 표시
- 최근 열람 문서도 같이 표시 가능

검색 결과 예시:

```txt
검색어: auth

1. projects/lapidary/security.md
   ...Better Auth를 사용하고 session cookie를...

2. notes/tailscale.md
   ...Tailscale Serve 앞단에 auth layer를...
```

### 9.5 설정

설정 항목:

- Vault path
- 앱 포트
- 휴지통 폴더명
- 숨김 파일 표시 여부
- `.obsidian` 폴더 표시 여부
- 자동 저장 여부
- 검색 인덱스 재생성
- 계정 비밀번호 변경

---

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

## 14. API 설계

### 14.1 공통 규칙

- 모든 API는 JSON 반환
- 모든 파일 경로는 vault root 기준 상대경로
- 절대경로 입력 금지
- 인증 필요
- 에러는 일관된 형태로 반환

에러 응답 예시:

```json
{
  "ok": false,
  "error": {
    "code": "PATH_OUTSIDE_VAULT",
    "message": "The requested path is outside the vault."
  }
}
```

성공 응답 예시:

```json
{
  "ok": true,
  "data": {}
}
```

### 14.2 Auth API

Better Auth 라우트를 사용한다.

```txt
/api/auth/*
```

### 14.3 Setup API

#### GET /api/setup/status

초기 설정 여부 확인.

응답:

```json
{
  "ok": true,
  "data": {
    "isConfigured": true,
    "hasAdmin": true,
    "vaultPathSet": true
  }
}
```

#### POST /api/setup

초기 관리자 계정과 vault path 설정.

요청:

```json
{
  "email": "user@example.com",
  "password": "password",
  "vaultPath": "/Users/name/Documents/ObsidianVault"
}
```

### 14.4 Tree API

#### GET /api/tree?path=

폴더 트리 또는 특정 폴더 자식 조회.

응답:

```json
{
  "ok": true,
  "data": {
    "path": "projects",
    "items": [
      {
        "name": "lapidary.md",
        "path": "projects/lapidary.md",
        "type": "file",
        "extension": ".md",
        "size": 1200,
        "mtime": "2026-04-29T10:00:00.000Z"
      }
    ]
  }
}
```

### 14.5 File API

#### GET /api/files?path=notes/test.md

파일 내용 조회.

응답:

```json
{
  "ok": true,
  "data": {
    "path": "notes/test.md",
    "content": "# Test",
    "mtimeMs": 1770000000000,
    "hash": "abc123"
  }
}
```

#### PUT /api/files

파일 저장.

요청:

```json
{
  "path": "notes/test.md",
  "content": "# Updated",
  "baseMtimeMs": 1770000000000
}
```

응답:

```json
{
  "ok": true,
  "data": {
    "path": "notes/test.md",
    "mtimeMs": 1770000001000
  }
}
```

충돌 응답:

```json
{
  "ok": false,
  "error": {
    "code": "FILE_CONFLICT",
    "message": "The file has changed since it was opened."
  }
}
```

#### POST /api/files

새 파일 생성.

요청:

```json
{
  "path": "notes/new-note.md",
  "content": "# New Note"
}
```

#### DELETE /api/files

파일 휴지통 이동.

요청:

```json
{
  "path": "notes/old.md"
}
```

### 14.6 Folder API

#### POST /api/folders

새 폴더 생성.

요청:

```json
{
  "path": "projects/new-folder"
}
```

### 14.7 Move/Rename API

#### POST /api/move

파일 또는 폴더 이동/이름 변경.

요청:

```json
{
  "from": "notes/a.md",
  "to": "archive/a.md"
}
```

### 14.8 Search API

#### GET /api/search?q=keyword

검색.

응답:

```json
{
  "ok": true,
  "data": {
    "query": "keyword",
    "results": [
      {
        "path": "notes/test.md",
        "title": "test.md",
        "snippet": "...keyword...",
        "score": 10
      }
    ]
  }
}
```

### 14.9 Index API

#### POST /api/index/rebuild

검색 인덱스 재생성.

관리자만 실행 가능.

---

## 15. 파일 시스템 동작 정책

### 15.1 허용 파일

MVP에서 편집 가능한 파일:

```txt
.md
.markdown
.txt
```

기본 UI에서는 `.md` 중심으로 표시한다.

### 15.2 숨김 파일

기본적으로 숨김 처리:

```txt
.obsidian/
.git/
.lapidary/
.DS_Store
```

설정에서 숨김 파일 표시 옵션을 추가할 수 있다.

### 15.3 첨부파일

MVP에서는 이미지 파일은 열람만 지원한다.

지원 가능 확장자:

```txt
.png
.jpg
.jpeg
.gif
.webp
.svg
.pdf
```

이미지 업로드와 삽입은 후순위 기능.

### 15.4 파일명 규칙

금지 문자:

- null byte
- OS별 경로 구분자 악용
- 제어 문자

권장 처리:

- 앞뒤 공백 제거
- 빈 파일명 금지
- 중복 파일명 금지
- `.md` 확장자 자동 추가 옵션

---

## 16. Markdown / Obsidian 호환성

### 16.1 MVP 지원

- 기본 Markdown
- 제목
- 리스트
- 체크박스
- 코드블록
- 인라인 코드
- 링크
- 이미지
- 테이블
- 인용문

### 16.2 Obsidian 문법 지원

MVP에서 기본 지원:

- `[[문서명]]`
- `[[문서명|별칭]]`
- `![[이미지.png]]`는 가능하면 이미지 preview

후순위:

- block reference
- embed note
- callout
- Dataview
- Canvas
- Excalidraw
- 복잡한 plugin syntax

### 16.3 Wikilink resolve 정책

`[[Note]]` 클릭 시 탐색 순서:

1. 정확히 `Note.md` 파일명 검색
2. 제목이 Note인 파일 검색
3. 경로 일부 매칭
4. 여러 개면 선택 다이얼로그 표시
5. 없으면 새 문서 생성 제안

---

## 17. 검색 설계

### 17.1 MVP 검색

MVP에서는 다음 조합 추천:

- 초기에는 파일 시스템 스캔 기반 간단 검색
- 이후 SQLite FTS5로 전환

검색 대상:

- 파일명
- 상대 경로
- Markdown 본문

### 17.2 인덱싱

초기 인덱싱:

1. vault 전체 스캔
2. `.md` 파일 수집
3. 파일 메타데이터 저장
4. 본문 FTS 인덱스 저장

증분 인덱싱:

1. chokidar로 파일 변경 감지
2. 변경된 파일만 다시 읽기
3. file_index 갱신
4. search_index 갱신

### 17.3 성능 정책

- 폴더 트리는 lazy loading
- 검색 결과는 limit 적용
- 큰 파일은 preview 렌더링 제한 가능
- 인덱싱은 worker에서 수행
- UI thread에서 대용량 Markdown 파싱 금지

---

## 18. 성능 요구사항

### 18.1 목표 성능

개인 vault 기준 목표:

```txt
파일 수: 1,000~20,000개
문서 열기: 300ms 이내 목표
파일 저장: 500ms 이내 목표
검색 응답: 500ms 이내 목표
초기 vault 스캔: 백그라운드 진행
```

### 18.2 성능 최적화 원칙

- 매 요청마다 vault 전체 스캔 금지
- 파일 트리는 필요한 폴더만 조회
- 검색은 인덱스 기반
- 대용량 파일은 경고 표시
- Markdown preview는 debounce 적용
- 자동 저장은 debounce 적용

---

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

## 26. 향후 확장 아이디어

### 26.1 Obsidian 친화 기능

- 백링크 표시
- 태그 페이지
- graph view
- frontmatter 편집 UI
- daily note 생성
- template 적용
- broken link 탐지

### 26.2 문서 관리 기능

- 즐겨찾기
- 최근 문서
- 문서 pin
- 폴더별 sort
- 변경 이력
- 문서 diff
- 휴지통 복원

### 26.3 고급 기능

- Git commit 연동
- 자동 백업
- AI 요약
- AI 검색
- 문서 간 연결 추천
- 모바일 PWA
- Tauri 데스크톱 앱

### 26.4 보안 고도화

- 2FA
- WebAuthn
- Tailscale user identity 연동
- IP allowlist
- audit log

---

## 27. 최종 MVP 정의

Lapidary MVP는 다음 문장으로 정의한다.

**Tailscale로 접근 가능한 로컬 웹앱에서 로그인 후 Obsidian vault의 Markdown 파일을 탐색, 열람, 편집, 생성, 삭제, 이동, 검색할 수 있는 개인용 문서 관리 서버.**

MVP 완료 기준:

- 로컬 PC에서 서버 실행 가능
- Tailscale 주소로 접속 가능
- 로그인 가능
- vault path 설정 가능
- 파일 트리 탐색 가능
- Markdown 문서 열람 가능
- Markdown 문서 편집/저장 가능
- 새 문서 생성 가능
- 휴지통 삭제 가능
- 파일 이동/이름 변경 가능
- 검색 가능
- vault root 밖 접근 방어 완료
- 모바일 브라우저에서 기본 사용 가능

---

## 28. 추천 우선순위

가장 먼저 만들 것:

1. path safety 유틸
2. vault file service
3. 인증
4. 파일 트리
5. 문서 읽기
6. 문서 저장

이 순서가 중요한 이유는 Lapidary의 핵심 리스크가 UI가 아니라 **로컬 파일을 안전하게 조작하는 것**이기 때문이다. 파일 접근 계층을 먼저 안전하게 만들고, 그 위에 UI와 검색을 얹는 방식이 가장 안정적이다.

---

## 29. 제품 톤앤매너

Lapidary는 기술적인 도구지만, UI는 너무 개발자 도구처럼 거칠지 않게 만든다.

느낌:

- 조용함
- 정돈됨
- 신뢰감
- 빠름
- 개인 서재
- 보석 세공 도구

피해야 할 느낌:

- 복잡한 관리자 페이지
- 팀 협업 SaaS
- 과도한 클라우드 서비스 느낌
- IDE처럼 무거운 느낌

키워드:

```txt
quiet
precise
private
local
crafted
focused
```

---

## 30. 요약

Lapidary는 Obsidian vault를 외부에서 안전하게 다루기 위한 개인용 웹 인터페이스다. 핵심은 화려한 기능보다 안전한 파일 접근, 빠른 문서 열람, 신뢰할 수 있는 저장, 모바일 접근성이다.

기술적으로는 Next.js, TypeScript, SQLite, Drizzle, Better Auth, CodeMirror, Tailscale Serve 조합을 사용한다. 문서 원본은 항상 로컬 vault의 `.md` 파일이며, DB는 인증, 설정, 검색 인덱스, 최근 문서 같은 보조 데이터만 저장한다.

MVP는 인증, vault 탐색, 문서 읽기/쓰기, 생성/삭제/이동, 검색까지 포함한다. 이후 Obsidian 친화 기능, 백링크, 태그, Git 연동, AI 기능으로 확장할 수 있다.

