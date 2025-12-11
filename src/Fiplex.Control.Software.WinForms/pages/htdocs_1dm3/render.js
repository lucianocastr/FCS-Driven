<!--
ch_Bw_Txt = ["90", "45", "30", "20", "15"];
var hpa_settings = {min:   0, low_alarm:   0, low_warn:  20, high_warn: 42, high_alarm: 43, max: 45 };
var master_settings = {min:   -20, low_alarm:   -20, low_warn: -20, high_warn: 39, high_alarm: 40, max: 30 };
var board_temp_settings = {min: -40, low_alarm: -40, low_warn: -40, high_warn: 80, high_alarm: 85, max: 90 };
var tbs_settings = [{min: -40, low_alarm: -128, low_warn: -128, high_warn: 25, high_alarm: 25, max: 20 },
		    {min: -80, low_alarm: -128, low_warn: -128, high_warn: -6, high_alarm: 0, max: 0 } ];
var rfin_settings = {min:  -80, low_alarm: -128, low_warn: -128, high_warn: 0, high_alarm: 0, max: -20 };
var chPowOmr_settings = [{min: -40, low_alarm: -40, low_warn: -40, high_warn: 30, high_alarm: 25, max: 20 },
			 {min: -80, low_alarm: -80, low_warn: -80, high_warn: 0, high_alarm: 0, max: -20 }];
var chPowOsr_settings = {min: -100, low_alarm: -128, low_warn: -128, high_warn: 0, high_alarm: 0, max: 0 };
var optRxPow_settings = {min: -40, low_alarm: -30, low_warn: -25, high_warn: 1, high_alarm: 1, max: 10 };
var agc_settings = {min: 0, low_alarm: 0, low_warn: 0, high_warn: 80, high_alarm: 80, max: 80 };
var currentRemotesNr;
var hiddenUnitState = new Array();

function renderPage(remotesNr,expansorNr) {
	var MaxRemotesNr = window.top.MaxRemotesNr;
	if (remotesNr < 0 || remotesNr > MaxRemotesNr)
		return;
	if (expansorNr < 0 || expansorNr > window.top.MaxRemotesNr)
		return;
	window.top.currentRemotesNr = remotesNr;
	var rootEl = document.createElement("div");
	rootEl.id = "rootElement";
	document.getElementById("page").appendChild(rootEl);
	for (var i = 0; i <= remotesNr; ++i) {
		var unit = new renderUnit(i);
		rootEl.appendChild(unit);
	}
}
function removeAllElements() {
	remove_element(document.getElementById("rootElement"));
}
function redrawAll() {
	removeAllElements();
	renderPage(window.top.currentRemotesNr,getExpansorsNrFromConf(window.top.fiplexConfStr));
	factory.parse(window.top.fiplexFactStr);
	parse_config(window.top.fiplexConfStr);
	parse_tags(window.top.fiplexTagsStr);
	tagsRender();
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
	contentDiv.id = "contentDiv"+nr;
	unitDiv.appendChild(contentDiv);
	renderUnitContent(nr, contentDiv);
	var cell = document.createElement("td");
	cell.className = "small";
	cell.style.paddingLeft = "20px";
	headDiv.appendChild(cell);
	var idx = getRemoteIndex(nr, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
	cell.innerHTML = (nr == 0 ? Texts['MASTER'] : Texts['REMOTE']+"&nbsp;"+idx);
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
	hideButton.onclick = function(ev) {
		arguments.callee.hiddenState = !arguments.callee.hiddenState || false;
		contentDiv.style.display = arguments.callee.hiddenState ? "none" : "block";
		hideButton.style.backgroundImage = arguments.callee.hiddenState ? "url('/maximize.png')" : "url('/minimize.png')";
		hiddenUnitState[nr] = arguments.callee.hiddenState;
	}
	hiddenUnitState[nr] = nr == 0? false : window.top.master_rx_loss_alarm[nr];
	contentDiv.style.display = hiddenUnitState[nr] ? "none" : "block";
	hideButton.id = "hideButton"+nr;
	cell.appendChild(hideButton);
	return unitDiv;
}
function getHiddenUnitState(nr) {
	return hiddenUnitState[nr];
}
function hideUnitContent(nr, doHide) {
	if (!(nr > 0 && nr <= window.top.MaxRemotesNr))
		return;
	var el = document.getElementById("hideButton"+nr);
	var box = document.getElementById("contentDiv"+nr);
	if (!el || !box)
		return;
	try {
		box.style.display = doHide ? "none" : "block";
		el.hiddenState = doHide ? true : false;
		el.style.backgroundImage = doHide ?  "url('/maximize.png')" : "url('/minimize.png')";
		hiddenUnitState[nr] = doHide;
	} catch (err) {}
}
function setTag(nr, name) {
	try {
		var tag = document.getElementById("tagName"+nr);
		tag.innerHTML = name;
	} catch (err) {}
}

function renderUnitContent(nr, parent) {
	var isMaster = nr==0;
	var unitTab = document.createElement("table");
	unitTab.className = "contenttable";
	parent.appendChild(unitTab);
	var tab = document.createElement("tbody");
	unitTab.appendChild(tab);
	var row1 = document.createElement("tr");
	tab.appendChild(row1);
	var row2 = document.createElement("tr");
	tab.appendChild(row2);
	var cell, el;
	cell = document.createElement("td");
	cell.className = "contentcell";
	row1.appendChild(cell);
	el = createRfInTable(nr);
	cell.appendChild(el);
	cell = document.createElement("td");
	cell.className = "contentcell";
	row1.appendChild(cell);
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
	row1.appendChild(cell);
	cell = document.createElement("td");
	cell.style.width = "100%";
	cell.rowSpan = 2;
	row1.appendChild(cell);
	if (isMaster && window.top.expansorNr!=0)
	{
		cell = document.createElement("td");
		cell.className = "contentcell";
		cell.rowSpan = 2;
		cell.style.verticalAlign = "middle";	
		el = createExpansorPopupLinks();
		cell.appendChild(el);
		row1.appendChild(cell);
	}
	cell = document.createElement("td");
	cell.className = "contentcell";
	cell.rowSpan = 2;
	cell.style.verticalAlign = "middle";
	row1.appendChild(cell);
	if (isMaster) {
		el = createFiberPopupLinks();
	} else {
		el = createFiberTable(nr);
	}
	cell.appendChild(el);
	cell = document.createElement("td");
	cell.className = "contentcell";
	cell.colSpan = isMaster ? 3 : 4;
	row2.appendChild(cell);
	el = createFilteringTable(nr);
	cell.appendChild(el);
}

function createFilteringTable(nr) {
	var isMaster = nr==0;
	var filtBox = document.createElement("div");
	var filtTitle = createFilteringTitle(nr);
	filtBox.appendChild(filtTitle);
	var row = document.createElement("tr");
	filtBox.appendChild(row);
	var cell = document.createElement("td");
	row.appendChild(cell);
	var filtCtl = createFilterCtlTable(nr);
	cell.appendChild(filtCtl);
	if (isMaster) {
		cell = document.createElement("td");
		row.appendChild(cell);
		var chCtl = createChCtlTable(nr);
		cell.appendChild(chCtl);
	}
	var chTbl = createChannelTable(nr);
	filtBox.appendChild(chTbl);	
	return filtBox;
}

function createFilteringTitle(nr) {
	var isMaster = nr==0;
	var box = document.createElement("div");
	box.style.color = "black";
	box.style.fontWeight = "bold";
	box.style.textAlign = "center";
	box.innerHTML = (isMaster? Texts['FILTDL'] : Texts['FILTUL']);
	box.style.minWidth = "740px";
	return box;
}

function createChCtlTable(nr) {
	var myTable, tbodyNode, trNode, tdNode;
	var box = document.createElement("div");
	box.style.color = "black";
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
	myTable.style.color = "black";
	myTable.style.borderStyle = "hidden";
	box.appendChild(myTable);
	tbodyNode = document.createElement("tbody");
	myTable.appendChild(tbodyNode);
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("td");
	tdNode.innerHTML = Texts['ENABLE'];
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
	filtEn.onchange = function() {filtEnAlert(nr); }
	tdNode.appendChild(filtEn);
	trNode.appendChild(tdNode);
	tdNode = document.createElement("td");
	tdNode.innerHTML = Texts['SQUELCH'];
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
	tdNode.style.textAlign = "right";
	tdNode.style.marginRight = "0px";
	trNode.appendChild(tdNode);
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	var sqThr = document.createElement("input");
	sqThr.id = "sqThr"+nr;
	sqThr.name = sqThr.id;
	sqThr.type = "text";
	sqThr.size = "4";
	sqThr.className = "number";
	sqThr.style.display = "inline";
	if (nr == 0) {
		var k = factory.data.uplinkCoupling == 1 ? 1 : 0;
		var tooltip = "Min: "+sqThrDLLims[k].min +", Max: "+sqThrDLLims[k].max+" dBm";
		sqThr.title = tooltip;
	}
	else
	{
		var tooltip = "Min: "+sqThrULLims.min +", Max: "+sqThrULLims.max+" dBm";
		sqThr.title = tooltip;
	}
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
			for (var i = 0; i <= window.top.remotesNr; ++i) {
				filtEnAlert(i);
			}
		}
	} catch (err) {}
}

function filtEnAlert(nr) {
	try {
		if (nr > 0) {
			var master = document.getElementById("filtEnable0");
			var el = document.getElementById("filtEnable"+nr);
			var box = document.getElementById("filtEnBox"+nr);
			var isAlert = (master.checked && !el.checked) && !window.top.master_rx_loss_alarm[nr];
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
function filtEnDisableStateSet(nr, disable) {
	try {
		var el = document.getElementById("filtEnable"+nr);
		el.disabled = disable? true : false;
	} catch (err) {}
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
function filtSqEnDisableStateSet(nr, disable) {
	try {
		var el = document.getElementById("sqEn"+nr);
		el.disabled = disable? true : false;
	} catch (err) {}
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
function filtSqThrDisableStateSet(nr, disable) {
	try {
		var el = document.getElementById("sqThr"+nr);
		el.disabled = disable? true : false;
		el.style.backgroundColor = disable ? "#CCCCCC" : "white";
	} catch (err) {}
}
function computeShownChannelsNr() {
	var mask = 1;
	var n = 0;
	for (var ch = 1; ch <= window.top.MaxChNr; ch++) {
		if (window.top.showChannelsBitmask & mask) {
			n++;
		}
		mask <<= 1;
	}
	return n;
}
function createChannelTable(nr) {
	var chBox = document.createElement("div");
	var chFiltTable = document.createElement("table");
	chFiltTable.style.border = "1px solid #db5902";
	chFiltTable.style.borderLeft="1px solid #db5902";
	chFiltTable.style.padding = "0px 0px 0px 0px";
	chBox.appendChild(chFiltTable);
	var chFiltBody = document.createElement("tbody");
	chFiltTable.appendChild(chFiltBody);
	var row = document.createElement("tr");
	chFiltBody.appendChild(row);
	var cell = document.createElement("td");
	row.appendChild(cell);
	var tab = document.createElement("table");
	cell.appendChild(tab);
	var tb = document.createElement("tbody");
	tab.appendChild(tb);
	row = document.createElement("tr");
	tb.appendChild(row);
	var show_ch_nr = computeShownChannelsNr();
	var nr_rows = Math.ceil(show_ch_nr / 2);
	var mask = 1;
	var ch = 1;
	var nch = 0;
	createFilterTableHeader(row,nr);
	if (show_ch_nr > 1)
		createFilterTableHeader(row,nr);
	for (var r = 0; r < nr_rows; r++) {
		row = document.createElement("tr");
		tb.appendChild(row);
		for (var c = 0; c < 2; ++c) {
			while (!(window.top.showChannelsBitmask & mask) && (ch <= window.top.MaxChNr)) {
				ch++;
				mask <<= 1;
			}
			if (ch > window.top.MaxChNr)
				break;
			createFilterChannel(row, ch, nr);
			ch++;
			mask <<= 1;
		}
		if (ch > window.top.MaxChNr)
			break;
	}
	return chBox;
}
function createFilterTableHeader(chFiltRow,nr) {
	var isMaster = (nr==0);
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
	if (!isMaster)
	{
		td = document.createElement("td");
		chFiltRow.appendChild(td);
		td.innerHTML = "AGC";
		td = document.createElement("td");
		chFiltRow.appendChild(td);
		td.innerHTML = "dB";
	}
	else
	{		
		td = document.createElement("td");
		td.style.minWidth = "10px";
		chFiltRow.appendChild(td);
	}
}

function createFilterChannel(chFiltRow, ch, nr) {
	var isMaster = (nr == 0);
	var txt, td;
	td = document.createElement("td");
	td.innerHTML = ch;
	chFiltRow.appendChild(td);
	td.style.textAlign = "center";
	td = document.createElement("td");
	td.id = "chEnBox"+"_"+ch+"_"+nr;
	chFiltRow.appendChild(td);
	var chEn = document.createElement("input");
	chEn.id = "chEn"+"_"+ch+"_"+nr;
	chEn.name = chEn.id;
	chEn.setAttribute("type", "checkbox");
	chEn.nr = nr;
	chEn.ch = ch;
	chEn.onchange = function(ev) {
		ev = ev || window.event;
		var target = ev.target;
		var ch = target.ch;
		var nr = target.nr;
		chEnableAlert(ch, nr);
		chFineGainAlert(ch, nr);
	}
	chEn.onclick = function(ev) { 
		ev = ev || window.event;
		var target = ev.target;
		var ch = target.ch;
		var nr = target.nr;
		chEnableAlert(ch, nr);
		chFineGainAlert(ch, nr);
	}
	chFineGainAlert(ch, nr);
	td.appendChild(chEn);
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	var chFr = document.createElement("input");
	chFr.id = "chFr"+"_"+ch+"_"+nr;
	chFr.name = chFr.id;
	if (isMaster)
	{
		var tooltip = "Min: "+(factory.data.band[0].fStartDL/1e6) +", Max: "+(factory.data.band[0].fStopDL/1e6)+" MHz";
		chFr.title = tooltip;
	}
	chFr.type = "text";
	chFr.size = "11";
	chFr.className = "number";
	if (!isMaster) {
		chFr.readOnly = true;
		chFr.disabled = true;
		chFr.style.backgroundColor = "#CCCCCC";
	}
	td.appendChild(chFr);
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	var chGain = document.createElement("input");
	chGain.id = "chGain"+"_"+ch+"_"+nr;
	var tooltip = "Min: "+fineGainLims.min +", Max: "+fineGainLims.max+" dB";
	chGain.title = tooltip;
	chGain.name = chGain.id;
	chGain.type = "text";
	chGain.size = "3";
	chGain.className = "number";
	chGain.onkeypress = function(ev) { return isKeyDecimalNumber(ev); }
	td.appendChild(chGain);
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	var chBw = document.createElement("select");
	chBw.id = "chBw"+"_"+ch+"_"+nr;
	chBw.name = chBw.id;
	for (var i = 0; i < ch_Bw_Txt.length; i++) {
		var chBwOpt = document.createElement("option");
		chBw.options.add(chBwOpt);
		chBwOpt.text = ch_Bw_Txt[i];
		chBwOpt.value = i;
	}
	chBw.selectedIndex = 2;
	chBw.style.marginLeft = "4px";
	chBw.style.marginRight = "2px";
	chBw.style.fontSize = "10px";
	chBw.style.verticalAlign = "middle";
	td.appendChild(chBw);
	td = document.createElement("td");
	td.id = "chPowMet"+"_"+ch+"_"+nr;
	chFiltRow.appendChild(td);
	var s;
	if (isMaster) {
		var n = factory.data.uplinkCoupling == 1 ? 1 : 0;
		s = chPowOmr_settings[n];
	} else {
		s = chPowOsr_settings;
	}
	var chPowMet = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
	chPowMet.attachTo(td);
	chPowMet.valueSet(s.min);
	td = document.createElement("td");
	td.id = "chPowText"+"_"+ch+"_"+nr;
	td.style.minWidth = "40px";
	td.style.textAlign = "right";
	td.style.paddingRight = "5px";
	td.className = "tabval";
	td.innerHTML = "-30";
	chFiltRow.appendChild(td);
	td = createLedBox("chSignalLed"+"_"+ch+"_"+nr);
	chFiltRow.appendChild(td);
	if (isMaster) {
		td = document.createElement("td");
		td.style.minWidth = "10px";
		chFiltRow.appendChild(td);
	}
	else
	{
		td = document.createElement("td");
		td.id = "chAgcMet"+"_"+ch+"_"+nr;
		chFiltRow.appendChild(td);
		s =agc_settings;
		var chAgcMet = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
		chAgcMet.attachTo(td);
		chAgcMet.valueSet(s.min);
		td = document.createElement("td");
		td.id = "chAgcText"+"_"+ch+"_"+nr;
		td.style.minWidth = "30px";
		td.style.textAlign = "right";
		td.style.paddingRight = "5px";
		td.className = "tabval";
		td.innerHTML = "0.0";
		chFiltRow.appendChild(td);
	}
}

function chEnableSet(ch, nr, on) {
	var el = document.getElementById("chEn"+"_"+ch+"_"+nr);

	try {
		el.checked = on ? true : false;
		chFineGainAlert(ch, nr);
	} catch (err) {	}
}

function chEnableAlert(ch, nr) {
	if (nr > 0) {
		try {
			var master = document.getElementById("chEn"+ch+"0");
			var el = document.getElementById("chEn"+"_"+ch+"_"+nr);
			var box = document.getElementById("chEnBox"+"_"+ch+"_"+nr);
			var isAlert = (master.checked && !el.checked || !master.checked && el.checked) && !window.top.master_rx_loss_alarm[nr];
			box.style.backgroundColor = isAlert? "#df4040" : "transparent";
		} catch (err) {}
	} else if (nr == 0) {
		try {
			var master = document.getElementById("chEn"+ch+"0");
			for (var i = 1; i <= window.top.remotesNr; ++i) {
				var el = document.getElementById("chEn"+ch+i);
				var box = document.getElementById("chEnBox"+ch+i);
				var isAlert = (master.checked && !el.checked || !master.checked && el.checked) && !window.top.master_rx_loss_alarm[i];
				box.style.backgroundColor = isAlert? "#df4040" : "transparent";
				box.style.borderRadius = "3px";
			}
		} catch (err) {}
	}
}
	
function chEnableIsSet(ch, nr) {
	var el = document.getElementById("chEn"+"_"+ch+"_"+nr);
	try {
		return el.checked;
	} catch (err) {
		return false;
	}
}
function chEnDisableStateSet(ch, nr, disable) {
	try {
		var el = document.getElementById("chEn"+"_"+ch+"_"+nr);
		el.disabled = disable? true : false;
	} catch (err) {}
}
function chFrSet(ch, nr, fr) {
	try {
		var el = document.getElementById("chFr"+"_"+ch+"_"+nr);
		if (!isNaN(fr))
			el.value = ((fr)/1e+6).toFixed(6);
	} catch (err) {	}
}

function chFrAlert(ch, nr, isAlert) {
	if (nr > 0) {
		try {
			var el = document.getElementById("chFr"+"_"+ch+"_"+nr);
			el.style.color = isAlert? "#df4040" : "black";
		} catch (err) {}
	}
}

function chFrGet(ch, nr) {
	try {
		var el = document.getElementById("chFr"+"_"+ch+"_"+nr);
		return ~~Math.round(parseFloat(el.value) * 1.0e6);
	} catch (err) { return Number.NaN; }
}

function chFineGainSet(ch, nr, gain) {
	try {
		var el = document.getElementById("chGain"+"_"+ch+"_"+nr);
		if (!isNaN(gain)) {
			el.value = gain.toFixed(0);
			chFineGainAlert(ch, nr);
		}
	} catch (err) {}
}

function chFineGainAlert(ch, nr) {
	try {
		var el = document.getElementById("chGain"+"_"+ch+"_"+nr);
		if (!filtEnIsSet(nr) || !chEnableIsSet(ch, nr)) {
			chFineGainDisableStateSet(ch, nr, true);
		} else {
			chFineGainDisableStateSet(ch, nr, false);
		}
	} catch (err) {}
}

function chFineGainGet(ch, nr) {
	var el = document.getElementById("chGain"+"_"+ch+"_"+nr);
	try {
		return parseFloat(el.value);
	} catch (err) {
		return 0;
	}
}
function chFineGainDisableStateSet(ch, nr, disable) {
	try {
		var el = document.getElementById("chGain"+"_"+ch+"_"+nr);
		el.disabled = disable? true : false;
		el.style.backgroundColor = disable ? "#CCCCCC" : "white";
	} catch (err) {}
}
function chBwSet(ch, nr, bw) {
	var el = document.getElementById("chBw"+"_"+ch+"_"+nr);
	try {
		el.selectedIndex = (bw < ch_Bw_Txt.length ? bw : 2);
	} catch (err) {}
}

function chBwGet(ch, nr) {
	var el = document.getElementById("chBw"+"_"+ch+"_"+nr);
	try {
		return (el.selectedIndex);
	} catch (err) {
		return 2;
	}
}
function chBwDisableStateSet(ch, nr, disable) {
	try {
		var el = document.getElementById("chBw"+"_"+ch+"_"+nr);
		el.disabled = disable? true : false;
		el.style.backgroundColor = disable ? "#CCCCCC" : "white";
	} catch (err) {}
}
function chPowerSet(ch, nr, val, color) {
	try {
		var el = document.getElementById("chPowMet"+"_"+ch+"_"+nr);
		if (typeof(el) != "undefined" && el) {
			var elmet = el.mMeter;
			if (typeof(color) === 'undefined')
				elmet.valueSet(val);
			else
				elmet.valueSet(val, color);
		}
		var eltxt = document.getElementById("chPowText"+"_"+ch+"_"+nr);
		if (typeof(val) === 'undefined' || isNaN(val))
			eltxt.innerHTML = val;
		else
			eltxt.innerHTML = val.toFixed(1);
	} catch (err) {}
}
function chAgcSet(ch, nr, val, color) {
	try {
		var el = document.getElementById("chAgcMet"+"_"+ch+"_"+nr);
		if (typeof(el) != "undefined" && el) {
			var elmet = el.mMeter;
			if (typeof(color) === 'undefined')
				elmet.valueSet(val);
			else
				elmet.valueSet(val, color);
		}
		var eltxt = document.getElementById("chAgcText"+"_"+ch+"_"+nr);
		if (typeof(val) === 'undefined' || isNaN(val))
			eltxt.innerHTML = val;
		else
			eltxt.innerHTML = val.toFixed(1);
	} catch (err) {}
}
function chSignalLedSet(ch, nr, color) {
	ledSetColor("chSignalLed"+"_"+ch+"_"+nr, color);
}

function createRfInTable(nr) {
	var myTable, tbodyNode, trNode, tdNode;
	var isMaster = nr==0;
	var box = document.createElement("div");
	var el = createRfTitle(nr, true);
	box.appendChild(el);
	myTable = document.createElement("table");
	myTable.style.marginLeft = "auto";
	myTable.style.marginRight = "auto";
	box.appendChild(myTable);
	tbodyNode = document.createElement("tbody");
	myTable.appendChild(tbodyNode);
	var settings;
	if (isMaster) {
		var n = factory.data.uplinkCoupling == 1 ? 1 : 0;
		settings = tbs_settings[n];
	} else {
		settings = rfin_settings;
	}
	trNode = createMetRow("rfInPow"+nr, settings, "dBm", "Power", "right");
	tbodyNode.appendChild(trNode);
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("td");
	tdNode.innerHTML = Texts['OVF'];
	tdNode.style.textAlign = "left";
	tdNode.style.fontWeight = "bold";
	trNode.appendChild(tdNode);
	tdNode = createLedBox("rfOvfLed"+nr);
	trNode.appendChild(tdNode);
	if (isMaster) {
		tdNode = document.createElement("td");
		trNode.appendChild(tdNode);
		tdNode.innerHTML = "No&nbsp;Signal";
		tdNode.style.textAlign = "right";
		tdNode.style.whiteSpace = "nowrap";
		tdNode.style.fontWeight = "bold";
		tdNode = createLedBox("tbsFailLed");
		trNode.appendChild(tdNode);
		trNode = createAttenuator("attIn"+nr,0,nr);
		tbodyNode.appendChild(trNode);
	}
	if (!isMaster) {
		trNode = createRfGain("rfGainUL"+nr);
		tbodyNode.appendChild(trNode);
	}
	return box;
}
function agcSet(val, nr) {
	setMetValue('agc'+nr, val);
}
function ovfLedSet(nr, color) {
	ledSetColor("rfOvfLed"+nr, color);
}

function tbsFailLedSet(color) {
	ledSetColor("tbsFailLed", color);
}

function rfInPowSet(nr, val, color) {
	try {
		var el = document.getElementById("met_rfInPow"+nr);
		if (typeof(el) != "undefined" && el) {
			var elmet = el.mMeter;
			if (typeof(color) === 'undefined')
				elmet.valueSet(val);
			else
				elmet.valueSet(val, color);
		}
		var eltxt = document.getElementById("txt_rfInPow"+nr);
		if (typeof(val) === 'undefined' || isNaN(val))
			eltxt.innerHTML = val;
		else
			eltxt.innerHTML = val.toFixed(1);
	} catch (err) {}
}

function inputAttenuatorSet(nr, value) {
	if (nr != 0)
		return;
	try {
		var el = document.getElementById("attIn"+nr);
		if (!isNaN(value))
			el.value = value;
	} catch (err) {}
}

function inputAttenuatorGet(nr) {
	if (nr != 0)
		return;
	try {
		var el = document.getElementById("attIn"+nr);
		return parseInt(el.value);
	} catch (err) {
		return -16;
	}
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
	var isMaster = nr==0;
	var box = document.createElement("div");
	var el = createRfTitle(nr, false);
	box.appendChild(el);
	myTable = document.createElement("table");
	myTable.style.marginLeft = "auto";
	myTable.style.marginRight = "auto";
	box.appendChild(myTable);
	tbodyNode = document.createElement("tbody");
	myTable.appendChild(tbodyNode);
	var s= (isMaster)? master_settings:hpa_settings;
	trNode = createMetRow("rfOutPow"+nr, s, "dBm", "Power", "right");
	tbodyNode.appendChild(trNode);
	if (!isMaster) {
		trNode = document.createElement("tr");
		tbodyNode.appendChild(trNode);
		tdNode = document.createElement("td");
		tdNode.innerHTML = Texts['OVF'];
		tdNode.style.textAlign = "center";
		tdNode.style.fontWeight = "bold";
		trNode.appendChild(tdNode);
		tdNode = createLedBox("hpaOvfLed"+nr);
		trNode.appendChild(tdNode);
		trNode = createRfGain("rfGainDL"+nr);
		tbodyNode.appendChild(trNode);
	}
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	trNode = createMetRow('agc'+nr, agc_settings, "dB", "AGC", "right");
	tbodyNode.appendChild(trNode);
	if (isMaster) {
		trNode = createAttenuator("attOut"+nr,1,nr);
		tbodyNode.appendChild(trNode);
	}
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
function outputAttDisableStateSet(nr, disable) {
	try {
		var el = document.getElementById("attOut"+nr);
		el.disabled = disable? true : false;
		el.style.backgroundColor = disable ? "#CCCCCC" : "white";
	} catch (err) {}
}
function rfOutPowSet(nr, val) {
	try {
		var el = document.getElementById("met_rfOutPow"+nr);
		if (typeof(el) != "undefined" && el) {
			var elmet = el.mMeter;
			elmet.valueSet(val);
		}
		var eltxt = document.getElementById("txt_rfOutPow"+nr);
		if (isNaN(val))
			eltxt.innerHTML = val;
		else
			eltxt.innerHTML = val.toFixed(1);
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

function createAttenuator(id,inout,nr) {
	var trNode = document.createElement("tr");
	var tdNode = document.createElement("td");
	tdNode.innerHTML = Texts['ATTENUATOR'];
	tdNode.style.fontWeight = "bold";
	trNode.appendChild(tdNode);
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	var att = document.createElement("input");
	var k = (nr==0) ? (factory.data.uplinkCoupling == 0 ? 0 : 1) : 1;
	if (inout==0)
		var tooltip = "Min: "+attInLims.min +", Max: "+attInLims.max+" dB";
	else
		var tooltip = "Min: "+attOutLims[k].min +", Max: "+attOutLims[k].max+" dB";
	att.title = tooltip;
	att.id = id;
	att.name = id;
	att.type = "text";
	att.size = "2";
	att.className = "number";
	att.align = "center";
	att.onkeypress = function(ev) {	return numbersOnly(ev);	}
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
	if (id.indexOf("UL") != -1) {
		tdNode.innerHTML = Texts['GAIN']+"&nbsp;(UL:&nbsp;M&nbsp;&laquo;&#8212;&nbsp;R)";
		tdNode.colSpan = 2;
	} else if (id.indexOf("DL") != -1) {
		tdNode.innerHTML = Texts['GAIN']+"&nbsp;(DL:&nbsp;M&nbsp;&#8212;&raquo;&nbsp;R)";
		tdNode.colSpan = 2;
	} else {
		tdNode.innerHTML = Texts['GAIN'];
	}
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
	tbl.style.marginLeft = "auto";
	tbl.style.marginRight = "auto";
	box.appendChild(tbl);
	var tb = document.createElement("tbody");
	tbl.appendChild(tb);
	var tr = document.createElement("tr");
	tb.appendChild(tr);
	var td = document.createElement("th");
	td.innerHTML = Texts['TEMPERATURE'];
	td.style.textAlign = "left";
	tr.appendChild(td);
	td = document.createElement("td");
	td.id = "boardTempMet"+nr;
	tr.appendChild(td);
	var s = board_temp_settings;
	var boardTempMet = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
	boardTempMet.attachTo(td);
	boardTempMet.valueSet(s.min);
	boardTempMet.setFloat("right");
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
	td.style.textAlign = "left";
	tr.appendChild(td);
	if (nr == 0) {
		td = createLedBox("fpgaLed"+nr);
		tr.appendChild(td);
	}
	td = document.createElement("td");
	td.colSpan = 2;
	tr.appendChild(td);
	el = createUnitReset(nr);
	td.appendChild(el);
	return box;
}
function boardTempSet(nr, val) {
	try {
		var el = document.getElementById("boardTempMet"+nr);
		if (typeof(el) != "undefined" && el) {
			var elmet = el.mMeter;
			if (!isNaN(val))
				elmet.valueSet(val);
			else
				elmet.valueSet(board_temp_settings.min);
		}
		var eltxt = document.getElementById("boardTempTxt"+nr);
		if (!isNaN(val)) {
			eltxt.innerHTML = val.toFixed(0);
		} else {
			eltxt.innerHTML = "---";
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
	myTable.style.marginLeft = "auto";
	myTable.style.marginRight = "auto";
	box.appendChild(myTable);
	tbodyNode = document.createElement("tbody");
	myTable.appendChild(tbodyNode);
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
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
	trNode = createAttenuator("attOut"+nr,1,nr);
	tbodyNode.appendChild(trNode);
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
		submitform(-1);
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

function enHpaLedSet(nr, val) {
	ledSetColor("hpaEnLed"+nr, val);
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
function remoteInputsDisableStateSet(n, disable) {
	resetDisableStateSet(n, disable);
	hpaSwDisableStateSet(n, disable);
	outputAttDisableStateSet(n, disable);
	filtEnDisableStateSet(n, disable);
	filtSqEnDisableStateSet(n, disable);
	filtSqThrDisableStateSet(n, disable);
	for (var ch = 1, mask = 1; ch <= window.top.MaxChNr; ++ch) {
		chEnDisableStateSet(ch, n, disable);
		chBwDisableStateSet(ch, n, disable);
		chFineGainDisableStateSet(ch, n, disable);
	}
}
function  createFiberPopupLinks() {
	var box = document.createElement("div");
	var myTable, tbodyNode;
	myTable = document.createElement("table");
	box.appendChild(myTable);
	myTable.style.borderSpacing = "7px";
	tbodyNode = document.createElement("tbody");
	tbodyNode.id = "fiberPopupLinksBody";
	myTable.appendChild(tbodyNode);
	return box;
}
function  createExpansorPopupLinks() {
	var box = document.createElement("div");
	var myTable, tbodyNode;
	myTable = document.createElement("table");
	box.appendChild(myTable);
	myTable.style.borderSpacing = "10px";
	tbodyNode = document.createElement("tbody");
	tbodyNode.id = "expansorPopupLinksBody";
	myTable.appendChild(tbodyNode);
	return box;
}
function fiberLinkLedSet(nr, color) {
	var idx = getRemoteIndex(nr, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
	ledSetColor("fiberLinkLed"+idx, color);
}
function expansorLinkLedSet(ne,color){
	ledSetColor("expansorLinkLed"+ne, color);
}
function appendExpansorPopupLink(ne){
	var masterTableBody = document.getElementById("expansorPopupLinksBody");
	var tr = document.createElement("tr");
	masterTableBody.appendChild(tr);
	var td = document.createElement("td");
	tr.appendChild(td);
	var el = document.createElement("a");
	td.appendChild(el);
	el.innerHTML = Texts['EXPANSORLINK']+"&nbsp;"+ne;
	el.className = "m";
	el.style.fontSize = "11px";
	el.href = "/optLink.html?linkNr=0;remotesNr="+window.top.remotesNr+";MaxRemotesNr="+window.top.MaxRemotesNr+";remotesMask="+window.top.remotesBitmask+";ne="+ne;
	el.onclick = function() {optPopup(0,ne,this.href);return false;};
	td = createLedBox("expansorLinkLed"+ne);
	tr.appendChild(td);
}
function appendFiberPopupLink(nr) {
	var masterTableBody = document.getElementById("fiberPopupLinksBody");
	var tr = document.createElement("tr");
	masterTableBody.appendChild(tr);
	var td = document.createElement("td");
	tr.appendChild(td);
	var el = document.createElement("a");
	td.appendChild(el);
	var idx = getRemoteIndex(nr, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
	el.innerHTML = Texts['REMOTELINK']+"&nbsp;"+idx;
	el.className = "m";
	el.style.fontSize = "11px";
	el.href = "/optLink.html?linkNr="+nr+";remotesNr="+window.top.remotesNr+";MaxRemotesNr="+window.top.MaxRemotesNr+";remotesMask="+window.top.remotesBitmask+";ne=0";
	el.onclick = function() {optPopup(nr,0,this.href);return false;};
	td = createLedBox("fiberLinkLed"+idx);
	tr.appendChild(td);
}
function createExpansorTable(){
	for (var n=1;n<=window.top.expansorNr;++n)
	{
		appendExpansorPopupLink(n);
	}
}
function createFiberTable(nr) {
	if (window.top.expansorNr!=0 && nr==1) createExpansorTable();
	var box = document.createElement("div");
	var h = document.createElement("div");
	h.style.textAlign = "center";
	box.appendChild(h);
	var el = document.createElement("a");
	h.appendChild(el);
	var idx = getRemoteIndex(nr, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
	el.innerHTML = Texts['REMOTELINK']+"&nbsp;"+idx;
	el.className = "m";
	el.style.fontSize = "11px";
	el.href = "/optLink.html?linkNr="+nr+";remotesNr="+window.top.remotesNr+";MaxRemotesNr="+window.top.MaxRemotesNr+";remotesMask="+window.top.remotesBitmask+";ne=0";
	el.onclick = function() {optPopup(nr,0,this.href);return false;};
	
	appendFiberPopupLink(nr);
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
	tdNode.innerHTML = Texts['REMOTE'];
	tdNode.style.textAlign = "center";
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = Texts['MASTER'];
	tdNode.style.textAlign = "center";
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = Texts['SYNC'];
	tdNode.style.textAlign = "right";
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
	for (var i = 1; i >= 0; --i) {
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
	for (var i = 1; i >= 0; --i) {
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
	for (var i = 1; i >= 0; --i) {
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
	for (var i = 1; i >= 0; --i) {
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
	for (var i = 1; i >= 0; --i) {
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

function optPopup(nr,ne,url) {
	if (optPopupWindow && !optPopupWindow.closed)
		optPopupWindow.close();
	var w = 560;
	var h = 280;
	var left = (screen.width/2)-(w/2);
	var top = (screen.height/2)-(h/2);
	//if remote, ne=0, if expansor ne>0
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
		var el = document.getElementById("fiberRxPowMet"+(isRemote? 1:0)+nr);
		if (typeof(el) != "undefined" && el) {
			var elmet = el.mMeter;
			if (typeof(color) === 'undefined' || color === null)
				elmet.valueSet(val);
			else
				elmet.valueSet(val, color);
		}
		var eltxt = document.getElementById("optPowInText"+(isRemote? 1:0)+nr);
		if (typeof(eltxt) == "undefined" || !eltxt)
			return;
		if (typeof(val) === "undefined" || val == null)
			eltxt.innerHTML = "";
		else if (isNaN(val) && isNaN(parseInt(val)))
			eltxt.innerHTML = val;
		else
			eltxt.innerHTML = val.toFixed(1);
	} catch (err) { }
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