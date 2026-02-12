// s05: テクスチャの描画

function s05_drawTexture(backColor) {
	// my-canvas の描画コンテキスト
	const gl = myGL;

	// 頂点シェーダー
	const vsSource = `#version 300 es
		in vec4 aPosition;
		in vec2 aTexCoord;
		uniform mat4 uModelViewMatrix;
		uniform mat4 uProjectionMatrix;
		out vec2 vTexCoord;
		void main() {
			gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
			vTexCoord = aTexCoord;
		}
	`;

	// フラグメントシェーダー
	const fsSource = `#version 300 es
		precision mediump float;
		uniform sampler2D uTexture;
		in vec2 vTexCoord;
		out vec4 outColor;
		void main() {
			outColor = texture(uTexture, vTexCoord);
		}
	`;
	
	// シェーダーを作成する
	const prog = myCreateProgram(gl, vsSource, fsSource);

	// uniform 変数に matrix を割り当てる
	function setUniformMat4(name, matrix) {
		const loc = gl.getUniformLocation(prog, name);
		if (loc === null) {
			throw new Error(`シェーダーに変数がありません: ${name}`);
		}
		gl.uniformMatrix4fv(loc, false, matrix);
	}
	
	// カメラ視野角
	const projection_matrix = mat4.create();
	mat4.perspective(
		projection_matrix,		// out
		degree2radian(45),		// fieldOfView
		getAspect(gl.canvas),	// aspect
		0.1,					// zNear
		100.0					// zFar
	);
	setUniformMat4('uProjectionMatrix', projection_matrix);

	// モデルビュー
	const modelview_matrix = mat4.create();
	mat4.translate(
		modelview_matrix,
		modelview_matrix,
		[0.0, 0.0, -2.5]	// 計算では [0, 0, -2.414] で、半径1の円がキャンバスに内接する
	);
	setUniformMat4('uModelViewMatrix', modelview_matrix);

	// 正方形の頂点データ
	const vertex_data = new Float32Array([
	//     x,    y,    u,    v,
		-1.0,  1.0,  0.0,  0.0,	// 左上
		 1.0,  1.0,	 1.0,  0.0,	// 右上
		-1.0, -1.0,  0.0,  1.0,	// 左下
		 1.0, -1.0,  1.0,  1.0,	// 右下
	]);
	const vertex_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertex_data, gl.STATIC_DRAW);

	const all_step = 4;	// x, y, u, v
	const stride = all_step * Float32Array.BYTES_PER_ELEMENT;

	// バッファから aPosition に頂点座標 (x,y) を取り出す設定
	const pos_loc = gl.getAttribLocation(prog, 'aPosition');
	const pos_step = 2;	// x, y
	const pos_offset = 0;
	gl.vertexAttribPointer(
		pos_loc,	// aPositionのロケーション
		pos_step,	// 頂点あたりの要素数
		gl.FLOAT,	// 要素のデータ型
		false,		// 整数を正規化するか（gl.FLOATの場合は無意味）
		stride,		// 頂点あたりのバイトサイズ
		pos_offset	// 読み込み位置
	);
	gl.enableVertexAttribArray(pos_loc);

	// バッファから aTexCoord にテクスチャ座標 (u,v) を取り出す設定
	const tex_loc = gl.getAttribLocation(prog, 'aTexCoord');
	const tex_step = 2;	// u, v
	const tex_offset = pos_step * Float32Array.BYTES_PER_ELEMENT;
	gl.vertexAttribPointer(
		tex_loc,	// aTexCoordのロケーション
		tex_step,	// 頂点あたりの要素数
		gl.FLOAT,	// 要素のデータ型
		false,		// 整数を正規化するか（gl.FLOATの場合は無意味）
		stride,		// 頂点あたりのバイトサイズ
		tex_offset	// 読み込み位置
	);
	gl.enableVertexAttribArray(tex_loc);

	// テクスチャ画像の取得
	const texImage = myTexImages['tex/daisy.webp'];

	// テクスチャの作成
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(
		gl.TEXTURE_2D,		// これでよい
		0,					// ミップマップのレベル、0でよい
		gl.RGBA,			// GPU 側の画像フォーマット
		gl.RGBA,			// CPU 側の画像フォーマット
		gl.UNSIGNED_BYTE,	// R,G,B,A それぞれ 8 ビット
		texImage			// テクスチャ Image
	);

	// 補完方法の設定
	//
	//	NEAREST_MIPMAP_NEAREST	最も近いミップレベルの、最も近いピクセル
	//	LINEAR_MIPMAP_NEAREST	近い2つのミップレベルを補間、最も近いピクセル
	//	NEAREST_MIPMAP_LINEAR	最も近いミップレベルの、ピクセル補間
	//	LINEAR_MIPMAP_LINEAR	ミップマップ間もピクセル間も補完（最も滑らか）
	//
	gl.texParameteri(
		gl.TEXTURE_2D,				// 対象
		gl.TEXTURE_MIN_FILTER,		// 縮小時（拡大時はミップマップは無関係）
		gl.NEAREST_MIPMAP_LINEAR	// 補間方法
	);
	
	// ミップマップを生成する
	gl.generateMipmap(gl.TEXTURE_2D);

	// 透明度を有効にする
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	// 画面クリア
	const { r, g, b } = backColor;
	gl.clearColor(r, g, b, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// データを TRIANGLE_STRIP として描画する
	const vertex_count = Math.floor(vertex_data.length / all_step);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertex_count);

	// テクスチャを解放する
	gl.deleteTexture(texture);
	gl.bindTexture(gl.TEXTURE_2D, null);

	// バッファを解放する
	gl.disableVertexAttribArray(tex_loc);
	gl.disableVertexAttribArray(pos_loc);
	gl.deleteBuffer(vertex_buffer);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	// シェーダーを解放する
	gl.deleteProgram(prog);
	gl.useProgram(null);
}
