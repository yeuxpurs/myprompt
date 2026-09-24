/**
 * JKE AI Toolkit · Bring-Your-Own-Key AI client.
 *
 * 사용자가 자기 API 키를 붙여넣으면 브라우저에서 바로 공급자 API를 호출합니다.
 * - 키는 기본적으로 sessionStorage(탭을 닫으면 삭제)에만 보관합니다.
 * - "이 브라우저에 기억"을 선택한 경우에만 localStorage에 저장합니다.
 * - 키는 선택한 공급자 API(또는 사용자가 지정한 게이트웨이) 외에는 전송되지 않습니다.
 *
 * 브라우저 직접 호출(CORS)을 허용하는 공급자: OpenAI, Anthropic, Google Gemini,
 * OpenRouter, Groq, Azure OpenAI, 사용자 지정 OpenAI 호환 서버.
 * NVIDIA NIM은 CORS를 허용하지 않으므로 로컬 게이트웨이(start-local)를 경유합니다.
 */
(() => {
  'use strict';

  const PROVIDERS = {
    openai: {
      label: 'OpenAI',
      style: 'openai',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-5-mini',
      models: ['gpt-5-mini', 'gpt-5', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini', 'gpt-4o'],
      keyHint: 'sk-...',
      keyUrl: 'https://platform.openai.com/api-keys',
      vision: true,
      jsonMode: true
    },
    anthropic: {
      label: 'Anthropic Claude',
      style: 'anthropic',
      endpoint: 'https://api.anthropic.com/v1/messages',
      model: 'claude-sonnet-5',
      models: ['claude-sonnet-5', 'claude-opus-5-5', 'claude-haiku-4-5-20251001'],
      keyHint: 'sk-ant-...',
      keyUrl: 'https://console.anthropic.com/settings/keys',
      vision: true
    },
    gemini: {
      label: 'Google Gemini',
      style: 'openai',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      model: 'gemini-2.5-flash',
      models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite'],
      keyHint: 'AIza...',
      keyUrl: 'https://aistudio.google.com/apikey',
      vision: true
    },
    openrouter: {
      label: 'OpenRouter',
      style: 'openai',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'openai/gpt-4o-mini',
      models: ['openai/gpt-4o-mini', 'anthropic/claude-sonnet-5', 'google/gemini-2.5-flash', 'meta-llama/llama-4-maverick'],
      keyHint: 'sk-or-...',
      keyUrl: 'https://openrouter.ai/keys',
      vision: true
    },
    groq: {
      label: 'Groq',
      style: 'openai',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      models: ['meta-llama/llama-4-scout-17b-16e-instruct', 'meta-llama/llama-4-maverick-17b-128e-instruct', 'llama-3.3-70b-versatile'],
      keyHint: 'gsk_...',
      keyUrl: 'https://console.groq.com/keys',
      vision: true
    },
    nvidia: {
      label: 'NVIDIA NIM (로컬 게이트웨이 경유)',
      style: 'openai',
      endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
      // Free-endpoint models on build.nvidia.com (checked 2026-09). The Llama 4 models were retired.
      model: 'z-ai/glm-5.3-flash',
      models: ['z-ai/glm-5.3-flash', 'moonshotai/kimi-k3', 'deepseek-ai/deepseek-v4.1-flash', 'z-ai/glm-5.3', 'meta/muse-glimmer-30b', 'nvidia/nemotron-3-ultra-550b-a55b'],
      textOnly: ['z-ai/glm-5.3', 'nvidia/nemotron-3-ultra-550b-a55b'],
      keyHint: 'nvapi-...',
      keyUrl: 'https://build.nvidia.com/',
      vision: true,
      viaGateway: true
    },
    azure: {
      label: 'Azure OpenAI',
      style: 'azure',
      endpoint: '',
      endpointHint: 'https://<resource>.openai.azure.com/openai/deployments/<deployment>/chat/completions?api-version=2024-10-21',
      model: '',
      models: [],
      keyHint: 'Azure API key',
      keyUrl: 'https://portal.azure.com/',
      vision: true,
      jsonMode: true,
      needsEndpoint: true
    },
    custom: {
      label: '사용자 지정 (OpenAI 호환)',
      style: 'openai',
      endpoint: 'http://localhost:11434/v1/chat/completions',
      endpointHint: 'OpenAI 호환 /chat/completions 주소 (예: Ollama, LM Studio, vLLM)',
      model: '',
      models: ['llama3.2-vision', 'qwen2.5vl', 'gemma3'],
      keyHint: '필요 없으면 비워 두세요',
      keyUrl: '',
      vision: true,
      optionalKey: true,
      needsEndpoint: true
    }
  };

  const SETTINGS_KEY = 'jke.ai.settings.v1';
  const KEY_PREFIX = 'jke.ai.key.';

  function safeStore(area) {
    return {
      get(k) { try { return window[area].getItem(k); } catch { return null; } },
      set(k, v) { try { window[area].setItem(k, v); return true; } catch { return false; } },
      remove(k) { try { window[area].removeItem(k); } catch { /* ignore */ } }
    };
  }
  const local = safeStore('localStorage');
  const session = safeStore('sessionStorage');

  function loadSettings() {
    let saved = {};
    try { saved = JSON.parse(local.get(SETTINGS_KEY) || '{}') || {}; } catch { saved = {}; }
    const provider = PROVIDERS[saved.provider] ? saved.provider : 'openai';
    return {
      provider,
      models: saved.models || {},
      endpoints: saved.endpoints || {},
      remember: Boolean(saved.remember),
      gateway: saved.gateway || ''
    };
  }

  let settings = loadSettings();

  function saveSettings() {
    local.set(SETTINGS_KEY, JSON.stringify(settings));
    emit();
  }

  function getKey(provider = settings.provider) {
    return session.get(KEY_PREFIX + provider) || local.get(KEY_PREFIX + provider) || '';
  }

  function setKey(provider, key, remember = settings.remember) {
    const value = String(key || '').trim();
    session.remove(KEY_PREFIX + provider);
    local.remove(KEY_PREFIX + provider);
    if (!value) return emit();
    (remember ? local : session).set(KEY_PREFIX + provider, value);
    emit();
  }

  function forgetAllKeys() {
    Object.keys(PROVIDERS).forEach(p => { session.remove(KEY_PREFIX + p); local.remove(KEY_PREFIX + p); });
    emit();
  }

  function current() {
    const p = settings.provider;
    const def = PROVIDERS[p];
    return {
      provider: p,
      def,
      model: (settings.models[p] ?? def.model) || '',
      endpoint: (settings.endpoints[p] ?? def.endpoint) || '',
      key: getKey(p)
    };
  }

  function isReady() {
    const c = current();
    if (!c.def.optionalKey && !c.key) return false;
    if (c.def.needsEndpoint && !c.endpoint) return false;
    if (c.def.style !== 'azure' && !c.model) return false;
    return true;
  }

  const listeners = new Set();
  function emit() { listeners.forEach(fn => { try { fn(current()); } catch { /* ignore */ } }); }
  function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  /* ---------------- request building ---------------- */

  function dataUrlParts(url) {
    const m = /^data:([^;]+);base64,(.*)$/.exec(String(url));
    return m ? {mediaType: m[1], data: m[2]} : null;
  }

  function openAiMessages(system, user, images) {
    const content = images?.length
      ? [{type: 'text', text: user}, ...images.map(url => ({type: 'image_url', image_url: {url}}))]
      : user;
    return [{role: 'system', content: system}, {role: 'user', content}];
  }

  function gatewayBase() {
    const typed = String(settings.gateway || '').trim().replace(/\/+$/, '');
    if (typed) return typed;
    return window.JKE_RUNTIME?.getGatewayBase?.() || 'http://127.0.0.1:8787';
  }

  function buildRequest(c, {system, user, images, temperature, maxTokens, json}) {
    const {def, key, model} = c;
    if (def.style === 'anthropic') {
      const content = images?.length
        ? [...images.map(url => {
            const part = dataUrlParts(url);
            return {type: 'image', source: {type: 'base64', media_type: part.mediaType, data: part.data}};
          }), {type: 'text', text: user}]
        : user;
      const body = {model, system, max_tokens: maxTokens, messages: [{role: 'user', content}]};
      if (temperature !== undefined) body.temperature = temperature;
      return {
        url: c.endpoint,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body
      };
    }

    const body = {messages: openAiMessages(system, user, images), stream: false};
    if (model) body.model = model;
    // Newer OpenAI reasoning models (gpt-5, o-series) only accept max_completion_tokens and default temperature.
    const reasoningModel = c.provider === 'openai' && /^(gpt-5|o\d)/i.test(model);
    if (reasoningModel) body.max_completion_tokens = maxTokens;
    else {
      body.max_tokens = maxTokens;
      if (temperature !== undefined) body.temperature = temperature;
    }
    if (json && def.jsonMode) body.response_format = {type: 'json_object'};

    if (def.viaGateway) {
      return {
        url: `${gatewayBase()}/api/chat`,
        headers: {'Content-Type': 'application/json', 'X-Provider-Key': key},
        body: {provider: c.provider, endpoint: c.endpoint, payload: body}
      };
    }

    const headers = {'Content-Type': 'application/json'};
    if (def.style === 'azure') headers['api-key'] = key;
    else if (key) headers.Authorization = `Bearer ${key}`;
    if (c.provider === 'openrouter') headers['X-Title'] = 'JKE AI Toolkit';
    return {url: c.endpoint, headers, body};
  }

  function extractText(provider, data) {
    if (PROVIDERS[provider]?.style === 'anthropic') {
      return (data?.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    }
    const c = data?.choices?.[0]?.message?.content ?? data?.output_text ?? data?.content;
    let text = Array.isArray(c) ? c.map(x => x.text || x.content || '').join('\n')
      : c && typeof c === 'object' ? c.text || JSON.stringify(c) : c || '';
    // Reasoning models (GLM, Kimi, DeepSeek...) may prepend <think>...</think> to the answer.
    text = String(text).replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^[\s\S]*?<\/think>/i, '').trim();
    return text;
  }

  function friendlyError(status, text, c) {
    let detail = text;
    try {
      const j = JSON.parse(text);
      detail = j?.error?.message || j?.error?.type || j?.message || (typeof j?.error === 'string' ? j.error : '') || text;
    } catch { /* keep text */ }
    detail = String(detail || '').slice(0, 300);
    const name = c.def.label;
    if (status === 401 || status === 403) return `${name}: API 키가 올바르지 않거나 권한이 없습니다. (${status}) ${detail}`;
    if (status === 404) return `${name}: 모델 또는 엔드포인트를 찾을 수 없습니다. 모델 ID “${c.model}”를 확인하세요. ${detail}`;
    if (status === 429) return `${name}: 요청 한도 또는 크레딧이 부족합니다. 잠시 후 다시 시도하거나 결제/한도를 확인하세요. ${detail}`;
    if (status >= 500) return `${name}: 공급자 서버 오류(${status}). 잠시 후 다시 시도하세요. ${detail}`;
    return `${name} ${status}: ${detail}`;
  }

  function networkError(error, c) {
    if (error?.name === 'AbortError') return new Error('요청을 취소했습니다.');
    const msg = String(error?.message || error);
    if (!/Failed to fetch|NetworkError|Load failed|fetch/i.test(msg)) return error;
    if (c.def.viaGateway) {
      return new Error(`NVIDIA API는 브라우저 직접 호출을 차단합니다(CORS). start-local 스크립트로 로컬 게이트웨이(${gatewayBase()})를 실행하거나, OpenAI·Claude·Gemini 등 다른 공급자를 선택하세요.`);
    }
    if (c.provider === 'custom') return new Error(`${c.endpoint}에 연결하지 못했습니다. 서버 실행 여부와 CORS 허용(예: OLLAMA_ORIGINS=*)을 확인하세요.`);
    if (location.protocol === 'https:' && /^http:/.test(c.endpoint)) return new Error('HTTPS 페이지에서는 HTTP 엔드포인트를 호출할 수 없습니다.');
    return new Error(`${c.def.label}에 연결하지 못했습니다. 네트워크, 방화벽/프록시, 엔드포인트 주소를 확인하세요.`);
  }

  /**
   * Send one chat request with the user's own key.
   * @returns {Promise<{text:string, model:string, provider:string, raw:any}>}
   */
  async function chat(opts) {
    const c = current();
    if (!c.def.optionalKey && !c.key) throw new Error(`${c.def.label} API 키를 먼저 입력하세요.`);
    if (c.def.needsEndpoint && !c.endpoint) throw new Error(`${c.def.label} 엔드포인트 주소를 입력하세요.`);
    if (c.def.style !== 'azure' && !c.model) throw new Error('모델 ID를 입력하세요.');
    if (opts.images?.length && c.def.style === 'anthropic' && opts.images.some(u => !dataUrlParts(u))) {
      throw new Error('이미지 형식을 읽을 수 없습니다.');
    }

    const req = buildRequest(c, {temperature: 0.2, maxTokens: 4000, ...opts});
    const send = async body => {
      try {
        return await fetch(req.url, {method: 'POST', headers: req.headers, body: JSON.stringify(body), signal: opts.signal});
      } catch (e) {
        throw networkError(e, c);
      }
    };

    let res = await send(req.body);
    // One automatic retry for models that reject optional sampling/format parameters.
    if (res.status === 400) {
      const text = await res.text();
      if (/temperature|max_tokens|response_format|unsupported (parameter|value)/i.test(text)) {
        const retry = JSON.parse(JSON.stringify(req.body));
        const target = retry.payload || retry;
        delete target.temperature;
        delete target.response_format;
        if (target.max_tokens && c.def.style !== 'anthropic') {
          target.max_completion_tokens = target.max_tokens;
          delete target.max_tokens;
        }
        res = await send(retry);
      } else {
        throw new Error(friendlyError(400, text, c));
      }
    }
    if (!res.ok) throw new Error(friendlyError(res.status, await res.text(), c));
    const data = await res.json();
    const text = extractText(c.provider, data);
    if (!text) {
      const reasoning = data?.choices?.[0]?.message?.reasoning_content || data?.choices?.[0]?.message?.reasoning;
      const cut = data?.choices?.[0]?.finish_reason === 'length';
      throw new Error(reasoning || cut
        ? '모델이 추론에 토큰을 모두 써서 최종 답이 비었습니다. 다시 시도하거나 더 빠른 모델(예: glm-5.3-flash, deepseek-v4.1-flash)을 선택하세요.'
        : '모델 응답 본문이 비어 있습니다.');
    }
    return {text, model: data?.model || c.model || c.provider, provider: c.provider, raw: data};
  }

  async function testConnection() {
    const started = performance.now();
    const r = await chat({system: 'Reply with the single word: OK', user: 'ping', maxTokens: 16, temperature: 0});
    return {ms: Math.round(performance.now() - started), model: r.model, text: r.text.trim().slice(0, 40)};
  }

  function parseJson(text) {
    if (text && typeof text === 'object') return text;
    let s = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    const a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a >= 0 && b > a) s = s.slice(a, b + 1);
    try {
      return JSON.parse(s);
    } catch {
      // Tolerate trailing commas that some models emit.
      return JSON.parse(s.replace(/,\s*([}\]])/g, '$1'));
    }
  }

  /* ---------------- settings UI ---------------- */

  const CSS = `
.ai-byok{display:grid;gap:10px}
.ai-byok[hidden],.ai-byok [hidden]{display:none!important}
.ai-byok .ai-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ai-byok label.ai-l{display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--sub);font-weight:600}
.ai-byok .ai-key{display:flex;gap:6px}
.ai-byok .ai-key input{flex:1;min-width:0}
.ai-byok .ai-mini{border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--text);padding:0 11px;font-size:12px;cursor:pointer;white-space:nowrap}
.ai-byok .ai-mini:hover{border-color:var(--blue)}
.ai-byok .ai-foot{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;font-size:12px;color:var(--sub)}
.ai-byok .ai-foot label{display:inline-flex;align-items:center;gap:6px;cursor:pointer}
.ai-byok .ai-foot a{color:var(--blue);text-decoration:none}
.ai-byok .ai-foot a:hover{text-decoration:underline}
.ai-byok .ai-status{display:flex;align-items:center;gap:8px;padding:9px 11px;border-radius:10px;border:1px solid var(--line);background:var(--surface);font-size:12px;color:var(--sub);line-height:1.5}
.ai-byok .ai-dot{flex:none;width:8px;height:8px;border-radius:50%;background:var(--sub)}
.ai-byok .ai-status.ok .ai-dot{background:var(--green)}
.ai-byok .ai-status.warn .ai-dot{background:var(--amber)}
.ai-byok .ai-status.err .ai-dot{background:var(--red)}
.ai-byok .ai-status.err{color:var(--text)}
.ai-byok .ai-adv{font-size:12px;color:var(--sub)}
.ai-byok .ai-adv summary{cursor:pointer;padding:2px 0}
.ai-byok .ai-adv[open] summary{margin-bottom:8px}
@media(max-width:620px){.ai-byok .ai-row{grid-template-columns:1fr}}
`;

  function injectCss() {
    if (document.getElementById('ai-byok-css')) return;
    const style = document.createElement('style');
    style.id = 'ai-byok-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, m => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[m]));
  }

  /**
   * Render the provider / key / model settings into a container.
   * @param {HTMLElement} root
   * @param {{inputClass?:string, selectClass?:string, needsVision?:boolean}} options
   */
  function mountSettings(root, options = {}) {
    injectCss();
    const ic = options.inputClass || 'input';
    const sc = options.selectClass || 'select';
    const uid = `ai${Math.random().toString(36).slice(2, 7)}`;
    root.classList.add('ai-byok');
    root.innerHTML = `
      <div class="ai-row">
        <label class="ai-l">공급자<select class="${sc}" data-f="provider">${Object.entries(PROVIDERS).map(([id, p]) => `<option value="${id}">${escapeHtml(p.label)}</option>`).join('')}</select></label>
        <label class="ai-l">모델 ID<input class="${ic}" data-f="model" list="${uid}-models" autocomplete="off" spellcheck="false"><datalist id="${uid}-models"></datalist></label>
      </div>
      <label class="ai-l">API 키
        <span class="ai-key"><input class="${ic}" data-f="key" type="password" autocomplete="off" spellcheck="false"><button type="button" class="ai-mini" data-a="toggle" title="키 보기/숨기기">보기</button><button type="button" class="ai-mini" data-a="paste" title="클립보드에서 붙여넣기">붙여넣기</button></span>
      </label>
      <label class="ai-l" data-show="endpoint">엔드포인트<input class="${ic}" data-f="endpoint" spellcheck="false"></label>
      <details class="ai-adv" data-show="adv"><summary>고급 설정 (엔드포인트${'·'}게이트웨이)</summary>
        <label class="ai-l" data-show="endpoint-adv">엔드포인트<input class="${ic}" data-f="endpoint2" spellcheck="false"></label>
        <label class="ai-l" data-show="gateway" style="margin-top:8px">로컬 게이트웨이 주소<input class="${ic}" data-f="gateway" placeholder="http://127.0.0.1:8787" spellcheck="false"></label>
      </details>
      <div class="ai-foot">
        <label><input type="checkbox" data-f="remember"> 이 브라우저에 키 기억</label>
        <a data-a="keyurl" target="_blank" rel="noopener noreferrer">API 키 발급 ↗</a>
        <button type="button" class="ai-mini" data-a="test" style="height:30px;margin-left:auto">연결 테스트</button>
        <button type="button" class="ai-mini" data-a="forget" style="height:30px">키 삭제</button>
      </div>
      <div class="ai-status" data-f="status"><span class="ai-dot"></span><span data-f="statusText"></span></div>`;

    const q = s => root.querySelector(s);
    const f = name => q(`[data-f="${name}"]`);
    let statusOverride = null;

    function setStatus(kind, text) {
      statusOverride = kind ? {kind, text} : null;
      paintStatus();
    }

    function paintStatus() {
      const c = current();
      let kind, text;
      if (statusOverride) ({kind, text} = statusOverride);
      else if (isReady()) {
        kind = 'ok';
        text = `${c.def.label} · ${c.model || '배포 기본값'} 준비됨. 키는 ${settings.remember ? '이 브라우저(localStorage)' : '이 탭(세션)'}에만 보관되며 ${c.def.viaGateway ? '로컬 게이트웨이를 거쳐 NVIDIA' : c.def.label}로만 전송됩니다.`;
        if (options.needsVision && (!c.def.vision || c.def.textOnly?.includes(c.model))) { kind = 'warn'; text += ' ⚠ 이 모델은 이미지 입력을 지원하지 않습니다. 비전 모델을 선택하세요.'; }
      } else {
        kind = 'warn';
        text = c.def.needsEndpoint && !c.endpoint ? '엔드포인트 주소를 입력하세요.' : !c.model && c.def.style !== 'azure' ? '모델 ID를 입력하세요.' : 'API 키를 붙여넣으면 바로 실행할 수 있습니다.';
      }
      if (c.def.viaGateway && !statusOverride) {
        const onPages = window.JKE_RUNTIME?.isGitHubPages;
        text += onPages
          ? ' ※ GitHub Pages에서는 NVIDIA를 직접 호출할 수 없습니다. PC에서 start-local을 실행한 뒤 사용하세요.'
          : ` ※ NVIDIA는 로컬 게이트웨이(${gatewayBase()}) 실행이 필요합니다.`;
        if (onPages) kind = 'warn';
      }
      f('status').className = `ai-status ${kind}`;
      f('statusText').textContent = text;
    }

    function paint() {
      const c = current();
      f('provider').value = c.provider;
      f('model').value = c.model;
      f('model').placeholder = c.def.style === 'azure' ? '(선택) 배포명은 엔드포인트에 포함' : '모델 ID';
      q(`#${uid}-models`).innerHTML = c.def.models.map(m => `<option value="${escapeHtml(m)}">`).join('');
      f('key').value = c.key;
      f('key').placeholder = c.def.keyHint;
      f('endpoint').value = c.endpoint;
      f('endpoint2').value = c.endpoint;
      f('endpoint').placeholder = c.def.endpointHint || '';
      f('gateway').value = settings.gateway || '';
      f('remember').checked = settings.remember;
      q('[data-show="endpoint"]').hidden = !c.def.needsEndpoint;
      q('[data-show="endpoint-adv"]').hidden = Boolean(c.def.needsEndpoint);
      q('[data-show="gateway"]').hidden = !c.def.viaGateway;
      const link = q('[data-a="keyurl"]');
      link.hidden = !c.def.keyUrl;
      if (c.def.keyUrl) link.href = c.def.keyUrl;
      paintStatus();
    }

    f('provider').addEventListener('change', e => { settings.provider = e.target.value; statusOverride = null; saveSettings(); paint(); });
    f('model').addEventListener('input', e => { settings.models[settings.provider] = e.target.value.trim(); statusOverride = null; saveSettings(); });
    const onEndpoint = e => { settings.endpoints[settings.provider] = e.target.value.trim(); statusOverride = null; saveSettings(); };
    f('endpoint').addEventListener('input', onEndpoint);
    f('endpoint2').addEventListener('input', onEndpoint);
    f('gateway').addEventListener('input', e => { settings.gateway = e.target.value.trim(); saveSettings(); });
    f('key').addEventListener('input', e => { statusOverride = null; setKey(settings.provider, e.target.value); });
    f('remember').addEventListener('change', e => {
      settings.remember = e.target.checked;
      const key = getKey();
      saveSettings();
      if (key) setKey(settings.provider, key, settings.remember);
      if (!settings.remember) Object.keys(PROVIDERS).forEach(p => {
        const k = local.get(KEY_PREFIX + p);
        if (k) { local.remove(KEY_PREFIX + p); session.set(KEY_PREFIX + p, k); }
      });
      paintStatus();
    });
    q('[data-a="toggle"]').addEventListener('click', e => {
      const show = f('key').type === 'password';
      f('key').type = show ? 'text' : 'password';
      e.currentTarget.textContent = show ? '숨기기' : '보기';
    });
    q('[data-a="paste"]').addEventListener('click', async () => {
      try {
        const text = (await navigator.clipboard.readText()).trim();
        if (!text) return setStatus('warn', '클립보드가 비어 있습니다.');
        f('key').value = text;
        statusOverride = null;
        setKey(settings.provider, text);
      } catch {
        f('key').focus();
        setStatus('warn', '브라우저가 클립보드 읽기를 막았습니다. 입력칸에 Ctrl+V(⌘V)로 붙여넣으세요.');
      }
    });
    q('[data-a="forget"]').addEventListener('click', () => {
      forgetAllKeys();
      f('key').value = '';
      setStatus('warn', '저장된 모든 API 키를 삭제했습니다.');
    });
    q('[data-a="test"]').addEventListener('click', async e => {
      const btn = e.currentTarget;
      btn.disabled = true;
      setStatus('warn', '연결 확인 중…');
      try {
        const r = await testConnection();
        setStatus('ok', `연결 성공 · ${r.model} · ${r.ms} ms`);
      } catch (err) {
        setStatus('err', err.message);
      } finally {
        btn.disabled = false;
      }
    });
    onChange(paintStatus);
    paint();
    return {refresh: paint, setStatus};
  }

  window.JKE_AI = Object.freeze({
    PROVIDERS,
    current,
    isReady,
    chat,
    testConnection,
    parseJson,
    mountSettings,
    onChange,
    getKey,
    setKey,
    forgetAllKeys
  });
})();
