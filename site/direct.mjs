import { convert, readDirectAddress } from './vpn.mjs';
import { remember } from './store.mjs';

try {
  const { source, target } = await convert(readDirectAddress(new URL(location.href)));
  try { remember(source); } catch { /* History is optional for direct navigation. */ }
  location.replace(target);
} catch (error) {
  document.querySelector('#message').textContent = error.message;
}
