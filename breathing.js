(function() {
	BreathCtrl = function($scope) {
		//Input variables
		$scope.compliance = 1;
		$scope.resistance = 1;
		
		// variables
		var timeConstant=1;
		
		var minHeight = 30;//min height of a lung
		var maxHeight = 80;//max height of a lung
		var currentHeight = minHeight;
		//height of left lung for reference
		var referenceHeight = minHeight;
		var minWidth  = 30;
		var thickness = 1;
		var exhaled = 400; //height of lungs when exhaled (in pixels)
		var leftLungDepth = 50; //how deep the breaths are (in pixels)
		var leftLungFrequency = 20; //breaths per minute
		var leftLungThickness = 8; //width of lung outline

		var canvas = document.getElementById('canvas');
		var ctx = canvas.getContext('2d');
		var fps = 60;
		var time = 0;

		this.maxSide=function(){
			return max(window.innerWidth(),window.innerHeight());
		}

		var drawEllipse = function(x, y, width, height) {
			ctx.beginPath();
			ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, 2 * Math.PI)
			ctx.fill();
			ctx.stroke();
		}

		var update = function() {
			currentHeight= computeHeight(time, $scope.resistance, $scope.compliance);
			referenceHeight = computeHeight(time, 1, 1);
			render();
			time += 1.0 / fps;
		}

		/**updates the current height of the lungs based on
		 * the time passed*/
		var computeHeight = function(time, resistance, compliance){
			timeConstant = resistance*compliance;
			//5 time constants to fill lungs, means
			//one breath every 10 time constants
			time %= 10*timeConstant;
			//position in inhale/exhale measured in time constants
			var constants = (time%(5*timeConstant))/timeConstant;
			//(0=exhaled, 1=inhaled):
			var breath = Math.pow(0.63,constants);
			//Since fice time constants is "basically full",
			//we need to scale to be totally full for smooth animation
			breath = (breath-Math.pow(0.63,5))/(1-Math.pow(0.63,5));
			//if inhaling:
			if (time < 5*timeConstant){
				breath = 1-breath;
			}
			//smaller compliance=shallower breaths
			breath *= compliance;
			return breath*(maxHeight-minHeight)+minHeight;
		}

		var render = function() {
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;
			
			ctx.save();
			//clear canvas
			ctx.fillStyle = 'white';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			//draw lungs
			ctx.strokeStyle = 'black';
			var xp = canvas.width * 0.01;
			var yp = canvas.height * 0.01;
			ctx.lineWidth = (thickness*xp)/$scope.compliance;
			ctx.fillStyle = 'pink';
			var xMargin = (50-minWidth)*xp/2;
			var yMargin = (canvas.height-(minHeight+(maxHeight-minHeight)*$scope.compliance)*yp)/2;
			drawEllipse(xMargin, yMargin, minWidth * xp, currentHeight * yp);
			ctx.lineWidth = thickness*xp;
			drawEllipse(50*xp+xMargin, yMargin, minWidth * xp, referenceHeight * yp);
			ctx.restore();
		}

		window.setInterval(update, 1 / fps);
	}

	angular.module('app', ['ngMaterial']).controller('BreathCtrl', BreathCtrl);
})();
