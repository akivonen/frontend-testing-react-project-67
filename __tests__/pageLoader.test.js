import path from 'path';
import fs from 'fs/promises';
import nock from 'nock';
import os from 'os';
import { afterAll, beforeEach } from '@jest/globals';
import pageLoader, { getFilename } from '../src/pageLoader.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFixturePath = (filename) =>
  path.join(__dirname, '..', '__fixtures__', filename);
const readFile = (filename) => fs.readFile(getFixturePath(filename), 'utf-8');

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

  test('Should generate filename from url properly', () => {
    const filename = getFilename('https://ru.hexlet.io/courses');
    expect(filename).toBe('ru-hexlet-io-courses.html');
  });

  test('Should download webpage correctly', async () => {
    const expectedData = await readFile('index.html');

    const scope = nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, expectedData);

    const expectedFilepath = path.join(tmpdir, 'ru-hexlet-io-courses.html');
    const response = await pageLoader('https://ru.hexlet.io/courses', tmpdir);
    const resultData = await readFile(expectedFilepath);

    expect(scope.isDone()).toBeTruthy();
    expect(response.filepath).toBe('expectedFilepath');
    expect(resultData).toBe(expectedData);
  });
});
