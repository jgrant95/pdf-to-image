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

      var canvasFactory = new NodeCanvasFactory();
      var canvasAndContext =
        canvasFactory.create(viewport.width, viewport.height);
      var renderContext = {
        canvasContext: canvasAndContext.context,
        viewport: viewport,
        canvasFactory: canvasFactory,
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

function NodeCanvasFactory() {}
NodeCanvasFactory.prototype = {
  create: function NodeCanvasFactory_create(width, height) {
    assert(width > 0 && height > 0, 'Invalid canvas size');

    this.pup()

    console.log('createMethod', t)

    return t;
  },

  reset: function NodeCanvasFactory_reset(canvasAndContext, width, height) {
    assert(canvasAndContext.canvas, 'Canvas is not specified');
    assert(width > 0 && height > 0, 'Invalid canvas size');
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  },

  destroy: function NodeCanvasFactory_destroy(canvasAndContext) {
    assert(canvasAndContext.canvas, 'Canvas is not specified');

    // Zeroing the width and height cause Firefox to release graphics
    // resources immediately, which can greatly reduce memory consumption.
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  },

  pup: function NodeCanvasFactory_pup() {
    return new Promise((resolve, reject) => {

      return resolve(puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--headless'],
      }).then(browser => {
        return 'hey';

        return browser.newPage(browserPage => {
          console.log('puppeteer page created')
          browserPage.on('console', (log) => console[log._type](log._text));

          browserPage.setContent(htmlContent)

          return browserPage.evaluate((width, height) => {
            var canvas = document.getElementById('canvas');
            canvas.width = width
            canvas.height = height

            document.body.appendChild(canvas);

            var ctx = canvas.getContext('2d');
            ctx.width = width
            ctx.height = height

            return {
              canvas: canvas,
              context: ctx,
            };
          }, viewport.width, viewport.height);
        });
      }))
    })
  }
};

module.exports = {
  pdfToImages
}