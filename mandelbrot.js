/*
	マンデルブロ集合(Worker利用)
	2023/12/01 ESモジュールに変更
	2020/10/27 新規作成
	
	skippable = true
	最後の処理だけ実施する(途中の処理は中断)
	
	skippable = false
	全ての処理を順番に実施する
*/

import Colorbar from "./Colorbar.js";
const cb = new Colorbar(0,64,[0x000000,0x6060ff,0xffffff,0xffff60,0x000000]);


const Thread = function(skippable){
	const worker = new Worker("./mandelbrot_worker.js");
	
	let lastId;
	
	this.set = function(id,jmin,jmax,width,m){
		lastId = id;
		
		const I = [];
		const J = [];

		for(let j=jmin; j<jmax; j++){
			for(let i=0; i<width; i++){
				I.push(i);
				J.push(j);
			}
		}
		
		const promise = new Promise(function(resolve,reject){
			
			const f = function(message){
				
				//postしたMessageに対応する結果以外は無視
				if(id != message.data.id) return;
				
				//最後の物だけ処置
				if(skippable && lastId != message.data.id) reject("中断");
				
				worker.removeEventListener("message",f);
				resolve(message.data);
			};
			
			worker.addEventListener("message",f);
			worker.postMessage({id,skippable,I,J,m});
		});
		
		return promise;
	};
};

const skippable = true;
const threads = [];
threads.push(new Thread(skippable));
threads.push(new Thread(skippable));
threads.push(new Thread(skippable));
threads.push(new Thread(skippable));
threads.push(new Thread(skippable));
threads.push(new Thread(skippable));
threads.push(new Thread(skippable));
threads.push(new Thread(skippable));

export default function(ctx,width,height){
	const id = Date.now();
	
	//IJ座標からXY座標への変換行列
	const m = ctx.getTransform().invertSelf();
	
	const dh = Math.floor(height / threads.length);
	
	const promises = threads.map(function(t,i){
		const jmax = i == threads.length-1 ? height : dh * (i + 1);
		return t.set(id,dh * i,jmax,width,m);
	});
	
	return Promise.all(promises).then(function(results){
		
		ctx.save();
		ctx.resetTransform();
		ctx.clearRect(0, 0, width, height);
		ctx.restore();
		
		const data = ctx.getImageData(0, 0, width, height);
		
		for(let r of results){
			for(let k=0; k<r.I.length; k++){

				const i = r.I[k];
				const j = r.J[k];

				const index = (i + j * width) * 4;
				
				const c = cb.get(r.Z[k] % 64);
				
				data.data[index] = c.r; // R
				data.data[index+1] = c.g; // G
				data.data[index+2] = c.b; // B
				data.data[index+3] = 255; // A
			}
		}
		
		ctx.putImageData(data, 0, 0);
	}).catch(function(reason){
		
		//console.log("skip");
	});
	
}