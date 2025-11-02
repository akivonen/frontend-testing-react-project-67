import path from 'path';
import fs from 'fs/promises';
import * as cheerio from 'cheerio';
import {
  handleError,
  getURL,
  getAssetsList,
  downloadAsset,
} from './lib/utils.js';
import { getNameByPath } from './pageLoader.js';
import debug from 'debug';
import { SOURCES } from './constants.js';

const log = debug('page-loader');

const loadSources = async (hostname, html, outputDirpath) => {
  const $ = cheerio.load(html);
  const assetsFolderpath = path.join(
    outputDirpath,
    getNameByPath(hostname, '_files')
  );
  try {
    await fs.mkdir(assetsFolderpath, { recursive: true });
    log(`Created folder ${assetsFolderpath}`);
  } catch (e) {
    handleError(e, `Failed to create folder ${assetsFolderpath}:`, true);
  }
  const htmlPath = path.join(outputDirpath, getNameByPath(hostname, '.html'));

  const handleAsset = (el, srcAttr, tag) => {
    const currSrc = $(el).attr(srcAttr);
    if (!currSrc) {
      return;
    }
    const absSrc = getURL(hostname, currSrc);
    if (new URL(hostname).hostname !== new URL(absSrc).hostname) {
      return;
    }
    const extension = path.extname(absSrc);
    const newFilename = getNameByPath(absSrc, extension || '.html');
    const newSrc = path.join(assetsFolderpath, newFilename);
    const assetsDir = getNameByPath(hostname, '_files');
    $(el).attr(srcAttr, path.posix.join(assetsDir, newFilename));

    return { src: absSrc, path: newSrc, tag };
  };

  const assetsList = getAssetsList($, handleAsset, SOURCES);
  fs.writeFile(htmlPath, $.html())
    .then(() => log(`Saved HTML file: ${htmlPath}`))
    .catch((e) => {
      handleError(e, `Error while saving html: `, true);
    });
  await Promise.all(
    assetsList.map(({ src, path }) => downloadAsset(src, path))
  ).catch((e) => {
    handleError(e, `Error handling assets: `, true);
  });
  log(`Downloaded ${assetsList.length} assets`);
  return htmlPath;
};

export default loadSources;
