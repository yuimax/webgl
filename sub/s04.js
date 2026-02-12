// s04: 平面図形のカラー表示2

function s04_drawColorShape2(backColor) {
	// my-canvas の描画コンテキスト
	const gl = myGL;
	
	// 頂点シェーダー
	const vsSource = `#version 300 es
		in vec4 aPosition;
		in vec4 aColor;
		uniform mat4 uModelViewMatrix;
		uniform mat4 uProjectionMatrix;
		out vec4 vColor;
		void main(void) {
			gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
			vColor = aColor;
		}
	`;

	// フラグメントシェーダー
	const fsSource = `#version 300 es
		precision mediump float;
		in vec4 vColor;
		out vec4 outColor;
		void main(void) {
			outColor = vColor;
		}
	`;

	// シェーダーを作成する
	const prog = myCreateProgram(gl, vsSource, fsSource);

	// カメラ視野角
	const projection_matrix = mat4.create();
	mat4.perspective(
		projection_matrix,		// out
		degree2radian(45),		// fieldOfView
		getAspect(gl.canvas),	// aspect
		0.1,					// zNear
		100.0					// zFar
	);
	mySetUniformMat4(gl, prog, 'uProjectionMatrix', projection_matrix);

	// モデルビュー
	const modelview_matrix = mat4.create();
	mat4.translate(
		modelview_matrix,
		modelview_matrix,
		[0.0, 0.0, -4.0]
	);
	mySetUniformMat4(gl, prog, 'uModelViewMatrix', modelview_matrix);

	// 正七角形の頂点データ（TRIANGLE_FAN 形式）
	// 6要素に x,y と R,G,B,A を併記（interleave 方式）
	const vertex_data = new Float32Array([
	//  x座標,  y座標,	R, G, B, A,
		 0.000,	 0.000,.4,.4,.4, 1,	// 灰:   中心点
		 0.000,  1.000, 1, 0, 0, 1, // 赤:    90.0度 頂点A
		-0.782,  0.623, 1, 1, 0, 1, // 黄:   141.4度 頂点B
		-0.975, -0.223, 0, 1, 0, 1, // 緑:   192.9度 頂点C
		-0.434, -0.901, 0, 1, 1, 1, // 水:   244.3度 頂点D
		 0.434, -0.901, 0, 0, 1, 1, // 青:   295.7度 頂点E
		 0.975, -0.223,.5, 0, 1, 1,	// 青紫: 347.1度 頂点F
		 0.782,  0.623, 1, 0, 1, 1, // 紫:    38.6度 頂点G
		 0.000,  1.000, 1, 0, 0, 1, // 赤:    90.0度 頂点Aに戻る
	]);
	const vertex_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertex_data, gl.STATIC_DRAW);

	const all_step = 6;	// x, y, R, G, B, A
	const stride = all_step * Float32Array.BYTES_PER_ELEMENT;

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

	const col_loc = gl.getAttribLocation(prog, 'aColor');
	const col_step = 4;	// R, G, B, A
	const col_offset = pos_step * Float32Array.BYTES_PER_ELEMENT;
	gl.vertexAttribPointer(
		col_loc,	// aColorのロケーション
		col_step,	// 頂点あたりの要素数
		gl.FLOAT,	// 要素のデータ型
		false,		// 整数を正規化するか（gl.FLOATの場合は無意味）
		stride,		// 頂点あたりのバイトサイズ
		col_offset	// 読み込み位置
	);
	gl.enableVertexAttribArray(col_loc);

	// 画面クリア
	const { r, g, b } = backColor;
	gl.clearColor(r, g, b, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// データを TRIANGLE_FAN として描画する
	const vertex_count = Math.floor(vertex_data.length / all_step);
	gl.drawArrays(gl.TRIANGLE_FAN, 0, vertex_count);

	// バッファを解放する
	gl.disableVertexAttribArray(col_loc);
	gl.disableVertexAttribArray(pos_loc);
	gl.deleteBuffer(vertex_buffer);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	// シェーダーを解放する
	gl.deleteProgram(prog);
    gl.useProgram(null);
}
