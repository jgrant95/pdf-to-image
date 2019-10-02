'use strict'

const pdfjsLib = require('pdfjs-dist');
const { createCanvas } = require('canvas')
const  { from } = require('rxjs');

function pdfToImagesObs(pdfData, options = {}) {

  return pdfjsLib.getDocument({
    data: pdfData
  }).promise.then(function (pdf) {    
    var numPages = pdf.numPages;
    console.log('# Document Loaded');
    console.log('Number of Pages: ' + numPages);
    console.log();

    var lastPromise = Promise.resolve(); // will be used to chain promises

    var loadPage = function getPage(currentPage) {
      pdf.getPage(currentPage).then(function (page) {
        var scale = 1.5;
        var viewport = page.getViewport({scale: scale});

        var canvas = createCanvas(viewport.height, viewport.width)
        var ctx = canvas.getContext('2d');
        // canvas.height = viewport.height;
        // canvas.width = viewport.width;

        if (currentPage < pdf.numPages) {
          console.log("Image retrieved: " + currentPage);
          pages.push(ctx.getImageData(0, 0, canvas.width, canvas.height))

          currentPage++;
        }
      });
    }

    for (var i = 1; i <= numPages; i++) {
      lastPromise = lastPromise.then(loadPage.bind(null, i));
    }

    return lastPromise;
  }).then(
    () => {
      console.log('# End of document')
      return pages
    },
    (err) => {
      console.error('Error: ' + err);
    })
}

async function pdfToImages(pdfData, options = {}) {
  var pages = []

  return pdfjsLib.getDocument({
    data: pdfData
  }).promise.then(function (pdf) {    
    var numPages = pdf.numPages;
    console.log('# Document Loaded');
    console.log('Number of Pages: ' + numPages);
    console.log();

    var lastPromise = Promise.resolve(); // will be used to chain promises

    var loadPage = function getPage(currentPage) {
      pdf.getPage(currentPage).then(function (page) {
        var scale = 1.5;
        var viewport = page.getViewport({scale: scale});

        var canvas = createCanvas(viewport.height, viewport.width)
        var ctx = canvas.getContext('2d');
        // canvas.height = viewport.height;
        // canvas.width = viewport.width;

        if (currentPage < pdf.numPages) {
          console.log("Image retrieved: " + currentPage);
          pages.push(ctx.getImageData(0, 0, canvas.width, canvas.height))

          currentPage++;
        }
      });
    }

    for (var i = 1; i <= numPages; i++) {
      lastPromise = lastPromise.then(loadPage.bind(null, i));
    }

    return lastPromise;
  }).then(
    () => {
      console.log('# End of document')
      return pages
    },
    (err) => {
      console.error('Error: ' + err);
    })
}

// async function create() {
//   const browser = await puppeteer.launch({
//     headless: true,
//     executablePath: process.env.CHROME_BIN || null,
//     args: ['--no-sandbox', '--headless', '--disable-gpu', '--disable-dev-shm-usage'],
//   })
//   return new Converter(browser)
// }

module.exports = {
  pdfToImages
}
