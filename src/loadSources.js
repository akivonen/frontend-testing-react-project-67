import path from 'path';
import fs from 'fs/promises';
import * as cheerio from 'cheerio';
import debug from 'debug';
import {
  handleError,
  getURL,
  getAssetsList,
  downloadAsset,
  getNameByPath,
} from './lib/utils.js';

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
      return undefined;
    }
    const absSrc = getURL(hostname, currSrc);
    if (new URL(hostname).hostname !== new URL(absSrc).hostname) {
      return undefined;
    }
    const extension = path.extname(absSrc);
    const newFilename = getNameByPath(absSrc, extension || '.html');
    const newSrc = path.join(assetsFolderpath, newFilename);
    const assetsDir = getNameByPath(hostname, '_files');
    $(el).attr(srcAttr, path.posix.join(assetsDir, newFilename));

    return { src: absSrc, filepath: newSrc, tag };
  };

  const assetsList = getAssetsList($, handleAsset, SOURCES);
  fs.writeFile(htmlPath, $.html())
    .then(() => log(`Saved HTML file: ${htmlPath}`))
    .catch((e) => {
      handleError(e, `Error while saving html: `, true);
    });
  await Promise.all(
    assetsList.map(({ src, filepath }) => downloadAsset(src, filepath))
  ).catch((e) => {
    handleError(e, `Error handling assets: `, true);
  });
  log(`Downloaded ${assetsList.length} assets`);
  return htmlPath;
};

export default loadSources;
