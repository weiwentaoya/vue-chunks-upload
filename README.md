# vue-chunks-upload

> 文件切片断点续传功能

## description

```html
1.通过chunkSize将文件切成多个chunk
2.通过不同的计算方式计算文件的hash（可通过实际场景选择不同的计算方式，不同的计算方式会有不同的计算错误率，和不同的时效性）
3.检查是否已经上传过，后段返回已上传碎片name属性
4.过滤已上传碎片，上传未上传的文件碎片
5.控制上传并发量（如果文件过大，可能会同时发起上百个请求）
6.上传完成发送请求，后段合并文件碎片，返回文件地址
```



## Demo

GitHub <https://github.com/weiwentaoya/vue-chunks-upload>

```js
yarn dev
// &&
cd serve && yarn dev
//server 目录为简易实现的上传接口（node），仅供参考
```

## Installation

```js
yarn add vue-chunks-upload
// or 
npm i vue-chunks-upload
```

## Usage

register globally

```js
 //in main.js
 import VueChunksUpload from 'vue-chunks-upload';
 Vue.component('vue-chunks-upload', VueChunksUpload);
```

or import locally

```vue
	<template>	
		<div>
			<dynamic-marquee> </dynamic-marquee>
		</div>
	</template>

	<script>
	import VueChunksUpload from 'vue-chunks-upload';
	</script>
```

## Props

| Prop             | Type     | required | Default | Explanation                                                  |
| ---------------- | -------- | -------- | ------- | ------------------------------------------------------------ |
| checkFileUrl     | string   | true     |         | 检查已上传切片地址                                           |
| uploadFileUrl    | string   | true     |         | 上传切片地址                                                 |
| merageFileUrl    | string   | true     |         | 合并切片地址                                                 |
| onUploadProgress | function | true     |         | 获取上传进度方法                                             |
| onUploadSuccess  | function | true     |         | 上传成功获取上传地址方法                                     |
| onUploadError    | function | false     |         | 上传失败方法  
| limit            | number   | false    | 3       | 控制上传并发数量(一次发送几个请求)                           |
| hashType         | number   | false    | 0       | 区分计算hash的方法。0：利用布隆过滤器方式计算，1:通过子线程worker计算2:通过浏览器的空闲时段计算（requestIdleCallback） |
| chunkSize        | number   | false    | 102400  | 每个文件切片大小（建议为整数）                               |
| drag             | boolean  | false    | false   | 是否开启拖拽上传                                             |

