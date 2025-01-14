import * as THREE from 'three'
import { Vector3 } from 'three';
//import { OrbitControls } from "https://threejs.org/examples/jsm/controls/OrbitControls.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
// import { test222 } from './test';

export class ScatterPlot3Dviewer extends DG.JsViewer {
	constructor() {

		super();
		console.log("THREE REVISION ", THREE.REVISION);
		// test222();
		this.look = {};
		function hName() {
	//		console.log('hName hit!')
		}
		this.new = true;
		this.time0 = Date.now();
		this.time1 = this.time0 + 1;
		this.time00 = Date.now();
		this.localSubs = [];
 
		this.sizeMin = .1;
		this.sizeMax = 2;
		
		this.xColumnName = this.string('xColumnName');
		this.yColumnName = this.string('yColumnName');
		this.zColumnName = this.string('zColumnName');

		this.sizeColumnName = this.string('sizeColumnName');
		this.colorColumnName = this.string('colorColumnName');

		//this.filteredRowsColor = this.string('filteredRowsColor', "0x1f77b4", {choices: ["0xff00ff", '0xff0000', '0x00ff00']});
		this.filteredRowsColor = this.string('filteredRowsColor', "0x1f77b4");
		this.backColor = this.string('backColor', "0xffffff");
		this.filteredOutRowsColor = this.string('filteredOutRowsColor', '0xf0f0f0');
		this.selectedRowsColor = this.string('selectedRowsColor', '0xff8c00');
		this.missingValueColor = this.string('missingValueColor', '0xf0f0f0');
		this.axisLineColor = this.string('axisLineColor', '0x808080');
		this.axisTextColor = this.string('axisTextColor', '0x808080');
		this.gridLineColor = this.string('gridLineColor', '0xf0f0f0');
 
		window.onHitHandlerName = 'hName';
		this.onHitHandlerName = 'hName';
 
		window.hName = hName;
		this.hName = hName;
  
		//this.onHitHandlerName = onHitHandlerName;
 
		this.currentRow = -1;
		this.mouseOverRow = -1;
		this.showTooltip = true;
     
		if (this.new) {
			this.getMyLook();         
			this.initLayout();
 
			this.init3D();
//return
			console.log(this.renderer)
			if (this.isTableAttached) {
				console.error(this.dataFrame);
				this.onTableAttached();
				this.updateAllScene(this.look, this.rawX, this.rawY, this.rawZ,
					this.dataFrame.filter, 0xff00ff, this.rawZ);
			}	
		} else {
			this.initLayout2();
		}

		//this.onTableAttached(); 
	} // ctor 
 
	getFloat32Filter() {
	//	console.log('fil float df: ', this.dataFrame.filter.d.b)
		this.getFloat32BitSet(this.filterFloat, this.dataFrame.filter);
	//	console.log('fil float: ', this.filterFloat);
	//	console.log('fil float: ', this.filterFloat.reduce((a, e) => a+=e, 0));
	}

	getFloat32Selection() {
		this.getFloat32BitSet(this.selectionFloat, this.dataFrame.selection);
	//	console.log('sel float: ', this.selectionFloat);
	//	console.log('sel float: ', this.selectionFloat.reduce((a, e) => a+=e, 0));


	}

	getArrayFromBitset(bitset) {
		debugger
		var ar = new Float32Array(bitset.d.c);
		this.getFloat32BitSet(ar,bitset);
		console.log('ar float: ', ar);
		console.log('ar float: ', ar.reduce((a, e) => a+=e, 0));
	}



	getFloat32BitSet(filter1, bitset) {

		var getBitByIndex32 = (b, index) => {
			let i = Math.floor(index / 32);
			let j = index % 32;
			let rez = !!(b[~~ (index / 32)] & (1 << (index & 31)));
			//let rez = a[i] & (Math.pow(2, j));
			return rez;
		}
		var b = bitset.d.b;

		var n = bitset.d.c;
		//var rez = new Float32Array(n);
		for (var i=0; i<n; i++) {
			filter1[i] = getBitByIndex32(b, i);
		}

		var bs=0;
		b.map(e => bs+=e);
	//	console.log('bs ', bs)
		var fs=0;
		for (var i=0; i<filter1.length; i++) {
			fs += filter1[i];
		}
	//	console.log('fs ', fs)
	//	console.log('fs ', filter1)
		//return rez;

	}

	rendererResize(size) {
		//	this.renderer.setSize(size.width, size.height);
	}
 
	initLayout21() {
		this.camera = new THREE.PerspectiveCamera(45, 1, .3, 100000);
		this.scene = new THREE.Scene();
		this.camera.position.z = -100;
		this.camera.position.x = 0;
		this.cameraTarget = new THREE.Vector3(0, 0, 0);
		this.camera.lookAt(this.cameraTarget);

		const ambientLight = new THREE.AmbientLight(0xffffff, 2.485434543257532104);
		this.scene.add(ambientLight);
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setClearColor(0x1e3278, 1);
		this.renderer.setClearColor(0xffffff, 1);

 
		var m = new THREE.MeshPhongMaterial({ color: 0xff0000 })
		var g = new THREE.SphereGeometry(2, 6, 6);
		var mesh = new THREE.Mesh(g, m);
		mesh.position.x = 0;
		mesh.position.y = 0;
		mesh.position.z = 0;
		this.scene.add(mesh);
		this.renderer.setSize(400, 400);
		let mapDiv = ui.div([], 'd4-viewer-host');
		this.mapDiv = mapDiv;
		//mapDiv.add(ui.h1('Hello World'))
		mapDiv.appendChild(this.renderer.domElement);
		
		//this.controls.enabled = true;


 
		console.error(this.renderer);
		this.root.appendChild(mapDiv);
		this.controls = new TrackballControls(this.camera, this.renderer.domElement		);
		//this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.controls.enabled = true;
		
		// mapDiv.appendChild(ms);
		//mapDiv.appendChild(this.canvas);
		this.render();
	} // initLayout2
       
	// normalization of array, result: 
	// 1. array with values from 0 to 1
	// 2. scale factor (how much original array bigger than nomalized)
	// 3. center of original array
	normalize(ar) {
		var { center, scale, min, max } = this.getNormalizeInfo(ar);
		var rez = ar.map(e => (e - min) / scale);
		return rez;
	}
               
	// get info about array:
	// center, scale, min, max
	getNormalizeInfo(ar) {
		var min = 1000 * 1000 * 1000;
		var max = -1000 * 1000 * 1000;
		for (var i = 0; i < ar.length; i++) {
			if (ar[i] > max) max = ar[i];
			if (ar[i] < min) min = ar[i];
		};
		var dx = max - min;
		return {
			center: (max - min) / 2,
			scale: dx,
			min: min,
			max: max
		}
	}

	createMarker(type, coords) {
		var m = new THREE.MeshPhongMaterial({ color: 0xff00ff });
		var g = new THREE.SphereGeometry(2, 6, 6);
		var mesh = new THREE.Mesh(g, m);
		mesh.position.x = coords[0];
		mesh.position.y = coords[1];
		mesh.position.z = coords[2];
		return mesh;
	}

 
	// -------------------------------------------------------------------------------
	onTableAttached() {
		if (!this.scene) {
			this.isTableAttached = true;
			return 0;
		}
		var df = this.dataFrame;
    
		let numericalColumns = Array.from(this.dataFrame.columns.numerical);
		this.xColumnName = numericalColumns[0].name;
		this.yColumnName = numericalColumns[1].name;
		this.zColumnName = numericalColumns[2].name;
		this.rawX = this.dataFrame.getCol(this.xColumnName).getRawData();
		this.rawY = this.dataFrame.getCol(this.yColumnName).getRawData();
		this.rawZ = this.dataFrame.getCol(this.zColumnName).getRawData();
		this.centerX = 0;
		this.centerY = 0;
		this.centerZ = 0;
		for (var i=0; i<this.rawX.length; i++) {
			this.centerX += this.rawX[i] / this.rawX.length;
			this.centerY += this.rawY[i] / this.rawX.length;
			this.centerZ += this.rawZ[i] / this.rawX.length;
		}
		this.sizeX = new Float32Array(this.rawX.length)
		this.colorX = new Float32Array(this.rawX.length)

		var { centerX } = this.getNormalizeInfo(this.rawX);
		var { centerY } = this.getNormalizeInfo(this.rawY);
		var { centerZ } = this.getNormalizeInfo(this.rawZ);
		this.camera.lookAt(new THREE.Vector3(centerX, centerY, centerZ))

		this.addDataFrameCallbacks();

		this.filterFloat = new Float32Array(this.rawX.length)
		this.selectionFloat = new Float32Array(this.rawX.length)

		if (this.new) {
	//		this.placeMarkers()
	//		console.log(this.scene)
	//		this.scene.background = new THREE.Color(.2,0,0)
	//		this.render()
//return 0
			console.log('table attach if this new')
			this.clean()
		//	this.render()
	//		return 0

			this.updateAllScene(this.look, this.rawX, this.rawY, this.rawZ, this.dataFrame.filter,
				this.rawZ, this.rawZ)

	
		} else {
			this.placeMarkers();
		}
		this.render();
	} // table attached

	placeMarkers() {
		for (var i = 0; i < this.rawX.length; i++) {
			var marker = this.createMarker('circle',
				[this.rawX[i], this.rawY[i], this.rawZ[i]]);
			this.scene.add(marker);
		}
	}


	
	initLayout() {		
		this.container = ui.div([], 'd4-viewer-host');
		this.container.style.width = '100%';
		this.container.style.height = '100%';
		console.log('cont ', this.container);
	}
	
	initTHREEtt() {
		this.camera = new THREE.PerspectiveCamera(45, 1, .3, 100000);
		this.scene = new THREE.Scene();
		this.camera.position.z = -10;
		this.camera.position.x = 0;
		this.cameraTarget = new THREE.Vector3(0, 0, 0);
		this.camera.lookAt(this.cameraTarget);

		const ambientLight = new THREE.AmbientLight(0xffffff, 2.485434543257532104);
		this.scene.add(ambientLight);
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.container.appendChild(this.renderer.domElement);
		this.root.appendChild(this.container)
		this.renderer.setClearColor(0x1e3278, 1);
	}

	resetCamera2() {
		this.camera = new THREE.PerspectiveCamera(45, 1, .3, 100000);

		this.camera.position.z = -100;
		this.camera.position.x = 0;
		this.cameraTarget = new THREE.Vector3(0, 0, 0);
		this.camera.lookAt(this.cameraTarget);
	}
            
	init3D() {
		const width = this.container.clientWidth;
		const height = this.container.clientHeight;

		this.materialList = [];
		this.geometryList = [];
		this.geometrySize = new THREE.Vector3();
		this.mouse = new THREE.Vector2();
		this.highlightBoxScale = 1.5;

		//this.initTHREE();		return 
		// camera
		this.camera = new THREE.PerspectiveCamera();
		this.resetCamera();
		this.clean();
 
		const color = 0xFFFFFF;
		const intensity = 1;
		const light = new THREE.AmbientLight(color, intensity);
	//	this.scene.add(light);

		const ambientLight = new THREE.AmbientLight(0xffffff, 22.485434543257532104);
	//	this.scene.add(ambientLight);
		var pLight = new THREE.PointLight(new THREE.Color(111,111,111), 222, 1000, 1)
		
	//	this.scene.add(pLight)
		pLight.position.x=0
		pLight.position.y=0
		pLight.position.z=0

		// hitting render target
		this.hittingRenderTarget = new THREE.WebGLRenderTarget(width, height);
		this.hittingRenderTarget.texture.generateMipmaps = false;
		this.hittingRenderTarget.texture.minFilter = THREE.NearestFilter;

		var highlightBox = function (color, transparent, opacity) {
			return new THREE.Mesh(
				new THREE.BoxGeometry(1, 1, 1),
				new THREE.MeshLambertMaterial({
					emissive: color,
					transparent: transparent,
					opacity: opacity,
					side: THREE.FrontSide
				})
			);
		};
 
		// highlight boxes
		this.mouseOverBox = highlightBox(0xFFFF00, true, 0.5);
		this.currentRowBox = highlightBox(0x000000, true, 0.75);

		// renderer
		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true
		});

		this.renderer.context.getExtension('OES_standard_derivatives');
		
		var extensions = this.renderer.context.getSupportedExtensions();


		//if (this.renderer.extensions.get('ANGLE_instanced_arrays') === null) {
		if (this.renderer.context.getExtension('ANGLE_instanced_arrays') === null) {
	//		document.getElementById("notSupported").style.display = "";
		//	return;
		}


		this.renderer.setPixelRatio(window.devicePixelRatio);
//		this.renderer.setSize(width, height);
		this.renderer.domElement.style.width = '100%';
		this.renderer.domElement.style.height = '100%';
	//	this.renderer.domElement.width = '22';
	//	this.renderer.domElement.height = '22';

		this.container.appendChild(this.renderer.domElement);
 

//		let mapDiv = ui.div([], 'd4-viewer-host');
//		this.mapDiv = mapDiv;
	//	mapDiv.add(ui.h1('Hello World'))
//		mapDiv.appendChild(this.renderer.domElement);


		this.root.appendChild(this.container)

		this.scene.add( new THREE.AxesHelper( 55 ) );


		this.fpsMeter = document.createElement('div');
		this.fpsMeter.style.position = 'absolute';
		this.fpsMeter.style.left = '5px';
		this.fpsMeter.style.top = '5px';
		this.root.appendChild(this.fpsMeter)
	//	return
	//	if (this.renderer.extensions.get('instanced_arrays') === null) {
	//		throw 'ANGLE_instanced_arrays not supported';
	//	}

		// controls
		//this.controls = new TrackballControls(this.camera, this.renderer.domElement);
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		//this.controls.dynamicDampingFactor = 0.00001;
		this.timerAutoRotation = null;

		// shaders
		this.initShaders();

		this.isEventsLinked = false;
	} // init3d


	getMyLook() {
	//	this.look = {}
		this.look.getRGBA = (v) => {

			var rez = {

			}
		}
		this.look.TETRAHEDRON = 'tetrahedron';
		this.look.OCTAHEDRON = 'octahedron';
		this.look.CYLINDER = 'cylinder';
		this.look.DODECAHEDRON = 'dodecahedron';
		this.look.BOX = 'box';
		this.look.SPHERE = 'sphere';
		this.look.MarkerTypes = [
			this.look.TETRAHEDRON, this.look.OCTAHEDRON, this.look.CYLINDER,
			this.look.DODECAHEDRON, this.look.BOX, this.look.SPHERE
		];
		this.look.backColor = 'blue';
		this.look.backColor = 0xffffffff;
	//	this.look.filteredRowsColor = {r: 255, g: 0, b: 0, a: 1};
	//	this.look.filteredRowsColor = 0x1f77b4;
		this.look.filteredOutRowsColor = {r: 0, g: 0, b: 255, a: 1};
		this.look.selectedRowsColor = 0xff8c00 // {r: 0, g: 255, b: 0, a: 1};;
		this.look.missingValueColor = 'red';
		this.look.axisLineColor = 'green';
		this.look.axisTextColor = 'red';
		this.look.gridLineColor = 'green';
		/*
List<int> linearColorScheme = Color.schemeBlueWhiteRed;
  List<int> categoricalColorScheme = Color.defaultList;

		*/
		this.look.dynamicCameraMovement = false;
		this.look.showVerticalGridLines = true;
		this.look.showHorizontalGridLines = true;
		this.look.showXAxis = true;
		this.look.showYAxis = true;
		this.look.showZAxis = true;
		this.look.showFilteredOutPoints = false;

		/// Highlight 'mouse-over' rows (such as the ones that fall into a histogram bin that
		/// the mouse is currently hovering over).
		this.look.showMouseOverRowGroup = true;
		//this.look.markerType = ScatterPlot3dMarkers.OCTAHEDRON;
		this.look.markerType = this.look.BOX;
		this.look.markerTypeChoices = this.look.markersTypes;
		this.look.markerRandomRotation = false;


		this.look.markerMinSize = 0.1;
	} // look

	addDataFrameCallbacks() {
		this.localSubs.push(this.dataFrame.filter.onChanged.subscribe(() => this.update()))
		this.localSubs.push(this.dataFrame.selection.onChanged.subscribe((e) => {
			console.error('se  ', e)

			this.update()
		}))
		this.localSubs.push(this.dataFrame.onMouseOverRowChanged.subscribe((e) => {
			console.error('mouse over row ', e)
			this.update()
		}))
		this.localSubs.push(this.dataFrame.onCurrentRowChanged.subscribe((e) => {
			console.error('current row ', e)
			this.update()
		}))
		this.localSubs.push(this.dataFrame.onCurrentRowChanged.subscribe((e) => {
			console.error('onMetaDataChanged ', e)
			this.update()
		}))
		this.localSubs.push(this.dataFrame.onCurrentRowChanged.subscribe((e) => {
			console.error('onCurrentRowChanged ', e)
			this.update()
		}))

		this.localSubs.push(this.dataFrame.onMouseOverRowGroupChanged.subscribe((e) => {
			return 0
			var t = grok.shell.t;
			var ar = this.getArrayFromBitset(t)

			console.error('onMouseOverRowGroupChanged ', ar)
			this.update()
		}))

	}


	updateAllScene(look, x, y, z, filter, colors, sizes) {
	//	this.look = look;
		//this.initMesh(x, y, z, filter, colors, sizes);
		this.initMesh(this.rawX, this.rawY, this.rawZ, this.dataFrame.filter) //, colors, sizes);
//return
		if (this.look.dynamicCameraMovement)
			this.enableAutoRotation();
		else
			this.disableAutoRotation();

		if (!this.isEventsLinked) {
	//	if (true) {
			this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
			this.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
			this.renderer.domElement.addEventListener('wheel', this.onMouseMove.bind(this));
			this.renderer.domElement.addEventListener('dblclick', this.onDoubleClick.bind(this));
		//	onResize(this.container, this.onWindowResize.bind(this)); 
			requestAnimationFrame(this.render.bind(this));
			this.enableAutoRotation();
			this.isEventsLinked = true;
		}
	} 

	/*
	**********************************************************************************************************************
	**********************************************************************************************************************
	**********************************************************************************************************************
	*/


 
	update(colors2, filter) {
		console.log('this update !!!!!!!!!!!!!!!!!!!!!!')

		
		//console.log('fffff ', this.igeo.attributes)
		this.getFloat32Filter();
		this.getFloat32Selection();
		if( this.igeo.attributes.filter2) {
			console.log('fffff ', this.igeo.attributes.filter2)
			this.igeo.attributes.filter2.needsUpdate = true;
		}
		

		this.dartGetColors()
	//	console.log('colors ', colors)
		let markerColor = new THREE.Color();
		for (let n = 0; n < this.colorX.length; n++) {
			markerColor.setHex(this.colorX[n]);
			this.markerColors.setXYZ(n, markerColor.r, markerColor.g, markerColor.b);
			this.markerAlphas.setX(n, ((this.colorX[n] >> 24) & 255) / 255.0);
		//	this.filter.setX(n, filter[n]);
		}

		this.igeo.attributes.color.needsUpdate = true;
		this.igeo.attributes.alpha.needsUpdate = true;

		//this.hit();
		this.render();
	}



	hitRows(currentRow, mouseOverRow) {
		this.currentRow = currentRow;
		this.mouseOverRow = mouseOverRow;
		this.hit();
		this.render();
	}



	resetView() {
		this.resetCamera();
		this.controls.reset();
		this.hit();
		this.render();
	}

	rotateStep() {
 
		//this.camera.rotation.z += .01;
		this.cameraAngle += .01;
		this.camera.lookAt(new Vector3(
			this.centerX,
			this.centerY,
			this.centerZ
		))
		this.camera.position.y = this.centerY * 1.2;
		this.camera.position.x = Math.sin(this.cameraAngle)*this.cameraRadius;
		this.camera.position.z = Math.cos(this.cameraAngle)*this.cameraRadius;

	//	this.camera.lookAt(new Vector3(100,0,0))

		console.log(this.camera.position, this.cameraAngle)

	//	this.camera.lookAt(new Vector3(this.centerX+100, this.centerY, this.centerZ))
	}

	enableAutoRotation() {
	//	return 0;
		this.controls.staticMoving = false;
		this.cameraRadius = 30;
		this.cameraAngle = 0
		console.log('controls ', this.controls.domElement);
		console.log('controls e', this.controls.enabled);
		//this.controls.autoRotate = true
		this.controls.enabled = false

		// Simulate touch
		this.rrr = 0
		this.timerAutoRotation = setInterval(() => {
			this.rotateStep()
	//		console.log('inerrrrrrrrrrrr', this.rrr);
//			this.controls.domElement.dispatchEvent(new MouseEvent('mousedown', { clientX: 0 }));
//			this.controls.domElement.dispatchEvent(new MouseEvent('mousemove', { clientX: 10 }));
//			this.controls.domElement.dispatchEvent(new MouseEvent('mouseup', { clientX: 10 }));

	//		this.controls.dispatchEvent(new MouseEvent('mousedown', { clientX: this.rrr+0 }));
	//		this.controls.dispatchEvent(new MouseEvent('mousemove', { clientX: this.rrr+10 }));
	//		this.controls.dispatchEvent(new MouseEvent('mouseup', { clientX: this.rrr+11 }));
	//		this.rrr += 11;
	//		this.render()
		}, 100	
		)

//		if (this.timerAutoRotation === null)
	//		this.timerAutoRotation = setInterval(this.render.bind(this), 10);
	}

  
	disableAutoRotation() {
		this.controls.enabled = true;

	//	this.controls.staticMoving = true;
		if (this.timerAutoRotation) clearInterval(this.timerAutoRotation);
		this.timerAutoRotation = null;
	}
 

	resetCamera() {
		this.camera.fov = 45;
		this.camera.aspect =1// this.container.clientWidth / this.container.clientHeight;
		this.camera.near = 1;
		this.camera.far = 10000;
	//	this.camera.position.z = 54.0;
	//	this.camera.position.x = 24.0;
	//	this.camera.position.y = 34.0;
	//	this.camera.updateProjectionMatrix();
	}


	initMesh(x, y, z, filter, color, size) {
		this.clean();
		console.log('init mesh', this.look.markerType);
		let geo;
		if (this.look.markerType === 'tetrahedron')
			geo = new THREE.TetrahedronGeometry(1.0);
		else if (this.look.markerType === 'octahedron')
			geo = new THREE.OctahedronGeometry(1.0);
		else if (this.look.markerType === 'cylinder')
			geo = new THREE.CylinderGeometry(1.0, 1.0, 1.0, 5, 1);
		else if (this.look.markerType === 'dodecahedron')
			geo = new THREE.DodecahedronGeometry(1.0);
		else if (this.look.markerType === 'box')
			geo = new THREE.BoxGeometry(2.0, 2.0, 2.0);
		else if (this.look.markerType === 'sphere')
			geo = new THREE.SphereGeometry(1.0, 8, 8);
		else
			geo = new THREE.TetrahedronGeometry(1.0);
		geo.computeBoundingBox();
		geo.boundingBox.getSize(this.geometrySize);
		this.geometryList.push(geo);

		this.makeInstanced(geo, x, y, z, filter, color, size);
		this.hit();
		this.render();
	}

	initMesh2() {

	}


	saveMousePosition(e) {
		this.mouse.x = e.clientX;
		this.mouse.y = e.clientY;
	}


	onMouseMove(e) {
		
		//return
		if (this.showTooltip === false)
		debugger
			window[this.onHitHandlerName].apply(window, [-1, this.currentRow, 0, 0, new Object()]);
		this.saveMousePosition(e);
		const element = this.hitTest(e.layerX, e.layerY);
		this.mouseOverRow = element.id;
		this.hit();
		if (!this.look.dynamicCameraMovement)
			this.render();
	}



	onMouseDown(e) {
		console.log('m down')
	//	return
		if (!this.look.dynamicCameraMovement) this.disableAutoRotation();
		return
		handleMouseMove(this.onMouseMove.bind(this), this.onMouseUp.bind(this));
		this.showTooltip = false;
		this.saveMousePosition(e);
		const element = this.hitTest(e.layerX, e.layerY);
		if (element.object && !(e.ctrlKey || e.metaKey || e.shiftKey))
			this.currentRow = element.id;

		let options = {
			'ctrlKey': e.ctrlKey,
			'metaKey': e.metaKey,
			'shiftKey': e.shiftKey
		};

		this.hit(options);
		this.render();
	}


	onMouseUp(e) {
		this.showTooltip = true;
	}


	onDoubleClick(e) {
		const element = this.hitTest(e.layerX, e.layerY);
		if (element.object)
			this.onMouseDown(e);
		else
			this.resetView();
	}




	onWindowResize(e) {
		return
		const width = this.container.clientWidth;
		const height = this.container.clientHeight;
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize(width, height);
		this.hittingRenderTarget.setSize(width, height);
		this.renderer.render(this.scene, this.camera);
	}




	clean() {
	/*	
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(this.look.backColor);
		this.scene.background = new THREE.Color(0,0,1);
		return 0;
*/
		THREE.Cache.clear();

		this.materialList.forEach(function (m) {
			m.dispose();
		});

		this.geometryList.forEach(function (g) {
			g.dispose();
		});

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(this.look.backColor);
	//	this.scene.background = new THREE.Color(1, 1, 1);

		this.scene.add(this.camera);
	//	this.scene.add(this.mouseOverBox);
	//	this.scene.add(this.currentRowBox);

		this.hittingScene = new THREE.Scene();
		this.hittingData = {};
		this.materialList = [];
		this.geometryList = [];
	}



	onPropertyChanged(property) {
		var name = property.name;
		var val = property.get();
		var v2 = this.filteredRowsColor;
		if (name === 'markerSizeProp') {
		  this.markerSize = parseInt(val);
		  if (this.dataFrame) this.render();
		};

		this.updateProps();
		this.updateAllScene();
		//super.onPropertyChanged(property);
	  }

	  normalize2(ar1, ar2, min1, max1, min2, max2) {
		  var d1 = max1 - min1;
		  var d2 = max2 - min2;
		  return ar1.map((e, i) => ar2[i] = min2 + (e - min1) * d2 / d1);
	  }

	  updateProps() {
		if (!this.dataFrame) return;
		console.error('update props ', this.filteredRowsColor, this.zColumnName);
		this.rawX = this.dataFrame.getCol(this.xColumnName).getRawData();
		this.rawY = this.dataFrame.getCol(this.yColumnName).getRawData();
		this.rawZ = this.dataFrame.getCol(this.zColumnName).getRawData();

		if (this.sizeColumnName) {
			this.isSizeExists = true;
			var tSize = this.dataFrame.getCol(this.sizeColumnName);
			this.normalize2(tSize.getRawData(), this.sizeX, tSize.min, tSize.max, this.sizeMin, this.sizeMax);
	
		}

		if (this.colorColumnName) {
			this.isColorExists = true;
		} else {
			this.isColorExists = false;
		}
			var tColor = this.dataFrame.getCol(this.colorColumnName);
			this.colorMax = tColor?.max;
			this.colorMin = tColor?.min;
			//this.normalize2(tSize.getRawData(), this.colorX, tSize.min, tSize.max, this.sizeMin, this.sizeMax);
			this.dartGetColors(this.colorX, tColor?.getRawData());
	
	

	}



 













	makeInstanced(geo, x, y, z, filter, colors2, sizes) {
		this.updateProps()
	//	return 0;
		this.getFloat32Filter();
	
		this.getFloat32Selection();
		console.log('make instanced ', geo);
		//var colors = this.dartGetColors();
		

		this.scene.add( new THREE.AxesHelper( 5 * 5 ) );
		// material
		const vert = document.getElementById('vertInstanced').textContent;
		const frag = document.getElementById('fragInstanced').textContent;

		const material = new THREE.RawShaderMaterial({
			vertexShader: vert,
			fragmentShader: frag,
			opacity: 0.5,
			transparent: true
		});
	//	material.side = THREE.BackSide
 
		this.materialList.push(material);
/*
		const hittingMaterial = new THREE.RawShaderMaterial({
			vertexShader: "#define HITTING\n" + vert,
			fragmentShader: "#define HITTING\n" + frag
		});
		*/
		const hittingMaterial = new THREE.RawShaderMaterial({
			vertexShader: this.webgl2prefix  + "#define HITTING\n" + this.vertInstancedBody,
			fragmentShader: this.webgl2prefix + "#define HITTING\n" + this.fragInstancedBody
		});

		this.materialList.push(hittingMaterial);

		// geometry 
		console.log('geo 1', geo);   
		//let bg2 =  new THREE.BufferGeometry(geo)
		//console.log('bg2 ', bg2)
		//let bgeo =bg2.fromGeometry(geo);
		//let bgeo =bg2.fromGeometry(geo);
		//let bgeo =bg2
		var bgeoi = geo.clone();
		//bgeoi = geo.toBufferGeometry();
		var bgeo = geo.toNonIndexed()
		console.log('bgeo ', bgeo)
		this.geometryList.push(bgeo);

		this.igeo = new THREE.InstancedBufferGeometry();
		this.geometryList.push(this.igeo);

		const vertices = bgeo.attributes.position.clone();
		this.igeo.addAttribute('position', vertices);

		var numObjects = x.length;
	//	numObjects = 10

		let mcol0 = new THREE.InstancedBufferAttribute(new Float32Array(numObjects * 3), 3, false);
		let mcol1 = new THREE.InstancedBufferAttribute(new Float32Array(numObjects * 3), 3, false);
		let mcol2 = new THREE.InstancedBufferAttribute(new Float32Array(numObjects * 3), 3, false);
		let mcol3 = new THREE.InstancedBufferAttribute(new Float32Array(numObjects * 3), 3, false);

		this.scaleFactor = 1.0 / (10.0 * Math.log(numObjects));
		this.scaleFactor = .14

		let position = new THREE.Vector3();
		let rotation = new THREE.Euler();
		let quaternion = new THREE.Quaternion();
		let scale = new THREE.Vector3();

		let matrix = new THREE.Matrix4();
		let me = matrix.elements;
		
 
		//for (let n = 0; n < numObjects; n++) {
		for (let n = 0; n < numObjects; n++) {
			let size = (!this.isSizeExists) ? this.scaleFactor : this.sizeX[n] * this.scaleFactor;
			scale.setScalar(size);

			position.x = x[n]*1 - 0.5;
			position.y = y[n]*1 - 0.5;
			position.z = z[n]*1 - 0.5;

			if (this.look.markerRandomRotation) {
				rotation.x = Math.random() * 2 * Math.PI;
				rotation.y = Math.random() * 2 * Math.PI;
				rotation.z = Math.random() * 2 * Math.PI;
				quaternion.setFromEuler(rotation, false);
			}
   
			matrix.compose(position, quaternion, scale);

			let object = new THREE.Object3D();
			object.applyMatrix4(matrix); 
			this.hittingData[n + 1] = object;

			mcol0.setXYZ(n, me[0], me[1], me[2]);
			mcol1.setXYZ(n, me[4], me[5], me[6]);
			mcol2.setXYZ(n, me[8], me[9], me[10]);
			mcol3.setXYZ(n, me[12], me[13], me[14]);
		} // numObjects
/*
		this.igeo.addAttribute('mcol0', mcol0);
		this.igeo.addAttribute('mcol1', mcol1);
		this.igeo.addAttribute('mcol2', mcol2);
		this.igeo.addAttribute('mcol3', mcol3);
*/
		this.igeo.setAttribute('mcol0', mcol0);
		this.igeo.setAttribute('mcol1', mcol1);
		this.igeo.setAttribute('mcol2', mcol2);
		this.igeo.setAttribute('mcol3', mcol3);


		this.markerColors = new THREE.InstancedBufferAttribute(new Float32Array(numObjects * 3), 3, false);
		this.markerAlphas = new THREE.InstancedBufferAttribute(new Float32Array(numObjects), 1, true);
		let markerColor = new THREE.Color();
	//	markerColor = DG.Color.filteredOutRows
		for (let n = 0; n < numObjects; n++) {
			markerColor.setHex(this.colorX[n]);
			this.markerAlphas.setX(n, ((this.colorX[n] >> 24) & 255) / 255.0);
			this.markerColors.setXYZ(n, markerColor.r, markerColor.g, markerColor.b);
			//this.markerColors.setXYZ(n,1,0,0);
		}
		
		this.igeo.setAttribute('color', this.markerColors);
		this.igeo.setAttribute('alpha', this.markerAlphas);


		let col = new THREE.Color();
		let hittingColors = new THREE.InstancedBufferAttribute(new Float32Array(numObjects * 3), 3, false);

		for (let n = 0; n < numObjects; n++) {
			col.setHex(n + 1);
			hittingColors.setXYZ(n, col.r, col.g, col.b);
		}
    
		this.igeo.setAttribute('hittingColor', hittingColors);

		// filter 

		this.getFloat32Filter();
		this.getFloat32Selection();
		this.filter = new THREE.InstancedBufferAttribute(this.filterFloat, 1, false);
	
		console.log('this filter ' , this.filter);
		this.igeo.setAttribute('filter2', this.filter);

		console.log('this igeo ', this.igeo);
		// mesh
		var m = new THREE.MeshPhongMaterial({ color: 0x0000ff });

		this.mesh = new THREE.Mesh(this.igeo, material);
		this.mesh.name = 'main';
		this.mesh.scale.x =1;
		this.mesh.scale.y =1;
		this.mesh.scale.z =1;
		console.log('make instanced ', geo);

		console.log('mesh main', this.mesh.geometry);
		this.scene.add(this.mesh);

		this.hittingMesh = new THREE.Mesh(this.igeo, hittingMaterial);
		this.hittingScene.add(this.hittingMesh);

		

/*
	var m = new THREE.MeshLambertMaterial({ color: 0xff00ff })
	var g = new THREE.SphereGeometry(1, 6, 6);
	var mesh2 = new THREE.Mesh(geo, m);
	mesh2.name = 'mesh2'
	mesh2.scale.x = 1
	mesh2.scale.y = 1
	mesh2.scale.z = 1
	mesh2.position.x = 0
	mesh2.position.y = 20
	mesh2.position.z = 0
	this.scene.add(mesh2);
	console.log('mesh2 ', mesh2.geometry)
	*/
	} // makeInstanced


	hitTest(x, y) {
		// create buffer for reading a single pixel
		let pixelBuffer = new Uint8Array(4);

		// read the pixel under the mouse from the texture
		this.renderer.readRenderTargetPixels(this.hittingRenderTarget,
			x, this.hittingRenderTarget.height - y, 1, 1, pixelBuffer);

		// interpret the pixel as an ID
		let id = (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | (pixelBuffer[2]);

		return {
			id: id - 1,
			object: this.hittingData[id]
		};
	} // hitTest


	getElement(id) {
		return {
			id: id,
			object: this.hittingData[id + 1]
		};
	}


	hit(options) {
		options = ((options === undefined) || (options === null)) ? new Object() : options;

		options.showTooltip = this.showTooltip;

		// render the hitting scene off-screen
		this.mouseOverBox.visible = false;
		this.currentRowBox.visible = false;
		this.renderer.render(this.hittingScene, this.camera, this.hittingRenderTarget);
		this.moveHighlightBox(this.mouseOverBox, this.getElement(this.mouseOverRow), true, options);
		this.moveHighlightBox(this.currentRowBox, this.getElement(this.currentRow), false, options);
	}

 
	moveHighlightBox(highlightBox, element, notify, options) {
		if (element.object) {
			const object = element.object;

			// move the highlightBox, so that it surrounds the hit object
			if (object.position && object.rotation && object.scale) {
				highlightBox.position.copy(object.position);
				highlightBox.rotation.copy(object.rotation);
				highlightBox.scale.copy(object.scale).multiply(this.geometrySize).multiplyScalar(this.highlightBoxScale);
				highlightBox.visible = true;
			}

			if (notify)
				window[this.onHitHandlerName].apply(window, [this.mouseOverRow, this.currentRow, this.mouse.x, this.mouse.y, options]);
		}
		else {
			if (notify)
				window[this.onHitHandlerName].apply(window, [this.mouseOverRow, this.currentRow, 0, 0, options]);
		}
	}
 
	  
	updateStats() {

		THREE.Utils = {
			cameraLookDir: function(camera) {
				var vector = new THREE.Vector3(0, 0, -1);
				vector.applyEuler(camera.rotation, camera.eulerOrder);
				return vector;
			}
		};

		var v = new THREE.Vector3(0,0, -1);
v.applyQuaternion(this.camera.quaternion);
 //v = THREE.Utils.cameraLookDir(this.camera)
//console.log(v)
//if (!v) v = {position: {x: 0, y: 0, z:0}}

		var dtime = this.time1 - this.time0;
		if (this.time1 - this.time0 == 0) dtime = 1;
		let fps2 = 1000 / dtime;
		this.root.style.overflow='visible';
		this.fpsMeter.style.overflow='visible';
		this.fpsMeter.style.color = 'red';
		this.fpsMeter.innerHTML =
		  fps2.toFixed(1) + ' fps; t: ' + (this.time1-this.time0) + 
		  "<br>" + this.camera.position.x.toFixed(1) + ' ' +this.camera.position.y.toFixed(1)
		   + 'z' + 		  this.camera.position.z.toFixed(1) +
		   '<br>v ' + v.x.toFixed(1) + ' ' + v.y.toFixed(1) + ' ' +
		   	 v.z.toFixed(), 
		  +		  "<br>" + (this.time1 - this.time00) +  
		  
		  
		 
		  ' contr ' + !!this.controls;
	  }
      
         
	render() {
		this.camera.lookAt(this.centerX, this.centerY, this.centerZ)
		this.time0 = this.time1;
		this.time1 = Date.now();
	//	this.controls.enabled = true;
		this.updateStats();
		if (this.controls && this.controls.enabled) this.controls.update();
	//	console.log(this.scene)
		//this.camera.rotation.x = Math.PI
		if (false) {
			this.camera.position.x = 10;
			this.camera.position.y = 10; 
			this.camera.position.z = 10;
			this.camera.lookAt(new Vector3(0,0,0))
		}


		this.renderer.render(this.scene, this.camera);
		requestAnimationFrame(this.render.bind(this));

	}




	initShaders() {
		const vertInstanced1 = `#version 300 es
		#define SHADER_NAME vertInstanced
  
		precision highp float;
	  
		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;
	  
		attribute vec3 position;
		attribute vec3 mcol0;
		attribute vec3 mcol1;
		attribute vec3 mcol2;
		attribute vec3 mcol3;
		attribute float filter;
		attribute float alpha;
	  
		#ifdef HITTING
		attribute vec3 hittingColor;
		#else
		attribute vec3 color;
		varying vec3 vPosition;
		varying float vAlpha;
		#endif
	  
		varying vec3 vColor;
	  
		void main()	{
		  mat4 matrix = mat4(
			vec4(mcol0, 0),
			vec4(mcol1, 0),
			vec4(mcol2, 0),
			vec4(mcol3, 1)
		  );
		  /*
		  matrix = mat4(
			  vec4(1., 0., 0., 0.),
			  vec4(0., 1., 0., 0.),
			  vec4(0., 0., 1., 0.),
			  vec4(0., 0., 0., 1.)
		  );
	  */ 
		  vec3 positionEye = (modelViewMatrix * matrix * vec4(position, 1.0)).xyz;
	  
		#ifdef HITTING
		  vColor = hittingColor;
		#else
		  vColor = color;
		  vPosition = positionEye;
		  vAlpha = alpha;
		#endif
		  gl_Position = projectionMatrix * vec4(positionEye, filter);
		//  gl_Position = projectionMatrix * vec4(positionEye, 1.);
		//  gl_Position = vec4(position[0], position[1], 0., .5);
		}`;
  
		const fragInstanced1 = `#version 300 es
		#define SHADER_NAME fragInstanced
  
		#extension GL_OES_standard_derivatives : enable
  
		precision highp float;
	  
		varying vec3 vColor;
	  
		#ifndef HITTING
		varying vec3 vPosition;
		varying float vAlpha;
		#endif
	  
		void main()	{
			
		#ifdef HITTING
		  gl_FragColor = vec4(vColor, 1.0);
		#else
				  vec3 fdx = dFdx(vPosition);
				  vec3 fdy = dFdy(vPosition);
				  vec3 normal = normalize(cross(fdx, fdy));
				  float diffuse = dot(normal, vec3(0.0, 0.0, 1.0));
				  gl_FragColor = vec4(diffuse * vColor, vAlpha);
		#endif
	
	//	gl_FragColor = vec4(1., 0.,0.,1.);
		}`;










		const webgl2prefix = '#version 300 es\n';
		this.webgl2prefix = webgl2prefix;

		const vertInstancedBody = `
		#define SHADER_NAME vertInstanced
  
		precision highp float;
	  
		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;
	  
		in vec3 position;
		in vec3 mcol0;
		in vec3 mcol1;
		in vec3 mcol2;
		in vec3 mcol3;
		in float filter2;
		in float alpha;
	  
		#ifdef HITTING
		in vec3 hittingColor;
		#else
		in vec3 color;
		out vec3 vPosition;
		out float vAlpha;
		#endif
	  
		out vec3 vColor;
	  
		void main()	{
		  mat4 matrix = mat4(
			vec4(mcol0, 0),
			vec4(mcol1, 0),
			vec4(mcol2, 0),
			vec4(mcol3, 1)
		  );
		  /*
		  matrix = mat4(
			  vec4(1., 0., 0., 0.),
			  vec4(0., 1., 0., 0.),
			  vec4(0., 0., 1., 0.),
			  vec4(0., 0., 0., 1.)
		  );
	  */
		  vec3 positionEye = (modelViewMatrix * matrix * vec4(position, 1.0)).xyz;
	  
		#ifdef HITTING
		  vColor = hittingColor;
		#else
		  vColor = color;
		  vPosition = positionEye;
		  vAlpha = alpha;
		#endif
		  gl_Position = projectionMatrix * vec4(positionEye, filter2);
	//	  gl_Position = projectionMatrix * vec4(positionEye, 1.);
		//  gl_Position = vec4(position[0], position[1], 0., .5);
		}`;

		var vertInstanced = webgl2prefix + vertInstancedBody

		const fragInstancedBody = `
		#define SHADER_NAME fragInstanced
  
		#extension GL_OES_standard_derivatives : enable
  
		precision highp float;
	  
		in vec3 vColor;
 
	  
		#ifndef HITTING
		in vec3 vPosition;
		in float vAlpha;

		#endif
		out vec4 outColor;
		void main()	{
			
		#ifdef HITTING
		  outColor = vec4(vColor, 1.0);
		#else
				  vec3 fdx = dFdx(vPosition);
				  vec3 fdy = dFdy(vPosition);
				  vec3 normal = normalize(cross(fdx, fdy));
				  float diffuse = dot(normal, vec3(0.0, 0.0, 1.0));
				  outColor = vec4(diffuse * vColor, vAlpha);
				  outColor = vec4(diffuse * vColor, .2);
		#endif
	
		//outColor = vec4(1., 0.,0.7,.5);
		//outColor = vec4(vColor,1.);
		}`;
		var fragInstanced = webgl2prefix + fragInstancedBody;
		// WebGL2
		this.vertInstancedBody = vertInstancedBody;
		this.fragInstancedBody = fragInstancedBody;





		const addScript = function (type, id, code) {
			let s = document.createElement("script");
			s.id = id;
			s.type = type;
			s.innerHTML = code;
			document.head.appendChild(s);
		};

		if (!document.getElementById("vertMerged")) {
			addScript("x-shader/x-vertex", "vertInstanced", vertInstanced);
			addScript("x-shader/x-fragment", "fragInstanced", fragInstanced);
		}

		this.vertexShader = vertInstanced;
		this.fragmentShader = fragInstanced;
	} // initShaders


	dartHitRows() {

	}

	dartUpdateAll() {

	}

	dartUpdate() {

	}

	dartLookTooColumns() {

	}
 
	//dartGetColors(target, ar) {
	dartGetColors() {
		var target = this.colorX;
		var ar
		if (this.isColorExists) {
			ar = this.dataFrame.getCol(this.colorColumnName).getRawData();
		}
		//var colors = new Uint32Array(this.dataFrame.rowCount);
	//	var colors = this.colorX;
		var isGrouped = this.look.showMouseOverRowGroup && this.dataFrame.rows.mouseOverRowFunc
		if (!target) {
			debugger
		}
		for (var n=0; n<target.length; n++) {
			target[n] = this.dartGetColor(ar, n);

		}

		console.log('this.look.filteredRowsColor ', this.filteredRowsColor);
		//	console.log('f32 ', this.dataFrame);
		//if (this.isColorExists) {
		if (false) {
			debugger
			//let target = this.dataFrame.getCol(this.colorColumnName).getRawData();
			this.dartGetRowColor(target, ar);
		} 
	//	return colors;

	} 
  
	dartGetColor(ar, i) {
	//	return 0x3f3f0000;
		var r = (this.selectionFloat[i] < .5) ? this.filteredRowsColor : this.selectedRowsColor;

		function vNormal235(v) {
			var d = this.colorMax - this.colorMin;
			if (d === 0) d = 1;
			return Math.floor(256* (v - this.colorMin) / d);
		}
		if (this.isColorExists) {
			var min = this.colorMin;
			var max = this.colorMax;
			var d = max - min;
			if (d === 0) d = 1;
			var v = ar[i]
			var norm = Math.floor(256 * (ar[i] - min) / d)

				var blue = (255 - norm);
				var red = norm;
				r = 256*256*red + blue;
	
		} 

		return r;
	} 

	dartGetRowColor2(target, ar, i) {
		function vNormal(v) {
			return (v - min) / d;
		}
		var min = ar.min;
		var max = ar.max;
		var d = max - min;
		for (var i=0; i<ar.length; i++) {
			let blue = (1 - vNormal(ar[i]));
			let red = vNormal(ar[i]);
			target[i] = 256*256*red + blue;
		}
	}

	dartOnHit() {
		var currentRow = this.dataFrame.currentRow;
		console.error('hit ')

	}

}