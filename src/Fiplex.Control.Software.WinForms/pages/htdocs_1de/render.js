<!--
function renderPage() {
	var rootEl = document.createElement("div");
	rootEl.id = "rootElement";
	document.getElementById("page").appendChild(rootEl);
	var unit = new renderUnit();
	rootEl.appendChild(unit);
}

function Tag() {
	this.box;
	this.TAGLEN = 30;
	this.create = function() {
		var box = document.createElement("div");
		box.className = "headbox";
		this.box = box;
		var tag = document.createElement("td");
		tag.className = "tag";
		tag.id = "tagName";
		tag.style.textAlign = "center";
		tag.id = "tagName";
		box.appendChild(tag);
	}
	this.getContainer = function() {
		return this.box;
	}
	this.read = function() {
		try {
			var el = document.getElementById("tagName");
			if (el.type != "text") {
				return null;
			}
			var tag = (el.value).trim();
			for (var j = 0; j < this.TAGLEN; ++j)
				tag += ' ';
			tag = tag.slice(0, this.TAGLEN);
			var tagstr = "";
			for (var j = 0; j < this.TAGLEN; ++j) {
				var num = tag.charCodeAt(j);
				if (isNaN(num))
					continue;
				var hexnum = '00' + num.toString(16);
				tagstr += hexnum.slice(-2);
			}
			return tagstr;
		} catch (err) {
			return null;
		}
	}
	this.set = function(hextag) {
		try {
			var t = '';
			for (var i = 0; i < hextag.length; i += 2) {
				var hexnum = hextag.substr(i, 2);
				var num = parseInt(hexnum, 16);
				if (isNaN(num))
					continue;
				t += String.fromCharCode(num);
			}
			t = t.substr(-this.TAGLEN, this.TAGLEN);
			t = t.trim();
			document.getElementById("tagName").innerHTML = t;
		} catch (err) {}
	}
	this.create();
}

var tag = new Tag();

function tagRead() {
	return tag.read();
}

function tagRender() {
	tag.set(window.top.fiplexTagsStr);
}

function removeAllElements() {
	remove_element(document.getElementById("rootElement"));
}

function redrawAll() {
	removeAllElements();
	renderPage();
	tag.set(window.top.fiplexTagsStr);
}

function renderUnit() {
	var unitDiv = document.createElement("div");
	unitDiv.id = "unitDiv";
	unitDiv.className = "unitbox";
	var headDiv = document.createElement("div");
	headDiv.className = "headbox";
	headDiv.appendChild(tag.getContainer());
	unitDiv.appendChild(headDiv);
	var contentDiv = document.createElement("div");
	contentDiv.className = "contentbox";
	contentDiv.id = "contentDiv";
	unitDiv.appendChild(contentDiv);
	contentDiv.appendChild(renderUnitContent());
	return unitDiv;
}

function fiberStatusTable() {
	this.name = "fst";
	this.SFPNR = 8;
	this.fiberFocused = this.SFPNR - 2;
	this.container = document.createElement("div");
	this.container.id = this.name;
	this.container.style.width = "100%";
	this.createGlobalHeader = function() {
		var cont = document.createElement("div");
		cont.id = this.name+"_header";
		cont.className = "ttitle";
		cont.innerHTML = "Master"
		return cont;
	}
	this.setGlobalHeader = function(n) {
		if (isNaN(n) || n < 0 || n > this.SFPNR) {
			return;
		}
		var t;
		this.fiberFocused = n;
		if (n == this.SFPNR - 2) {
			t = "Master";
		} else if (n == this.SFPNR - 1) {
			t = "Expansion";
		} else {
			t = "Remote&nbsp;"+(n+1).toString();
		}
		var el = document.getElementById(this.name+"_header");
		try {
			el.innerHTML = t;
		} catch(err) {}
	}
	this.createContent = function() {
		var cont = document.createElement("div");
		cont.className = "contentbox";
		var t = document.createElement("table");
		t.className = "contenttable";
		cont.appendChild(t);
		var r = document.createElement("tr");
		t.appendChild(r);
		for (var i = 0; i < 2; ++i) {
			var c = document.createElement("td");
			c.className = "contentcell";
			r.appendChild(c);
			var t = (i == 0 ? this.createLedsTable() : this.createMeasurementTable());
			c.appendChild(t);
		}
		return cont;
	}
	this.createHeaderId = function(id, val) {
		var hdr = document.createElement("th");
		hdr.innerHTML = val;
		hdr.className = "thd";
		hdr.id = id;
		return hdr;
	}
	this.createHeader = function (val, cl) {
		var hdr = document.createElement("th");
		hdr.innerHTML = val;
		hdr.className = "thd"+cl;
		return hdr;
	}
	this.statusLedEntries = [
		{H: "Sync&nbsp;to&nbsp;Master",	I: "optFrSync"	},
		{H: "Tx/Rx&nbsp;status",	I: "txrxStat"	},
		{H: "Data&nbsp;Lock",		I: "dataLock"	},
		{H: "Data&nbsp;Sync", 		I: "dataSync"	},
		{H: "Module&nbsp;status", 	I: "optModKO"	},
		{H: "Optical&nbsp;Tx&nbsp;Error", I: "optTxErr"	},
		{H: "Optical&nbsp;Rx&nbsp;Error", I: "optRxErr"	}
	];
	this.createLedEntry = function(n) {
		var r = document.createElement("tr");
		var hdr = this.createHeader(this.statusLedEntries[n].H,"rht");
		r.appendChild(hdr);
		var id = this.statusLedEntries[n].I;
		var c = createLedBox(id);
		r.appendChild(c);
		return r;
	}
	this.createLedsTable = function() {
		var rootNode = document.createElement("table");
		rootNode.id = "tableleds";
		rootNode.cellpadding = "3";
		rootNode.cellspacing = "3";
		for (var i = 0; i < this.statusLedEntries.length; ++i) {
			rootNode.appendChild(this.createLedEntry(i));
		}
		return rootNode;
	}
	this.statusMsrEntries = [
		{H: "Errors",			I: "errors"	},
		{H: "Supply&nbsp;Voltage",	I: "voltage"	},
		{H: "Bias&nbsp;Current",	I: "bias"	},
		{H: "Temperature", 		I: "temperat"	},
		{H: "Tx&nbsp;Power&nbsp;(dBm)", I: "txpower"	},
		{H: "Rx&nbsp;Power&nbsp;(dBm)", I: "rxPowTxt"	}
	];
	this.createMsrEntry = function(n) {
		var r = document.createElement("tr");
		var hdr = this.createHeader(this.statusMsrEntries[n].H,"rht");
		r.appendChild(hdr);
		var id = this.statusMsrEntries[n].I;
		var c = createTextBox(id);
		r.appendChild(c);
		return r;
	}
	this.createMeasurementTable = function() {
		var rootNode = document.createElement("table");
		rootNode.id = "tablemeas";
		rootNode.cellpadding = "3";
		rootNode.cellspacing = "3";
		rootNode.style.cssFloat = "right";
		for (var i = 0; i < this.statusMsrEntries.length; ++i) {
			rootNode.appendChild(this.createMsrEntry(i));
		}
		return rootNode;
	}
	this.container.appendChild(this.createGlobalHeader());
	this.container.appendChild(this.createContent());
	this.getContainer = function() {
		return this.container;
	}
	this.showData = function(st, f) {
		if (this.fiberFocused != f.n) {
			this.fiberFocused = f.n;
		}
		this.setGlobalHeader(this.fiberFocused);
		var d = st.data.fiber[this.fiberFocused];
		for (var i = 0; i < this.statusLedEntries.length; ++i) {
			var alarm;
			switch (i) {
			case 0: alarm = d.freqSyncAlarm; break;
			case 1: alarm = d.gtpSyncAlarm; break;
			case 2: alarm = d.dataLock; break;
			case 3: alarm = d.dataSync; break;
			case 4: alarm = d.foStatusFail; break;
			case 5: alarm = d.txFaultAlarm; break;
			case 6: alarm = d.rxLossAlarm; break;
			}
			var id = this.statusLedEntries[i].I;
			ledSetColor(id, (alarm == 2) ? "red"
				: (alarm == 1) ? "yellow"
				: "green");			
		}
		for (var i = 0; i < this.statusMsrEntries.length; ++i) {
			var num, alarm;
			switch (i) {
			case 0: num = d.errors; 
				alarm = 0;
				break;
			case 1: num = d.volt;
				alarm = d.voltAlarm; 
				break;
			case 2: num = d.bias;
				alarm = d.biasAlarm;
				break;
			case 3: num = d.temperature;
				alarm = d.tempAlarm;
				break;
			case 4: num = d.tx;
				alarm = d.txPowAlarm;
				break;
			case 5: num = d.rx;
				alarm = d.rxPowAlarm;
				break;
			default: num = alarm = 0; break;
			}
			var id = this.statusMsrEntries[i].I;
			var p = (id == "errors" ? 0 : ( id == "voltage" ? 2 : 1) );
			try {
				var el = document.getElementById(id);
				el.innerHTML = num.toFixed(p);
				el.style.color = ((alarm == 2) ? "red" 
					: ((alarm == 1) ? "yellow": "#802000"));
			} catch (err) {}
		}
	}
}

var fst = new fiberStatusTable();

function fiberLinksTable() {
	this.name = "flt";
	this.SFPNR = 8;
	this.fiberFocused = this.SFPNR - 2;
	this.isFirstTime = true;
	this.detmodMask = 0;
	this.container = document.createElement("div");
	this.container.id = this.name;
	this.container.style.minWidth = "100px";
	this.getContainer = function() {
		return this.container;
	}
	this.createContent = function() {
		var t = document.createElement("table");
		t.className = "contenttable";
		var tb = document.createElement("tbody");
		t.appendChild(tb);
		for (var i = 0; i < this.SFPNR; ++i) {
			var k = (i + this.SFPNR - 2) % this.SFPNR;
			var r = this.createFiberLink(k);
			tb.appendChild(r);
		}
		return t;
	}
	this.createFiberLink = function(n) {
		var r = document.createElement("tr");
		var d = document.createElement("td");
		d.style.borderSpacing = "0px";
		r.appendChild(d);
		d.appendChild(this.createLink(n));
		var id = "fiber_led_"+(n + 1).toString();
		r.appendChild(createLedBox(id));
		return r;
	}
	this.fiberLinkText = function(n) {
		var t;
		if (n == this.SFPNR - 2) {
			t = "MASTER";
		} else if (n == this.SFPNR - 1) {
			t = "EXPANSION";
		} else {
			t = "REMOTE&nbsp;"+(n+1).toString();
		}
		return t;
	}
	this.createLink = function(n) {
		var t = this.fiberLinkText(n);
		var el = document.createElement("a");
		el.id = "fiberlink_"+n;
		el.fiberNr = n;
		el.objectOwner = this;
		el.innerHTML = t;
		el.className = "mg";
		el.style.minWidth = "115px";
		el.style.fontSize = "11px";
		return el;
	}
	this.container.appendChild(this.createContent());
	this.showData = function(st) {
		this.showLeds(st);
		this.showLinks(st);
		this.showOutlines();
	}
	this.showLeds = function(st) {
		for (var i = 0; i < this.SFPNR; ++i) {
			var id = "fiber_led_"+(i + 1).toString();
			var c;
			if (!(st.data.detmod & (1 << i))) {
				c = "grey";
			} else {
				var d = st.data.fiber[i];
				var alarm = (d.lossComm
					|| (d.rxLossAlarm == 2)
					|| (d.foStatusFail == 2));
				var warning = ((d.rxLossAlarm == 1)
					|| (d.foStatusFail == 1));
				c = (alarm ? "red" : (warning ? "yellow" : "green"));
			}
			ledSetColor(id, c);
		}
	}
	this.showLinks = function(st) {
		if (this.isFirstTime) {
			if (st.data.detmod & (1 << (this.SFPNR - 2))) {
				this.fiberFocused = this.SFPNR - 2;
				this.isFirstTime = false;
			}
		}
		for (var i = 0, mask = 1; i < this.SFPNR; ++i, mask <<= 1) {
			if ((st.data.detmod & mask) == (this.detmodMask & mask)) {
				continue;
			}
			if (st.data.detmod & mask) {
				if (this.isFirstTime) {
					this.fiberFocused = i;
					this.isFirstTime = false;
				}
				this.linkSet(i);
			} else {
				this.linkClr(i);
			}
		}
	}
	this.linkSet = function(n) {
		try {
			var el = document.getElementById("fiberlink_"+n);
			el.className = "m";
			el.href = "#";
			el.onclick = function(ev) {
				this.objectOwner.fiberFocused = this.fiberNr;
				cursorWait();
			}
			this.detmodMask |= (1 << n);
		} catch(err) { tryConsole("error linkSet "+n); }
	}
	this.linkClr = function(n) {
		try {
			var el = document.getElementById("fiberlink_"+n);
			el.className = "mg";
			el.href = null ;
			el.style.pointerEvents = "none";
			this.detmodMask &= ~(1 << n);
		} catch (err) { tryConsole("error LinkClr "+n); }
	}
	this.getFiberFocused = function() {
		return {n: this.fiberFocused, text: this.fiberLinkText(this.fiberFocused)};
	}
	this.showOutlines = function() {
		for (var i = 0, mask = 1; i < this.SFPNR; ++i, mask <<= 1) {
			var el = document.getElementById("fiberlink_"+i);
			try {
				if (i == this.fiberFocused) {
					el.parentNode.style.outline = "thin solid #bb3902";
				} else {
					el.parentNode.style.outline = "none";
				}
			} catch (err) {}
		}		
	}
}

var flt = new fiberLinksTable();

function Temperature() {
	this.ALARMTEMP = 85;
	this.container;
	this.create = function() {
		var box = document.createElement("div");
		var tbl = document.createElement("table");
		tbl.style.width = "100%";
		tbl.style.marginLeft = "auto";
		tbl.style.marginRight = "auto";
		box.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var tr = document.createElement("tr");
		tb.appendChild(tr);
		var td = document.createElement("th");
		td.innerHTML = "Temperature";
		td.style.textAlign = "left";
		tr.appendChild(td);
		td = document.createElement("td");
		td.id = "boardTempMet";
		tr.appendChild(td);
		var s = {min: -40, low_alarm: -40, low_warn: -40, high_warn: 80, high_alarm: 85, max: 90 };
		var boardTempMet = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
		boardTempMet.attachTo(td);
		boardTempMet.valueSet(s.min);
		boardTempMet.setFloat("right");
		td = createLedBox("boardTempLed");
		tr.appendChild(td);
		td = document.createElement("td");
		td.id = "boardTempTxt";
		td.style.width = "20px";
		td.style.textAlign = "center";
		td.className = "tabval";
		td.innerHTML = "30";
		tr.appendChild(td);
		td = document.createElement("td");
		tr.appendChild(td);
		td.innerHTML = "&ordm;C";
		tr = document.createElement("tr");
		tb.appendChild(tr);
		td = document.createElement("td");
		td.colSpan = 2;
		tr.appendChild(td);
		return box;
	}
	this.getContainer = function() {
		return this.container;
	}
	this.set = function(val) {
		try {
			ledSetColor("boardTempLed", val > this.ALARMTEMP ?  "red" : "grey");
			var el = document.getElementById("boardTempMet");
			if (typeof(el) != "undefined" && el) {
				var elmet = el.mMeter;
				if (!isNaN(val))
					elmet.valueSet(val);
				else
					elmet.valueSet(board_temp_settings.min);
			}
			var eltxt = document.getElementById("boardTempTxt");
			if (!isNaN(val)) {
				eltxt.innerHTML = val.toFixed(0);
			} else {
				eltxt.innerHTML = "---";
			}
		} catch(err) {}
	}
	this.container = this.create();
}

var temperature = new Temperature();

function hwFail() {
	this.container;
	this.id = "hwFail";
	this.create = function() {
		var box = document.createElement("div");
		var tbl = document.createElement("table");
		tbl.style.width = "100%";
		tbl.style.marginLeft = "auto";
		tbl.style.marginRight = "auto";
		box.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var tr = document.createElement("tr");
		tb.appendChild(tr);
		var td = document.createElement("th");
		td.innerHTML = "Hw.&nbsp;Fail";
		td.style.textAlign = "right";
		tr.appendChild(td);
		var c = createLedBox(this.id);
		tr.appendChild(c);
		return box;
	}
	this.getContainer = function() {
		return this.container;
	}
	this.set = function(alarm) {
		ledSetColor(this.id, alarm ? "red" : "grey");
	}
	this.container = this.create();
}

var hwfail = new hwFail();

function renderUnitContent() {
	var unitTab = document.createElement("table");
	unitTab.className = "contenttable";
	var tab = document.createElement("tbody");
	unitTab.appendChild(tab);
	var row1 = document.createElement("tr");
	tab.appendChild(row1);
	var row2 = document.createElement("tr");
	tab.appendChild(row2);
	var cell, el;
	cell = document.createElement("td");
	cell.className = "contentcell";
	cell.appendChild(fst.getContainer());
	row1.appendChild(cell);
	cell = document.createElement("td");
	cell.rowSpan = 2;
	cell.style.minWidth = "30px";
	row1.appendChild(cell);
	cell = document.createElement("td");
	cell.className = "contentcell";
	row1.appendChild(cell);
	cell.appendChild(flt.getContainer());
	cell = document.createElement("td");
	cell.className = "contentcell";
	cell.appendChild(temperature.getContainer());
	row2.appendChild(cell);
	cell = document.createElement("td");
	cell.className = "contentcell";
	cell.appendChild(hwfail.getContainer());
	row2.appendChild(cell);
	return unitTab;
}

function renderStatus(st) {
	try {
		temperature.set(st.data.temperature);
		hwfail.set(st.data.hwfail);
		flt.showData(st);
		var f = flt.getFiberFocused();
		fst.showData(st, f);
		cursorClear();
	} catch (err) {}
}

function createTextBox(id){
	var tdNode = document.createElement("td");
	tdNode.id = id;
	tdNode.innerHTML = "0";
	tdNode.style.textAlign = "center";
	tdNode.className = "tabval";
	return tdNode;
}

function createLedBox(id) {
	var tdNode = document.createElement("td");
	tdNode.style.minWidth = "50px";
	var led = document.createElement("img");
	led.id = id;
	led.src = "/bullet_grey.png";
	led.className = "centered";
	led.align = "center";
	tdNode.appendChild(led);
	return tdNode;
}

function ledSetColor(id, color) {
	try {
		var led = document.getElementById(id);
		if (color == "red") {
			led.src = "/bullet_red.png";
		} else if (color == "green") {
			led.src = "/bullet_green.png";
		} else if (color == "yellow") {
			led.src = "/bullet_yellow.png";
		} else if (color == "grey") {
			led.src = "/bullet_grey.png";
		} else {
			led.src = "/bullet_grey.png";
		}
	} catch (err) {}
}

function mMeter(min, max, loA, hiA, loW, hiW) {
	this.mMax = max;
	this.mMin = min;
	this.mVal = max;
	this.mLowAlarm = loA;
	this.mHighAlarm = hiA;
	this.mLowWarning = loW;
	this.mHighWarning = hiW;
	this.mDiv = document.createElement("div");
	this.mSpan = document.createElement("span");
	this.mDiv.appendChild(this.mSpan);
	this.mDiv.className = "meter";
	this.mDiv.style.width = "40px";
	this.getDiv = function ()  {
		return this.mDiv;
	}
	this.attachTo = function(parent) {
		try {
			parent.mMeter = this;
			parent.appendChild(this.mDiv);
		} catch (err) {}
	}
	this.valueSet = function(val, color) {
		try {
			var percent;
			if (typeof(val) === "undefined" || val == null || isNaN(val) || isNaN(parseInt(val)) || val <= this.mMin)
				percent = 0;
			else if (val >= this.mMax)
				percent = 100;
			else
				percent = 100*(val - this.mMin)/(this.mMax - this.mMin);
			this.mSpan.style.width = ""+percent.toFixed(0)+"%";
			var bColor;
			if (typeof(color) === 'undefined') {
				if (typeof(val) === "undefined" || val == null || isNaN(val) || isNaN(parseInt(val)))
					bColor = "rgb(43,194,83)";
				else if (val < this.mLowAlarm)
					bColor = "#df4040";
				else if (val < this.mLowWarning)
					bColor = "#f1a165";
				else if (val > this.mHighAlarm)
					bColor = "#df4040";
				else if (val > this.mHighWarning)
					bColor = "#f1a165";
				else
					bColor = "rgb(43,194,83)";
			} else
				bColor = color;
			this.mSpan.style.backgroundColor = bColor;
		} catch (err) {}
	}
	this.setFloat = function(floatType) {
		try {
			this.mDiv.style.cssFloat = floatType;
		} catch (err) {}
	}
}
	
function createMetRow(id, s, units, title, f) {
	var trNode = document.createElement("tr");
	var tdNode;
	if (title) {
		tdNode = document.createElement("th");
		tdNode.innerHTML = title;
		tdNode.style.textAlign = "left";
		trNode.appendChild(tdNode);
	}
	tdNode = document.createElement("td");
	tdNode.id = "met_"+id;
	var met = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
	met.attachTo(tdNode);
	met.valueSet(s.min);
	if (f) {
		met.setFloat(f);
	}
	trNode.appendChild(tdNode);
	tdNode = document.createElement("td");
	tdNode.id = "txt_"+id;
	tdNode.className = "tabval";
	tdNode.style.textAlign = "center";
	tdNode.innerHTML = s.min;
	trNode.appendChild(tdNode);
	tdNode = document.createElement("td");
	tdNode.innerHTML = units;
	trNode.appendChild(tdNode);
	return trNode;
}

function setMetValue(id, val, color) {
	try {
		var met = document.getElementById("met_"+id).mMeter;
		if (met) {
			if (typeof(color) !== "undefined") {
				if (color.toLowerCase() == "normal")
					color = met.colorNormal;
				else if (color.toLowerCase() == "warning")
					color = met.colorWarn;
				else if (color.toLowerCase() == "alarm")
					color = met.colorAlarm;
			}
			met.valueSet(val, color);
		}
		var txt = document.getElementById("txt_"+id);
		if (txt && txt.innerHTML) {
			if (isNaN(val))
				txt.innerHTML = val;
			else
				txt.innerHTML = val.toFixed(1);
		}
	} catch (err) { }
}

// -->