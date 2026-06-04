var gui;
var NFPAStr;
var NFPAcfg;
var monitors;
var tmrIdStat;
var countCheck;
var factory;
var config;
var version;
var txTestLength = 504;
var rxTestLength = 336;

function onloadInit() {
	factory = new Factory();
	config = new ConfigBDA();
	gui = new GUI_NFPA();
	NFPAcfg = new NFPAconf();
	monitor = new Monitor();
	version = new Version();
	showResultIcon(ERR_NONE);
	reloadData();
}

function reloadData(){
	try {
		if (typeof(tmrIdStat) !== "undefined" && tmrIdStat) {
			clearTimeout(tmrIdStat);
		}
	} catch(err) {}
	showResultIcon(ERR_PENDING);
	cursorWait();
	globalConfigReq();
}
function globalConfigReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				var tmout = computeTimeoutReqMs();
				timerId = setTimeout(function() { loadConfigGlobal(); }, tmout);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { globalConfigReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { globalConfigReq(); }, 100);
		}
		xhr.open("POST", "/start.zhtml", true);
		xhr.timeout = 5000;
		xhr.send("global_req="+1);
		xhr = null;
	} catch (err) {}
}

function loadConfigGlobal() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				var frm = this.responseText;
				parseGlobalConfig(frm);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { loadConfigGlobal(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { loadConfigGlobal(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("GET", "/global_conf.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function parseGlobalConfig(str) {
	if ( typeof(str) === 'undefined' || str === null ) {
		globalConfigReq();
		return;
	}
	str = correctASCII(str);
	var srarr = str.split('\t');
	if (srarr.length < 7) {
		globalConfigReq();
		return;
	}
	var srConf = srarr[0];
	var srFact = srarr[1];
	NFPAStr = srarr[6]; 
	var srVersion = srarr[5];

	window.parent.navi.versionFrame = srVersion;
	version.parse(srVersion);
	version.store(srVersion);

	window.parent.navi.factoryFrame = srFact;
	factory.parse(srFact);
	localStorage.setItem("Factory"+Prjstr+window.location.host, srFact);

	window.parent.navi.confFrame = srConf;
	var ret = config.parse(srConf);
	if (ret==-2){//blocked
		window.parent.navi.document.getElementById("start").click();
		return;
	}
	config.saveFrameStr(srConf);
	window.parent.navi.confNfpaFrame = NFPAStr;
	NFPAcfg.parse(NFPAStr);
	gui.createForm();
	gui.show(NFPAcfg);
	for (var type=0; type<2; type++){
		gui.clearGraph(type);
	}
	guiBlocked(false);
	tmrIdStat = setTimeout(function() { load_status(); }, 100);
}
function load_status() {
	try {
		if (typeof(tmrIdStat) !== "undefined" && tmrIdStat) {
			clearTimeout(tmrIdStat);
		}
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState ===4 && this.status === 200) {
				var frm = this.responseText;
				var ret = monitor.parse(frm);
				if (ret==-2){//blocked
					window.parent.navi.document.getElementById("start").click();
					return;
				}
				gui.showStatus(monitor);
				var timeoutMs = isFileOpBusy() ? 10000 : 1000;
				tmrIdStat = setTimeout(function() { load_status(); }, timeoutMs);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrIdStat) !== "undefined" && tmrIdStat)
				clearTimeout(tmrIdStat);
			tmrIdStat = setTimeout(function() { load_status(); }, 1000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrIdStat) !== "undefined" && tmrIdStat)
				clearTimeout(tmrIdStat);
			tmrIdStat = setTimeout(function() { load_status(); }, 1000);
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function submitform(mode) {
	if (typeof mode == "undefined") return;
	if ((typeof window.top.submitLocked == "undefined") || !window.top.submitLocked) {
		window.top.submitLocked = true;
	} else if (window.top.submitLocked) {
		return;
	}
	var frm;
	if (mode == 0) {
		var cfgToSend = new ConfigBDA();
		cfgToSend.parse(config.frm);
		cfgToSend.runIsolationMeas[0] = true;
		frm = "ctl_conf_str="+cfgToSend.getFrm();
		document.getElementById("ctl_conf_str").value = frm;
	}
	else {
		frm = "ctl_diag_str=";
		frm += hexformat(mode,2);
		document.getElementById("ctl_diag_str").value = frm;
	}
	doSubmit(frm, mode);
}
function doSubmit(frm, mode) {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					countCheck = 0;
					setTimeout(function() { check_result(mode); }, 100);
				} else {
					showResultIcon(ERR_FAIL);
					setTimeout(function() { xhrOnEnd(); }, 1500);
				}
			}
		}
		xhr.onerror = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(); }, 1500);
		}
		xhr.ontimeout = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(); }, 1500);
		}
		xhr.open("POST", "/diagnose.zhtml", true);
		xhr.timeout = 5000;
		xhrOnStart();
		xhr.send(frm);
		xhr = null;
	} catch (err) {
		showResultIcon(ERR_FAIL);
		setTimeout(function() { xhrOnEnd(); }, 1500);
	}
}

(function() {
	onunload = function() {
		window.top.submitLocked = false;
		cursorClear();
		showResultIcon(ERR_NONE);
		guiBlocked(false);
	};
})();

function xhrOnStart() {
	window.top.submitLocked = true;
	cursorWait();
	showResultIcon(ERR_PENDING);
	guiBlocked(true);
}

function xhrOnEnd() {
	window.top.submitLocked = false;
	cursorClear();
	showResultIcon(ERR_NONE);
	guiBlocked(false);
}

function check_result(mode) {
	if (typeof countCheck === "undefined")
		countCheck = 0;
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				var error = ERR_PENDING;
				if (this.status === 200) {
					if (mode == 0)
						error = parseInt(this.responseText);
					else{
						var l = this.responseText.length;
						if (l > 10) // it is not pending / busy
							error = l < (mode == 1 ? txTestLength : rxTestLength) ? ERR_FAIL : ERR_OK;
					}
					if (error != ERR_OK && error != ERR_FAIL) {
						if (++countCheck < 25) {
							setTimeout(function() { check_result(mode); }, 1000);
							return;
						} else
							error = ERR_FAIL;
					}
				} else {
					error = ERR_FAIL;
				}
				showResultIcon(error);
				if (mode>0) gui.showInfo(mode, this.responseText);
				tmrIdStat = setTimeout(function() { 
					xhrOnEnd();
					load_status(); }, 1000);
			}
		}
		xhr.onerror = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(); }, 1500);
		}
		xhr.ontimeout = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(); }, 1500);
		}
		Date.now = Date.now || function() { return +new Date; };
		var cmd = mode == 0 ? "/result.shtml" : "/rftest.shtml";	
		xhr.open("GET", cmd + "?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}

function GUI_NFPA() {
	this.guiCreated = false;
	this.read = function(){

	}
	this.showStatus = function(){
		for (var k = 0; k < monitor.gralAlarm.length; k++)
			this.gralAlarmSet(k, monitor.gralAlarm[k]);
		for (var k = 0;k < monitor.hwFailAlarms.length;k++){
			this.gralAlarmSet("0_"+k, monitor.hwFailAlarms[k].alarm);
		}
		for (var k = 0; k < monitor.bbuAlarm.length; k++){
			this.bbuAlarmSet(k, monitor.bbuAlarm[k], monitor.bbuChargerErrorCode);
		}
		for (var band = 0; band < 2; ++band) {
			for (var k = 0; k < monitor.dlPaFailAlarms.length;k++){
				this.bandAlarmSet(band, "2_"+k, monitor.dlPaFailAlarms[k].alarm[band]);
			}
			for (var k = 0; k < monitor.bandAlarm[band].length;k++)
				this.bandAlarmSet(band, k, monitor.bandAlarm[band][k]);
		}
		for (var k=0;k<monitor.voltageMonitoring.length;k++){
			setTextCell("volt_"+k, monitor.voltageMonitoring[k].meas.toFixed(2) + " V");
		}
		setTextCell("curr_0_0", monitor.paCurrent[0][0] + " mA");
		for (var band = 0; band < 2; ++band) {
			setTextCell("curr_"+band+"_1", monitor.paCurrent[band][1] + " mA");
		}
		setTextCell("boardTemp", monitor.boardTemp.toFixed(1) + " °C");
		setTextCell("fpgaTemp", monitor.fpgaTemp.toFixed(1) + " °C");
		setTextCell("afeTemp", monitor.afeTemp.toFixed(1) + " °C");
		for (var band = 0; band < 2; band++){
			setTextCell("paTemp_"+band, monitor.paTemp[band].toFixed(1) + " °C");
		}
		this.setIsolGain(monitor.maxAllowGain);
	}
	this.show = function(){
	
	}
	this.createForm = function() {
		if (this.guiCreated) return;
		this.guiCreated = true;
		var cont = document.getElementById("page");
		var unitDiv = document.createElement("div");
		unitDiv.id = "unitDiv";
		unitDiv.className = "unitbox";
		cont.appendChild(unitDiv);
		//GENERAL
		var headDiv = this.createUnitHead("GENERAL");
		unitDiv.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.id = "contentDivAlarm";
		var tab = this.createGeneralInterface();
		contentDiv.appendChild(tab);
		//RF DIAGNOSE
		var headDiv = this.createUnitHead("RF DIAGNOSE");
		unitDiv.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.id = "contentDivDiagnose";
		var tab = this.createRFDiagnose();
		contentDiv.appendChild(tab);	
	}
	this.createRFDiagnose = function(){
		var tab = document.createElement("table");
		tab.className = "contenttable";
		//ANTENNA ISOLATION
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);
		var cell = this.createOpfSettingsAntIsol();
		cell.className = "contentcell";
		rowb.appendChild(cell);
		//TX/RX CHAIN VERIFICATION
		for (var type=0;type<2;type++){
			var rowb = document.createElement("tr");
			tab.appendChild(rowb);
			var cell = this.createRxTxChainTest(type);
			cell.className = "contentcell";
			rowb.appendChild(cell);
		}
		return tab;
	}
	this.createRxTxChainTest = function(type) {
		var cellb = document.createElement("td"); 
		var tbl = document.createElement("table");
		tbl.style.width = "100%";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		this.createRxTxTestButton(row, type);
		var row = document.createElement("tr");
		tb.appendChild(row);
		for (var band=0;band<2;band++){
			var cell = document.createElement("td");
			cell.style.textAlign = "center";
			row.appendChild(cell);
			var el = document.createElement("canvas");
			el.style.width = "400px";
			el.style.height = "300px";
			el.id = "cnvrftest_"+type+"_"+band;
			el.name = el.id;
			cell.appendChild(el);
		}
		return cellb;
	}
	this.clearGraph = function(type){
		for (var band=0;band<2;band++){
			this.drawGraph(type,band);
		}
	}
	this.drawGraph = function(type,band, valY, valY1, valY2){
		var cnv = document.getElementById("cnvrftest_"+type+"_"+band);
		cnv.style.backgroundColor = "white";
		var w = 400; cnv.width = w;
		var h = 300; cnv.height = h;
		var ctx = cnv.getContext("2d");
		var reflevel = type == 0 ? (config.externalPA ? 40 : 30) : -50;
		var reflevel2 = 0;
		var nX = 10;
		var nY = 10;
		var lblx = factory.fstart[2*band+1] / 1e6;
		var lblx2 = factory.fstart[2*band] / 1e6;
		var stepX = ((factory.fstop[2*band+1] - factory.fstart[2*band+1]) / 1e6) / nX;
		var stepY = 3;
		var stepY2 = 3;
		var fs = nY * stepY;
		var fs2 = nY * stepY2;
		var lbly = reflevel;
		var lbly2 = reflevel2;
		var ctx = cnv.getContext("2d");
		var s;
		//title
		ctx.fillStyle = "black";
		ctx.textAlign = "left";
		ctx.font = "11px Arial";
		var titl = (type==0?"TX":"RX") + " Chain - " + factory.bandNames[band];
		ctx.fillText(titl, 30,20);
		//legend
		ctx.fillStyle = "blue";
		ctx.fillText("DL " + (type==0?"Output":"Input") + " Power", 130, 20);
		ctx.fillStyle = "green";
		ctx.fillText("UL " + (type==0?"Output":"Input") + " Power", 220, 20);
		if (type==0){
			ctx.fillStyle = "red";
			ctx.fillText("DL Return Loss", 310, 20);
		}
		//draw X grid
		ctx.font = "10px Arial";
		ctx.fillStyle = "black";
		ctx.textAlign = "center";
		for (i = 0; i <= nX; i ++) {
			ctx.beginPath();
			if (i==0 || i==nX)
				ctx.setLineDash([]);
			else
				ctx.setLineDash([5, 5]);
			ctx.moveTo((i+1)*w/(nX+2), h/(nY+2));
			ctx.lineTo((i+1)*w/(nX+2), h*(nY+1)/(nY+2));
			ctx.stroke();
			s = lblx.toFixed(1);
			ctx.fillStyle = "black";
			ctx.fillText(s , Math.round( (i+1)*w/(nX+2)),289);
			s = lblx2.toFixed(1);
			ctx.fillStyle = "green";
			ctx.fillText(s , Math.round( (i+1)*w/(nX+2)),299);
			lblx = lblx +stepX;
			lblx2 = lblx2 +stepX;			
		}
		//draw Y grid
		for (i = 0; i <= nY; i ++) {
			ctx.beginPath();
			if (i==0 || i==nY)
				ctx.setLineDash([]);
			else
				ctx.setLineDash([5, 5]);
			ctx.moveTo(w/(nX+2), (i+1)*h/(nY+2));
			ctx.lineTo(w*(nX+1)/(nX+2), (i+1)*h/(nY+2));
			ctx.stroke();
			ctx.fillStyle = "blue";
			ctx.fillText(lbly, 18,Math.round(5+(i+1)*h/(nY+2)));
			lbly = lbly - stepY;
			if (type==0){
				ctx.fillStyle = "red";
				ctx.fillText(lbly2, 380,Math.round(5+(i+1)*h/(nY+2)));
				lbly2 = lbly2 -stepY2;
			}
		}
		ctx.lineWidth = 2;
		//plot Y data
		if (typeof(valY) !== "undefined") {
			ctx.strokeStyle = "blue";
			var n = valY.length;
			var v = [];
			for (i = 0; i < n; i ++) {
				v.push(valY[i]);
				if (v[i] > reflevel) v[i] = reflevel - 0.2;
				if (v[i] < (reflevel - fs)) v[i] = reflevel - fs + 0.2;
			}
			for (i = 0; i < n; i ++) {
				ctx.beginPath();
				ctx.moveTo(w*(nX*(i)/(n-1)+1)/(nX+2), h*(nY*(reflevel-v[i])/fs+1)/(nY+2));
				ctx.lineTo(w*(nX*(i+1)/(n-1)+1)/(nX+2), h*(nY*(reflevel-v[i+1])/fs+1)/(nY+2));
				ctx.stroke();
			}
		}
		//plot 2nd Y data
		if (typeof(valY1) !== "undefined") {
			ctx.strokeStyle = "green";
			var n = valY1.length;
			var v = [];
			for (i = 0; i < n; i ++) {
				v.push(valY1[i]);
				if (v[i] > reflevel) v[i] = reflevel - 0.2;
				if (v[i] < (reflevel - fs)) v[i] = reflevel - fs + 0.2;
			}
			for (i = 0; i < n; i ++) {
				ctx.beginPath();
				ctx.moveTo(w*(nX*(i)/(n-1)+1)/(nX+2), h*(nY*(reflevel-v[i])/fs+1)/(nY+2));
				ctx.lineTo(w*(nX*(i+1)/(n-1)+1)/(nX+2), h*(nY*(reflevel-v[i+1])/fs+1)/(nY+2));
				ctx.stroke();
			}
		}
		//plot Y2 data
		if (typeof(valY2) !== "undefined") {
			ctx.strokeStyle = "red";
			var n = valY2.length;
			//valY2 - valY is plotted
			var v = [];
			for (i = 0; i < n; i ++) {
				v.push(valY2[i]-valY[i]);
				if (v[i] > reflevel2) v[i] = reflevel2 - 0.2;
				if (v[i] < (reflevel2 - fs2)) v[i] = reflevel2 - fs2 + 0.2;
			}
			for (i = 0; i <= n-1; i ++) {
				ctx.beginPath();
				ctx.moveTo(w*(nX*(i)/(n-1)+1)/(nX+2), h*(nY*(reflevel2-v[i])/fs2+1)/(nY+2)); 
				ctx.lineTo(w*(nX*(i+1)/(n-1)+1)/(nX+2), h*(nY*(reflevel2-v[i+1])/fs2+1)/(nY+2));
				ctx.stroke();
			}
		}
	}
	this.showInfo = function(mode, s){
		var res = [];
		if (mode!=1 && mode!=2) return;
		var n_arrays = mode == 1 ? 6 : 4;
		var ind = 0;
		for (var i = 0;i < n_arrays; i++){
			res.push([]);
			for (var j=0;j<21;j++){
				res[i].push(to_float(parseInt(s.substring(ind,ind+=4),16)));
			}
		}
		if (mode==1){
			this.drawGraph(0,0,res[1],res[0],res[4]);//TX UL/DL B0
			this.drawGraph(0,1,res[3],res[2],res[5]);//TX UL/DL B1
		}else{
			this.drawGraph(1,0,res[1],res[0]); //RX UL/DL B0
			this.drawGraph(1,1,res[3],res[2]); //RX UL/DL B1
		}
	}
	this.createRxTxTestButton = function(row, type) {
		var cell = document.createElement("td");
		cell.colSpan = 2;
		row.appendChild(cell);
		cell.style.textAlign = "center";
		cell.style.verticalAlign = "top";
		var el = document.createElement("input");
		el.id = "isolVerif";
		el.name = el.id;
		el.type = "button";
		el.style.fontSize = "12px";
		el.style.fontWeight = "bold";
		el.value = (type==0 ? "TX" : "RX") + " Chain Verification";
		el.style.width = "300px";
		el.t = type;
		el.onclick = function(ev) {
			if (confirm("This test will temporarily disable the BDA's service.\nDisconnect antennas and load RF ports.\nDo you want to continue?"))
				submitform(this.t+1);
		}
		cell.appendChild(el);
	}
	this.createOpfSettingsAntIsol = function() {
		var cellb = document.createElement("td"); 
		var tbl = document.createElement("table");
		tbl.style.width = "100%";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		this.createIsolVerify(row);		
		var row = document.createElement("tr");
		tb.appendChild(row);
		this.createIsol(row);
		var cell = document.createElement("td");
		cell.style.width = "300px";
		row.appendChild(cell);
		this.createIsolGain(row);
		return cellb;
	}
	this.createIsolVerify = function(row) {
		var cell = document.createElement("td");
		cell.colSpan = 7;
		row.appendChild(cell);
		cell.style.textAlign = "center";
		var el = document.createElement("input");
		el.id = "isolVerif";
		el.name = el.id;
		el.type = "button";
		el.style.fontSize = "12px";
		el.style.fontWeight = "bold";
		el.value = "Isolation Measurement";
		el.style.width = "300px";
		el.onclick = function(ev) {
			submitform(0);
		}
		cell.appendChild(el);
	}
	this.createIsol = function(row) {
		var cell = document.createElement("th");
		cell.className = "thdrht";
		var b = [false,false];
		for (var k=0;k<2;k++)
			b[k] = factory.adjBandEnabled[k]||factory.chBandEnabled[k];
		var dual = b[0] && b[1];
		if (dual){
			cell.innerHTML = "Last&nbsp;Isolation&nbsp;Meas.("+factory.bandNames[0]+"/"+factory.bandNames[1]+")";
		}else{
			cell.innerHTML = "Last&nbsp;Isolation&nbsp;Meas.";	
		}
		cell.style.height = "20px";
		cell.style.textAlign = "left";
		row.appendChild(cell);
		cell = createTextCell("isol",1);
		cell.style.textAlign = "center";
		row.appendChild(cell);
		cell = document.createElement("td");
		cell.innerHTML = "dB";
		cell.style.textAlign = "center";
		cell.style.fontWeight = "normal";
		row.appendChild(cell);
	}
	this.createIsolGain = function(row) {
		var cell = document.createElement("th");
		var b = [false,false];
		for (var k=0;k<2;k++)
			b[k] = factory.adjBandEnabled[k]||factory.chBandEnabled[k];
		var dual = b[0] && b[1];
		if (dual){
			cell.innerHTML = "Max.&nbsp;Allowable&nbsp;Gain("+factory.bandNames[0]+"/"+factory.bandNames[1]+")";
		}else{
			cell.innerHTML = "Max.&nbsp;Allowable&nbsp;Gain";
		}
		cell.className = "thdrht";
		cell.style.height = "20px";
		cell.style.textAlign = "left";
		row.appendChild(cell);
		cell = createTextCell("isolGain",1);
		cell.style.textAlign = "center";
		row.appendChild(cell);
		cell = document.createElement("td");
		cell.innerHTML = "dB";
		cell.style.textAlign = "center";
		cell.style.fontWeight = "normal";
		row.appendChild(cell);
	}
	this.setIsolGain = function(g) {
		try {
			var m = config.gainIsolMargin;
			var isol = [0,0];
			var gainAllow = [0,0];
			var maxGLimits = [0,0];
			var uldlMax = [0,0];
			//maximum gain for each band is computed
			for (var k=0;k<2;k++){
				for (var j=0;j<2;j++){
					if (maxGLimits[k]<factory.gainlimit[2*k+j]){
						maxGLimits[k] = factory.gainlimit[2*k+j];
						uldlMax[k] = j;
					}
				}
			}
			for (var k=0;k<2;k++){
				var gmin = maxGLimits[k]+config.GmainRange[uldlMax[k]];
				isol[k] = ((g[k]>=factory.gainlimit[2*k+uldlMax[k]])?">="+(g[k]+m[k]):g[k]+m[k])+".0";
				gainAllow[k] = (g[k]<gmin?"<"+gmin:g[k])+".0"
			}
			var b = [false,false];
			for (k=0;k<2;k++)
				b[k] = factory.adjBandEnabled[k]||factory.chBandEnabled[k];
			var dual = b[0] && b[1];

			if (dual){
				setTextCell("isol",isol[0] + " / " + isol[1]);
				setTextCell("isolGain",gainAllow[0]+ " / " + gainAllow[1]);
			}else{
				var ind = b[0]?0:1;
				setTextCell("isol",isol[ind]);
				setTextCell("isolGain",gainAllow[ind]);				
			}
		} catch(err) {}
	}
	this.createGeneralInterface = function(){
		var tab = document.createElement("table");
		tab.className = "contenttable";
		var rowb = document.createElement("tr");
		tab.appendChild(rowb); 
		
		var cell = this.createAlarmTable();
		rowb.appendChild(cell);
		cell.className = "contentcell";
		
		var cell = this.createAlarmTableBand();
		rowb.appendChild(cell);
		cell.className = "contentcell";

		var cell = this.createMagnitudesTable();
		rowb.appendChild(cell);
		cell.className = "contentcell";
		return tab;
	}
	this.createMagnitudesTable = function(){
		var cellb = document.createElement("td");
		var tbl = document.createElement("table");
		tbl.style.width = "100%";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		//VOLTAGE
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		cell.className = "cth";
		cell.innerHTML = "VOLTAGES";
		cell.colSpan = 2;
		row.appendChild(cell);
		for (var k=0;k<monitor.voltageMonitoring.length;k++){
			tb.appendChild(this.createMagnitudeRow("volt_" + k, monitor.voltageMonitoring[k].value.toFixed(2) + " Voltage Supply", true));
		}
		//PA CURRENTS
		var row = document.createElement("tr");
		tb.appendChild(row);
		row.style.minHeight = "20px";
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		cell.className = "cth";
		cell.innerHTML = "PA CURRENTS";
		cell.colSpan = 2;
		row.appendChild(cell);
		tb.appendChild(this.createMagnitudeRow("curr_0_0","PA UL Current", true));
		for (var band = 0; band < 2; band++){
			tb.appendChild(this.createMagnitudeRow("curr_"+band+"_1","PA DL "+ factory.bandNames[band] +" Current", !config.externalPA));
		}
		//TEMPERATURES
		var row = document.createElement("tr");
		tb.appendChild(row);
		row.style.minHeight = "20px";
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		cell.className = "cth";
		cell.innerHTML = "TEMPERATURES";
		cell.colSpan = 2;
		row.appendChild(cell);
		tb.appendChild(this.createMagnitudeRow("boardTemp","Main Board Temperature", true));
		tb.appendChild(this.createMagnitudeRow("fpgaTemp","FPGA Temperature", true));
		tb.appendChild(this.createMagnitudeRow("afeTemp","AFE Temperature", true));
		for (var band = 0; band < 2; band++){
			tb.appendChild(this.createMagnitudeRow("paTemp_"+band,"PA DL "+ factory.bandNames[band] +" Temperature", config.externalPA));
		}
		return cellb;
	}
	this.createMagnitudeRow = function(id, txt, show){
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		cell.style.width = "70%";
		cell.style.maxWidth = "100pt";
		cell.style.overflow = "hidden";
		row.appendChild(cell);
		cell.innerHTML = txt;
		cell.className = "thdrht";
		cell = createTextCell(id);
		cell.style.paddingLeft = "10px";
		cell.style.paddingRight = "10px";
		row.style.display = show?"table-row":"none";
		row.appendChild(cell);
		return row;
	}
	this.createAlarmTableBand = function(){
		var show;
		var cellb = document.createElement("td");
		var tbl = document.createElement("table");
		tbl.style.width = "100%";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var tabStr = "";
		for (var k=0;k<8;k++) tabStr+="&nbsp;";	
		for (var band=0;band<2;band++){
			if (band==1 && show){
				var row = document.createElement("tr");
				var cell = document.createElement("th");
				cell.style.paddingTop = "5px";
				row.appendChild(cell);
				tb.appendChild(row);
			}
			show = factory.chBandEnabled[band] || factory.adjBandEnabled[band];
			var row = document.createElement("tr");
			row.style.display = show? "table-row" :"none";
			tb.appendChild(row);
			var cell = document.createElement("th");
			cell.className = "cth";
			cell.innerHTML = factory.bandNames[band].replace("BAND","")+ "&nbsp;ALARMS";
			cell.style.paddingLeft = "10px";
			cell.style.paddingRight = "10px";
			cell.colSpan = 2;
			cell.style.minWidth = "100pt";
			row.appendChild(cell);
			for (var k=0;k<3;k++){
				tb.appendChild(this.createBandAlarm(band,k,NFPAcfg.alarmNames[1][k],show && NFPAcfg.bandAlarmsInstalled[k]));
			}
			//added DL PA fail alarms
			for (var k=0;k<monitor.dlPaFailAlarms.length;k++){
				tb.appendChild(this.createBandAlarm(band,"2_"+k, tabStr + monitor.dlPaFailAlarms[k].name,show && NFPAcfg.bandAlarmsInstalled[k] && config.externalPA));
			}
			for (var k=3;k<NFPAcfg.bandAlarmsInstalled.length;k++){
				tb.appendChild(this.createBandAlarm(band,k,NFPAcfg.alarmNames[1][k],show && NFPAcfg.bandAlarmsInstalled[k]));
			}
		}	
		return cellb;
	}
	this.createAlarmTable = function(){
		var cellb = document.createElement("td");
		var tbl = document.createElement("table");
		tbl.style.width = "100%";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		cell.className = "cth";
		cell.innerHTML = "GENERAL ALARMS";
		cell.colSpan = 2;
		row.appendChild(cell);
		tb.appendChild(this.createGralAlarm(0,NFPAcfg.alarmNames[0][0],NFPAcfg.globalAlarmsInstalled[0])); //hw fail
		//added hw fail detailed alarms
		var tabStr = "";
		for (var k=0;k<8;k++) tabStr+="&nbsp;";	
		for (var k=0;k<monitor.hwFailAlarms.length;k++){
			tb.appendChild(this.createGralAlarm("0_"+k,tabStr + monitor.hwFailAlarms[k].name, true));
		}
		for (var k=1;k<NFPAcfg.globalAlarmsInstalled.length;k++){
			tb.appendChild(this.createGralAlarm(k,NFPAcfg.alarmNames[0][k],NFPAcfg.globalAlarmsInstalled[k]));
		}	
		var bbuSerialMode = isBbuSerialMode(config, factory, version);
		var row = document.createElement("tr");
		row.style.minHeight = "10px";
		tb.appendChild(row);
		var row = document.createElement("tr");
		row.id = "BBUalarmsHeaderRow";
		if (!bbuSerialMode) {
			row.style.display = "none";
		}
		tb.appendChild(row);
		var cell = document.createElement("th");
		cell.className = "cth";
		cell.innerHTML = "BBU ALARMS";
		cell.colSpan = 2;
		row.appendChild(cell);
		for (var k=0;k<NFPAcfg.bbuAlarmsInstalled.length;k++){
			var show = NFPAcfg.bbuAlarmsInstalled[k]&&bbuSerialMode;
			tb.appendChild(this.createBbuAlarm(k,NFPAcfg.alarmNames[2][k],show));
		}	
		return cellb;
	}
	this.createGralAlarm = function(num,txt,show){
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		cell.style.width = "70%";
		cell.style.maxWidth = "100pt";
		cell.style.overflow = "hidden";
		row.appendChild(cell);
		cell.innerHTML = txt;
		cell.className = "thdrht";
		cell = createLedBox("gralAlarm_"+num);
		cell.style.paddingLeft = "10px";
		cell.style.paddingRight = "10px";
		row.appendChild(cell);
		row.style.display = show?"table-row":"none";
		return row;
	}
	this.gralAlarmSet = function(num,alarm) {
		ledSetColor("gralAlarm_"+num, alarm ? "red" : "grey");
	}	
	this.createBandAlarm = function(band,num,txt,show){
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		cell.style.width = "70%";
		row.appendChild(cell);
		cell.innerHTML = txt;
		cell.className = "thdrht";
		cell = createLedBox("bandAlarm_"+num+"_"+band);
		cell.style.paddingLeft = "10px";
		cell.style.paddingRight = "10px";
		row.appendChild(cell);
		row.style.display = show?"table-row":"none";
		return row;
	}
	this.bandAlarmSet = function(band,num,alarm) {
		ledSetColor("bandAlarm_"+num+"_"+band, alarm ? "red" : "grey");
	}
	this.createBbuAlarm = function(num,txt,show){
		var row = document.createElement("tr");
		row.id = "BbuAlarmRow_"+num;
		var cell = document.createElement("th");
		cell.style.width = "70%";
		cell.style.maxWidth = "110pt";
		cell.style.overflow = "hidden";
		row.appendChild(cell);
		if (txt != "Battery Charger Fail") {
			cell.innerHTML = txt;
		} else  {
			var cont = document.createElement("span");
			cont.innerHTML = txt;
			cell.appendChild(cont);
			cont = document.createElement("span");
			cont.innerHTML = "&nbsp;&nbsp;"
			cell.appendChild(cont);
			cont = document.createElement("span");
			cont.id = "ChargerErrorCodeId";
			cont.style.paddingLeft = cont.style.paddingRight = "3px";
			cont.style.backgroundColor = "white";
			cont.style.outline = "thin solid grey";
			cont.style.display = "inline-block";
			cont.style.minWidth = "25px";
			cont.style.minHeight = "10px";
			cont.style.visibility = "hidden";
			cell.appendChild(cont);
		}
		cell.className = "thdrht";
		cell = createLedBox("bbuAlarm_"+num);
		cell.style.paddingLeft = "10px";
		cell.style.paddingRight = "10px";
		row.appendChild(cell);
		row.style.display = show?"table-row":"none";
		return row;
	}
	this.bbuAlarmSet = function(num,alarm, ChargerErrorCodeValue) {
		ledSetColor("bbuAlarm_"+num, alarm ? (num>0?"red":"green") : "grey");
		if (num == 3) {
			// Battery Charger Fail
			var el = document.getElementById("ChargerErrorCodeId");
			if (!alarm) {
				el.style.visibility = "hidden";
				el.style.outline = "none";
			} else if (typeof(ChargerErrorCodeValue) != "undefined") {
				var str = ChargerErrorCodeValue.toString(16).toUpperCase();
				el.innerHTML = ("0000"+str).slice(-4);
				el.style.visibility = "hidden";
				el.style.outline = "none";
			}
		}
	} 
	this.createUnitHead = function(title) {
		var box = document.createElement("div");
		box.className = "headbox";
		var tab = document.createElement("table");
		box.appendChild(tab);
		tab.className = "headtable";
		tab.style.width = "100%";
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("td");
		cell.className = "tdBlank";
		row.appendChild(cell);		
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.innerHTML = title;
		cell.className = "band";
		cell.style.width = "100%";
		cell.style.textAlign = "center";
		var cell = document.createElement("td");
		cell.className = "tdBlank";
		row.appendChild(cell);
		return box;
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
		tdNode.style.minWidth = "50px";
		tdNode.style.textAlign = "center";
		tdNode.className = "tabval";
		tdNode.innerHTML = "";
		tdNode = document.createElement("td");
		tdNode.innerHTML = units;
		tdNode.style.textAlign = "right";
		trNode.appendChild(tdNode);
		return trNode;
	}
	function setMetLowWarn(id, val) {
		try {
			var met = document.getElementById("met_"+id).mMeter;
			met.mLowWarning = val;
		} catch (err) { }
	}
	function setMetValue(id, val, opt) {
		try {
			var met = document.getElementById("met_"+id).mMeter;
			if (met) {
				var color;
				if (typeof(opt) !== "undefined") {
					if (opt.toLowerCase() == "normal") {
						color = met.colorNormal;
					} else if (opt.toLowerCase() == "warning") {
						color = met.colorWarn;
					} else if (opt.toLowerCase() == "alarm") {
						color = met.colorAlarm;
					} else {
						color = opt;
					}
				}
				met.valueSet(val, color);
			}
			var txt = document.getElementById("txt_"+id);
			if (txt) {
				if (isNaN(val)) {
					txt.innerHTML = val;
				} else {
					txt.innerHTML = val.toFixed(1);
				}
			}
		} catch (err) { }
	}

	function mMeter(min, max, loA, hiA, loW, hiW) {
		this.mMax = max;
		this.mMin = min;
		this.mVal = max;
		this.mLowAlarm = loA;
		this.mHighAlarm = hiA;
		this.mLowWarning = loW;
		this.mHighWarning = hiW;
		this.colorNormal = "#00a500";
		this.colorWarn = "#f2b200";
		this.colorAlarm = "#e20000";
		this.mDiv = document.createElement("div");
		this.mSpan = document.createElement("span");
		this.mDiv.appendChild(this.mSpan);
		this.mDiv.className = "meter";
		this.mDiv.style.width = "45px";
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
}
function computeTimeoutReqMs() {
	if (window.parent.navi.isEthernetMode) {
		return 1000;
	} else {
		return 500;
	}
}
function createLedBox(id) {
	var tdNode = document.createElement("td");
	var led = document.createElement("img");
	led.id = id;
	led.src = "i/bullet_grey.png";
	led.className = "centered";
	led.align = "center";
	tdNode.appendChild(led);
	return tdNode;
}
function ledSetColor(id, color) {
	try {
		var led = document.getElementById(id);
		if (color == "red") {
			led.src = "i/bullet_red.png";
		} else if (color == "green") {
			led.src = "i/bullet_green.png";
		} else if (color == "yellow") {
			led.src = "i/bulletyellow.png";
		} else if (color == "grey") {
			led.src = "i/bullet_grey.png";
		} else {
			led.src = "i/bullet_grey.png";
		}
	} catch (err) {}
}
function createMetCell(id, s) {
	var tdNode = document.createElement("td");
	tdNode.id = "met_"+id;
	var met = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
	met.attachTo(tdNode);
	met.valueSet(s.min);
	return tdNode;
}
function setTextCell(id, val){
	try {
		var el = document.getElementById("txt_"+id);
		el.innerHTML = val;
	} catch(e) {}
}
function createTextCell(id) {
	var tdNode = document.createElement("td");
	tdNode.id = "txt_"+id;
	tdNode.style.minWidth = "43px";
	tdNode.style.textAlign = "center";
	tdNode.className = "tabval";
	return tdNode;
}