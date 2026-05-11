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

- Tailscale user identity 연동
- Tailscale ACL 예시 문서화
- 공개 인터넷 배포 모드가 필요해질 경우 앱 자체 인증 재검토
- audit log

---

## 27. 최종 MVP 정의

Lapidary MVP는 다음 문장으로 정의한다.

**Tailscale로 접근 가능한 로컬 웹앱에서 Obsidian vault의 Markdown 파일을 탐색, 열람, 편집, 생성, 삭제, 이동, 검색할 수 있는 개인용 문서 관리 서버.**

MVP 완료 기준:

- 로컬 PC에서 서버 실행 가능
- Tailscale 주소로 접속 가능
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
3. 파일 트리
4. 문서 읽기
5. 문서 저장
6. 검색 인덱스

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

기술적으로는 Next.js, TypeScript, SQLite, Drizzle, CodeMirror, Tailscale Serve 조합을 사용한다. 문서 원본은 항상 로컬 vault의 `.md` 파일이며, DB는 설정, 검색 인덱스, 최근 문서 같은 보조 데이터만 저장한다.

MVP는 Tailscale 접근, vault 탐색, 문서 읽기/쓰기, 생성/삭제/이동, 검색까지 포함한다. 이후 Obsidian 친화 기능, 백링크, 태그, Git 연동, AI 기능으로 확장할 수 있다.
