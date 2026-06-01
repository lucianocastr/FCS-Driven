var port,twofibers;
var mon;
function optOnLoadFunc() {
	var q = param();
	if (q['p']){
		port = entify(q['p']);
	}
	var hdr = document.getElementById("header");
	hdr.innerHTML = "PORT "+(~~port+1)+" OPTICAL INFO";
	mon = new Monitor();
	mon.parse(localStorage.getItem("Status"+Prjstr+window.location.host));
	renderOpticalTable();
	optLoadStatus();
}
function renderOpticalTable(){
	var rootNode = document.getElementById("tableleds");
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	hdr.innerHTML = "Loss&nbsp;of&nbsp;Optical&nbsp;Signal";
	hdr.className = "thdrht";
	row.appendChild(hdr);
	tdNode = createLedBox("optLossSignal");
	row.appendChild(tdNode);
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	hdr.innerHTML = "Loss&nbsp;of&nbsp;Communications";
	hdr.className = "thdrht";
	row.appendChild(hdr);
	tdNode = createLedBox("optLossComm");
	row.appendChild(tdNode);
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	hdr.innerHTML = 'FO&nbsp;Transc.&nbsp;Status';
	hdr.className = "thdrht";
	row.appendChild(hdr);
	tdNode = createLedBox("foStatus");
	row.appendChild(tdNode);
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	hdr.innerHTML = (port==7)?"Sync&nbsp;to&nbsp;Master":"Remote&nbsp;Freq.&nbsp;Sync";
	hdr.className = "thdrht";
	row.appendChild(hdr);
	tdNode = createLedBox("optFrSync");
	row.appendChild(tdNode);
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	hdr.innerHTML = "Data&nbsp;Lock";
	hdr.className = "thdrht";
	row.appendChild(hdr);
	tdNode = createLedBox("dataLock");
	row.appendChild(tdNode);
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	hdr.innerHTML = "Data&nbsp;Sync";
	hdr.className = "thdrht";
	row.appendChild(hdr);
	tdNode = createLedBox("dataSync");
	row.appendChild(tdNode);
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	hdr.innerHTML = "FO&nbsp;Tx&nbsp;Fault";
	hdr.className = "thdrht";
	row.appendChild(hdr);
	tdNode = createLedBox("txFault");
	row.appendChild(tdNode);
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	hdr.innerHTML = "GTP&nbsp;PLL&nbsp;Lock";
	hdr.className = "thdrht";
	row.appendChild(hdr);
	tdNode = createLedBox("gtpPllLock");
	row.appendChild(tdNode);
	rootNode = document.getElementById("tablemeas");
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	row.appendChild(hdr);
	hdr.innerHTML = "Error&nbsp;Count";
	hdr.className = "thdrht";
	tdNode = createTextBox("errors");
	row.appendChild(tdNode);
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	row.appendChild(hdr);
	hdr.innerHTML = "Supply&nbsp;Voltage(V)";
	hdr.className = "thdrht";
	tdNode = createTextBox("voltage");
	row.appendChild(tdNode);
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	row.appendChild(hdr);
	hdr.innerHTML = "Bias&nbsp;Current(mA)";
	hdr.className = "thdrht";
	tdNode = createTextBox("bias");
	row.appendChild(tdNode);
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	row.appendChild(hdr);
	hdr.innerHTML = "Temperature(&deg;C)";
	hdr.className = "thdrht";
	tdNode = createTextBox("temperat");
	row.appendChild(tdNode);
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	row.appendChild(hdr);
	hdr.innerHTML = "Tx&nbsp;Power(dBm)";
	hdr.className = "thdrht";
	tdNode = createTextBox("txpower");
	row.appendChild(tdNode);
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	row.appendChild(hdr);
	hdr.innerHTML = "Rx&nbsp;Power(dBm)";
	hdr.className = "thdrht";
	tdNode = createTextBox("rxPowTxt");
	row.appendChild(tdNode);
}
function createLedBox(id) {
	var tdNode = document.createElement("td");
	tdNode.id = "ledcell_"+id;
	var led = document.createElement("img");
	led.id = id;
	led.src = "/bullet_grey.png";
	led.className = "centered";
	led.align = "center";
	tdNode.appendChild(led);
	return tdNode;
}
function ledSetDisplay(id, displayVal) {
	try {
		var id = "ledcell_"+id;
		document.getElementById(id).style.display = displayVal;
	} catch(e){}
}
function createTextBox(id) {
	var tdNode = document.createElement("td");
	tdNode.id = id;
	tdNode.className = "tval";
	tdNode.innerHTML ="0";
	return tdNode;
}
function renderMeters() {
	for (var i = 0; i < 2; ++i) {
		var td = document.getElementById("rxPowMet_"+i);
		var s = optRxPow_settings;
		var el = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
		el.attachTo(td);
		el.valueSet(s.min);
	}
}
var tmrIdOptStat;
function optLoadStatus() {
	mon.parse(localStorage.getItem("Status"+Prjstr+window.location.host));
	showMonitor();
	tmrIdOptStat = setTimeout(function() { optLoadStatus(); }, 2000);
}

function showMonitor() {
	var bitmask, num, warning, alarm, temp, volt, bias, txpow, rxpow, sfpalarm, gtpalarm;

	var colAlarm = "#df4040";
	var colWarning = "#c0c000";
	var colNormal = "#802000";
	
	bitmask = mon.FOgtpAlarmMask[port];
	document.getElementById("optFrSync").src = (bitmask & 0x08)? "/bullet_red.png" : "/bullet_green.png";
	num = mon.FOerrors[port];
	document.getElementById("errors").innerHTML = num;
	warning = false;
	alarm = false;
	temp = mon.FOTemperature[port];
	var el = document.getElementById("temperat");
	el.innerHTML = temp.toFixed(1);
	alarm = computeFoAlarmTemp(temp);
	el.style.color = (alarm==2) ? colAlarm : (alarm==1)?colWarning:colNormal;
	volt = mon.FOVolt[port];
	el = document.getElementById("voltage");
	el.innerHTML = volt.toFixed(2);
	alarm = computeFoAlarmVolt(volt);
	el.style.color = (alarm==2) ? colAlarm : (alarm==1)?colWarning:colNormal;
	bias = mon.FOBias[port];
	el = document.getElementById("bias");
	el.innerHTML = bias.toFixed(1);
	alarm = computeFoAlarmBias(bias);
	el.style.color = (alarm==2) ? colAlarm : (alarm==1)?colWarning:colNormal;
	txpow = mon.FOTxPow[port];
	el = document.getElementById("txpower");
	el.innerHTML = txpow.toFixed(1);
	alarm=computeFoAlarmTxpow(txpow);
	el.style.color = (alarm==2) ? colAlarm : (alarm==1)?colWarning:colNormal;
	rxpow = mon.FORxPow[port];
	el = document.getElementById("rxPowTxt");
	el.innerHTML = rxpow.toFixed(1);
	sfpalarm = mon.FOsfpAlarmMask[port];
	gtpalarm = mon.FOgtpAlarmMask[port];
	alarm=computeFoAlarmRxpow(rxpow);
	if (gtpalarm & 0x10) {
		document.getElementById("optLossSignal").src = "/bullet_red.png";
		el.style.color = colAlarm;
	} else {
		document.getElementById("optLossSignal").src = "/bullet_green.png";
		el.style.color = alarm!=0?colAlarm:colNormal;
	}
	if (gtpalarm & 0x02) {
		document.getElementById("dataLock").src = "/bullet_red.png";
	} else {
		document.getElementById("dataLock").src = "/bullet_green.png";
	}
	if (gtpalarm & 0x04) {
		document.getElementById("dataSync").src = "/bullet_red.png";
	} else {
		document.getElementById("dataSync").src = "/bullet_green.png";
	}
	if (gtpalarm & 0x0E) {
		document.getElementById("optLossComm").src = "/bullet_red.png";
	} else {
		document.getElementById("optLossComm").src = "/bullet_green.png";
	}
	var alarm = computeFoStatAlarm(temp, volt, bias, txpow, rxpow, sfpalarm, gtpalarm);
	document.getElementById("foStatus").src = (alarm==2)?"/bullet_red.png":(alarm==1)?"/bullet_yellow.png":"/bullet_green.png";

	if (sfpalarm & 0x01) {
		document.getElementById("txFault").src = "/bullet_red.png";
	} else {
		document.getElementById("txFault").src = "/bullet_green.png";
	}
	if (gtpalarm & 0x01) {
		document.getElementById("gtpPllLock").src = "/bullet_red.png";
	} else {
		document.getElementById("gtpPllLock").src = "/bullet_green.png";
	}
}

var foDataLimitsAlarm = {
	temperature: 	{min: -45,	max: 90	},
	voltage: 	{min: 2.7, 	max: 3.8},
	bias: 		{min: 0, 	max: 130},
	txpow: 		{min: -6, 	max: 8	},
	rxpow: 	{min: -140, 	max: 4.5}
}
var foDataLimitsWarning = {
	temperature: 	{min: -40,	max: 85	},
	voltage: 	{min: 2.8, 	max: 3.7},
	bias: 		{min: 0.1, 	max: 120},
	txpow: 		{min: -5, 	max: 7	},
}

function computeFoStatAlarm(temp, volt, bias, txpow, rxpow, sfpalarm, gtpalarm) {
	var alarm = 0;
	if ((temp < foDataLimitsWarning.temperature.min) 
		|| (temp > foDataLimitsWarning.temperature.max))
	{
		alarm = 1;
	}
	if ((volt < foDataLimitsWarning.voltage.min) 
		|| (volt > foDataLimitsWarning.voltage.max))
	{
		alarm = 1;
	}
	if ((bias < foDataLimitsWarning.bias.min) 
		|| (bias > foDataLimitsWarning.bias.max))
	{
		alarm = 1;
	}
	if ((txpow < foDataLimitsWarning.txpow.min) 
		|| (txpow > foDataLimitsWarning.txpow.max))
	{
		alarm = 1;
	}
	if (gtpalarm & 0x80) {
		alarm = 1;
	}
	if ((temp < foDataLimitsAlarm.temperature.min) 
		|| (temp > foDataLimitsAlarm.temperature.max))
	{
		alarm = 2;
	}
	if ((volt < foDataLimitsAlarm.voltage.min) 
		|| (volt > foDataLimitsAlarm.voltage.max))
	{
		alarm = 2;
	}
	if ((bias < foDataLimitsAlarm.bias.min) 
		|| (bias > foDataLimitsAlarm.bias.max))
	{
		alarm = 2;
	}
	if ((txpow < foDataLimitsAlarm.txpow.min) 
		|| (txpow > foDataLimitsAlarm.txpow.max))
	{
		alarm = 2;
	}
	if (rxpow > foDataLimitsAlarm.rxpow.max) 
	{
		alarm = 2;
	}	
	if (sfpalarm & 0x01) {
		alarm = 2;
	}
	if (gtpalarm & 0x01) {
		alarm = 2;
	}
	if (gtpalarm & 0x40) {
		alarm = 2;
	}
	return alarm;
}

function computeFoAlarmTemp(temp) {
	var alarm = 0;

	if ((temp < foDataLimitsWarning.temperature.min) 
		|| (temp > foDataLimitsWarning.temperature.max))
	{
		alarm = 1;
	}
	if ((temp < foDataLimitsAlarm.temperature.min) 
		|| (temp > foDataLimitsAlarm.temperature.max))
	{
		alarm = 2;
	}	
	return alarm;
}

function computeFoAlarmVolt(volt) {
	var alarm = 0;
	if ((volt < foDataLimitsWarning.voltage.min) 
		|| (volt > foDataLimitsWarning.voltage.max))
	{
		alarm = 1;
	}
	if ((volt < foDataLimitsAlarm.voltage.min) 
		|| (volt > foDataLimitsAlarm.voltage.max))
	{
		alarm = 2;
	}
	return alarm;
}

function computeFoAlarmBias(bias) {
	var alarm = 0;
	if ((bias < foDataLimitsWarning.bias.min) 
		|| (bias > foDataLimitsWarning.bias.max))
	{
		alarm = 1;
	}
	if ((bias < foDataLimitsAlarm.bias.min) 
		|| (bias > foDataLimitsAlarm.bias.max))
	{
		alarm = 2;
	}
	return alarm;
}

function computeFoAlarmTxpow(txpow) {
	var alarm = 0;
	if ((txpow < foDataLimitsWarning.txpow.min) 
		|| (txpow > foDataLimitsWarning.txpow.max))
	{
		alarm = 1;
	}
	if ((txpow < foDataLimitsAlarm.txpow.min) 
		|| (txpow > foDataLimitsAlarm.txpow.max))
	{
		alarm = 2;
	}
	return alarm;
}
function computeFoAlarmRxpow(rxpow) {
	var alarm = 0;
	if (rxpow > foDataLimitsAlarm.rxpow.max)
	{
		alarm = 2;
	}
	return alarm;
}
function createHeaderId(id,val){
	var hdr = document.createElement("th");
	hdr.innerHTML = val;
	hdr.className = "thd";
	hdr.id = id;
	return hdr;
}