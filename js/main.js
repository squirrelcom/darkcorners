if (!Detector.webgl) {
	Detector.addGetWebGLMessage();
	document.getElementById('container').innerHTML = "";
}

var fogExp2 = true;
var container, stats;
var camera, controls, scene, renderer;
var mesh, mat;
var worldWidth = 50, worldDepth = 50,
worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2,
data = generateHeight(worldWidth, worldDepth);

var clock = new THREE.Clock();

init();
animate();

function init() {
	container = document.getElementById('container');

	camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 20000);
	camera.position.y = getY(worldHalfWidth, worldHalfDepth) * 100 + 100;

	controls = new THREE.FirstPersonControls(camera);
	controls.movementSpeed = 1000;
	controls.lookSpeed = 0.125;
	controls.lookVertical = true;
	controls.constrainVertical = true;
	controls.verticalMin = 1.1;
	controls.verticalMax = 2.2;

	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0xffffff, 0.00015);

	var debug_texture = false,
		debug_numbers = false,
		debug_corner_colors = false,
		strength = 4,
		textures = {
			side: '../assets/textures/wall.jpg',
			top: '../assets/textures/floor.jpg',
			bottom: '../assets/textures/floor.jpg'
		},
		mat   = generateMegamaterialAO(textures, strength, debug_texture, debug_numbers, debug_corner_colors),
		materials = [mat, mat, mat, mat, mat, mat];

	var i, j, x, z, h, h2, uv,
		px, nx, pz, nz, sides,
		right, left, bottom, top,
		nright, nleft, nback, nfront,
		nleftup, nrightup, nbackup, nfrontup,
		nrb, nrf, nlb, nlf,
		nrbup, nrfup,
		face_px, face_nx, face_py, face_ny, face_pz, face_nz,
		ti, ri, li, bi, fi, ci, mi, mm, column, row,
		cube,
		unit = 1/16 * 0.95, padding = 1/16 * 0.025, p, s, t, hash, N = -1,
		// map of UV indices for faces of partially defined cubes
		uv_index_map = {
			0:	{ nx: N, px: N, py: 0, ny: N, pz: N, nz: N },
			1:	{ nx: N, px: N, py: 0, ny: N, pz: N, nz: 1 },
			2:	{ nx: N, px: N, py: 0, ny: N, pz: 1, nz: N },
			3:	{ nx: N, px: N, py: 0, ny: N, pz: 1, nz: 2 },
			4:	{ nx: N, px: 0, py: 1, ny: N, pz: N, nz: N },
			5:	{ nx: N, px: 0, py: 1, ny: N, pz: N, nz: 2 },
			6:	{ nx: N, px: 0, py: 1, ny: N, pz: 2, nz: N },
			7:	{ nx: N, px: 0, py: 1, ny: N, pz: 2, nz: 3 },
			8:	{ nx: 0, px: N, py: 1, ny: N, pz: N, nz: N },
			9:	{ nx: 0, px: N, py: 1, ny: N, pz: N, nz: 2 },
			10:	{ nx: 0, px: N, py: 1, ny: N, pz: 2, nz: N },
			11:	{ nx: 0, px: N, py: 1, ny: N, pz: 2, nz: 3 },
			12:	{ nx: 0, px: 1, py: 2, ny: N, pz: N, nz: N },
			13:	{ nx: 0, px: 1, py: 2, ny: N, pz: N, nz: 3 },
			14:	{ nx: 0, px: 1, py: 2, ny: N, pz: 3, nz: N },
			15:	{ nx: 0, px: 1, py: 2, ny: N, pz: 3, nz: 4 }
		},
		// all possible combinations of corners and sides
		// mapped to mixed tiles
		//  (including corners overlapping sides)
		//  (excluding corner alone and sides alone)
		// looks ugly, but allows to squeeze all
		// combinations for one texture into just 3 rows
		// instead of 16
		mixmap = {
			"1_1":  0,
			"1_3":  0,
			"1_9":  0,
			"1_11": 0,

			"1_4":  1,
			"1_6":  1,
			"1_12": 1,
			"1_14": 1,

			"2_2":  2,
			"2_3":  2,
			"2_6":  2,
			"2_7":  2,

			"2_8":  3,
			"2_9":  3,
			"2_12": 3,
			"2_13": 3,

			"4_1":  4,
			"4_5":  4,
			"4_9":  4,
			"4_13": 4,

			"4_2":  5,
			"4_6":  5,
			"4_10": 5,
			"4_14": 5,

			"8_4":  6,
			"8_5":  6,
			"8_6":  6,
			"8_7":  6,

			"8_8":  7,
			"8_9":  7,
			"8_10": 7,
			"8_11": 7,

			"1_5":  8,
			"1_7":  8,
			"1_13": 8,
			"1_15": 8,

			"2_10": 9,
			"2_11": 9,
			"2_14": 9,
			"2_15": 9,

			"4_3":  10,
			"4_7":  10,
			"4_11": 10,
			"4_15": 10,

			"8_12": 11,
			"8_13": 11,
			"8_14": 11,
			"8_15": 11,

			"5_1":  12,
			"5_3":  12,
			"5_7":  12,
			"5_9":  12,
			"5_11": 12,
			"5_13": 12,
			"5_15": 12,

			"6_2":  13,
			"6_3":  13,
			"6_6":  13,
			"6_7":  13,
			"6_10": 13,
			"6_11": 13,
			"6_14": 13,
			"6_15": 13,

			"9_4":  14,
			"9_5":  14,
			"9_6":  14,
			"9_7":  14,
			"9_12": 14,
			"9_13": 14,
			"9_14": 14,
			"9_15": 14,

			"10_8":  15,
			"10_9":  15,
			"10_10": 15,
			"10_11": 15,
			"10_12": 15,
			"10_13": 15,
			"10_14": 15,
			"10_15": 15
		},

		tilemap = {},
		top_row_corners = 0,
		top_row_mixed = 1,
		top_row_sides = 2,
		sides_row = 3,
		bottom_row = 4,
		geometry = new THREE.Geometry();

	// mapping from 256 possible corners + sides combinations
	// into 3 x 16 tiles
	for (i = 0; i < 16; i++) {
		for (j = 0; j < 16; j++) {
			mm = i + "_" + j;
			if (i == 0)
				row = top_row_corners;
			else if (mixmap[mm] != undefined)
				row = top_row_mixed;
			else
				row = top_row_sides;
			tilemap[mm] = row;
		}
	}

	function setUVTile(face, s, t) {
		var j, uv = cube.faceVertexUvs[0][face];
		for (j = 0; j < uv.length; j++) {
			uv[j].u += s * (unit+2*padding);
			uv[j].v += t * (unit+2*padding);
		}
	}

	for (z = 0; z < worldDepth; z ++) {
		for (x = 0; x < worldWidth; x ++) {
			h = getY(x, z);

			// direct neighbors
			h2 = getY(x - 1, z);
			nleft = h2 == h || h2 == h + 1;
			h2 = getY(x + 1, z);
			nright = h2 == h || h2 == h + 1;
			h2 = getY(x, z + 1);
			nback = h2 == h || h2 == h + 1;
			h2 = getY(x, z - 1);
			nfront = h2 == h || h2 == h + 1;

			// corner neighbors
			nrb = getY(x - 1, z + 1) == h && x > 0 && z < worldDepth - 1 ? 1 : 0;
			nrf = getY(x - 1, z - 1) == h && x > 0 && z > 0 ? 1 : 0;
			nlb = getY(x + 1, z + 1) == h && x < worldWidth - 1 && z < worldDepth - 1 ? 1 : 0;
			nlf = getY(x + 1, z - 1) == h && x < worldWidth - 1 && z > 0 ? 1 : 0;

			// up neighbors
			nleftup  = getY(x - 1, z) > h && x > 0 ? 1 : 0;
			nrightup = getY(x + 1, z) > h && x < worldWidth - 1 ? 1 : 0;
			nbackup  = getY(x, z + 1) > h && z < worldDepth - 1 ? 1 : 0;
			nfrontup = getY(x, z - 1) > h && z > 0 ? 1 : 0;

			// up corner neighbors
			nrbup = getY(x - 1, z + 1) > h && x > 0 && z < worldDepth - 1 ? 1 : 0;
			nrfup = getY(x - 1, z - 1) > h && x > 0 && z > 0 ? 1 : 0;
			nlbup = getY(x + 1, z + 1) > h && x < worldWidth - 1 && z < worldDepth - 1 ? 1 : 0;
			nlfup = getY(x + 1, z - 1) > h && x < worldWidth - 1 && z > 0 ? 1 : 0;

			// textures
			ti = nleftup * 8 + nrightup * 4 + nfrontup * 2 + nbackup * 1;
			ri = nrf * 8 + nrb * 4 + 1;
			li = nlb * 8 + nlf * 4 + 1;
			bi = nrb * 8 + nlb * 4 + 1;
			fi = nlf * 8 + nrf * 4 + 1;
			ci = nlbup * 8 + nlfup * 4 + nrbup * 2 + nrfup * 1;

			// cube sides
			px = nx = pz = nz = 0;
			px = !nright || x == 0 ? 1 : 0;
			nx = !nleft  || x == worldWidth - 1 ? 1 : 0;
			pz = !nback  || z == worldDepth - 1 ? 1 : 0;
			nz = !nfront || z == 0 ? 1 : 0;
			sides = { px: px, nx: nx, py: true, ny: false, pz: pz, nz: nz };

			cube = new THREE.CubeGeometry(100, 100, 100, 1, 1, 1, materials, sides);

			// revert back to old flipped UVs
			for (i = 0; i < cube.faceVertexUvs[0].length; i++) {
				uv = cube.faceVertexUvs[0][i];
				for (j = 0; j < uv.length; j++) {
					uv[j].v = 1 - uv[j].v;
				}
			}

			// set UV tiles
			for (i = 0; i < cube.faceVertexUvs[0].length; i++) {
				uv = cube.faceVertexUvs[0][i];
				for (j = 0; j < uv.length; j++) {
					p = uv[j].u == 0 ? padding : -padding;
					uv[j].u = uv[j].u * unit + p;
					p = uv[j].v == 0 ? padding : -padding;
					uv[j].v = uv[j].v * unit + p;
				}
			}

			hash = px * 8 + nx * 4 + pz * 2 + nz;

			face_px = uv_index_map[hash].px;
			face_nx = uv_index_map[hash].nx;
			face_py = uv_index_map[hash].py;
			face_ny = uv_index_map[hash].ny;
			face_pz = uv_index_map[hash].pz;
			face_nz = uv_index_map[hash].nz;

			if (face_px != N) setUVTile(face_px, ri, sides_row);
			if (face_nx != N) setUVTile(face_nx, li, sides_row);

			if (face_py != N) {
				mm = ti + "_" + ci;
				switch (tilemap[mm]) {
					case top_row_sides:   column = ti; break;
					case top_row_corners: column = ci; break;
					case top_row_mixed:   column = mixmap[mm]; break;
				}
				setUVTile(face_py, column, tilemap[mm]);
			}
			if (face_ny != N) setUVTile(face_ny, 0, bottom_row);
			if (face_pz != N) setUVTile(face_pz, bi, sides_row);
			if (face_nz != N) setUVTile(face_nz, fi, sides_row);

			mesh = new THREE.Mesh(cube);
			mesh.position.x = x * 100 - worldHalfWidth * 100;
			mesh.position.y = h * 100;
			mesh.position.z = z * 100 - worldHalfDepth * 100;
			THREE.GeometryUtils.merge(geometry, mesh);
		}
	}

	mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial());
	scene.add(mesh);

	var ambientLight = new THREE.AmbientLight(0xcccccc);
	scene.add(ambientLight);

	var directionalLight = new THREE.DirectionalLight(0xffffff, 2);
	directionalLight.position.set(1, 1, 0.5).normalize();
	scene.add(directionalLight);

	renderer = new THREE.WebGLRenderer({ clearColor: 0xffffff });
	renderer.setSize(window.innerWidth, window.innerHeight);

	container.innerHTML = "";

	container.appendChild(renderer.domElement);

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild(stats.domElement);

	window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	controls.handleResize();
}

function generateMegamaterialAO(textures, strength, debug_texture, debug_numbers, debug_corner_colors ) {
	var count = 0,
		tex_side   = loadTexture(textures.side,   function() { count++; generateTexture() }),
		tex_top    = loadTexture(textures.top,    function() { count++; generateTexture() }),
		tex_bottom = loadTexture(textures.bottom, function() { count++; generateTexture() }),
		canvas = document.createElement('canvas'),
		ctx = canvas.getContext('2d'),
		size = 2048, tile = 128;

	canvas.width = canvas.height = size;

	var texture = new THREE.Texture(canvas, new THREE.UVMapping(), THREE.RepeatWrapping, THREE.RepeatWrapping, THREE.LinearFilter, THREE.LinearMipMapLinearFilter);
	texture.flipY = false;

	function generateTexture() {
		if (count == 3) {
			for (var i = 0; i < 16; i++) {
				drawAOCorners(ctx, tex_top,    0, i, i, tile, strength, debug_texture, debug_numbers, debug_corner_colors);
				drawAOMixed  (ctx, tex_top,    1, i, i, tile, strength, debug_texture, debug_numbers, debug_corner_colors);
				drawAOSides  (ctx, tex_top,    2, i, i, tile, strength, debug_texture, debug_numbers);
				drawAOSides  (ctx, tex_side,   3, i, i, tile, strength, debug_texture, debug_numbers);
				drawAOSides  (ctx, tex_bottom, 4, i, i, tile, strength, debug_texture, debug_numbers);
			}
			texture.needsUpdate = true;
		}
	}

	return new THREE.MeshLambertMaterial({ map: texture, ambient: 0xbbbbbb });
}

function generateMegamaterialPlain(textures) {
	var count = 0,
		tex_side   = loadTexture(textures.side,   function() { count++; generateTexture() }),
		tex_top    = loadTexture(textures.top,    function() { count++; generateTexture() }),
		tex_bottom = loadTexture(textures.bottom, function() { count++; generateTexture() }),
		canvas = document.createElement('canvas'),
		ctx = canvas.getContext('2d'),
		size = 256, tile = 16;

	canvas.width = canvas.height = size;

	var texture = new THREE.Texture(canvas, new THREE.UVMapping(), THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.LinearMipMapLinearFilter);
	texture.flipY = false;

	function generateTexture() {
		if (count == 3) {
			var i, sx;
			for (i = 0; i < 16; i++) {
				sx = i * tile;
				drawBase(ctx, tex_top,    sx, 0 * tile, tile, false);
				drawBase(ctx, tex_top,    sx, 1 * tile, tile, false);
				drawBase(ctx, tex_top,    sx, 2 * tile, tile, false);
				drawBase(ctx, tex_side,   sx, 3 * tile, tile, false);
				drawBase(ctx, tex_bottom, sx, 4 * tile, tile, false);
			}
			texture.needsUpdate = true;
		}
	}
	return new THREE.MeshLambertMaterial({ map: texture });
}

function drawHex(ctx, n, x, y) {
	ctx.fillStyle = "black";
	ctx.font = "8pt arial";
	ctx.textBaseline = "top";
	var s = n.toString(16);
	s = n < 16 ? "0" + s : s;
	ctx.fillText(s, x, y);
}

function drawBase(ctx, image, sx, sy, tile, debug_texture) {
	if (debug_texture) {
		ctx.fillStyle = "#888";
		ctx.fillRect(sx, sy, tile, tile);
	} else {
		ctx.drawImage(image, sx, sy, tile, tile);
	}
}

function drawCorner(ctx, sx, sy, sa, ea, color, step, n) {
	for (var i = 0; i < n; i++) {
		ctx.strokeStyle = color + step * (n - i) + ")";
		ctx.beginPath();
		ctx.arc(sx, sy, i, sa, ea, 0) ;
		ctx.stroke();
	}
}

function drawSide(ctx, sx, sy, a, b, n, width, height, color, step) {
	for (var i = 0; i < n; i++) {
		ctx.fillStyle = color + step * (n - i) + ")";
		ctx.fillRect(sx + a * i, sy + b * i, width, height);
	}
}

function drawAOSides(ctx, image, row, column, sides, tile, strength, debug_texture, debug_numbers) {
	var sx = column * tile, sy = row * tile;
	drawBase(ctx, image, sx, sy, tile, debug_texture);
	drawAOSidesImp(ctx, image, row, column, sides, tile, strength);
	if (debug_numbers) drawHex(ctx, row * tile + sides, sx + 2, sy + 2);
}

function drawAOCorners(ctx, image, row, column, corners, tile, strength, debug_texture, debug_numbers, debug_corner_colors) {
	var sx = column * tile, sy = row * tile;
	drawBase(ctx, image, sx, sy, tile, debug_texture);
	drawAOCornersImp(ctx, image, row, column, corners, tile, strength, debug_corner_colors);
	if (debug_numbers) drawHex(ctx, row * tile + corners, sx + 2, sy + 2);
}

function drawAOMixed(ctx, image, row, column, elements, tile, strength, debug_texture, debug_numbers, debug_corner_colors) {
	var sx = column * tile, sy = row * tile,
		mmap = {
			0:  [1, 1],
			1:  [1, 4],
			2:  [2, 2],
			3:  [2, 8],
			4:  [4, 1],
			5:  [4, 2],
			6:  [8, 4],
			7:  [8, 8],
			8:  [1, 5],
			9:  [2, 10],
			10: [4, 3],
			11: [8, 12],
			12: [5, 1],
			13: [6, 2],
			14: [9, 4],
			15: [10, 8]
		};

	drawBase(ctx, image, sx, sy, tile, debug_texture);
	drawAOCornersImp(ctx, image, row, column, mmap[elements][1], tile, strength, debug_corner_colors);
	drawAOSidesImp(ctx, image, row, column, mmap[elements][0], tile, strength);
	if (debug_numbers) drawHex(ctx, row * tile + elements, sx + 2, sy + 2);
}

function drawAOSidesImp(ctx, image, row, column, sides, tile, strength) {
	var sx = column * tile, sy = row * tile,
		full = tile, step = 1 / full, half = full / 2 + strength,
		color = "rgba(0, 0, 0, ",
		left   = (sides & 8) == 8,
		right  = (sides & 4) == 4,
		bottom = (sides & 2) == 2,
		top    = (sides & 1) == 1;

	if (bottom) drawSide(ctx, sx, sy, 0, 1, half, tile, 1, color, step);
	if (top)    drawSide(ctx, sx, sy + full - 1, 0, -1, half, tile, 1, color, step);
	if (left)   drawSide(ctx, sx, sy, 1, 0, half, 1, tile, color, step);
	if (right)  drawSide(ctx, sx + full - 1, sy, -1, 0, half, 1, tile, color, step);
}

function drawAOCornersImp(ctx, image, row, column, corners, tile, strength, debug_corner_colors) {
	var sx = column * tile, sy = row * tile,
		full = tile, step = 1 / full, half = full / 2 + strength,
		color = "rgba(0, 0, 0, ",
		bottomright = (corners & 8) == 8,
		topright    = (corners & 4) == 4,
		bottomleft  = (corners & 2) == 2,
		topleft     = (corners & 1) == 1;

	if (topleft) {
		if (debug_corner_colors) color = "rgba(200, 0, 0, ";
		drawCorner(ctx, sx, sy, 0, Math.PI / 2 , color, step, half);
	}

	if (bottomleft) {
		if (debug_corner_colors) color = "rgba(0, 200, 0, ";
		drawCorner(ctx, sx, sy + full, 1.5 * Math.PI, 2 * Math.PI, color, step, half);
	}

	if (bottomright) {
		if (debug_corner_colors) color = "rgba(0, 0, 200, ";
		drawCorner(ctx, sx + full, sy + full, Math.PI, 1.5 * Math.PI, color, step, half);
	}

	if (topright) {
		if (debug_corner_colors) color = "rgba(200, 0, 200, ";
		drawCorner(ctx, sx + full, sy, Math.PI / 2, Math.PI, color, step, half);
	}
}

function loadTexture(path, callback) {
	var image = new Image();
	image.onload = function () { callback(); };
	image.src = path;
	return image;
}

function generateHeight(width, height) {
	var data = [], size = width * height;
	for (var i = 0; i < size; i++) {
		var x = i % width, y = ~~ (i / width);
		data[i] = Math.random() > 0.5 ? 1 : 0;
	}
	return data;
}

function getY(x, z) {
	return ~~(data[x + z * worldWidth]);
}

//

function animate() {
	requestAnimationFrame(animate);
	render();
	stats.update();
}

function render() {
	controls.update(clock.getDelta());
	renderer.render(scene, camera);
}
