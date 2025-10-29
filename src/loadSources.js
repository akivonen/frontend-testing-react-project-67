import path from 'path';
import fs from 'fs/promises';
import * as cheerio from 'cheerio';
import { handleError, getURL, getAssetsList, downloadAsset } from './lib/utils';
import { getNameByPath } from './pageLoader';
import debug from 'debug';

const log = debug('page-loader');

export const sources = {
  img: 'src',
  script: 'src',
  link: 'href',
};

export default loadSources = async (hostname, html, outputDirpath) => {
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

  const assetsList = getAssetsList($, handleAsset, sources);
  await fs.writeFile(htmlPath, $.html());
  log(`Saved HTML file: ${htmlPath}`);
  await Promise.all(
    assetsList.map(({ src, path }) => downloadAsset(src, path))
  );
  log(`Downloaded ${assetsList.length} assets`);
  return htmlPath;
};
