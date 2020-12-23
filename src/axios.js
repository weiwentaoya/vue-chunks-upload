import Vue from 'vue'
import axios from 'axios';
const server = axios.create({
    baseURL: 'http://localhost:3000/api'
})

server.interceptors.response.use(
    response=>{
        return response.data
    }
)
Vue.prototype.$http = server

export const http = server