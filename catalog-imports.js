window.catalogImportManifest={"total":8243,"chunkSize":5000,"chunks":[{"file":"catalog-imports-1.js","count":5000},{"file":"catalog-imports-2.js","count":3243}]};
if(typeof document!=="undefined"){
  for(const chunk of window.catalogImportManifest.chunks){
    document.write(`<script src="${chunk.file}"><\/script>`);
  }
}
