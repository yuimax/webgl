// s01: 背景の塗りつぶし

function s01_clearCanvas(backColor) {
	// my-canvas の描画コンテキスト
	const gl = myGL;

	// 画面クリア
	const { r, g, b } = backColor;
	gl.clearColor(r, g, b, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// 	FireFox ではクリア後になんらかの描画を実行しないと背景が塗りつぶされない
	// 	Chrome や Edge の場合は不要
	if (isFireFox()) {
		// 頂点シェーダー
		const vsSource = `#version 300 es
			void main() {
				gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
				gl_PointSize = 1.0;
			}
		`;

		// フラグメントシェーダー
		const fsSource = `#version 300 es
			precision mediump float;
			out vec4 vColor;
			void main() {
				vColor = vec4(${r}, ${g}, ${b}, 1.0);
			}
		`;

		// シェーダーを作成する
		const prog = myCreateProgram(gl, vsSource, fsSource);

		// 点を1つ描画する
		// メモ：
		//	gl.drawArrays() は、バッファからデータを読み込みつつ描画する命令だが、
		//	バッファがない場合、単に指定回数（今回なら1回）だけシェーダーを実行する
		gl.drawArrays(gl.POINTS, 0, 1);

		// シェーダーを解放する
		gl.deleteProgram(prog);
		gl.useProgram(null);
	}
}
