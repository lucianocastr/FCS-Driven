<!--
ch_Bw_Txt = ["90", "45", "30", "20", "15"];

var hpa_settings = [{min: -20, low_alarm: -20, low_warn: -20, high_warn: 19, high_alarm: 22, max: 25 },
		    {min:   0, low_alarm:   0, low_warn:  25, high_warn: 37, high_alarm: 40, max: 45 }];
var board_temp_settings = {min: -40, low_alarm: -40, low_warn: -40, high_warn: 70, high_alarm: 75, max: 90 };
var chRfIn_settings = [{min: -110, low_alarm: -121, low_warn: -121, high_warn: 0, high_alarm: 0, max: 0 }, 
		       {min:  -80, low_alarm: -121, low_warn: -121, high_warn: -20, high_alarm: -20, max: -20 }];
var chRfOut_settings = [{min: -35, low_alarm: 20, low_warn: 20, high_warn: 36, high_alarm: 40, max: 25 },
			{min: -20, low_alarm: 20, low_warn: 20, high_warn: 36, high_alarm: 40, max: 40 }];
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
	cell.innerHTML = (nr == 0 ? Texts['CONTROL'] : Texts['CHANNEL']+"&nbsp;"+nr);
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
	cell.innerHTML = "Ch.";
	cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = Texts['DISPLAY'];
	cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = "UL&nbsp;(MHz)";
	cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = "DL&nbsp;(MHz)";
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
	en.disabled = (config.getChannelsEnabledMask() & mask) != 0;
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
	return row;
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
	var tooltip = "Max: "+config.conf.band[dn].squelchThrMax+", Min: "+
		config.conf.band[dn].squelchThrMin+" dBm";
	el.title = tooltip;
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
	var tooltip = "Max: "+factory.data.band[dn].gainLim+", Min: "+
		config.conf.band[dn].mainGainMin+" dB";
	el.title = tooltip;
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
	var tooltip = "Max: "+factory.data.band[dn].powerLim+", Min: "+
		(factory.data.band[dn].powerLim - config.conf.band[dn].mainPowerRange)+" dBm";
	el.title = tooltip;
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
	cell.innerHTML = Texts['OVF'];
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
	row = createMetRow("rfOutPow"+dn, hpa_settings[dn], Texts['POWER'], "dBm");
	body.appendChild(row);
	row = document.createElement("tr");
	body.appendChild(row);
	var cell = document.createElement("th");
	row.appendChild(cell);
	cell.innerHTML = Texts['STATUS'];
	cell.className = "thdrht";
	cell = createLedBox("hpaStatusLed"+dn);
	row.appendChild(cell);
	if (dn == 1) {
		row = document.createElement("tr");
		body.appendChild(row);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['OVF'];
		cell.className = "thdrht";
		cell = createLedBox("hpaOvf"+dn);
		row.appendChild(cell);
	}
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
	reset.onclick = function() { config.doReset(window.top.fiplexConfStr); } 
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
	el.onkeypress = function(ev) {
		return isKeyDecimalNumber(ev);
	}
	var tooltip = "Max: 0, Min: "+config.conf.fineGainRange+" dB";
	el.title = tooltip;
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
		return null;
	} catch (err) { return null; }
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
	el.onkeypress = function(ev) {
		return isKeyDecimalNumber(ev);
	}
	var tooltip = "Max: 0, Min: "+config.conf.finePowerRange+" dB";
	el.title = tooltip;
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
		return null;
	} catch (err) { return null; }
}

function createChBw(nr, dn) {
	var box = document.createElement("div");
	var el = document.createElement("select");
	box.appendChild(el);
	el.id = "chBw"+nr+(dn? 1 : 0);
	el.name = el.id;
	el.className = "centered";
	for (var i = 0, j = 0; i < ch_Bw_Txt.length; i++) {
		if (!(factory.data.bwmask & (1 << i)))
			continue;
		var opt = document.createElement("option");
		el.options.add(opt);
		opt.text = ch_Bw_Txt[i];
		opt.value = j++;
	}
	el.selectedIndex = 0;
	return box;
}

function chBwSet(ch, dn, bw) {
	var el = document.getElementById("chBw"+ch+(dn? 1 : 0));
	try {
		el.selectedIndex = (bw < ch_Bw_Txt.length) ? bw : 0;
	} catch (err) {}
}

function chBwGet(ch, dn) {
	try {
		var el = document.getElementById("chBw"+ch+(dn? 1 : 0));
		return (el.selectedIndex);
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
	row = createMetRow("rfInPow"+ch+b, chRfIn_settings[b], Texts['POWIN'], "dBm");
	tb.appendChild(row);
	var maxGain = config.conf.band[b].mainGain + config.conf.band[b].ch[c].fineGain;
	var minGain = maxGain - 30;
	var chRfGainSettings = {min: minGain, low_alarm: minGain, low_warn: minGain, high_warn: maxGain, high_alarm: maxGain, max: maxGain };
	row = createMetRow("rfChGain"+ch+b, chRfGainSettings, Texts['GAIN'], "dB");
	tb.appendChild(row);
	row = createMetRow("rfOutPow"+ch+b, chRfOut_settings[b], Texts['POWOUT'], "dBm");
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
function rfChOutPowSet(ch, dn, val, isOn) {
	if (isOn)
		setMetValue("rfOutPow"+ch+dn, val, "normal");
	else
		setMetValue("rfOutPow"+ch+dn, "OFF", "warning");
}
function agcSet(ch, dn, val) {
	setMetValue("agc"+ch+dn, val);
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