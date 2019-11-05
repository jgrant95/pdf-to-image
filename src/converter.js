'use strict'

const pdfjsLib = require('pdfjs-dist');
const Canvas = require('canvas')
var JSZip = require("jszip");
var assert = require('assert');
const puppeteer = require('puppeteer')

const htmlContent = `
  <!doctype html>
  <html>
    <head><meta charset='UTF-8'><title>Test</title></head>
    <body>Test</body>
    <canvas id="canvas" width="200" height="100"></canvas>
  </html>
`;

async function pdfToImages(pdfData, options = {}) {
  const zip = new JSZip()

  const pdf = await pdfjsLib.getDocument({
    data: pdfData
  }).promise
  const numPages = pdf.numPages

  const pageNumbers = Array.from({
    length: numPages
  }).map((u, i) => i + 1)

  const promises = pageNumbers.map(pageNo => pdf.getPage(pageNo))

  const pages = await Promise.all(promises)

  try {
    const renderedPages = pages.map(async (pdfPage, i) => {
      const viewport = pdfPage.getViewport({
        scale: 1.0
      });

      const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox' ],
      })

      var browserPage = await browser.newPage();
      console.log('puppeteer page created')
      browserPage.on('console', (log) => console[log._type](log._text));

      browserPage.setContent(htmlContent)

      browserPage.evaluate((viewport, pdfPage) => {
        console.log(i + ' evaluating...')

        var canvas = document.getElementById('canvas');
        canvas.width = viewport.width
        canvas.height = viewport.height

        console.log(i + ' canvas configured...')

        document.body.appendChild(canvas);

        console.log(i + ' canvas appended...')

        var context = canvas.getContext('2d');        

        var renderContext = {
          canvasContext: context.jsonValue(),
          viewport: viewport
        };

        console.log(i + ' render context generated...')
  
        var renderedTask = pdfPage.render(renderContext);

        console.log(i + ' rendering...')
  
        renderedTask.promise.then(async function(x) {  
          console.log(i + ' rendered...')

          var canvasAndContext = x.canvasAndContext;
          // can have compression levels and qualities from canvas specified here
          // make toBuffer async
          var image = canvasAndContext.canvas.toBuffer();
          zip.file('test ' + i + '.jpeg', image, {
            binary: true
          })

          console.log(i + ' image added to zip...')
        })
      }, viewport, pdfPage);

      console.log(i + ' closing browser...')

      await browser.close()
    })

    await Promise.all(renderedPages)

    return zip.generateAsync({
      type: 'nodebuffer'
    }).catch(err => console.log('error', err));
  } catch (err) {
    console.log('oops err: ', err)
  }
}

module.exports = {
  pdfToImages
}