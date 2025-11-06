import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http.js';
import { jest } from '@jest/globals';

axios.defaults.adapter = httpAdapter;
