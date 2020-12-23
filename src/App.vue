<template>
  <div>
    <ChunksUpload
     drag
     :onUploadProgress="onUploadProgress"
     :onUploadSuccess="onUploadSuccess"
     checkFileUrl="/checkFile"
     uploadFileUrl="/uploadFile"
     merageFileUrl="/merageFile"
     :chunkSize="102400"
     />
     <div>
      <img :src="imageUrl" alt="" srcset="">
     </div>
  </div>
</template>

<script>
import ChunksUpload from '../packages/chunksUpload.vue'
export default {
    data(){
      return {
        imageUrl:''
      }
    },
    components:{
      ChunksUpload
    },
    methods:{
      onUploadProgress(progress){
        // console.log('progress;', progress);
      },
      onUploadSuccess(path){
        this.imageUrl = path
        console.log(path);
      }
    }
}
</script>

<style>

</style>