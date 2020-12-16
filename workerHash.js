this.importScripts('spark-md5.min.js')
this.onmessage= e => {
    const {chunks} = e.data
    const spark = new this.SparkMD5.ArrayBuffer();
    let count = 0 
    const fileReader = new FileReader()
    const loadNext=index=>{
        fileReader.readAsArrayBuffer(chunks[index])
        fileReader.onload=e=>{
            count++
            spark.append(e.target.result)
            if (count == chunks.length) {
                this.postMessage({
                    hash:spark.end()
                })
            }else{
                // this.postMessage({
                //     index
                // })
                loadNext(count)
            }
        }
    }
    loadNext(count)
}