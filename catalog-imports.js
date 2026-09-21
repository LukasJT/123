window.catalogImportManifest={"total":34179,"chunkSize":5000,"chunks":[{"file":"catalog-imports-1.js","count":5000},{"file":"catalog-imports-2.js","count":5000},{"file":"catalog-imports-3.js","count":5000},{"file":"catalog-imports-4.js","count":5000},{"file":"catalog-imports-5.js","count":5000},{"file":"catalog-imports-6.js","count":5000},{"file":"catalog-imports-7.js","count":4179}]};
if(typeof document!=="undefined"){
  for(const chunk of window.catalogImportManifest.chunks){
    document.write(`<script src="${chunk.file}"><\/script>`);
  }
}
