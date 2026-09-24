/**
 * JKE AI Toolkit public runtime configuration.
 *
 * Safe to commit only when it contains NO API keys or tokens.
 * GitHub Pages is static; real AI calls require a separately deployed gateway.
 */
window.JKE_CONFIG = Object.freeze({
  siteName: 'JKE AI Toolkit',
  gatewayBaseUrl: '',
  localApiBaseUrl: 'http://127.0.0.1:8787',
  defaultMode: 'local',
  defaultProvider: 'nvidia',
  promptModel: 'z-ai/glm-5.3',
  inspectionModel: 'z-ai/glm-5.3-flash',
  allowDirectApi: false,
  enableServiceWorker: true,
  repositoryUrl: ''
});
