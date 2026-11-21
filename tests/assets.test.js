import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
test('manifest contains real 32x32 PNG assets with unique stable IDs',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'),'utf8'));
  assert.equal(manifest.tileSize,32);
  for(const [id,p] of Object.entries(manifest.sprites)){
    assert.match(id,/^[a-z][a-z0-9._-]+$/);assert.match(p,/^assets\//);
    assert.ok(fs.existsSync(path.join(root,p)),`${id}: ${p}`);
    const buf=fs.readFileSync(path.join(root,p));
    assert.equal(buf.toString('hex',0,8),'89504e470d0a1a0a');
    assert.equal(buf.readUInt32BE(16),32);assert.equal(buf.readUInt32BE(20),32);
  }
});
