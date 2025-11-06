import path from 'path';
import fs from 'fs/promises';
import nock from 'nock';
import os from 'os';
import pageLoader, { getNameByPath } from '../src/pageLoader.js';
import { fileURLToPath } from 'url';

const host = 'https://ru.hexlet.io';
const testUrl = `${host}/courses`;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFixturePath = (filename) =>
  path.join(__dirname, '..', '__fixtures__', filename);

let tmpdir = '';
let expectedHtml;
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

beforeAll(async () => {
  nock.disableNetConnect();
  expectedHtml = await fs.readFile(
    getFixturePath('expected_index.html'),
    'utf-8'
  );
});

beforeEach(async () => {
  tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

afterEach(async () => {
  await fs.rm(tmpdir, { recursive: true, force: true });
  nock.cleanAll();
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

describe('pageLoader positive cases', () => {
  const scope = nock(host).persist();
  beforeEach(async () => {
    resources.forEach((asset) => {
      scope
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
  test.each(resources.slice(1))(
    'should download asset %# properly',
    async (asset) => {
      const expectedAsset = await fs.readFile(
        getFixturePath(asset.fixtureName)
      );
      await pageLoader(testUrl, tmpdir);
      const actualAsset = await fs.readFile(
        path.join(tmpdir, 'ru-hexlet-io-courses_files', asset.localFilename)
      );

      expect(expectedAsset.equals(actualAsset)).toBe(true);
    }
  );
});
describe('pageLoader negative cases', () => {
  test('should throw error on invalid link', async () => {
    await expect(pageLoader('invalidLink', tmpdir)).rejects.toThrow(
      /Invalid url provided/
    );
  });

  test('should throw 404 on wrong path', async () => {
    nock(host).get('/wrongpath').reply(404);
    await expect(
      pageLoader(path.join(host, '/wrongpath'), tmpdir)
    ).rejects.toThrow(/Request failed with status code 404/);
  });

  test('should handle filesystem error with not existing dir', async () => {
    await expect(pageLoader(testUrl, 'notExistingDir')).rejects.toThrow(
      /ENOENT: no such file or directory/
    );
  });

  test('should handle network error', async () => {
    nock(host).get('/courses').replyWithError('Network error');

    await expect(pageLoader(testUrl, tmpdir)).rejects.toThrow(/Network error/);
  });

  test('should handle asset download error', async () => {
    const initialHtml = resources[0].fixtureName;
    const scope = nock(host)
      .persist()
      .get('/courses')
      .reply(200, async () => await fs.readFile(getFixturePath(initialHtml)), {
        'Content-Type': 'text/html',
      });

    for (const asset of resources.slice(1)) {
      if (asset.path === '/assets/professions/nodejs.png') {
        scope.get(asset.path).reply(404);
      } else {
        scope
          .get(asset.path)
          .reply(
            200,
            async () => await fs.readFile(getFixturePath(asset.fixtureName)),
            {
              'Content-Type': asset.contentType,
            }
          );
      }
    }

    await expect(pageLoader(testUrl, tmpdir)).rejects.toThrow(/404/);
  });
});
