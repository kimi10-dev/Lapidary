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

