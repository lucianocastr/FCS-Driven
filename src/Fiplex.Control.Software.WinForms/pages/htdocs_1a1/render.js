<!--
ch_Bw_Txt = ["90", "45", "30", "20", "15"];

var hpa_settings = [{min: -20, low_alarm: -20, low_warn: -20, high_warn: 19, high_alarm: 22, max: 25 },
		    {min:   0, low_alarm:   0, low_warn:  25, high_warn: 37, high_alarm: 40, max: 45 }];
var board_temp_settings = {min: -40, low_alarm: -40, low_warn: -40, high_warn: 80, high_alarm: 85, max: 90 };
var chRfIn_settings = [{min: -110, low_alarm: -121, low_warn: -121, high_warn: 0, high_alarm: 0, max: 0 }, 
		       {min:  -90, low_alarm: -121, low_warn: -121, high_warn: -20, high_alarm: -20, max: -20 }];
var chRfOut_settings = [{min: -35, low_alarm: 20, low_warn: 20, high_warn: 36, high_alarm: 40, max: 25 },
			{min: -20, low_alarm: 20, low_warn: 20, high_warn: 36, high_alarm: 40, max: 40 }];
var chIsolM_settings = {min: 50, low_alarm: 50, low_warn: 60, high_warn: 100, high_alarm: 120, max: 120 };
var agc_settings = [{min: 0, low_alarm: 0, low_warn: 0, high_warn: 80, high_alarm: 80, max: 80 },
		    {min: 0, low_alarm: 0, low_warn: 0, high_warn: 40, high_alarm: 40, max: 40 }];

function renderPage() {
	var rootEl = document.createElement("div");
	document.getElementById("page").appendChild(rootEl);
	rootEl.id = "rootElement";
	var unit = new renderUnit(0);
	rootEl.appendChild(unit);
	for (var i = 1, mask = 1; i <= window.top.MaxChNr; ++i) {
		if (window.top.showChannelsBitmask & mask) {
			var unit = new renderUnit(i);
			rootEl.appendChild(unit);
		}
		mask <<= 1;
	}
}

function removeAllElements() {
	remove_element(document.getElementById("rootElement"));
}

function renderUnit(nr) {
	var unitDiv = document.createElement("div");
	unitDiv.id = "unitDiv"+nr;
	unitDiv.className = "unitbox";
	var headDiv = createUnitHead(nr);
	unitDiv.appendChild(headDiv);
	var contentDiv = document.createElement("div");
	unitDiv.appendChild(contentDiv);
	contentDiv.className = "contentbox";
	contentDiv.id = "contentDiv"+nr;
	var tab = (nr == 0 ? renderContentCtrl(window.top.MaxChNr, window.top.showChannelsBitmask) : renderContentChannel(nr));
	contentDiv.appendChild(tab);
	return unitDiv;
}

function createUnitHead(nr) {
	var box = document.createElement("div");
	box.className = "headbox";
	var tab = document.createElement("table");
	box.appendChild(tab);
	tab.className = "headtable";
	var tb = document.createElement("tbody");
	tab.appendChild(tb);
	var row = document.createElement("tr");
	tb.appendChild(row);
	var cell = document.createElement("td");
	row.appendChild(cell);
	cell.className = "small";
	cell.style.paddingLeft = "20px";
	if (nr > 0)
		cell.innerHTML = Texts['FILTER']+"&nbsp;"+nr;
	cell = document.createElement("td");
	row.appendChild(cell);
	if (nr == 0) {
		cell.id = "tagName";
		cell.innerHTML = "Tag";
	} else {
		var el = createChannelEnable(nr);
		cell.appendChild(el);
	}
	cell.className = "tag";
	cell.style.width = "100%";
	cell.style.textAlign = "center";
	if (nr > 0) {
		cell = document.createElement("td");
		cell.id = "modsysName"+nr;
		cell.style.whiteSpace = "nowrap";
		cell.style.minWidth = "110px";
		cell.style.textAlign = "right";
		cell.style.paddingRight = "10px";
		row.appendChild(cell);
	}
	cell = document.createElement("td");
	row.appendChild(cell);
	var hideButton = document.createElement("input");
	hideButton.type = "button";
	cell.appendChild(hideButton);
	hideButton.channelNr = nr;
	hideButton.hiddenState = false;
	hideButton.className = "buttonexpand";
	hideButton.onclick = function hideContent(ev) {
		ev = ev || window.event;
		var el = ev.target ? ev.target : ev.srcElement;
		var nr = el.channelNr;
		el.hiddenState = !el.hiddenState || false;
		el.style.backgroundImage = el.hiddenState? "url('/maximize.png')" : "url('/minimize.png')";
		var contentDiv = document.getElementById("contentDiv"+nr);
		contentDiv.style.display = el.hiddenState? "none" : "block";
	}
	return box;
}

function setTag(name) {
	try {
		var tag = document.getElementById("tagName");
		if(typeof String.prototype.trim !== 'function'){
			  String.prototype.trim = function() {
				return this.replace(/^\s+|\s+$/g, ''); 
			}
		}		
		tag.innerHTML = name.trim();
	} catch (err) {}
}

function createChannelEnable(nr) {
	var box = document.createElement("div");
	box.id = "chSwBox"+nr;
	box.style.border = "medium solid #00AAAA";
	box.style.width = "50%";
	box.style.height = "10px";
	box.style.verticalAlign = "middle";
	box.style.textAlign = "center";
	box.style.padding = "2px";
	box.style.backgroundColor = "#D0FFD0";
	box.style.borderStyle = "inset";
	box.style.borderRadius = "3px";
	box.style.marginLeft = "auto";
	box.style.marginRight = "auto";
	box.onmouseover = function() { this.style.borderColor = "#3030A0"; };
	box.onmouseout = function() { this.style.borderColor = "#30AAAA"; };
	var lbl = document.createElement("label");
	box.appendChild(lbl);
	lbl.id = "chSwLbl"+nr;
	lbl.className = "togglebuttonlabel";
	lbl.setAttribute("unselectable", "on");
	lbl.style.whiteSpace = "nowrap";
	lbl.style.fontWeight = "bold";
	lbl.style.display = "inline-block";
	lbl.style.width = "100%";
	lbl.style.height = "100%";
	lbl.innerHTML = "ON";
	var el = document.createElement("input");
	el.id = "chSwInp"+nr;
	el.name = el.id;
	el.type = "checkbox";
	el.className = "hidden";
	box.appendChild(el);
	el.style.marginRight = "2px";
	el.checked = true;
	var id = el.id;
	lbl.setAttribute("for", id);
	el.onclick = function() { chSwToggle(nr); submitform(); };
	return box;
}

function chSwToggle(nr) {
	try {
		var box = document.getElementById("chSwBox"+nr);
		var lbl = document.getElementById("chSwLbl"+nr);
		var el =  document.getElementById("chSwInp"+nr);
		if (!box || !lbl || !el)
			return;
		if (el.checked) {
			lbl.innerHTML = "ON";
			box.style.backgroundColor = "#C0FFC0";
			lbl.style.color = "#000000";
			box.style.borderStyle = "inset";
		} else {
			lbl.innerHTML = "OFF";
			box.style.backgroundColor = "#df4040";
			lbl.style.color = "#ffffff";
			box.style.borderStyle = "outset";
		}
	} catch (err) { }
}

function chIsOn(nr) {
	try {
		var el = document.getElementById("chSwInp"+nr);
		if (el)
			return el.checked;
		else
			return null;
	} catch (err) {	return false; }
}

function chSwSet(nr, on) {
	try {
		var box = document.getElementById("chSwBox"+nr);
		var lbl = document.getElementById("chSwLbl"+nr);
		var el =  document.getElementById("chSwInp"+nr);
		if (!box || !lbl || !el)
			return;
		el.checked = on ? true : false;
		if (el.checked) {
			lbl.innerHTML = Texts['CHON'];
			lbl.style.color = "#000000";
			box.style.backgroundColor = "#D0FFD0";
			box.style.borderStyle = "inset";
		} else {
			lbl.innerHTML = Texts['CHOFF'];
			lbl.style.color = "#ffffff";
			box.style.backgroundColor = "#df4040";
			box.style.borderStyle = "outset";
		}
	} catch(err) { }
}

function renderContentCtrl(maxChannels, chMask) {
	var tab = document.createElement("table");
	tab.className = "contenttable";
	var row = document.createElement("tr");
	tab.appendChild(row);
	var cell = document.createElement("td");
	row.appendChild(cell);
	cell.className = "contentcell";
	cell.rowSpan = 2;
	var el = createChFreqCtlBox(maxChannels, chMask);
	cell.appendChild(el);
	for (var i = 0; i < 2; ++i) {
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.className = "contentcell";
		el = createBandBox(i);
		cell.appendChild(el);
	}
	row = document.createElement("tr");
	tab.appendChild(row);
	cell = document.createElement("td");
	row.appendChild(cell);
	cell.colSpan = 2;
	cell.className = "contentcell";
	el = createGralCtlBox();
	cell.appendChild(el);
	return tab;
}

function createChFreqCtlBox(maxChannels, chMask) {
	var box = document.createElement("div");
	var tab = document.createElement("table");
	box.appendChild(tab);
	var row = document.createElement("tr");
	tab.appendChild(row);
	var cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = "Filter";
	cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = Texts['DISPLAY'];
	cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = "UL&nbsp;(MHz)";
	cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = "DL&nbsp;(MHz)";
	if (modsys.enabledSystemsNr() > 1) {
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "System";
	}
	for (var i = 1; i <= maxChannels; ++i) {
		var el = createChFreq(i, chMask);
		tab.appendChild(el);
	}
	return box;
}

function createChFreq(nr, chMask) {
	var row = document.createElement("tr");
	var cell = document.createElement("td");
	row.appendChild(cell);
	cell.innerHTML = nr.toString();
	cell = document.createElement("td");
	row.appendChild(cell);
	var en = document.createElement("input")
	en.type = "checkbox";
	en.id = "chDisplay"+nr;
	en.name = en.id;
	var mask = (1 << (nr-1));
	en.checked = (chMask & mask) != 0;
	en.onclick = function() {
		setChannelsDisplay();
		renderConf(true, false);
	}
	cell.appendChild(en);
	for (i = 0; i < 2; ++i) {
		cell = document.createElement("td");
		row.appendChild(cell);
		var fr = document.createElement("input")
		fr.type = "text";
		fr.id = "chFreq"+nr+i;
		fr.name = fr.id;
		fr.size = "11";
		fr.className = "number";
		fr.channel = nr;
		fr.path	= i;
		fr.title = "Min: "+(factory.data.band[i].fStart/1e6) +", Max: "+(factory.data.band[i].fStop/1e6)+" MHz";
		fr.disabled = !en.checked;
		fr.style.backgroundColor =  en.checked ? "white" : "#CCCCCC";
		fr.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		fr.onchange = function(ev) {
			ev = ev || window.event;
			var target = ev.target ? ev.target : ev.srcElement;
			var fr = getFreqCh(target.channel, target.path);
			var b = target.path;
			var c = target.channel - 1;
			var num;
			if (fr < factory.data.band[b].fStart || fr > factory.data.band[b].fStop) {
				num = config.conf.band[b].ch[c].frqNr;
			} else {
				num = config.computeChNum(fr, b);
				if (isNaN(num))
					config.conf.band[b].ch[c].frqNr;
			}
			fr = config.computeChFreq(num, b);
			setFreqCh(target.channel, target.path, fr);
			num = config.computeChNrOtherBand(num, b);
			b = (b + 1) % 2;
			fr = config.computeChFreq(num, b);
			setFreqCh(target.channel, b, fr);
		}
		cell.appendChild(fr);
	}
	var nsystems = modsys.enabledSystemsNr() ;
	if (nsystems > 1) {
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("select");
		el.id = "modsys"+nr;
		el.name = el.id;
		el.channel = nr;
		for (var i = 0; i < modsys.modsysMaxNr; ++i) {
			modsys.parse(i);
			if (modsys.data.disabled)
				continue;
			var opt = document.createElement("option");
			opt.text = modsys.data.sysname;
			opt.value = i;
			opt.style.fontSize = "10px";
			el.options.add(opt);
		}
		el.onchange = function(ev) {
			ev = ev || window.event;
			var target = ev.target ? ev.target : ev.srcElement;
			var nr = target.channel;
			var sys = target.selectedIndex;
			for (var i = 0; i < 2; ++i) {
				var e = document.getElementById("chBw"+nr+i);
				if (!e)
					continue;
				chBwRemoveOptions(e);
				chBwAddOptions(e, sys, i);
			}
		}
		el.style.size = "15";
		el.style.minWidth = "110px";
		el.style.fontSize = "10px";
		cell.appendChild(el);
	}
	return row;
}

function getModsys(n) {
	try {
		var el = document.getElementById("modsys"+n);
		if (el)
			return el.selectedIndex;
		return modsys.defaultSystem;
	} catch (err) { return modsys.defaultSystem; }
}

function setModsys(n, val) {
	try {
		var el = document.getElementById("modsys"+n);
		if (!el)
			return;
		if (val > el.options.length)
			return;
		el.selectedIndex = val;
		var txt = el.options.item(el.selectedIndex).text;
		el = document.getElementById("modsysName"+n);
		if (el)
			el.innerHTML = txt;
	} catch (err) {}
}
function setChannelsDisplayEn() {
	for (var i = 0; i < window.top.MaxChNr; ++i) {
		try {
			var c = i + 1;
			var el = document.getElementById("chDisplay"+c);
			var mask = (1 << i);
			var on = (config.getChannelsEnabledMask() & mask) != 0;
			el.checked = on;
			el.disabled = on;
		} catch (err) {}
	}
}
function setChannelsDisplay() {
	var currentMask = 0;
	for (var i = 1, mask = 1; i <= window.top.MaxChNr; ++i) {
		try {
			var show = document.getElementById("chDisplay"+i).checked;
			if (show)
				currentMask |= mask;
			for (var j = 0; j < 2; ++j) {
				var el = document.getElementById("chFreq"+i+j);
				el.disabled = !show;
				el.style.backgroundColor =  show ? "white" : "#CCCCCC";
			}
			mask <<= 1;
		} catch(err) { }
	}
	window.top.showChannelsBitmask = currentMask;
}

function setFreqCh(nr, dn, frq) {
	try {
		var val = (frq / 1.0e6).toFixed(6);
		var el = document.getElementById("chFreq"+nr+(dn? 1: 0));
		if (el)
			el.value = val;
		var disp = document.getElementById("chFreqDisp"+nr+(dn? 1: 0));
		if (disp)
			disp.innerHTML = val;
	} catch (err) { }
}

function getFreqCh(nr, dn) {
	try {
		var el = document.getElementById("chFreq"+nr+(dn? 1: 0));
		return ~~Math.round(parseFloat(el.value) * 1.0e6);
	} catch (err) { return Number.NaN; }
}

function createBandBox(dn) {
	var box = document.createElement("div");
	var tab = document.createElement("table");
	box.appendChild(tab);
	var body = document.createElement("tbody");
	tab.appendChild(body);
	var row = document.createElement("tr");
	body.appendChild(row);
	var cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = dn ? Texts['DNLINK'] : Texts['UPLINK'];
	cell.colSpan = 2;
	cell.className = 'nh';
	cell.style.color = '#fb7922';
	row = document.createElement("tr");
	body.appendChild(row);
	cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = Texts['INPUT'];
	cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = Texts['OUTPUT'];
	row = document.createElement("tr");
	body.appendChild(row);
	cell = document.createElement("td");
	row.appendChild(cell);
	cell.className = "tabbox";
	var el = createBandCtrlBox(dn);
	cell.appendChild(el);
	cell = document.createElement("td");
	row.appendChild(cell);
	cell.className = "tabbox";
	el = createBandOutBox(dn);
	cell.appendChild(el);
	return box;
}

function createBandCtrlBox(dn) {
	var box = document.createElement("div");
	var tab = document.createElement("table");
	box.appendChild(tab);
	var body = document.createElement("tbody");
	tab.appendChild(body);
	var row = createSquelchEnable(dn);
	body.appendChild(row);
	row = createSquelchThreshold(dn);
	body.appendChild(row);
	row = createMainGainLim(dn);
	body.appendChild(row);
	row = createMainPowerLim(dn);
	body.appendChild(row);
	row = createInputOverflow(dn);
	body.appendChild(row);
	return box;
}

function createSquelchEnable(dn) {
	var row = document.createElement("tr");
	var cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = Texts['SQUELCH'];
	cell.className = "thdrht";
	cell = document.createElement("td");
	row.appendChild(cell);
	var el = document.createElement("input");
	el.id = "sqEn"+(dn? 1 : 0);
	el.name = el.id;
	el.type = "checkbox";
	cell.appendChild(el);
	return row
}

function squelchEnSet(dn, on) {
	try {
		var el = document.getElementById("sqEn"+(dn? 1 : 0));
		el.checked = on? true: false;
	} catch (err) {}
}

function squelchEnIsSet(dn) {
	try {
		var el = document.getElementById("sqEn"+(dn? 1 : 0));
		return el.checked;
	} catch (err) {
		return false;
	}
}

function createSquelchThreshold(dn) {
	var row = document.createElement("tr");
	var cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = Texts['SQTHRS'];
	cell.className = "thdrht";
	cell = document.createElement("td");
	row.appendChild(cell);
	var el = document.createElement("input");
	el.id = "sqThr"+(dn? 1 : 0);
	el.name = el.id;
	el.type = "text";
	el.size = "4";
	el.onkeypress = function(ev) {
		return isKeyDecimalNumber(ev);
	}
	el.className = "number";
	el.title = "Min: "+config.conf.band[dn].squelchThrMin+", Max: "+config.conf.band[dn].squelchThrMax+" dBm";
	el.onchange = function(ev) {
		ev = ev || window.event;
		var target = ev.target ? ev.target : ev.srcElement;
		var dn = (target.id == "sqThr1" ? 1 : 0);
		var num = squelchThrGet(dn);
		if (num < config.conf.band[dn].squelchThrMin) {
			target.value = config.conf.band[dn].squelchThrMin;
		} else if (num > config.conf.band[dn].squelchThrMax) {
			target.value = config.conf.band[dn].squelchThrMax;
		} else {
			target.value = num;
		}
	}
	cell.appendChild(el);
	cell = document.createElement("td");
	row.appendChild(cell);
	cell.innerHTML = "dBm";
	cell.style.textAlign = "left";
	return row;
}

function squelchThrSet(dn, val) {
	try {
		var el = document.getElementById("sqThr"+(dn? 1 : 0));
		if (!isNaN(val))
			el.value = val;
	} catch (err) {}
}

function squelchThrGet(dn) {
	try {
		var el = document.getElementById("sqThr"+(dn? 1 : 0));
		return parseInt(el.value);
	} catch (err) {
		return -128;
	}
}

function createMainGainLim(dn) {
	var row = document.createElement("tr");
	var cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = Texts['GAINLIM'];
	cell.className = "thdrht";
	cell = document.createElement("td");
	row.appendChild(cell);
	var el = document.createElement("input");
	el.id = "mainGainLimit"+(dn? 1 : 0);
	el.name = el.id;
	el.type = "text";
	el.size = "4";
	el.onkeypress = function(ev) {
		return isKeyDecimalNumber(ev);
	}
	el.className = "number";
	el.title = "Min: "+config.conf.band[dn].mainGainMin+", Max: "+factory.data.band[dn].gainLim+" dB";
	el.onchange = function(ev) {
		ev = ev || window.event;
		var target = ev.target ? ev.target : ev.srcElement;
		var dn = (target.id == "mainGainLimit1" ? 1 : 0);
		var num = mainGainLimGet(dn);
		if (num < config.conf.band[dn].mainGainMin) {
			target.value = config.conf.band[dn].mainGainMin;
		} else if (num > factory.data.band[dn].gainLim) {
			target.value = factory.data.band[dn].gainLim;
		} else {
			target.value = num;
		}
	}
	cell.appendChild(el);
	cell = document.createElement("td");
	row.appendChild(cell);
	cell.innerHTML = "dB";
	cell.style.textAlign = "left";
	return row;
}

function mainGainLimSet(dn, val) {
	try {
		var el = document.getElementById("mainGainLimit"+(dn? 1 : 0));
		if (!isNaN(val))
			el.value = val.toString();
	} catch (err) { }
}

function mainGainLimGet(dn) {
	try {
		var el = document.getElementById("mainGainLimit"+(dn? 1 : 0));
		return parseInt(el.value);
	} catch (err) { return -128; }
}

function createMainPowerLim(dn) {
	var row = document.createElement("tr");
	var cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = Texts['POWERLIM'];
	cell.className = "thdrht";
	cell = document.createElement("td");
	row.appendChild(cell);
	var el = document.createElement("input");
	el.id = "mainPowerLimit"+(dn? 1 : 0);
	el.name = el.id;
	el.type = "text";
	el.size = "4";
	el.onkeypress = function(ev) {
		return isKeyDecimalNumber(ev);
	}
	el.className = "number";
	el.title = "Min: "+(factory.data.band[dn].powerLim - config.conf.band[dn].mainPowerRange)+", Max: "+factory.data.band[dn].powerLim+" dBm";
	el.onchange = function(ev) {
		ev = ev || window.event;
		var target = ev.target ? ev.target : ev.srcElement;
		var dn = (target.id == "mainPowerLimit1" ? 1 : 0);
		var num = mainPowerLimGet(dn);
		if (num < (factory.data.band[dn].powerLim - config.conf.band[dn].mainPowerRange)) {
			target.value = (factory.data.band[dn].powerLim - config.conf.band[dn].mainPowerRange);
		} else if (num > factory.data.band[dn].powerLim) {
			target.value = factory.data.band[dn].powerLim;
		} else {
			target.value = num;
		}
	}
	cell.appendChild(el);
	cell = document.createElement("td");
	row.appendChild(cell);
	cell.innerHTML = "dBm";
	cell.style.textAlign = "left";
	return row;
}

function mainPowerLimSet(dn, val) {
	try {
		var el = document.getElementById("mainPowerLimit"+(dn? 1 : 0));
		if (!isNaN(val))
			el.value = val.toString();
	} catch (err) { }
}

function mainPowerLimGet(dn) {
	try {
		var el = document.getElementById("mainPowerLimit"+(dn? 1 : 0));
		return parseInt(el.value);
	} catch (err) { return -128; }
}

function createInputOverflow(dn) {
	var row = document.createElement("tr");
	var cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = Texts['OVF'] + (dn?"&nbsp;DL":"&nbsp;UL");;
	cell.className = "thdrht";
	cell = createLedBox("rfOvfLed"+dn);
	row.appendChild(cell);
	return row;
}

function ovfLedSet(dn, color) {
	ledSetColor("rfOvfLed"+dn, color);
}

function createTbsError() {
	var box = document.createElement("div");
	var row = document.createElement("tr");
	box.appendChild(row);
	var cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = Texts['TBS'];
	cell.className = "thdrht";
	cell = createLedBox("tbsErr");
	row.appendChild(cell);
	return box;
}

function tbsErrSet(color) {
	ledSetColor("tbsErr", color);
}

function createBandOutBox(dn) {
	var box = document.createElement("div");
	var tab = document.createElement("table");
	box.appendChild(tab);
	var body = document.createElement("tbody");
	tab.appendChild(body);
	var row = createHpaCtl(dn);
	body.appendChild(row);
	hpa_settings[dn].high_warn = factory.data.band[dn].powerLim;
	hpa_settings[dn].high_alarm = factory.data.band[dn].powerLim + factory.MAX_PWR_DELTA;
	row = createMetRow("rfOutPow"+dn, hpa_settings[dn], Texts['POWER'], "dBm");
	body.appendChild(row);
	row = document.createElement("tr");
	body.appendChild(row);
	var cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = Texts['PASTATUS'];
	cell.className = "thdrht";
	cell = createLedBox("hpaStatusLed"+dn);
	row.appendChild(cell);
	if (dn == 1) {
		row = document.createElement("tr");
		body.appendChild(row);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['PAOVF'];
		cell.className = "thdrht";
		cell = createLedBox("hpaOvf"+dn);
		row.appendChild(cell);
	}
	row = document.createElement("tr");
	body.appendChild(row);
	var cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = Texts['STAB'];
	cell.className = "thdrht";
	cell = createLedBox("loopErr"+dn);
	row.appendChild(cell);
	return box;
}

function createHpaCtl(dn) {
	var row = document.createElement("tr");
	var cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = Texts['ENABLE'];
	cell.className = "thdrht";
	cell = document.createElement("td");
	row.appendChild(cell);
	var el = createHpaSwitch(dn);
	cell.appendChild(el);
	return row
}

function createHpaSwitch(dn) {
	var box = document.createElement("div");
	box.id = "hpaSwBox"+(dn? 1 : 0);
	box.style.border = "medium solid #00AAAA";
	box.style.width = "40px";
	box.style.height = "10px";
	box.style.verticalAlign = "middle";
	box.style.textAlign = "center";
	box.style.padding = "2px";
	box.style.backgroundColor = "#D0FFD0";
	box.style.borderStyle = "inset";
	box.style.borderRadius = "3px";
	box.onmouseover = function() { this.style.borderColor = "#3030A0"; };
	box.onmouseout = function() { this.style.borderColor = "#30AAAA"; };
	var lbl = document.createElement("label");
	box.appendChild(lbl);
	lbl.id = "hpaSwLbl"+(dn? 1 : 0);
	lbl.className = "togglebuttonlabel";
	lbl.setAttribute("unselectable", "on");
	lbl.style.whiteSpace = "nowrap";
	lbl.style.fontWeight = "bold";
	lbl.style.display = "inline-block";
	lbl.style.width = "40px";
	lbl.style.height = "12px";
	lbl.innerHTML = "ON";
	var el = document.createElement("input");
	el.id = "hpaSwInp"+(dn? 1 : 0);
	el.name = el.id;
	el.type = "checkbox";
	el.className = "hidden";
	el.style.marginRight = "2px";
	el.checked = true;
	var id = el.id;
	lbl.setAttribute("for", id);
	el.onclick = function() { hpaSwToggle(dn); submitform(); };
	box.appendChild(el);
	return box;
}

function hpaSwToggle(dn) {
	try {
		var id = dn? 1 : 0;
		var box = document.getElementById("hpaSwBox"+id);
		var lbl = document.getElementById("hpaSwLbl"+id);
		var el =  document.getElementById("hpaSwInp"+id);
		if (el.checked) {
			lbl.innerHTML = "ON";
			box.style.backgroundColor = "#C0FFC0";
			lbl.style.color = "#000000";
			box.style.borderStyle = "inset";
		} else {
			lbl.innerHTML = "OFF";
			box.style.backgroundColor = "#df4040";
			lbl.style.color = "#ffffff";
			box.style.borderStyle = "outset";
		}
	} catch (err) { }
}

function hpaIsOn(dn) {
	try {
		var el = document.getElementById("hpaSwInp"+(dn? 1 : 0));
		return el.checked;
	} catch (err) {	return false; }
}

function hpaSwSet(dn, on) {
	try {
		var id = dn? 1 : 0;
		var box = document.getElementById("hpaSwBox"+id);
		var lbl = document.getElementById("hpaSwLbl"+id);
		var el =  document.getElementById("hpaSwInp"+id);
		el.checked = on ? true : false;
		if (el.checked) {
			lbl.innerHTML = "ON";
			lbl.style.color = "#000000";
			box.style.backgroundColor = "#D0FFD0";
			box.style.borderStyle = "inset";
		} else {
			lbl.innerHTML = "OFF";
			lbl.style.color = "#ffffff";
			box.style.backgroundColor = "#df4040";
			box.style.borderStyle = "outset";
		}
	} catch(err) { }
}

function hpaSwDisableStateSet(dn, disable) {
	try {
		var hpaEn = document.getElementById("hpaSwInp"+(dn? 1 : 0));
		hpaEn.disabled = disable? true : false;
	} catch (err) { }
}
	
function createMetRow(id, s, title, units) {
	var trNode = document.createElement("tr");
	var tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = title;
	tdNode.className = "thdrht";
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	tdNode.id = "met_"+id;
	var met = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
	met.attachTo(tdNode);
	met.valueSet(s.min);
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	tdNode.id = "txt_"+id;
	tdNode.style.width = "40px";
	tdNode.style.textAlign = "center";
	tdNode.className = "tabval";
	tdNode.innerHTML = "0";
	tdNode = document.createElement("td");
	tdNode.innerHTML = units;
	tdNode.style.textAlign = "center";
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

function rfOutPowSet(dn, val) {
	setMetValue("rfOutPow"+dn, val);
}
function statusHpaLedSet(dn, val) {
	ledSetColor("hpaStatusLed"+dn, val);
}
function loopErrSet(dn, color) {
	ledSetColor("loopErr"+dn, color);
}
function hpaOvfDL(color) {
	ledSetColor("hpaOvf1", color);
}

function createGralCtlBox() {
	var box = document.createElement("div");
	var tab = document.createElement("table");
	box.appendChild(tab);
	tab.style.width = "100%";
	tab.style.borderSpacing = "3px";
	var body = document.createElement("tbody");
	tab.appendChild(body);
	var row = document.createElement("tr");
	body.appendChild(row);
	var cell = document.createElement("td");
	row.appendChild(cell);
	var el = createUnitReset();
	cell.appendChild(el);
	cell = document.createElement("td");
	row.appendChild(cell);
	el = createFpgaError();
	cell.appendChild(el);
	cell = document.createElement("td");
	row.appendChild(cell);
	el = createTrackingEnable();
	cell.appendChild(el);
	cell = document.createElement("td");
	row.appendChild(cell);
	el = createMuteMode();
	cell.appendChild(el);
	cell = document.createElement("td");
	row.appendChild(cell);
	el = createTbsError();
	cell.appendChild(el);
	cell = document.createElement("td");
	row.appendChild(cell);
	el = createTempBoard();
	cell.appendChild(el);
	return box;
}

function createUnitReset() {
	var box = document.createElement("div");
	var reset = document.createElement("input");
	reset.id = "reset";
	reset.name = reset.id;
	reset.type = "button";
	reset.value = "RESET";
	reset.className = "resetbutton";
	reset.onclick = function() { submitform(true); } 
	box.appendChild(reset);
	return box;
}

function resetDisableStateSet(disable) {
	try {
		var el = document.getElementById("reset");
		el.disabled = disable? true : false;
	} catch (err) {}
}

function createFpgaError() {
	var box = document.createElement("div");
	var row = document.createElement("tr");
	box.appendChild(row);
	var cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = Texts['FPGA'];
	cell.className = "thdrht";
	cell = createLedBox("fpgaErr");
	row.appendChild(cell);
	return box;
}

function fpgaErrSet(color) {
	ledSetColor("fpgaErr", color);
}

function createTrackingEnable() {
	var box = document.createElement("div");
	var row = document.createElement("tr");
	box.appendChild(row);
	var cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = Texts["TRACKING"];
	cell.className = "thdrht";
	cell = document.createElement("td");
	row.appendChild(cell);
	var el = document.createElement("input");
	el.type = "checkbox";
	el.id = "tracking";
	el.name = el.id;
	el.onclick = function(ev) {
		ev = ev || window.event;
		var ob = ev.target ? ev.target : ev.srcElement;
		document.getElementById("sqEn1").disabled = ob.checked;
	}
	cell.appendChild(el);
	return box;
}

function setTrackingEnable(on) {
	try {
		var el = document.getElementById("tracking");
		el.checked = on;
		document.getElementById("sqEn1").disabled = el.checked;
	} catch (err) { }
}

function isTrackingEnable() {
	try {
		var el = document.getElementById("tracking");
		return el.checked;
	} catch (err) { return null;}
}

function createMuteMode() {
	var box = document.createElement("div");
	var row = document.createElement("tr");
	box.appendChild(row);
	var cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = Texts["MUTEMODE"];
	cell.className = "thdrht";
	cell = document.createElement("td");
	row.appendChild(cell);
	var el = document.createElement("select");
	el.id = "mutemode";
	el.name = el.id;
	var opts = [ Texts['INDEPENDENT'], Texts['LINKED'] ];
	for (var i = 0; i < 2; ++i) {
		var opt = document.createElement("option");
		el.options.add(opt);
		opt.text = opts[i];
		opt.value = i;
	}
	el.selectedIndex = 0;
	el.onchange = function() {
	}
	cell.appendChild(el);
	return box;
}

function setMuteMode(mode) {
	try {
		var el = document.getElementById("mutemode");
		el.selectedIndex = mode;
	} catch (err) { }
}

function isMuteModeLinked() {
	try {
		var el = document.getElementById("mutemode");
		return el.selectedIndex == 1;
	} catch (err) { return null;}
}

function createTempBoard() {
	var box = document.createElement("div");
	var tab = document.createElement("table");
	box.appendChild(tab);
	var tb = document.createElement("tbody");
	tab.appendChild(tb);
	var row = createMetRow("boardTemp", board_temp_settings, Texts['TEMPERATURE'], "&ordm;C");
	tb.appendChild(row);
	return box;
}

function boardTempSet(val) {
	setMetValue("boardTemp", val);
}

function renderContentChannel(nr) {
	var tab = document.createElement("table");
	tab.className = "contenttable";
	var tb = document.createElement("tbody");
	tab.appendChild(tb);
	var row = document.createElement("tr");
	tb.appendChild(row);
	for (var i = 0; i < 2; ++i) {
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.className = "contentcell";
		var chPathTable = document.createElement("table");
		cell.appendChild(chPathTable);
		var r = document.createElement("tr");
		chPathTable.appendChild(r);
		r.colSpan = 2;
		var c = document.createElement("th");
		r.appendChild(c);
		c.innerHTML = (i == 0 ? Texts['UPLINK'] : Texts['DNLINK']);
		c.className = 'nh';
		c.style.color = '#fb7922';
		c.colSpan = 2;
		r = document.createElement("tr");
		chPathTable.appendChild(r);
		c = document.createElement("td");
		r.appendChild(c);
		var el = createChCtrl(nr, i);
		c.appendChild(el);
		c = document.createElement("td");
		r.appendChild(c);
		el = createChStat(nr, i);
		c.appendChild(el);
	}
	return tab;
}

function createChCtrl(nr, dn) {
	var tab = document.createElement("table");
	var tb = document.createElement("tbody");
	tab.appendChild(tb);
	var row = document.createElement("tr");
	tb.appendChild(row);
	var cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = Texts['FREQUENCY'];
	cell.className = "thdrht";
	cell = document.createElement("td");
	row.appendChild(cell);
	cell.id = "chFreqDisp"+nr+dn;
	cell = document.createElement("td");
	row.appendChild(cell);
	cell.innerHTML = "MHz";
	row = document.createElement("tr");
	tb.appendChild(row);
	cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = Texts['FINEGAIN'];
	cell.className = "thdrht";
	cell = document.createElement("td");
	row.appendChild(cell);
	var el = createFineGainLim(nr, dn);
	cell.appendChild(el);
	cell = document.createElement("td");
	row.appendChild(cell);
	cell.innerHTML = "dB";
	row = document.createElement("tr");
	tb.appendChild(row);
	cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = Texts['FINEPOWER'];
	cell.className = "thdrht";
	cell = document.createElement("td");
	row.appendChild(cell);
	el = createFinePowerLim(nr, dn);
	cell.appendChild(el);
	cell = document.createElement("td");
	row.appendChild(cell);
	cell.innerHTML = "dB";
	row = document.createElement("tr");
	tb.appendChild(row);
	cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = Texts['BW'];
	cell.className = "thdrht";
	cell = document.createElement("td");
	row.appendChild(cell);
	el = createChBw(nr, dn);
	cell.appendChild(el);
	cell = document.createElement("td");
	row.appendChild(cell);
	cell.innerHTML = "KHz";
	return tab;
}

function createFineGainLim(nr, dn) {
	var box = document.createElement("div");
	var el = document.createElement("input");
	box.appendChild(el);
	el.id = "fineGainLimit"+nr+(dn? 1 : 0);
	el.name = el.id;
	el.type = "text";
	el.size = "4";
	el.className = "number";
	el.path = dn;
	el.chNr = nr;
	el.onkeypress = function(ev) {
		return isKeyDecimalNumber(ev);
	}
	el.title = "Min: "+config.conf.fineGainRange+", Max: 0 dB";
	el.onchange = function(ev) {
		ev = ev || window.event;
		var target = ev.target ? ev.target : ev.srcElement;
		var dn = target.path;
		var nr = target.chNr;
		var num = fineGainLimGet(nr, dn);
		if (num < config.conf.fineGainRange) {
			target.value = config.conf.fineGainRange;
		} else if (num > 0) {
			target.value = 0;
		} else {
			target.value = num;
		}
	}
	return box;
}

function fineGainLimSet(nr, dn, val) {
	try {
		var el = document.getElementById("fineGainLimit"+nr+(dn? 1 : 0));
		if (el && !isNaN(val))
			el.value = val.toString();
	} catch (err) { }
}

function fineGainLimGet(nr, dn) {
	try {
		var el = document.getElementById("fineGainLimit"+nr+(dn? 1 : 0));
		if (el)
			return parseInt(el.value);
		return 0;
	} catch (err) { return 0; }
}

function createFinePowerLim(nr, dn) {
	var box = document.createElement("div");
	var el = document.createElement("input");
	box.appendChild(el);
	el.id = "finePowerLimit"+nr+(dn? 1 : 0);
	el.name = el.id;
	el.type = "text";
	el.size = "4";
	el.className = "number";
	el.path = dn;
	el.chNr = nr;
	el.onkeypress = function(ev) {
		return isKeyDecimalNumber(ev);
	}
	el.title = "Min: "+config.conf.finePowerRange+", Max: 0 dB";
	el.onchange = function(ev) {
		ev = ev || window.event;
		var target = ev.target ? ev.target : ev.srcElement;
		var dn = target.path;
		var nr = target.chNr;
		var num = finePowerLimGet(nr, dn);
		if (num < config.conf.finePowerRange) {
			target.value = config.conf.finePowerRange;
		} else if (num > 0) {
			target.value = 0;
		} else {
			target.value = num;
		}
	}
	return box;
}

function finePowerLimSet(nr, dn, val) {
	try {
		var el = document.getElementById("finePowerLimit"+nr+(dn? 1 : 0));
		if (el && !isNaN(val))
			el.value = val.toString();
	} catch (err) { }
}

function finePowerLimGet(nr, dn) {
	try {
		var el = document.getElementById("finePowerLimit"+nr+(dn? 1 : 0));
		if (el)
			return parseInt(el.value);
		return 0;
	} catch (err) { return 0; }
}

function createChBw(nr, dn) {
	var box = document.createElement("div");
	var el = document.createElement("select");
	box.appendChild(el);
	el.id = "chBw"+nr+(dn? 1 : 0);
	el.name = el.id;
	el.className = "centered";
	var sys = config.conf.modsys[nr-1];
	chBwAddOptions(el, sys, dn);
	return box;
}
function chBwAddOptions(el, sys, dn) {
	modsys.parse(sys);
	if (!modsys.data.disabled) {
		var bwmask = modsys.data.bwmask;
		for (var i = 0; i < ch_Bw_Txt.length; i++) {
			if (((1<<i) & bwmask) == 0 && !((i == 0 || i == 1) && !dn))
				continue;
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = ch_Bw_Txt[i];
			opt.value = i;
		}
	}
}
function chBwRemoveOptions(el) {
	for (var i = el.options.length - 1; i >= 0; --i)
		el.remove(i);
}
function chBwSet(ch, dn, bw) {
	if (bw >= ch_Bw_Txt.length)
		return;
	var el = document.getElementById("chBw"+ch+(dn? 1 : 0));
	try {
		for (var i = 0; i < el.length; i++) {
			if (bw == el.options.item(i).value) {
				el.selectedIndex = i;
			}
		}
	} catch (err) {}
}

function chBwGet(ch, dn) {
	var el = document.getElementById("chBw"+ch+(dn? 1 : 0));
	try {
		var i = el.selectedIndex;
		return el.options.item(i).value;
	} catch (err) {
		return 0;
	}
}

function createChStat(ch, b) {
	var c = ch - 1;
	var tab = document.createElement("table");
	var tb = document.createElement("tbody");
	tab.appendChild(tb);
	var row = document.createElement("tr");
	tb.appendChild(row);
	var cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = Texts['SIGNAL'];
	cell.style.textAlign = "right";
	cell = createLedBox("rfSignalIn"+ch+b);
	row.appendChild(cell);
	cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = Texts['STAB'];
	cell.style.textAlign = "right";
	cell = createLedBox("rfChStabAlarm"+ch+b);
	row.appendChild(cell);
	row = createMetRow("rfInPow"+ch+b, chRfIn_settings[b], Texts['POWIN'], "dBm");
	tb.appendChild(row);
	var maxGain = config.conf.band[b].mainGain + config.conf.band[b].ch[c].fineGain;
	var minGain = maxGain - 30;
	var chRfGainSettings = {min: minGain, low_alarm: minGain, low_warn: minGain, high_warn: maxGain, high_alarm: maxGain, max: maxGain };
	row = createMetRow("rfChGain"+ch+b, chRfGainSettings, Texts['GAIN'], "dB");
	tb.appendChild(row);
	row = createMetRow("rfOutPow"+ch+b, chRfOut_settings[b], Texts['POWOUT'], "dBm");
	tb.appendChild(row);
	row = createMetRow("rfChIsolM"+ch+b, chIsolM_settings, Texts['ISOL'], "dB");
	tb.appendChild(row);
	row = createMetRow("agc"+ch+b, agc_settings[b], Texts['AGC'], "dB");
	tb.appendChild(row);
	return tab;
}

function rfSignalLedSet(ch, dn, color) {
	ledSetColor("rfSignalIn"+ch+dn, color);
}
function rfChInPowSet(ch, dn, val, color) {
	setMetValue("rfInPow"+ch+dn, val, color);
}
function rfChGainSet(ch, dn, val) {
	setMetValue("rfChGain"+ch+dn, val, "normal");
}

function rfChIsolModSet(ch, dn, val) {
	if (val < chIsolM_settings.low_warn || val > chIsolM_settings.high_warn)
		setMetValue("rfChIsolM"+ch+dn, val, "warning");
	else
		setMetValue("rfChIsolM"+ch+dn, val);
}

function rfChOutPowSet(ch, dn, val, isOn) {
	if (isOn)
		setMetValue("rfOutPow"+ch+dn, val, "normal");
	else
		setMetValue("rfOutPow"+ch+dn, "OFF", "warning");
}

function stabLedSet(ch, dn, color) {
	ledSetColor("rfChStabAlarm"+ch+dn, color);
}

function agcSet(ch, dn, val) {
	setMetValue("agc"+ch+dn, val);
}

function muTrackSet(ch, dn, val) {
	setMetValue("muTrack"+ch+dn, val);
}

function createLedBox(id) {
	var tdNode = document.createElement("td");
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
	this.colorNormal = "rgb(43,194,83)";
	this.colorWarn = "#f1a165";
	this.colorAlarm = "#df4040";
	this.mDiv = document.createElement("div");
	this.mSpan = document.createElement("span");
	this.mDiv.appendChild(this.mSpan);
	this.mDiv.className = "meter";
	this.mDiv.style.width = "50px";
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
					bColor = this.colorNormal;
				else if (val < this.mLowAlarm)
					bColor = this.colorAlarm;
				else if (val < this.mLowWarning)
					bColor = this.colorWarn;
				else if (val > this.mHighAlarm)
					bColor = this.colorAlarm;
				else if (val > this.mHighWarning)
					bColor = this.colorWarn;
				else
					bColor = this.colorNormal;
			} else
				bColor = color;
			this.mSpan.style.backgroundColor = bColor;
		} catch (err) {}
	}
}
// -->