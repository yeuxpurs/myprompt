(() => {
  'use strict';

  const config = Object.assign({
    gatewayBaseUrl: '',
    localApiBaseUrl: 'http://127.0.0.1:8787',
    defaultMode: 'local',
    defaultProvider: 'nvidia',
    allowDirectApi: false,
    enableServiceWorker: true
  }, window.JKE_CONFIG || {});

  const storage = Object.freeze({
    get(key, fallback = null) {
      try {
        const value = window.localStorage.getItem(key);
        return value === null ? fallback : value;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, String(value));
        return true;
      } catch {
        return false;
      }
    },
    remove(key) {
      try {
        window.localStorage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    }
  });

  function normalizeBase(value) {
    return String(value || '').trim().replace(/\/+$/, '');
  }

  function detectEnvironment() {
    const protocol = String(window.location.protocol || '').toLowerCase();
    const host = String(window.location.hostname || '').toLowerCase();

    if (protocol === 'file:') {
      return Object.freeze({
        id: 'local-file',
        label: 'LOCAL FILE',
        isLocal: true,
        isFile: true,
        isGitHubPages: false
      });
    }

    if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '') {
      return Object.freeze({
        id: 'local-http',
        label: 'LOCAL HTTP',
        isLocal: true,
        isFile: false,
        isGitHubPages: false
      });
    }

    if (host.endsWith('.github.io')) {
      return Object.freeze({
        id: 'github-pages',
        label: 'GITHUB PAGES',
        isLocal: false,
        isFile: false,
        isGitHubPages: true
      });
    }

    return Object.freeze({
      id: 'static-web',
      label: 'STATIC WEB',
      isLocal: false,
      isFile: false,
      isGitHubPages: false
    });
  }

  const environment = detectEnvironment();

  function getGatewayBase() {
    let queryValue = '';
    try {
      queryValue = new URLSearchParams(window.location.search || '').get('gateway') || '';
    } catch {
      queryValue = '';
    }

    const saved = storage.get('jke.gatewayBaseUrl', '');
    const configured = config.gatewayBaseUrl;
    const explicit = normalizeBase(queryValue || saved || configured);
    if (explicit) return explicit;

    // When UI and gateway share port 8787, stay on the exact same origin.
    if (environment.id === 'local-http' && String(window.location.port || '') === '8787') {
      return normalizeBase(window.location.origin);
    }

    // file:// and other localhost ports may safely default to a loopback gateway.
    if (environment.isLocal) return normalizeBase(config.localApiBaseUrl);
    return '';
  }

  function setGatewayBase(value) {
    const base = normalizeBase(value);
    if (base) storage.set('jke.gatewayBaseUrl', base);
    else storage.remove('jke.gatewayBaseUrl');
    return base;
  }

  function validateGatewayBase(value) {
    const base = normalizeBase(value);
    if (!base) return {ok: false, reason: 'AI 게이트웨이 주소가 비어 있습니다.'};

    let url;
    try {
      url = new URL(base);
    } catch {
      return {ok: false, reason: '유효한 게이트웨이 URL을 입력하세요.'};
    }

    if (!/^https?:$/.test(url.protocol)) {
      return {ok: false, reason: '게이트웨이는 HTTP 또는 HTTPS 주소여야 합니다.'};
    }

    const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
    if (url.protocol === 'http:' && !loopbackHosts.has(url.hostname)) {
      return {ok: false, reason: '원격 게이트웨이는 HTTPS가 필요합니다. HTTP는 localhost만 허용됩니다.'};
    }

    if (environment.isGitHubPages && url.protocol !== 'https:') {
      return {ok: false, reason: 'GitHub Pages에서는 HTTPS 게이트웨이가 필요합니다.'};
    }

    return {ok: true, base: normalizeBase(url.toString())};
  }

  function apiUrl(route, override) {
    const check = validateGatewayBase(override || getGatewayBase());
    if (!check.ok) throw new Error(check.reason);
    const path = String(route || '').startsWith('/') ? String(route) : `/${route}`;
    return check.base + path;
  }

  async function copyText(value) {
    const text = String(value ?? '');
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Continue to the file:// compatible fallback.
    }

    const area = document.createElement('textarea');
    area.value = text;
    area.readOnly = true;
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    area.style.opacity = '0';
    area.style.pointerEvents = 'none';
    document.body.appendChild(area);
    area.focus();
    area.select();
    area.setSelectionRange(0, area.value.length);
    const copied = Boolean(document.execCommand('copy'));
    area.remove();
    if (!copied) throw new Error('클립보드 복사에 실패했습니다.');
    return true;
  }

  function apiErrorMessage(error) {
    const message = String(error?.message || error || '알 수 없는 오류');
    if (/Failed to fetch|NetworkError|Load failed/i.test(message)) {
      if (environment.isGitHubPages) {
        return '게이트웨이에 연결하지 못했습니다. HTTPS 주소와 CORS 허용 Origin을 확인하세요.';
      }
      return '게이트웨이에 연결하지 못했습니다. 로컬 게이트웨이가 실행 중인지 확인하세요.';
    }
    return message;
  }

  function deploymentHint() {
    if (environment.id === 'local-file') {
      return `정적 기능은 파일로 열어도 작동합니다. 실제 AI는 ${getGatewayBase() || 'localhost 게이트웨이'}에 연결할 수 있습니다.`;
    }
    if (environment.id === 'local-http') {
      return `로컬 정적 실행 중입니다. 실제 AI는 ${getGatewayBase() || 'localhost 게이트웨이'}에 연결할 수 있습니다.`;
    }
    if (environment.id === 'github-pages') {
      return 'GitHub Pages 정적 실행 중입니다. LOCAL 첨삭·DEMO는 즉시 작동하며 실제 AI는 별도 HTTPS 게이트웨이가 필요합니다.';
    }
    return '정적 웹 실행 중입니다. 로컬 기능은 브라우저에서 작동하며 실제 AI는 별도 HTTPS 게이트웨이가 필요합니다.';
  }

  const runtime = Object.freeze({
    config,
    environment,
    label: environment.label,
    isFile: environment.isFile,
    isLocal: environment.isLocal,
    isGitHubPages: environment.isGitHubPages,
    storage,
    normalizeBase,
    normalizeGateway: normalizeBase,
    getGatewayBase,
    defaultGateway: getGatewayBase(),
    setGatewayBase,
    validateGatewayBase,
    apiUrl,
    gatewayUrl: apiUrl,
    copyText,
    apiErrorMessage,
    deploymentHint
  });

  // Current API.
  window.JKE_RUNTIME = runtime;

  // Compatibility aliases for the earlier local/GitHub Pages package and
  // mixed-version repositories. These keep the index from going blank when
  // only runtime.js is replaced during an update.
  window.JKE_STORAGE = storage;
  window.JKE_COPY_TEXT = copyText;
  window.JKE_NORMALIZE_GATEWAY = normalizeBase;
  window.JKE_GATEWAY_URL = apiUrl;
  window.jkeApiErrorMessage = apiErrorMessage;
  window.jkeRuntimeHint = deploymentHint();

  if (document?.documentElement?.dataset) {
    document.documentElement.dataset.jkeRuntime = environment.id;
  }
})();
