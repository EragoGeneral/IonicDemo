;(function(window, undefined){
	"use strict"

	// Some common use variables
	var ColorPicker = window.Colors,
		Tools = ColorPicker || window.Tools, // provides functions like addEvent, ... getOrigin, etc.
		colorSourceSelector = 'Colors', //document.getElementById('description').getElementsByTagName('select')[0],
		startPoint,
		currentTarget,
		currentTargetWidth = 0,
		currentTargetHeight = 0;	

	/* ---------------------------------- */
	/* ---- HSV-circle color picker ----- */
	/* ---------------------------------- */
	var hsv_map = document.getElementById('hsv_map'),
		hsv_mapCover = hsv_map.children[1], // well...
		hsv_mapCursor = hsv_map.children[2],
		hsv_barBGLayer = hsv_map.children[3],
		hsv_barWhiteLayer = hsv_map.children[4],
		hsv_barCursors = hsv_map.children[6],
		hsv_barCursorsCln = hsv_barCursors.className,
		hsv_Leftcursor = hsv_barCursors.children[0],
		hsv_Rightcursor = hsv_barCursors.children[1],

		colorDisc = document.getElementById('surface'),
		colorDiscRadius = colorDisc.offsetHeight / 2,
		luminanceBar = document.getElementById('luminanceBar'),

		hsvDown = function(e) { // mouseDown callback
			var target = e.target || e.srcElement;

			if (e.preventDefault) e.preventDefault();

			currentTarget = target.id ? target : target.parentNode;
			startPoint = Tools.getOrigin(currentTarget);
			currentTargetHeight = currentTarget.offsetHeight; // as diameter of circle

			Tools.addEvent(window, 'touchmove', hsvMove);
			hsv_map.className = 'no-cursor';
			hsvMove(e);
			startRender();
		},
		hsvMove = function(e) { // mouseMove callback
			var r, x, y, h, s;

			if(currentTarget === hsv_map) { // the circle
				r = currentTargetHeight / 2,
				x = e.touches[0].clientX - startPoint.left - r,
				y = e.touches[0].clientY - startPoint.top - r,
				h = 360 - ((Math.atan2(y, x) * 180 / Math.PI) + (y < 0 ? 360 : 0)),
				s = (Math.sqrt((x * x) + (y * y)) / r) * 100;
				myColor.setColor({h: h, s: s}, 'hsv');
			} else if (currentTarget === hsv_barCursors) { // the luminanceBar
				myColor.setColor({
					v: (currentTargetHeight - (e.touches[0].clientY - startPoint.top)) / currentTargetHeight * 100
				}, 'hsv');
			}
		},
		renderHSVPicker = function(color) { // used in renderCallback of 'new ColorPicker'
			var pi2 = Math.PI * 2,
				x = Math.cos(pi2 - color.hsv.h * pi2),
				y = Math.sin(pi2 - color.hsv.h * pi2),
				r = color.hsv.s * (colorDiscRadius - 5);

			hsv_mapCover.style.opacity = 1 - color.hsv.v;
			// this is the faster version...
			hsv_barWhiteLayer.style.opacity = 1 - color.hsv.s;
			/*hsv_barBGLayer.style.backgroundColor = 'rgb(' +
				color.hueRGB.r + ',' +
				color.hueRGB.g + ',' +
				color.hueRGB.b + ')';*/
			hsv_barBGLayer.style.backgroundColor = '#'+color.HEX;

			hsv_mapCursor.style.cssText =
				'left: ' + (x * r + colorDiscRadius) + 'px;' + 
				'top: ' + (y * r - colorDiscRadius) + 'px;' +
				// maybe change className of hsv_map to change colors of all cursors...
				'border-color: ' + (color.RGBLuminance > 0.22 ? '#333;' : '#ddd');
			/*hsv_mapCover.style.cssText =
				'left: ' + (x * r + colorDiscRadius) + 'px;' +
				'top: ' + (y * r + colorDiscRadius) + 'px;';*/
			hsv_barCursors.className = color.RGBLuminance > 0.22 ? hsv_barCursorsCln + ' dark' : hsv_barCursorsCln;
			if (hsv_Leftcursor) hsv_Leftcursor.style.top = hsv_Rightcursor.style.top = ((1 - color.hsv.v) * colorDiscRadius * 2) + 'px';				
		};

		Tools.addEvent(hsv_map, 'touchstart', hsvDown); // event delegation
		Tools.addEvent(hsv_map, 'touchend', function() {
			Tools.removeEvent (hsv_map, 'touchmove', hsvMove);
			hsv_map.className = '';		
			stopRender();
			var selColor = window.myColor.colors.HEX;
			console.log(selColor);
			document.getElementById('img').style.backgroundColor='#'+selColor;
		});
	
	// generic function for drawing a canvas disc
	var drawDisk = function(ctx, coords, radius, steps, colorCallback) {
		var x = coords[0] || coords, // coordinate on x-axis
			y = coords[1] || coords, // coordinate on y-axis
			a = radius[0] || radius, // radius on x-axis
			b = radius[1] || radius, // radius on y-axis
			angle = 360,
			rotate = 0, coef = Math.PI / 180;

		ctx.save();
		ctx.translate(x - a, y - b);
		ctx.scale(a, b);

		steps = (angle / steps) || 360;

		for (; angle > 0 ; angle -= steps){
			ctx.beginPath();
			if (steps !== 360) ctx.moveTo(1, 1); // stroke
			ctx.arc(1, 1, 1,
				(angle - (steps / 2) - 1) * coef,
				(angle + (steps  / 2) + 1) * coef);

			if (colorCallback) {
				colorCallback(ctx, angle);
			} else {
				ctx.fillStyle = 'black';
				ctx.fill();
			}
		}
		ctx.restore();
	},
	drawCircle = function(ctx, coords, radius, color, width) { // uses drawDisk
		width = width || 1;
		radius = [
			(radius[0] || radius) - width / 2,
			(radius[1] || radius) - width / 2
		];
		drawDisk(ctx, coords, radius, 1, function(ctx, angle){
			ctx.restore();
			ctx.lineWidth = width;
			//ctx.strokeStyle = color || '#000';
			//ctx.strokeStyle = '#fff';
			//ctx.stroke();
		});
	};

	if (colorDisc.getContext) {
		drawDisk( // HSV color wheel with white center
			colorDisc.getContext("2d"),
			[colorDisc.width / 2, colorDisc.height / 2],
			[colorDisc.width / 2 - 1, colorDisc.height / 2 - 1],
			360,
			function(ctx, angle) {
				var gradient = ctx.createRadialGradient(1, 1, 1, 1, 1, 0);
				gradient.addColorStop(0, 'hsl(' + (360 - angle + 0) + ', 100%, 50%)');
				gradient.addColorStop(1, "#FFFFFF");

				ctx.fillStyle = gradient;
				ctx.fill();
			}
		);
		drawCircle( // gray border
			colorDisc.getContext("2d"),
			[colorDisc.width / 2, colorDisc.height / 2],
			[colorDisc.width / 2, colorDisc.height / 2],
			'#555',
			3
		);
		// draw the luminanceBar bar
		var ctx = luminanceBar.getContext("2d"),
			gradient = ctx.createLinearGradient(0, 0, 0, 150);

		gradient.addColorStop(0,"transparent");
		gradient.addColorStop(1,"black");

		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, 30, 150);
	}


	/*
	 * This script is set up so it runs either with ColorPicker or with Color only.
	 * The difference here is that ColorPicker has a renderCallback that Color doesn't have
	 * therefor we have to set a render intervall in case it's missing...
	 * setInterval() can be exchanged to window.requestAnimationFrame(callBack)...
	 *
	 * If you want to render on mouseMove only then get rid of startRender(); in
	 * all the mouseDown callbacks and add doRender(myColor.colors); in all
	 * mouseMove callbacks. (Also remove all stopRender(); in mouseUp callbacks)
	*/
	var doRender = function(color) {			
		renderHSVPicker(color);
		//displayColor(color);
	},
	renderTimer,
	// those functions are in case there is no ColorPicker but only Colors involved
	startRender = function(oneTime){
		if (isColorPicker) { // ColorPicker present
			myColor.startRender(oneTime);
		} else if (oneTime) { // only Colors is instanciated
			doRender(myColor.colors);
		} else {
			renderTimer = window.setInterval(
				function() {
					doRender(myColor.colors);
				// http://stackoverflow.com/questions/2940054/
				}, 13); // 1000 / 60); // ~16.666 -> 60Hz or 60fps
		}
	},
	stopRender = function(){
		if (isColorPicker) {
			myColor.stopRender();
		} else {
			window.clearInterval(renderTimer);
		}
	},
	renderCallback = doRender,
	// finally the instance of either ColorPicker or Colors (export for debugging purposes)
	color_ColorPicker = new (ColorPicker || Colors)({
		customBG: '#808080',
		imagePath: 'images/'			
	}),
	color_Colors = new Colors(),
	myColor,
	isColorPicker = colorSourceSelector.value === 'Colors';

	myColor = window.myColor = color_Colors;		

	// in case ColorPicker is not there...
	if (!isColorPicker) { // initial rendering
		doRender(myColor.colors);			
	}	
	

})(window);