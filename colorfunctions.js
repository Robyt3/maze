window.colorFunctions = {
	blackAndWhite : function(c, x, y)
	{
		return "#ffffff";
	},
	rainbow : function(c, x, y)
	{
		var hue = c * 360;
		return "hsl(" + hue + ", 100%, 50%)";
	},
	rainbowHalfSaturation : function(c, x, y)
	{
		var hue = c * 360;
		return "hsl(" + hue + ", 50%, 50%)";
	},
	greenBrownCamo : function(c, x, y)
	{
		var hue = 40 + c * 80;
		var sat = hue / 120 * 40 + 20;
		return "hsl(" + hue + ", " + sat + "%, 40%)";
	},
	redscaleCamo : function(c, x, y)
	{
		var light = c * 80 + 20;
		return "hsl(0, 100%, " + light + "%)";
	},
	greenscaleCamo : function(c, x, y)
	{
		var light = c * 80 + 20;
		return "hsl(76, 100%, " + light + "%)";
	},
	bluescaleCamo : function(c, x, y)
	{
		var light = c * 80 + 20;
		return "hsl(240, 100%, " + light + "%)";
	},
	greyscaleCamo : function(c, x, y)
	{
		var light = c * 80 + 20;
		return "hsl(0, 0%, " + light + "%)";
	},
	redOrangeHuesCamo : function(c, x, y)
	{
		var hue = c * 40;
		return "hsl(" + hue + ", 100%, 50%)";
	},
	rainbowXYCamo : function(c, x, y)
	{
		var hue = x * y * 360;
		var light = c * 65 + 20;
		return "hsl(" + hue + ", 100%, " + light + "%)";
	},
	rainbowInverseXYCamo : function(c, x, y)
	{
		var hue = 1/(0.0000001+x) * 1/(0.0000001+y) * 360;
		var light = c * 65 + 20;
		return "hsl(" + hue + ", 100%, " + light + "%)";
	},
	rainbowLogInverseXYCamo : function(c, x, y)
	{
		var hue = Math.log(1/(0.0000001+x)) * Math.log(1/(0.0000001+y)) * 360;
		var light = c * 65 + 20;
		return "hsl(" + hue + ", 100%, " + light + "%)";
	},
	rainbowRadiusCamo : function(c, x, y)
	{
		var radius = Math.sqrt(Math.pow(x - 0.5, 2) + Math.pow(y - 0.5, 2));
		var hue = 2 * radius * 360;
		var light = c * 65 + 20;
		return "hsl(" + hue + ", 100%, " + light + "%)";
	},
	XY : function(c, x, y)
	{
		var hue = x * y * 360;
		return "hsl(" + hue + ", 100%, 50%)";
	},
	worldMap : function(c, x, y)
	{
		// use a cell distance of 1 and adjust the color
		// factor to change the size of the continents

		if(c < 0.35) // 35% green
			return "hsl(90, 80%, 30%)";
		else if(c < 0.5) // 15% brown
			return "hsl(19, 80%, 30%)";
		else // 50% blue
			return "hsl(240, 100%, 50%)";
	},
	worldMapEncircled : function(c, x, y)
	{
		// use a cell distance of 1 and adjust the color
		// factor to change the size of the continents

		// circle around map
		var radius = Math.sqrt(Math.pow(x - 0.5, 2) + Math.pow(y - 0.5, 2));
		if(radius > 0.50 && radius < 0.51)
			return "#0f0f0f";
		else if(radius >= 0.51)
			return "#222222";

		if(c < 0.35) // 35% green
			return "hsl(90, 80%, 30%)";
		else if(c < 0.5) // 15% brown
			return "hsl(19, 80%, 30%)";
		else // 50% blue
			return "hsl(240, 100%, 50%)";
	},
	worldMapCoarse : function(c, x, y)
	{
		// use a cell distance of 1 and adjust the color
		// factor to change the size of the continents

		if(c < 0.35) // 35% green
			return "hsl(" + (90 + Math.random()*10 - 5) + ", 80%, 30%)";
		else if(c < 0.5) // 15% brown
			return "hsl(" + (19 + Math.random()*10 - 5) + ", 80%, 30%)";
		else // 50% blue
			return "hsl(" + (240 + Math.random()*10 - 5) + ", 100%, 50%)";
	},
	worldMapCustom : function(c, x, y)
	{
		// use a cell distance of 1 and adjust the color
		// factor to change the size of the continents

		var blue		= { p : 0.20, c : "hsl(240, 100%, 50%)"},
			green		= { p : 0.10, c : "hsl(90, 80%, 30%)"},
			darkGreen	= { p : 0.05, c : "hsl(90, 80%, 20%)"},
			white		= { p : 0.01, c : "white"},
			brown		= { p : 0.02, c : "hsl(19, 80%, 30%)"},
			grey		= { p : 0.02, c : "hsl(0, 0%, 50%)"},
			sand		= { p : 0.05, c : "hsl(39, 80%, 79%)"};

		var colors = [
			blue,
			green,
			darkGreen,
			green,
			blue,
			grey,
			white,
			grey,
			sand,
			blue
		];
		
		// adjust the color according to the total probability
		c *= colors.reduce(function(acc, color) { return acc + color.p; }, 0);

		// find the color that correspondes to the current c
		var sum = 0;
		for(var i = 0; i < colors.length; i++)
		{
			sum += colors[i].p;
			if(c < sum)
				return colors[i].c;
		}

		// the last color is the default, but this should not happen
		return colors[colors.length - 1].c;
	},
	randomHue : function(c, x, y)
	{
		var hue = Math.random() * 360;
		return "hsl(" + hue + ", 100%, 50%)";
	},
	randomRGB : function(c, x, y)
	{
		return "rgb(" + (Math.random() * 255) + ", " + (Math.random() * 255) + ", " + (Math.random() * 255) + ")";
	}
};