// s02: 平面図形の表示

function s02_drawShape(backColor) {
	// my-canvas の描画コンテキスト
	const gl = myGL;
	
	// 頂点シェーダー
	const vsSource = `#version 300 es
		in vec4 aPosition;
		in vec4 aColor;
		uniform mat4 uModelViewMatrix;
		uniform mat4 uProjectionMatrix;
		void main(void) {
			gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
		}
	`;

	// フラグメントシェーダー
	const fsSource = `#version 300 es
		precision mediump float;
		out vec4 vColor;
		void main(void) {
			vColor = vec4(1.0, 1.0, 1.0, 1.0);
		}
	`;

	// シェーダーを作成する
	const prog = myCreateProgram(gl, vsSource, fsSource);
	
	// カメラ視野角
	const projection_matrix = mat4.create();
	mat4.perspective(
		projection_matrix,
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

	// 正5角形の頂点データ（TRIANGLE_STRIP形式）
	const pos_data = new Float32Array([
	//  x座標,  y座標,	// 真上から左回りに A,B,C,D,E とする	
		0.000,  1.000,	// 90度  頂点A (上)
	   -0.951,  0.309,	// 162度 頂点B (左上)
		0.951,  0.309,	// 234度 頂点E (右上) 三角形A-B-E（正順）
	   -0.588, -0.809,	// 306度 頂点C (左下) 三角形B-C-E（B-E-Cの逆順）
		0.588, -0.809,	// 378度 頂点D (右下) 三角形E-C-D（正順）
	]);
	
	const pos_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, pos_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, pos_data, gl.STATIC_DRAW);

	const pos_step = 2;	// x, y
	const pos_loc = gl.getAttribLocation(prog, 'aPosition');
	gl.vertexAttribPointer(
		pos_loc,	// aPositionのロケーション
		pos_step,	// 頂点あたりの要素数
		gl.FLOAT,	// 要素のデータ型（g.FLOATは32ビット浮動小数点数）
		false,		// 整数データを正規化するか（gl.FLOATの場合は無意味）
		0,			// 頂点あたりのバイトサイズ、0だと自動計算
		0			// 読み込み位置
	);
	gl.enableVertexAttribArray(pos_loc);

	// 画面クリア
	const { r, g, b } = backColor;
	gl.clearColor(r, g, b, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// データを TRIANGLE_STRIP として描画する
	const vertex_count = Math.floor(pos_data.length / pos_step);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertex_count);

	// バッファを解放する
	gl.disableVertexAttribArray(pos_loc);
	gl.deleteBuffer(pos_buffer);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	// シェーダーを解放する
	gl.deleteProgram(prog);
    gl.useProgram(null);
}

function s02_test(s) {
	println("s02_test: " + s);
}

