ch_Bw_Txt = ["90", "45", "30", "20", "15"];
var tbs_settings = {min: -20, low_alarm: -20, low_warn: -20, high_warn: 25, high_alarm: 25, max: 30 };
var board_temp_settings = {min: -40, low_alarm: -40, low_warn: -40, high_warn: 80, high_alarm: 85, max: 90 };
var hpa_settings = {min: 0, low_alarm: 0, low_warn: 20, high_warn: 42, high_alarm: 43, max: 45 };
var rfin_settings = {min: -90, low_alarm: -128, low_warn: -128, high_warn: 0, high_alarm: 0, max: -20 };
var hpa_temp_settings = {min: -40, low_alarm: -40, low_warn: -40, high_warn: 60, high_alarm: 60, max: 90 };
var chPowIn_settings = {min: -120, low_alarm: -128, low_warn: -128, high_warn: 0, high_alarm: 0, max: -20 };
var optRxPow_settings = {min: -40, low_alarm: -25, low_warn: -25, high_warn: 1, high_alarm: 1, max: 10 };
var agc_settings = {min: 0, low_alarm: 0, low_warn: 0, high_warn: 80, high_alarm: 80, max: 80 };
var persist_settings = {min: 0, max: 600};

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
function redrawAll(init) {
	removeAllElements();
	renderPage(1);
	showMainBackupCtrl(!factory.isStandard());
	hideSimplexControl(!factory.isSimplex());
	parse_config(confStr);
	parse_tags(tagsframe);
	if (init) initFormChangeCheck();
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
	cell.style.minWidth = "70px";
	headDiv.appendChild(cell);
	cell = document.createElement("td");
	cell.id = "tagName"+nr;
	cell.style.width = "100%";
	cell.style.textAlign = "center";
	cell.className = "tag";
	cell.innerHTML = "Tag "+nr;
	headDiv.appendChild(cell);
	cell = document.createElement("td");
	headDiv.appendChild(cell);
	cell.appendChild(createMainBackup());
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

function createMainBackup() {
	var box = document.createElement("div");
	box.id = "mainBackupBox";
	box.style.marginRight = "20px";
	box.style.visibility = "hidden";
	var tab = document.createElement("table");
	box.appendChild(tab);
	var tb = document.createElement("tb");
	tab.appendChild(tb);
	var tr = document.createElement("tr");
	tb.appendChild(tr);
	var txtnd = document.createTextNode("REMOTE MODE");
	var td = document.createElement("td");
	td.appendChild(txtnd);
	td.className = "small";
	td.style.paddingRight = "5px";
	td.style.whiteSpace = "nowrap";
	td.style.verticalAlign = "middle";
	tr.appendChild(td);
	var el = document.createElement("select");
	el.id = el.name = "mbSel";
	for (var i = 0; i < 2; ++i) {
		var opt = document.createElement("option");
		opt.text = i == 0 ? "MAIN" : "BACKUP";
		opt.value = i;
		el.options.add(opt);
	}
	el.style.fontSize = "14px";
	el.style.display = "inline";
	el.onchange = function(ev) {
		var show = false;
		if (this.selectedIndex == 0 && !factory.isStandard()) {
			show = true;
		}
		showForceBackup(show);
	}
	td = document.createElement("td");
	td.style.verticalAlign = "middle";
	td.appendChild(el);
	tr.appendChild(td)
	return box;
}

function showMainBackupCtrl(show) {
	try {
		var el = document.getElementById("mainBackupBox");
		el.style.visibility = (show ? "visible" : "hidden");
	} catch(err) {}
}

function setMainBackupCtrl(bak) {
	try {
		var el = document.getElementById("mbSel");
		if (!el) {
			return;
		}
		el.selectedIndex = (bak ? 1 : 0);
		el.onchange();
	} catch(err) {}	
}

function readMainBackupCtrl() {
	try {
		var el = document.getElementById("mbSel");
		if (!el) {
			return -1;
		}
		return el.selectedIndex;
	} catch(err) {}	
}

function createBackupSimplex() {
	var box = document.createElement("div");
	box.id = "forceBackupBox";
	box.style.width = "100%";
	box.style.display = "none";
	var innerBox = document.createElement("div");
	innerBox.style.width = "100%";
	box.appendChild(innerBox);
	var tab = document.createElement("table");
	tab.style.marginLeft = tab.style.marginRight = "auto";
	tab.style.marginBottom = "10px";
	innerBox.appendChild(tab);
	var tb = document.createElement("tbody");
	tab.appendChild(tb);
	var tr = document.createElement("tr");
	tb.appendChild(tr);
	var td = document.createElement("td");
	tr.appendChild(td);
	td.appendChild(createBackupSel());
	td = document.createElement("td");
	tr.appendChild(td);
	td.appendChild(createSimplexSel());
	return box;
}

function createBackupSel() {
	var tab = document.createElement("table");
	tab.style.outline = "thin solid #db5902";
	var tb = document.createElement("tbody");
	tab.appendChild(tb);
	var tr = document.createElement("tr");
	tb.appendChild(tr);
	var td = document.createElement("th");
	tr.appendChild(td);
	td.innerHTML = "Force&nbsp;Remote&nbsp;Backup";
	td = document.createElement("td");
	tr.appendChild(td);
	var el = document.createElement("input");
	el.type = "checkbox";
	el.id = el.name = "forceBackup";
	el.style.marginRight = el.style.marginLeft = "10px";
	td.appendChild(el);
	return tab;
}

function showForceBackup(show) {
	try {
		var el = document.getElementById("forceBackupBox");
		el.style.display = (show ? "block" : "none");
	} catch(err) {}
}

function setForceBackup(on) {
	try {
		var el = document.getElementById("forceBackup");
		el.checked = (on ? true : false);
	} catch(err) {}
}

function readForceBackup() {
	try {
		var el = document.getElementById("forceBackup");
		return el.checked;
	} catch(err) { return -1; }
}

function renderUnitContent(nr, parent) {
	var isMaster = nr==0;
	var showPla = factory.isPlaAllowed();
	var rsp;
	if (showPla) {
		rsp = 3;
	} else {
		rsp = 2;
	}
	var tab = document.createElement("table");
	tab.className = "contenttable";
	parent.appendChild(tab);
	var tb = document.createElement("tb");
	tab.appendChild(tb);
	var row1 = document.createElement("tr");
	tb.appendChild(row1);
	var row2 = document.createElement("tr");
	tb.appendChild(row2);
	var row3 = document.createElement("tr");
	tb.appendChild(row3);
	row3.style.display = showPla ? "table-row" : "none";

	var cell = document.createElement("td");
	cell.className = "contentcell";
	cell.rowSpan = rsp;
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

	cell = document.createElement("td");
	cell.className = "contentcell";
	el = createHpaTable(nr);
	cell.appendChild(el);
	row1.appendChild(cell);

	cell = document.createElement("td");
	cell.className = "contentcell";
	cell.height = "100%";
	cell.vAlign = "bottom";
	el = createStatusTable(nr);
	cell.appendChild(el);
	row2.appendChild(cell);
	cell = document.createElement("td");
	cell.style.width = "100%";
	cell.rowSpan = rsp;
	row1.appendChild(cell);
	cell = document.createElement("td");
	cell.className = "contentcell";
	cell.rowSpan = rsp;
	row1.appendChild(cell);
	el = createFiberTable();
	cell.appendChild(el);
	
	cell = document.createElement("td");
	cell.style.display = "none";
	row3.appendChild(cell);
	cell = document.createElement("td");
	cell.className = "contentcell";
	cell.id = "plaCont";
	cell.colSpan = 2;
	row3.appendChild(cell);
	cell.appendChild(createPla());
}

function createFilteringTable(nr) {
	var isMaster = nr==0;
	var filtBox = document.createElement("div");
	filtBox.appendChild(createBackupSimplex());
	var filtTitle = createFilteringTitle(nr);
	filtBox.appendChild(filtTitle);
	var chCtl = createChCtlTable(nr);
	filtBox.appendChild(chCtl);
	var filtCtl = createFilterCtlTable(nr);
	filtBox.appendChild(filtCtl);
	if ((window.top.FiberMask==0x03) && (window.top.Mode==0x8)){
		var chTbl = createChannelTable(nr,1,12,"MASTER PRIMARY");
		filtBox.appendChild(chTbl);	
		var chTbl = createChannelTable(nr,13,24,"MASTER SECONDARY");
		filtBox.appendChild(chTbl);			
	}
	else{
		var chTbl = createChannelTable(nr,1,24,"");
		filtBox.appendChild(chTbl);	
	}

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
	tbodyNode.appendChild(trNode);	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = Texts['SHOWCH']+"&nbsp;&nbsp;(1-"+window.top.MaxChNr/2+")";
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
			redrawAll(true);
		}
		if (i==window.top.MaxChNr/2-1)
		{
			myTable.appendChild(tbodyNode);
			trNode = document.createElement("tr");
			tbodyNode.appendChild(trNode);	trNode = document.createElement("tr");
			tbodyNode.appendChild(trNode);
			tdNode = document.createElement("th");
			trNode.appendChild(tdNode);
			tdNode.innerHTML = Texts['SHOWCH']+"&nbsp;("+(window.top.MaxChNr/2+1)+"-"+window.top.MaxChNr+")";
			tdNode.style.textAlign = "right";
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
	if (factory.data.allowDisFilt) {
		tdNode = document.createElement("th");
		tdNode.innerHTML = Texts['FENABLE'];
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
	}
	if (factory.data.persistEnable) {
		tdNode = document.createElement("th");
		tdNode.innerHTML = "Persist&nbsp;time&nbsp;(s)";
		tdNode.style.display = "inline";
		tdNode.style.textAlign = "right";
		tdNode.style.marginRight = "0px";
		tdNode.style.marginLeft = "5px";
		tdNode.style.whiteSpace = "nowrap";
		trNode.appendChild(tdNode);
		var persistTime = document.createElement("input");
		persistTime.id = "persistTime_"+nr;
		persistTime.name = persistTime.id;
		persistTime.type = "text";
		persistTime.size = 5;
		persistTime.className = "number";
		persistTime.style.display = "inline";
		persistTime.title = "OFF 0s, Min. 1s, Max. "+persist_settings.max+"s.";
		persistTime.onkeypress = function(ev) { return numbersOnly(ev); }
		tdNode.appendChild(persistTime);
	}
	tdNode = document.createElement("td");
	tdNode.style.width = "100%";
	trNode.appendChild(tdNode);
	tdNode = document.createElement("th");
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
	tdNode = document.createElement("th");
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
	sqThr.onkeypress = function(ev) { return isKeyDecimalNumber(ev); }
	sqThr.className = "number";
	sqThr.style.display = "inline";
	tdNode.appendChild(sqThr);
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = "dBm";
	tdNode.style.textAlign = "left";
	tdNode.style.leftRight = "0px";
	tdNode.style.display = "inline";
	return box;
}

function createSimplexSel() {
	var tab = document.createElement("table");
	tab.id = "SimplexTitle";
	var tb = document.createElement("tbody");
	tab.appendChild(tb);
	var tr = document.createElement("tr");
	tb.appendChild(tr);
	var td = document.createElement("th");
	tr.appendChild(td);
	td.innerHTML = "Simplex";
	td = document.createElement("td");
	td.id = "SimplexBox";
	tr.appendChild(td);
	var el = document.createElement("input");
	el.type = "checkbox";
	el.id = el.name = "simplex";
	el.style.marginRight = el.style.marginLeft = "10px";
	td.appendChild(el);
	return tab;
}

function hideSimplexControl(doHide) {
	try {
		var boxTitle = document.getElementById("SimplexTitle");
		var box = document.getElementById("SimplexBox");
		if (doHide) {
			boxTitle.style.display = "none";
			box.style.display = "none";
		}
	} catch(err) {}
}

function simplexEnSet(simplex) {
	try {
		var el = document.getElementById("simplex");
		el.checked = simplex;
	} catch(err) {}
}

function simplexIsSet() {
	try {
		var el = document.getElementById("simplex");
		return el.checked;
	} catch(err) { return false; }
}
function persistTimeSet(nr, t) {
	try {
		if (isNaN(t)) {
			return;
		}
		var el = document.getElementById("persistTime_"+nr);
		el.value = t;
	} catch (err) {}
}

function persistTimeGet(nr) {
	try {
		var el = document.getElementById("persistTime_"+nr);
		var v = el.value;
		if (v < persist_settings.min) {
			v = persist_settings.min;
		} else if (v > persist_settings.max) {
			v = persist_settings.max;
		}
		return v;
	} catch (err) { return -1; }
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
function getRemoteMode(){
	return 0;
/*
	try {
	var selmode = document.getElementById("mode_remote");
	if (selmode.selectedIndex ==1 )
		return true;
	else
		return false;
	} catch (err) {
		return false;
	}
*/
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
		return ~~Math.round(parseFloat(el.value));
	} catch (err) {
		return -128;
	}
}

function createChannelTable(nr,start,stop,title) {
	var chBox = document.createElement("div");
	var chFiltTable = document.createElement("table");
	chFiltTable.style.border = "1px solid #db5902";
	chFiltTable.style.borderLeft="1px solid #db5902";
	chFiltTable.style.padding = "1px 1px 1px 1px";
	chFiltTable.style.marginBottom = "3px";
	chFiltTable.style.marginRight = "auto";
	chFiltTable.style.marginLeft = "auto";
	chBox.appendChild(chFiltTable);
	var chFiltTbody = document.createElement("tbody");
	chFiltTable.appendChild(chFiltTbody);
	if (title.length>0){
		var chFiltTrow = createFilterTableTitle(nr,title);
		chFiltTbody.appendChild(chFiltTrow);
	}	
	var chFiltTrow = createFilterTableHeader(nr);
	chFiltTbody.appendChild(chFiltTrow);
	var mask = 1<<(start-1);
	for (var ch = start; ch <= stop; ch++) {
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
function createFilterTableTitle(nr,title){
	var chFiltRow = document.createElement("tr");
	var td = document.createElement("td");
	td.style.textAlign = "center";
	td.className = "small";
	chFiltRow.style.border = "1px solid #db5902";
	td.innerHTML = title;
	td.colSpan = 10;
	chFiltRow.appendChild(td);
	return chFiltRow;
}
function createFilterTableHeader(nr) {
	var chFiltRow = document.createElement("tr");
	chFiltRow.style.textAlign = "center";
	var td = document.createElement("th");
	chFiltRow.appendChild(td);
	td.innerHTML = "Filt.";
	td = document.createElement("th");
	chFiltRow.appendChild(td);
	td.innerHTML = "On";
	td = document.createElement("th");
	chFiltRow.appendChild(td);
	/*if ((window.top.FiberMask==0x03) && (window.top.Mode==0x8))
	{
		td.innerHTML = "M1";
		td = document.createElement("td");
		chFiltRow.appendChild(td);	
		td.innerHTML = "M2";
		td = document.createElement("td");
		chFiltRow.appendChild(td);		
	}*/
	td.innerHTML = "Fr.&nbsp;(MHz)";
	td = document.createElement("th");
	chFiltRow.appendChild(td);
	td.innerHTML = "G&nbsp;(dB)";
	td = document.createElement("th");
	chFiltRow.appendChild(td);
	td.innerHTML = "Bw&nbsp;(KHz)";
	td = document.createElement("th");
	chFiltRow.appendChild(td);
	td.innerHTML = Texts['POWER'];
	td = document.createElement("th");
	chFiltRow.appendChild(td);
	td.innerHTML = "dBm";	
	td = document.createElement("th");
	chFiltRow.appendChild(td);
	td.innerHTML = "Det";
	td = document.createElement("th");
	chFiltRow.appendChild(td);
	td.innerHTML = "AGC";
	td = document.createElement("th");
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
	/*if ((window.top.FiberMask==0x03) && (window.top.Mode==0x8))
	{
		td = document.createElement("td");
		td.id = "chEnBoxM1"+ch+nr;
		chFiltRow.appendChild(td);
		var chEn = document.createElement("input");
		chEn.id = "chEnM1"+ch+nr;
		chEn.name = chEn.id;
		chEn.setAttribute("type", "checkbox");
		td.appendChild(chEn);	
	
		td = document.createElement("td");
		td.id = "chEnBoxM2"+ch+nr;
		chFiltRow.appendChild(td);
		var chEn = document.createElement("input");
		chEn.id = "chEnM2"+ch+nr;
		chEn.name = chEn.id;
		chEn.setAttribute("type", "checkbox");
		td.appendChild(chEn);		
	}*/
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
	chFr.onkeypress = function(ev) { return isKeyDecimalNumber(ev); }
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
	chGain.onkeypress = function(ev) { return isKeyDecimalNumber(ev); }
	chGain.className = "number";
	td.appendChild(chGain);
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	var chBw = createChBwSel(ch, nr);
/*	var chBw = document.createElement("select");
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
*/	td.appendChild(chBw);
	td = document.createElement("td");
	td.id = "chPowMet"+ch+nr;
	chFiltRow.appendChild(td);
	var s = chPowIn_settings;
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
	td.style.textAlign = "center";
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

/*function chEnableMSet(ch, m, on) {
	var el = document.getElementById("chEnM"+m+ch+"1");
	try {
		el.checked = on ? true : false;
	} catch (err) {	}
}*/

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
	if (!el) {
		return -1;
	} else if (el.checked) {
		return 1;
	} else {
		return 0;
	}
}
/*function chEnableMIsSet(ch, m) {
	var el = document.getElementById("chEnM"+m+ch+"1");
	try {
		return el.checked;
	} catch (err) {
		return false;
	}
}*/
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
	/*
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
	*/
}

function chFineGainGet(ch, nr) {
	var el = document.getElementById("chGain"+ch+nr);
	try {
		return ~~Math.round(parseFloat(el.value));
	} catch (err) {
		return Number.NaN;
	}
}

function createChBwSel(ch, nr) {
	var ch_Bw_Txt = [
		{lbl: "180", cfg: 5}, 
		{lbl: "90", cfg: 0},
		{lbl: "45", cfg: 1},
		{lbl: "30", cfg: 2},
		{lbl: "20", cfg: 3},
		{lbl: "15", cfg: 4}
	];
	var has180 = hasBw180Khz(nr);
	if (!has180) {
		ch_Bw_Txt.shift();
	}
	var chBw = document.createElement("select");
	chBw.id = "chBw"+"_"+ch+"_"+nr;
	chBw.name = chBw.id;
	for (var i = 0; i < ch_Bw_Txt.length; i++) {
		var chBwOpt = document.createElement("option");
		chBw.options.add(chBwOpt);
		chBwOpt.text = ch_Bw_Txt[i].lbl;
		chBwOpt.value = ch_Bw_Txt[i].cfg;
	}
	chBw.selectedIndex = 0;
	chBw.style.marginLeft = "4px";
	chBw.style.marginRight = "2px";
	chBw.style.fontSize = "10px";
	chBw.style.verticalAlign = "middle";
	return chBw;
}

function hasBw180Khz(nr) {
	return true;
}

function chBwSet(ch, nr, bw) {
	var el = document.getElementById("chBw"+"_"+ch+"_"+nr);
	try {
		for (var i = 0; i < el.options.length; ++i) {
			if (bw == el.options[i].value) {
				el.selectedIndex = i;
				break;
			}
		}
	} catch (err) {}
}

function chBwGet(ch, nr) {
	var el = document.getElementById("chBw"+"_"+ch+"_"+nr);
	try {
		var k = el.selectedIndex;
		return (el.options[k].value);
	} catch (err) { return Number.NaN; }
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
	trNode = createMetRow("rfInPow"+nr, settings, "dBm", "Power");
	tbodyNode.appendChild(trNode);
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("td");
	tdNode.innerHTML = Texts['OVF'];
	tdNode.style.minWidth = "70px";
	tdNode.style.textAlign = "left";
	tdNode.style.fontWeight = "bold";
	tdNode.colSpan = 2;
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
	trNode = createMetRow("rfOutPow"+nr, settings, "dBm", "Power");
	tbodyNode.appendChild(trNode);
	trNode = createDlPwrAlrm();
	tbodyNode.appendChild(trNode);
	trNode = createAttenuator("attOut"+nr);
	tbodyNode.appendChild(trNode);
	trNode = createMetRow("agc", agc_settings, "dB", "AGC");
	tbodyNode.appendChild(trNode);
	tbodyNode.appendChild(trNode);
	return box;
}
function delaySet(link,nr,value) {
	try {
		var linkc = (link==0)?"u":"d";
		var el = document.getElementById(linkc+"ldelay"+nr);
		if (!isNaN(value))
			el.value = value.toFixed(1);
	} catch (err) {}
}
function delayGet(link,nr) {
	try {
		var linkc = (link==0)?"u":"d";
		var el = document.getElementById(linkc+"ldelay"+nr);
		return parseFloat(el.value);
	} catch (err) {
		return "undefined";
	}
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

function rfOutPowSet(nr, val, alrm) {
	try {
		var elmet = document.getElementById("met_rfOutPow"+nr).mMeter;
		if (typeof(alrm) === 'undefined' || !alrm) {
			elmet.valueSet(val);
		} else {
			elmet.valueSet(val, "#df4040");
		}
		var eltxt = document.getElementById("txt_rfOutPow"+nr);
		if (typeof(val) === 'undefined' || isNaN(val)) {
			eltxt.innerHTML = val;
		} else {
			if (val == -128) {
				eltxt.innerHTML = "OFF";
			} else {
				eltxt.innerHTML = val.toFixed(1);
			}
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

function createDlPwrAlrm() {
	var trNode = document.createElement("tr");
	var tdNode = document.createElement("th");
	tdNode.innerHTML = "DL&nbsp;Power&nbsp;Alarm";
	tdNode.style.textAlign = "left";
	tdNode.colSpan = 2;
	trNode.appendChild(tdNode);
	tdNode = createLedBox("dlPwrAlrmLed");
	trNode.appendChild(tdNode);
	return trNode;
}

function dlPwrAlrmLedSet(alrm)
{
	var color = alrm ? "red" : "grey";
	ledSetColor("dlPwrAlrmLed", color);
}

function createAttenuator(id) {
	var trNode = document.createElement("tr");
	var tdNode = document.createElement("th");
	tdNode.innerHTML = Texts['ATTENUATOR'];
	tdNode.style.fontWeight = "bold";
	tdNode.style.textAlign = "left";
	tdNode.colSpan = 2;
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
	td.style.textAlign = "left";
	tr.appendChild(td);
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
	td.style.textAlign = "center";
	td.className = "stabval";
	td.innerHTML = "--";
	tr.appendChild(td);
	td = document.createElement("td");
	tr.appendChild(td);
	td.innerHTML = "&ordm;C";
	tr = document.createElement("tr");
	tb.appendChild(tr);
	td = document.createElement("th");
	td.innerHTML = Texts['HWFAIL'];
	td.style.textAlign = "left";
	tr.appendChild(td);
	td = createLedBox("fpgaLed"+nr);
	tr.appendChild(td);
	tr = document.createElement("tr");
	tb.appendChild(tr);
	td = document.createElement("th");
	td.innerHTML = "Door&nbsp;Open";
	td.id = "doorOpenLabel";
	td.style.textAlign = "left";
	tr.appendChild(td);
	td = createLedBox("doorOpenLed");
	tr.appendChild(td);
	tr = document.createElement("tr");
	tb.appendChild(tr);
	td = document.createElement("td");
	td.colSpan = 2;
	tr.appendChild(td);
	el = createClearCounters();
	td.appendChild(el);
	td.style.paddingTop = "5px";
	td = document.createElement("td");
	tr.appendChild(td);
	td = document.createElement("td");
	td.colSpan = 2;
	tr.appendChild(td);
	el = createUnitReset(nr);
	td.appendChild(el);
	td.style.paddingTop = "5px";
	return box;
}
function boardTempSet(nr, val, alrm) {
	try {
		var elmet = document.getElementById("boardTempMet"+nr).mMeter;
		var eltxt = document.getElementById("boardTempTxt"+nr);
		if (typeof(alrm) === 'undefined' || !alrm) {
			elmet.valueSet(val);
		} else {
			elmet.valueSet(val, "#df4040");
		}
		if (!isNaN(val)) {
			eltxt.innerHTML = val.toFixed(0);
		} else {
			eltxt.innerHTML = "---";
			elmet.valueSet(board_temp_settings.min);
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
	myTable.style.width = "100%";
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
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	if (window.top.NFPAMonitor!=0){
		tdNode = document.createElement("td");
		tdNode.innerHTML = Texts['COMERR'];
		tdNode.style.textAlign = "left";
		tdNode.style.fontWeight = "bold";
		trNode.appendChild(tdNode);
		tdNode = createLedBox("hpaStatLed"+nr);
		trNode.appendChild(tdNode);
	}
	tdNode = document.createElement("td");
	tdNode.innerHTML = (window.top.NFPAMonitor != 0 ? Texts['AGCFAIL'] : Texts['PAOVF']);
	tdNode.style.textAlign = "left";
	tdNode.style.fontWeight = "bold";
	trNode.appendChild(tdNode);	
	tdNode = createLedBox("hpaOvfLed"+nr);
	trNode.appendChild(tdNode);	
	if (window.top.NFPAMonitor!=0){	
		trNode = document.createElement("tr");
		tbodyNode.appendChild(trNode);
		tdNode = document.createElement("td");
		tdNode.innerHTML = Texts['VSWR'];
		tdNode.style.textAlign = "left";
		tdNode.style.fontWeight = "bold";
		trNode.appendChild(tdNode);
		tdNode = createLedBox("hpaVswrLed"+nr);
		trNode.appendChild(tdNode);
		tdNode = document.createElement("td");
		tdNode.innerHTML = Texts['TXLOW'];
		tdNode.style.textAlign = "left";
		tdNode.style.fontWeight = "bold";
		trNode.appendChild(tdNode);	
		tdNode = createLedBox("hpaTxLowLed"+nr);
		trNode.appendChild(tdNode);		
		trNode = document.createElement("tr");
		tbodyNode.appendChild(trNode);
		tdNode = document.createElement("td");
		tdNode.innerHTML = Texts['PAFAIL'];
		tdNode.style.textAlign = "left";
		tdNode.style.fontWeight = "bold";
		trNode.appendChild(tdNode);
		tdNode = createLedBox("paFailLed"+nr);
		trNode.appendChild(tdNode);		
	}
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

function statHpaLedSet(nr,val){
	ledSetColor("hpaStatLed"+nr, val);
}
function statPAFailLedSet(nr,val){
	ledSetColor("paFailLed"+nr, val);
}
function txLowHpaLedSet(nr,val){
	ledSetColor("hpaTxLowLed"+nr, val);
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

function fiberLinkLedSet(nr, color) {
	var idx = getRemoteIndex(nr, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
	ledSetColor("fiberLinkLed"+idx, color);
}

function createFiberTable() {
	var twofibers = (window.top.FiberMask==0x03);
	var box = document.createElement("div");
	var h = document.createElement("div");
	h.style.textAlign = "center";
	box.appendChild(h);
	var el = document.createElement("a");
	el.id = "linknumbertitle";
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
	if (twofibers){
		trNode = document.createElement("tr");
		tbodyNode.appendChild(trNode);
		tdNode = document.createElement("th");
		trNode.appendChild(tdNode);	
		tdNode = document.createElement("th");
		tdNode.innerHTML = "PORT1";
		tdNode.style.minWidth = "48px";
		trNode.appendChild(tdNode);			
		tdNode = document.createElement("th");
		tdNode.innerHTML = "PORT2";
		tdNode.style.minWidth = "48px";
		trNode.appendChild(tdNode);	
		if (window.top.Mode==0){
			trNode = document.createElement("tr");
			tbodyNode.appendChild(trNode);
			tdNode = document.createElement("th");
			tdNode.innerHTML = Texts['ACTLINK'];
			tdNode.style.textAlign = "right";
			tdNode.style.whiteSpace = "nowrap";			
			trNode.appendChild(tdNode);	
			tdNode = createLedBox("actlink1");
			trNode.appendChild(tdNode);
			tdNode = createLedBox("actlink2");
			trNode.appendChild(tdNode);	
		}
		
	}
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = Texts['STATUS'];
	tdNode.style.textAlign = "right";
	tdNode = createLedBox("optStatusLed1");
	trNode.appendChild(tdNode);
	if (twofibers){
		tdNode = createLedBox("optStatusLed2");
		trNode.appendChild(tdNode);
	}
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = Texts['RXDETECT'];
	tdNode.style.textAlign = "right";
	tdNode.style.whiteSpace = "nowrap";
	tdNode = createLedBox("optRxLed1");
	trNode.appendChild(tdNode);
	if (twofibers){
		tdNode = createLedBox("optRxLed2");
		trNode.appendChild(tdNode);
	}
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = Texts['RXCOMM'];
	tdNode.style.textAlign = "right";
	tdNode.style.whiteSpace = "nowrap";
	tdNode = createLedBox("optRxCommLed1");
	trNode.appendChild(tdNode);
	if (twofibers){
		tdNode = createLedBox("optRxCommLed2");
		trNode.appendChild(tdNode);
	}
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = Texts['ERRCOUNT'];
	tdNode.style.textAlign = "right";
	tdNode.style.whiteSpace = "nowrap";
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	tdNode.id = "optGtpErrVal1";
	tdNode.innerHTML = "0";
	tdNode.style.textAlign = "center";
	tdNode.className = "tabval";
	if (twofibers){
		tdNode = document.createElement("td");
		trNode.appendChild(tdNode);
		tdNode.id = "optGtpErrVal2";
		tdNode.innerHTML = "0";
		tdNode.style.textAlign = "center";
		tdNode.className = "tabval";
	}	
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = Texts['RXPOWER'];
	tdNode.style.textAlign = "right";
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	tdNode.id = "optPowInText1";
	tdNode.innerHTML = "-30";
	tdNode.style.textAlign = "center";
	tdNode.className = "tabval";
	if (twofibers){
		tdNode = document.createElement("td");
		trNode.appendChild(tdNode);
		tdNode.id = "optPowInText2";
		tdNode.innerHTML = "-30";
		tdNode.style.textAlign = "center";
		tdNode.className = "tabval";
	}
	/*trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = Texts['TXPOWER'];
	tdNode.style.textAlign = "right";
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	tdNode.id = "optPowOutText1";
	tdNode.innerHTML = "-30";
	tdNode.style.textAlign = "center";
	tdNode.className = "tabval";
	if (twofibers){
		tdNode = document.createElement("td");
		trNode.appendChild(tdNode);
		tdNode.id = "optPowOutText2";
		tdNode.innerHTML = "-30";
		tdNode.style.textAlign = "center";
		tdNode.className = "tabval";
	}*/
	createGdCtrl(tbodyNode, twofibers);
	return box;
}
function createGdCtrl(tbodyNode, twofibers) {
	var trNode, tdNode;
	trNode = document.createElement("tr");
	tdNode = document.createElement("th");
	tdNode.innerHTML = Texts['DCTRL'];
	tdNode.style.textAlign = "right";
	trNode.appendChild(tdNode);
	tdNode = document.createElement("td");
	tdNode.colSpan = 2;
	var gdEn = document.createElement("input");
	gdEn.type = "checkbox";
	gdEn.id = "gdEn";
	gdEn.name = gdEn.id;
	gdEn.tbodyNode = tbodyNode;
	gdEn.twofibers = twofibers;
	gdEn.onclick = function(ev) {
		ev = ev || window.event;
		var el = ev.target;
		if (el.checked) {
			gdShow(el.tbodyNode, el.twofibers);
		} else {
			gdHide();
		}
	}
	gdEn.className = "centered";
	tdNode.appendChild(gdEn);
	trNode.appendChild(tdNode);
	tbodyNode.appendChild(trNode);
	gdShow(tbodyNode, twofibers);
}

function gdEnSet(doSet) {
	try {
		doSet = !!doSet;
		var el = document.getElementById("gdEn");
		el.checked = doSet;
		if (el.checked) {
			gdShow(el.tbodyNode, el.twofibers);
		} else {
			gdHide();
		}
	} catch(err) {}
}

function gdIsEnabled() {
	var el = document.getElementById("gdEn");
	if (el) {
		return el.checked;
	}
	return false;
}
function gdShow(tbodyNode, twofibers) {
	var trNode, tdNode;
	for (var j = 0; j < 2; ++j) {
		var id = "gdTitle"+j;
		tdNode = document.getElementById(id);
		if (!tdNode) {
			trNode = document.createElement("tr");
			tbodyNode.appendChild(trNode);
			tdNode = document.createElement("th");
			tdNode.innerHTML = (j == 0 ? Texts['ULDELAY'] : Texts['DLDELAY']);
			tdNode.style.textAlign = "right";
			tdNode.id = id;
			tdNode.name = tdNode.id;			
			trNode.appendChild(tdNode);
		} else {
			tdNode.style.display = "block";
		}
		for (var i = 0; i < (twofibers ? 2 : 1); ++i) {
			id = (j == 0 ? "ul" : "dl")+"delay"+i;
			tdNode = document.getElementById(id);
			if (!tdNode) {
				tdNode = document.createElement("td");
				var delayctrl = document.createElement("input");
				var tooltip = "Min: "+delayLims.min +", Max: "+delayLims.max+" us";
				delayctrl.title = tooltip;
				delayctrl.id = id;
				delayctrl.name = delayctrl.id;
				delayctrl.type = "text";
				delayctrl.size = "5";
				delayctrl.onkeypress = function(ev) { return isKeyDecimalNumber(ev); }
				delayctrl.className = "number";
				delayctrl.align = "center";
				delayctrl.value = "0.";
				tdNode.appendChild(delayctrl);
				trNode.appendChild(tdNode);
			} else {
				tdNode.style.display = "block";
			}
		}
	}
}
function gdHide() {
	var el;
	for (var j = 0; j < 2; ++j) {
		el = document.getElementById("gdTitle"+j);
		if (el) {
			el.style.display = "none";
			
		}
		for (var i = 0; i < 2; ++i) {
			el = document.getElementById((j == 0 ? "ul" : "dl")+"delay"+i);
			if (el) {
				el.style.display = "none";
			}
		}
	}
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

function optStatusLedSet(nr, color) {
	ledSetColor("optStatusLed"+nr, color);
}

function optRxLedSet(nr, color) {
	ledSetColor("optRxLed"+nr, color);
}

function optRxCommLedSet(nr, color) {
	ledSetColor("optRxCommLed"+nr, color);
}

function optErrorsSet(nr, val) {
	try {
		var el = document.getElementById("optGtpErrVal"+nr);
		el.innerHTML = isNaN(val)? "---" : val.toString();
	} catch (err) {}
}

function fiberPowerSet(nr, val) {
	try {
		var eltxt = document.getElementById("optPowInText"+nr);
		if (!eltxt) {
			return;
		}
		if (typeof(val) === "undefined" || val == null)
			eltxt.innerHTML = "";
		else if (isNaN(val) && isNaN(parseInt(val)))
			eltxt.innerHTML = val;
		else
			eltxt.innerHTML = val.toFixed(1);
	} catch (err) {console.error(err);}
}

function fiberPowerOutSet(nr, val) {
	try {
		var eltxt = document.getElementById("optPowOutText"+nr);
		if (!eltxt) {
			return;
		}
		if (typeof(val) === "undefined" || val == null)
			eltxt.innerHTML = "";
		else if (isNaN(val) && isNaN(parseInt(val)))
			eltxt.innerHTML = val;
		else
			eltxt.innerHTML = val.toFixed(1);
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
	
function createMetRow(id, s, units, label) {
	var trNode = document.createElement("tr");
	if (typeof(label) !== "undefined") {
		var cell = document.createElement("th");
		cell.innerHTML = label;
		cell.style.textAlign = "left";
		trNode.appendChild(cell);
	}
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
function setRemoteMode(mode){
/*
	var selmode = document.getElementById("mode_remote");
	if (selmode == null) return;
	selmode.selectedIndex = (mode==0)? 0 : 1;
*/
}
function optActiveLinkSet(color1,color2) {
	try {
	ledSetColor("actlink1", color1);
	ledSetColor("actlink2", color2);
	} catch (err) { }
}

function createClearCounters() {
	var box = document.createElement("div");
	var el = document.createElement("input");
	el.id = "clearErrCounter";
	el.name = el.id;
	el.type = "button";
	el.value = "Clear Error Counters";
	el.onclick = function() { submitClearCounters(); }
	el.className = "centered";
	el.style.fontWeight = "bold";
	el.style.backgroundColor = "#BABABA";
	box.appendChild(el);
	return box;
}

function createPla() {
	var tbl, tb, row, cell;
	var box = document.createElement("div");
	box.appendChild(createPlaTitle());
	box.appendChild(createPlaUpdateCtl());
	box.appendChild(createPlaMeas());
	box.appendChild(createPlaRemainingTime());
	return box;
}

function createPlaTitle() {
	var box = document.createElement("div");
	box.style.marginBottom = "3px";
	box.style.textAlign = "center";
	var tbl = document.createElement("table");
	tbl.style.width = "100%";
	var tb = document.createElement("tb");
	var row = document.createElement("tr");
	var cell = [];
	cell.push(document.createElement("td"));
	cell.push(document.createElement("th"));
	cell[1].innerHTML = "PATH&nbsp;LOSS&nbsp;ANALYZER";
	cell.push(document.createElement("td"));
	for (var i = 0; i < cell.length; ++i) {
		row.appendChild(cell[i]);
	}
	var ibox = document.createElement("span");
	cell[2].appendChild(ibox);
	var ilab = document.createElement("span");
	ilab.innerHTML = "Enable";
	ibox.appendChild(ilab);
	ilab = document.createElement("span");
	ibox.appendChild(ilab);
	var el = document.createElement("input");
	el.type = "checkbox";
	el.id = el.name = "plaEnable";
	el.onclick = function(ev) {
		var show = this.checked;
		plaCtlDisplay(show);
	}
	el.style.marginLeft = "10px";
	ilab.appendChild(el);
	tb.appendChild(row);
	tbl.appendChild(tb);
	box.appendChild(tbl);
	cell[0].style.width = cell[2].style.width = "100px";
	cell[2].style.textAlign = "right";
	cell[2].style.fontWeight = "bold";
	return box;
}

function plaCtlDisplay(show) {
	var id = [];
	id.push("plaUpdateCtlBox");
	id.push("plaMeasBox");
	id.push("plaRemainingTimeBox");
	for (var i = 0; i < id.length; ++i) {
		var el = document.getElementById(id[i]);
		try {
			el.style.display = (show ? "block" : "none");
		} catch(e) {}
	}
}

function plaEnableSet(on) {
	var el = document.getElementById("plaEnable");
	try {
		el.checked = (on ? true : false);
		el.onclick();
	} catch(e) {}
}

function isPlaEnableSet() {
	var el = document.getElementById("plaEnable");
	try {
		return el.checked;
	} catch(e) { return false; }
}

function createPlaUpdateCtl() {
	var box = document.createElement("div");
	box.id = "plaUpdateCtlBox";
	box.style.textAlign = "center";
	box.style.fontWeight = "bold";
	var tbl = document.createElement("table");
	tbl.style.marginLeft = tbl.style.marginRight = "auto";
	box.appendChild(tbl)
	var tb = document.createElement("tbody");
	tbl.appendChild(tb);
	var row = document.createElement("tr");
	tb.appendChild(row);
	var cell = document.createElement("td");
	row.appendChild(cell)
	cell.appendChild(createPlaUpdate());
	cell = document.createElement("td");
	row.appendChild(cell)
	cell.appendChild(createPlaPeriod());
	return box;
}

function createPlaRemainingTime() {
	var box = document.createElement("div");
	box.id = "plaRemainingTimeBox";
	box.style.textAlign = "center";
	var ibox = document.createElement("span");
	box.appendChild(ibox);
	var label = document.createElement("span");
	label.innerHTML = "Time&nbsp;since&nbsp;last&nbsp;update&nbsp;";
	label.style.fontWeight = "bold";
	label.style.marginRight = "5px";
	ibox.appendChild(label);
	var el = document.createElement("span");
	el.id = "plaRemainingTime";
	el.style.display = "table-cell";
	el.style.minWidth = "30px";
	el.style.height = "14px";
	el.style.textAlign = "center";
	el.style.fontWeight = "normal";
	el.innerHTML = "--";
	ibox.appendChild(el);
	return box;
}

function plaTimeSet(val) {
	try {
		var el = document.getElementById("plaRemainingTime");
		var t = parseInt(confStr.substr(182, 4), 16);
		var en = parseInt(confStr.substr(4, 2), 16) & 0x4;
		if (t == 0 || en ==0) {
			el.innerHTML = "No&nbsp;Periodic&nbsp;Measurement";
			return;
		}
		var days = ~~Math.floor(val / (24*60));
		var rem = val % (24*60);
		var hours = ~~Math.floor(rem / 60);
		var mins = rem % 60;
		var str = "";
		if (days != 0) {
			str += days+" d. ";
		}
		if (hours != 0) {
			str += hours+" h. "
		}
		str += mins+" m."
		el.innerHTML = str;
	} catch(e) {}
}

function createPlaUpdate() {
	var el = document.createElement("input");
	el.type = "button";
	el.value = "UPDATE"
	el.id = "plaUpdate";
	el.onclick = function(ev) {
		submitUpdatePlaMeas();
	}
	el.style.fontWeight = "bold";
	el.style.backgroundColor = "#BABABA";
	el.style.marginRight = "20px";
	return el;
}

function createPlaPeriod() {
	var box = document.createElement("span");
	var label = document.createElement("span");
	label.innerHTML = "Measurement&nbsp;Interval";
	box.appendChild(label);
	var el = document.createElement("input");
	el.type = "text";
	el.id = "plaPeriod";
	el.name = el.id;
	el.size = 5;
	el.style.marginLeft = el.style.marginRight = "10px";
	el.style.textAlign = "right";
	el.title = "Max 1080h (45 days), 0h disables measurement";
	el.onkeypress = function(ev) {
		return numbersOnly(ev);
	}
	box.appendChild(el);
	label = document.createElement("span");
	label.innerHTML = "hours";
	box.appendChild(label);
	return box;
}

function setPlaPeriod(val) {
	try {
		var el = document.getElementById("plaPeriod");
		if (!el || isNaN(val)) {
			return;
		}
		val /= 60;
		var hours = ~~Math.round(val);
		el.value = hours;
	} catch(e) {}
}

function getPlaPeriod() {
	try {
		var el = document.getElementById("plaPeriod");
		var val = parseInt(el.value);
		if (val < 0) {
			val = 0;
			el.value = 0;
		} else if (val > 1080) {
			val = 1080;
			el.value = 1080;
		}
		val *= 60;
		return val;
	} catch(e) { return -1 }
}

var plaMeterSettings = {
	min: -100,
	low_alarm: -128,
	low_warn: -128,
	high_warn: 40,
	high_alarm: 40,
	max: -20
};

function createPlaMeas() {
	var box = document.createElement("div");
	box.id = "plaMeasBox";
	var ibox = document.createElement("div");
	box.style.outline = "1px solid #db5902";
	var tbl = document.createElement("table");
	tbl.style.marginLeft = tbl.style.marginRight = "auto";
	tbl.style.marginTop = "5px";
	var tb = document.createElement("tb");
	tbl.appendChild(tb);
	for (var i = 0; i < 2; ++i) {
		var row = document.createElement("tr");
		var cell = document.createElement("td");
		cell.innerHTML = "DL&nbsp;Input&nbsp;Level&nbsp;"+(i+1);
		//cell.className = "tabval";
		cell.style.fontWeight = "bold";
		cell.style.color = "black";
		row.appendChild(cell);
		cell = document.createElement("td");
		cell.id = "plaMet_"+i;
		var s = plaMeterSettings;
		var plaMet = new mMeter(s.min, s.max, s.low_alarm,
			s.high_alarm, s.low_warn, s.high_warn);
		plaMet.attachTo(cell);
		plaMet.valueSet(s.min);
		cell.style.paddingLeft = cell.style.paddingRight = "10px";
		row.appendChild(cell);
		cell = document.createElement("td");
		cell.id = "plaText_"+i;
		cell.style.minWidth = "40px";
		cell.style.textAlign = "right";
		cell.className = "tabval";
		row.appendChild(cell);
		cell = document.createElement("td");
		cell.id = "plaLabel_"+i;
		cell.style.minWidth = "30px";
		cell.style.textAlign = "right";
		//cell.className = "tabval";
		cell.style.color = "black";
		row.appendChild(cell);
		cell = createLedBox("plaLed_"+i);
		cell.style.paddingLeft = "15px";
		row.appendChild(cell);
		tb.appendChild(row);
	}
	box.appendChild(tbl);
	return box;
}

function plaSet(n, val, alrm) {
	try {
		if (typeof(val) === 'undefined' || isNaN(val)) {
			return;
		}
		var ovl = (val == 100);
		var na = (val == 101);
		var elMet = document.getElementById("plaMet_"+n).mMeter;
		var elTxt = document.getElementById("plaText_"+n);
		var elLab = document.getElementById("plaLabel_"+n);
		if (ovl) {
			elMet.valueSet(val, "#df4040");
			elTxt.innerHTML = "OVL";
			elLab.innerHTML = "";
		} else if (na) {
			val = plaMeterSettings.min;
			elMet.valueSet(val);
			elTxt.innerHTML = "N/A";
			elLab.innerHTML = "";
		} else {
			if (alrm) {
				elMet.valueSet(val, "#df4040");
			} else {
				elMet.valueSet(val);
			}
			elTxt.innerHTML = val.toFixed(1);
			elLab.innerHTML = "dBm";
		}
		var color = alrm ? "red" : "green";
		ledSetColor("plaLed_"+n, color);
	} catch(e) {}
}

function doorOpenLedSet(nfpaMonitor, fipCommErr, doorCapable, doorAlarm) {
	var ledId = "doorOpenLed";
	var labelId = "doorOpenLabel";
	var ledBox = document.getElementById(ledId);
	var labelBox = document.getElementById(labelId);
	var visibility = (!nfpaMonitor || !doorCapable) ? "hidden" : "visible";
	var color = "grey";
	if (nfpaMonitor && !fipCommErr && doorCapable) {
		color = doorAlarm ? "red" : "grey";
	}
	ledSetColor(ledId, color);
	//Nunca se oculta el LED Door Open
	/*try {
		labelBox.style.visibility = visibility;
		ledBox.style.visibility = visibility;
	} catch(e) {}*/
}
