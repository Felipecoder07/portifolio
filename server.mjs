import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {networkInterfaces} from 'node:os';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const port=Number.parseInt(process.env.PORT||'3000',10);
const host=process.env.HOST||'0.0.0.0';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{
 try {
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!target.startsWith(root)){res.writeHead(403);res.end();return;}
  const data=await readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('Arquivo não encontrado');}
}).listen(port,host,()=>{
 console.log(`Local: http://localhost:${port} — Ctrl+C para encerrar`);
 if(host==='0.0.0.0')for(const addresses of Object.values(networkInterfaces()))for(const address of addresses||[]){
  if(address.family==='IPv4'&&!address.internal)console.log(`Rede: http://${address.address}:${port}`);
 }
});
