// Leave room for names, settings and other first-party cookies in request headers.
const LIMIT = 2550;
const names = { favorites: 'clvpn_fav_v1', history: 'clvpn_hist_v1', auto: 'clvpn_auto_v1' };
const encode = value => encodeURIComponent(JSON.stringify(value));

function raw(name) {
  const prefix = names[name] + '=';
  return document.cookie.split(/;\s*/).find(part => part.startsWith(prefix))?.slice(prefix.length);
}

export function read(name) {
  try {
    const value = JSON.parse(decodeURIComponent(raw(name) || 'null'));
    if (name === 'auto') return value === true;
    if (!Array.isArray(value)) return [];
    return value.filter(item => item && typeof item.url === 'string' &&
      (name === 'favorites' ? typeof item.name === 'string' : Number.isFinite(item.time)));
  } catch {
    return name === 'auto' ? false : [];
  }
}

export function save(name, value) {
  let data = encode(value);
  if (name === 'history') {
    const items = [...value];
    while (data.length > LIMIT && items.length > 1) {
      items.pop();
      data = encode(items);
    }
  }
  if (data.length > LIMIT) {
    throw new Error(name === 'favorites' ? '收藏空间已满，请缩短名称、网址或移除旧收藏。' : '网址过长，本次转换未保存到记录。');
  }
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = names[name] + '=' + data + '; Max-Age=31536000; Path=/; SameSite=Lax' + secure;
  if (raw(name) !== data) throw new Error('Cookie 写入失败，请检查浏览器的 Cookie 设置。');
}

export function remember(url) {
  const previous = read('history').filter(item => item.url !== url);
  save('history', [{ url, time: Date.now() }, ...previous]);
}
