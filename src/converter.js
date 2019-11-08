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

async function getPdf(pdfDataString) {
  const pdfData = JSON.parse(pdfDataString, (key, value) => {
    return value && value.type === 'Buffer' ?
      Buffer.from(value.data) :
      value;
  });
  
  return await pdfjsLib.getDocument({
    data: pdfData
  }).promise
}

async function pdfToImages(pdfData, options = {}) {
  const zip = new JSZip()  

  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox'],
    })

    var browserPage = await browser.newPage();
    console.log(pdfData);
    await browserPage.exposeFunction('getPdf', (pdfData) => getPdf(pdfData));

    console.log('puppeteer page created')

    browserPage.on('console', (log) => console[log._type](log._text));

    await browserPage.setContent(htmlContent)

    // const jsHandle = await browserPage.evaluateHandle(() => {
    //   const element = document.getElementById('canvas');
    //   canvas.width = 200
    //   canvas.height = 800
      
    //   console.log('handle world', element)
    //   return element;
    // });

    // console.log(await jsHandle.jsonValue()); // JSHandle
  
    // const result = await browserPage.evaluate(e => console.log(e.jsonValue()), jsHandle);
    // console.log('canvas', result); // it will log the string 'Example Domain'   
    const pdfBufferString = JSON.stringify(pdfData);

    await browserPage.evaluate(async (pdfDataString) => {     
      
      const pdf = await getPdf(pdfDataString)
      const numPages = pdf.numPages  
    
      const pageNumbers = Array.from({
        length: numPages
      }).map((u, i) => i + 1)
    
      const promises = pageNumbers.map(pageNo => pdf.getPage(pageNo))
    
      const pages = await Promise.all(promises)

      var renderedPages = pages.map(async (pdfPage, i) => {
        console.log(i + ' evaluating...')

        const viewport = pdfPage.getViewport({
          scale: 1.0
        });

        var canvas = document.getElementById('canvas');
        canvas.width = viewport.width
        canvas.height = viewport.height

        console.log(i + ' canvas configured...')

        document.body.appendChild(canvas);

        console.log(i + ' canvas appended...')

        var context = canvas.getContext('2d');

        var renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        console.log(i + ' render context generated...')

        return renderContext;
      });

      var renderContexts = await Promise.all(renderedPages)
    }, pdfBufferString).catch(err => console.log('error2', err));

    console.log('page rendered');

    // work this out once code is working!
    // await browser.close()

    return zip.generateAsync({
      type: 'nodebuffer'
    }).catch(err => console.log('error1', err));
  } catch (err) {
    console.log('oops err: ', err)
  }
}

module.exports = {
  pdfToImages
}