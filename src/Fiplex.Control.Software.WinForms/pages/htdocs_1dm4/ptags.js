<!--
var tags;
var frames;

function onloadInit() {
	tags = new Array();
	serials = new Array();
	frames = new Array();
	loadSernr(false);
}
function reloadData() {
	loadSernr(false);
}
function loadSernr(resetmem) {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					if (serverResponse.length==0) {
						if (typeof(timerId) !== "undefined" && timerId)
							clearTimeout(timerId);
						timerId = setTimeout(function() { loadSernr(resetmem); }, 1000);
						return;
					}
					window.top.fiplexSerialStr = serverResponse;
					localStorage.setItem("serial_1dm4"+window.location.host,serverResponse);
					try {
						window.top.redundedFiberRemotes = getRedundedFiberRemotes(false);
						window.top.redundedFiberRemotesIndex = getRedundedFiberRemotes(true);
						parse_serials(serverResponse);
					} catch(err) {}
					tagsReq(resetmem);
				} else {
					if (typeof(timerId) !== "undefined" && timerId)
						clearTimeout(timerId);
					timerId = setTimeout(function() { loadSernr(resetmem); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { loadSernr(resetmem); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { loadSernr(resetmem); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", (resetmem ? "/r_sernr":"/update_sernr")+".shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) {
		showResultIcon(ERR_NONE);}
}
function tagsReq(resetmem) {
	showResultIcon(ERR_PENDING);
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					setTimeout(function() { load_tags(resetmem); }, 1000);
				} else {
					if (typeof(timerId) !== "undefined" && timerId)
						clearTimeout(timerId);
					timerId = setTimeout(function() { tagsReq(resetmem); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { tagsReq(resetmem); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { tagsReq(resetmem); }, 2000);
		}
		xhr.open("POST", "/tags.zhtml", true);
		xhr.timeout = 10000;
		xhr.send("tags_req="+(resetmem?2:1));
		xhr = null;
	} catch (err) {}
}
function load_tags(resetmem) {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4 && this.status === 200) {
				if (this.responseText.length == 0) {
					if (typeof(timerId) !== "undefined" && timerId)
						clearTimeout(timerId);
					timerId = setTimeout(function() { load_tags(resetmem); }, 1000);
					return;
				}
				window.top.fiplexTagsStr = this.responseText;
				localStorage.setItem("tags_1dm4"+window.location.host, window.top.fiplexTagsStr);
				try {
					parse_tags(window.top.fiplexTagsStr);
					createForm(window.top.fiplexTagsStr);
					tagsRender();
					serialsRender();
				} catch(err) {};
				initFormChangeCheck();
				showResultIcon(ERR_NONE);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { load_tags(resetmem); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { load_tags(resetmem); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", (resetmem ? "/r_tags":"/update_tags")+".shtml?co="+Date.now(), true);
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
function parse_serials(serverResponse){
	var serialstrs = serverResponse.split("\t");
	var n;
	var remotestr;
	//master
	if (typeof(serialstrs[0]) !== "undefined")	
		serials[0] = serialstrs[0].substr(-15,15);
	//expansores
	for (n=1; n<=window.top.expansorNr; ++n)
	{
		if (typeof(serialstrs[n]) !== "undefined")		
			serials[n] = serialstrs[n].substr(-15,15);
	}
	//remotos
	for (n=1; n<=window.top.remotesNr; ++n)
	{
		var k = getRemoteIndex(n, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
		
		if (!isNaN(n) && !(n < 0 || n > (window.top.MaxRemotesNr+window.top.MaxExpansorNr)))
		{
			if (typeof(serialstrs[n+window.top.expansorNr]) !== "undefined"){
				remotestr = serialstrs[n+window.top.expansorNr];
				remotestr = remotestr.substr(4,remotestr.length-4);
				serials[k+window.top.MaxExpansorNr] = remotestr;
			}
		}
	}
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
		if (typeof(tagstrs[n]) !== "undefined")
			tags[n] =  (tagstrs[n].substr(-TAGLEN,TAGLEN));
	}
	//remotos
	for (n=1; n<=window.top.remotesNr; ++n)
	{
		var k = getRemoteIndex(n, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
		
		if (!isNaN(n) && !(n < 0 || n > (window.top.MaxRemotesNr+window.top.MaxExpansorNr)))
		{
			if (typeof(tagstrs[n+window.top.expansorNr]) !== "undefined")
				tags[k+window.top.MaxExpansorNr] = (tagstrs[n+window.top.expansorNr].substr(-TAGLEN,TAGLEN));
		}
	}
}
function serialRender(n) {
	if (n < 0 || n > (window.top.remotesNr+window.top.expansorNr))
		return;

	if (n<=window.top.expansorNr)
		setSerial(n,serials[n]);
	else
	{
		var k = getRemoteIndex(n-window.top.expansorNr, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
		setSerial(n,serials[k+window.top.MaxExpansorNr]);
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
		setTag(n, tags[k+window.top.MaxExpansorNr])
	}
}
function serialsRender(){
	for (var n = 0; n <= (window.top.remotesNr+window.top.expansorNr); ++n) {
		serialRender(n);
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
function setSerial(nr, name) {
	try {
		var sertext = document.getElementById("serName"+nr);
		if (name.length<=15)
			sertext.value = name.trim();
		else if (name.substr(15,name.length-15).trim().length==0)
			sertext.value = name.trim();
		else{
			var pairtext = document.getElementById("pair"+nr);
			var pairtitle = document.getElementById("pairtitle");
			pairtitle.style.display = 'block';
			pairtext.style.display = 'block';
			sertext.value = name.substr(0,15).trim();
			pairtext.value = name.substr(15,name.length-15).trim();
		}
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
	var row = document.createElement("tr");
	rootNode.appendChild(row);
	var header = document.createElement("th");
	row.appendChild(header);	
	header = document.createElement("th");
	header.innerHTML = "TAGS";
	row.appendChild(header);
	header = document.createElement("th");
	header.innerHTML = "SERIAL&nbsp;NUMBER";
	row.appendChild(header);
	header = document.createElement("th");
	header.id = "pairtitle";
	header.innerHTML = "REDUNDED&nbsp;WITH";
	header.style.display = 'none';
	row.appendChild(header);	
	for (var i = 0; i <= (window.top.currentRemotesNr+window.top.expansorNr); ++i) {
		addNextEntry(rootNode, i);
	}
	row = document.createElement("tr");
	rootNode.appendChild(row);
	var cell = document.createElement("td");
	cell.colSpan = 4;
	row.appendChild(cell);	
	cell.style.textAlign = "center";
	var btn = document.createElement("input");
	cell.appendChild(btn);
	btn.id = "resetidentify";
	btn.name = btn.id;
	btn.type = "button";
	btn.value = "Identify Devices";
	btn.style.textAlign = "center";
	btn.className = "resetbutton";
	btn.onclick = function() { 
		if (confirm("Information about TAGs and serial numbers\nwill be lost for unconnected remotes.\n"+
		"Are you sure?")) loadSernr(true) }; 

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
			header.innerHTML = "REMOTE "+window.top.redundedFiberRemotesIndex[nr-window.top.expansorNr];
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
	var cell = document.createElement("td");
	row.appendChild(cell);
	serial = document.createElement("input");
	cell.appendChild(serial);
	serial.id = "serName"+nr;
	serial.name = serial.id;
	serial.type = "text";
	serial.className = "tag";
	serial.size = "18";
	serial.maxLength = "15";
	serial.style.backgroundColor = "#c0c0c0";	
	serial.disabled = true;
	cell = document.createElement("td");
	row.appendChild(cell);
	pair = document.createElement("input");
	cell.appendChild(pair);
	pair.id = "pair"+nr;
	pair.name = pair.id;
	pair.type = "text";
	pair.className = "tag";
	pair.size = "18";
	pair.maxLength = "15";	
	pair.disabled = true;
	pair.style.display = 'none';
	pair.style.backgroundColor = "#c0c0c0";
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
	tagsReq(false);
}
function getRedundedFiberRemotes(isIndex){
	var statstr = localStorage.getItem("stat_1dm4"+window.location.host);
	var ne = getExpansorsNrFromStatus(statstr);
	var nr = getRemotesNrFromStatus(statstr);
	var n,idx,i,sercomp,icomp;
	var serialstrs = (window.top.fiplexSerialStr).split("\t");
	var serials = new Array();
	var redundedFiberRemotes = new Array();
	for (n=1;n<=nr;n++)
		serials[n]=serialstrs[n+ne].substr(4,serialstrs[n+ne].length-4);
	for (n=1;n<=nr;n++)
	{
		idx = getRemoteIndex(n, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
		if (serials[n].trim().length==0)
			redundedFiberRemotes[n]=(isIndex)?idx:n;
		else{
			sercomp = serials[n];
			icomp=0;
			for (i=1;i<=nr;i++){ 
				if (i!=n){
					if (serials[i]==sercomp) icomp = i;
				}
			}
			if (icomp>0){
				if (isIndex){
					icomp = getRemoteIndex(icomp, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
					redundedFiberRemotes[n]=(icomp<idx)?icomp+"-"+idx:idx+"-"+icomp;
				}
				else
					redundedFiberRemotes[n]=(icomp<n)?icomp+"-"+n:n+"-"+icomp;
			}
			else
				redundedFiberRemotes[n]=(isIndex)?idx:n;
		}		
	}
	return redundedFiberRemotes;
}
function getExpansorsNrFromStatus(serverResponse){
	if (isFpgaAlarm(serverResponse))
		return -1;
	var statstrs = serverResponse.split("\t");
	return parseInt(statstrs[statstrs.length-1].substr(0,2),16);
}
function isFpgaAlarm(serverResponse) {
	var statstrs = serverResponse.split("\t");
	var bitmask = parseInt(statstrs[0].substr(6,2),16);
	return (bitmask & 0x02) != 0;
}
function getRemotesNrFromStatus(serverResponse) {
	var statstrs = serverResponse.split("\t");
	var nr;
	var mask;
	var i;
	
	if (isFpgaAlarm(serverResponse))
		return -1;
	mask = parseInt(statstrs[statstrs.length-1].substr(2,6),16);
	nr=0;
	for (i=0;i<window.top.MaxRemotesNr;i++)
	{
		if ((mask & 0x01)!=0) nr++;
		mask = mask>>1;
	}
	return nr;
}
// -->