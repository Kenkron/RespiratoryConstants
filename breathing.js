(function() {
	'use strict';

	var BreathCtrl = function() {
		var ctrl = this;

		//Default inputs
		var DEFAULT_COMPLIANCE = 0.2;
		var DEFAULT_RESISTANCE = 1.0;

		//Input variables
		ctrl.compliance = DEFAULT_COMPLIANCE;
		ctrl.resistance = DEFAULT_RESISTANCE;

		//Computed from input
		var timeConstant = ctrl.compliance * ctrl.resistance;


		//the lung dimensions are modeled as a rectangular prism,
		//despite being depicted as a circle. While a realistic
		//lung depth would be 18, This value will be based off the
		//width, height, and volume. This is because lungs are not
		//*actually* rectangular prisms, and the depth is not depicted.

		//Constants
		var tidalVolume = 500; //volume change (ml)
		var residualCapacity = 2300; //volume at rest (ml)
		var residualHeight = 21; //min height of a lung (cm)
		var residualWidth = 12; //min width of a lung (cm)
		var HORIZONTAL_EXPANSION = 0.2; //as a factor of vertical expansion
		//Computed from Constants
		var residualDepth = residualCapacity / (residualHeight * residualWidth); //min depth of a lung (cm)


		//Render variables
		var thickness = 0.125; // lung thickness at 1 compliance (cm)
		var canvasWidth = 300; // canvas width in cm

		//Animation variables
		var currentVolume = 0; //current fill of lung (0 to 1)
		var referenceVolume = 0; //height of right lung for 
		var lungWidth = 25;

		var canvas = document.getElementById('canvas');
		var ctx = canvas.getContext('2d');
		var fps = 30;
		var time = new Date().getTime() / 1000.0;

		/**returns the results of the quadratic equation (lowest to highest)*/
		function quadratic(a, b, c) {
			var x1 = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a)
			var x2 = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a)
			return [Math.min(x1, x2), Math.max(x1, x2)]
		}

		function getDimensions(volume) {
			//returns x, y, and z dimensions of a lung

			//Assuming depth does not change,
			//and change in width is 20% change in volume
			var z = residualDepth; //assuming depth does not change
			var area = volume / z; //equal to x * y
			// Bacause dx is 20% dy:
			//     x-residualWidth = 0.2*(y-residualHeight) ->
			//     x = 0.2*(y-residualHeight)+residualWidth
			// Thus:
			//     area = y * (0.2*(y-residualHeight)+residualWidth)
			//     area = 0.2y * (y - residualHieght)+ y*residualWidth
			//     area = 0.2y^2 - 0.2y*residualHeight + y * residualWidth
			// Quadratic Equation can be applied to:
			//     0 = 0.2*y^2 + ( residualWidth - 0.2*residualHeight )*y - area
			var y = quadratic(HORIZONTAL_EXPANSION, residualWidth - HORIZONTAL_EXPANSION * residualHeight, -area)[1];;
			var x = area / y;
			//var x = residualWidth;
			//var y = area/x;
			return [x, y, z];
		}

		/**updates the current height of the lungs based on
		 * the time passed*/
		var computeVolume = function(time, resistance, compliance) {
			timeConstant = resistance * compliance;
			//This gets the time since the last exhale.
			//5 time constants to fill lungs, means
			//one breath every 10 time constants
			time %= 10 * timeConstant;
			//time constance since filling/emptying
			var constants = (time % (5 * timeConstant)) / timeConstant;
			//Amount exhaled (0=exhaled, 1=inhaled)
			var breath = Math.pow(0.63, constants);
			//Display as if there was depth to the lung
			breath = breath;
			//Since fice time constants is "basically full",
			//we need to scale to be totally full for smooth animation
			var full = Math.pow(0.63, 5);
			breath = (breath - full) / (1 - full);
			//if inhaling, switch the breathing around:
			if (time < 5 * timeConstant) {
				breath = 1 - breath;
			}
			//smaller compliance=shallower breaths
			breath = breath * Math.sqrt(compliance / DEFAULT_COMPLIANCE);
			//convert into dimensions & return
			return breath * tidalVolume + residualCapacity;
		}

		this.maxSide = function() {
			return max(window.innerWidth(), window.innerHeight());
		}

		this.getTimeConstant = function() {
			return this.resistance * this.compliance;
		}

		this.getDefaultTimeConstant = function() {
			return DEFAULT_COMPLIANCE * DEFAULT_RESISTANCE;
		}

		////////////////////////////////////////////////////////////////////////////////////////////////
		//////////////////////////////// Rendering Functions ///////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////

		var update = function() {
			currentVolume = computeVolume(time, ctrl.resistance, ctrl.compliance);
			referenceVolume = computeVolume(time, DEFAULT_RESISTANCE, DEFAULT_COMPLIANCE);
			render();
			time = new Date().getTime() / 1000.0;
		}

		var strokeBronchiole = function(resistance, centerX, centerY, width, height, rotation) {
			var indent = (1 - (1 / resistance)) * width / 2;
			var hw = width / 2;
			var hh = height / 2;
			ctx.save();
			ctx.translate(centerX, centerY);
			ctx.rotate(rotation);
			ctx.moveTo(-hw, -hh);
			//stroke
			ctx.beginPath();
			for (var i = 0; i < 2; i++) {
				//left side, then right side
				ctx.moveTo(-hw, -hh);
				ctx.lineTo(-hw, -indent);
				ctx.lineTo(indent - hw, 0);
				ctx.lineTo(-hw, indent);
				ctx.lineTo(-hw, hh);
				ctx.rotate(Math.PI);
			}
			ctx.stroke();
			ctx.restore();
		}

		var fillBronchiole = function(resistance, centerX, centerY, width, height, rotation) {
			var indent = (1 - (1 / resistance)) * width / 2;
			var hw = width / 2;
			var hh = height / 2;
			ctx.save();
			ctx.translate(centerX, centerY);
			ctx.rotate(rotation);
			ctx.moveTo(-hw, -hh);
			//fill
			ctx.beginPath();
			for (var i = 0; i < 2; i++) {
				//left side, then right side
				ctx.lineTo(-hw, -hh);
				ctx.lineTo(-hw, -indent);
				ctx.lineTo(indent - hw, 0);
				ctx.lineTo(-hw, indent);
				ctx.lineTo(-hw, hh);
				ctx.rotate(Math.PI);
			}
			ctx.fill();
			ctx.restore();
		}

		var drawLung = function(centerX, centerY, volume, lineWidth, resistance) {
			ctx.save();
			ctx.strokeStyle = 'black';
			ctx.fillStyle = 'pink';
			ctx.lineWidth = lineWidth * 2;
			strokeBronchiole(resistance, centerX + residualWidth / 2, centerY - residualHeight / 3,
				residualWidth / 6, residualWidth * 2 / 3, Math.PI / 3);
			ctx.lineWidth = lineWidth;
			var dimensions = getDimensions(volume);
			ctx.beginPath();
			ctx.ellipse(centerX - (dimensions[0] - residualWidth) / 2, centerY + (dimensions[1] - residualHeight) / 2, dimensions[0] / 2, dimensions[1] / 2, 0, 0, 2 * Math.PI);
			ctx.fill();
			ctx.stroke();
			fillBronchiole(resistance, centerX + residualWidth / 2, centerY - residualHeight / 3,
				residualWidth / 6, residualWidth * 2 / 3, Math.PI / 3);
			ctx.restore();
		}

		var render = function() {
			ctx.save();
			//clear canvas
			ctx.fillStyle = 'white';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			//draw lungs
			var scale = canvas.width/62.5;
			ctx.scale(scale, scale);
			var xp = canvas.width * 0.01 / scale;
			var yp = canvas.height * 0.01 / scale;
			drawLung(25 * xp, 40 * yp, currentVolume, ctrl.compliance, ctrl.resistance);
			drawLung(75 * xp, 40 * yp, referenceVolume, DEFAULT_COMPLIANCE, DEFAULT_RESISTANCE);
			ctx.restore();
		}

		var updateCanvas = function() {
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;
		}

		window.setInterval(update, 1 / fps);
		window.addEventListener("resize", function() {
			canvas.width = 0;
			canvas.height = 0;
			//give dom time to update
			window.setTimeout(updateCanvas, 0.5);
		});
		//give dom time to update
		window.setTimeout(updateCanvas, 0.5);
	}

	angular.module('app', ['ngMaterial']).controller('BreathCtrl', BreathCtrl);
})();