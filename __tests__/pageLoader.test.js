import path from 'path';
import fs from 'fs/promises';
import nock from 'nock';
import os from 'os';
import { afterAll, afterEach, beforeEach, describe } from '@jest/globals';
import pageLoader, { getNameByPath } from '../src/pageLoader.js';
import { fileURLToPath } from 'url';

const testUrl = 'https://ru.hexlet.io/courses';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFixturePath = (filename) =>
  path.join(__dirname, '..', '__fixtures__', filename);

let tmpdir = '';
let expectedHtml;
let scope;

describe('page-loader', () => {
  const resources = [
    {
      fixtureName: 'init_index.html',
      path: '/courses',
      contentType: 'text/html',
      localFilename: 'ru-hexlet-io-courses.html',
    },
    {
      fixtureName: 'nodejs.png',
      path: '/assets/professions/nodejs.png',
      contentType: 'image/png',
      localFilename: 'ru-hexlet-io-assets-professions-nodejs.png',
    },
    {
      fixtureName: 'application.css',
      path: '/assets/application.css',
      contentType: 'text/css',
      localFilename: 'ru-hexlet-io-assets-application.css',
    },
    {
      fixtureName: 'runtime.js',
      path: '/packs/js/runtime.js',
      contentType: 'text/javascript',
      localFilename: 'ru-hexlet-io-packs-js-runtime.js',
    },
  ];

  beforeAll(() => {
    nock.disableNetConnect();
  });

  beforeEach(async () => {
    tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  });

  afterEach(async () => {
    await fs.rm(tmpdir, { recursive: true, force: true });
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  describe('getNameByPath', () => {
    test('should generate name from url properly', () => {
      const filename = getNameByPath(testUrl, '.html');
      expect(filename).toBe('ru-hexlet-io-courses.html');
      const foldername = getNameByPath(testUrl, '_files');
      expect(foldername).toBe('ru-hexlet-io-courses_files');
    });
  });

  describe('pageLoader', () => {
    beforeAll(async () => {
      expectedHtml = await fs.readFile(
        getFixturePath('expected_index.html'),
        'utf-8'
      );
      resources.forEach((asset) => {
        scope = nock('https://ru.hexlet.io')
          .persist()
          .get(asset.path)
          .reply(
            200,
            async () => await fs.readFile(getFixturePath(asset.fixtureName)),
            {
              'Content-Type': asset.contentType,
            }
          );
      });
    });
    test('should download HTML properly and return filepath', async () => {
      const expectedRootpath = path.join(tmpdir, 'ru-hexlet-io-courses.html');
      const response = await pageLoader(testUrl, tmpdir);
      const resultHtml = await fs.readFile(expectedRootpath, 'utf-8');
      expect(resultHtml).toBe(expectedHtml);
      expect(response.filepath).toBe(expectedRootpath);
      expect(scope.isDone()).toBeTruthy();
    });
    test.each(resources)('should download asset %# properly', async (asset) => {
      const expectedAsset = await fs.readFile(
        getFixturePath(asset.fixtureName)
      );
      await pageLoader(testUrl, tmpdir);
      const actualAsset = await fs.readFile(
        path.join(tmpdir, 'ru-hexlet-io-courses_files', asset.localFilename)
      );

      expect(expectedAsset.equals(actualAsset)).toBe(true);
    });
  });
});
