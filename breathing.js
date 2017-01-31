(function() {
	BreathCtrl = function() {
		//Input variables
		this.compliance = 1;
		this.resistance = 1;
		ctrl = this;

		// variables
		var timeConstant = 1;

		var minLungHeight = 30; //min height of a lung
		var maxLungHeight = 60; //max height of a lung
		var currentHeight = minLungHeight; //height of right lung (influenced by constants)
		var referenceHeight = minLungHeight; //height of left lung for reference (all constansts are 1)
		var lungWidth = 30;
		var thickness = 1;

		var canvas = document.getElementById('canvas');
		var ctx = canvas.getContext('2d');
		var fps = 30;
		var time = 0;

		this.maxSide = function() {
			return max(window.innerWidth(), window.innerHeight());
		}

		var update = function() {
			currentHeight = computeHeight(time, ctrl.resistance, ctrl.compliance);
			referenceHeight = computeHeight(time, 1, 1);
			render();
			time += 1.0 / fps;
		}

		/**updates the current height of the lungs based on
		 * the time passed*/
		var computeHeight = function(time, resistance, compliance) {
			timeConstant = resistance * compliance;
			//This gets the time since the last exhale.
			//5 time constants to fill lungs, means
			//one breath every 10 time constants
			time %= 10 * timeConstant;
			//time constance since filling/emptying
			var constants = (time % (5 * timeConstant)) / timeConstant;
			//Amount exhaled (0=exhaled, 1=inhaled)
			var breath = Math.pow(0.63, constants);
			//Since fice time constants is "basically full",
			//we need to scale to be totally full for smooth animation
			breath = (breath - Math.pow(0.63, 5)) / (1 - Math.pow(0.63, 5));
			//if inhaling, switch the breathing around:
			if (time < 5 * timeConstant) {
				breath = 1 - breath;
			}
			//smaller compliance=shallower breaths
			breath = breath * compliance;
			//convert into dimensions & return
			return breath * (maxLungHeight - minLungHeight) + minLungHeight;
		}

		var drawEllipse = function(x, y, width, height) {
			ctx.beginPath();
			ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, 2 * Math.PI)
			ctx.fill();
			ctx.stroke();
		}

		var render = function() {
			ctx.save();
			//clear canvas
			ctx.fillStyle = 'white';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			//draw lungs
			ctx.strokeStyle = 'black';
			var xp = canvas.width * 0.01;
			var yp = canvas.height * 0.01;
			ctx.lineWidth = (thickness * xp) / ctrl.compliance;
			ctx.fillStyle = 'pink';
			var xMargin = (50 - lungWidth) * xp / 2;
			var yMargin = (canvas.height - (minLungHeight + (maxLungHeight - minLungHeight) * 2) * yp) / 2;
			drawEllipse(xMargin, yMargin, lungWidth * xp, currentHeight * yp);
			ctx.lineWidth = thickness * xp;
			drawEllipse(50 * xp + xMargin, yMargin, lungWidth * xp, referenceHeight * yp);
			ctx.restore();
		}

		var updateCanvas = function() {
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;
		}

		window.setInterval(update, 1 / fps);
		window.addEventListener("resize", updateCanvas);
		updateCanvas();
	}

	angular.module('app', ['ngMaterial']).controller('BreathCtrl', BreathCtrl);
})();
