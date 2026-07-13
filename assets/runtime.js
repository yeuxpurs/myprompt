(() => {
  'use strict';
  const config = Object.assign({
    gatewayBaseUrl: '',
    localApiBaseUrl: 'http://localhost:8787',
    defaultMode: 'local',
    allowDirectApi: false,
    enableServiceWorker: true
  }, window.JKE_CONFIG || {});

  const storage = {
    get(key, fallback = null) {
      try { const value = localStorage.getItem(key); return value === null ? fallback : value; }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); return true; }
      catch { return false; }
    },
    remove(key) {
      try { localStorage.removeItem(key); return true; }
      catch { return false; }
    }
  };

  function normalizeBase(value) { return String(value || '').trim().replace(/\/+$/, ''); }
  function detectEnvironment() {
    const host = location.hostname.toLowerCase();
    if (location.protocol === 'file:') return {id:'local-file', label:'LOCAL FILE', isLocal:true, isGitHubPages:false};
    if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return {id:'local-http', label:'LOCAL HTTP', isLocal:true, isGitHubPages:false};
    if (host.endsWith('.github.io')) return {id:'github-pages', label:'GITHUB PAGES', isLocal:false, isGitHubPages:true};
    return {id:'static-web', label:'STATIC WEB', isLocal:false, isGitHubPages:false};
  }
  const environment = detectEnvironment();

  function getGatewayBase() {
    const query = new URLSearchParams(location.search).get('gateway');
    const saved = storage.get('jke.gatewayBaseUrl', '');
    const configured = config.gatewayBaseUrl;
    const explicit = normalizeBase(query || saved || configured);
    if (explicit) return explicit;
    if (environment.id === 'local-http') return normalizeBase(config.localApiBaseUrl);
    return '';
  }
  function setGatewayBase(value) {
    const base = normalizeBase(value);
    if (base) storage.set('jke.gatewayBaseUrl', base); else storage.remove('jke.gatewayBaseUrl');
    return base;
  }
  function validateGatewayBase(value) {
    const base = normalizeBase(value);
    if (!base) return {ok:false, reason:'AI 게이트웨이 주소가 비어 있습니다.'};
    let url;
    try { url = new URL(base); } catch { return {ok:false, reason:'유효한 게이트웨이 URL을 입력하세요.'}; }
    if (!/^https?:$/.test(url.protocol)) return {ok:false, reason:'게이트웨이는 HTTP 또는 HTTPS 주소여야 합니다.'};
    if (environment.isGitHubPages && url.protocol !== 'https:') return {ok:false, reason:'GitHub Pages에서는 HTTPS 게이트웨이가 필요합니다.'};
    return {ok:true, base:normalizeBase(url.toString())};
  }
  function apiUrl(route, override) {
    const check = validateGatewayBase(override || getGatewayBase());
    if (!check.ok) throw new Error(check.reason);
    return check.base + (String(route).startsWith('/') ? route : '/' + route);
  }
  async function copyText(value) {
    const text = String(value ?? '');
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return; }
    const ta = document.createElement('textarea');
    ta.value = text; ta.readOnly = true; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove();
    if (!ok) throw new Error('클립보드 복사에 실패했습니다.');
  }
  function deploymentHint() {
    if (environment.id === 'local-file') return '정적 기능은 파일로 열어도 작동합니다. 전체 기능과 오프라인 캐시는 로컬 HTTP 실행을 권장합니다.';
    if (environment.id === 'local-http') return '로컬 정적 실행 중입니다. LOCAL 첨삭은 즉시 작동하며 AI는 localhost 게이트웨이에 연결할 수 있습니다.';
    if (environment.id === 'github-pages') return 'GitHub Pages 정적 실행 중입니다. LOCAL 첨삭은 즉시 작동하며 실제 AI는 별도 HTTPS 게이트웨이가 필요합니다.';
    return '정적 웹 실행 중입니다. LOCAL 기능은 브라우저에서 작동하며 실제 AI는 별도 게이트웨이가 필요합니다.';
  }

  window.JKE_RUNTIME = Object.freeze({config, environment, storage, normalizeBase, getGatewayBase, setGatewayBase, validateGatewayBase, apiUrl, copyText, deploymentHint});
  document.documentElement.dataset.jkeRuntime = environment.id;
})();
