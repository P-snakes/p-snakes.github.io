export const shortcuts = [
  { code: 'sy', name: '学校首页', url: 'https://www.csust.edu.cn/' },
  { code: 'dwsy', name: '大物实验平台', url: 'http://10.255.65.52/' },
  { code: 'xk', name: '教务选课', url: 'http://xk.csust.edu.cn/' },
  { code: 'tsg', name: '图书馆', url: 'https://lib.csust.edu.cn/' },
  { code: 'bsdt', name: '办事大厅', url: 'https://ehall.csust.edu.cn/' },
  { code: 'wljx', name: '网络教学平台', url: 'http://pt.csust.edu.cn/' }
];

export function shortcutAddress(text) {
  const match = /^\/?([a-z]+)\/?([?#].*)?$/i.exec(text);
  if (!match) return null;
  const item = shortcuts.find(({ code }) => code === match[1].toLowerCase());
  return item ? item.url + (match[2] || '') : null;
}

export function showShortcuts(container) {
  if (!container) return;
  for (const { code, name } of shortcuts) {
    const link = document.createElement('a');
    link.href = '/' + code;
    const path = document.createElement('code');
    path.textContent = '/' + code;
    link.append(name, path);
    container.append(link);
  }
}
