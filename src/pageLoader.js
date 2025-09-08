import path from 'path';
import fs from 'fs/promises';
import axios from 'axios';

export const getFilename = (url) => {
  const filename = url
    .toLowerCase()
    .replace(/https?:\/\//, '')
    .replace('www.', '')
    .replace(/[^0-9a-z]/gi, '-');
  return `${filename}.html`;
};

export default async function pageLoader(url, outputDirpath = process.cwd()) {
  if (!url) {
    throw new Error('No url provided');
  }

  const filepath = path.join(outputDirpath, getFilename(url));
  const { data } = await axios.get(url);
  await fs.writeFile(filepath, data);
  return { filepath };
}
