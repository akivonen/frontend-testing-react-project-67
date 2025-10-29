import fs from 'fs/promises';
import axios from 'axios';
import debug from 'debug';
import { sources } from '../loadSources';

const log = debug('page-loader');

export const handleError = (error, context, shouldThrow = false) => {
  const msg = error instanceof Error ? error.message : String(error);
  log(`${context}: ${msg}`);
  if (shouldThrow) {
    throw error;
  }
};

export const getURL = (host, link) => {
  if (/^https?:\/\//.test(link)) {
    return link;
  }
  return new URL(link, host).toString();
};

export const getAssetsList = ($, handleAsset) => {
  return Object.entries(sources)
    .map(([tag, srcAttr]) => {
      return $(tag)
        .toArray()
        .map((el) => handleAsset(el, srcAttr, tag));
    })
    .flat()
    .filter((x) => x);
};

export const downloadAsset = async (src, path) => {
  log(`Loading file ${src}`);
  try {
    const { data } = await axios.get(src, {
      responseType: 'arraybuffer',
    });
    log(`Writing file ${src}`);
    await fs.writeFile(path, Buffer.from(data));
  } catch (e) {
    handleError(e, `Failed to download asset ${src}: `, true);
  }
};
