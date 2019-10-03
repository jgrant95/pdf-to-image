# pdf-to-image
A small node api which takes a pdf and responds with each page as an image

- Currently using pdf.js, but appears to have issues rendering certain fonts. This is results in the images being incorrect and is therefore unreliable.
- Need to investigate another method of rendering pdfs, possibly Pdfium (Chromes pdf renderer)
