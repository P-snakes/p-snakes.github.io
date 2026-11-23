import { convert } from './vpn.mjs';
import { read, save } from './store.mjs';

const $ = selector => document.querySelector(selector);
const address = $('#address');
const auto = $('#auto');
const result = $('#result');
const tabs = [...document.querySelectorAll('[role=tab]')];
const favoriteDialog = $('#favorite-dialog');
let view = 'favorites';
let current = null;
let request = 0;
let noticeTimer;

function icon(id) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(ns, 'use');
  use.setAttribute('href', '#' + id);
  svg.append(use);
  return svg;
}

function el(tag, css, text) {
  const node = document.createElement(tag);
  node.className = css;
  if (text !== undefined) node.textContent = text;
  return node;
}

function notice(message) {
  const node = $('#notice');
  clearTimeout(noticeTimer);
  node.textContent = message;
  node.hidden = false;
  noticeTimer = setTimeout(() => { node.hidden = true; }, 4200);
}

function errorAt(node, message = '') {
  node.textContent = message;
  node.hidden = !message;
}

function invalidate() {
  request++;
  current = null;
  result.hidden = true;
  errorAt($('#address-error'));
  address.removeAttribute('aria-invalid');
}

function storeChange(name, value) {
  try {
    save(name, value);
    return true;
  } catch (e) {
    notice(e.message);
    return false;
  }
}

function remember(url) {
  const previous = read('history').filter(item => item.url !== url);
  storeChange('history', [{ url, time: Date.now() }, ...previous]);
}

function display(converted) {
  current = converted;
  $('#result-link').textContent = converted.target;
  $('#result-link').href = converted.target;
  $('#open-result').href = converted.target;
  $('#copy span').textContent = '复制';
  result.hidden = false;
}

async function run(input, open) {
  invalidate();
  const id = request;
  try {
    const converted = await convert(input);
    if (request !== id) return;
    display(converted);
    remember(converted.source);
    render();
    if (open) location.assign(converted.target);
  } catch (e) {
    if (request !== id) return;
    address.setAttribute('aria-invalid', 'true');
    errorAt($('#address-error'), e.message);
    address.focus();
  }
}

function hostname(url) {
  try { return new URL(url).host; } catch { return url; }
}

function favoriteForm(url = '', name = '') {
  $('#fav-name').value = name || (url ? hostname(url) : '');
  $('#fav-url').value = url;
  errorAt($('#fav-error'));
  favoriteDialog.showModal();
  $('#fav-name').focus();
  $('#fav-name').select();
}

function action(label, symbol, callback) {
  const button = el('button', 'icon-btn');
  button.type = 'button';
  button.title = label;
  button.setAttribute('aria-label', label);
  button.append(icon(symbol));
  button.addEventListener('click', callback);
  return button;
}

function entry(item, name) {
  const row = el('li', 'entry');
  const open = el('button', 'item-open');
  open.type = 'button';
  open.title = '通过 WebVPN 打开 ' + item.url;
  const badge = el('span', 'item-icon');
  badge.append(icon('arrow-up'));
  const body = el('span', 'item-text');
  body.append(el('span', 'item-title', name === 'favorites' ? item.name : hostname(item.url)), el('span', 'item-url', item.url));
  open.append(badge, body);
  open.addEventListener('click', () => {
    address.value = item.url;
    run(item.url, true);
  });
  row.append(open);
  if (name === 'history') {
    const time = new Date(item.time);
    if (!Number.isNaN(time.getTime())) {
      const stamp = el('time', 'date', new Intl.DateTimeFormat('zh-CN', {
        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
      }).format(time));
      stamp.dateTime = time.toISOString();
      row.append(stamp);
    }
    if (!read('favorites').some(f => f.url === item.url)) {
      row.append(action('收藏这个网址', 'bookmark', () => favoriteForm(item.url)));
    }
  }
  row.append(action(name === 'favorites' ? '移除收藏' : '删除这条记录', 'trash', () => {
    if (storeChange(name, read(name).filter(i => i.url !== item.url))) {
      render();
      notice(name === 'favorites' ? '已移除收藏' : '已删除记录');
    }
  }));
  return row;
}

function render() {
  const lists = { favorites: read('favorites'), history: read('history') };
  const items = lists[view];
  for (const tab of tabs) {
    const active = tab.dataset.view === view;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    const count = tab.querySelector('.count');
    count.textContent = lists[tab.dataset.view].length;
    count.hidden = !lists[tab.dataset.view].length;
  }
  const manage = $('#manage');
  const fav = view === 'favorites';
  manage.replaceChildren(icon(fav ? 'plus' : 'trash'), el('span', '', fav ? '添加收藏' : '清空记录'));
  manage.hidden = !fav && !items.length;
  const panel = $('#items');
  panel.setAttribute('aria-labelledby', 'tab-' + view);
  if (items.length) {
    const list = el('ul', 'entries');
    list.append(...items.map(item => entry(item, view)));
    panel.replaceChildren(list);
  } else {
    const empty = el('div', 'empty');
    empty.append(icon(fav ? 'bookmark' : 'clock'), el('span', '', fav ? '还没有收藏，添加一个常用的校内网站。' : '还没有记录，转换过的网址会显示在这里。'));
    panel.replaceChildren(empty);
  }
  const saved = current && lists.favorites.some(item => item.url === current.source);
  $('#star').disabled = Boolean(saved);
  $('#star span').textContent = saved ? '已收藏' : '收藏';
}

$('#converter').addEventListener('submit', event => {
  event.preventDefault();
  run(address.value, auto.checked);
});
address.addEventListener('input', invalidate);
for (const example of document.querySelectorAll('[data-example]')) {
  example.addEventListener('click', () => {
    address.value = example.dataset.example;
    invalidate();
    address.focus();
  });
}
auto.addEventListener('change', () => {
  if (!storeChange('auto', auto.checked)) auto.checked = read('auto');
});
$('#copy').addEventListener('click', async () => {
  if (!current) return;
  try {
    await navigator.clipboard.writeText(current.target);
    $('#copy span').textContent = '已复制';
    notice('链接已复制');
  } catch {
    const range = document.createRange();
    range.selectNodeContents($('#result-link'));
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    notice('已选中链接，请使用浏览器的复制功能。');
  }
});
$('#star').addEventListener('click', () => { if (current) favoriteForm(current.source); });
$('#manage').addEventListener('click', () => {
  if (view === 'favorites') favoriteForm();
  else $('#clear-dialog').showModal();
});
$('#clear-history').addEventListener('click', () => {
  if (storeChange('history', [])) {
    $('#clear-dialog').close();
    render();
    notice('已清空转换记录');
  }
});
for (const tab of tabs) {
  tab.addEventListener('click', () => { view = tab.dataset.view; render(); });
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - tabs.indexOf(tab);
    tabs[index].click();
    tabs[index].focus();
  });
}
$('#favorite-form').addEventListener('submit', async event => {
  event.preventDefault();
  const name = $('#fav-name').value.trim();
  if (!name) { errorAt($('#fav-error'), '请输入网站名称。'); $('#fav-name').focus(); return; }
  try {
    const { source } = await convert($('#fav-url').value);
    const items = read('favorites').filter(item => item.url !== source);
    save('favorites', [{ name, url: source }, ...items]);
    favoriteDialog.close();
    view = 'favorites';
    render();
    notice('已保存收藏');
  } catch (e) {
    errorAt($('#fav-error'), e.message);
  }
});
for (const close of document.querySelectorAll('[data-dismiss]')) close.addEventListener('click', () => close.closest('dialog').close());
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
}
function refresh() {
  auto.checked = read('auto');
  render();
}
window.addEventListener('pageshow', refresh);
window.addEventListener('focus', refresh);
refresh();
