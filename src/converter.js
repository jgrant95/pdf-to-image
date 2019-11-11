'use strict'

var JSZip = require("jszip");
const PDF2Pic = require("pdf2pic");
const fs = require('fs'); // need to update 3rd party package to take a stream/buffer

async function pdfToImages(pdfData, options = {}) {
  const zip = new JSZip();

  const pdf2pic = new PDF2Pic({
    density: 100,
    savename: "untitled",
    savedir: "./",
    format: "jpeg",
    size: "600x600"
  });

  var t = await fs.writeFile("tmp/test.pdf", pdfData, { encoding: 'base64' }, async function(err) {
    if(err) {
      return console.log(err);
    }
  });

  //   console.log("The file was saved!");

    return pdf2pic.convert("tmp/test.pdf", [1]).then((res) => {
      console.log('conversion complete')
      // zip.file('test ' + i + '.jpeg', res, { binary: true })

      return res;
  
      // return await zip.generateAsync({type: 'nodebuffer'}).catch(err => console.log('error', err));
    });
  // })

  // return t
}

module.exports = {
  pdfToImages
}
