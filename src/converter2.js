'use strict'

const { Poppler } = require('node-poppler');
var JSZip = require("jszip");
const fs = require('fs');
const path = require('path');

async function pdfToImages(pdfData, options2 = {}) {


  
  const zip = new JSZip()

  const poppler = new Poppler();
  const options = {
    firstPageToConvert: 1,
    lastPageToConvert: 2,
    pngFile: true
  };
  
 
  const t = await poppler.pdfToCairo(options, 'C:\\Users\\Jon\\Documents\\Projects\\js\\pdf-to-image\\src\\test.pdf').then((res) => {
      console.log('output from pdf', res);
      // zip.file('test.jpeg', res, {binary: true})
  });

  console.log('pfd converter finished', t)

  return zip.generateAsync({type: 'nodebuffer'}).catch(err => console.log('error', err)); 
}

function writeFile(data){
  fs.writeFileSync(path.join("./","result.pdf"), data)
}

module.exports = {
  pdfToImages
}
