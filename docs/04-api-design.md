## 14. API 설계

### 14.1 공통 규칙

- 모든 API는 JSON 반환
- 모든 파일 경로는 vault root 기준 상대경로
- 절대경로 입력 금지
- 앱 자체 인증은 두지 않고 Tailscale tailnet 내부 접근을 전제
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

### 14.2 Setup API

#### GET /api/setup/status

초기 설정 여부 확인.

응답:

```json
{
  "ok": true,
  "data": {
    "isConfigured": true,
    "vaultPathSet": true
  }
}
```

#### POST /api/setup

초기 vault path 설정.

요청:

```json
{
  "vaultPath": "/Users/name/Documents/ObsidianVault"
}
```

### 14.3 Tree API

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

### 14.4 File API

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

### 14.5 Folder API

#### POST /api/folders

새 폴더 생성.

요청:

```json
{
  "path": "projects/new-folder"
}
```

### 14.6 Move/Rename API

#### POST /api/move

파일 또는 폴더 이동/이름 변경.

요청:

```json
{
  "from": "notes/a.md",
  "to": "archive/a.md"
}
```

### 14.7 Search API

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

### 14.8 Index API

#### POST /api/index/rebuild

검색 인덱스 재생성.

---
