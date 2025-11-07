import fs from 'fs/promises';
import axios from 'axios';
import debug from 'debug';
import path from 'path';
import { SOURCES, ERROR_CODE_MESSAGES } from '../constants.js';

const log = debug('page-loader');

const getErrorMessage = (error) =>
  ERROR_CODE_MESSAGES[error.code] || error.message;

export const getNameByPath = (url, extension) => {
  const filename = url
    .toLowerCase()
    .replace(/https?:\/\//, '')
    .replace(path.extname(url), '')
    .replace(/[^0-9a-z]/gi, '-');
  return `${filename}${extension}`;
};

export const handleError = (error, context, shouldThrow = false) => {
  const msg = error instanceof Error ? getErrorMessage(error) : String(error);
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

export const getAssetsList = ($, handleAsset) =>
  Object.entries(SOURCES)
    .map(([tag, srcAttr]) =>
      $(tag)
        .toArray()
        .map((el) => handleAsset(el, srcAttr, tag))
    )
    .flat()
    .filter((x) => x);

export const downloadAsset = async (src, filepath) => {
  log(`Loading file ${src}`);
  try {
    const { data } = await axios.get(src, {
      responseType: 'arraybuffer',
    });
    log(`Writing file ${src}`);
    await fs.writeFile(filepath, Buffer.from(data));
  } catch (e) {
    handleError(e, `Failed to download asset ${src}: `, true);
  }
};
