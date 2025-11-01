import path from 'path';
import axios from 'axios';
import debug from 'debug';
import 'axios-debug-log';
import { handleError } from './lib/utils';
import loadSources from './loadSources';
import fs from 'fs/promises';

const log = debug('page-loader');

export const getNameByPath = (url, extension) => {
  const filename = url
    .toLowerCase()
    .replace(/https?:\/\//, '')
    .replace(path.extname(url), '')
    .replace(/[^0-9a-z]/gi, '-');
  return `${filename}${extension}`;
};

export default async function pageLoader(url, outputDirpath = process.cwd()) {
  if (!url) {
    throw new Error('No url provided');
  }

  try {
    const { data: html } = await axios.get(url);
    log(`Fetched HTML from ${url}`);
    const filepath = await loadSources(url, html, outputDirpath);
    return { filepath };
  } catch (e) {
    handleError(e, `Error downloading page ${url}: `, true);
  }
}
