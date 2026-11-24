import test from 'node:test';
import assert from 'node:assert/strict';
import { convert, readDirectAddress } from '../site/vpn.mjs';

const prefix = 'https://tovpn.top/';
const use = async route => convert(readDirectAddress(new URL(prefix + route)));
const official = 'https://vpn.csust.edu.cn/https/webvpn4adab4fb272c5ac023304193e377fa2e12b40445ab95148eee69267083a2d062/';
const physics = 'https://vpn.csust.edu.cn/http/webvpnee536efb7808aac9b0bc36403333c380/';

test('routes exact pasted URLs as well as normalized single-slash and bare forms', async () => {
  for (const route of ['https://www.csust.edu.cn', 'https:/www.csust.edu.cn', 'www.csust.edu.cn/']) {
    assert.equal((await use(route)).target, official);
  }
  assert.equal((await use('http://10.255.65.52/Index.aspx?q=1#part')).target, physics + 'Index.aspx?q=1#part');
  assert.equal((await use('https://www.csust.edu.cn/?#')).target, official + '?#');
});

test('keeps explicit ports, escaped delimiters, query strings and fragments', async () => {
  const source = 'https://www.csust.edu.cn:443/a%2Fb?q=x%26y&next=http%3A%2F%2Fu#p%23t';
  for (const route of [source, source.replace('https://', ''), encodeURIComponent(source)]) {
    assert.deepEqual(await use(route), await convert(source));
  }
  assert.deepEqual(await use('https%3A%2F%2Fwww.csust.edu.cn%2Fa?x=%2F#b'), await convert('https://www.csust.edu.cn/a?x=%2F#b'));
});

test('invalid shortcut input cannot navigate', async () => {
  for (const route of ['', '404.html', 'not-a-url', 'javascript:alert(1)', 'https://u:p@www.csust.edu.cn', 'https%3A%2F%2Fa%ZZ']) {
    await assert.rejects(use(route));
  }
});
