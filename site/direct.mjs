import { convert, readDirectAddress } from './vpn.mjs';
import { remember } from './store.mjs';
import { showShortcuts } from './shortcuts.mjs';

showShortcuts(document.querySelector('#shortcut-links'));
const message = document.querySelector('#message');
if (/^\/go\/?$/i.test(location.pathname)) {
  message.textContent = '选择常用页面，或在地址栏输入对应的缩写。';
} else {
  try {
    const { source, target } = await convert(readDirectAddress(new URL(location.href)));
    try { remember(source); } catch { /* History is optional for direct navigation. */ }
    location.replace(target);
  } catch (error) {
    message.textContent = error.message;
  }
}
