<template>
  <div>
    <ChunksUpload
      :onUploadProgress="onUploadProgress"
      :onUploadSuccess="onUploadSuccess"
      checkFileUrl="http://localhost:3000/api/checkFile"
      uploadFileUrl="http://localhost:3000/api/uploadFile"
      merageFileUrl="http://localhost:3000/api/merageFile"
      :chunkSize="102400"
    />
    <div>
      {{ Url }}
    </div>
  </div>
</template>

<script>
import ChunksUpload from "../packages/chunksUpload.vue";
export default {
  data() {
    return {
      Url: "",
    };
  },
  components: {
    ChunksUpload,
  },
  methods: {
    onUploadProgress(progress) {
      // console.log('progress;', progress);
    },
    onUploadSuccess(path) {
      this.Url = path;
      console.log(path);
    },
  },
};
</script>

<style>
</style>