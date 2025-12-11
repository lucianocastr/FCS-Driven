<!--
ch_Bw_Txt = ["90", "45", "30", "20", "15"];
var tbs_settings = {min: -20, low_alarm: -20, low_warn: -20, high_warn: 25, high_alarm: 25, max: 30 };
var board_temp_settings = {min: -40, low_alarm: -40, low_warn: -40, high_warn: 80, high_alarm: 85, max: 90 };
var hpa_settings = {min: 0, low_alarm: 0, low_warn: 20, high_warn: 42, high_alarm: 43, max: 45 };
var rfin_settings = {min: -90, low_alarm: -128, low_warn: -128, high_warn: 0, high_alarm: 0, max: -20 };
var hpa_temp_settings = {min: -40, low_alarm: -40, low_warn: -40, high_warn: 60, high_alarm: 60, max: 90 };
var chPowOmr_settings = {min: -40, low_alarm: -40, low_warn: -40, high_warn: 30, high_alarm: 25, max: 30 };
var chPowOsr_settings = {min: -120, low_alarm: -128, low_warn: -128, high_warn: 0, high_alarm: 0, max: -20 };
var optRxPow_settings = {min: -40, low_alarm: -25, low_warn: -25, high_warn: 1, high_alarm: 1, max: 10 };
var agc_settings = {min: 0, low_alarm: 0, low_warn: 0, high_warn: 80, high_alarm: 80, max: 80 };

function renderPage(remotesNr) {
	var MaxRemotesNr = window.top.MaxRemotesNr;
	if (remotesNr < 1 || remotesNr > MaxRemotesNr)
		return;
	var rootEl = document.createElement("div");
	rootEl.id = "rootElement";
	document.getElementById("page").appendChild(rootEl);
	for (var i = 1; i <= 1; ++i) {
		var unit = new renderUnit(i);
		rootEl.appendChild(unit);
	}
}
function removeAllElements() {
	remove_element(document.getElementById("rootElement"));
}
function redrawAll() {
	removeAllElements();
	renderPage(1);
	parse_config(confStr);
	parse_tags(tagsframe);
	initFormChangeCheck();
}

function renderUnit(nr) {
	var unitDiv = document.createElement("div");
	unitDiv.id = "unitDiv"+nr;
	unitDiv.className = "unitbox";
	var headDiv = document.createElement("div");
	headDiv.className = "headbox";
	unitDiv.appendChild(headDiv);
	var contentDiv = document.createElement("div");
	contentDiv.className = "contentbox";
	unitDiv.appendChild(contentDiv);
	renderUnitContent(nr, contentDiv);
	var cell = document.createElement("td");
	cell.className = "small";
	cell.style.paddingLeft = "20px";
	headDiv.appendChild(cell);
	var idx = 1;//getRemoteIndex(nr, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
	cell.innerHTML = (nr == 0 ? Texts['MASTER'] : Texts['REMOTE']);
	cell = document.createElement("td");
	cell.id = "tagName"+nr;
	cell.style.width = "100%";
	cell.style.textAlign = "center";
	cell.className = "tag";
	cell.innerHTML = "Tag "+nr;
	headDiv.appendChild(cell);
	cell = document.createElement("td");
	headDiv.appendChild(cell);
	var hideButton = document.createElement("input");
	hideButton.type = "button";
	hideButton.className = "buttonexpand";
	hideButton.onclick = function hideContent(unitContent) {
		arguments.callee.hiddenState = !arguments.callee.hiddenState || false;
		contentDiv.style.display = arguments.callee.hiddenState ? "none" : "block";
		hideButton.style.backgroundImage = arguments.callee.hiddenState ? "url('/maximize.png')" : "url('/minimize.png')";
	}
	cell.appendChild(hideButton);
	return unitDiv;
}

function setTag(nr, name) {
	try {
		var tag = document.getElementById("tagName"+nr);
		tag.innerHTML = name;
	} catch (err) {}
}

function renderUnitContent(nr, parent) {
	var isMaster = nr==0;
	var tab = document.createElement("table");
	tab.className = "contenttable";
	parent.appendChild(tab);
	var tb = document.createElement("tb");
	tab.appendChild(tb);
	var row1 = document.createElement("tr");
	tb.appendChild(row1);

	var row2 = document.createElement("tr");
	tb.appendChild(row2);

	var cell = document.createElement("td");
	cell.className = "contentcell";
	cell.rowSpan = "2";
	row1.appendChild(cell);
	var el = createFilteringTable(nr);
	cell.appendChild(el);
	cell = document.createElement("td");
	cell.className = "contentcell";
	row1.appendChild(cell);
	el = createRfInTable(nr);
	cell.appendChild(el);

	cell = document.createElement("td");
	cell.className = "contentcell";
	row2.appendChild(cell);
	el = createRfOutTable(nr);
	cell.appendChild(el);
	if (!isMaster) {
		cell = document.createElement("td");
		cell.className = "contentcell";
		el = createHpaTable(nr);
		cell.appendChild(el);
		row1.appendChild(cell);
	}
	cell = document.createElement("td");
	cell.className = "contentcell";
	cell.height = "100%";
	cell.vAlign = "bottom";
	el = createStatusTable(nr);
	cell.appendChild(el);
	row2.appendChild(cell);
	cell = document.createElement("td");
	cell.style.width = "100%";
	cell.rowSpan = 2;
	row1.appendChild(cell);
	cell = document.createElement("td");
	cell.className = "contentcell";
	cell.rowSpan = 2;
	row1.appendChild(cell);
	if (isMaster) {
		el = createFiberPopupLinks();
	} else {
		el = createFiberTable(nr);
	}
	cell.appendChild(el);
}

function createFilteringTable(nr) {
	var isMaster = nr==0;
	var filtBox = document.createElement("div");
	var filtTitle = createFilteringTitle(nr);
	filtBox.appendChild(filtTitle);
	if (true) { // Se fuerza MASTER para que salgan las opciones show channels
		var chCtl = createChCtlTable(nr);
		filtBox.appendChild(chCtl);
	}
	var filtCtl = createFilterCtlTable(nr);
	filtBox.appendChild(filtCtl);
	var chTbl = createChannelTable(nr);
	filtBox.appendChild(chTbl);	
	return filtBox;
}

function createFilteringTitle(nr) {
	var isMaster = nr==0;
	var box = document.createElement("div");
	box.style.color = "black";
	box.style.fontWeight = "bold";
	box.style.marginBottom = "3px";
	box.style.textAlign = "center";
	box.innerHTML = (isMaster? Texts['FILTDL'] : Texts['FILTUL']);
	return box;
}

function createChCtlTable(nr) {
	var myTable, tbodyNode, trNode, tdNode;
	var box = document.createElement("div");
	box.style.color = "black";
	box.style.marginBottom = "3px";
	myTable = document.createElement("table");
	myTable.style.width = "100%";
	myTable.style.color = "black";
	myTable.style.borderStyle = "hidden";
	box.appendChild(myTable);
	tbodyNode = document.createElement("tbody");
	myTable.appendChild(tbodyNode);
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = Texts['SHOWCH'];
	tdNode.style.textAlign = "right";
	for (var i = 0; i < window.top.MaxChNr; ++i) {
		tdNode = document.createElement("td");
		trNode.appendChild(tdNode);
		var chShow = document.createElement("input");
		chShow.type = "checkbox";
		chShow.id = "chShow"+i;
		chShow.name = chShow.id;
		chShow.checked = (window.top.showChannelsBitmask & (1 << i)) != 0;
		chShow.style.backgroundColor = "transparent";
		tdNode.appendChild(chShow);
		chShow.onclick = function() {
			var chMask = 0;
			var mask = 1;
			for (var j = 0; j < window.top.MaxChNr; ++j) {
				if (document.getElementById("chShow"+j).checked)
					chMask |= mask;
				mask <<= 1;
			}
			window.top.showChannelsBitmask = chMask;
			redrawAll();
		}
	}
	return box;
}

function createFilterCtlTable(nr) {
	var txt, myTable, tbodyNode, trNode, tdNode;
	var box = document.createElement("div");
	box.style.color = "black";
	myTable = document.createElement("table");
	myTable.style.width = "100%";
	myTable.style.className = "small";
	myTable.style.color = "black";
	box.appendChild(myTable);
	tbodyNode = document.createElement("tbody");
	myTable.appendChild(tbodyNode);
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("td");
	tdNode.innerHTML = Texts['ENABLE'];
	tdNode.style.display = "inline";
	tdNode.style.textAlign = "right";
	tdNode.style.marginRight = "0px";
	trNode.appendChild(tdNode);
	tdNode = document.createElement("td");
	tdNode.id = "filtEnBox"+nr;
	tdNode.style.borderStyle = "hidden";
	tdNode.style.borderRadius = "3px";
	trNode.appendChild(tdNode);
	var filtEn = document.createElement("input");
	filtEn.id = "filtEnable"+nr;
	filtEn.name = filtEn.id;
	filtEn.type = "checkbox";
	filtEn.onload = function() {filtEnAlert(nr); }
	filtEn.onchange = function() {filtEnAlert(nr); }
	tdNode.appendChild(filtEn);
	tdNode = document.createElement("td");
	tdNode.style.width = "100%";
	trNode.appendChild(tdNode);
	tdNode = document.createElement("td");
	tdNode.innerHTML = Texts['SQUELCH'];
	tdNode.style.display = "inline";
	tdNode.style.textAlign = "Right";
	tdNode.style.marginRight = "0px";
	trNode.appendChild(tdNode);
	tdNode = document.createElement("td");
	tdNode.style.borderStyle = "hidden";
	trNode.appendChild(tdNode);
	var sqEn = document.createElement("input");
	sqEn.id = "sqEn"+nr;
	sqEn.name = sqEn.id;
	sqEn.setAttribute("type", "checkbox");
	tdNode.appendChild(sqEn);
	tdNode = document.createElement("td");
	tdNode.style.width = "100%";
	trNode.appendChild(tdNode);
	tdNode = document.createElement("td");
	tdNode.style.borderStyle = "hidden";
	tdNode.innerHTML = Texts['SQTHRS'];
	tdNode.style.display = "inline";
	tdNode.style.textAlign = "right";
	tdNode.style.marginRight = "0px";
	trNode.appendChild(tdNode);
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	var sqThr = document.createElement("input");
	var tooltip = "Min: "+sqThrULLims.min +", Max: "+sqThrULLims.max+" dBm";
	sqThr.title = tooltip;
	sqThr.id = "sqThr"+nr;
	sqThr.name = sqThr.id;
	sqThr.type = "text";
	sqThr.size = "4";
	sqThr.onkeypress = function(ev) { ev = ev || window.event; if (ev.keyCode == 13) {submitform(-1); return false;} else return true; }
	sqThr.className = "number";
	sqThr.style.display = "inline";
	tdNode.appendChild(sqThr);
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = "dBm";
	tdNode.style.textAlign = "left";
	tdNode.style.leftRight = "0px";
	return box;
}

function filtEnableSet(nr, on) {
	try {
		var el = document.getElementById("filtEnable"+nr);
		el.checked = on? true: false;
		if (nr > 0) {
			filtEnAlert(nr);
		} else {
			for (var i = 1; i <= window.top.remotesNr; ++i) {
				filtEnAlert(i);
			}
		}
	} catch (err) {}
}

function filtEnAlert(nr) {
	if (nr == 0)
		return;
	try {
		if (nr > 0) {
			var master = document.getElementById("filtEnable0");
			var el = document.getElementById("filtEnable"+nr);
			var box = document.getElementById("filtEnBox"+nr);
			var isAlert = master.checked && !el.checked;
			box.style.backgroundColor = isAlert? "#df4040" : "#C3C3C3";
		}
		for (var ch = 1; ch <= window.top.MaxChNr; ch++) {
			chFineGainAlert(ch, nr);
		}
	} catch (err) {}
}

function filtEnIsSet(nr) {
	try {
		var el = document.getElementById("filtEnable"+nr);
		return el.checked;
	} catch (err) {
		return false;
	}
}

function filtSqEnSet(nr, on) {
	try {
		var el = document.getElementById("sqEn"+nr);
		el.checked = on? true: false;
	} catch (err) {}
}

function filtSqEnIsSet(nr) {
	try {
		var el = document.getElementById("sqEn"+nr);
		return el.checked;
	} catch (err) {
		return false;
	}
}

function filtSqThrSet(nr, val) {
	try {
		var el = document.getElementById("sqThr"+nr);
		if (!isNaN(val))
			el.value = val.toString();
	} catch (err) {}
}

function filtSqThrGet(nr) {
	try {
		var el = document.getElementById("sqThr"+nr);
		return parseInt(el.value);
	} catch (err) {
		return -128;
	}
}

function createChannelTable(nr) {
	var chBox = document.createElement("div");
	var chFiltTable = document.createElement("table");
	chBox.appendChild(chFiltTable);
	var chFiltTbody = document.createElement("tbody");
	chFiltTable.appendChild(chFiltTbody);
	var chFiltTrow = createFilterTableHeader(nr);
	chFiltTbody.appendChild(chFiltTrow);
	var mask = 1;
	for (var ch = 1; ch <= window.top.MaxChNr; ch++) {
		var chRow = document.getElementById("chFilter"+ch+nr);
		if (window.top.showChannelsBitmask & mask) {
			if (!chRow) {
				chFiltTrow = createFilterChannel(ch, nr);
				chFiltTbody.appendChild(chFiltTrow);
			}
		} else {
			remove_element(chRow);
		}
		mask <<= 1;
	}
	return chBox;
}

function createFilterTableHeader(nr) {
	var chFiltRow = document.createElement("tr");
	chFiltRow.style.textAlign = "center";
	var td = document.createElement("td");
	chFiltRow.appendChild(td);
	td.innerHTML = "Filter";
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	td.innerHTML = "On";
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	td.innerHTML = "Fr.&nbsp;(MHz)";
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	td.innerHTML = "G&nbsp;(dB)";
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	td.innerHTML = "Bw&nbsp;(KHz)";
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	td.innerHTML = Texts['POWER'];
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	td.innerHTML = "dBm";	
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	td.innerHTML = "Det";
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	td.innerHTML = "AGC";
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	td.innerHTML = "dB";		
	return chFiltRow;
}

function createFilterChannel(ch, nr) {
	var isMaster = (nr == 0);
	var txt, td;
	var chFiltRow = document.createElement("tr");
	chFiltRow.id = "chFilter"+ch+nr;
	txt = document.createTextNode(""+ch);
	chFiltRow.appendChild(txt);
	td = document.createElement("td");
	td.id = "chEnBox"+ch+nr;
	chFiltRow.appendChild(td);
	var chEn = document.createElement("input");
	chEn.id = "chEn"+ch+nr;
	chEn.name = chEn.id;
	chEn.setAttribute("type", "checkbox");
	chEn.onload = function() { chEnableAlert(ch, nr); chFineGainAlert(ch, nr); }
	chEn.onchange = function() { chEnableAlert(ch, nr); chFineGainAlert(ch, nr); }
	td.appendChild(chEn);
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	var chFr = document.createElement("input");
	var tooltip = "Min: "+(factory.data.band[0].fStart/1e6) +", Max: "+(factory.data.band[0].fStop/1e6)+" MHz";
	chFr.title = tooltip;
	chFr.id = "chFr"+ch+nr;
	chFr.name = chFr.id;
	chFr.type = "text";
	chFr.size = "11";
	chFr.className = "number";
	if (false) { //false en lugar de !isMaster para que se puedan modificar las frecuencias
		chFr.readOnly = true;
		chFr.disabled = true;
		chFr.style.backgroundColor = "#CCCCCC";
	} else {
		chFr.onkeypress = function(ev) { ev = ev || window.event; if (ev.keyCode == 13) {submitform(-1); return false;} else return true; }
	}
	td.appendChild(chFr);
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	var chGain = document.createElement("input");
		var tooltip = "Min: "+fineGainLims.min +", Max: "+fineGainLims.max+" dB";
	chGain.title = tooltip;
	chGain.id = "chGain"+ch+nr;
	chGain.name = chGain.id;
	chGain.type = "text";
	chGain.size = "3";
	chGain.className = "number";
	td.appendChild(chGain);
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	var chBw = document.createElement("select");
	chBw.id = "chBw"+ch+nr;
	chBw.name = chBw.id;
	for (var i = 0; i < ch_Bw_Txt.length; i++) {
		var chBwOpt = document.createElement("option");
		chBw.options.add(chBwOpt);
		chBwOpt.text = ch_Bw_Txt[i];
		chBwOpt.value = i;
	}
	chBw.selectedIndex = 0;
	chBw.style.marginLeft = "4px";
	chBw.style.marginRight = "2px";
	chBw.style.fontSize = "10px";
	chBw.style.verticalAlign = "middle";
	td.appendChild(chBw);
	td = document.createElement("td");
	td.id = "chPowMet"+ch+nr;
	chFiltRow.appendChild(td);
	var s = isMaster? chPowOmr_settings : chPowOsr_settings;
	var chPowMet = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
	chPowMet.attachTo(td);
	chPowMet.valueSet(s.min);
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	td.id = "chPowText"+ch+nr;
	td.style.minWidth = "50px";
	td.style.textAlign = "right";
	td.className = "tabval";
	td.innerHTML = "-30";
	chFiltRow.appendChild(td);
	td = createLedBox("chSignalLed"+ch+nr);
	chFiltRow.appendChild(td);	
	td = document.createElement("td");
	td.id = "chAgcMet"+ch+nr;
	chFiltRow.appendChild(td);
	s = agc_settings;
	var chAgcMet = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
	chAgcMet.attachTo(td);
	chAgcMet.valueSet(s.min);
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	td.id = "chAgcText"+ch+nr;
	td.style.minWidth = "30px";
	td.style.textAlign = "right";
	td.className = "tabval";
	td.innerHTML = "0.0";
	chFiltRow.appendChild(td);	
	return chFiltRow;
}

function chEnableSet(ch, nr, on) {
	var el = document.getElementById("chEn"+ch+nr);
	try {
		el.checked = on ? true : false;
		chFineGainAlert(ch, nr);
	} catch (err) {	}
}

function chEnableAlert(ch, nr) {
	if (nr > 0) {
		try {
			var master = document.getElementById("chEn"+ch+"0");
			var el = document.getElementById("chEn"+ch+nr);
			var box = document.getElementById("chEnBox"+ch+nr);
			var isAlert = master.checked != el.checked;
			box.style.backgroundColor = isAlert? "#df4040" : "initial";
		} catch (err) {}
	} else if (nr == 0) {
		try {
			var master = document.getElementById("chEn"+ch+"0");
			for (var i = 1; i <= window.top.remotesNr; ++i) {
				var el = document.getElementById("chEn"+ch+i);
				var box = document.getElementById("chEnBox"+ch+i);
				var isAlert = master.checked != el.checked;
				box.style.backgroundColor = isAlert? "#df4040" : "initial";
				box.style.borderRadius = "3px";
			}
		} catch (err) {}
	}
}
	
function chEnableIsSet(ch, nr) {
	var el = document.getElementById("chEn"+ch+nr);
	try {
		return el.checked;
	} catch (err) {
		return false;
	}
}

function chFrSet(ch, nr, fr) {
	try {
		var el = document.getElementById("chFr"+ch+nr);
		if (!isNaN(fr))
			el.value = ((fr)/1e+6).toFixed(6);
	} catch (err) {	}
}

function chFrAlert(ch, nr, isAlert) {
	if (nr > 0) {
		try {
			var el = document.getElementById("chFr"+ch+nr);
			el.style.color = isAlert? "#df4040" : "black";
		} catch (err) {}
	}
}

function chFrGet(ch, nr) {
	try {
		var el = document.getElementById("chFr"+ch+nr);
		return ~~Math.round(parseFloat(el.value) * 1.0e6);
	} catch (err) { return Number.NaN; }
}

function chFineGainSet(ch, nr, gain) {
	try {
		var el = document.getElementById("chGain"+ch+nr);
		if (!isNaN(gain)) {
			el.value = gain.toFixed(0);
			chFineGainAlert(ch, nr);
		}
	} catch (err) {}
}

function chFineGainAlert(ch, nr) {
	try {
		var el = document.getElementById("chGain"+ch+nr);
		if (!filtEnIsSet(nr) || !chEnableIsSet(ch, nr)) {
			el.disabled = true;;
			el.style.backgroundColor = "#CCCCCC";
		} else {
			el.disabled = false;;
			el.style.backgroundColor = "#ffffff";
		}
	} catch (err) {}
}

function chFineGainGet(ch, nr) {
	var el = document.getElementById("chGain"+ch+nr);
	try {
		return parseFloat(el.value);
	} catch (err) {
		return 0;
	}
}

function chBwSet(ch, nr, bw) {
	var el = document.getElementById("chBw"+ch+nr);
	try {
		el.selectedIndex = (bw < ch_Bw_Txt.length) ? bw : 0;
	} catch (err) {}
}

function chBwGet(ch, nr) {
	var el = document.getElementById("chBw"+ch+nr);
	try {
		return (el.selectedIndex);
	} catch (err) { return 0; }
}

function chPowerSet(ch, nr, val, color) {
	try {
		var elmet = document.getElementById("chPowMet"+ch+nr).mMeter;
		var eltxt = document.getElementById("chPowText"+ch+nr);
		if (typeof(val) === 'undefined' || isNaN(val))
			eltxt.innerHTML = val;
		else
			eltxt.innerHTML = val.toFixed(1);
		if (typeof(color) === 'undefined')
			elmet.valueSet(val);
		else
			elmet.valueSet(val, color);
	} catch (err) {}
}
function chAgcSet(ch, nr, val, color) {
	try {
		var elmet = document.getElementById("chAgcMet"+ch+nr).mMeter;
		var eltxt = document.getElementById("chAgcText"+ch+nr);
		if (typeof(val) === 'undefined' || isNaN(val))
			eltxt.innerHTML = val;
		else
			eltxt.innerHTML = val.toFixed(1);
		if (typeof(color) === 'undefined')
			elmet.valueSet(val);
		else
			elmet.valueSet(val, color);
	} catch (err) {}
}

function chSignalLedSet(ch, nr, color) {
	ledSetColor("chSignalLed"+ch+nr, color);
}
function createRfInTable(nr) {
	var myTable, tbodyNode, trNode, tdNode;
	var box = document.createElement("div");
	var el = createRfTitle(nr, true);
	box.appendChild(el);
	myTable = document.createElement("table");
	box.appendChild(myTable);
	tbodyNode = document.createElement("tbody");
	myTable.appendChild(tbodyNode);
	var settings = rfin_settings;
	trNode = createRfPow("rfInPow"+nr, settings);
	tbodyNode.appendChild(trNode);
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("td");
	tdNode.innerHTML = Texts['OVF'];
	tdNode.style.textAlign = "right";
	tdNode.style.fontWeight = "bold";
	trNode.appendChild(tdNode);
	tdNode = createLedBox("rfOvfLed"+nr);
	trNode.appendChild(tdNode);
	return box;
}

function agcSet(val) {
	setMetValue("agc", val);
}

function ovfLedSet(nr, color) {
	ledSetColor("rfOvfLed"+nr, color);
}

function tbsFailLedSet(color) {
	ledSetColor("tbsFailLed", color);
}

function rfInPowSet(nr, val, color) {
	try {
		var elmet = document.getElementById("met_rfInPow"+nr).mMeter;
		var eltxt = document.getElementById("txt_rfInPow"+nr);
		if (typeof(val) === 'undefined' || isNaN(val)) {
			eltxt.innerHTML = val;
		} else {
			eltxt.innerHTML = val.toFixed(1);
		}
		if (typeof(color) === 'undefined')
			elmet.valueSet(val);
		else
			elmet.valueSet(val, color);
	} catch (err) {}
}

function gainULSet(nr, value) {
	try {
		var el = document.getElementById("rfGainUL"+nr);
		if (!isNaN(value))
			el.innerHTML = value.toFixed(0);
	} catch (err) {}
}
function createRfOutTable(nr) {
	var myTable, tbodyNode, trNode, tdNode;
	var box = document.createElement("div");
	var el = createRfTitle(nr, false);
	box.appendChild(el);
	myTable = document.createElement("table");
	box.appendChild(myTable);
	tbodyNode = document.createElement("tbody");
	myTable.appendChild(tbodyNode);
	var settings = hpa_settings;
	trNode = createRfPow("rfOutPow"+nr, settings);
	tbodyNode.appendChild(trNode);
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("td");
	tdNode.innerHTML = Texts['OVF'];
	tdNode.style.textAlign = "right";
	tdNode.style.fontWeight = "bold";
	trNode.appendChild(tdNode);
	tdNode = createLedBox("hpaOvfLed"+nr);
	trNode.appendChild(tdNode);
	trNode = createAttenuator("attOut"+nr);
	tbodyNode.appendChild(trNode);
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("td");
	tdNode.innerHTML = 'Automatic&nbsp;Gain&nbsp;Control';
	tdNode.style.textAlign = "center";
	tdNode.style.fontWeight = "bold";
	tdNode.style.whiteSpace = "nowrap";
	tdNode.colSpan = 3;
	trNode.appendChild(tdNode);
	trNode = createMetRow("agc", agc_settings, "dB");
	tbodyNode.appendChild(trNode);
	return box;
}
function outputAttenuatorSet(nr, value) {
	try {
		var el = document.getElementById("attOut"+nr);
		if (!isNaN(value))
			el.value = value.toFixed(0);
	} catch (err) {}
}

function outputAttenuatorGet(nr) {
	try {
		var el = document.getElementById("attOut"+nr);
		return parseFloat(el.value);
	} catch (err) {
		return -16;
	}
}

function rfOutPowSet(nr, val) {
	try {
		var elmet = document.getElementById("met_rfOutPow"+nr).mMeter;
		elmet.valueSet(val);
		var eltxt = document.getElementById("txt_rfOutPow"+nr);
		if (typeof(val) === 'undefined' || isNaN(val)) {
			eltxt.innerHTML = val;
		} else {
			eltxt.innerHTML = val.toFixed(1);
		}
	} catch (err) {}
}

function gainDLSet(nr, value) {
	try {
		var el = document.getElementById("rfGainDL"+nr);
		if (!isNaN(value))
			el.innerHTML = value.toFixed(0);
	} catch (err) {}
}

function createRfTitle(nr, isInput) {
	var isMaster = nr==0;
	var box = document.createElement("div");
	box.style.color = "black";
	box.style.fontWeight = "bold";
	box.style.marginBottom = "3px";
	box.style.textAlign = "center";
	box.style.whiteSpace = "nowrap";
	if (isInput)
		box.innerHTML = isMaster? Texts['RFINDL'] : Texts['RFINUL'];
	else
		box.innerHTML = isMaster? Texts['RFOUTUL'] : Texts['RFOUTDL'];
	return box;
}
	
function createRfPow(id, s) {
	var trNode = document.createElement("tr");
	var tdNode = document.createElement("td");
	tdNode.id = "met_"+id;
	trNode.appendChild(tdNode);
	var rfMet = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
	rfMet.attachTo(tdNode);
	rfMet.valueSet(s.min);
	tdNode = document.createElement("td");
	tdNode.className = "tabval";
	trNode.appendChild(tdNode);
	var box = document.createElement("div");
	box.id = "txt_"+id;
	box.style.minWidth = "45px";
	box.style.textAlign = "center";
	box.innerHTML = "-30";
	tdNode.appendChild(box);
	tdNode = document.createElement("td");
	tdNode.innerHTML = "dBm";
	trNode.appendChild(tdNode);
	return trNode;
}

function createAttenuator(id) {
	var trNode = document.createElement("tr");
	var tdNode = document.createElement("td");
	tdNode.innerHTML = Texts['ATTENUATOR'];
	tdNode.style.fontWeight = "bold";
	trNode.appendChild(tdNode);
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	var att = document.createElement("input");
	var tooltip = "Min: "+attOutLims.min +", Max: "+attOutLims.max+" dB";
	att.title = tooltip;
	att.id = id;
	att.name = id;
	att.type = "text";
	att.size = "2";
	att.onkeypress = function(ev) { return numbersOnly(ev); }
	att.className = "number";
	att.align = "center";
	tdNode.appendChild(att);
	tdNode = document.createElement("td");
	tdNode.innerHTML = "dB";
	tdNode.style.textAlign = "left";
	trNode.appendChild(tdNode);
	return trNode;
}

function createRfGain(id) {
	var trNode = document.createElement("tr");
	var tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	if (id.indexOf("UL") != -1)
		tdNode.innerHTML = Texts['GAIN']+"&nbsp;(UL:&nbsp;M&nbsp;&laquo;&#8212;&nbsp;R)";
	else if (id.indexOf("DL") != -1)
		tdNode.innerHTML = Texts['GAIN']+"&nbsp;(DL:&nbsp;M&nbsp;&#8212;&raquo;&nbsp;R)";
	else
		tdNode.innerHTML = Texts['GAIN'];
	tdNode.style.fontWeight = "bold";
	tdNode.className = "thd";
	tdNode = document.createElement("td");
	tdNode.id = id;
	tdNode.style.width = "20px";
	tdNode.style.textAlign = "center";
	tdNode.className = "tabval";
	tdNode.innerHTML = "-30";
	trNode.appendChild(tdNode);
	tdNode = document.createElement("td");
	tdNode.innerHTML = "dB";
	tdNode.style.textAlign = "left";
	trNode.appendChild(tdNode);
	return trNode;
}
function createStatusTable(nr) {
	var box = document.createElement("div");
	var el = document.createElement("div");
	el.innerHTML = 'BOARD&nbsp;STATUS';
	el.style.color = "black";
	el.style.fontWeight = "bold";
	el.style.marginBottom = "3px";
	el.style.textAlign = "center";
	box.appendChild(el);
	var tbl = document.createElement("table");
	tbl.style.width = "100%";
	box.appendChild(tbl);
	var tb = document.createElement("tbody");
	tbl.appendChild(tb);
	var tr = document.createElement("tr");
	tb.appendChild(tr);
	var td = document.createElement("th");
	td.innerHTML = Texts['TEMPERATURE'];
	td.colSpan = 4;
	td.style.textAlign = "center";
	tr.appendChild(td);
	tr = document.createElement("tr");
	tb.appendChild(tr);
	td = document.createElement("td");
	td.id = "boardTempMet"+nr;
	tr.appendChild(td);
	var s = board_temp_settings;
	var boardTempMet = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
	boardTempMet.attachTo(td);
	boardTempMet.valueSet(s.min);
	td = createLedBox("boardTempLed"+nr);
	tr.appendChild(td);
	td = document.createElement("td");
	td.id = "boardTempTxt"+nr;
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
	td = document.createElement("th");
	td.innerHTML = "Signal&nbsp;Processor";
	td.colSpan = 3;
	tr.appendChild(td);
	td = createLedBox("fpgaLed"+nr);
	tr.appendChild(td);
	tr = document.createElement("tr");
	tb.appendChild(tr);
	td = document.createElement("td");
	td.colSpan = 4;
	td.innerHTML = "&nbsp;";
	tr.appendChild(td);
	el = createUnitReset(nr);
	box.appendChild(el);
	return box;
}
function boardTempSet(nr, val) {
	try {
		var elmet = document.getElementById("boardTempMet"+nr).mMeter;
		var eltxt = document.getElementById("boardTempTxt"+nr);
		elmet.valueSet(val);
		if (!isNaN(val)) {
			eltxt.innerHTML = val.toFixed(0);
		} else {
			eltxt.innerHTML = "---";
			elmet.valueSet(board_temp_settings.min);;
		}
	} catch (err) {}
}
function boardTempLedSet(nr, val) {
	ledSetColor("boardTempLed"+nr, val);
}
function fpgaLedSet(nr, val) {
	ledSetColor("fpgaLed"+nr, val);
}
function createHpaTable(nr) {
	var myTable, tbodyNode, trNode, tdNode;
	var box = document.createElement("div");
	var el = document.createElement("div");
	el.innerHTML = Texts['HPA'];
	el.style.color = "black";
	el.style.fontWeight = "bold";
	el.style.marginBottom = "3px";
	el.style.textAlign = "center";
	box.appendChild(el);
	myTable = document.createElement("table");
	box.appendChild(myTable);
	tbodyNode = document.createElement("tbody");
	myTable.appendChild(tbodyNode);
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("td");
	tdNode.innerHTML = Texts['ENABLED'];
	tdNode.style.fontWeight = "bold";
	trNode.appendChild(tdNode);
	tdNode = createLedBox("hpaEnLed"+nr);
	trNode.appendChild(tdNode);
	tdNode = createHpaSwitch(nr);
	trNode.appendChild(tdNode);
	return box;
}

function createHpaSwitch(nr)
{
	var tdNode = document.createElement("td");
	var hpaEnBox = document.createElement("div");
	hpaEnBox.id = "hpaSwBox"+nr;
	hpaEnBox.style.border = "medium solid #00AAAA";
	hpaEnBox.style.width = "50px";
	hpaEnBox.style.height = "12px";
	hpaEnBox.style.verticalAlign = "middle";
	hpaEnBox.style.textAlign = "center";
	hpaEnBox.style.padding = "2px";
	hpaEnBox.style.backgroundColor = "#D0FFD0";
	hpaEnBox.style.borderStyle = "inset";
	hpaEnBox.style.borderRadius = "3px";
	hpaEnBox.onmouseover = function() { this.style.borderColor = "#3030A0"; };
	hpaEnBox.onmouseout = function() { this.style.borderColor = "#30AAAA"; };
	tdNode.appendChild(hpaEnBox);
	var hpaEnLbl = document.createElement("label");
	hpaEnLbl.id = "hpaSwLbl"+nr;
	hpaEnLbl.className = "togglebuttonlabel";
	hpaEnLbl.setAttribute("unselectable", "on");
	hpaEnLbl.style.whiteSpace = "nowrap";
	hpaEnLbl.style.fontWeight = "bold";
	hpaEnLbl.style.display = "inline-block";
	hpaEnLbl.style.width = "45px";
	hpaEnLbl.style.height = "18px";
	hpaEnLbl.style.lineHeight = "14px";
	hpaEnLbl.style.textAlign = "center";
	hpaEnLbl.innerHTML = "RF&nbsp;ON";
	hpaEnBox.appendChild(hpaEnLbl);
	var hpaEn = document.createElement("input");
	hpaEn.id = "hpaSwInp"+nr;
	hpaEn.name = hpaEn.id;
	hpaEn.type = "checkbox";
	hpaEn.className = "hidden";
	hpaEn.style.marginRight = "2px";
	hpaEn.checked = true;
	var id = hpaEn.id;
	hpaEnLbl.setAttribute("for", id);
	hpaEn.onclick = function() {hpaSwToggle(nr); };
	hpaEnBox.appendChild(hpaEn);
	return tdNode;
}

function hpaSwToggle(nr) {
	try {
		var hpaEn = document.getElementById("hpaSwInp"+nr);
		var hpaEnLbl = document.getElementById("hpaSwLbl"+nr);
		var hpaEnBox = document.getElementById("hpaSwBox"+nr);
		if (hpaEn.checked) {
			hpaEnLbl.innerHTML = "RF&nbsp;ON";
			hpaEnBox.style.backgroundColor = "#C0FFC0";
			hpaEnLbl.style.color = "#000000";
			hpaEnBox.style.borderStyle = "inset";
		} else {
			hpaEnLbl.innerHTML = "RF&nbsp;OFF";
			hpaEnBox.style.backgroundColor = "#df4040";
			hpaEnLbl.style.color = "#ffffff";
			hpaEnBox.style.borderStyle = "outset";
		}
		submitform(window.top.MaxRemotesNr+1);
	} catch (err) {}
}

function hpaIsOn(nr) {
	try {
		var hpaEn = document.getElementById("hpaSwInp"+nr);
		return hpaEn.checked;
	} catch (err) {
		return false;
	}
}

function hpaSwSet(nr, on) {
	try {
		var hpaEn = document.getElementById("hpaSwInp"+nr);
		var hpaEnLbl = document.getElementById("hpaSwLbl"+nr);
		var hpaEnBox = document.getElementById("hpaSwBox"+nr);
		hpaEn.checked = on ? true : false;
		if (hpaEn.checked) {
			hpaEnLbl.innerHTML = "RF&nbsp;ON";
			hpaEnBox.style.backgroundColor = "#D0FFD0";
			hpaEnLbl.style.color = "#000000";
			hpaEnBox.style.borderStyle = "inset";
		} else {
			hpaEnLbl.innerHTML = "RF&nbsp;OFF";
			hpaEnBox.style.backgroundColor = "#df4040";
			hpaEnLbl.style.color = "#ffffff";
			hpaEnBox.style.borderStyle = "outset";
		}
	} catch(err) {}
}

function hpaSwDisableStateSet(nr, disable) {
	try {
		var hpaEn = document.getElementById("hpaSwInp"+nr);
		hpaEn.disabled = disable? true : false;
	} catch (err) {}
}

function ovfHpaLedSet(nr, val) {
	ledSetColor("hpaOvfLed"+nr, val);
}

function vswrHpaLedSet(nr, val) {
	ledSetColor("hpaVswrLed"+nr, val);
}

function enHpaLedSet(nr, val) {
	ledSetColor("hpaEnLed"+nr, val);
}

function tempHpaLedSet(nr, val) {
	ledSetColor("hpaTempLed"+nr, val);
}

function createUnitReset(nr) {
	var box = document.createElement("div");
	var reset = document.createElement("input");
	reset.id = "reset_"+nr;
	reset.name = reset.id;
	reset.type = "button";
	reset.value = "RESET";
	reset.className = "resetbutton";
	reset.onclick = function() { submitform(nr) }; 
	box.appendChild(reset);
	return box;
}

function resetDisableStateSet(nr, disable) {
	try {
		var el = document.getElementById("reset_"+nr);
		el.disabled = disable? true : false;
	} catch (err) {}
}

function  createFiberPopupLinks() {
	var box = document.createElement("div");
	var myTable, tbodyNode, trNode, tdNode, el;
	myTable = document.createElement("table");
	box.appendChild(myTable);
	myTable.style.borderSpacing = "10px";
	tbodyNode = document.createElement("tbody");
	tbodyNode.id = "fiberPopupLinksBody";
	myTable.appendChild(tbodyNode);
	return box;
}

function fiberLinkLedSet(nr, color) {
	var idx = getRemoteIndex(nr, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
	ledSetColor("fiberLinkLed"+idx, color);
}

function createFiberTable(nr) {
	var box = document.createElement("div");
	var h = document.createElement("div");
	h.style.textAlign = "center";
	box.appendChild(h);
	var el = document.createElement("a");
	h.appendChild(el);
	var idx = 1;
	el.innerHTML = Texts['FIBERLINK'];
	el.className = "m";
	el.href = "/optLink.html";
	el.onclick = function() {optPopup(this.href);return false;};
	var myTable, tbodyNode, trNode, tdNode;
	myTable = document.createElement("table");
	box.appendChild(myTable);
	tbodyNode = document.createElement("tbody");
	myTable.appendChild(tbodyNode);
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	trNode.style.whiteSpace = "nowrap";
	trNode.style.textAlign = "right"
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = '';
	tdNode.style.textAlign = "center";
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = '';
	tdNode.style.textAlign = "center";
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = Texts['SYNC'];
	tdNode.style.whiteSpace = "nowrap";
	tdNode = createLedBox("optFrSync"+nr);
	trNode.appendChild(tdNode);
	tdNode.style.textAlign = "right";
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = Texts['STATUS'];
	tdNode.style.textAlign = "right";
	for (var i = 1; i >= 1; --i) {
		tdNode = createLedBox("optStatusLed"+i+nr);
		trNode.appendChild(tdNode);
	}
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = Texts['RXDETECT'];
	tdNode.style.textAlign = "right";
	tdNode.style.whiteSpace = "nowrap";
	for (var i = 1; i >= 1; --i) { //solo remoto
		tdNode = createLedBox("optRxLed"+i+nr);
		trNode.appendChild(tdNode);
	}
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = Texts['ERRCOUNT'];
	tdNode.style.textAlign = "right";
	tdNode.style.whiteSpace = "nowrap";
	for (var i = 1; i >= 1; --i) { //solo remoto
		tdNode = document.createElement("td");
		trNode.appendChild(tdNode);
		tdNode.id = "optGtpErrVal"+i+nr;
		tdNode.innerHTML = "1234";
		tdNode.style.textAlign = "center";
		tdNode.className = "tabval";
	}
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = Texts['RXPOWER'];
	tdNode.style.textAlign = "right";
	tdNode.style.display = "inline";
	for (var i = 1; i >= 1; --i) { //solo remoto
		tdNode = document.createElement("td");
		trNode.appendChild(tdNode);
		tdNode.id = "optPowInText"+i+nr;
		tdNode.innerHTML = "-30";
		tdNode.style.textAlign = "center";
		tdNode.className = "tabval";
	}
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	for (var i = 1; i >= 1; --i) { //solo remoto
		tdNode = document.createElement("td");
		trNode.appendChild(tdNode);
		tdNode.id = "fiberRxPowMet"+i+nr;
		var s = optRxPow_settings;
		var fiberRxPowMet = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
		fiberRxPowMet.attachTo(tdNode);
		fiberRxPowMet.valueSet(s.min);
	}
	return box;
}

function optPopup(url) {
	if (optPopupWindow && !optPopupWindow.closed)
		optPopupWindow.close();
	var w = 580;
	var h = 280;
	var left = (screen.width/2)-(w/2);
	var top = (screen.height/2)-(h/2);
	var name = "Optical_Link";
	var wspecs = 'resizable=1,scrollbars=1,toolbar=no,menubar=no,directories=no,status=no,titlebar=no,height='+h+',width='+w+',left='+left+',top='+top;
	optPopupWindow = window.open(url, name, wspecs);
}

function optFrSyncLedSet(nr, color) {
	ledSetColor("optFrSync"+nr, color);
}

function optStatusLedSet(nr, isRemote, color) {
	ledSetColor("optStatusLed"+(isRemote? 1:0)+nr, color);
}

function optRxLedSet(nr, isRemote, color) {
	ledSetColor("optRxLed"+(isRemote? 1:0)+nr, color);
}

function optErrorsSet(nr, isRemote, val) {
	try {
		var el = document.getElementById("optGtpErrVal"+(isRemote? 1:0)+nr);
		el.innerHTML = isNaN(val)? "---" : val.toString();
	} catch (err) {}
}

function fiberPowerSet(nr, isRemote, val, color) {
	try {
		var elmet = document.getElementById("fiberRxPowMet"+(isRemote? 1:0)+nr).mMeter;
		var eltxt = document.getElementById("optPowInText"+(isRemote? 1:0)+nr);
		if (typeof(val) === "undefined" || val == null)
			eltxt.innerHTML = "";
		else if (isNaN(val) && isNaN(parseInt(val)))
			eltxt.innerHTML = val;
		else
			eltxt.innerHTML = val.toFixed(1);
		if (typeof(color) === 'undefined' || color === null)
			elmet.valueSet(val);
		else
			elmet.valueSet(val, color);
	} catch (err) {console.error(err);}
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
}
	
function createMetRow(id, s, units) {
	var trNode = document.createElement("tr");
	tdNode = document.createElement("td");
	tdNode.id = "met_"+id;
	var met = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
	met.attachTo(tdNode);
	met.valueSet(s.min);
	trNode.appendChild(tdNode);
	tdNode = document.createElement("td");
	tdNode.id = "txt_"+id;
	tdNode.style.width = "45px";
	tdNode.style.textAlign = "center";
	tdNode.className = "tabval";
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