<!--
var equ;
var equStr;
var factory;
var tmrId;
var countCheck;

function onloadInit() {
	factory = new Factory();
	equ = new Equ();
	equ.createForm();
	guiBlocked(false);
	reloadData();
}
function reloadData(){
	showResultIcon(ERR_PENDING);
	guiBlocked(true);
	factReq();
}
function factReq() {
	try {
		if (typeof(tmrId) !== "undefined" && tmrId)
			clearTimeout(tmrId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					setTimeout(function() { load_fact(); }, 1000);
				} else {
					if (typeof(tmrId) !== "undefined" && tmrId)
						clearTimeout(tmrId);
					tmrId = setTimeout(function() { factReq(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { factReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { factReq(); }, 2000);
		}
		xhr.open("POST", "/factory/equ.zhtml", true);
		xhr.timeout = 10000;
		xhr.send("fact_req="+1);
		xhr = null;
	} catch (err) {}
}
function load_fact() {
	try {
		if (typeof(tmrId) !== "undefined" && tmrId)
			clearTimeout(tmrId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					factory.parse(serverResponse);
					equReq();
				} else {
					tmrId = setTimeout(function() { load_fact(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_fact(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_fact(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("GET", "/update_fact.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
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
					guiBlocked(false);
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
	if (typeof window.top.submitLocked === "undefined")
		window.top.submitLocked = false;
	if (window.top.submitLocked) {
		setTimeout(function() { guiBlocked(false); }, 15000);
		return;
	}
	showResultIcon(ERR_PENDING);
	xhrOnStart();
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
		xhr.open("POST", "/factory/equ.zhtml", true);
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
		guiBlocked(false);
	};
})();

function xhrOnStart() {
	guiBlocked(true);
}
function xhrOnEnd() {
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
				setTimeout(function() { xhrOnEnd(); }, 1500);
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
function Equ() {
	this.frameStr;
	this.tableLen = 6;
	this.frameLen = this.tableLen * 16;
	this.data = [];
	var self = this;
	for (i = 0; i < 2; ++i) {
		this.data.push([]);
		for (j = 0; j < 2; ++j) {
			this.data[i].push([]);
			for (k = 0; k < this.tableLen; ++k) {
				this.data[i][j].push(0);
			}
		}
	}
	this.parse = function(sr) {
		if (sr.length < this.frameLen)
			return;
		var p = 0;
		for (var i = 0; i < 2; ++i) {
			for (var j = 0; j < 2; ++j) {
				for (k = 0; k < this.tableLen; ++k) {
					var num = parseInt(sr.substr(p, 4), 16);
					p += 4;
					if (isNaN(num))
						continue;
					this.data[i][j][k] = to_float(num);
				}
			}
		}
	}
	this.render = function() {
		for (var j = 0; j < 2; ++j) {
			var fs = factory.data.band[j].fStart;
			var fp = factory.data.band[j].fStop;
			for (var i = 0; i < this.tableLen; ++i) {
				var fr = fs + i*(fp - fs)/(this.tableLen - 1);
				fr /= 1.0e6;
				try {
					var el = document.getElementById("frq"+j+i);
					el.innerHTML = fr.toFixed(6);
				} catch (err) {}
			}
		}
		for (var i = 0; i < 2; ++i) {
			for (var j = 0; j < 2; ++j) {
				for (k = 0; k < this.tableLen; ++k) {
					try {
						var el = document.getElementById('coeff'+j.toString()+i.toString()+k.toString());
						el.value = (this.data[i][j][k]).toFixed(1);
					} catch (err) {}
				}
			}
		}
	}
	this.format = function() {
		var frm = "";
		for (var i = 0; i < 2; ++i) {
			for (var j = 0; j < 2; ++j) {
				for (k = 0; k < this.tableLen; ++k) {
					try {
						var el = document.getElementById('coeff'+j.toString()+i.toString()+k.toString());
						var num = parseFloat(el.value);
						if (!isNaN(num))
							this.data[i][j][k] = num;
					} catch (err) {}
					frm += hexformat(double_to_uint(this.data[i][j][k]), 4);
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
		mainTab.style.borderSpacing = "15px 5px";
		cont.appendChild(mainTab);
		var mainTb = document.createElement("tbody");
		mainTab.appendChild(mainTb);
		var row = document.createElement("tr");
		mainTb.appendChild(row);
		var cell = document.createElement("th");
		cell.colSpan = 6;
		cell.innerHTML = "EQUALIZER&nbsp;COEFFICIENTS";
		cell.style.color = "black";
		cell.style.fontSize = "15px";
		row.appendChild(cell);
		row = document.createElement("tr");
		mainTb.appendChild(row);
		for (var i = 0; i < 2; ++i) {
			cell = document.createElement("th");
			cell.colSpan = 3;
			cell.style.color = "black";
			cell.innerHTML = (i == 0 ? Texts['UPLINK'] : Texts['DNLINK']);
			row.appendChild(cell);
			cell.style.borderStyle = "double";
		}
		row = document.createElement("tr");
		mainTb.appendChild(row);
		for (var j = 0; j < 2; ++j) {
			for (var i = 0; i < 3; ++i) {
				cell = document.createElement("th");
				cell.innerHTML = (i == 0 ? "Frequency (MHz)" : (i == 1 ? "Rx" : "Tx"));
				cell.style.fontSize = "12px";
				row.appendChild(cell);
			}
		}
		for (var i = 0; i < this.tableLen; ++i) {
			row = document.createElement("tr");
			mainTb.appendChild(row);
			for (var j = 0; j < 2; ++j) {
				cell = document.createElement("td");
				cell.id = "frq"+j+i;
				cell.style.textAlign = "right";
				row.appendChild(cell);
				for (var k = 0; k < 2; ++k) {
					cell = document.createElement("td");
					row.appendChild(cell);
					var el = document.createElement("input");
					el.type = "text";
					el.size = 10;
					el.className = "number";					
					el.id = 'coeff'+j.toString()+k.toString()+i.toString();
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
			cell.colSpan = 3;
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
					for (var k = 0; k < 2; ++k) {
						var id = 'coeff'+j.toString()+k.toString()+i.toString();
						var d = document.getElementById(id);
						try {
							d.value = 0;
						} catch (err) {}
					}
				}
				submitform();
			}
			cell.appendChild(el);
		}
	}
}
// -->