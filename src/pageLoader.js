import axios from 'axios';
import debug from 'debug';
import 'axios-debug-log';
import fs from 'fs/promises';
import { handleError } from './lib/utils.js';
import loadSources from './loadSources.js';

const log = debug('page-loader');

// eslint-disable-next-line consistent-return
export default async function pageLoader(url, outputDirpath = process.cwd()) {
  if (!url) {
    throw new Error('No url provided');
  }

  try {
    // eslint-disable-next-line no-new
    new URL(url);
  } catch (e) {
    throw new Error(`Invalid url provided: ${url}. ${e.message}`);
  }

  try {
    const stats = await fs.stat(outputDirpath);
    if (!stats.isDirectory()) {
      throw new Error(`Output path "${outputDirpath}" is not a directory`);
    }
    await fs.access(outputDirpath, fs.constants.W_OK);
  } catch (e) {
    handleError(
      e,
      `Error accessing output directory "${outputDirpath}": ${e.message}`,
      true
    );
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
