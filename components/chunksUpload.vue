<template>
    <div class="helloName">
        <input type="text" placeholder="请输入姓名" v-model="name"></input>
        <div v-if="name">你好啊<span class="name">{{name}}!</span></div>
    </div>
</template>
<script>
    export default {
        name:'helloName',
        data () {
            return {
                name: ''
            }
        },
        methods: {

        },
        created(){
        }
    }
</script>
<style>
</style>