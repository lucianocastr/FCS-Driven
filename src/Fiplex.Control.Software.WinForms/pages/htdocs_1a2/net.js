var isRendered;
var firstLoad;
var timerId;
function onloadInit() {
	firstLoad = window.top.firstLoad;
	Texts = TextEn;
	isRendered = false;
	monitor = new Monitor(window.top.MaxChNr);
	tags = new Tags(window.top.MaxChNr, window.top.TAGLEN);
	config = new Config(window.top.MaxChNr);
	factory = new Factory();
	modsys = new Modsys();
	guiBlocked(false);
	if (!firstLoad && 
	    window.top.fiplexTagsStr.length == tags.TAGLEN*2 &&
	    window.top.fiplexMsysStr.length == modsys.FRAMELEN &&
	    window.top.fiplexFactStr.length == factory.factmap.NR &&
	    window.top.fiplexConfStr.length == config.addrMap.NR) {
		window.top.fiplexTagsStr = localStorage.getItem("tags_1a2"+window.location.host);
		window.top.fiplexFactStr = localStorage.getItem("factory_1a2"+window.location.host);
		window.top.fiplexConfStr = localStorage.getItem("config_1a2"+window.location.host);
		window.top.fiplexMsysStr = localStorage.getItem("modsys_1a2"+window.location.host);
		modsys.read(window.top.fiplexMsysStr);
		tags.parse(window.top.fiplexTagsStr);
		factory.parse(window.top.fiplexFactStr);
		config.parse(window.top.fiplexConfStr);
		renderConf(true, true);
		load_status();
	} else {
		showResultIcon(ERR_PENDING);
		modsysReq();
	}
	setTimeout(function() {statusWatchdog();}, 15000);
}
function reloadData(){
	showResultIcon(ERR_PENDING);
	modsysReq();
}
function modsysReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status === 200) {
				timerId = setTimeout(function() { loadModsys(); }, 1000);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { modsysReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { modsysReq(); }, 2000);
		}
		xhr.open("POST", "/start.zhtml", true);
		xhr.timeout = 25000;
		xhr.send("modsys_req="+1);
		xhr = null;
	} catch (err) {}
}
function loadModsys() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				window.top.fiplexMsysStr = this.responseText;
				localStorage.setItem("modsys_1a2"+window.location.host, window.top.fiplexMsysStr);
				modsys.read(window.top.fiplexMsysStr);
				factReq();
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { loadModsys(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { loadModsys(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("GET", "/update_msys.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function factReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
					timerId = setTimeout(function() { load_fact(); }, 1000);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { factReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { factReq(); }, 2000);
		}
		xhr.open("POST", "/start.zhtml", true);
		xhr.timeout = 10000;
		xhr.send("fact_req="+1);
		xhr = null;
	} catch (err) {}
}

function load_fact() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				window.top.fiplexFactStr = this.responseText;
				localStorage.setItem("factory_1a2"+window.location.host, window.top.fiplexFactStr);
				factory.parse(window.top.fiplexFactStr);
				tagsReq();
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { load_fact(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { load_fact(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("GET", "/update_fact.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}

function tagsReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				timerId = setTimeout(function() { load_tags(); }, 1000);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { tagsReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { tagsReq(); }, 2000);
		}
		xhr.open("POST", "/start.zhtml", true);
		xhr.timeout = 10000;
		xhr.send("tags_req="+1);
		xhr = null;
	} catch (err) {}
}

function load_tags() {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				window.top.fiplexTagsStr = this.responseText;
				localStorage.setItem("tags_1a2"+window.location.host, window.top.fiplexTagsStr);
				tags.parse(window.top.fiplexTagsStr);
				confReq();
			}
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update_tags.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) { }
}

function confReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status === 200) {
				timerId = setTimeout(function() { load_conf(); }, 1000);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { confReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { confReq(); }, 2000);
		}
		xhr.open("POST", "/start.zhtml", true);
		xhr.timeout = 10000;
		xhr.send("conf_req="+1);
		xhr = null;
	} catch (err) {}
}

function load_conf() {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4 && this.status == 200) {
				window.top.fiplexConfStr = this.responseText;
				localStorage.setItem("config_1a2"+window.location.host, window.top.fiplexConfStr);
				config.parse(window.top.fiplexConfStr);
				guiBlocked(false);
				renderConf(false, true);
				firstLoad = window.top.firstLoad = false;
				setChannelsDisplayEn();
				setTimeout(function() { load_status(); }, 1500);
			}
		}
		xhr.onerror = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { guiBlocked(false); }, 1500);
		}
		xhr.ontimeout = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() {guiBlocked(false); }, 1500);
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update_conf.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function renderConf(renderAgain, channelsEnabledOnly) {
	if (typeof window.top.showChannelsBitmask == "undefined") {
		window.top.showChannelsBitmask = config.getChannelsEnabledMask();
		renderAgain = true;
	}
	if (channelsEnabledOnly) {
		var mask = config.getChannelsEnabledMask();
		if (window.top.showChannelsBitmask != mask) {
			window.top.showChannelsBitmask = mask;
			renderAgain = true;
		}
	}
	var nsystems = modsys.enabledSystemsNr();
	var el = document.getElementById("modsys1") || 0;
	if (el && (el.options.length != nsystems) || !el && (nsystems > 1))
		renderAgain = true;
	if (renderAgain || !isRendered) {
		removeAllElements();
		renderPage();
		isRendered = true;
	}
	config.render();
	tags.render();
	initFormChangeCheck();
}

var tmrIdStat;
var oldStatusTimerId = 0;
function statusWatchdog() {
	if (typeof(tmrIdStat) !== "undefined" && tmrIdStat != null) {
		if (oldStatusTimerId == tmrIdStat) {
			tmrIdStat = setTimeout(function() {load_status();}, 1000);
		} else {
			oldStatusTimerId = tmrIdStat;
		}
		setTimeout(function() { statusWatchdog(); }, 65000);
	}
}

function load_status() {
	try {
		if (typeof(tmrIdStat) !== "undefined" && tmrIdStat) {
			clearTimeout(tmrIdStat);
		}
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					monitor.parse(this.responseText);
					monitor.render();
				}
				tmrIdStat = setTimeout(function() { load_status(); }, 1000);
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

function submitform(isReset) {
	var doReset = false;
	if (typeof(isReset) !== "undefined")
		doReset = isReset || 0;
	if (!checkChange() && !doReset)
		return;
	if (typeof window.top.submitLocked === "undefined")
		window.top.submitLocked = false;
	if (window.top.submitLocked) {
		setTimeout(function() { guiBlocked(false); }, 15000);
		return;
	}
	clearTimeout(tmrIdStat);
	showResultIcon(ERR_PENDING);
	xhrOnStart();
	var frm = config.format(window.top.fiplexConfStr);
	if (doReset)
		frm = "07"+frm.substr(2);
	doSubmit(frm);
}

var countConf;

function doSubmit(confFrm) {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					countConf = 0;
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
		xhr.open("POST", "/start.zhtml", true);
		xhr.timeout = 5000;
		xhr.send("ctl_conf_str="+confFrm);
		xhr = null;
	} catch (err) {
		showResultIcon(ERR_FAIL);
		setTimeout(function() { xhrOnEnd(); }, 1500);
	}
}

(function() {
	onunload = function() {
		guiBlocked(false);
		clearTimeout(tmrIdStat);
	};
})();
function xhrOnStart() {
	guiBlocked(true);
}
function xhrOnEnd() {
	load_conf();
}
function check_result() {
	if (typeof countConf === "undefined")
		countConf = 0;
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				var error;
				if (this.status === 200) {
					error = parseInt(this.responseText);
					if (error != ERR_OK && error != ERR_FAIL) {
						if (++countConf < 60) {
							setTimeout(function() { check_result(); }, 1000);
							return;
						} else {
							error = ERR_FAIL;
						}
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
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}

function clicksDisable(isDisable) {
	try {
		resetDisableStateSet(isDisable);
		for (var i = 0; i < 2; ++i) {
			hpaSwDisableStateSet(i, isDisable);
		}
	} catch (err) {}
}
