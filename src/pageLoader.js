import path from 'path';
import fs from 'fs/promises';
import axios from 'axios';
import * as cheerio from 'cheerio';

const sources = {
  img: 'src',
  script: 'src',
  link: 'href',
};

export const getNameByPath = (url, extension) => {
  const filename = url
    .toLowerCase()
    .replace(/https?:\/\//, '')
    .replace(path.extname(url), '')
    .replace(/[^0-9a-z]/gi, '-');
  return `${filename}${extension}`;
};

const getURL = (host, link) => {
  if (/^https?:\/\//.test(link)) {
    return link;
  }
  return new URL(link, host).toString();
};

const getAssetsList = ($, handleAsset) => {
  return Object.entries(sources)
    .map(([tag, srcAttr]) => {
      return $(tag)
        .toArray()
        .map((el) => handleAsset(el, srcAttr, tag));
    })
    .flat()
    .filter((x) => x);
};

const downloadAsset = async (src, path) => {
  const { data } = await axios.get(src, {
    responseType: 'arraybuffer',
  });
  await fs.writeFile(path, Buffer.from(data));
};

const loadSources = async (hostname, html, outputDirpath) => {
  const $ = cheerio.load(html);
  const assetsFolderpath = path.join(
    outputDirpath,
    getNameByPath(hostname, '_files')
  );
  await fs.mkdir(assetsFolderpath, { recursive: true });
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
    $(el).attr(srcAttr, path.join(assetsDir, newFilename));

    return { src: absSrc, path: newSrc, tag };
  };

  const assetsList = getAssetsList($, handleAsset);

  await Promise.all([
    fs.writeFile(htmlPath, $.html()),
    ...assetsList.map(({ src, path }) => downloadAsset(src, path)),
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
