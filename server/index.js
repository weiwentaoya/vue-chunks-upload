const Koa = require('koa');
const path = require('path');
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser'); 
const koaBody = require('koa-body');
const static = require('koa-static')
const fs = require("fs")
const app = new Koa();
const router = new Router();
const cors = require('koa2-cors');
const { resolve } = require('path');
app.use(cors());
app.use(static(__dirname+'/public'));
app.use(koaBody({
    multipart: true,
    formidable: {
      maxFileSize: 20000 * 1024 * 1024 // 设置上传文件大小最大限制，默认2M
    }
}))

router.post('/api/checkFile',async (ctx, next)=>{
        const {hash } = ctx.request.body
        const chunks=[]
        if (fs.existsSync(`./public/${hash}`)){
            const files = fs.readdirSync(`./public/${hash}`)
            ctx.response.body ={
                code : 0,
                files
            }
        }
        resolve(
            ctx.response.body ={
                code : 0,
                chunks
            }
        )
   
   
})
router.post('/api/uploadFile',async (ctx, next)=>{
     const {index, hash, name} = ctx.request.body
    if (!fs.existsSync(`./public/${hash}`)) {
        fs.mkdirSync(`./public/${hash}`);
    }
    var stream = fs.createWriteStream(`./public/${hash}/${name}`);//创建一个可写流
    fs.createReadStream(ctx.request.files.chunk.path).pipe(stream);//可读流通过管道写入可写流
    ctx.response.body ={
        code : 0,
    }
})

router.post('/api/merageFile', (ctx, next)=>{
    if (!fs.existsSync(`./public/file`)) {
        fs.mkdirSync(`./public/file`);
    }
    const {hash, ext, size } = ctx.request.body
    if (fs.existsSync(`./public/${hash}`)) {
        const files = fs.readdirSync(`./public/${hash}`)
        const pipStream=(path, WS,index)=>{
            return new Promise(resolve=>{
                const RS = fs.createReadStream(path)
                RS.pipe(WS);
                RS.on('end',()=>{
                    // fs.unlinkSync(path)
                    resolve(index)
                })
            })

        }
        const chunks = files.map(el=>{
            const index = el.split('-').pop()
            return pipStream(`./public/${hash}/${el}`,fs.createWriteStream(`./public/file/${hash}.${ext}`,{
                start:index *  size,
                end:index *  size + size
            }),index)
                
        })
        Promise.all(chunks).then(res=>{
            // fs.unlinkSync(`./public/${hash}`)
        })
        ctx.response.body ={
            code : 0,
            filePath: `http://localhost:3000/file/${hash}.${ext}`
        }
    }else{
        ctx.response.body ={
            code : 0,
            message: '文件合并失败，请重新上传'
        }
    }
    
})

app.use(bodyParser())
app.use(router.routes());
app.listen(3000,()=>{
    
});


