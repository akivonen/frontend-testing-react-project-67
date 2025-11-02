import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http.js';

axios.defaults.adapter = httpAdapter;
