import decodeUserComment from '../decodeUserComment';
import { TextEncoder } from 'util';

function concatUint8Arrays(...arrays) {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

describe('decodeUserComment', () => {
  test('decodes ASCII user comment', () => {
    const prefix = new TextEncoder().encode('ASCII\0\0\0');
    const data = new TextEncoder().encode('Hello');
    const userComment = concatUint8Arrays(prefix, data);
    const decoded = decodeUserComment(userComment);
    expect(decoded).toBe('Hello');
  });

  test('decodes UNICODE user comment', () => {
    const prefix = new TextEncoder().encode('UNICODE\0');
    const buffer = new ArrayBuffer('World'.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < 'World'.length; i++) {
      view.setUint16(i * 2, 'World'.charCodeAt(i));
    }
    const data = new Uint8Array(buffer);
    const userComment = concatUint8Arrays(prefix, data);
    const decoded = decodeUserComment(userComment);
    expect(decoded).toBe('World');
  });

  test('does not change the string if userComment was a string', () => {
    const decoded = decodeUserComment('Hello World');
    expect(decoded).toBe('Hello World');
  });
});
