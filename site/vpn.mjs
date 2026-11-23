// URL format adapted from CSUSTKit's WebVPNUtils.swift. See LICENSE-CSUSTKit.txt.
export const GATEWAY = 'https://vpn.csust.edu.cn';
const formatBytes = new TextEncoder().encode('CASB2021EnLink!!');
let keyPromise;

export function parseAddress(input) {
  const text = input.trim();
  if (!text) throw new Error('请输入校内网址。');
  if (/[\\\u0000-\u001f\u007f]/u.test(text)) throw new Error('网址含有无效字符。');
  const hasScheme = /^https?:\/\//i.test(text);
  // A colon can also introduce a port in a bare hostname, e.g. edu:8080.
  if (!hasScheme && (/^[a-z][\w+.-]*:(?!\d+(?:[/?#]|$))/i.test(text) || /^[/?#]/.test(text))) {
    throw new Error('请输入 HTTP 或 HTTPS 网址。');
  }
  const full = hasScheme ? text : 'https://' + text;
  const authority = full.match(/^https?:\/\/([^/?#]+)/i)?.[1];
  if (!authority || authority.includes('@') || /\s/u.test(authority)) {
    throw new Error('请输入有效的网址，且不要包含用户名或密码。');
  }
  let url;
  try {
    url = new URL(full);
  } catch {
    throw new Error('网址格式有误，请检查主机名和端口。');
  }
  // WHATWG URL drops explicit :80/:443. The upstream format encrypts them.
  const explicitPort = authority.match(/:(\d+)$/)?.[1];
  const host = url.hostname + (explicitPort ? ':' + Number(explicitPort) : '');
  const suffix = url.href.slice(url.origin.length);
  return { url, host, suffix, source: url.protocol + '//' + host + suffix };
}

export async function convert(input) {
  const { url, host, suffix, source } = parseAddress(input);
  if (url.hostname === 'vpn.csust.edu.cn') {
    if (url.origin === GATEWAY && /^\/https?\/webvpn(?:[a-f0-9]{32})+(?:\/|$)/i.test(url.pathname)) {
      return { source, target: url.href };
    }
    throw new Error('这是学校 VPN 入口，请输入要访问的校内网站原址。');
  }
  if (!globalThis.crypto?.subtle) throw new Error('请通过 HTTPS 或 localhost 打开转换器。');
  keyPromise ??= crypto.subtle.importKey('raw', formatBytes, 'AES-CBC', false, ['encrypt']);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv: formatBytes }, await keyPromise, new TextEncoder().encode(host)
  );
  const hex = Array.from(new Uint8Array(ciphertext), byte => byte.toString(16).padStart(2, '0')).join('');
  return { source, target: GATEWAY + '/' + url.protocol.slice(0, -1) + '/webvpn' + hex + suffix };
}
