import sparkMD5 from 'spark-md5';
export const WorkerCreateHash = chunks=>{
    return new Promise(resolve=>{
        const worker = new Worker('/workerHash.js');
        worker.postMessage({chunks:chunks})
        worker.onmessage=e=>{
            console.log(e.data);
            
        }
    })
    
}