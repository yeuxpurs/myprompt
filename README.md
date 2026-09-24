# myprompt · JKE AI Toolkit

프롬프트 템플릿·라이브러리·가이드와 **AI 프롬프트 첨삭 비서**, **AI 품질검사 에이전트**를 모은 정적 웹 툴킷입니다.
GitHub Pages, `file://`, 로컬 서버 어디서나 열 수 있습니다.

## 🔑 내 API 키로 바로 쓰기 (권장)

1. `AI 프롬프트 첨삭 비서` 또는 `AI 품질검사 에이전트`를 엽니다.
2. **실행 모드 → 🔑 내 API 키**를 선택합니다.
3. 공급자를 고르고 API 키를 붙여넣습니다. `연결 테스트`로 확인할 수 있습니다.
4. `AI 첨삭` / `AI 검사 실행`을 누르면 끝입니다.

| 공급자 | 브라우저 직접 호출 | 비고 |
|---|---|---|
| OpenAI | ✅ | `gpt-5-mini` 기본 |
| Anthropic Claude | ✅ | `claude-sonnet-5` 기본 |
| Google Gemini | ✅ | `gemini-2.5-flash` 기본, OpenAI 호환 엔드포인트 |
| OpenRouter / Groq | ✅ | |
| Azure OpenAI | ✅ | 배포 엔드포인트 URL 필요 |
| 사용자 지정 (Ollama, LM Studio 등) | ✅ | 서버 쪽 CORS 허용 필요 |
| NVIDIA NIM | ❌ (CORS 차단) | `start-local` 실행 후 로컬 게이트웨이 경유 |

키 보관 방식

- 기본: 현재 탭의 `sessionStorage`에만 보관(탭을 닫으면 삭제).
- `이 브라우저에 키 기억`을 켜면 `localStorage`에 저장. 공용 PC에서는 끄세요.
- 키는 선택한 공급자 API(NVIDIA는 로컬 게이트웨이)로만 전송되며 이력·내보내기 파일에는 저장되지 않습니다.
- 한 번 입력한 설정은 두 도구에서 함께 사용됩니다.

## 로컬 실행

```bash
./start-local.sh        # Windows: start-local.bat / start-local.ps1
```

`http://127.0.0.1:8787/`에서 UI와 게이트웨이가 함께 열립니다. NVIDIA 키도 UI에 붙여넣으면 게이트웨이가 NVIDIA로 전달합니다(`/api/chat`).
서버 쪽 키/회사 게이트웨이 설정은 [server/README.md](server/README.md)를 참고하세요.
