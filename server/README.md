# JKE AI Gateway

정적 프런트엔드와 NVIDIA/OpenAI/Azure OpenAI 사이의 Node.js 18+ 게이트웨이입니다. 외부 npm 패키지가 필요하지 않습니다.

## 로컬에서 UI까지 한 번에 실행

PowerShell 예시:

```powershell
$env:NVIDIA_API_KEY="nvapi-..."   # 실제 API를 쓸 때만
$env:SERVE_STATIC="1"
node server/ai-gateway.mjs
```

다음 주소에서 UI와 API가 같은 Origin으로 열립니다.

```text
http://127.0.0.1:8787/
```

루트의 `start-local.bat`, `start-local.ps1`, `start-local.sh`도 동일한 통합 모드를 사용합니다.

## API 게이트웨이만 실행

```powershell
$env:NVIDIA_API_KEY="nvapi-..."
$env:ALLOWED_ORIGINS="http://127.0.0.1:8000,http://localhost:8000,null"
node server/ai-gateway.mjs
```

기본 바인딩은 `127.0.0.1:8787`입니다. `null` Origin은 `file://`에서 연 화면이 로컬 게이트웨이에 접속할 때 사용됩니다.

## 원격 배포

```text
HOST=0.0.0.0
PORT=8787
ALLOWED_ORIGINS=https://<account>.github.io
GATEWAY_TOKEN=<long-random-token>
NVIDIA_API_KEY=<secret>
```

컨테이너 배포는 저장소 루트의 `Dockerfile`을 사용할 수 있습니다.

## 환경변수

| 변수 | 의미 |
|---|---|
| `NVIDIA_API_KEY` | NVIDIA NIM 서버 키 |
| `OPENAI_API_KEY` | OpenAI 서버 키 |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI 서버 키 |
| `HOST` / `PORT` | 바인딩 주소와 포트 |
| `SERVE_STATIC=1` | `index.html`과 `app/`도 함께 제공 |
| `ALLOWED_ORIGINS` | 쉼표로 구분한 정확한 브라우저 Origin |
| `GATEWAY_TOKEN` | 선택형 `X-Gateway-Token` 접근 토큰 |
| `MAX_BODY_BYTES` | 최대 요청 크기, 기본 25 MB |
| `UPSTREAM_TIMEOUT_MS` | 공급자 API 타임아웃, 기본 180초 |

## 경로

```text
GET  /health
POST /api/prompt-refine
POST /api/prompt-run
POST /api/inspect
```

## 보호 범위

- 브라우저에 공급자 API 키를 전달하지 않습니다.
- 허용된 Origin만 CORS 응답을 받습니다.
- 선택한 경우 `X-Gateway-Token`을 요구합니다.
- NVIDIA, OpenAI, Azure OpenAI의 허용된 HTTPS 호스트로만 전달합니다.
- 정적 모드에서도 `server/` 소스와 임의 파일은 제공하지 않습니다.
- 요청 크기와 공급자 응답 대기시간에 상한을 둡니다.

`GATEWAY_TOKEN`만으로 사용자별 권한 관리가 완성되는 것은 아닙니다. 사내 정식 서비스에서는 회사 SSO, API Management, 리버스 프록시, 감사로그 및 사용량 제한 정책을 추가하십시오.
