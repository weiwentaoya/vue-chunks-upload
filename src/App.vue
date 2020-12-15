<template>
  <div>
    {{initData}}
    <ChunksUpload :propData='initData'/>
  </div>
</template>

<script>
import ChunksUpload from '../components/chunksUpload.vue'
export default {
    data(){
      return {
        initData: 'hello 你好'
      }
    },
    components:{
      ChunksUpload
    }
}
</script>

<style>

</style>