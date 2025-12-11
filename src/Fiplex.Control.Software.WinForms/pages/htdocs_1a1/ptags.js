<!--
var TAGLEN = window.top.TAGLEN; 
var maxChNr = window.top.MaxChNr;
var tags;
var timerId;
var countCheck;
function onloadInit() {
	tags = new Tags(maxChNr, TAGLEN);
	createForm();
	guiBlocked(false);
	reloadData();
}
function reloadData(){
	showResultIcon(ERR_PENDING);
	guiBlocked(true);
	tagsReq();
}
function tagsReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4) {
				if (this.status === 200) {
					setTimeout(function() { load_tags(); }, 1000);
				} else {
					if (typeof(timerId) !== "undefined" && timerId)
						clearTimeout(timerId);
					timerId = setTimeout(function() { tagsReq(); }, 2000);
				}
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
		xhr.open("POST", "/tags.zhtml", true);
		xhr.timeout = 10000;
		xhr.send("tags_req="+1);
		xhr = null;
	} catch (err) {}
}
function load_tags() {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				var serverResponse = this.responseText;
				localStorage.setItem("tags_1a1", serverResponse);
				tags.parse(serverResponse);
				tags.render();
				ctl_tags_str = serverResponse;
				initFormChangeCheck();
				guiBlocked(false);
			}
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update_tags.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) { }
}
function createForm() {
	var rootNode = document.getElementById("rootNode");
	remove_children(rootNode);
	var row = document.createElement("tr");
	rootNode.appendChild(row);
	row.id = "remote";
	var header = document.createElement("th");
	row.appendChild(header);
	header.style.width = "100px";
	header.style.textAlign = "left";
	header.innerHTML = "LOCATION&nbsp;TAG";
	var cell = document.createElement("td");
	row.appendChild(cell);
	var tag = document.createElement("input");
	tag.type = "text";
	cell.appendChild(tag);
	tag.id = "tagEntry";
	tag.name = tag.id;
	tag.className = "tag";
	tag.size = "33";
	tag.maxLength = "30";
	tag.onkeypress = function(ev) {
		ev = ev || window.event;
		if (ev.keyCode == 13)
			return false;
	}
}
function setTag(name) {
	try {
		var tag = document.getElementById("tagEntry");
		tag.value = name.trim();
	} catch(err) { }
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
	var str = document.getElementById("tagEntry").value;
	var tagstr = tags.format(str);
	document.getElementById("ctl_tags_str").value = tagstr;
	doSubmit(tagstr);
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
		xhr.open("POST", "/tags.zhtml", true);
		xhr.timeout = 5000;
		xhrOnStart();
		xhr.send("ctl_tags_str="+frm);
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
	tagsReq();
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

// -->