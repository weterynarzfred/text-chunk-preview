import assert from 'node:assert/strict';
import { test } from 'node:test';
import decodeUserComment from '../src/decodeUserComment.js';

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

test('decodes ASCII user comment', () => {
  const prefix = new TextEncoder().encode('ASCII\0\0\0');
  const data = new TextEncoder().encode('Hello');
  const userComment = concatUint8Arrays(prefix, data);
  const exif = {
    test: 123,
    userComment,
  };

  const decoded = decodeUserComment(exif);
  assert.equal(decoded.test, 123);
  assert.equal(decoded.userComment, 'Hello');
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
  const exif = {
    test: 123,
    userComment,
  };

  const decoded = decodeUserComment(exif);
  assert.equal(decoded.test, 123);
  assert.equal(decoded.userComment, 'World');
});

test('does not change the EXIF if userComment was a string', () => {
  const exif = {
    test: 123,
    userComment: "Hello World",
  };

  const decoded = decodeUserComment(exif);
  assert.equal(decoded.test, 123);
  assert.equal(decoded.userComment, "Hello World");
});
