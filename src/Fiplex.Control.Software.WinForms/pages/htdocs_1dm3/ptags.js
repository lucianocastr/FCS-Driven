<!--
var tags;
var frames;

function onloadInit() {
	tags = new Array();
	frames = new Array();
	tagsReq();
}
function reloadData() {
	tagsReq();
}
function tagsReq() {
	//showResultIcon(ERR_NONE);
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
			if (this.readyState==4 && this.status === 200) {
				window.top.fiplexTagsStr = this.responseText;
				localStorage.setItem("tags_1dm3", window.top.fiplexTagsStr);
				showResultIcon(ERR_NONE);
				parse_tags(window.top.fiplexTagsStr);
				createForm(window.top.fiplexTagsStr);
				tagsRender();
				initFormChangeCheck();
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
	tagstrs = tagstrs.split("\t");
	var n;
	//master
	if (typeof(tagstrs[0]) !== "undefined")
		tags[0] = (tagstrs[0].substr(-TAGLEN,TAGLEN));
	//expansores
	for (n=1; n<=window.top.expansorNr; ++n)
	{
		//if (parseInt(tagstrs[n].substr(2,2),16)==n)
		if (typeof(tagstrs[n]) !== "undefined")
			tags[n] =  (tagstrs[n].substr(-TAGLEN,TAGLEN));
	}
	//remotos
	for (n=1; n<=window.top.remotesNr; ++n)
	{
		var k = getRemoteIndex(n, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
		
		if (!isNaN(n) && !(n < 0 || n > (window.top.MaxRemotesNr+window.top.MaxExpansorNr)))
		{
			//if (parseInt(tagstrs[n+window.top.expansorNr].substr(0,2),16)==k)
			if (typeof(tagstrs[n+window.top.expansorNr]) !== "undefined")
				tags[k+window.top.MaxExpansorNr] = (tagstrs[n+window.top.expansorNr].substr(-TAGLEN,TAGLEN));
		}
	}
}
function tagRender(n) {
	if (n < 0 || n > (window.top.remotesNr+window.top.expansorNr))
		return;

	if (n<=window.top.expansorNr)
		setTag(n,tags[n]);
	else
	{
		var k = getRemoteIndex(n-window.top.expansorNr, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
		setTag(n, tags[k+window.top.MaxExpansorNr]);
	}

}

function tagsRender() {
	for (var n = 0; n <= (window.top.remotesNr+window.top.expansorNr); ++n) {
		tagRender(n);
	}
}
function setTag(nr, name) {
	try {
		var tag = document.getElementById("tagName"+nr);
		tag.value = name.trim();
	} catch (err) {}
}
function getRemotesNrFromServerResponse(sr) {
	var nr;
	var mask;
	var i;
	mask = parseInt(sr.substr(6,6),16);
	nr=0;
	for (i=0;i<maxRemotesNr;i++)
	{
		if ((mask & 0x01)!=0) nr++;
		mask = mask>>1;
	}
	return nr;
}
function getExpansorsNrFromServerResponse(sr){
	var nr = parseInt(sr.substr(4,2),16);
	if (nr > window.top.MaxExpansorNr)
		return -1;	
	return nr;
}
function getRemoteIndex(nr, remotesNr, maxRemotesNr, remotesMask) {
	var index = 0;
	var mask = 1;
	var i;
	for (i = 0; i < nr && i < maxRemotesNr; ++i) {
		while ((mask & remotesMask) == 0) {
			mask <<= 1;
			if (++index >= maxRemotesNr)
				break;
		}
		if (index >= maxRemotesNr)
			break;
		mask <<= 1;
		index++;
	}
	if (index > maxRemotesNr || i != nr)
		index = nr;
	return index
}
function createForm(sr) {
	var rootNode = document.getElementById("rootNode");
	remove_children(rootNode);
	for (var i = 0; i <= (window.top.currentRemotesNr+window.top.expansorNr); ++i) {
		addNextEntry(rootNode, i);
	}
}
function addNextEntry(parent, nr) {
	var MaxRemotesNr = window.top.MaxRemotesNr+window.top.expansorNr;
	if (nr < 0 || nr >MaxRemotesNr)
		return;
	var row = document.createElement("tr");
	parent.appendChild(row);
	row.id = "remote"+nr;
	var header = document.createElement("th");
	row.appendChild(header);
	header.style.width = "100px";
	header.style.textAlign = "left";
	
	if (nr == 0)
		header.innerHTML = "MASTER";
	else
	{
		if (nr<=window.top.expansorNr)
		{
			header.innerHTML = "EXPANSION "+nr;				
		}
		else
		{
			var n = getRemoteIndex(nr-window.top.expansorNr, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
			header.innerHTML = "REMOTE "+n;
		}
	}
	var cell = document.createElement("td");
	row.appendChild(cell);
	var tag = document.createElement("input");
	cell.appendChild(tag);
	tag.id = "tagName"+nr;
	tag.name = tag.id;
	tag.type = "text";
	tag.className = "tag";
	tag.size = "33";
	tag.maxLength = "30";
}
function format() {
	frames.length = 0;
	var MaxRemotesNr = window.top.MaxRemotesNr;
	var tagstrs = tag_read(window.top.fiplexTagsStr);
	var tagstrs = tagstrs.split("\t");
	var TAGLEN = window.top.TAGLEN;
	for (var i = 0; i <= MaxRemotesNr+window.top.MaxExpansorNr; ++i) {
		if (!document.getElementById("tagName"+i))
			continue;
		if (document.getElementById("tagName"+i).value.length==0)
			continue;
		if (i<=window.top.expansorNr)
		{	
			var tagstr = "00"+hexformat(i,2);
			var tag = document.getElementById("tagName"+i).value;
		}
		else
		{
			var tagstr = hexformat(getRemoteIndex(i-window.top.expansorNr, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask), 2)+"01";
			var tag = document.getElementById("tagName"+i).value;
		}
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
		if (typeof(tagstrs[i]) !== "undefined") {
			if (tagstrs[i].toUpperCase()!=tagstr.toUpperCase())
				frames.push(tagstr);
		}
	}
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
		format();
		waitingACK = true;
		submitframe()
	} catch (err) {
		showResultIcon(ERR_FAIL);
		setTimeout(function() { xhrOnEnd(); }, 1500);
	}
}
function submitframe() {
	if (frames.length <= 0)
		return;
	var frm = frames[0];
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
				if (error == ERR_OK && frames.length > 1) {
					frames.splice(0, 1);
					submitframe();
				} else {
					showResultIcon(error);
					setTimeout(function() { xhrOnEnd(); }, 1500);
					waitingACK = false;
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
		Date.now = Date.now || function() { return +new Date; };
		xhr.open("GET", "/result.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function xhrOnStart() {
	window.top.submitLocked = true;
	cursorWait();
}
function xhrOnEnd() {
	window.top.submitLocked = false;
	cursorClear();
	//showResultIcon(ERR_NONE);
	tagsReq();
}

// -->