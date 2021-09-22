<script>
    import axios from 'axios';
    const SERVER = axios.create()
    SERVER.interceptors.response.use(
        response=>{
            return response.data
        }
    )
    import SparkMD5 from 'spark-md5';
    export default {
        name:'helloName',
        props:{
            drag:{
                type: Boolean,
                default: false
            },
            //文件切片大小（建议为整数）
            chunkSize:{
                type: Number,
                default: 102400
            },
            /*
            *  区分计算hash的方法
            *  1:通过子线程worker计算
            *  2:通过浏览器的空闲时段计算requestIdleCallback
            *  0：利用布隆过滤器方式计算
            */
            hashType:{
                type: Number,
                default: 0
            },
            // 检查已上传切片地址
            checkFileUrl:{
                type: String,
                required: true
            },
            // 上传切片地址
            uploadFileUrl:{
                type: String,
                required: true
            },
            // 合并切片地址
            merageFileUrl:{
                type: String,
                required: true,
            },
            // 获取上传进度
            onUploadProgress:{
                type: Function,
            },
            // 上传成功获取上传地址
            onUploadSuccess:{
                type: Function,
                required: true
            },
            // 上传失败获取上传地址
            onUploadError:{
                type: Function,
            },
            // 上传并发数量
            limit:{
                type: Number,
                default: 3
            }
        },
        data () {
            return {
                file: null,
                chunks: [],
                hash:''
            }
        },
        mounted(){
            this.bindEvends()
        },
        methods: {
            createChunks(){
                if (!this.file) return
                const chunks = []
                let count = 0
                const size = this.file.size
                while (count< size) {
                    chunks.push(this.file.slice(count,count + this.chunkSize))
                    count+= this.chunkSize
                }
                this.chunks = chunks.map((el,index)=>{
                    return {
                        chunk: el,
                        index,
                        progress:0
                    }
                })
                this.createHash()
            },
            createHash(){
                if (this.hashType === 1) {
                //    console.time('worker')
                   this.WorkerCreateHash().then(res=>{
                        this.hash = res.hash
                        this.checkFile()
                   })
                //    console.timeEnd('worker')
                }else if(this.hashType === 2) {
                    // console.time('idle')
                    this.IdleCreateHash().then(res=>{
                        this.hash = res.hash
                        this.checkFile()
                   })
                    // console.timeEnd('idle')
                }else{
                    // console.time('blond')
                    this.BlondCreateHash().then(res=>{
                       this.hash = res.hash
                       this.checkFile()
                   })
                    // console.timeEnd('blond')
                }
                
            },
            checkFile(){
                this.chunks.forEach((el,index)=>{
                    el.name = `${this.hash}-${index}`
                })
                SERVER.post(this.checkFileUrl, {hash:this.hash} ).then(res=>{
                    if (res.code == 0) {
                        this.chunks.forEach((el,index)=>{
                            if (res.chunks.indexOf(el.name) > -1) {
                                el.progress = 100
                                this.postProgress()
                            }else{
                                el.progress = 0
                            }
                        })
                        this.uploadFile()
                    }
                })

            },
            uploadFile(){
                const chunkForms = this.chunks.map((el,index)=>{
                    const form = new FormData
                    form.append("chunk",el.chunk)
                    form.append("index",index)
                    form.append("hash",this.hash)
                    form.append("name",`${this.hash}-${index}`)
                    form.name = `${this.hash}-${index}`
                    form.index = index
                    form.hash = this.hash
                    form.error = 0
                    form.progress = el.progress
                    return form
                    // return new Promise(resolve=>{
                    //     SERVER.post(
                    //         this.uploadFileUrl, form,
                    //         {
                    //             onUploadProgress:  (Event)=>{
                    //                 el.progress = Number((Event.loaded/Event.total * 100).toFixed(2))
                    //                this.postProgress()
                    //             },
                    //         }
                    //     ).then(res=>{
                    //         resolve(index)
                    //     })
                    // })
                }).filter(el=>el.progress<100)
                this.sendRequest(chunkForms).then(res=>{
                    this.merageFile()
                }).catch(()=>{
                    console.log('上传错误')
                    this.onUploadError&&this.onUploadError('上传错误')
                })
                // Promise.all(asyncFun).then(res=>{
                //     this.merageFile()
                // })
                
            },
            sendRequest(chunkForms){
                let lock = true
                // limit
                const length =  chunkForms.length
                return new Promise((resolve, reject)=>{
                    if (length === 0) {
                        resolve()
                        return
                    }
                    let count = 0
                    const start = ()=>{
                        const form =  chunkForms.shift()
                        if (form.error>=3) {
                            lock = false
                        }
                        if (!form) return
                        if(!lock){
                             reject()
                             return
                        }
                        SERVER.post(
                            this.uploadFileUrl, form,
                            {
                                onUploadProgress:  (Event)=>{
                                   this.chunks[form.index].progress = Number((Event.loaded/Event.total * 100).toFixed(2))
                                   this.postProgress()
                                },
                            }
                        ).then(res=>{
                            if (res.code == 0) {
                                if (count >= length) {
                                    resolve()
                                }else{
                                    count++
                                    start()
                                }
                            }else{
                                form.error++
                                this.chunks[form.index].progress=0
                                chunkForms.unshift(form)
                                start()
                            }
                        }).catch(err=>{
                            form.error++
                            this.chunks[form.index].progress=0
                            chunkForms.unshift(form)
                            start()
                        })
                    }
                    while (count <= this.limit) {
                        count++
                        start()
                    }
                })
            },
            merageFile(){
                SERVER.post(this.merageFileUrl, 
                {
                    hash:this.hash,
                    size: this.chunkSize,
                    ext: this.file.name.split('.').pop()
                }).then(res=>{
                    if (res.code == 0 ) {
                        this.onUploadSuccess(res.filePath)
                    }
                })
            },
            // 通过子线程worker计算
            WorkerCreateHash(){
                return new Promise(resolve=>{
                    const worker = new Worker('/workerHash.js');
                    worker.postMessage({chunks:this.chunks})
                    worker.onmessage=e=>{
                        resolve(e.data)
                    }
                })
            },
            // 通过浏览器的空闲时段计算
            IdleCreateHash(){
                return new Promise(resolve=>{
                    const spark = new SparkMD5.ArrayBuffer();
                    let index = 0
                    const fileReader = new FileReader()
                    const appendToSpark = chunk=>{
                        return new Promise(resolve=>{
                            fileReader.readAsArrayBuffer(chunk)
                            fileReader.onload=e=>{
                                spark.append(e.target.result)
                                resolve()
                            }
                        })
                    }
                    const workLoop = ()=>{
                        appendToSpark(this.chunks[index].chunk).then(res=>{
                            index++
                            if(index>= this.chunks.length){
                                resolve({hash:spark.end()})
                            }else{
                                window.requestIdleCallback(workLoop)
                            }
                        })
                    }
                    window.requestIdleCallback(workLoop)

                })
            },
            // 利用布隆过滤器方式计算
            BlondCreateHash(){
                return new Promise(resolve=>{
                    const spark = new SparkMD5.ArrayBuffer();
                    const fileReader = new FileReader()
                    let count = this.chunkSize
                    const chunks = [this.file.slice(0,count)]
                    while (count < this.file.size) {
                        const chunk = this.file.slice(count,count+this.chunkSize)
                        const mid = count + this.chunkSize/2
                        const end = count + this.chunkSize
                        chunks.push(this.file.slice(count,count+2))
                        chunks.push(this.file.slice(mid,mid+2))
                        chunks.push(this.file.slice(end-2,end))
                        count+= this.chunkSize
                    }
                    fileReader.readAsArrayBuffer(new Blob(chunks))
                    fileReader.onload=e=>{
                        spark.append(e.target.result)
                        resolve({hash:spark.end()})
                    }
                })
            },
            postProgress(){
                const uploadProgress = this.chunks.filter(el=>el.progress === 100).length/ this.chunks.length
                this.onUploadProgress( uploadProgress.toFixed(2) )
            },
            handleFileChange(e){
               const [file] = e.target.files
               if (!file) return
               this.file = file
               this.createChunks()
            },
            bindEvends(){
                const drag = this.$refs.dragRef
                if (!drag) return
                console.log(drag);
                
                drag.addEventListener('dragover',e=>{
                    drag.style.borderColor="#1296db"
                    e.preventDefault()
                })
                drag.addEventListener('mouseout',e=>{
                    drag.style.borderColor="#d9d9d9"
                    e.preventDefault()
                })
                drag.addEventListener('dragleave',e=>{
                    drag.style.borderColor="#d9d9d9"
                    e.preventDefault()
                })
                drag.addEventListener('drop',e=>{
                    drag.style.borderColor="#d9d9d9"
                    const [file] = e.dataTransfer.files
                    if (!file) return
                    this.file = file
                    this.createChunks()
                    e.preventDefault()
                })
            }
        }
    }
</script>
<template>
    <div class="upload_content" @click="$refs.fileRef.click()">
        <input type="file" ref="fileRef" class="upload_file" @change="handleFileChange">
        <div class="dragger" v-if="drag" ref="dragRef">
            <img class="upload_icon" src="../assets/up_load.png" alt="" srcset="">
            <div class="upload_text">将文件拖到此处，或<em>点击上传</em></div>
        </div>
        <div class="upload" v-else>
             <img class="upload_icon" src="../assets/add.png" alt="" srcset="">
        </div>

    </div>
</template>
<style lang="scss" scoped>
.upload_content{
    display: inline-block;
    position: relative;
    .upload_file{
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
    }
    .dragger{
        position: relative;
        background-color: #fff;
        border: 1px dashed #d9d9d9;
        border-radius: 6px;
        box-sizing: border-box;
        width: 360px;
        height: 180px;
        text-align: center;
        cursor: pointer;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        .upload_icon{
            width: 48px;
            height: 48px;
        }
        .upload_text{
            color: #606266;
            font-size: 14px;
            text-align: center;
            margin-top: 8px;
            em{
                color: #409eff;
                font-style: normal;
            }
        }
    }
    .upload{
        position: relative;
        background-color: #fbfdff;
        border: 1px dashed #c0ccda;
        border-radius: 6px;
        box-sizing: border-box;
        width: 148px;
        height: 148px;
        text-align: center;
        cursor: pointer;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        .upload_icon{
            width: 48px;
            height: 48px;
        }
    }
}
</style>