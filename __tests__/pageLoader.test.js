import path from 'path';
import fs from 'fs/promises';
import nock from 'nock';
import os from 'os';
import { afterAll, beforeEach } from '@jest/globals';
import pageLoader, { getNameByPath } from '../src/pageLoader.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFixturePath = (filename) =>
  path.join(__dirname, '..', '__fixtures__', filename);
const readFixture = (filename, encoding = 'utf-8') =>
  fs.readFile(getFixturePath(filename), encoding);

let tmpdir = '';

describe('page-loader', () => {
  beforeAll(() => {
    nock.disableNetConnect();
  });

  beforeEach(async () => {
    tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  test('Should generate name from url properly', () => {
    const filename = getNameByPath('https://ru.hexlet.io/courses', '.html');
    expect(filename).toBe('ru-hexlet-io-courses.html');
    const foldername = getNameByPath('https://ru.hexlet.io/courses', '_files');
    expect(foldername).toBe('ru-hexlet-io-courses_files');
  });

  test('Should download webpage correctly', async () => {
    const initHtml = await readFixture('init_index.html');
    const expectedHtml = await readFixture('expected_index.html');
    const expectedImg = await readFixture('nodejs.png');

    const scope = nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, initHtml)
      .get('/assets/professions/nodejs.png')
      .reply(200, expectedImg);

    const expectedRootpath = path.join(tmpdir, 'ru-hexlet-io-courses.html');
    const expectedImgPath = path.join(
      tmpdir,
      'ru-hexlet-io-courses_files',
      'ru-hexlet-io-assets-professions-nodejs.png'
    );

    const response = await pageLoader('https://ru.hexlet.io/courses', tmpdir);
    const resultHtml = await fs.readFile(expectedRootpath, 'utf-8');
    const resultImg = await fs.readFile(expectedImgPath, 'utf-8');

    expect(scope.isDone()).toBeTruthy();
    expect(response.filepath).toBe(expectedRootpath);
    expect(resultHtml).toBe(expectedHtml);
    expect(resultImg).toBe(expectedImg);
  });
});
