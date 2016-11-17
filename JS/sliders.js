var clicking = false;
var curEle = null;

function findPos(ele) {
	var x = 0;
	var y = 0;

	do {
		if (!isNaN(ele.offsetLeft)) {
			x += ele.offsetLeft;
		}

		if (!isNaN(ele.offsetTop)) {
			y += ele.offsetTop;
		}
	} while(ele = ele.offsetParent);
	return { "x": x,
			 "y": y };
}

function vertSliderMouseDown(evt) {
	curEle = document.elementFromPoint(evt.clientX, evt.clientY);

	if (!curEle) {
		console.log("Failed to find slider");
		return;
	}

	clicking = true;

	// Determine the parameters of the object
	let sliderPos = findPos(curEle);
	
	let bottomY = sliderPos["y"] + curEle.clientHeight;
	
	// Determining normalized position within the slider box
	let norm = (bottomY - evt.clientY) / curEle.clientHeight;

	// Ensuring the normalized value is valid
	if (norm < 0) {
		norm = 0;
	} else if (norm > 1) {
		norm = 1;
	}

	// Determining the range of the slider for the normalized data
	let range = curEle.max - curEle.min

	// Applying the update to the slider
	curEle.value = range * norm;
}

function vertSliderMouseUp(evt) {
	clicking = false;
}

function vertSliderMouseClick(evt) {
	// Determine the parameters of the object
	let sliderPos = findPos(curEle);
	
	let bottomY = sliderPos["y"] + curEle.clientHeight;
	
	// Determining normalized position within the slider box
	let norm = (bottomY - evt.clientY) / curEle.clientHeight;

	// Ensuring the normalized value is valid
	if (norm < 0) {
		norm = 0;
	} else if (norm > 1) {
		norm = 1;
	}

	// Determining the range of the slider for the normalized data
	let range = curEle.max - curEle.min

	// Applying the update to the slider
	curEle.value = range * norm;
	curEle = null;
}

function vertSliderMouseMove(evt) {
	if (!clicking) {
		return;
	}

	// Determine the parameters of the object
	let sliderPos = findPos(curEle);
	
	let bottomY = sliderPos["y"] + curEle.clientHeight;
	
	// Determining normalized position within the slider box
	let norm = (bottomY - evt.clientY) / curEle.clientHeight;

	// Ensuring the normalized value is valid
	if (norm < 0) {
		norm = 0;
	} else if (norm > 1) {
		norm = 1;
	}

	// Determining the range of the slider for the normalized data
	let range = curEle.max - curEle.min

	// Applying the update to the slider
	curEle.value = range * norm;
}

function horiSliderMouseDown(evt) {
	curEle = document.elementFromPoint(evt.clientX, evt.clientY);

	if (!curEle) {
		console.log("Failed to find slider");
		return;
	}

	clicking = true;

	// Determine the parameters of the object
	let sliderPos = findPos(curEle);
	
	let leftX = sliderPos["x"];
	
	// Determining normalized position within the slider box
	let norm = (evt.clientX - leftX) / curEle.clientWidth;

	// Ensuring the normalized value is valid
	if (norm < 0) {
		norm = 0;
	} else if (norm > 1) {
		norm = 1;
	}

	// Determining the range of the slider for the normalized data
	let range = curEle.max - curEle.min

	// Applying the update to the slider
	curEle.value = range * norm;
}

function horiSliderMouseUp(evt) {
	clicking = false;
}

function horiSliderMouseClick(evt) {
	// Determine the parameters of the object
	let sliderPos = findPos(curEle);
	
	let leftX = sliderPos["x"];
	
	// Determining normalized position within the slider box
	let norm = (evt.clientX - leftX) / curEle.clientWidth;

	// Ensuring the normalized value is valid
	if (norm < 0) {
		norm = 0;
	} else if (norm > 1) {
		norm = 1;
	}

	// Determining the range of the slider for the normalized data
	let range = curEle.max - curEle.min

	// Applying the update to the slider
	curEle.value = range * norm;
	curEle = null;
}

function horiSliderMouseMove(evt) {
	if (!clicking) {
		return;
	}

	// Determine the parameters of the object
	let sliderPos = findPos(curEle);
	
	let leftX = sliderPos["x"];
	
	// Determining normalized position within the slider box
	let norm = (evt.clientX - leftX) / curEle.clientWidth;

	// Ensuring the normalized value is valid
	if (norm < 0) {
		norm = 0;
	} else if (norm > 1) {
		norm = 1;
	}

	// Determining the range of the slider for the normalized data
	let range = curEle.max - curEle.min

	// Applying the update to the slider
	curEle.value = range * norm;
}