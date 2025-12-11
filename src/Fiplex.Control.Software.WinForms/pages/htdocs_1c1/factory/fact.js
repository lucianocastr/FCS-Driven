<!--
var factory;
var monitor;
var isPass;
var tmrIdFact;
var countCheck;

function onloadInit() {
	isPass = (loadPageVar("showPass") == "true");
	factory = (isPass ? new FactoryPass() : new Factory());
	monitor = new Monitor();
	factory.createForm();
	guiBlocked(false);
	reloadData();
}
function reloadData() {
	if (!isPass) {
		showResultIcon(ERR_PENDING);
		guiBlocked(true);
		factReq();	
	}
}
function FactoryPass() {
	this.createForm = function() {
		var Texts = TextEn;
		var row, cell, el;
		var cont = document.getElementById("page");
		var mainTab = document.createElement("table");
		cont.appendChild(mainTab);
		var mainTb = document.createElement("tbody");
		mainTab.appendChild(mainTb);
		row = document.createElement("tr");
		mainTb.appendChild(row);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.colSpan = 2;
		cell.innerHTML = "FACTORY PASSWORD CHANGE";
		var c = [
			{h: "CURRENT&nbsp;PASSWORD", n: "fpass_curr"},
			{h: "NEW&nbsp;PASSWORD", n: "fpass_new"},
			{h: "CONFIRM&nbsp;PASSWORD", n: "fpass_confirm"}
			];
		for (var i = 0; i < 3; ++i) {
			row = document.createElement("tr");
			mainTb.appendChild(row);
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = c[i].h;
			cell = document.createElement("td");
			row.appendChild(cell);
			el = document.createElement("input");
			el.type = "password";
			el.name = c[i].n;
			cell.appendChild(el);
		}
	}
}
function factReq() {
	try {
		if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
			clearTimeout(tmrIdFact);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					setTimeout(function() { load_fact(); }, 1000);
				} else {
					if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
						clearTimeout(tmrIdFact);
					tmrIdFact = setTimeout(function() { factReq(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
				clearTimeout(tmrIdFact);
			tmrIdFact = setTimeout(function() { factReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
				clearTimeout(tmrIdFact);
			tmrIdFact = setTimeout(function() { factReq(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("POST", "/factory/fact.zhtml", true);
		xhr.timeout = 25000;
		xhr.send("fact_req="+1);
		xhr = null;
	} catch (err) {}
}
function load_fact() {
	if (isPass)
		return;
	try {
		if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
			clearTimeout(tmrIdFact);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					localStorage.setItem("factory_1c", serverResponse);
					factory.parse(serverResponse);
					factory.render();
					factStr = serverResponse;
					initFormChangeCheck();
					guiBlocked(false);
					load_status();
				} else {
					tmrIdFact = setTimeout(function() { load_fact(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
				clearTimeout(tmrIdFact);
			tmrIdFact = setTimeout(function() { load_fact(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
				clearTimeout(tmrIdFact);
			tmrIdFact = setTimeout(function() { load_fact(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("GET", "/update_fact.shtml?co="+Date.now(), true);
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
	if (!isPass) {
		clearTimeout(tmrIdFact);
		showResultIcon(ERR_PENDING);
		xhrOnStart();
		var frm = factory.format(factStr);
		factStr = frm;
		document.getElementById("factory_str").value = frm;
		doSubmit(frm);
	} else {
		var form = document.getElementById("factory_form");
		form.submit();
	}
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
		xhr.open("POST", "/factory/fact.zhtml", true);
		xhr.timeout = 5000;
		xhr.send("factory_str="+frm);
		xhr = null;
	} catch (err) {
		showResultIcon(ERR_FAIL);
		setTimeout(function() { xhrOnEnd(ERR_FAIL); }, 1500);
	}
}

(function() {
	onunload = function() {
		guiBlocked(false);
		clearTimeout(tmrIdFact);
	};
})();

function xhrOnStart() {
	guiBlocked(true);
}

function xhrOnEnd(error) {
	factReq();
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
						if (++countCheck < 35) {
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
function load_status() {
	try {
		if (typeof(tmrIdFact) !== "undefined" && tmrIdFact) {
			clearTimeout(tmrIdFact);
		}
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					monitor.parse(serverResponse);
					var el = document.getElementById("hpaULcurrent");
					el.innerHTML = (monitor.stat.band[0].hpa.temperature).toFixed(0)+"&nbsp;mA";
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
				clearTimeout(tmrIdFact);
			tmrIdFact = setTimeout(function() { load_status(); }, 1000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
				clearTimeout(tmrIdFact);
			tmrIdFact = setTimeout(function() { load_status(); }, 1000);
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
// -->