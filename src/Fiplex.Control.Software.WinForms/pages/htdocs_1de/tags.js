<!--
function onloadInit() {
	tagsReq();
}
function reloadData() {
	tagsReq();
}
function tagsReq() {
	showResultIcon(ERR_PENDING);
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
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
		xhr.send("tags_req");
		xhr = null;
	} catch (err) {}
}
function load_tags() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4 && this.status === 200) {
				if (this.responseText.length == 0) {
					if (typeof(timerId) !== "undefined" && timerId)
						clearTimeout(timerId);
					timerId = setTimeout(function() { load_tags(); }, 1000);
					return;
				}
				window.top.fiplexTagsStr = this.responseText;
				localStorage.setItem("tags_1de"+window.location.host, window.top.fiplexTagsStr);
				try {
					createForm();
					var tags = parse_tags(window.top.fiplexTagsStr);
					tagsRender(tags);
				} catch(err) {};
				initFormChangeCheck();
				restoreSmState();
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { load_tags(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { load_tags(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update_tags.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) { }
}
function tag_read(hextag) {
	var tag = '';
	var pos = 0;
	for (var i = 0; i < hextag.length; i += 2) {
		var hexnum = hextag.substr(i, 2);
		var num = parseInt(hexnum, 16);
		if (isNaN(num))
			continue;
		tag += String.fromCharCode(num);
	}
	return tag;
}
function parse_tags(serverResponse) {
	var TAGLEN = window.top.TAGLEN;
	var tagstrs = tag_read(serverResponse);
	var tags = tagstrs.substr(-TAGLEN,TAGLEN);
	return tags;
}
function tagsRender(tags) {
	try {
		var tag = document.getElementById("tagName");
		tag.value = tags.trim();
	} catch (err) {}
}
function createForm() {
	var rootNode = document.getElementById("rootNode");
	remove_children(rootNode);
	var row = document.createElement("tr");
	rootNode.appendChild(row);
	var cell = document.createElement("td");
	row.appendChild(cell);
	var tag = document.createElement("input");
	cell.appendChild(tag);
	tag.id = "tagName";
	tag.name = tag.id;
	tag.type = "text";
	tag.className = "tag";
	tag.size = "33";
	tag.maxLength = "30";
}
function format() {
	var tagstrs = tag_read(window.top.fiplexTagsStr);
	var TAGLEN =30;
	if (!document.getElementById("tagName"))
		return null;
	if (document.getElementById("tagName").value.length==0)
		return null;
	var tagstr = "";
	var tag = document.getElementById("tagName").value;
	tag = tag.trim();
	for (var j = 0; j < TAGLEN; ++j)
		tag += ' ';
	tag = tag.slice(0, TAGLEN);
	for (var j = 0; j < TAGLEN; ++j) {
		var num = tag.charCodeAt(j);
		if (isNaN(num))
			continue;
		var hexnum = '00' + num.toString(16);
		tagstr += hexnum.slice(-2);
	}
	return tagstr;
}
function submitform(x) {
	try {
		if (!checkChange()) {
			return;
		}
		if ((typeof window.top.submitLocked !== "undefined") && window.top.submitLocked) {
			return;
		}
		xhrOnStart();
		var f = format();
		if (!f) {
			return;
		}
		waitingACK = true;
		submitframe(f);
	} catch (err) {
		showResultIcon(ERR_FAIL);
		setTimeout(function() { xhrOnEnd(); }, 1500);
	}
}
function submitframe(frm) {
	document.getElementById("ctl_tags_str").value = frm;
	var xhr = xmlreq();
	xhr.onreadystatechange  = function(ev) {
		if (this.readyState == 4 && this.status == 200) {
			countConf = 0;
			setTimeout(function() { check_result(); }, 1000 );
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
	xhr.send("ctl_tags_str="+frm);
	xhr = null;
}
function check_result() {
	if (typeof countConf === "undefined")
		countConf = 0;
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			var error;
			if (this.readyState == 4 && this.status == 200) {
				error = parseInt(this.responseText);
				if (error != ERR_OK && error != ERR_FAIL) {
					if (++countConf < 40) {
						setTimeout(function() { check_result(); }, 1000);
						return;
					} else
						error = ERR_FAIL;
				}
				showResultIcon(error);
				setTimeout(function() { xhrOnEnd(); }, 1500);
				waitingACK = false;
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
function xhrOnStart() {
	window.top.submitLocked = true;
	inputDisable(true);
	cursorWait();
	showResultIcon(ERR_PENDING);
}
function xhrOnEnd() {
	reloadData();
}
function restoreSmState() {
	window.top.submitLocked = false;
	inputDisable(false);
	cursorClear();
	showResultIcon(ERR_NONE);
}
// -->
