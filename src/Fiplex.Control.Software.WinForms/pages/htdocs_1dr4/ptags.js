<!--
function onloadInit() {
	tagsReq();
}
function reloadData() {
	tagsReq();
}
function tagsReq() {
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
		xhr.send("tags_req="+1);
		xhr = null;
	} catch (err) {}
}
function load_tags() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					renderTags(this.responseText);
				} else {
					if (typeof(timerId) !== "undefined" && timerId)
						clearTimeout(timerId);
					timerId = setTimeout(function() { load_tags(); }, 2000);
				}
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
function renderTags(serverResponse) {
	var len = serverResponse.length;
	var sr = serverResponse;
	var remotesNr = window.top.remotesNr;
	var remotesBitmask = window.top.remotesBitmask;
	var MaxRemotesNr = window.top.MaxRemotesNr;
	var TAGLEN = window.top.TAGLEN;
	var LOCLEN = window.top.LOCLEN;
	var mask = 1;
	var nr = 0;
	var rootNode = document.getElementById("rootNode");
	remove_children(rootNode);
	var tag = "";
	var loc = "";
	if (len >= 2*(TAGLEN+LOCLEN)) sr = sr.substr(0, 2*(TAGLEN+LOCLEN));
	tag = tag_read(sr);
	loc = loc_read(sr);
	addNextEntry(rootNode, 0, tag.trim(), loc.trim());
}
function tag_read(hextag) {
	var tag = '';
	var pos = 0;
	var len = hextag.length;
	if (len>2*window.top.TAGLEN) len=2*window.top.TAGLEN;
	for (var i = 0; i < len; i += 2) {
		var hexnum = hextag.substr(i, 2);
		var num = parseInt(hexnum, 16);
		if (isNaN(num))
			continue;
		tag += String.fromCharCode(num);
	}
	return tag;
}
function loc_read(hexloc) {
	var loc = '';
	var pos = 0;
	var len = hexloc.length;
	if (len>2*(window.top.TAGLEN+window.top.LOCLEN)) len=2*(window.top.TAGLEN+window.top.LOCLEN);
	for (var i = 2*window.top.TAGLEN; i < len; i += 2) {
		var hexnum = hexloc.substr(i, 2);
		var num = parseInt(hexnum, 16);
		if (isNaN(num))
			continue;
		loc += String.fromCharCode(num);
	}
	return loc;
}
function addNextEntry(parent, nr, nametag, nameloc) {
	var MaxRemotesNr = window.top.MaxRemotesNr;
	if (nr < 0 || nr >MaxRemotesNr)
		return;
	var row = document.createElement("tr");
	parent.appendChild(row);
	row.id = "remote"+nr;
	var header = document.createElement("th");
	row.appendChild(header);
	header.style.width = "100px";
	header.style.textAlign = "left";
	header.innerHTML = "TAG";
	var cell = document.createElement("td");
	row.appendChild(cell);
	var tag = document.createElement("input");
	cell.appendChild(tag);
	tag.id = "tag_"+nr;
	tag.type = "text";
	tag.className = "tag";
	tag.size = "18";
	tag.maxLength = "15";
	tag.value = nametag;
	var row = document.createElement("tr");
	parent.appendChild(row);	
	var header = document.createElement("th");
	row.appendChild(header);
	header.style.width = "100px";
	header.style.textAlign = "left";
	header.innerHTML = "LOCATION";
	var cell = document.createElement("td");
	row.appendChild(cell);
	var tag = document.createElement("input");
	cell.appendChild(tag);
	tag.id = "loc_"+nr;
	tag.type = "text";
	tag.className = "tag";
	tag.size = "18";
	tag.maxLength = "15";
	tag.value = nameloc;	
}
function submitform(x) {
	var tagstr = '';
	var MaxRemotesNr = window.top.MaxRemotesNr;
	var TAGLEN = window.top.TAGLEN;
	var LOCLEN = window.top.LOCLEN;
	for (var i = 0; i <= 0; ++i) {
		if (!document.getElementById("tag_"+i))
			continue;
		if (!document.getElementById("loc_"+i))
			continue;		
		var tag = document.getElementById("tag_"+i).value;
		var loc = document.getElementById("loc_"+i).value;
		tag = tag.trim();
		loc = loc.trim();
		for (var j = 0; j < TAGLEN; ++j)
			tag += ' ';
		for (var j = 0; j < LOCLEN; ++j)
			loc += ' ';		
		tag = tag.slice(0, TAGLEN);
		loc = loc.slice(0, LOCLEN);
		for (var j = 0; j < TAGLEN; ++j) {
			var num = tag.charCodeAt(j);
			if (isNaN(num))
				continue;
			var hexnum = '00' + num.toString(16);
			tagstr += hexnum.slice(-2);
		}
		for (var j = 0; j < LOCLEN; ++j) {
			var num = loc.charCodeAt(j);
			if (isNaN(num))
				continue;
			var hexnum = '00' + num.toString(16);
			tagstr += hexnum.slice(-2);
		}		
	}
	document.getElementById("ctl_tags_str").value = tagstr;
	document.getElementById("tags_form").submit();
}
// -->