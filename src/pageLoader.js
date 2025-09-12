import path from 'path';
import fs from 'fs/promises';
import axios from 'axios';
import * as cheerio from 'cheerio';

export const getNameByPath = (url, extension) => {
  const filename = url
    .toLowerCase()
    .replace(/https?:\/\//, '')
    .replace(path.extname(url), '')
    .replace(/[^0-9a-z]/gi, '-');
  return `${filename}${extension}`;
};

const loadSources = async (url, html, outputDirpath) => {
  const $ = cheerio.load(html);
  const htmlPath = path.join(outputDirpath, getNameByPath(url, '.html'));
  const assetsFolderpath = path.join(
    outputDirpath,
    getNameByPath(url, '_files')
  );
  await fs.mkdir(assetsFolderpath);

  const handleAssets = (el) => {
    const currSrc = $(el).attr('src');
    if (!currSrc) {
      return;
    }
    const absSrc = new URL(currSrc, url).href;
    const extension = path.extname(absSrc);
    const newFilename = getNameByPath(absSrc, extension);
    const newSrc = path.join(assetsFolderpath, newFilename);
    const assetsDir = getNameByPath(url, '_files');
    $(el).attr('src', path.join(assetsDir, newFilename));

    return { src: absSrc, path: newSrc };
  };

  const imgList = $('img')
    .toArray()
    .map((el) => handleAssets(el));

  const downloadAsset = async (src, path) => {
    const { data } = await axios.get(src, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(new Uint8Array(data));
    await fs.writeFile(path, buffer);
  };

  await Promise.all([
    fs.writeFile(htmlPath, $.html()),
    ...imgList.map(({ src, path }) => downloadAsset(src, path)),
  ]);

  return htmlPath;
};

export default async function pageLoader(url, outputDirpath = process.cwd()) {
  if (!url) {
    throw new Error('No url provided');
  }

  const { data: html } = await axios.get(url);
  const filepath = await loadSources(url, html, outputDirpath);
  return { filepath };
}
