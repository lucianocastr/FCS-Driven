<!--
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
var rfPairs = new rfRedunded();
var persist_settings = {min: 0, max: 600};
window.top.shAllChCheck = [false, false];

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
	rfPairs.readStream();
	rootEl.appendChild(createWarnRemote());
	rootEl.appendChild(createWarnSimplex());
	for (var i = 0; i <= remotesNr; ++i) {
		var unit = new renderUnit(i);
		rootEl.appendChild(unit);
	}
	showUnitDivs(remotesNr);
}
function showUnitDivs(remotesNr){
	try{
		for (var i = 1; i <= remotesNr; ++i){
			idx = getRemoteIndex(i, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
			if ((isFiberRedunded(i))&&(i!=linkActiveRedunded(i))){
				document.getElementById("unitDiv"+i).style.display = "none";
				document.getElementById("fiberpopupremote_"+idx).style.display = "none";
				document.getElementById("fiberLinkLed"+idx).style.display = "none";
			}
			else{
				document.getElementById("unitDiv"+i).style.display = "block";
				document.getElementById("fiberpopupremote_"+idx).style.display = "block";
				document.getElementById("fiberLinkLed"+idx).style.display = "block";
			}
		}
	} catch (err) { }
}
function removeAllElements() {
	remove_element(document.getElementById("rootElement"));
}
function redrawAll(init) {
	removeAllElements();
	renderPage(window.top.currentRemotesNr,getExpansorsNrFromConf(window.top.fiplexConfStr));
	factory.parse(window.top.fiplexFactStr);
	parse_config(window.top.fiplexConfStr);
	parse_tags(window.top.fiplexTagsStr);
	tagsRender();
	if (init) initFormChangeCheck();
	updateShAllChCheck();
	autoUpdateSet(autoUpdateRead());
	autoFiltEnSet(autoFiltEnRead());
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
	cell.style.paddingLeft = "1px";
	cell.style.height = "inherit";
	headDiv.appendChild(cell);
	var idx = getRemoteIndex(nr, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
	cell.innerHTML = (nr == 0 ? Texts['MASTER'] : Texts['REMOTE']+"&nbsp;"+window.top.redundedFiberRemotesIndex[nr]);
	cell.style.minWidth = "300px";
	cell.style.paddingLeft = "50px";
	cell = document.createElement("td");
	cell.id = "tagName"+nr;
	cell.style.width = "100%";
	cell.style.textAlign = "center";
	cell.className = "tag";
	cell.innerHTML = "Tag "+nr;
	headDiv.appendChild(cell);
	if (nr==0){
		cell = document.createElement("td");
		cell.innerHTML = "Master&nbsp;Type";
		cell.style.paddingRight = "10px";
		cell.style.fontWeight = "bold";
		headDiv.appendChild(cell);
		cell = createMasterModeCtl();
		cell.style.minWidth = "100px";
		headDiv.appendChild(cell);
		cell.style.textAlign = "center";
		cell.style.paddingRight = "10px";
		if (version.swGE5_00()) {
			cell = createAutoModeSettingsShow();
			cell.style.minWidth = "30px";
			headDiv.appendChild(cell);
			cell.style.textAlign = "center";
			cell.style.paddingRight = "10px";
		}
		cell = createMasterModeStatus();
		cell.style.minWidth = "100px";
		cell.style.textAlign = "center";
		cell.style.paddingRight = "10px";
		headDiv.appendChild(cell);
	} else {
		cell = document.createElement("td");
		cell.id = "pairing_"+nr;
		cell.className = "small";
		cell.style.minWidth = "335px";
		// var p = rfPairs.getRfRedunded(nr);
		// if (p && p.paired) {
		// 	var str = "RF&nbsp;REDUNDED";
		// 	if (p.nr > 0)
		// 		str += "&nbsp;with&nbsp;REMOTE&nbsp;" + p.nr;
		// 	cell.innerHTML = str;
		// }
		headDiv.appendChild(cell);
	}
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
function rfRedunded() {
	this.SERLEN = 15;
	this.MaxRemotesNr = window.top.MaxRemotesNr;
	this.readStream = function() {
		try {
			if (typeof(this.streamRead) == 'undefined' || !this.streamRead) {
				this.streamRead = false;
			}
			if (typeof(this.pairArr) == 'undefined' || !this.pairArr) {
				this.pairArr = new Array;
			} else {
				this.pairArr.length == 0;
			}
			if (typeof(this.serArr) == 'undefined' || !this.sernArr) {
				this.serArr = new Array;
			} else {
				this.serArr.length == 0;
			}
			for (var i = 0; i < this.MaxRemotesNr; ++i) {
				this.serArr.push({paired:false, nr:-1});
			}
			var srs = localStorage.getItem("serial_1dm6"+window.location.host).split('\t');
			for (var i = 1; i < srs.length; ++i) {
				this.pairArr.push({paired:false, nr:-1});
				if (srs[i].length < 4 + 2 * this.SERLEN) {
					continue;
				}
				var testSernr = srs[i].substr(4 + this.SERLEN, this.SERLEN);
				var testRem = parseInt(srs[i].substr(0, 2), 16);
				if (testRem < 0 || testRem > this.MaxRemotesNr)
					continue;
				this.serArr[testRem].paired = true;
				this.pairArr[i - 1].paired = true;
				for (var j = 1; j < srs.length; ++j) {
					if (j == i)
						continue;
					var nSrnr = srs[j].substr(4, this.SERLEN);
					if (nSrnr != testSernr)
						continue;
					var nRem = parseInt(srs[j].substr(0, 2), 16);
					if (nRem < 0 || nRem > this.MaxRemotesNr) {
						continue;
					}
					this.serArr[testRem].nr = nRem;
					this.pairArr[i - 1].nr = nRem;
					break;
				}					
			}
			this.streamRead = true;
		} catch (err) { tryConsole("error "+err); }
	}
	this.getRfRedunded = function(nr) {
		if (!this.streamRead) {
			this.readStream();
		}
		if (nr < 1 || nr > this.MaxRemotesNr)
			return null;
		var r = nr - 1;
		if (typeof(this.pairArr[r]) == 'undefined' || ! this.pairArr[r])
			return null;
		if (!this.pairArr[r].paired)
			return null;
		return this.pairArr[r];
	}
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
	var rowx;
	if (isMaster && version.swGE5_00()) {
		rowx = document.createElement("tr");
		rowx.id = "masterModeSettingsRow";
		if (typeof(window.top.autoModeSettingsDisplay) === "undefined") {
			window.top.autoModeSettingsDisplay = false;
		}
		rowx.style.display = window.top.autoModeSettingsDisplay ? "table-row" : "none";
		tab.appendChild(rowx);
		var cell = document.createElement("td");
		cell.className = "contentcell";
		cell.colSpan = 3;
		cell.style.borderStyle = "inset";
		rowx.appendChild(cell);
		var el = createAutoModeSettings();
		cell.appendChild(el);
		cell = document.createElement("td");
		cell.style.width = "100%";
		rowx.appendChild(cell);
	}	
	var cell, el, row0;
	if (nr==0){
		row0 = document.createElement("tr");
		row0.id = "masterStatusRow1";
		tab.appendChild(row0);
		cell = document.createElement("td");
		cell.className = "contentcell";
		cell.colSpan = 3;
		row0.appendChild(cell);
		el = createRfInTableMaster();
		cell.appendChild(el);
	}
	var row1 = document.createElement("tr");
	tab.appendChild(row1);
	var row2 = document.createElement("tr");
	tab.appendChild(row2);
	if (!(nr==0)){
		cell = document.createElement("td");
		cell.className = "contentcell";
		row1.appendChild(cell);
		el = createRfInTableRemote(nr);
		cell.appendChild(el);
	}
	cell = document.createElement("td");
	cell.className = "contentcell";
	row1.appendChild(cell);
	el = createRfOutTable(nr);
	cell.appendChild(el);
	if (typeof(version) == 'undefined' || !version || version.isUndefined()) {
		var sr = version.retrieve();
		version.parse(sr);
	}
	cell = document.createElement("td");
	cell.className = "contentcell";
	el = isMaster ? createMasterPaTable(nr) : createHpaTable(nr);
	cell.appendChild(el);
	row1.appendChild(cell);
	cell = document.createElement("td");
	cell.className = "contentcell";
	cell.vAlign = "bottom";
	el = createStatusTable(nr);
	cell.appendChild(el);
	row1.appendChild(cell);
	cell = document.createElement("td");
	cell.style.width = "100%";
	cell.rowSpan = isMaster?3:2;
	isMaster?row0.appendChild(cell):row1.appendChild(cell);
	if (isMaster)
	{
		cell = document.createElement("td");
		cell.className = "contentcell";
		cell.style.verticalAlign = "middle";
		cell.id = "expansorCell";
		cell.style.visibility = (window.top.expansorNr != 0 ? "visible":"hidden");
		el = createExpansorTable(window.top.expansorNr);
		cell.appendChild(el);
		if (typeof(rowx) === 'undefined' || !rowx || rowx.style.display == "none") {
			cell.rowSpan = 3;
			row0.appendChild(cell);
		} else {
			cell.rowSpan = 4;
			rowx.appendChild(cell);
		}
		
	}
	cell = document.createElement("td");
	cell.className = "contentcell";
	cell.style.verticalAlign = "middle";
	if (isMaster) {
		cell.id = "masterFiberCell";
		if (typeof(rowx) === 'undefined' || !rowx || rowx.style.display == "none") {
			cell.rowSpan = 3;
			row0.appendChild(cell);
		} else {
			cell.rowSpan = 4;
			rowx.appendChild(cell);
		}
		el = createFiberPopupLinks();
	} else {
		row1.appendChild(cell);
		cell.rowSpan = 2;
		el = createFiberTable(nr);
	}
	cell.appendChild(el);
	cell = document.createElement("td");
	cell.className = "contentcell";
	if (typeof(version) == 'undefined' || !version || version.isUndefined()) {
		var sr = version.retrieve();
		version.parse(sr);
	}
	cell.colSpan = isMaster?3:4;
	row2.appendChild(cell);
	el = createFilteringTable(nr);
	cell.appendChild(el);
}

function masterModeAutoSettingsDisplayToggle() {
	try {
		var r = document.getElementById("masterModeSettingsRow");
		var currentlyHidden = (r.style.display == "none");
		r.style.display = currentlyHidden ? "table-row" : "none";
		window.top.autoModeSettingsDisplay = (r.style.display == "table-row");
		rearrangeMasterFiberCells();
	} catch(e) {}
}

function masterModeAutoSettingsDisplaySet(on) {
	try {
		var r = document.getElementById("masterModeSettingsRow");
		r.style.display = on ? "table-row" : "none";
		window.top.autoModeSettingsDisplay = (r.style.display == "table-row");
		rearrangeMasterFiberCells();
	} catch(e) {}
}

function isAutoModeSettingsHidden() {
	try {
		var r = document.getElementById("masterModeSettingsRow");
		var currentlyHidden = (r.style.display == "none");
		return currentlyHidden;
	} catch(e) { return true; }
}

function rearrangeMasterFiberCells() {
	try {
		var rx = document.getElementById("masterModeSettingsRow");
		var r1 = document.getElementById("masterStatusRow1");
		var ec = document.getElementById("expansorCell");
		var fc = document.getElementById("masterFiberCell");
		if (window.top.autoModeSettingsDisplay) {
			ec.rowSpan = 4;
			fc.rowSpan = 4;
			rx.appendChild(ec);
			rx.appendChild(fc);
			r1.removeChild(ec);
			r1.removeChild(fc);
		} else {
			ec.rowSpan = 3;
			fc.rowSpan = 3;
			r1.appendChild(ec);
			r1.appendChild(fc);
			rx.removeChild(ec);
			rx.removeChild(fc);
		}
	} catch(e) {}
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

		cell = document.createElement("td");
		row.appendChild(cell);
		var autoUpdt = createAutoUpdateTable();
		cell.appendChild(autoUpdt);

		var chTbl = createChannelTable(nr,1,24,"");
		filtBox.appendChild(chTbl);	
	}
	else{
		if ((window.top.FiberMask[nr]==0x03) && (window.top.mode[nr]==0x8)){
			var chTbl = createChannelTable(nr,1,12,"MASTER PRIMARY");
			filtBox.appendChild(chTbl);
			var chTbl = createChannelTable(nr,13,24,"MASTER SECONDARY");
			filtBox.appendChild(chTbl);			
		}
		else{
			var chTbl = createChannelTable(nr,1,24,"");
			filtBox.appendChild(chTbl);
		}
		
	}

	return filtBox;
}

function createSimplexCtrl(nr, trNode) {
	var tdNode = document.createElement("td");
	tdNode.innerHTML = "Simplex&nbsp;";
	tdNode.id = "simplexTitle_"+nr;
	tdNode.style.textAlign = "right";
	tdNode.style.paddingLeft = (nr == 0 ? "0px" : "10px");
	tdNode.style.fontWeight = "bold";
	tdNode.style.verticalAlign = "middle";
	trNode.appendChild(tdNode);
	tdNode = document.createElement("td");
	tdNode.id = "simplexBox_"+nr;
	tdNode.style.borderStyle = "hidden";
	tdNode.style.borderRadius = "3px";
	trNode.appendChild(tdNode);
	var el = document.createElement("input");
	el.id = el.name = "simplex_"+nr;
	el.type = "checkbox";
	el.style.marginTop = "0px";
	el.style.marginBottom = "0px";
	tdNode.appendChild(el);
	trNode.appendChild(tdNode);
}

function simplexEnSet(nr, simplex) {
	try {
		var el = document.getElementById("simplex_"+nr);
		el.checked = simplex;
	} catch(err) {}
}

function simplexIsSet(nr) {
	try {
		var el = document.getElementById("simplex_"+nr);
		return el.checked;
	} catch(err) { return false; }
}

function simplexEnShow(nr, show) {
	try {
		var el = document.getElementById("simplexBox_"+nr);
		el.style.display = show ? "table-cell" : "none";
		var el = document.getElementById("simplexTitle_"+nr);
		el.style.display = show ? "table-cell" : "none";
	} catch(err) {}
}

function simplexSetDisable(nr, disable) {
	try {
		var el = document.getElementById("simplex_"+nr);
		el.disabled = disable? true : false;
		el.style.backgroundColor = disable ? "#CCCCCC" : "white";
	} catch (err) {}

}

function createAutoUpdateTable() {
	var tbl, tb, row, cell;
	var box = document.createElement("div");
	box.style.color = "black";
	tbl = document.createElement("table");
	tbl.style.width = "100%";
	tbl.style.color = "black";
	tbl.style.fontWeight = "bold";
	tbl.style.borderStyle = "hidden";
	box.appendChild(tbl);
	tb = document.createElement("tbody");
	tbl.appendChild(tb);
	row = document.createElement("tr");
	tb.appendChild(row);
	cell = document.createElement("td");
	row.appendChild(cell);
	cell.innerHTML = "Auto&nbsp;Reload&nbsp;Remote";
	cell.style.textAlign = "left";
	cell = document.createElement("td");
	row.appendChild(cell);
	var updt = document.createElement("input");
	updt.type = "checkbox";
	updt.id = "autoUpdate";
	updt.onclick = function(ev) {
		autoUpdateSave(this.checked);
	}
	cell.appendChild(updt);
	row = document.createElement("tr");
	tb.appendChild(row);
	row = document.createElement("tr");
	tb.appendChild(row);
	cell = document.createElement("td");
	row.appendChild(cell);
	cell.innerHTML = "Auto&nbsp;Filter&nbsp;Enable";
	cell.style.textAlign = "left";
	cell = document.createElement("td");
	row.appendChild(cell);
	var autoen = document.createElement("input");
	autoen.type = "checkbox";
	autoen.id = "autoFiltEn";
	autoen.onclick = function(ev) {
		autoFiltEnSave(this.checked);
	}
	cell.appendChild(autoen);
	return box;
}

function autoUpdateSave(val) {
	if (typeof(val) === 'undefined' || (val !== true && val !== false)) {
		return;
	}
	localStorage.setItem("fiplexAutoUpdate_1dm6_"+window.location.host, val ? true : false);
}

function autoUpdateRead() {
	var val = localStorage.getItem("fiplexAutoUpdate_1dm6_"+window.location.host);
	var v = (val == "true" ? true : false);
	return v;
}

function autoUpdateSet(val) {
	try {
		if (typeof(val) === 'undefined' || (val !== true && val !== false)) {
			return;
		}
		var el = document.getElementById("autoUpdate");
		el.checked = val;
	} catch(e) {}
}

function isAutoUpdateEnabled() {
	try {
		var el = document.getElementById("autoUpdate");
		return el.checked;
	} catch(e) {}
}

function autoUpdateSetClickable(val) {
	try {
		var el = window.parent.content.document.getElementById("autoUpdate");
		el.disabled = val ? false : true;
	} catch(err) {}
}

function createWarnRemote() {
	var box = document.createElement("div");
	box.id = "warnRemote";
	box.style.display = "none";
	box.style.minHeight = "30px";
	var box1 = document.createElement("div");
	box1.style.minHeight = "25px";
	box1.style.textAlign = "center";
	box1.style.backgroundColor = "#d0d0ef";
	box1.style.outline = "1px solid #db5902";
	var t = document.createElement("h");
	t.innerHTML = "REMOTE&nbsp;FIBER&nbsp;CONNECTION&nbsp;EVENT&nbsp;-&nbsp;";
	t.innerHTML += "RELOAD&nbsp;SETTINGS&nbsp;TO&nbsp;UPDATE&nbsp;DISPLAY";
	t.style.fontWeight = "bold";
	t.style.fontSize = "13px";
	t.style.color = "red";
	t.style.position = "relative";
	t.style.top = "5px";
	box1.appendChild(t);
	box.appendChild(box1);
	var box2 = document.createElement("div");
	box2.style.minHeight = "5px";
	box.appendChild(box2);
	return box;
}

function showWarnRemote(val) {
	try {
		var el = document.getElementById("warnRemote");
		var box = el.parentElement;
		el.style.display = val ? "block" : "none";
	} catch(err) {}
}

function autoFiltEnSave(val) {
	if (typeof(val) === 'undefined' || (val !== true && val !== false)) {
		return;
	}
	localStorage.setItem("fiplexAutoFiltEn_1dm6_"+window.location.host, val ? true : false);
}

function autoFiltEnRead() {
	var val = localStorage.getItem("fiplexAutoFiltEn_1dm6_"+window.location.host);
	var v = (val == "true" ? true : false);
	return v;
}

function autoFiltEnSet(val) {
	try {
		if (typeof(val) === 'undefined' || (val !== true && val !== false)) {
			return;
		}
		var el = document.getElementById("autoFiltEn");
		el.checked = val;
	} catch(e) {}
}

function isAutoFiltEnabled() {
	try {
		var el = document.getElementById("autoFiltEn");
		return el.checked;
	} catch(e) {}
}

function setAllRemotesFiltEn(ch, val) {
	for (var n = 0; n < window.top.currentRemotesNr; ++n) {
		var nr = n + 1;
		if (hiddenUnitState[nr]) {
			var bt = document.getElementById("hideButton"+nr);
			try {
				bt.click();
			} catch(err){}
			var cd = document.getElementById("contentDiv"+nr);
			try {
				cd.style.display = "block";
			} catch(err){}
		}
		var el = document.getElementById("chEn"+"_"+ch+"_"+nr);
		try {
			el.checked = val;
		} catch(err) {}
	}
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
	tdNode.innerHTML = Texts['SHOWCH']+"&nbsp;&nbsp;(1-"+window.top.MaxChNr/2+")";
	tdNode.style.textAlign = "left";
	tdNode.style.fontWeight = "bold";
	tdNode.style.whiteSpace = "nowrap";
	for (var i = 0; i < window.top.MaxChNr; ++i) {
		tdNode = document.createElement("td");
		trNode.appendChild(tdNode);
		var chShow = document.createElement("input");
		chShow.type = "checkbox";
		chShow.id = "chShow"+i;
		chShow.name = chShow.id;
		chShow.nr = i;
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
			if (!this.checked) {
				var r = (this.nr < window.top.MaxChNr/2 ? 0 : 1);
				setShAllChCheck(r, false);
			}
			redrawAll(true);
		}
		if (i==window.top.MaxChNr/2-1)
		{
			trNode.appendChild(shAllChTitle());
			trNode.appendChild(createShAllChCheck(0));
			trNode = document.createElement("tr");
			tbodyNode.appendChild(trNode);	trNode = document.createElement("tr");
			tbodyNode.appendChild(trNode);
			tdNode = document.createElement("td");
			trNode.appendChild(tdNode);
			tdNode.innerHTML = Texts['SHOWCH']+"&nbsp;("+(window.top.MaxChNr/2+1)+"-"+window.top.MaxChNr+")";
			tdNode.style.textAlign = "left";
			tdNode.style.fontWeight = "bold";
			tdNode.style.whiteSpace = "nowrap";
		}
		if (i == window.top.MaxChNr-1) {
			trNode.appendChild(shAllChTitle());
			trNode.appendChild(createShAllChCheck(1));
		}
	}
	return box;
}

function shAllChTitle() {
	var td = document.createElement("td");
	td.innerHTML = "&nbsp;All";
	td.style.fontWeight = "bold";
	td.style.textAlign = "left";
	return td;
}

function createShAllChCheck(row) {
	var td = document.createElement("td");
	var el = document.createElement("input");
	el.type = "checkbox";
	el.row = row != 0 ? 1 : 0;
	el.id = "showAllFilt_"+el.row;
	el.onclick = function(ev) {
		var nr = getRemotesNrFromConf(window.top.fiplexConfStr,window.top.MaxRemotesNr);
		var chBitMask = 0;
		for (var i = 0; i <= nr; ++i) {
			var r = computeRemNrInStat(i)
			chBitMask |= parseChannelsEnabled(window.top.fiplexConfStr, i, r);
		}
		for (var i = 0; i < window.top.MaxChNr/2; ++i) {
			var n = i + this.row * window.top.MaxChNr/2;
			var id = "chShow"+n;
			var el = document.getElementById(id);
			var chen = (chBitMask & (1 << n)) != 0;
			try {
				el.checked = this.checked || chen;
			} catch(err) {}
		}
		var chMask = 0;
		var mask = 1;
		for (var i = 0; i < window.top.MaxChNr; ++i, mask <<= 1) {
			if (document.getElementById("chShow"+i).checked) {
				chMask |= mask;
			}
		}
		window.top.showChannelsBitmask = chMask;
		window.top.shAllChCheck[this.row] = this.checked;
		redrawAll(true);
	}
	td.appendChild(el);
	return td;
}

function updateShAllChCheck() {
	for (var i = 0; i < 2; ++i) {
		var el = document.getElementById("showAllFilt_"+i);
		try {
			el.checked = window.top.shAllChCheck[i] ? true : false;
		} catch(err) {}
	}
}

function setShAllChCheck(row, val) {
	var el = document.getElementById("showAllFilt_"+row);
	try {
		el.checked = val ? true : false;
		window.top.shAllChCheck[row] = val ? true : false;
	} catch(err) {}
}

function createFilterCtlTable(nr) {
	var txt, myTable, tbodyNode, trNode, tdNode;
	var box = document.createElement("div");
	box.style.color = "black";
	myTable = document.createElement("table");
	myTable.style.width = "100%";
	myTable.style.color = "black";
	myTable.style.borderStyle = "hidden";
	if (factory.data.band[0].simplex) {
		myTable.style.borderSpacing = "0px";
	}
	box.appendChild(myTable);
	tbodyNode = document.createElement("tbody");
	myTable.appendChild(tbodyNode);
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	if (nr == 0) {
		var cell = document.createElement("td");
		trNode.appendChild(cell);
		if (factory.data.allowDisableFilt) {
			tdNode = document.createElement("td");
			tdNode.innerHTML = Texts['FENABLE'];
			tdNode.style.textAlign = "right";
			tdNode.style.marginRight = "0px";
			tdNode.style.fontWeight = "bold";
			cell.appendChild(tdNode);
			tdNode = document.createElement("td");
			tdNode.id = "filtEnBox"+nr;
			tdNode.style.borderStyle = "hidden";
			tdNode.style.borderRadius = "3px";
			cell.appendChild(tdNode);
			var filtEn = document.createElement("input");
			filtEn.id = "filtEnable"+nr;
			filtEn.name = filtEn.id;
			filtEn.type = "checkbox";
			filtEn.onchange = function() {filtEnAlert(nr); }
			filtEn.style.marginTop = "0px";
			filtEn.style.marginBottom = "0px";
			tdNode.appendChild(filtEn);
			cell.appendChild(tdNode);
		}
		tdNode = document.createElement("td");
		tdNode.innerHTML = Texts['SQUELCH'];
		tdNode.style.textAlign = "Right";
		tdNode.style.marginRight = "0px";
		tdNode.style.paddingLeft = "5px";
		tdNode.style.fontWeight = "bold";
		cell.appendChild(tdNode);
		tdNode = document.createElement("td");
		tdNode.style.borderStyle = "hidden";
		cell.appendChild(tdNode);
		var sqEn = document.createElement("input");
		sqEn.id = "sqEn"+nr;
		sqEn.name = sqEn.id;
		sqEn.setAttribute("type", "checkbox");
		sqEn.style.marginTop = "0px";
		sqEn.style.marginBottom = "0px";
		tdNode.appendChild(sqEn);
	} else {
		if (window.top.allowDisFilt[nr-1]) {
			tdNode = document.createElement("td");
			tdNode.innerHTML = Texts['FENABLE'];
			tdNode.style.textAlign = "right";
			tdNode.style.marginRight = "0px";
			tdNode.style.fontWeight = "bold";
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
	    	}
		tdNode = document.createElement("td");
		tdNode.innerHTML = Texts['SQUELCH'];
		tdNode.style.textAlign = "Right";
		tdNode.style.marginRight = "0px";
		tdNode.style.paddingLeft = "5px";
		tdNode.style.fontWeight = "bold";
		trNode.appendChild(tdNode);
		tdNode = document.createElement("td");
		tdNode.style.borderStyle = "hidden";
		trNode.appendChild(tdNode);
		var sqEn = document.createElement("input");
		sqEn.id = "sqEn"+nr;
		sqEn.name = sqEn.id;
		sqEn.setAttribute("type", "checkbox");
		tdNode.appendChild(sqEn);
	}
	// if (factory.data.allowDisableFilt) {
	// 	tdNode = document.createElement("td");
	// 	tdNode.style.width = "100%";
	// 	trNode.appendChild(tdNode);
	// }
	if (nr != 0) {
		createSqThrControl(nr,nr,trNode,Texts['SQTHRS']);
		var persistAlarmEn = false;
		try {
			var cfg = new ConfigRemote();
			cfg.parse(window.parent.navi.configArray[nr]);
			persistAlarmEn = cfg.isPersistAlarmEn();
		} catch(err) {}
		if (persistAlarmEn) {
			tdNode = document.createElement("th");
			tdNode.innerHTML = "Persist time (s)";
			tdNode.style.textAlign = "right";
			tdNode.style.minWidth = "90px";
			tdNode.style.whiteSpace = "nowrap";
			tdNode.style.paddingLeft = "5px";
			trNode.appendChild(tdNode);
			var persistTime = document.createElement("input");
			persistTime.id = "persistTime_"+nr;
			persistTime.name = persistTime.id;
			persistTime.type = "text";
			persistTime.size = 3;
			persistTime.className = "number";
			persistTime.style.display = "inline";
			persistTime.title = "OFF 0s, Min. 1s, Max. "+persist_settings.max+"s.";
			persistTime.onkeypress = function(ev) { return numbersOnly(ev); }
			tdNode = document.createElement("td");
			tdNode.appendChild(persistTime);
			trNode.appendChild(tdNode);
		}
		createSimplexCtrl(nr, trNode);
		if ((window.top.mode[nr]==0x08)&&isFiberRedunded(nr)){
			tdNode = document.createElement("td");
			trNode.appendChild(tdNode);
			tdNode.innerHTML = '&nbsp;CONFIGURATION&nbsp;ERROR';
			tdNode.title = "Not allowed for fiber redunded remotes. Please, change mode or re-identify devices in Device List section";
			tdNode.style.backgroundColor = "red";
			tdNode.style.align = "center";
			tdNode.style.fontSize = "12px";
			tdNode.style.bold = true;
		}
	} else {
		trNode = document.createElement("tr");
		tbodyNode.appendChild(trNode);
		tdNode = document.createElement("td");
		trNode.appendChild(tdNode);
		var cell = document.createElement("th");
		cell.innerHTML = Texts['LINKF'];
		tdNode.appendChild(cell);
		cell = createLinkedFreqCtrl();
		cell.style.width = "100%";
		cell.style.textAlign = "center";
		tdNode.appendChild(cell);
		if (factory.data.band[0].simplex) {
			trNode = document.createElement("tr");
			tbodyNode.appendChild(trNode);
			cell = document.createElement("td");
			trNode.appendChild(cell);
			createSimplexCtrl(0, cell);
		}
	}
	return box;
}

function createSqThrControl(nr,id,trNode,lname){
	tdNode = document.createElement("th");
	tdNode.style.borderStyle = "hidden";
	tdNode.innerHTML = lname;
	tdNode.style.textAlign = "right";
	tdNode.style.marginRight = "0px";
	tdNode.style.minWidth = "40px";
	tdNode.style.paddingLeft = "5px";
	trNode.appendChild(tdNode);
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	var sqThr = document.createElement("input");
	sqThr.id = "sqThr"+id;
	sqThr.name = sqThr.id;
	sqThr.type = "text";
	sqThr.size = "4";
	sqThr.onkeypress = function(ev) { return isKeyDecimalNumber(ev); }
	sqThr.className = "number";
	sqThr.style.display = "inline";
	if (nr == 0) {
		var k = factory.data.uplinkCoupling == 1 ? 1 : 0;
		var tooltip = "Min: "+sqThrDLLims[k].min +", Max: "+sqThrDLLims[k].max+" dBm";
	}else{
		var tooltip = "Min: "+sqThrULLims.min +", Max: "+sqThrULLims.max+" dBm";
	}
	sqThr.title = tooltip;
	tdNode.appendChild(sqThr);
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = "dBm";
	tdNode.style.textAlign = "left";
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

function persitTimeSetDisable(nr, disable) {
	try {
		var el = document.getElementById("persistTime_"+nr);
		el.disabled = disable? true : false;
		el.style.backgroundColor = disable ? "#CCCCCC" : "white";
	} catch (err) {}

}

function createMasterModeCtl(){
	var tdNode = document.createElement("td");
	el = document.createElement("select"); 
	el.id = "master_mode";
	el.name = el.id;
	el.type = "select-one";
	el.style.textAlign = "left";
	var texts;
	if (version.swGE5_00()) {
		texts = ["PRIMARY", "SECONDARY", "AUTOMATIC"];
	} else {
		texts = ["PRIMARY", "SECONDARY"];
	}
	for (var i = 0; i < texts.length; ++i) {
		var opt = document.createElement("option");
		el.options.add(opt);
		opt.text = texts[i];
		opt.value = i;
	}
	el.onchange = function(ev) {
		if (!version.swGE5_00()) {
			return;
		}
		autoModeButtonDisplay(this.selectedIndex == 2);
		if (this.selectedIndex != 2) {
			masterModeAutoSettingsDisplaySet(false);
		}
	}
	tdNode.appendChild(el);
	tdNode.style.textAlign = "left";
	return tdNode;	
}

function setInputSelMode(mode,sel) {
	var selmode = document.getElementById(sel==0?"iselmode":"isel");
	if (selmode == null) return;
	if (mode >= selmode.options.length) {
		return;
	}
	selmode.selectedIndex = mode;
}
function getInputSelMode(sel) {
	try {
		var selmode = document.getElementById(sel==0?"iselmode":"isel");
		return selmode.selectedIndex;
	} catch (err) {
		return false;
	}
}
function createInputSelMode(sel){
	tdNode = document.createElement("td");
	el = document.createElement("select"); 
	el.id = sel==0?"iselmode":"isel";
	el.name = el.id;
	el.type = "select-one";
	el.style.textAlign = "left";
	var text1 = ["MANUAL", "AUTO"];
	var text2 = ["INPUT1", "INPUT2"];
	texts = sel==0?text1:text2;
	for (var i = 0; i < texts.length; ++i) {
		var opt = document.createElement("option");
		el.options.add(opt);
		opt.text = texts[i];
		opt.value = i;
	}
	if (sel==0){
		el.onchange = function(ev) {
			ev = ev || window.event;
			var target = ev.target;
			viewAutoMode(target.selectedIndex);
		}
	}
	tdNode.appendChild(el);
	tdNode.style.textAlign = "left";
	return tdNode;	
}

function createMasterModeStatus() {
	var tdNode = document.createElement("td");
	tdNode.id = "master_status";
	return tdNode;		
}

function createAutoModeSettingsShow() {
	var tdNode = document.createElement("td");
	tdNode.id = "autoModeSettingsShowBox";
	tdNode.style.display = "none";
	var btn = document.createElement("input");
	btn.type = "button";
	btn.id = "autoModeSettingsShow";
	btn.name = btn.id;
	btn.value = "Settings";
	btn.style.fontWeight = "bold";
	btn.style.backgroundColor = "#CECECE";
	btn.onclick = function(ev) {
		masterModeAutoSettingsDisplayToggle();
	}
	tdNode.appendChild(btn);
	return tdNode;
}

function autoModeButtonDisplay(on) {
	var el = document.getElementById("autoModeSettingsShowBox");
	try {
		if (el) {
			el.style.display = on ? "table-cell" : "none";
		}
	} catch(e) {}
}

function autoModeCheckPa() {
	return !factory.showPaCurrentAlarm();
}

function autoModeCheckComm() {
	return !factory.isNfpaMonitor();
}

var autoModeSettings = [
	{name: "Overload DL", 	id: "autoModeOvl",	skip: function(){return false;} },
	{name: "Rx Power Low", 	id: "autoModeRxLow",	skip: function(){return false;} },
	{name: "PA status", 	id: "autoModePa", 	skip: function(){return autoModeCheckPa();} },
	{name: "Comm. Err", 	id: "autoModeComm", 	skip: function(){return autoModeCheckComm();} },
	{name: "Temperature", 	id: "autoModeTemp", 	skip: function(){return false;} },
	{name: "HW Fail", 	id: "autoModeHwfail",	skip: function(){return false;} }
];

function createAutoModeSettings() {
	var box = document.createElement("div");
	var tbl = document.createElement("table");
	tbl.style.marginLeft = "auto";
	tbl.style.marginRight = "auto";
	box.appendChild(tbl);
	var tb = document.createElement("tbody");
	tbl.appendChild(tb);
	var row = document.createElement("tr");
	tb.appendChild(row);
	var td = document.createElement("td");
	td.style.paddingRight = "20px";
	td.style.fontWeight = "bold";
	td.innerHTML = "AUTOMATIC MODE SETTINGS";
	row.appendChild(td);
	for (var i = 0; i < autoModeSettings.length; ++i) {
		var td = document.createElement("td");
		td.style.paddingLeft = "10px";
		if (autoModeSettings[i].skip()) {
			td.style.display = "none";
		}
		row.appendChild(td);
		var tbox = document.createElement("span");
		tbox.innerHTML = autoModeSettings[i].name;
		tbox.style.fontWeight = "bold";
		tbox.style.verticalAlign = "middle";
		td.appendChild(tbox);
		var elBox = document.createElement("span");
		elBox.style.paddingLeft = "5px";
		td.appendChild(elBox);
		var el = document.createElement("input");
		el.type = "checkbox";
		el.id = autoModeSettings[i].id;
		el.name = el.id;
		el.style.verticalAlign = "middle";
		elBox.appendChild(el);
	}
	return box;
}

function setAutoModeSettings(s) {
	try {
		for (i = 0; i < s.length; ++i) {
			var el = document.getElementById(autoModeSettings[i].id);
			el.checked = s[i].set ? true : false;
		}
	} catch(e) {}
}

function getAutoModeSettings() {
	try {
		var r = 0;
		var mask = 0x01;
		for (i = 0; i < autoModeSettings.length; ++i, mask <<= 1) {
			var el = document.getElementById(autoModeSettings[i].id);
			if (el.checked) {
				r |= mask;
			}
		}
		return r;
	} catch(e) { return null; }
}

function setMasterModeStatus(txt) {
	try {
		document.getElementById("master_status").innerHTML = txt;
	} catch(e){}
}
function createLinkedFreqCtrl(){
	var tdNode = document.createElement("td");
	el = document.createElement("select"); 
	el.id = "linked_freq";
	el.name = el.id;
	el.type = "select-one";
	el.style.textAlign = "left";
	el.style.maxHeight = "17px";
	el.onchange = function(ev) {
		ev = ev || window.event;
		var target = ev.target;
		window.top.LinkedFreq=(target.selectedIndex==0);
		redrawAll(false);
	}
	var opt = document.createElement("option");
	el.options.add(opt);
	opt.text = "YES";
	opt.value = 0;
	var opt = document.createElement("option");
	el.options.add(opt);
	opt.text = "NO";
	opt.value = 1;
	el.selectedIndex = (window.top.LinkedFreq)?0:1;
	tdNode.appendChild(el);
	tdNode.style.textAlign = "left";
	return tdNode;
}

function getMasterMode() {
	try {
		var selmode = document.getElementById("master_mode");
		return selmode.selectedIndex;
	} catch (err) {
		return false;
	}
}
function getLinkedFreq() {
	try {
		var linkedfreq = document.getElementById("linked_freq");
		if (linkedfreq.selectedIndex == 0)
			return true;
		else
			return false;
	} catch (err) {
		return false;
	}
}
function setPLLstate(onoff, state) {
	try {
		var tag = document.getElementById("pllStatusText");
		if (onoff == 0) {
			tag.innerHTML = "OFF";
			ledSetColor("pllStatusLed", "grey");
		} else {
			if (state == 0) {
				tag.innerHTML = "Locked";
				ledSetColor("pllStatusLed", "green");
			} else {
				tag.innerHTML = "Unlocked";
				ledSetColor("pllStatusLed", "red");
			}
		}
	} catch (err) {}
}

function setMasterMode(mode) {
	var selmode = document.getElementById("master_mode");
	if (selmode == null) return;
	if (mode > selmode.options.length) {
		return;
	}
	selmode.selectedIndex = mode;
	autoModeButtonDisplay(selmode.selectedIndex == 2);
	if (selmode.selectedIndex != 2) {
		masterModeAutoSettingsDisplaySet(false);
	}
}

function setLinkedFreq(mode){
	var linkedfreq = document.getElementById("linked_freq");
	if (linkedfreq == null) return;
	linkedfreq.selectedIndex = (mode)? 0 : 1;
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

function delaySet(nr,band,nfiber,val){
	try {
		var el = document.getElementById("delay_"+band+"_"+nfiber+"_"+nr);
		if (!isNaN(val))
			el.value = val.toFixed(1);
	} catch (err) {}
}
function delayGet(nr,band,nfiber) {
	try {
		var el = document.getElementById("delay_"+band+"_"+nfiber+"_"+nr);
		return parseFloat(el.value);
	} catch (err) {
		return 0;
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
		return ~~Math.round(parseFloat(el.value));
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
function computeShownChannelsNr(start,stop) {
	var mask = 1<<(start-1);;
	var n = 0;
	for (var ch = start; ch <= stop; ch++) {
		if (window.top.showChannelsBitmask & mask) {
			n++;
		}
		mask <<= 1;
	}
	return n;
}
function createChannelTable(nr,start,stop,title) {
	var chBox = document.createElement("div");
	var chFiltTable = document.createElement("table");
	chFiltTable.style.border = "1px solid #db5902";
	chFiltTable.style.borderLeft="1px solid #db5902";
	chFiltTable.style.padding = "1px 1px 1px 1px";
	chFiltTable.style.marginBottom = "3px";
	chFiltTable.align = "center";
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
	var show_ch_nr = computeShownChannelsNr(start,stop);
	var nr_rows = Math.ceil(show_ch_nr / 2);
	var mask = 1<<(start-1);;
	var ch = start;		
	if (title.length>0){
		var chFiltTrow = createFilterTableTitle(nr,title,show_ch_nr);
		tb.appendChild(chFiltTrow);
	}	
	row = document.createElement("tr");
	tb.appendChild(row);
	if (show_ch_nr == 0) {
		chFiltTable.style.border = "none";
	} else {
		createFilterTableHeader(row,nr);
	}
	if (show_ch_nr > 1) {
		cell = document.createElement("td");
		cell.style.minWidth = "7px";
		row.appendChild(cell);
		createFilterTableHeader(row,nr);
	}
	for (var r = 0; r < nr_rows; r++) {
		row = document.createElement("tr");
		tb.appendChild(row);
		for (var c = 0; c < 2; ++c) {
			while (!(window.top.showChannelsBitmask & mask) && (ch <= window.top.MaxChNr)) {
				ch++;
				mask <<= 1;
			}
			if (ch > stop)
				break;
			if (c > 0) {
				cell = document.createElement("td");
				cell.style.minWidth = "10px";
				row.appendChild(cell);
			}
			createFilterChannel(row, ch, nr);
			ch++;
			mask <<= 1;
		}
		if (ch > stop)
			break;
	}
	return chBox;
}
function createFilterTableTitle(nr,title,nch){
	var chFiltRow = document.createElement("tr");
	var td = document.createElement("td");
	td.style.textAlign = "center";
	td.className = "small";
	chFiltRow.style.border = "1px solid #db5902";
	td.innerHTML = title;
	td.colSpan = (nch > 1)?20:10;
	chFiltRow.appendChild(td);
	return chFiltRow;
}
function createFilterTableHeader(chFiltRow,nr) {
	var isMaster = (nr==0);
	chFiltRow.style.textAlign = "center";
	var td = document.createElement("td");
	chFiltRow.appendChild(td);
	td.innerHTML = "Filt.";
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	td.innerHTML = "On";
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	td.innerHTML = "Fr.&nbsp;(MHz)";
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	td.innerHTML = "G(dB)";
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	td.innerHTML = "Bw(KHz)";
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
	}
	chEn.onclick = function(ev) { 
		ev = ev || window.event;
		var target = ev.target;
		var ch = target.ch;
		var nr = target.nr;
		chEnableAlert(ch, nr);
		if (nr == 0 && isAutoFiltEnabled()) {
			setAllRemotesFiltEn(ch, this.checked);
		}
	}
	td.appendChild(chEn);
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	var chFr = document.createElement("input");
	chFr.id = "chFr"+"_"+ch+"_"+nr;
	chFr.name = chFr.id;
	if (isMaster){
		var tooltip = "Min: "+(factory.data.band[0].fStartDL/1e6) +", Max: "+(factory.data.band[0].fStopDL/1e6)+" MHz";
		chFr.title = tooltip;
	}else{
		var tooltip = "Min: "+(factory.data.band[0].fStartUL/1e6) +", Max: "+(factory.data.band[0].fStopUL/1e6)+" MHz";
		chFr.title = tooltip;		
	}
	chFr.type = "text";
	chFr.size = "10";
	chFr.className = "number";
	if ((!isMaster) && window.top.LinkedFreq) {
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
	chGain.size = 2;
	chGain.className = "number";
	chGain.onkeypress = function(ev) { return isKeyDecimalNumber(ev); }
	td.appendChild(chGain);
	td = document.createElement("td");
	chFiltRow.appendChild(td);
	var chBw = createChBwSel(ch, nr);
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
	td.style.textAlign = "center";
	td.style.paddingRight = "1px";
	td.className = "tabval";
	td.innerHTML = "0.0";
	chFiltRow.appendChild(td);
}

function chEnableSet(ch, nr, on) {
	var el = document.getElementById("chEn"+"_"+ch+"_"+nr);

	try {
		el.checked = on ? true : false;
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
		}
	} catch (err) {}
}

function chFineGainGet(ch, nr) {
	var el = document.getElementById("chGain"+"_"+ch+"_"+nr);
	try {
		return ~~Math.round(parseFloat(el.value));
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
	try {
		var isMaster = nr == 0;
		if (isMaster) {
			if (version.isUndefined()) {
				var sr = version.retrieve();
				version.parse(sr);
			}
			return version.isFwNewSpect();
		}
		var cfg = new ConfigRemote();
		cfg.parse(window.parent.navi.configArray[nr]);
		return cfg.isAE();
	} catch(err) { return false; }
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
	} catch (err) {
		return 0;
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
function insertPadding(px){
	tdNode = document.createElement("td");
	tdNode.style.minWidth = px+"px";
	return tdNode
}
function createRfInTableMaster() {
	var myTable, tbodyNode, trNode, tdNode;
	var box = document.createElement("div");
	var el = createRfTitle(0, true);
	box.appendChild(el);
	myTable = document.createElement("table");
	myTable.style.marginLeft = "auto";
	myTable.style.marginRight = "auto";
	box.appendChild(myTable);
	tbodyNode = document.createElement("tbody");
	myTable.appendChild(tbodyNode);
	var n = factory.data.uplinkCoupling == 1 ? 1 : 0;
	var s = tbs_settings[n];
	for (var k=1;k<=2;k++){
		myTable = document.createElement("table");
		myTable.id = "inputtable"+(k-1);
		myTable.style.marginLeft = "auto";
		myTable.style.marginRight = "auto";
		myTable.style.border = "1px solid #BEBED2";
		box.appendChild(myTable);
		tbodyNode = document.createElement("tbody");
		myTable.appendChild(tbodyNode);		
		trNode = document.createElement("tr");
		createMeter(k==1?"rfInPow0":"rfInPow01", s, "dBm", "INPUT"+k+"&nbsp;Power", "right",trNode);
		tbodyNode.appendChild(trNode);
		trNode.appendChild(insertPadding(15));
		tdNode = createAttenuator(k==1?"attIn0":"attIn01",0,0,k);
		trNode.appendChild(tdNode);
		trNode.appendChild(insertPadding(15));
		tdNode = document.createElement("td");
		tdNode.innerHTML = Texts['OVF'] + "&nbsp;DL"+k;
		tdNode.style.textAlign = "left";
		tdNode.style.fontWeight = "bold";
		trNode.appendChild(tdNode);
		tdNode = createLedBox(k==1?"rfOvfLed0":"rfOvfLed01");
		trNode.appendChild(tdNode);
		trNode.appendChild(insertPadding(15));
		createSqThrControl(0,k==1?"0":"01",trNode,"SQ&nbsp;Threshold"+k);
		tdNode = createDLDelay("DLDelay"+(k-1),k);
		trNode.appendChild(tdNode);
	}
	myTable = document.createElement("table");
	myTable.style.marginLeft = "auto";
	myTable.style.marginRight = "auto";
	box.appendChild(myTable);
	tbodyNode = document.createElement("tbody");
	myTable.appendChild(tbodyNode);	
	trNode = document.createElement("tr");
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);	
	tbodyNode.appendChild(trNode);
	tdNode.innerHTML = Texts['RXLOW'];
	tdNode.style.textAlign = "right";
	tdNode.style.whiteSpace = "nowrap";
	tdNode.style.fontWeight = "bold";
	tdNode = createLedBox("tbsFailLed");
	trNode.appendChild(tdNode);
	trNode.appendChild(insertPadding(15));
	tdNode = document.createElement("th");
	tdNode.innerHTML = "Input&nbsp;Selection&nbsp;Mode:";
	tdNode.colSpan = 2;
	trNode.appendChild(tdNode);	
	tdNode = createInputSelMode(0);
	trNode.appendChild(tdNode);
	trNode.appendChild(insertPadding(15));
	tdNode = document.createElement("th");
	tdNode.innerHTML = "Input:";
	tdNode.id = "iseltext";
	trNode.appendChild(tdNode);
	trNode.appendChild(createInputSelMode(1));
	trNode.appendChild(insertPadding(0));
	trNode.appendChild(insertPadding(15));
	createSwTime(0,trNode);
	trNode.appendChild(insertPadding(15));
	createSwTime(1,trNode);

	box.appendChild(createRemotePowerReduction());
	return box;
}
function setActiveInput(val){
	try {
		var table1 = document.getElementById("inputtable0");
		var table2 = document.getElementById("inputtable1");
		if (val==0){
			table1.style.border = "1px solid #db5902";
			table2.style.border = "1px solid #BEBED2";
		}else{
			table1.style.border = "1px solid #BEBED2";
			table2.style.border = "1px solid #db5902";
		}
	} catch (err) {}
}
function createRfInTableRemote(nr) {
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
	var settings = rfin_settings;
	trNode = createMetRow("rfInPow"+nr, settings, "dBm", "Power", "right");
	tbodyNode.appendChild(trNode);
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("td");
	tdNode.innerHTML = Texts['OVF'] + (nr==0?"&nbsp;DL":"&nbsp;UL");
	tdNode.style.textAlign = "left";
	tdNode.style.fontWeight = "bold";
	trNode.appendChild(tdNode);
	tdNode = createLedBox("rfOvfLed"+nr);
	trNode.appendChild(tdNode);
	trNode = createRfGain("rfGainUL"+nr);
	tbodyNode.appendChild(trNode);
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

function createRemotePowerReduction() {
	var tbl = document.createElement("table");
	tbl.style.marginLeft = "auto";
	tbl.style.marginRight = "auto";
	var tb = document.createElement("tbody");
	tbl.appendChild(tb);
	var tr = document.createElement("tr");
	tb.appendChild(tr);
	var td = document.createElement("th");	
	td.innerHTML = "DL&nbsp;Output&nbsp;Power&nbsp;Reduction";
	td.style.fontWeight = "bold";
	tr.appendChild(td);
	td = document.createElement("td");
	tr.appendChild(td);
	var del = document.createElement("input");
	var tooltip = "Min: "+remPwrRedLims.min+", Max: "+remPwrRedLims.max;
	del.title = tooltip;
	del.id = "remotePowerReduction";
	del.name = del.id;
	del.type = "text";
	del.size = "3";
	del.className = "number";	
	del.align = "center";
	del.onkeypress = function(ev) {	return numbersOnly(ev);	}
	td.appendChild(del);
	td = document.createElement("td");
	td.innerHTML = "dB";
	td.style.textAlign = "left";
	tr.appendChild(td);

	return tbl;
}

function remotePwrReductionSet(val) {
	try {
		var el = document.getElementById("remotePowerReduction");
		if (!isNaN(val) && el) {
			el.value = val;
		}
	} catch(err) {}
}

function remotePwrReductionGet() {
	try {
		var el = document.getElementById("remotePowerReduction");
		return parseInt(el.value);
	} catch(err) { return 0; }
}

function DLDelaySet(nr,val){
	try {
		var el = document.getElementById("DLDelay"+nr);
		if (!isNaN(val))
			el.value = val.toFixed(1);
	} catch (err) {}
}
function swTimeSet(nr,val){
	try {
		var el = document.getElementById("swtime"+nr);
		if (!isNaN(val))
			el.value = val;
	} catch (err) {}
}
function swTimeGet(nr){
	try {
		var el = document.getElementById("swtime"+nr);
		return parseInt(el.value);
	} catch (err) {
		return -1;
	}
}
function inputAttenuatorSet(nr, value) {
	var id = "attIn0";
	if (nr==1) id+= "1";
	try {
		var el = document.getElementById(id);
		if (!isNaN(value))
			el.value = value;
	} catch (err) {}
}

function inputAttenuatorGet(nr) {
	var id = "attIn0";
	if (nr==1) id+= "1";
	try {
		var el = document.getElementById(id);
		return parseInt(el.value);
	} catch (err) {
		return 0;
	}
}
function DLDelayGet(nr){
	try {
		var el = document.getElementById("DLDelay"+nr);
		return parseFloat(el.value);
	} catch (err) {
		return -1;
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
		trNode = createRfGain("rfGainDL"+nr);
		tbodyNode.appendChild(trNode);
	}
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	trNode = createMetRow('agc'+nr, agc_settings, "dB", "AGC", "right");
	tbodyNode.appendChild(trNode);
	trNode = createAttenuator("attOut"+nr,1,nr,"");
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
		if (isNaN(val)) {
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
function viewAutoMode(auto){
	var val;
	val = auto==1?"inline-table":"none";
	document.getElementById("swtimetext1").style.display = val;
	document.getElementById("swtimetext0").innerHTML = auto==1?"SwitchTime IN1/IN2:":"Alarm Time RX Power Low";
	document.getElementById("swtimetd1").style.display = val;
	document.getElementById("swtimeunit1").style.display = val;
	document.getElementById("isel").style.display =  auto==0?"inline-table":"none";
	document.getElementById("iseltext").style.display =  auto==0?"inline-table":"none";
}
function createSwTime(id,trNode) {
	var tdNode = document.createElement("td");
	tdNode.id = "swtimetext"+id;
	tdNode.innerHTML = id==0?"SwitchTime IN1/IN2:":"SwitchTime IN2/IN1:";
	tdNode.style.fontWeight = "bold";
	trNode.appendChild(tdNode);
	tdNode = document.createElement("td");
	tdNode.id = "swtimetd"+id;
	trNode.appendChild(tdNode);
	var del = document.createElement("input");
	var tooltip = "Min: "+swTimeLims.min+", Max: "+swTimeLims.max+", Steps = 2seconds";
	del.title = tooltip;
	del.id = "swtime"+id;
	del.name = id;
	del.type = "text";
	del.size = "2";
	del.className = "number";	
	del.align = "center";
	del.onkeypress = function(ev) {	return numbersOnly(ev);	}
	tdNode.appendChild(del);
	tdNode = document.createElement("td");
	tdNode.innerHTML = "sec";
	tdNode.id = "swtimeunit"+id;
	tdNode.style.textAlign = "left";
	trNode.appendChild(tdNode);
}
function createDLDelay(id,t) {
	var trNode = document.createElement("tr");
	var tdNode = document.createElement("td");
	tdNode.innerHTML = Texts['DELAY']+t;
	tdNode.style.fontWeight = "bold";
	trNode.appendChild(tdNode);
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	var del = document.createElement("input");
	var tooltip = "Min: "+delayLims.min +", Max: "+delayLims.max+" us";
	del.title = tooltip;
	del.id = id;
	del.name = id;
	del.type = "text";
	del.size = "5";
	del.className = "number";
	del.align = "center";
	del.onkeypress = function(ev) {	return numbersOnly(ev);	}
	tdNode.appendChild(del);
	tdNode = document.createElement("td");
	tdNode.innerHTML = "us";
	tdNode.style.textAlign = "left";
	trNode.appendChild(tdNode);
	return trNode;
}
function createAttenuator(id,inout,nr,t) {
	var trNode = document.createElement("tr");
	var tdNode = document.createElement("td");
	tdNode.innerHTML = Texts['ATTENUATOR']+t;
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
	var isMaster = nr == 0;
	var box = document.createElement("div");
	var el = document.createElement("div");
	el.innerHTML = 'BOARD&nbsp;STATUS';
	el.style.color = "black";
	el.style.fontWeight = "bold";
	el.style.marginBottom = "3px";
	el.style.textAlign = "center";
	box.appendChild(el);
	var tbl = document.createElement("table");
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
	td = createLedBox("boardTempLed"+nr);
	td.style.paddingLeft = "10px";
	td.style.paddingRight = "10px";
	tr.appendChild(td);
	td = document.createElement("td");
	td.id = "boardTempMet"+nr;
	tr.appendChild(td);
	var s = board_temp_settings;
	var boardTempMet = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
	boardTempMet.attachTo(td);
	boardTempMet.valueSet(s.min);
	boardTempMet.setFloat("right");
	td = document.createElement("td");
	td.id = "boardTempTxt"+nr;
	td.style.minWidth = "25px";
	td.style.textAlign = "right";
	td.className = "tabval";
	td.innerHTML = "30";
	tr.appendChild(td);
	td = document.createElement("td");
	tr.appendChild(td);
	td.innerHTML = "&ordm;C";
	tr = document.createElement("tr");
	tb.appendChild(tr);
	if (isMaster) {
		td = document.createElement("th");
		td.innerHTML = Texts['HWFAIL'];
		td.style.textAlign = "left";
		tr.appendChild(td);		
		td = createLedBox("fpgaLed"+nr);
		td.style.paddingLeft = "10px";
		td.style.paddingRight = "10px";
		tr.appendChild(td);
	}
	td = document.createElement("td");
	td.colSpan = (nr == 0?1:5);
	tr.appendChild(td);
	el = createUnitReset(nr);
	td.appendChild(el);
	if (nr == 0) {
		td = document.createElement("td");
		tr.appendChild(td);
		td = document.createElement("td");
		el = createClearCounters();
		td.appendChild(el);
		tr.appendChild(td);
	}
	if (isMaster) {
		tr = document.createElement("tr");
		tb.appendChild(tr);
		td = document.createElement("th");
		td.innerHTML = Texts['PLLSTAT'];
		td.style.textAlign = "left";
		tr.appendChild(td);
		td = createLedBox("pllStatusLed");
		td.style.paddingLeft = "10px";
		td.style.paddingRight = "10px";	
		tr.appendChild(td);
		td = document.createElement("td");
		var b = document.createElement("div");
		b.style.minWidth = "50px";
		b.id = "pllStatusText";
		td.appendChild(b);
		td.style.textAlign = "center";
		tr.appendChild(td);
	}
	if (isMaster && window.top.NFPAMonitor[0] != 0) {
		if (typeof(version) == 'undefined' || !version || version.isUndefined()) {
			var sr = version.retrieve();
			version.parse(sr);
		}
	}
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

function createMasterPaTable(nr) {
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
	tdNode = document.createElement("td");
	tdNode.innerHTML = Texts['ENABLED'];
	tdNode.style.textAlign = "right";
	tdNode.style.fontWeight = "bold";
	trNode.appendChild(tdNode);
	tdNode = createLedBox("hpaEnLed"+nr);
	tdNode.style.paddingLeft = tdNode.style.paddingRight = "10px";
	trNode.appendChild(tdNode);
	tdNode = createHpaSwitch(nr);
	trNode.appendChild(tdNode);
	if (factory.showPaCurrentAlarm()) {
		createHpaAlarmCurrent(tbodyNode);
	}
	if (window.top.NFPAMonitor[nr]!=0){
		createHpaAlarmFip413(tbodyNode);
	}
	return box;
}

function createNfpaMasterStat(tb) {
	var tr, td;
	tr = document.createElement("tr");
	tb.appendChild(tr);
	td = document.createElement("th");
	td.innerHTML = TextEn['COMERR'];
	td.style.textAlign = "left";
	tr.appendChild(td);
	td = createLedBox("hpaStatLed0");
	td.style.paddingLeft = "10px";
	td.style.paddingRight = "10px";
	tr.appendChild(td);
	td = document.createElement("th");
	td.innerHTML = Texts['TXLOW'];
	td.style.textAlign = "left";
	td.colSpan = 2;
	tr.appendChild(td);
	td = createLedBox("hpaTxLowLed0");
	tr.appendChild(td);
}

function createHpaAlarmFip413(tbodyNode) {
	var trNode, tdNode;
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("td");
	tdNode.innerHTML = Texts['COMERR'];
	tdNode.style.textAlign = "left";
	tdNode.style.fontWeight = "bold";
	tdNode.colSpan = 2;
	trNode.appendChild(tdNode);
	tdNode = createLedBox("hpaStatLed0");
	trNode.appendChild(tdNode);
	if (!factory.ignorePaTxLowAlarm()) {
		trNode = document.createElement("tr");
		tbodyNode.appendChild(trNode);
		tdNode = document.createElement("td");
		tdNode.innerHTML = Texts['TXLOW'];
		tdNode.style.textAlign = "left";
		tdNode.style.fontWeight = "bold";
		tdNode.colSpan = 2;
		trNode.appendChild(tdNode);
		tdNode = createLedBox("hpaTxLowLed0");
		trNode.appendChild(tdNode);
	}
}

function createHpaAlarmCurrent(tbodyNode) {
	var trNode, tdNode;
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("td");
	tdNode.innerHTML = Texts['PASTATUS'];
	tdNode.style.textAlign = "left";
	tdNode.style.fontWeight = "bold";
	tdNode.colSpan = 2;
	trNode.appendChild(tdNode);
	tdNode = createLedBox("hpaCurrentLed0");
	tdNode.style.paddingLeft = tdNode.style.paddingRight = "10px";
	trNode.appendChild(tdNode);
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
	tdNode.style.textAlign = "right";
	tdNode.style.fontWeight = "bold";
	trNode.appendChild(tdNode);
	tdNode = createLedBox("hpaEnLed"+nr);
	trNode.appendChild(tdNode);
	tdNode = createHpaSwitch(nr);
	trNode.appendChild(tdNode);
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	if (window.top.NFPAMonitor[nr]!=0){
		tdNode = document.createElement("td");
		tdNode.innerHTML = Texts['COMERR'];
		tdNode.style.textAlign = "right";
		tdNode.style.fontWeight = "bold";
		trNode.appendChild(tdNode);
		tdNode = createLedBox("hpaStatLed"+nr);
		trNode.appendChild(tdNode);
	}	
	tdNode = document.createElement("td");
	tdNode.innerHTML = (window.top.NFPAMonitor[nr] != 0 ? Texts['AGCFAIL'] : Texts['PAOVF']);
	tdNode.style.textAlign = "right";
	tdNode.style.fontWeight = "bold";
	trNode.appendChild(tdNode);
	tdNode = createLedBox("hpaOvfLed"+nr);
	trNode.appendChild(tdNode);
	tbodyNode.appendChild(trNode);
	if (window.top.NFPAMonitor[nr]!=0){
		trNode = document.createElement("tr");
		tdNode = document.createElement("td");
		tdNode.innerHTML = Texts['VSWR'];
		tdNode.style.textAlign = "right";
		tdNode.style.fontWeight = "bold";
		trNode.appendChild(tdNode);
		tdNode = createLedBox("hpaVswrLed"+nr);
		trNode.appendChild(tdNode);
		tdNode = document.createElement("td");
		tdNode.innerHTML = Texts['TXLOW'];
		tdNode.style.textAlign = "right";
		tdNode.style.fontWeight = "bold";
		trNode.appendChild(tdNode);	
		tdNode = createLedBox("hpaTxLowLed"+nr);
		trNode.appendChild(tdNode);	
		tbodyNode.appendChild(trNode);
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
	hpaEnBox.style.backgroundColor = "#D0FFD0";
	hpaEnBox.style.borderStyle = "inset";
	hpaEnBox.style.borderRadius = "3px";
	hpaEnBox.style.marginLeft = "auto";
	hpaEnBox.style.marginRight = "auto";
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
		return -1;
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

function txLowHpaLedSet(nr,val){
	ledSetColor("hpaTxLowLed"+nr, val);
}

function enHpaLedSet(nr, val) {
	ledSetColor("hpaEnLed"+nr, val);
}

function paCurrentLedSet(val) {
	ledSetColor("hpaCurrentLed0", val);
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
function remoteInputsDisableStateSet(n, disabled) {
	var disable = isGuiBlocked() ? true : disabled;
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
	gdSetDisableState(n, disable);
	gdCtrlSetDisableState(n, disable);
	persitTimeSetDisable(n, disable);
	simplexSetDisable(n, disable);
}

function createClearCounters() {
	var box = document.createElement("div");
	var el = document.createElement("input");
	el.id = "clearErrCounter";
	el.name = el.id;
	el.type = "button";
	el.value = "Clear Error Counters";
	if (typeof(version) == 'undefined' || !version || version.isUndefined()) {
		var sr = version.retrieve();
		version.parse(sr);
	}
	if (version.compareSw("0304") < 0) {
		el.style.display = "none";
	}
	el.onclick = function() { submitClearCounters(); }; 
	el.style.fontWeight = "bold";
	el.style.backgroundColor = "#BABABA";
	box.appendChild(el);
	return box;
}

function  createFiberPopupLinks() {
	var box = document.createElement("div");
	var myTable, tbodyNode;
	myTable = document.createElement("table");
	//myTable.setAttribute("border", "1");
	box.appendChild(myTable);
	myTable.style.borderSpacing = "7px";
	tbodyNode = document.createElement("tbody");
	tbodyNode.id = "fiberPopupLinksBody";
	myTable.appendChild(tbodyNode);
	return box;
}

function fiberLinkLedSet(nr, color) {
	var idx = getRemoteIndex(nr, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesStatMask);
	ledSetColor("fiberLinkLed"+idx, color);
}
function expansorLinkLedSet(ne,color){
	ledSetColor("expansorLinkLed"+ne, color);
}
function redrawExpansionLinks(expansorNr) {
	var cell = document.getElementById("expansorCell");
	remove_children(cell);
	var el = createExpansorTable(window.top.expansorNr);
	cell.appendChild(el);
	cell.style.visibility = "visible";
}

function appendFiberPopupLink(nr) {
	var masterTableBody = document.getElementById("fiberPopupLinksBody");
	var idx = getRemoteIndex(nr, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
	var tr = document.createElement("tr");
	masterTableBody.appendChild(tr);
	var td = document.createElement("td");
	tr.appendChild(td);
	var el = document.createElement("a");
	td.appendChild(el);
	el.id = "fiberpopupremote_"+idx;
	el.innerHTML = Texts['REMOTELINK']+"&nbsp;"+window.top.redundedFiberRemotesIndex[nr];
	el.style.minWidth = "115px";
	el.className = "m";
	el.style.fontSize = "11px";
	el.href = "/optLink.html?linkNr="+window.top.redundedFiberRemotes[nr]+";remotesNr="+window.top.remotesNr+";MaxRemotesNr="+window.top.MaxRemotesNr+";remotesMask="+window.top.remotesBitmask+";ne=0";
	el.onclick = function() {optPopup(nr,0,this.href);return false;};
	td = createLedBox("fiberLinkLed"+idx);
	tr.appendChild(td);
}

function appendFiberNotif(nr, remotesNr, remotesMask, addLink) {
	var masterTableBody = document.getElementById("fiberPopupLinksBody");
	var idx = getRemoteIndex(nr, remotesNr, window.top.MaxRemotesNr, remotesMask);
	var tr = document.createElement("tr");
	masterTableBody.appendChild(tr);
	var el = document.createElement("a");
	el.id = "fiberpopupremote_"+idx;
	el.innerHTML = Texts['REMOTELINK']+"&nbsp;"+idx;
	el.style.minWidth = "115px";
	el.className = "m";
	el.style.fontSize = "11px";
	if (addLink) {
		el.href = "/optLink.html?linkNr="+nr+";remotesNr="+window.top.remotesNr+";MaxRemotesNr="+window.top.MaxRemotesNr+";remotesMask="+window.top.remotesStatMask+";ne=0";
		el.idx = idx;
		el.nr = nr
		el.onclick = function() {newPopup(this.nr,0,this.href);return false;};
	} else {
		el.disabled = true;
	}
	var td = document.createElement("td");
	td.appendChild(el);
	tr.appendChild(td);
	td = createLedBox("fiberLinkLed"+idx);
	tr.appendChild(td);
}

function newPopup(nr,ne,url) {
	if (optPopupWindow && !optPopupWindow.closed)
		optPopupWindow.close();
	var w = 480;
	var h = 240;
	var twofibers, isRedunded;
	var fmask = localStorage.getItem("fibermask_1dm6"+window.location.host);
	var fibermask = fmask.split(",");
	isRedunded = false;
	twofibers = false
	var left = (screen.width/2)-(w/2);
	var top = (screen.height/2)-(h/2);
	//if remote, ne=0, if expansor ne>0
	var name = "Optical_Link";
	var wspecs = 'resizable=1,scrollbars=1,toolbar=no,menubar=no,directories=no,status=no,titlebar=no,height='+h+',width='+w+',left='+left+',top='+top;
	optPopupWindow = window.open(url, name, wspecs);
}

function masterFiberPopupLinkExists(nr, remotesMask) {
	var idx = getRemoteIndex(nr, window.top.remotesNr, window.top.MaxRemotesNr, remotesMask);
	var id = "fiberpopupremote_"+idx;
	var el = document.getElementById(id);
	return (el != null);
}

function createExpansorTable(expansorNr){
	var box = document.createElement("div");
	var myTable, tbodyNode;
	myTable = document.createElement("table");
	box.appendChild(myTable);
	myTable.style.borderSpacing = "7px";
	tbodyNode = document.createElement("tbody");
	tbodyNode.id = "expansorPopupLinksBody";
	myTable.appendChild(tbodyNode);
	for (var n=1; n <= expansorNr; ++n)
	{
		tbodyNode.appendChild(createExpansorPopupLink(n));
	}
	return box;
}

function createExpansorPopupLink(ne) {
	var tr = document.createElement("tr");
	var td = document.createElement("td");
	tr.appendChild(td);
	var el = document.createElement("a");
	td.appendChild(el);
	el.innerHTML = Texts['EXPANSORLINK']+"&nbsp;"+ne;
	el.className = "m";
	el.style.fontSize = "11px";
	el.href = "/optLink.html?linkNr="+window.top.redundedFiberRemotes[0]+";remotesNr="+window.top.remotesNr+";MaxRemotesNr="+window.top.MaxRemotesNr+";remotesMask="+window.top.remotesBitmask+";ne="+ne;
	el.onclick = function() {optPopup(0,ne,this.href);return false;};
	td = createLedBox("expansorLinkLed"+ne);
	tr.appendChild(td);
	return tr;
}

function createFiberTable(nr) {
	var box = document.createElement("div");
	var h = document.createElement("div");
	var isFiberRed = isFiberRedunded(nr);
	h.style.textAlign = "center";
	box.appendChild(h);
	var el = document.createElement("a");
	h.appendChild(el);
	el.id = "fibertitle_"+nr;
	el.name = el.id;
	var idx = getRemoteIndex(nr, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
	el.className = "m";
	el.style.fontSize = "11px";
	el.href = "/optLink.html?linkNr="+window.top.redundedFiberRemotes[nr]+";remotesNr="+window.top.remotesNr+";MaxRemotesNr="+window.top.MaxRemotesNr+";remotesMask="+window.top.remotesBitmask+";ne=0";
	el.onclick = function() {optPopup(nr,0,this.href);return false;};
	appendFiberPopupLink(nr);
	var myTable, tbodyNode, trNode, tdNode;
	myTable = document.createElement("table");
	myTable.style.verticalAlign = "middle";
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
	if (window.top.FiberMask[nr]==0x03) tdNode.colSpan=2;
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = Texts['MASTER'];
	if (isFiberRed) tdNode.colSpan=2;
	tdNode.style.textAlign = "center";
	if (window.top.FiberMask[nr]==0x03) {
		trNode = document.createElement("tr");
		tbodyNode.appendChild(trNode);
		tdNode = document.createElement("td");
		trNode.appendChild(tdNode);
		tdNode = document.createElement("th");
		tdNode.innerHTML = "PORT1";
		trNode.appendChild(tdNode);
		tdNode = document.createElement("th");
		tdNode.innerHTML = "PORT2";
		trNode.appendChild(tdNode);	
		if (isFiberRed){
			var numports = (window.top.redundedFiberRemotesIndex[nr]).split("-");
			tdNode = document.createElement("th");
			tdNode.innerHTML = "PORT"+numports[0];
			trNode.appendChild(tdNode);
			tdNode = document.createElement("th");
			tdNode.innerHTML = "PORT"+numports[1];
			trNode.appendChild(tdNode);
		}else{
			tdNode = document.createElement("td");
			trNode.appendChild(tdNode);		
		}
		if (window.top.mode[nr]==0){
			trNode = document.createElement("tr");
			tbodyNode.appendChild(trNode);
			tdNode = document.createElement("th");
			tdNode.innerHTML = TextEn['ACTLINK'];
			tdNode.style.textAlign = "right";
			trNode.appendChild(tdNode);
			tdNode = createLedBox("optActLnk_1_"+nr);
			trNode.appendChild(tdNode);
			tdNode = createLedBox("optActLnk_2_"+nr);
			trNode.appendChild(tdNode);	
			tdNode = document.createElement("td");
			trNode.appendChild(tdNode);	
		}
	}	
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = Texts['SYNC'];
	tdNode.style.textAlign = "right";
	tdNode.style.whiteSpace = "nowrap";
	tdNode = createLedBox("optFrSync_1_"+nr);
	trNode.appendChild(tdNode);
	tdNode.style.textAlign = "right";
	if (window.top.FiberMask[nr]==0x03) {
		tdNode = createLedBox("optFrSync_2_"+nr);
		trNode.appendChild(tdNode);
	}
	else
	{
		tdNode = document.createElement("td");
		trNode.appendChild(tdNode);
	}
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = Texts['STATUS'];
	tdNode.style.textAlign = "right";
	tdNode = createLedBox("optStatusLed_1_"+nr);
	trNode.appendChild(tdNode);
	if (window.top.FiberMask[nr]==0x03) {
		tdNode = createLedBox("optStatusLed_2_"+nr);
		trNode.appendChild(tdNode);
	}
	if (!isFiberRed){
		tdNode = createLedBox("optStatusLed_0_"+nr);
		trNode.appendChild(tdNode);
	}else{
		numports = (window.top.redundedFiberRemotes[nr]).split("-");
		tdNode = createLedBox((nr==numports[0])?"optStatusLed_0_"+nr:"optStatusLed_0_"+numports[0]+"bis");
		trNode.appendChild(tdNode);
		tdNode = createLedBox((nr==numports[0])?"optStatusLed_0_"+numports[1]+"bis":"optStatusLed_0_"+nr);
		trNode.appendChild(tdNode);		
	}
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = Texts['RXDETECT'];
	tdNode.style.textAlign = "right";
	tdNode.style.whiteSpace = "nowrap";
	tdNode = createLedBox("optRxLed_1_"+nr);
	trNode.appendChild(tdNode);
	if (window.top.FiberMask[nr]==0x03) {
		tdNode = createLedBox("optRxLed_2_"+nr);
		trNode.appendChild(tdNode);
	}		
	if (!isFiberRed){
		tdNode = createLedBox("optRxLed_0_"+nr);
		trNode.appendChild(tdNode);
	}else{
		numports = (window.top.redundedFiberRemotes[nr]).split("-");
		tdNode = createLedBox((nr==numports[0])?"optRxLed_0_"+nr:"optRxLed_0_"+numports[0]+"bis");
		trNode.appendChild(tdNode);
		tdNode = createLedBox((nr==numports[0])?"optRxLed_0_"+numports[1]+"bis":"optRxLed_0_"+nr);
		trNode.appendChild(tdNode);		
	}	
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = Texts['ERRCOUNT'];
	tdNode.style.textAlign = "right";
	tdNode.style.whiteSpace = "nowrap";
	tdNode = createTextBox("optGtpErrVal_1_"+nr);
	trNode.appendChild(tdNode);
	if (window.top.FiberMask[nr]==0x03) {	
		tdNode = createTextBox("optGtpErrVal_2_"+nr);
		trNode.appendChild(tdNode);
	}
	if (!isFiberRed){
		tdNode = createTextBox("optGtpErrVal_0_"+nr);
		trNode.appendChild(tdNode);
	}else{
		numports = (window.top.redundedFiberRemotes[nr]).split("-");
		tdNode = createTextBox((nr==numports[0])?"optGtpErrVal_0_"+nr:"optGtpErrVal_0_"+numports[0]+"bis");
		trNode.appendChild(tdNode);
		tdNode = createTextBox((nr==numports[0])?"optGtpErrVal_0_"+numports[1]+"bis":"optGtpErrVal_0_"+nr);
		trNode.appendChild(tdNode);		
	}		
	trNode = document.createElement("tr");
	tbodyNode.appendChild(trNode);
	tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = Texts['RXPOWER'];
	tdNode.style.textAlign = "right";
	tdNode = createTextBox("optPowInText_1_"+nr);
	trNode.appendChild(tdNode);
	if (window.top.FiberMask[nr]==0x03) {	
		tdNode = createTextBox("optPowInText_2_"+nr);
		trNode.appendChild(tdNode);
	}
	if (!isFiberRed){
		tdNode = createTextBox("optPowInText_0_"+nr);
		trNode.appendChild(tdNode);
	}else{
		numports = (window.top.redundedFiberRemotes[nr]).split("-");
		tdNode = createTextBox((nr==numports[0])?"optPowInText_0_"+nr:"optPowInText_0_"+numports[0]+"bis");
		trNode.appendChild(tdNode);
		tdNode = createTextBox((nr==numports[0])?"optPowInText_0_"+numports[1]+"bis":"optPowInText_0_"+nr);
		trNode.appendChild(tdNode);		
	}
	createGdCtrl(tbodyNode, window.top.FiberMask[nr]==0x03, nr, idx);
	createGdMeas(tbodyNode, window.top.FiberMask[nr]==0x03, nr, idx);
	return box;
}

function createGdCtrl(tbodyNode, twofibers, nr, idx) {
	var trNode, tdNode;
	trNode = document.createElement("tr");
	tdNode = document.createElement("th");
	tdNode.innerHTML = Texts['DCTRL'];
	tdNode.style.textAlign = "right";
	trNode.appendChild(tdNode);
	tdNode = document.createElement("td");
	tdNode.colSpan = twofibers?2:1;
	var gdEn = document.createElement("input");
	gdEn.type = "checkbox";
	gdEn.id = "gdEn_"+nr;
	gdEn.name = gdEn.id;
	gdEn.tbodyNode = tbodyNode;
	gdEn.twofibers = twofibers;
	gdEn.nr = nr;
	gdEn.idx = idx;
	gdEn.onclick = function(ev) {
		ev = ev || window.event;
		var el = ev.target;
		if (el.checked) {
			gdShow(el.tbodyNode, el.twofibers, el.nr);
		} else {
			gdHide(el.nr);
		}
	}
	gdEn.className = "centered";
	tdNode.appendChild(gdEn);
	trNode.appendChild(tdNode);
	tbodyNode.appendChild(trNode);
	gdShow(tbodyNode, twofibers, nr);
}

function gdEnSet(doSet, nr) {
	try {
		doSet = !!doSet;
		var el = document.getElementById("gdEn_"+nr);
		el.checked = doSet;
		if (el.checked) {
			gdShow(el.tbodyNode, el.twofibers, el.nr);
		} else {
			gdHide(el.nr);
		}
	} catch(err) {}
}

function gdIsEnabled(nr) {
	var el = document.getElementById("gdEn_"+nr);
	if (el) {
		return el.checked;
	}
	return false;
}

function gdShow(tbodyNode, twofibers, nr) {
	var trNode, tdNode;
	for (var j = 0; j < 2; ++j) {
		var id = "gdTitle_"+nr+"_"+j;
		tdNode = document.getElementById(id);
		if (!tdNode) {
			trNode = document.createElement("tr");
			tbodyNode.appendChild(trNode);
			tdNode = document.createElement("th");
			tdNode.innerHTML = (j == 0 ? Texts['UDELAY'] : Texts['DDELAY']);
			tdNode.style.textAlign = "right";
			tdNode.id = id;
			tdNode.name = tdNode.id;
			trNode.appendChild(tdNode);
		} else {
			tdNode.style.display = "block";
		}
		for (var i = 0; i < (twofibers ? 2 : 1); ++i) {
			id = "delay_"+j+"_"+i+"_"+nr;
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

function gdCtrlSetDisableState(nr, disable) {
	for (var b = 0; b < 2; ++b) {
		for (var f = 0; f < 2; ++f) {
			try {
				var id = "delay_"+b+"_"+f+"_"+nr;
				var el = document.getElementById(id);
				el.disabled = disable? true : false;
				el.style.backgroundColor = disable ? "#CCCCCC" : "white";
			} catch (err) {}
		}
	}
}

function gdHide(nr) {
	var el;
	for (var j = 0; j < 2; ++j) {
		el = document.getElementById("gdTitle_"+nr+"_"+j);
		if (el) {
			el.style.display = "none";
		}
		for (var i = 0; i < 2; ++i) {
			el = document.getElementById("delay_"+j+"_"+i+"_"+nr);
			if (el) {
				el.style.display = "none";
			}
		}
	}
}

function gdSetDisableState(nr, disable) {
	try {
		var el = document.getElementById("gdEn_"+nr);
		el.disabled = disable? true : false;
		el.style.backgroundColor = disable ? "#CCCCCC" : "white";
	} catch (err) {}
}

function createGdMeas(tbodyNode, twofibers, nr, idx)
{
	var trNode, tdNode;
	var id = "gdValTitle_"+nr;
	tdNode = document.getElementById(id);
	if (!tdNode) {
		trNode = document.createElement("tr");
		tbodyNode.appendChild(trNode);
		tdNode = document.createElement("th");
		tdNode.innerHTML = "Meas.&nbspDelay&nbsp;(us)";
		tdNode.style.textAlign = "right";
		tdNode.id = id;
		tdNode.name = tdNode.id;
		trNode.appendChild(tdNode);
	} else {
		tdNode.style.display = "block";
	}
	for (var i = 0; i < (twofibers ? 2 : 1); ++i) {
		id = "gdVal_"+i+"_"+nr;
		tdNode = document.getElementById(id);
		if (!tdNode) {
			tdNode = document.createElement("td");
			tdNode.id = id;
			tdNode.name = tdNode.id;
			tdNode.style.textAlign = "right";
			trNode.appendChild(tdNode);
		} else {
			tdNode.style.display = "block";
		}
	}	
}

function gdValueHide(nr) {
	var el = document.getElementById("gdValTitle_"+nr);
	if (el) {
		el.style.display = "none";
	}
	for (var i = 0; i < 2; ++i) {
		el = document.getElementById("gdVal_"+i+"_"+nr);
		if (el) {
			el.style.display = "none";
		}
	}
}

function gdValuePort(nr, p, r, delays, forced) {
	var id = "gdVal_"+p+"_"+nr;
	var el = document.getElementById(id);
	if (!el) {
		return;
	}
	el.style.border = "1px solid #db5902";
	if (typeof(forced) !== 'undefined') {
		el.innerHTML = forced;
		return;
	}
	if (!delays.isRemoteCapable(r)) {
		el.innerHTML = "N/A";
	} else if (delays.isRemoteTimeout(r)) {
		el.innerHTML = "---";
	} else {
		el.innerHTML = delays.getValue(r);
	}
}

function gdValuePortHide(nr, p)
{
	var id = "gdVal_"+p+"_"+nr;
	var el = document.getElementById(id);
	if (!el) {
		return;
	}
	el.style.border = "none";
	el.innerHTML = "";
}

function gdRender(delays, fiberPorts) {
	for (var r = 0; r < window.top.currentRemotesNr; ++r) {
		var n = r + 1;
		var k = computeRemNrInStat(n);
		var m = k - 1;
		try {
			if (!delays.isMasterCapable()) {
				gdValueHide(n);
			}
			var redunded = isFiberRedunded(n);
			var rx_alarm = window.top.master_rx_loss_alarm[k];
			var nremote = (window.top.redundedFiberRemotes[n].toString()).split("-");
			var nindex = (window.top.redundedFiberRemotesIndex[n].toString()).split("-");
			for (var i = 0, s = ""; i < nremote.length; ++i) {
				s += nremote[i]+"-";
			}
			for (var p = 0; p < 2; ++p) {
				if (rx_alarm) {
					var x = fiberPorts[m].x - 1;
					gdValuePort(n, p, x, delays, "---");
					continue;
				}
				if (!redunded) {
					if (fiberPorts[m].nf == p) {
						var x = fiberPorts[m].x - 1;
						gdValuePort(n, p, x, delays);
					} else {
						gdValuePortHide(n, p);
					}
					continue;
				}
				if (fiberPorts[m].nf == p) {
					var x = fiberPorts[m].x - 1;
					gdValuePort(n, p, x, delays);
				} else {
					if (n==nremote[0]) gdValuePort(n, p, nindex[1]-1, delays);
					if (n==nremote[1]) gdValuePort(n, p, nindex[0]-1, delays);

				}
			}
		} catch(err) {}
	}
}

function optPopup(nr,ne,url) {
	if (optPopupWindow && !optPopupWindow.closed)
		optPopupWindow.close();
	var w = 480;
	var h = 240;
	var twofibers, isRedunded;
	var fmask = localStorage.getItem("fibermask_1dm6"+window.location.host);
	var fibermask = fmask.split(",");
	if (window.top.redundedFiberRemotes[nr]) {
		var linkNr = window.top.redundedFiberRemotes[nr].toString();	
		var links = linkNr.split("-");
		isRedunded = (links.length==1)?false:true;
		var numlink = links[0];
		twofibers = (fibermask[numlink]==3) && (ne==0);
	} else {
		isRedunded = false;
		twofibers = false;
	}
	if (ne != 0) {
		w += 30;
		h += 20;
	}
	if (twofibers) {
		w += 110;
		h += 50;
	}
	if (isRedunded)  {
		w += 100;
	}
	var left = (screen.width/2)-(w/2);
	var top = (screen.height/2)-(h/2);
	//if remote, ne=0, if expansor ne>0
	var name = "Optical_Link";
	var wspecs = 'resizable=1,scrollbars=1,toolbar=no,menubar=no,directories=no,status=no,titlebar=no,height='+h+',width='+w+',left='+left+',top='+top;
	optPopupWindow = window.open(url, name, wspecs);
}
function setFiberNum(nr, nfiber) {
	try{
		var el = document.getElementById("fibertitle_"+nr);
		var num = window.top.redundedFiberRemotesIndex[nr];
		if ((window.top.FiberMask[nr]==0x03) && (!isFiberRedunded(nr)))
			el.innerHTML = Texts['REMOTELINK']+"&nbsp;"+num+"&nbsp;(PORT"+nfiber+")";
		else
			el.innerHTML = Texts['REMOTELINK']+"&nbsp;"+num;
	} catch (err) {}
}
function optActiveLinkSet(nr, color1, color2) {
	try {
	ledSetColor("optActLnk_1_"+nr, color1);
	ledSetColor("optActLnk_2_"+nr, color2);
	} catch (err) {}
}

function optFrSyncLedSet(nr, color) {
	ledSetColor("optFrSync_1_"+nr, color);
	ledSetColor("optFrSync_2_"+nr, color);
}

function optStatusLedSet(nr, nfiber, color) {
	ledSetColor("optStatusLed_"+nfiber+"_"+nr, color);
	if (nfiber==0) ledSetColor("optStatusLed_"+nfiber+"_"+nr+"bis", color);
}

function optRxLedSet(nr, nfiber, color) {
	ledSetColor("optRxLed_"+nfiber+"_"+nr, color);
	if (nfiber==0) ledSetColor("optRxLed_"+nfiber+"_"+nr+"bis", color);
}

function optErrorsSet(nr, nfiber, val) {
	try {
		var el = document.getElementById("optGtpErrVal_"+nfiber+"_"+nr);
		el.innerHTML = isNaN(val)? "---" : val.toString();
		if (nfiber==0){
			el = document.getElementById("optGtpErrVal_"+nfiber+"_"+nr+"bis");
			el.innerHTML = isNaN(val)? "---" : val.toString();
		}
	} catch (err) {}
}

function fiberPowerSet(nr, nfiber, val, color) {
	try {
		var eltxt = new Array();
		eltxt[0] = document.getElementById("optPowInText_"+nfiber+"_"+nr);
		if (nfiber==0) eltxt[1] = document.getElementById("optPowInText_"+nfiber+"_"+nr+"bis");
		for (k=0;k<eltxt.length;k++){
			if (typeof(eltxt[k]) == "undefined" || !eltxt[k])
				return;				
			if (typeof(val) === "undefined" || val == null)
				eltxt[k].innerHTML = "";
			else if (isNaN(val) && isNaN(parseInt(val)))
				eltxt[k].innerHTML = val;
			else
				eltxt[k].innerHTML = val.toFixed(1);
		}
	} catch (err) { }
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
function createMeter(id, s, units, title, f, trNode) {
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


function createWarnSimplex() {
	var box = document.createElement("div");
	box.id = "warnSimplexBox";
	box.style.display = "none";
	box.style.minHeight = "40px";
	var box1 = document.createElement("div");
	box1.style.minHeight = "35px";
	box1.style.textAlign = "center";
	box1.style.backgroundColor = "#d0d0ef";
	box1.style.outline = "1px solid #db5902";
	var t = document.createElement("h");
	t.id = "warnSimplexTxt";
	t.style.fontWeight = "bold";
	t.style.fontSize = "12px";
	t.style.color = "red";
	t.style.position = "relative";
	t.style.top = "3px";
	// t.style.display = "inline-block";
	box1.appendChild(t);
	var s = document.createElement("div");
	// s.style.display = "inline-block";
	// s.style.minWidth = "30px";
	// box1.appendChild(s);
	var b = document.createElement("input");
	b.type = "button";
	b.value = "CLOSE";
	b.onclick = function(ev) {
		try {
			showWarnSimplex(false);
			parse_config(window.top.fiplexConfStr);
		} catch(err) {}
	}
	b.style.display = "inline-block";
	b.style.marginLeft = "auto";
	b.style.marginRight = "auto";
	b.style.marginTop = "6px";
	b.style.marginBottom = "3px";
	s.appendChild(b);
	box1.appendChild(s);
	box.appendChild(box1);
	var box2 = document.createElement("div");
	box2.style.minHeight = "5px";
	box.appendChild(box2);
	return box;
}

function showWarnSimplex(val, remotesSimplexArr) {
	try {
		var el = document.getElementById("warnSimplexBox");
		el.style.display = val ? "block" : "none";
		if (!val) {
			return;
		}
		var str = "Simplex Mode in master unit must be enabled if any remote unit has Simplex Mode enabled.<br/>"
			+"Remote units with Simplex Mode enabled: "
		for (var n = 0; n < remotesSimplexArr.length; ++n) {
			if (n > 0) {
				str += ", ";
			}
			str += "# "+remotesSimplexArr[n];
		}
		str += ".";
		var el = document.getElementById("warnSimplexTxt");
		el.innerHTML = str;
	} catch(err) {}
}

function showWarnFactSimplex(val, remotesSimplexArr) {
	try {
		var el = document.getElementById("warnSimplexBox");
		el.style.display = val ? "block" : "none";
		if (!val) {
			return;
		}
		var str = "Filtering and Squelch in master unit must be enabled if any remote unit has Simplex Mode enabled.<br/>"
			+"Remote units with Simplex Mode enabled: "
		for (var n = 0; n < remotesSimplexArr.length; ++n) {
			if (n > 0) {
				str += ", ";
			}
			str += "# "+remotesSimplexArr[n];
		}
		str += ".";
		var el = document.getElementById("warnSimplexTxt");
		el.innerHTML = str;
	} catch(err) {}
}
// -->