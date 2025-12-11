var equ;
var equStr;
var tmrId;
var countCheck;

function onloadInit() {
	equ = new Equ();
	showResultIcon(ERR_NONE);
	equ.createForm();
	equReq();
}
function reloadData(){
	equReq();
}
function equReq() {
	try {
		if (typeof(tmrId) !== "undefined" && tmrId)
			clearTimeout(tmrId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					setTimeout(function() { load_equ(); }, 1000);
				} else {
					if (typeof(tmrId) !== "undefined" && tmrId)
						clearTimeout(tmrId);
					tmrId = setTimeout(function() { equReq(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { equReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { equReq(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("POST", "/factory/equ.zhtml", true);
		xhr.timeout = 25000;
		xhr.send("equ_req="+1);
		xhr = null;
	} catch (err) {}
}
function load_equ() {
	try {
		if (typeof(tmrId) !== "undefined" && tmrId)
			clearTimeout(tmrId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					equ.parse(serverResponse);
					equ.render();
					equStr = serverResponse;
					initFormChangeCheck();
				} else {
					tmrId = setTimeout(function() { load_equ(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_equ(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_equ(); }, 2000);
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
	showResultIcon(ERR_PENDING);
	var frm = equ.format(equStr);
	equStr = frm;
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
					setTimeout(function() { check_result(); }, 100);
				} else {
					showResultIcon(ERR_FAIL);
					setTimeout(function() { xhrOnEnd(ERR_FAIL); }, 1500);
				}
			}
		}
		xhr.onerror = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(ERR_FAIL); }, 1500);
		}
		xhr.ontimeout = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(ERR_FAIL); }, 1500);
		}
		xhr.open("POST", "/factory/equ.zhtml", true);
		xhr.timeout = 5000;
		xhrOnStart();
		xhr.send("equ_str="+frm);
		xhr = null;
	} catch (err) {
		showResultIcon(ERR_FAIL);
		setTimeout(function() { xhrOnEnd(ERR_FAIL); }, 1500);
	}
}

(function() {
	onunload = function() {
		window.top.submitLocked = false;
		cursorClear();
		showResultIcon(ERR_NONE);
	};
})();

function xhrOnStart() {
	window.top.submitLocked = true;
	cursorWait();
}

function xhrOnEnd(error) {
	window.top.submitLocked = false;
	cursorClear();
	showResultIcon(ERR_NONE);
	equReq();
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
				setTimeout(function() { xhrOnEnd(error); }, 1500);
			}
		}
		xhr.onerror = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(ERR_FAIL); }, 1500);
		}
		xhr.ontimeout = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(ERR_FAIL); }, 1500);
		}
		Date.now = Date.now || function() { return +new Date; }; 		
		xhr.open("GET", "/result.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function isComplexEqualizer(sr){
	return (parseInt(sr.substr(74, 2),16)&0x4)!=0;
	
}
function Equ() {
	this.frameStr;
	this.tableLen = 6;
	this.frameLen = this.tableLen * 8;
	// this.isComplex = isComplexEqualizer(window.top.fiplexFactStr);
	this.isComplex = true;
	this.data = [];
	var self = this;
	for (i = 0; i < 2; ++i) {
		this.data.push([]);
		for (k = 0; k < this.tableLen; ++k) {
			this.data[i].push([]);
			for (j = 0; j < (this.isComplex?2:1); ++j){
				this.data[i][k].push(0);
			}
		}
	}
	
	this.parse = function(sr) {
		if (sr.length < this.frameLen)
			return;
		var p = 0;
		for (var i = 0; i<(this.isComplex?2:1); ++i){
			for (var j = 0; j < 2; ++j) {
				for (k = 0; k < this.tableLen; ++k) {
					var num = parseInt(sr.substr(p, 4), 16);
					p += 4;
					if (isNaN(num))
						continue;
					if (num > 32767)
						num -= 65536;
					this.data[j][k][i] = num;
				}
			}
		}
	}
	this.render = function() {
		for (var i = 0; i<(this.isComplex?2:1); ++i){
			for (var j = 0; j < 2; ++j) {
				for (k = 0; k < this.tableLen; ++k) {
					try {
						var el = document.getElementById('coeff'+j.toString()+k.toString()+i.toString());
						el.value = this.data[j][k][i];
					} catch (err) {}
				}
			}
		}
	}
	this.format = function() {
		var frm = "";
		for (var i = 0; i < (this.isComplex?2:1); ++i) {
			for (var j = 0; j < 2; ++j) {
				for (k = 0; k < this.tableLen; ++k) {
					try {
						var el = document.getElementById('coeff'+j.toString()+k.toString()+i.toString());
						var num = parseInt(el.value);
						if (!(isNaN(num) || num < -32768 || num > 32767))
							this.data[j][k][i] = num;
					} catch (err) {}
					var num = this.data[j][k][i];
					if (num < 0)
						num +=65536;
					frm += hexformat(num, 4);
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
		var row = document.createElement("tr");
		mainTb.appendChild(row);
		var cell = document.createElement("th");
		cell.colSpan = this.isComplex?8:4;
		cell.innerHTML = "EQUALIZER&nbsp;COEFFICIENTS";
		cell.style.color = "black";
		row.appendChild(cell);
		row = document.createElement("tr");
		mainTb.appendChild(row);
		for (var i = 0; i < 2; ++i) {
			cell = document.createElement("th");
			cell.colSpan = this.isComplex?2:1;
			cell.style.color = "black";
			cell.innerHTML = (i == 0 ? "RX UL" : "TX DL");
			row.appendChild(cell);
		}
		if (this.isComplex){
			row = document.createElement("tr");
			mainTb.appendChild(row);			
			for (var i = 0; i < 4; ++i) {
				cell = document.createElement("th");
				cell.style.color = "black";
				cell.innerHTML = ((i % 2) == 0 ? "Real" : "Imag");
				row.appendChild(cell);
			}		
		}
		for (var i = 0; i < this.tableLen; ++i) {
			row = document.createElement("tr");
			mainTb.appendChild(row);
			for (var j = 0; j < 2; ++j) {
				for (var k = 0; k < (this.isComplex?2:1); ++k) {
					cell = document.createElement("td");
					row.appendChild(cell);
					el = document.createElement("input");
					el.type = "text";
					el.size = 10;
					el.className = "number";					
					el.id = 'coeff'+j.toString()+i.toString()+k.toString();
					el.name = el.id;
					el.onkeypress = function(ev) {
						ev = ev || window.event;
						return isKeyDecimalNumber(ev);
					}
					cell.appendChild(el);
				}
			}
		}
		row = document.createElement("tr");
		mainTb.appendChild(row);
		for (var j = 0; j < 2; ++j) {
			cell = document.createElement("th");
			cell.colSpan = this.isComplex ? 2 : 1;
			row.appendChild(cell);
			var el = document.createElement("input");
			el.type = "button";
			el.value = "Reset Coefficients";
			el.chain = j;
			el.onclick = function(ev) {
				if (this.chain == null || this.chain == "undefined") {
					return;
				}
				j = this.chain;
				for (var i = 0; i < self.tableLen; ++i) {
					for (var k = 0; k < (self.isComplex?2:1); ++k) {
						var id = 'coeff'+j.toString()+i.toString()+k.toString();
						var d = document.getElementById(id);
						try {
							d.value = (i == 0 && k == 0 ? 32767 : 0);
						} catch (err) {}
					}
				}
				submitform();
			}
			cell.appendChild(el);
		}
	}
}
