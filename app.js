'use strict';

require('dotenv').load();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 8888;

module.exports = app;
