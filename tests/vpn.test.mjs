import test from 'node:test';
import assert from 'node:assert/strict';
import { createCipheriv } from 'node:crypto';
import { convert, GATEWAY } from '../site/vpn.mjs';

const official = GATEWAY + '/https/webvpn4adab4fb272c5ac023304193e377fa2e12b40445ab95148eee69267083a2d062/';
const physics = GATEWAY + '/http/webvpnee536efb7808aac9b0bc36403333c380/';

test('matches published school homepage test vector and Android physics-lab token', async () => {
  assert.equal((await convert('https://www.csust.edu.cn/')).target, official);
  assert.equal((await convert('http://10.255.65.52/Index.aspx')).target, physics + 'Index.aspx');
});

test('normalizes bare and Unicode domains, retains explicit ports and encoded route components', async () => {
  for (const [input, host, scheme, path] of [
    ['WWW.CSUST.EDU.CN', 'www.csust.edu.cn', 'https', '/'],
    ['https://www.csust.edu.cn:443/a%2Fb?q=x%26y&lang=zh#top', 'www.csust.edu.cn:443', 'https', '/a%2Fb?q=x%26y&lang=zh#top'],
    ['http://jwc.csust.edu.cn:80/', 'jwc.csust.edu.cn:80', 'http', '/'],
    ['edu.csust.edu.cn:8080/api?q=1#s', 'edu.csust.edu.cn:8080', 'https', '/api?q=1#s'],
    ['http://[2001:db8::1]:8080/a', '[2001:db8::1]:8080', 'http', '/a'],
    ['例子.中国/校历', 'xn--fsqu00a.xn--fiqs8s', 'https', '/%E6%A0%A1%E5%8E%86'],
    ['https://www.csust.edu.cn/?#', 'www.csust.edu.cn', 'https', '/?#']
  ]) {
    const key = Buffer.from('CASB2021EnLink!!');
    const aes = createCipheriv('aes-128-cbc', key, key);
    const hex = aes.update(host, 'utf8', 'hex') + aes.final('hex');
    const result = await convert(input);
    assert.equal(result.source, scheme + '://' + host + path);
    assert.equal(result.target, GATEWAY + '/' + scheme + '/webvpn' + hex + path);
    assert.deepEqual(await convert(result.source), result);
  }
});

test('accepts an already converted link without nesting', async () => {
  assert.equal((await convert(official)).target, official);
});

test('rejects unsupported, malformed, credential-bearing and gateway-only URLs', async () => {
  for (const input of ['', 'javascript:alert(1)', 'data:text/html,hi', 'ftp://x.edu',
    'file:///tmp/a', 'https:///a', 'https://a b', 'http://a:99999', '//example.edu',
    'https://user:pass@edu.cn/test', 'https://vpn.csust.edu.cn/', 'https://vpn.csust.edu.cn:444/https/webvpnaaaa/',
    'https://a\\b/', '/foo', '#top', 'a\nb']) {
    await assert.rejects(convert(input), Error, input);
  }
});
