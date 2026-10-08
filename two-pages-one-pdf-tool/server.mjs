import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {join,normalize,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url)),port=Number(process.env.PORT||4891),host=process.env.HOST||'0.0.0.0';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
createServer(async(req,res)=>{const path=decodeURIComponent(new URL(req.url,`http://${req.headers.host}`).pathname),file=normalize(join(root,path==='/'?'index.html':path.slice(1)));if(!file.startsWith(root))return res.writeHead(403).end();try{if(!(await stat(file)).isFile())throw 0;res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(await readFile(file))}catch{res.writeHead(404).end('Not found')}}).listen(port,host,()=>console.log(`Two pages to one PDF: http://127.0.0.1:${port}`));
