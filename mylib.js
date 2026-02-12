// mylib.js

const textBox = myGetElement('textarea#text-box');
const panelBox = myGetElement('div#panel-box');
const myCanvas = myGetElement('canvas#my-canvas');

// HTML要素の取得
function myGetElement(selector) {
	const elem = document.querySelector(selector);
	if (elem == null) {
		const [tag, id] = selector.split('#');
		alert(`<${tag} id="${id}"> がありません\nHTML を見直してください\n`);
	}
	return elem;
}

// textBox をクリアする
function clear() {
	textBox.value = '';
}

// textBox に文字列を表示して改行する
function println(str) {
	textBox.value += str + '\n';
	textBox.scrollTop = textBox.scrollHeight;
}

// 実行中のブラウザが FireFox ならtrueを返す
function isFireFox() {
	return navigator.userAgent.toLowerCase().includes('firefox');
}

// 角度をラジアンに変換する
function degree2radian(deg) {
	return deg * Math.PI / 180;
}

// HTML要素のアスペクト比を得る
function getAspect(elem) {
	return elem.clientWidth / elem.clientHeight;
}

//=============================================================
// テクスチャ画像の作成
//
// メモ：
//	サーバー上のスクリプトなら、普通に画像ファイルからテクスチャを作ればよい
//	だがローカルPC上のスクリプトでは、セキュリティの問題で画像ファイルは使えない
//	解決策は、画像データを DataURL から読み込めばよい
//	DataURL は、あらかじめ maka-data-urls.py で作っておく
//
const myTexImages = {};
initTexImages();

// DataURL から Image を作り、myTexImages[] に登録する
// dataUrls[] に登録してあるキーは、現在のところ "1px", "tex/daisy.webp" の2つのみ
async function initTexImages() {
	for (const key in dataUrls) {
		try {
			myTexImages[key] = await new Promise(function(resolve, reject) {
				const img = new Image();
				img.onload = function() { resolve(img); };
				img.onerror = reject;
				img.src = dataUrls[key];
			});
			delete dataUrls[key];
		}
		catch {
			println(`画像データではありません: dataUrls["${key}"]`);
		}
	}
}

//=============================================================
// シェーダーの作成
// 使用後（または例外中断時）は、myDisposeProgram() で破棄する
//
const myGL = myCanvas.getContext('webgl2');	// WebGL 2.0
const myPrograms = [];

function myCreateProgram(gl, vsSource, fsSource) {

	// シェーダーコンパイル用の内部関数
    function createShader(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader); // 失敗したら即座に破棄
            throw new Error(`シェーダーコンパイル失敗: ${info}`);
        }
        return shader;
    }

	// 頂点シェーダーとフラグメントシェーダーをコンパイルする
    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);

	// シェーダーをリンクする
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

	// シェーダー削除用の内部関数
	function disposeShaders() {
		gl.detachShader(prog, vs);
		gl.detachShader(prog, fs);
		gl.deleteShader(vs);
		gl.deleteShader(fs);
	}

	// リンク失敗のチェック
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(prog);
		disposeShaders();
        gl.deleteProgram(prog);
        throw new Error(`リンク失敗: ${info}`);
    }

    // リンク成功後、シェーダーを detach して delete する
	// プログラム内にはバイナリとして残るが、プログラムを削除すると一緒に消える
	disposeShaders();
	
	// 利用開始
	gl.useProgram(prog);
	myPrograms.push(prog);
	return prog;
}

// シェーダープログラムを破棄する
function myDisposeAllProgram() {
	// my-canvas の描画コンテキスト
	const gl = myGL;

	// myPrograms[] に要素があれば削除
	while (myPrograms.length > 0)
		gl.deleteProgram(myPrograms.pop());

    // コンテキストのバインドも解除しておくと安全
    gl.useProgram(null);
}

// シェーダープログラムの uniform 変数に matrix を割り当てる
function mySetUniformMat4(gl, prog, name, matrix) {
	const loc = gl.getUniformLocation(prog, name);
	if (loc === null) {
		throw new Error(`シェーダーに変数がありません: ${name}`);
	}
	gl.uniformMatrix4fv(loc, false, matrix);
}


// シェーダープログラムを管理するクラス

class ShaderProgram {
	#gl;
	#program;
	#vs;
	#fs;

	constructor(gl, vsSource, fsSource) {
		this.#gl = gl;
		
		// シェーダーのコンパイル
		this.#vs = this.#compileShader(gl.VERTEX_SHADER, vsSource);
		this.#fs = this.#compileShader(gl.FRAGMENT_SHADER, fsSource);

		// プログラムの作成とリンク
		this.#program = gl.createProgram();
		gl.attachShader(this.#program, this.#vs);
		gl.attachShader(this.#program, this.#fs);
		gl.linkProgram(this.#program);

		if (!gl.getProgramParameter(this.#program, gl.LINK_STATUS)) {
			const info = gl.getProgramInfoLog(this.#program);
			throw new Error(`プログラムのリンクに失敗: ${info}`);
		}
		println("ShaderProgram created.");
	}

	get program() {
		return this.#program;
	}

	// ヘルパー：シェーダーのコンパイル
	#compileShader(type, source) {
		const gl = this.#gl;
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			const info = gl.getShaderInfoLog(shader);
			gl.deleteShader(shader);
			throw new Error('シェーダーのコンパイルに失敗: ' + info);
		}
		return shader;
	}

	// 明示的なリソース解放
	[Symbol.dispose]() {
		if (this.#program) {
			const gl = this.#gl;
			gl.deleteProgram(this.#program);
			gl.deleteShader(this.#vs);
			gl.deleteShader(this.#fs);
			this.#program = null;
			this.#vs = null;
			this.#fs = null;
			println("ShaderProgram deleted.");
		}
	}
}
