window.catalogImportManifest={"total":0,"chunkSize":5000,"chunks":[]};
if(typeof document!=="undefined"){
  for(const chunk of window.catalogImportManifest.chunks){
    document.write(`<script src="${chunk.file}"><\/script>`);
  }
}
