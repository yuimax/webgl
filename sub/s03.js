// s03: 平面図形のカラー表示

function s03_drawColorShape(backColor) {
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

	// 正六角形の頂点データ（TRIANGLE_STRIP形式）
	const pos_data = new Float32Array([
	//  x座標,  y座標,	// 真上から左回りに A,B,C,D,E,F とする	
		 0.000,  1.000,	// 90度  頂点A (上)
		-0.866,  0.500,	// 150度 頂点B (左上)
		 0.866,  0.500,	// 30度  頂点F (右上)	三角形A-B-F
		-0.866,	-0.500,	// 210度 頂点C (左下)	三角形C-F-B (逆順)
		 0.866, -0.500,	// 330度 頂点E (右下)	三角形F-C-E
		 0.000,	-1.000,	// 270度 頂点D (下)		三角形D-E-C (逆順)
	]);
	const pos_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, pos_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, pos_data, gl.STATIC_DRAW);

	const pos_loc = gl.getAttribLocation(prog, 'aPosition');
	const pos_step = 2;	// x, y
	gl.vertexAttribPointer(
		pos_loc,	// aPositionのロケーション
		pos_step,	// 頂点あたりの要素数
		gl.FLOAT,	// 要素のデータ型
		false,		// 整数を正規化するか（gl.FLOATの場合は無意味）
		0,			// 頂点あたりのバイトサイズ、0だと自動計算
		0			// 読み込み位置
	);
	gl.enableVertexAttribArray(pos_loc);

	// 頂点ごとの色データ
	const col_data = new Float32Array([
	//	R,	G,	B,	A,	// 真上から左回りに A,B,C,D,E とする	
		1,	0,	0,	1,	// 赤:	90度  頂点A (上)
		1,	1,	0,	1,	// 黄:	150度 頂点B (左上)
		1,	0,	1,	1,	// 紫:	30度  頂点F (右上)
		0,	1,	0,	1,	// 緑:	210度 頂点C (左下)
		0,	0,	1,	1,	// 青:	330度 頂点E (右下)
		0,	1,	1,	1,	// 水:	270度 頂点D (下)
	]);
	const col_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, col_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, col_data, gl.STATIC_DRAW);
	
	const col_loc = gl.getAttribLocation(prog, 'aColor');
	const col_step = 4;	// R, G, B, A
	gl.vertexAttribPointer(
		col_loc,	// aColorのロケーション
		col_step,	// 頂点あたりの要素数
		gl.FLOAT,	// 要素のデータ型
		false,		// 整数を正規化するか（gl.FLOATの場合は無意味）
		0,			// 頂点あたりのバイトサイズ、0だと自動計算
		0			// 読み込み位置
	);
	gl.enableVertexAttribArray(col_loc);

	// 画面クリア
	const { r, g, b } = backColor;
	gl.clearColor(r, g, b, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// データを TRIANGLE_STRIP として描画する
	const vertex_count = Math.floor(pos_data.length / pos_step);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertex_count);

	// バッファを解放する
	gl.disableVertexAttribArray(col_loc);
	gl.disableVertexAttribArray(pos_loc);
	gl.deleteBuffer(col_buffer);
	gl.deleteBuffer(pos_buffer);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	// シェーダーを解放する
	gl.deleteProgram(prog);
    gl.useProgram(null);
}
