(function($) {

	function replaceAll(target, search, replacement) {
		return target.replace(new RegExp(search, "g"), replacement);
	};

	function createSandboxedColorFunction(code) {
		var frame = document.getElementById("sandbox");
		if(frame == null) {
			var frame = document.createElement("iframe");
			frame.src = "about:blank";
			frame.style.display = "none";
			frame.id = "sandbox";
			document.body.appendChild(frame);
		}

		var F = frame.contentWindow.Function;
		return new F("c", "x", "y", code);
	};

	var settings = {
		running : true,
		speed : 100,
		performStep : maze.performStep,
		complete : function() {
			$("*").addClass("wait");
			// call is delayed to let the browser show the wait-cursor
			setTimeout(function() {
				maze.completeGeneration();
				$("*").removeClass("wait");
			}, 100);
		},
		startX : 0,
		startY : 0,
		pickStartPosition : function() {
			alert("Click on the maze to select a new start position. Press H to hide/show the controls.");
			$("#floatingBox").text("Click to select a start position");
			$("#canvas").off().on({
				mouseenter : function(e) {
					$("#floatingBox").show();
				},
				mouseleave : function(e) {
					$("#floatingBox").hide();
				},
				mousemove : function(e) {
					$("#floatingBox").css({ left : e.pageX, top : e.pageY });
				},
				click : function(e) {
					settings.startX = e.pageX / $("#canvas").width();
					settings.startY = e.pageY / $("#canvas").height();
					gui.updateDisplay();
					$("#floatingBox").hide();
					$("#canvas").off();
				}
			});
		},
		blockSize : 1,
		cellDistance : 2,
		directionShuffleProbability : 1.0,
		disallowSameDirection : false,
		circleProbability : 0.0,
		backgroundColor : "#000000",
		colorFactor : 3600,
		colorFunction : function(c, x, y) {
			return "hsl(" + (c * 360.0) + ", 100%, 50%)";
		},
		colorFunctionPreset : "rainbow",
		changeColorFunction : function() {
			$("#colorFunctionPresets").empty();
			Object.keys(colorFunctions).forEach((key, index) => $("#colorFunctionPresets").append("<option>" + key + "</option>"));
			$("#colorFunctionPresetLoad").off("click").on("click", () => {
				var f = colorFunctions[$("#colorFunctionPresets").val()].toString();
				var b = f.slice(f.indexOf("{") + 1, f.lastIndexOf("}"));
				$("#colorFunction").val(replaceAll(b, "\n\t\t", "\n").trim());
			});
			$("#dialog-wrapper, #dialog-colorFunction").fadeIn();
			$(".cancel-button").off("click").on("click", $("#dialog-wrapper, .dialog").fadeOut);
			function checkSyntax() {
				try {
					var f = createSandboxedColorFunction($("#colorFunction").val());
					var testVal = f(0, 0, 0); // not really an in-depth test...
					if(testVal == undefined || typeof testVal != "string") {
						$("#checkSyntaxResult").html('<span style="color: red">The function has to return a string.</span>');
						return false;
					} else {
						$("#checkSyntaxResult").html('<span style="color: green">Syntax is valid.</span>');
						return true;
					}
				} catch(e) {
					$("#checkSyntaxResult").html('<span style="color: red">' + e + '</span>');
					return false;
				}
			};
			$("#checkSyntax").off("click").on("click", checkSyntax);
			$("#dialog-colorFunction .confirm-button").off("click").on("click", () => {
				if(checkSyntax()) {
					$("#dialog-wrapper, .dialog").fadeOut();
					settings.colorFunctionPreset = "custom";
					settings.colorFunction = createSandboxedColorFunction($("#colorFunction").val());
				}
			});
		},
		redrawAll : function() {
			$("*").addClass("wait");
			// call is delayed to let the browser show the wait-cursor
			setTimeout(function() {
				maze.redrawAll(settings);
				$("*").removeClass("wait");
			}, 100);
		},
		startMaze : function() {
			maze.start(settings);
		},
		viewSource : function() {
			window.location.href = "https://github.com/Robyt3/maze";
		}
	};

	var gui = new dat.gui.GUI({ width: 400 });

	var folderGeneration = gui.addFolder("Generation");
	folderGeneration.add(settings, "running").name("Running [Space]").listen().onChange(() => maze.setRunning(settings.running));
	folderGeneration.add(settings, "speed").min(1).max(1000).step(1).name("Speed [+/-]").listen().onChange(() => maze.setSpeed(settings.speed));
	folderGeneration.add(settings, "performStep").name("Perform single step [S]");
	folderGeneration.add(settings, "complete").name("Complete generation");
	folderGeneration.add(settings, "startMaze").name("Start/Restart generation [R]");
	folderGeneration.open();

	var folderSettings = gui.addFolder("Settings");
	var folderSettingsStartPosition = folderSettings.addFolder("Start position");
	folderSettingsStartPosition.add(settings, "startX").min(0).max(1).step(0.0001).name("X");
	folderSettingsStartPosition.add(settings, "startY").min(0).max(1).step(0.0001).name("Y");
	folderSettingsStartPosition.add(settings, "pickStartPosition").name("Pick start position");
	folderSettings.add(settings, "blockSize").min(1).max(50).step(1).name("Block size");
	folderSettings.add(settings, "cellDistance").min(1).max(50).step(1).name("Cell distance");
	folderSettings.add(settings, "directionShuffleProbability").min(0.0).max(1.0).step(0.001).name("Direction shuffle probability");
	folderSettings.add(settings, "disallowSameDirection").name("Disallow same direction");
	folderSettings.add(settings, "circleProbability").min(0.0).max(1.0).step(0.001).name("Circle probability");
	folderSettings.open();

	var folderColors = gui.addFolder("Colors");
	folderColors.addColor(settings, "backgroundColor").name("Background color");
	folderColors.add(settings, "colorFactor").min(0).step(1).name("Color factor");
	var colorFuncs = Object.keys(colorFunctions);
	colorFuncs.push("custom");
	folderColors.add(settings, "colorFunctionPreset", colorFuncs).name("Color function").onChange(value => {
		if(value == "custom") {
			settings.changeColorFunction();
		} else {
			settings.colorFunction = colorFunctions[value];
		}
	}).listen();
	folderColors.add(settings, "changeColorFunction").name("Custom color function");
	folderColors.add(settings, "redrawAll").name("Redraw with new color");
	folderColors.open();

	gui.add(settings, "viewSource").name("Show source code on GitHub");

	const canvas = document.getElementById("canvas");
	canvas.addEventListener("keypress", event => {
		if(event.key == " ") {
			settings.running = !settings.running;
			maze.setRunning(settings.running);
		} else if(event.key == "s") {
			maze.performStep();
		} else if(event.key == "r") {
			settings.startMaze();
		} else if(event.key == "+") {
			settings.speed = Math.min(settings.speed + (event.shiftKey ? 10 : 1), 1000);
			maze.setSpeed(settings.speed);
		} else if(event.key == "-") {
			settings.speed = Math.max(settings.speed - (event.shiftKey ? 10 : 1), 1);
			maze.setSpeed(settings.speed);
		}
	});
	canvas.focus();

	// enable tabs in the color function textarea
	// https://stackoverflow.com/a/6140696
	$("#colorFunction").keydown(function(e) {
		if(e.keyCode === 9) { // tab was pressed
			// set textarea value to: text before caret + tab + text after caret
			$(this).val($(this).val().substring(0, this.selectionStart)
				+ "\t" + $(this).val().substring(this.selectionEnd));

			// put caret at right position again (add one for the tab)
			this.selectionStart = this.selectionEnd = this.selectionStart + 1;
			e.preventDefault();
		}
	});

	settings.startMaze();
})(jQuery);