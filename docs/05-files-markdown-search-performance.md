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

