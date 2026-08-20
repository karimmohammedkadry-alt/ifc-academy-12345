import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { app } from './server/app';
const PORT = Number(process.env.PORT || 3000);
async function start(){ if(process.env.NODE_ENV !== 'production'){ const vite=await createViteServer({server:{middlewareMode:true},appType:'spa'}); app.use(vite.middlewares); } else { const dist=path.join(process.cwd(),'dist'); app.use(express.static(dist)); app.get('*',(_req,res)=>res.sendFile(path.join(dist,'index.html'))); } app.listen(PORT,'0.0.0.0',()=>console.log(`IFC Academy running on ${PORT}`)); }
start();
