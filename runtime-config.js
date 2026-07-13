/**
 * JKE AI Toolkit public runtime configuration.
 *
 * This file is downloaded by every browser. NEVER place NVIDIA/OpenAI/Azure
 * API keys, passwords, or gateway access tokens here.
 *
 * gatewayBase: GitHub Pages / remote static host에서 사용할 HTTPS gateway.
 * localGatewayBase: file:// / localhost에서 사용할 local gateway.
 * gatewayBase를 비워 두면 Pages는 DEMO로 작동합니다.
 */
window.JKE_TOOLKIT_CONFIG = Object.freeze({
  gatewayBase: "",
  localGatewayBase: "http://127.0.0.1:8787",
  preferredApiMode: "demo"
});
