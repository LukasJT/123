window.catalogImportManifest={"total":17851,"chunkSize":5000,"chunks":[{"file":"catalog-imports-1.js","count":5000},{"file":"catalog-imports-2.js","count":5000},{"file":"catalog-imports-3.js","count":5000},{"file":"catalog-imports-4.js","count":2851}]};
if(typeof document!=="undefined"){
  for(const chunk of window.catalogImportManifest.chunks){
    document.write(`<script src="${chunk.file}"><\/script>`);
  }
}
