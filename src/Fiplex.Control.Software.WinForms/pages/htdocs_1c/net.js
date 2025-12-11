<!--
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
	if (!firstLoad && 
	    window.top.fiplexTagsStr.length == tags.TAGLEN*2 &&
	    window.top.fiplexFactStr.length == factory.factmap.NR &&
	    window.top.fiplexConfStr.length == config.addrMap.NR) {
		tags.parse(window.top.fiplexTagsStr);
		factory.parse(window.top.fiplexFactStr);
		config.parse(window.top.fiplexConfStr);
		renderConf(true, true);
		load_status();
	} else {
		factReq();
	}
	setTimeout(function() {statusWatchdog();}, 15000);
}
function reloadData(){
	factReq();
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
				config.parse(window.top.fiplexConfStr);
				renderConf(false, true);
				setChannelsDisplayEn();
				firstLoad = window.top.firstLoad = false;
				setTimeout(function() { load_status(); }, 1500);
			}
		}
		xhr.onerror = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { showResultIcon(ERR_NONE); }, 1500);
		}
		xhr.ontimeout = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { showResultIcon(ERR_NONE); }, 1500);
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
		setTimeout(function() { statusWatchdog(); }, 15000);
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

function submitform() {
	if (!checkChange())
		return;
	var frm = config.format(window.top.fiplexConfStr);
	doSubmit(frm);
}

var countConf;

function doSubmit(confFrm) {
	try {
		if ((typeof window.top.submitLocked == "undefined") || !window.top.submitLocked) {
			window.top.submitLocked = true;
			clicksDisable(true);
		} else if (window.top.submitLocked) {
			return;
		}
		clearTimeout(tmrIdStat);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					countConf = 0;
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
		xhr.open("POST", "/start.zhtml", true);
		xhr.timeout = 5000;
		xhrOnStart();
		xhr.send("ctl_conf_str="+confFrm);
		xhr = null;
	} catch (err) {
		showResultIcon(ERR_FAIL);
		setTimeout(function() { xhrOnEnd(ERR_FAIL); }, 1500);
	}
}

(function() {
	onunload = function() {
		window.top.submitLocked = false;
		clicksDisable(false);
		cursorClear();
		showResultIcon(ERR_NONE);
	};
})();

function xhrOnStart() {
	window.top.submitLocked = true;
	clicksDisable(true);
	cursorWait();
}

function xhrOnEnd(error) {
	window.top.submitLocked = false;
	clicksDisable(false);
	cursorClear();
	showResultIcon(ERR_NONE);
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
						if (++countConf < 25) {
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
// -->