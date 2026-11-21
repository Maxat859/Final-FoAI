// Asynchronous persistence with IndexedDB; localStorage/memory fallback.
const DB_NAME='qamal-frontend-v1';
export function createStorage(){
  const memory=new Map();let dbPromise=null;
  function db(){
    if(!('indexedDB' in globalThis))return Promise.resolve(null);
    if(!dbPromise)dbPromise=new Promise(resolve=>{
      try{
        const req=indexedDB.open(DB_NAME,1);
        req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('state'))req.result.createObjectStore('state');};
        req.onsuccess=()=>resolve(req.result);req.onerror=()=>resolve(null);req.onblocked=()=>resolve(null);
      }catch{resolve(null);}
    });
    return dbPromise;
  }
  async function get(key,fallback=null){
    const connection=await db();
    if(connection){try{return await new Promise(resolve=>{
      const req=connection.transaction('state','readonly').objectStore('state').get(key);
      req.onsuccess=()=>resolve(req.result??fallback);req.onerror=()=>resolve(fallback);
    });}catch{/* fallback */}}
    try{const raw=localStorage.getItem(`qamal.${key}`);return raw===null?fallback:JSON.parse(raw);}catch{return memory.get(key)??fallback;}
  }
  async function set(key,value){
    const connection=await db();
    if(connection){try{await new Promise((resolve,reject)=>{
      const tx=connection.transaction('state','readwrite');tx.objectStore('state').put(value,key);
      tx.oncomplete=resolve;tx.onerror=reject;
    });return;}catch{/* fallback */}}
    try{localStorage.setItem(`qamal.${key}`,JSON.stringify(value));}catch{memory.set(key,value);}
  }
  return {get,set};
}
