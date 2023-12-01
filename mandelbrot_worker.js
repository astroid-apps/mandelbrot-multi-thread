/*
	workerで順番に処理をする
	2020/11/06 新規作成
*/

//実行するキュー(関数の配列)
const queue = [];

//処理中かどうか
let processing = false;

//次のキューを実行する
const next = function(){
	
	if(queue.length == 0){
		processing = false;
		return;
	}
	
	processing = true;
	
	const q = queue.shift();
	
	if(q.skippable && queue.length > 0){
		self.postMessage({
			id: q.id,
		});
		next();
	}else{
		(q.q)();
	}
};

const md = function(x,y){
	let xn = 0;
	let yn = 0;
	
	for(let i=0; i<512; i++){
		const xn1 = xn * xn - yn * yn + x;
		const yn1 = 2 * xn * yn + y;
		xn = xn1;
		yn = yn1;
		
		if(xn * xn + yn * yn > 4) return i;
	}
	
	return 0;
};

self.addEventListener("message",function(message){
	
	const id = message.data.id;
	const skippable = message.data.skippable;
	
	const q = function(){
		
		const Z = [];
		const m = message.data.m;
		
		for(let k=0; k<message.data.I.length; k++){
			const x = m.a * message.data.I[k] + m.c * message.data.J[k] + m.e;
			const y = m.b * message.data.I[k] + m.d * message.data.J[k] + m.f;
			Z.push(md(x,y));
		}
		
		self.postMessage({
			I: message.data.I,
			J: message.data.J,
			Z,
			id,
		});
		
		next();
	};
	
	queue.push({id,q,skippable});
	
	if(processing == false) next();
});