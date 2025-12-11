var eqAdj;
var equAdjStr;
var tmrId;
var countCheck;
var frameSeparator = "\t\t\t";

function onloadInit() {
	eqAdj = new EquAdj();
	showResultIcon(ERR_NONE);
	eqAdj.createForm();
	equAdjReq(-1);
	cursorWait();
	showResultIcon(ERR_PENDING);
}
function reloadData(){
	var currentFw = ~~(localStorage.getItem("FW"+Prjstr+window.location.host));
	var fwToRead = (document.getElementById("fwSel").selectedIndex + currentFw) % 2;
	equAdjReq(fwToRead);
	cursorWait();
	showResultIcon(ERR_PENDING);
}
function equAdjReq(fw) {
	try {
		if (typeof(tmrId) !== "undefined" && tmrId)
			clearTimeout(tmrId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					setTimeout(function() { load_equ_adj(); }, 1000);
				} else {
					if (typeof(tmrId) !== "undefined" && tmrId)
						clearTimeout(tmrId);
					tmrId = setTimeout(function() { equAdjReq(fw); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { equAdjReq(fw); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { equAdjReq(fw); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("POST", "/factory/eqad.zhtml", true);
		xhr.timeout = 25000;
		var p = "eq_fw=";
		if (fw<0){
			p+="FF";
		}else{
			p+=hexformat(fw,2);
		}
		p += "&equ_req=1";
		xhr.send(p);
		xhr = null;
	} catch (err) {}
}
function load_equ_adj() {
	try {
		if (typeof(tmrId) !== "undefined" && tmrId)
			clearTimeout(tmrId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					if (serverResponse.length<eqLength){
						if (typeof(timerId) !== "undefined" && timerId) clearTimeout(timerId);
						timerId = setTimeout(function() { load_fact(); }, 1000);
					}else{
						var deviceStr = serverResponse.split(frameSeparator);
						eqAdj.parse(deviceStr[0]);
						eqAdj.render();
						equAdjStr = serverResponse;
						initFormChangeCheck();
						window.top.submitLocked = false;
						xhrOnEnd();
					}
				} else {
					tmrId = setTimeout(function() { load_equ_adj(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_equ_adj(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_equ_adj(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("GET", "/update_equ.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function submitform() {
	if (!checkChange())
		return;
	if ((typeof window.top.submitLocked == "undefined") || !window.top.submitLocked) {
		window.top.submitLocked = true;
	} else if (window.top.submitLocked) {
		return;
	}
	var frm = eqAdj.format(equAdjStr);
	equAdjStr = frm;
	var currentFw = ~~(localStorage.getItem("FW"+Prjstr+window.location.host));
	var factToConfigure = (document.getElementById("fwSel").selectedIndex + currentFw) % 2;
	frm = hexformat(factToConfigure,2) + frm;
	document.getElementById("equ_str").value = frm;
	doSubmit(frm);
}
function doSubmit(frm) {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					countCheck = 0;
					setTimeout(function() { check_result(); }, computeTimeoutReqMs());
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
		xhr.open("POST", "/factory/eqad.zhtml", true);
		xhr.timeout = 5000;
		xhrOnStart();
		xhr.send("equ_str="+frm);
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

function check_result() {
	if (typeof countCheck === "undefined")
		countCheck = 0;
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				var error;
				if (this.status === 200) {
					error = parseInt(this.responseText);
					if (error != ERR_OK && error != ERR_FAIL) {
						if (++countCheck < 25) {
							setTimeout(function() { check_result(); }, 1000);
							return;
						} else
							error = ERR_FAIL;
					}
				} else {
					error = ERR_FAIL;
				}
				showResultIcon(error);
				var currentFw = ~~(localStorage.getItem("FW"+Prjstr+window.location.host));
				var factToConfigure = (document.getElementById("fwSel").selectedIndex + currentFw) % 2;
				setTimeout(function() { equAdjReq(factToConfigure); }, 100);
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
		xhr.open("GET", "/result.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}

function EquAdj() {
	this.frameStr;
	this.tableLen = 6;
	this.frameLen = 384;
	this.data = [];
	var self = this;
	this.parse = function(sr) {
		if (sr.length < this.frameLen)
			return;
		this.data = [];
		var p = 0;
		for (var band = 0; band < 2; ++band) {
			this.data.push([]);
			for (var b = 0; b < 2; ++b) {
				this.data[band].push([]);
				for (var j = 0; j < 2; ++j) {
					this.data[band][b].push([]);
					for (var i = 0; i < 2; ++i) {
						this.data[band][b][j].push([]);
						for (var k = 0; k < this.tableLen; ++k) {
							var num = parseInt(sr.substr(p, 4), 16);
							p += 4;
							if (typeof(num) == 'undefined' || isNaN(num))
								num = 0;
							if (num > 32767)
								num -= 65536;
							this.data[band][b][j][i].push(num);
						}
					}
				}
			}
		}
	}
	this.render = function() {
		for (var band = 0; band < 2; ++band) {
			for (var b = 0; b < 2; ++b) {
				for (var j = 0; j < 2; ++j) {
					for (var i = 0; i < 2; ++i){
						for (var k = 0; k < this.tableLen; ++k) {
							try {
								var id = 'coeff_'+band+'_'+b+'_'+j+'_'+i+'_'+k;
								var el = document.getElementById(id);
								el.value = this.data[band][b][j][i][k];
							} catch (err) {}
						}
					}
				}
			}
		}
	}
	this.format = function() {
		var frm = "";
		for (var band = 0; band < 2; ++band) {
			for (var b = 0; b < 2; ++b) {
				for (var j = 0; j < 2; ++j) {
					for (var i = 0; i < 2; ++i) {
						for (k = 0; k < this.tableLen; ++k) {
							try {
								var id = 'coeff_'+band+'_'+b+'_'+j+'_'+i+'_'+k;
								var el = document.getElementById(id);
								var num = parseInt(el.value);
								if (!(isNaN(num) || num < -32768 || num > 32767))
									this.data[band][b][j][i][k] = num;
							} catch (err) {}
							var num = this.data[band][b][j][i][k];
							if (num < 0)
								num +=65536;
							frm += hexformat(num, 4);
						}
					}
				}
			}
		}
		this.frameStr = frm;
		return frm;
	}
	this.createForm = function() {
		var Texts = TextEn;
		var cont = document.getElementById("page");
		var mainTab = document.createElement("table");
		cont.appendChild(mainTab);
		var mainTb = document.createElement("tbody");
		mainTab.appendChild(mainTb);
		mainTb.appendChild(this.createFwSelector());
		mainTb.appendChild(this.createTitleMain());
		for (var band=0;band<2;band++){
			mainTb.appendChild(this.createTitleBand(band));
			mainTb.appendChild(this.createTitleULDL());
			mainTb.appendChild(this.createTitleTr());
			mainTb.appendChild(this.createTitleIm());
			for (var k = 0; k < this.tableLen; ++k) {
				mainTb.appendChild(this.createFormRow(k,band));
			}
			mainTb.appendChild(this.createResetButtons(band));
		}
	}
	this.createFwSelector = function(){
		var row = document.createElement("tr");
		
		var cell = document.createElement("th");
		cell.colSpan = 2;
		cell.innerHTML = "FIRMWARE SELECTION";
		row.appendChild(cell);
		var cell = document.createElement("td");
		cell.colSpan = 2;
		var el = document.createElement("select");
		for (var i = 0; i < 2; ++i) {
			var opt = document.createElement('option');
			el.options.add(opt);
			opt.text = i==0?"ACTIVE":"INACTIVE";
			opt.value = i;
		}
		el.id = el.name = "fwSel";
		el.onchange = function(ev) {
			reloadData();
		}
		cell.appendChild(el);
		row.appendChild(cell);
		return row;
	}
	this.createTitleMain = function() {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		cell.colSpan = 8;
		cell.innerHTML = "EQUALIZER&nbsp;COEFFICIENTS";
		cell.style.fontSize = "large";
		row.appendChild(cell);
		return row;		
	}
	this.createTitleBand = function(band) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		cell.colSpan = 8;
		cell.style.color = "black";
		cell.style.border = "1px solid #db5902";
		cell.innerHTML = "BAND&nbsp;"+band;
		row.appendChild(cell);
		return row;
	}
	this.createTitleULDL = function() {
		var row = document.createElement("tr");
		for (var b = 0; b < 2; ++b) {
			var cell = document.createElement("th");
			cell.colSpan = 4;
			cell.style.color = "black";
			cell.style.border = "1px solid #db5902";
			cell.innerHTML = (b == 0 ? "UPLINK" : "DOWNLINK");
			row.appendChild(cell);
		}
		return row;
	}	
	this.createTitleTr = function() {
		var row = document.createElement("tr");
		for (var b = 0; b < 2; ++b) {
			for (var j = 0; j < 2; ++j) {
				var cell = document.createElement("th");
				cell.colSpan = 2;
				cell.style.color = "black";
				cell.style.border = "1px solid #db5902";
				cell.innerHTML = (j == 0 ? "RX" : "TX");
				row.appendChild(cell);
			}
		}
		return row;
	}
	this.createTitleIm = function() {
		var row = document.createElement("tr");
		for (var b = 0; b < 2; ++b) {
			for (var j = 0; j < 2; ++j) {
				for (var i = 0; i < 2; ++i) {
					var cell = document.createElement("th");
					cell.style.color = "black";
					cell.style.border = "1px solid #db5902";
					cell.innerHTML = (i == 0 ? "Real" : "Imag.");
					row.appendChild(cell);
				}
			}
		}
		return row;
	}
	this.createFormRow = function(k,band) {
		var row = document.createElement("tr");
		for (var b = 0; b < 2; ++b) {
			for (var j = 0; j < 2; ++j) {
				for (var i = 0; i < 2; ++i) {
					var el = document.createElement("input");
					el.type = "text";
					el.size = 10;
					el.className = "number";
					el.id = 'coeff_'+band+'_'+b+'_'+j+'_'+i+'_'+k;
					el.name = el.id;
					el.onkeypress = function(ev) {
						ev = ev || window.event;
						return isKeyDecimalNumber(ev);
					}
					var cell = document.createElement("td");
					cell.appendChild(el);
					row.appendChild(cell);
				}
			}
		}
		return row;
	}
	this.createResetButtons = function(band) {
		var row = document.createElement("tr");
		for (var b = 0; b < 2; ++b) {
			var el = document.createElement("input");
			el.type = "button";
			el.value = "Reset Coefficients";
			el.chain = b;
			el.band = band;
			el.onclick = function(ev) {
				if (this.chain == null || this.chain == "undefined") {
					return;
				}
				if (this.band == null || this.band == "undefined") {
					return;
				}				
				var b = this.chain;
				var band = this.band;
				for (var j = 0; j < 2; ++j) {
					for (var i = 0; i < 2; ++i) {
						for (var k = 0; k < self.tableLen; ++k) {
							var id = 'coeff_'+band+'_'+b+'_'+j+'_'+i+'_'+k;
							var el = document.getElementById(id);
							try {
								el.value = (i == 0 && k == 0 ? 32767 : 0);
							} catch (err) {}
						}
					}
				}
				submitform();
			}
			var cell = document.createElement("th");
			cell.colSpan = 4;
			cell.style.border = "1px solid #db5902";
			cell.appendChild(el);
			row.appendChild(cell);
		}
		return row;
	}
}

function computeTimeoutReqMs() {
	if (window.parent.navi.isEthernetMode) {
		return 4000;
	} else {
		return 100;
	}
}
