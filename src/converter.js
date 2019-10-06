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
  </html>
`;

async function pdfToImages(pdfData, options = {}) {
  // const browser = await puppeteer.launch({
  //   headless: true,
  //   args: ['--no-sandbox', '--headless'],
  // })

  // var page = await browser.newPage();
  // console.log('puppeteer page created')

  // // await page.evaluateOnNewDocument(() => {
  // //   window.foobar = Math.random() * 1000;
  // // });
  // await page.goto('about:blank');

  // await page.evaluate(() => {
  //   var canvas = document.createElement('canvas');
  //   console.log(canvas)
  //   document.body.appendChild(canvas);
  //   // return '1';
  // });

  // await page.evaluate((doc) => {
  //   // console.log('evaluating dom...', doc)
  //   console.log('iinner', doc)

  //   let canvas = doc.createElement("canvas");

  //   console.log('puppeteer canvas: ', canvas)
  // });

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

  const renderedPages = pages.map((page, i) => {
    const viewport = page.getViewport({
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

    return page.render(renderContext).promise.then(() => {
      // can have compression levels and qualities from canvas specified here
      // make toBuffer async
      var image = canvasAndContext.canvas.toBuffer();
      zip.file('test ' + i + '.jpeg', image, {
        binary: true
      })
    })
  })

  await Promise.all(renderedPages)

  await browser.close()

  return zip.generateAsync({
    type: 'nodebuffer'
  }).catch(err => console.log('error', err));
}

function NodeCanvasFactory() {}
NodeCanvasFactory.prototype = {
  create: async function NodeCanvasFactory_create(width, height) {
    assert(width > 0 && height > 0, 'Invalid canvas size');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--headless'],
    })

    var page = await browser.newPage();
    console.log('puppeteer page created')

    // await page.evaluateOnNewDocument(() => {
    //   window.foobar = Math.random() * 1000;
    // });
    await page.goto('about:blank');

    return page.evaluate().then(() => {
      var c = document.createElement('canvas');
      c.width = width
      c.height = height
      console.log(c)
      document.body.appendChild(c);

      console.log('node canvas: ', c)

      var context = c.getContext('2d');
      return {
        canvas: c,
        context: context,
      };
    });
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
};

module.exports = {
  pdfToImages
}