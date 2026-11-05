// Optional local browser verification; point PLAYWRIGHT_PATH to an installed playwright-core.
import {pathToFileURL} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const {chromium}=await import(pathToFileURL(path.resolve(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const browser=await chromium.launch({headless:true,timeout:20000,executablePath:process.env.CHROMIUM_PATH});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3000',{waitUntil:'domcontentloaded',timeout:20000});
 await page.waitForFunction(()=>!document.querySelector('#loading')||document.querySelector('#loading').textContent.includes('não pôde'),{},{timeout:20000});
 const failure=await page.locator('#loading').count();if(failure)throw Error(await page.locator('#loading').innerText());
 await page.locator('#start').click();await page.waitForTimeout(1200);
 await mkdir('test-artifacts',{recursive:true});
 await page.screenshot({path:'test-artifacts/stage3-arrival.png'});
 for(const [name,x,z] of [['bridge',33,4],['tunnel',-43,3],['lookout',-31,36]]){
  await page.evaluate(async({x,z})=>{const w=await import('./world.js');w.teleport({target:{x,z:z-2}});},{x,z});await page.waitForTimeout(1200);
  await page.screenshot({path:`test-artifacts/stage3-${name}.png`});
 }
 await page.evaluate(async()=>{const w=await import('./world.js');w.lighting(true);w.reset();});await page.waitForTimeout(1000);
 await page.screenshot({path:'test-artifacts/stage3-night.png'});
 await writeFile('test-artifacts/browser-errors.json',JSON.stringify(errors,null,2));
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Browser scene loaded; arrival, bridge, tunnel, lookout and night screenshots saved. No uncaught JavaScript errors.');
}finally{await browser.close();}
