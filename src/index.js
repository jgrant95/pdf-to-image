'use strict'

const express = require('express')
const converter = require('./converter')

const port = process.env.PORT || 3000

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

    console.log(req.rawBody);
    // var base64Data = req.rawBody.replace(/^data:image\/png;base64,/, "");

    var images = converter.pdfToImages(req.rawBody).then(function (pages) {
    console.log('images', images)
    var image1 = images ? images[0] : ''
    console.log(image1)

    res.set({
        'Content-Type': 'image/jpeg',
        'Content-Length': image1.length,
      })
      .send(image1)
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