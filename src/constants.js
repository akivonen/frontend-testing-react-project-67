export const SOURCES = {
  img: 'src',
  script: 'src',
  link: 'href',
};

export const ERROR_CODE_MESSAGES = {
  EEXIST: 'File or directory already exists.',
  ENOENT: 'No such file or directory found.',
  EACCES:
    'Permission denied. You do not have access to this file or directory.',
  ECONNREFUSED: 'Connection refused. The server is not responding.',
  ETIMEDOUT: 'Request timed out. The server took too long to respond.',
  401: 'Unauthorized. Please check your credentials.',
  403: 'Forbidden. You do not have permission to access this resource.',
  404: 'Not found. The requested resource could not be located.',
  500: 'Internal server error. Please try again later.',
};
