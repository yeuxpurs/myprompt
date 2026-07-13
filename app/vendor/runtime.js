(function () {
  'use strict';

  const cfg = window.JKE_TOOLKIT_CONFIG || {};
  const protocol = String(window.location.protocol || '');
  const host = String(window.location.hostname || '').toLowerCase();
  const isFile = protocol === 'file:';
  const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '';
  const isGitHubPages = /(^|\.)github\.io$/.test(host);
  const configuredGateway = String(cfg.gatewayBase || '').trim().replace(/\/+$/, '');
  const configuredLocalGateway = String(cfg.localGatewayBase || 'http://127.0.0.1:8787').trim().replace(/\/+$/, '');
  const sameOriginLocalGateway = isLocalHost && /^https?:$/.test(protocol) && window.location.port === '8787'
    ? window.location.origin
    : '';
  const defaultGateway = (isFile || isLocalHost)
    ? (sameOriginLocalGateway || configuredLocalGateway || configuredGateway)
    : configuredGateway;
  const environment = isGitHubPages ? 'github-pages' : isFile ? 'local-file' : isLocalHost ? 'local-server' : 'static-host';
  const labels = {
    'github-pages': 'GitHub Pages',
    'local-file': 'Local file',
    'local-server': 'Local server',
    'static-host': 'Static host'
  };

  const storage = Object.freeze({
    get(key, fallback = null) {
      try {
        const value = window.localStorage.getItem(key);
        return value === null ? fallback : value;
      } catch (_) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, String(value));
        return true;
      } catch (_) {
        return false;
      }
    },
    remove(key) {
      try {
        window.localStorage.removeItem(key);
        return true;
      } catch (_) {
        return false;
      }
    }
  });

  function normalizeGateway(value) {
    const raw = String(value || '').trim().replace(/\/+$/, '');
    if (!raw) throw new Error('게이트웨이 주소를 입력하세요.');
    let url;
    try {
      url = new URL(raw, window.location.href);
    } catch (_) {
      throw new Error('게이트웨이 주소가 올바른 URL이 아닙니다.');
    }
    const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
    const localHttp = url.protocol === 'http:' && localHosts.has(url.hostname);
    if (url.protocol !== 'https:' && !localHttp) {
      throw new Error('원격 게이트웨이는 HTTPS가 필요합니다. 로컬호스트만 HTTP를 허용합니다.');
    }
    if (window.location.protocol === 'https:' && url.protocol !== 'https:') {
      throw new Error('HTTPS 페이지에서는 HTTPS 게이트웨이만 사용할 수 있습니다.');
    }
    return url.toString().replace(/\/+$/, '');
  }

  function gatewayUrl(route, baseValue) {
    const base = normalizeGateway(baseValue || defaultGateway);
    const path = String(route || '').startsWith('/') ? String(route) : `/${route}`;
    return `${base}${path}`;
  }

  async function copyText(text) {
    const value = String(text ?? '');
    try {
      if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch (_) {
      // Continue to the file:// compatible fallback.
    }

    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    area.style.pointerEvents = 'none';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.focus();
    area.select();
    area.setSelectionRange(0, area.value.length);
    let copied = false;
    try {
      copied = Boolean(document.execCommand('copy'));
    } finally {
      area.remove();
    }
    if (!copied) throw new Error('이 브라우저에서는 클립보드를 사용할 수 없습니다.');
    return true;
  }

  function apiErrorMessage(error) {
    const message = String(error?.message || error || '알 수 없는 오류');
    if (/Failed to fetch|NetworkError|Load failed/i.test(message)) {
      if (isGitHubPages) return '게이트웨이에 연결하지 못했습니다. HTTPS 주소와 CORS 허용 Origin을 확인하세요.';
      return '게이트웨이에 연결하지 못했습니다. 로컬 서버가 실행 중인지 확인하세요.';
    }
    return message;
  }

  const deploymentHint = isGitHubPages
    ? (configuredGateway
        ? `GitHub Pages · gateway: ${configuredGateway}`
        : 'GitHub Pages · DEMO 사용 가능 · 실제 AI는 별도 HTTPS gateway 필요')
    : isFile
      ? 'Local file · 정적/DEMO 사용 가능 · 실제 AI는 localhost gateway 권장'
      : `Local/static server · default gateway: ${defaultGateway || 'not configured'}`;

  const runtime = Object.freeze({
    environment,
    label: labels[environment],
    isFile,
    isLocalHost,
    isGitHubPages,
    defaultGateway,
    configuredGateway,
    configuredLocalGateway,
    preferredApiMode: String(cfg.preferredApiMode || 'demo'),
    storage,
    normalizeGateway,
    gatewayUrl,
    copyText,
    apiErrorMessage,
    deploymentHint
  });

  window.JKE_RUNTIME = runtime;
  window.JKE_STORAGE = storage;
  window.JKE_COPY_TEXT = copyText;
  window.JKE_NORMALIZE_GATEWAY = normalizeGateway;
  window.JKE_GATEWAY_URL = gatewayUrl;
  window.jkeApiErrorMessage = apiErrorMessage;
  window.jkeRuntimeHint = deploymentHint;
})();
