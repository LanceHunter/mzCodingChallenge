'use strict';

require('dotenv').load();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 8888;

const config = {
  sunriseBank : {
    apiKey : process.env.SUNRISEBANKAPI,
    type : 'atm',
    language : 'English',
    responseOutput : 'xml',
    requestNumber : 200
  },
  happyCreditUnion : {
    apiKey : process.env.HAPPYCREDITUNIONAPI,
    type : 'bank',
    language : 'Spanish',
    responseOutput : 'json',
    requestNumber : 20
  },
  parisFCU : {
    apiKey : process.env.PARISFCUAPI,
    type : 'all',
    language : 'French',
    responseOutput : 'json',
    requestNumber : 5
  }
};

app.use(bodyParser.json());

app.get('/', (req, res) => {
  console.log(req.body);
});

app.listen(port, () => {
  console.log('Listening on port ', port);
});

module.exports = app;
