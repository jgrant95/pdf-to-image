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
        headless: true,
        args: ['--no-sandbox', '--headless' ],
      })

      var browserPage = await browser.newPage();
      console.log('puppeteer page created')
      browserPage.on('console', (log) => console[log._type](log._text));

      browserPage.setContent(htmlContent)

      var context = await browserPage.evaluate((width, height) => {
        var canvas = document.getElementById('canvas');
        canvas.width = width
        canvas.height = height

        document.body.appendChild(canvas);
        
        var ctx = canvas.getContext('2d'); 
        ctx.width = width
        ctx.height = height

        return ctx;
      }, viewport.width, viewport.height);

      console.log('we hav da context!', context, context.width, context.height)

      var renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      return pdfPage.render(renderContext).promise.then(async () => {
        // can have compression levels and qualities from canvas specified here
        // make toBuffer async
        var image = canvasAndContext.canvas.toBuffer();
        zip.file('test ' + i + '.jpeg', image, {
          binary: true
        })

        await browser.close()
      })
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