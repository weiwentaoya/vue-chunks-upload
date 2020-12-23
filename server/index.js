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
        let chunks=[]
        if (await fs.existsSync(`./public/${hash}`)){
            // 获取到已上传的chunk切片，返回
            chunks =await fs.readdirSync(`./public/${hash}`)
        }
        ctx.response.body ={
            code : 0,
            chunks
        }
   
})
router.post('/api/uploadFile', (ctx, next)=>{
    const rd = parseInt(Math.random()*10)
    if (rd<2) {
        ctx.response.status = 500
    }
    const {index, hash, name} = ctx.request.body
    if (!fs.existsSync(`./public/${hash}`)) {
        fs.mkdirSync(`./public/${hash}`);
    }
    // 保存文件chunk切片
    var stream = fs.createWriteStream(`./public/${hash}/${name}`);
    fs.createReadStream(ctx.request.files.chunk.path).pipe(stream);
    ctx.response.body ={
        code : 0,
    }
})

router.post('/api/merageFile',async (ctx, next)=>{
    if (!fs.existsSync(`./public/file`)) {
        fs.mkdirSync(`./public/file`);
    }
    const {hash, ext, size } = ctx.request.body
    let filePath = ''
    if (fs.existsSync(`./public/${hash}`)) {
        const files =await fs.readdirSync(`./public/${hash}`)
        // 控制读取到每一个文件切片（path） 流入到 可写流（WS）
        const pipStream=(path, WS,index)=>{
            return new Promise( resolve=>{
                const RS = fs.createReadStream(path)
                RS.pipe(WS);
                RS.on('end',()=>{
                    fs.unlinkSync(path)
                    resolve(index)
                })
            })

        }
        const chunks = files.map(el=>{
            const index = el.split('-').pop()
            // 创建可写流，设置流入的位置（start，end）
            const WS = fs.createWriteStream(`./public/file/${hash}.${ext}`,{
                start:parseInt(index *  size),
                end:parseInt(index *  size + size)
            })
            return pipStream(`./public/${hash}/${el}`, WS ,index)
                
        })
        await Promise.all(chunks).then(res=>{
            filePath = `http://localhost:3000/file/${hash}.${ext}`
        })
        ctx.response.body ={
            code : 0,
            filePath: filePath|| '',
            message: filePath?'上传成功':'文件合并失败，请重新上传'
        }
    }else{
        ctx.response.body ={
            code : 0,
            filePath:'',
            message: '文件合并失败，请重新上传'
        }
    }
    
})

app.use(bodyParser())
app.use(router.routes());
app.listen(3000,()=>{});
