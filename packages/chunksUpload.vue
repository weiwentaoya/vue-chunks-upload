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
<script>
    import SparkMD5 from 'spark-md5';
    export default {
        name:'helloName',
        props:{
            drag:{
                type: Boolean,
                default: false
            },
            chunkSize:{
                type: Number,
                default: 1024*1024*0.1
            },
            /*
            *  区分计算hash的方法
            *  1:通过子线程worker计算
            *  2:通过浏览器的空闲时段计算，有兼容性 requestIdleCallback
            *  3：利用布隆过滤器方式计算
            */
            hashType:{
                type: Number,
                default: 0
            },
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
                this.chunks = chunks
                this.createHash()
            },
            createHash(){
                if (this.hashType === 1) {
                //    console.time('worker')
                   this.WorkerCreateHash().then(res=>{
                       console.log(res);
                       this.hash = res.hash
                   })
                //    console.timeEnd('worker')
                }else if(this.hashType === 2) {
                    // console.time('idle')
                    this.IdleCreateHash().then(res=>{
                       console.log(res);
                       this.hash = res.hash
                   })
                    // console.timeEnd('idle')
                }else{
                    // console.time('blond')
                    this.BlondCreateHash().then(res=>{
                       console.log(res);
                       this.hash = res.hash
                   })
                    // console.timeEnd('blond')
                }
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
                        appendToSpark(this.chunks[index]).then(res=>{
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
                    const chunks = [this.chunks.slice(0,this.chunkSize)]
                    let count = 1
                    while (count > this.chunks.length) {
                        chunks.push(this.chunks[count].slice(0,20))
                        count++
                    }
                    fileReader.readAsArrayBuffer(new Blob(chunks))
                    fileReader.onload=e=>{
                        spark.append(e.target.result)
                        resolve({hash:spark.end()})
                    }
                })
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