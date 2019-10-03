'use strict'

const pdfjsLib = require('pdfjs-dist');
const Canvas = require('canvas')
var JSZip = require("jszip");
var assert = require('assert');

async function pdfToImages(pdfData, options = {}) {
  const zip = new JSZip()
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise
  const numPages = pdf.numPages

  console.log('Number of pages: ', numPages)
  
  const pageNumbers = Array.from({ length: numPages }).map((u, i) => {
    return i+1
  })

  const promises = pageNumbers.map(pageNo => pdf.getPage(pageNo))

  const pages = await Promise.all(promises)

  const renderedPages = pages.map((page, i) => {
    const viewport = page.getViewport({scale: 1.0});

    var canvasFactory = new NodeCanvasFactory();
    var canvasAndContext =
      canvasFactory.create(viewport.width, viewport.height);
    var renderContext = {
      canvasContext: canvasAndContext.context,
      viewport: viewport,
      canvasFactory: canvasFactory,
    };

    return page.render(renderContext).promise.then(() => {
      var image = canvasAndContext.canvas.toBuffer();
      console.log('converted page!')
      zip.file('test ' + i + '.jpeg', image, {binary: true})
    })
  })

  const pWait = await Promise.all(renderedPages)

  return zip.generateAsync({type: 'nodebuffer'}).catch(err => console.log('error', err));
}

// return pdfjsLib.getDocument({
//   data: pdfData
// }).promise.then(function (pdf) {    
//   var numPages = pdf.numPages;
//   console.log('# Document Loaded');
//   console.log('Number of Pages: ' + numPages);
//   console.log();

//   var lastPromise = Promise.resolve(); // used to chain promises

//   var loadPage = function getPage(currentPage) {
//     pdf.getPage(currentPage).then(function (page) {
//       var viewport = page.getViewport({scale: 1.5});

//       var canvas = createCanvas(viewport.height, viewport.width)
//       var ctx = canvas.getContext('2d');        

//       if (currentPage < pdf.numPages) {
//         console.log("Image retrieved: " + currentPage);
//         currentPage++;          
//       }
//     });
//   }

//   for (var i = 1; i <= numPages; i++) {
//     lastPromise = lastPromise.then(loadPage.bind(null, i));
//   }

//   return lastPromise;
// }).then(
//   () => {
//     console.log('# End of document')
//     return zip
//   },
//   (err) => {
//     console.error('Error: ' + err);
//   })

// async function create() {
//   const browser = await puppeteer.launch({
//     headless: true,
//     executablePath: process.env.CHROME_BIN || null,
//     args: ['--no-sandbox', '--headless', '--disable-gpu', '--disable-dev-shm-usage'],
//   })
//   return new Converter(browser)
// }+

function NodeCanvasFactory() {}
NodeCanvasFactory.prototype = {
  create: function NodeCanvasFactory_create(width, height) {
    assert(width > 0 && height > 0, 'Invalid canvas size');
    var canvas = Canvas.createCanvas(width, height);
    var context = canvas.getContext('2d');
    return {
      canvas: canvas,
      context: context,
    };
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
