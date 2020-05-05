'use strict'

const express = require('express')
const converter = require('./converter2')

const port = process.env.PORT || 3083

const app = express()

app.post('/', async (req, res, next) => {
  var data = Buffer.from('');
  req.on('data', function (chunk) {
    data = Buffer.concat([data, chunk]);
  });
  req.on('end', function () {
    req.rawBody = data;

    let {
      output,
      ...options
    } = req.query

    if (!output) {
      output = "jpeg";
    }

    converter.pdfToImages(req.rawBody).then(function (zip) {
      res.set({
          'Content-Type': 'application/zip',
          'Content-Length': zip.length,
        })
        .send(zip)
      next();
    })
  });
})

// Error page. - not working
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).send('Ooops! An unexpected error seems to have occurred.')
})

app.listen(port, () => {
  console.info(`Listen port on ${port}.`)
})

// Terminate process
process.on('SIGINT', () => {
  process.exit(0)
})