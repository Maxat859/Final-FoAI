export async function loadAssetManifest(url='./assets/manifest.json') {
  const response=await fetch(url,{cache:'no-cache'});
  if(!response.ok)throw new Error(`Asset manifest HTTP ${response.status}`);
  const manifest=await response.json();
  if(manifest.tileSize!==32||!manifest.sprites||typeof manifest.sprites!=='object')throw new Error('Invalid assets/manifest.json');
  const images=new Map();const errors=[];
  await Promise.all(Object.entries(manifest.sprites).map(async([id,path])=>{
    if(typeof path!=='string'||path.includes('..')||!path.startsWith('assets/')){errors.push(`${id}: unsafe path`);return;}
    const img=new Image();
    try{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src='./'+path;});images.set(id,img);}
    catch{errors.push(`${id}: ${path}`);}
  }));
  return {manifest,images,errors,loaded:images.size,total:Object.keys(manifest.sprites).length};
}
export function assetPath(manifest,id){return manifest?.sprites?.[id]??null;}
