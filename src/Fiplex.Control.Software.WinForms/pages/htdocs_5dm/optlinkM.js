var nr,mode,twofibers;
var mon;
function optOnLoadFunc() {
	var q = param();
	nr=1;
	if (q['nr']){
		nr = entify(q['nr']);
	}
	if (nr<1) nr=1;
	if (nr>nrOfRemotes) nr = nrOfRemotes;
	var hdr = document.getElementById("header");
	hdr.innerHTML = "REMOTE LINK "+nr+" OPTICAL INFO";
	mode = 0;
	mon = new MonitorGlobal();
	mon.parse(localStorage.getItem("Status"+Prjstr+window.location.host));
	twofibers = mon.monitorUnit[nr].FOmoduleConnected[0] && mon.monitorUnit[nr].FOmoduleConnected[1];
	renderOpticalTable();
	optLoadStatus();
}
function renderOpticalTable(){
	var i;
	var imax = 2;
	var rootNode = document.getElementById("tableleds");
	var row = document.createElement("tr");
	rootNode.appendChild(row);
	var hdr = document.createElement("th");
	row.appendChild(hdr);
	hdr = createHeaderId("colM1","MASTER");
	row.appendChild(hdr);
	hdr = createHeaderId("colR1","REMOTE");
	if (twofibers) hdr.colSpan = 2;
	row.appendChild(hdr);
	var row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	row.appendChild(hdr);
	hdr = document.createElement("th");
	row.appendChild(hdr);
	hdr = document.createElement("th");
	hdr.innerHTML = "PORT1";
	hdr.className = "thd";
	hdr.id = "ledsPortHeader_1";
	row.appendChild(hdr);
	hdr = document.createElement("th");
	hdr.innerHTML = "PORT2";
	hdr.className = "thd";
	hdr.id = "ledsPortHeader_2";
	row.appendChild(hdr);
	if (mode==0){
		row = document.createElement("tr");
		row.id = "ActiveLinkRow";
		rootNode.appendChild(row);			
		hdr = document.createElement("th");
		hdr.innerHTML = "Active&nbsp;Link";
		hdr.className = "thdrht";		
		row.appendChild(hdr);
		hdr = document.createElement("th");	
		row.appendChild(hdr);
		for (i=1;i<=imax;i++){
			tdNode = createLedBox("optActLnk_"+i);
			row.appendChild(tdNode);
		}
	}
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	hdr.innerHTML = "Loss&nbsp;of&nbsp;Optical&nbsp;Signal";
	hdr.className = "thdrht";
	row.appendChild(hdr);
	for (i=0;i<=imax;i++){
		tdNode = createLedBox("optLossSignal_"+i);
		row.appendChild(tdNode);
	}
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	hdr.innerHTML = "Loss&nbsp;of&nbsp;Communications";
	hdr.className = "thdrht";
	row.appendChild(hdr);
	for (i=0;i<=imax;i++){
		tdNode = createLedBox("optLossComm_"+i);
		row.appendChild(tdNode);
	}
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	hdr.innerHTML = 'FO&nbsp;Transc.&nbsp;Status';
	hdr.className = "thdrht";
	row.appendChild(hdr);
	for (i=0;i<=imax;i++){
		tdNode = createLedBox("foStatus_"+i);
		row.appendChild(tdNode);
	}
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	hdr.innerHTML = "Sync&nbsp;to&nbsp;Master";
	hdr.className = "thdrht";
	row.appendChild(hdr);
	for (i=0;i<=imax;i++){
		tdNode = createLedBox("optFrSync_"+i);
		row.appendChild(tdNode);
	}
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	hdr.innerHTML = "Data&nbsp;Lock";
	hdr.className = "thdrht";
	row.appendChild(hdr);
	for (i=0;i<=imax;i++){
		tdNode = createLedBox("dataLock_"+i);
		row.appendChild(tdNode);
	}
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	hdr.innerHTML = "Data&nbsp;Sync";
	hdr.className = "thdrht";
	row.appendChild(hdr);
	for (i=0;i<=imax;i++){
		tdNode = createLedBox("dataSync_"+i);
		row.appendChild(tdNode);
	}
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	hdr.innerHTML = "FO&nbsp;Tx&nbsp;Fault";
	hdr.className = "thdrht";
	row.appendChild(hdr);
	for (i=0;i<=imax;i++){
		tdNode = createLedBox("txFault_"+i);
		row.appendChild(tdNode);
	}
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	hdr.innerHTML = "GTP&nbsp;PLL&nbsp;Lock";
	hdr.className = "thdrht";
	row.appendChild(hdr);
	for (i=0;i<=imax;i++){
		tdNode = createLedBox("gtpPllLock_"+i);
		row.appendChild(tdNode);
	}
	rootNode = document.getElementById("tablemeas");
	row = document.createElement("tr");
	rootNode.appendChild(row);
	var hdr = document.createElement("th");
	row.appendChild(hdr);
	hdr = createHeaderId("colM2","MASTER");
	row.appendChild(hdr);
	hdr = createHeaderId("colR2","REMOTE");
	if (twofibers) hdr.colSpan = 2;
	row.appendChild(hdr);
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	row.appendChild(hdr);
	hdr = document.createElement("th");
	row.appendChild(hdr);
	hdr = document.createElement("th");
	hdr.innerHTML = "PORT1";
	hdr.className = "thd";		
	hdr.id = "measurementsPortHeader_1";
	row.appendChild(hdr);
	hdr = document.createElement("th");
	hdr.innerHTML = "PORT2";
	hdr.className = "thd";
	hdr.id = "measurementsPortHeader_2";
	row.appendChild(hdr);
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	row.appendChild(hdr);
	hdr.innerHTML = "Error&nbsp;Count";
	hdr.className = "thdrht";
	for (i=0;i<=imax;i++){
		tdNode = createTextBox("errors_"+i);
		row.appendChild(tdNode);
	}
	
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	row.appendChild(hdr);
	hdr.innerHTML = "Supply&nbsp;Voltage(V)";
	hdr.className = "thdrht";
	for (i=0;i<=imax;i++){
		tdNode = createTextBox("voltage_"+i);
		row.appendChild(tdNode);
	}
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	row.appendChild(hdr);
	hdr.innerHTML = "Bias&nbsp;Current(mA)";
	hdr.className = "thdrht";
	for (i=0;i<=imax;i++){
		tdNode = createTextBox("bias_"+i);
		row.appendChild(tdNode);
	}
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	row.appendChild(hdr);
	hdr.innerHTML = "Temperature(&deg;C)";
	hdr.className = "thdrht";
	for (i=0;i<=imax;i++){
		tdNode = createTextBox("temperat_"+i);
		row.appendChild(tdNode);
	}
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	row.appendChild(hdr);
	hdr.innerHTML = "Tx&nbsp;Power(dBm)";
	hdr.className = "thdrht";
	for (i=0;i<=imax;i++){
		tdNode = createTextBox("txpower_"+i);
		row.appendChild(tdNode);
	}	
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = document.createElement("th");
	row.appendChild(hdr);
	hdr.innerHTML = "Rx&nbsp;Power(dBm)";
	hdr.className = "thdrht";
	for (i=0;i<=imax;i++){
		tdNode = createTextBox("rxPowTxt_"+i);
		row.appendChild(tdNode);
	}		
	
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
	var serverResponse = localStorage.getItem("Status"+Prjstr+window.location.host);
	mon.parse(serverResponse);
	twofibers = mon.monitorUnit[nr].FOmoduleConnected[0] && mon.monitorUnit[nr].FOmoduleConnected[1];
	hideShowOpticalPorts();
	showMonitor();
	tmrIdOptStat = setTimeout(function() { optLoadStatus(); }, 2000);
}
function hideShowOpticalPorts() {
	// port headers
	var displayValue = twofibers ? "table-cell":"none";
	document.getElementById("colR1").colSpan = twofibers?2:1;
	document.getElementById("colR2").colSpan = twofibers?2:1;
	for (var port = 0; port < 2; port++) {
		var i = (port+1);
		document.getElementById("ledsPortHeader_"+i).style.display = displayValue;
		document.getElementById("measurementsPortHeader_"+i).style.display = displayValue;
	}
	// active link
	document.getElementById("ActiveLinkRow").style.display = twofibers ? "table-row":"none";
	// leds
	var idsLeds = ["optActLnk", "optLossSignal", "optLossComm",
		 "foStatus", "optFrSync", "dataLock", "dataSync", "txFault", "gtpPllLock"];
	var idsMeasurements = ["errors", "voltage", "bias", "temperat", "txpower", "rxPowTxt"];

	for (var port = 0; port < 2; port++) {
		var displayValue = mon.monitorUnit[nr].FOmoduleConnected[port] ? "table-cell":"none";
		var i = (port+1);
		for (var k = 0; k < idsLeds.length; k++) {
			ledSetDisplay(idsLeds[k]+"_"+i, displayValue);
		}
		for (var k = 0; k < idsMeasurements.length; k++) {
			document.getElementById(idsMeasurements[k]+"_"+i).style.display = displayValue;
		}
	}

}

function showMonitor() {
	var bitmask, num, warning, alarm, temp, volt, bias, txpow, rxpow, sfpalarm, gtpalarm;
	if (twofibers && mode==0){
		num = mon.monitorUnit[nr].FOActiveOpticalLink;
		if (num==0) {
			document.getElementById("optActLnk_1").src = "/bullet_green.png";
			document.getElementById("optActLnk_2").src = "/bullet_grey.png";
		}
		else{
			document.getElementById("optActLnk_2").src = "/bullet_green.png";
			document.getElementById("optActLnk_1").src = "/bullet_grey.png";
		}
	}	
	for (var i=0;i<=2;i++)
	{
		var k = i==0?nr-1:i-1;
		var monitor = mon.monitorUnit[i==0?0:nr];
		var colAlarm = "#df4040";
		var colWarning = "#c0c000";
		var colNormal = "#802000";
		
		bitmask = monitor.FOgtpAlarmMask[k];
		document.getElementById("optFrSync_"+i).src = (bitmask & 0x08)? "/bullet_red.png" : "/bullet_green.png";

		num = monitor.FOerrors[k];
		document.getElementById("errors_"+i).innerHTML = num;
		warning = false;
		alarm = false;
		temp = monitor.FOTemperature[k];
		var el = document.getElementById("temperat_"+i);
		el.innerHTML = temp.toFixed(1);
		alarm = computeFoAlarmTemp(temp);
		el.style.color = (alarm==2) ? colAlarm : (alarm==1)?colWarning:colNormal;
		volt = monitor.FOVolt[k];
		el = document.getElementById("voltage_"+i);
		el.innerHTML = volt.toFixed(2);
		alarm = computeFoAlarmVolt(volt);
		el.style.color = (alarm==2) ? colAlarm : (alarm==1)?colWarning:colNormal;
		bias = monitor.FOBias[k];
		el = document.getElementById("bias_"+i);
		el.innerHTML = bias.toFixed(1);
		alarm = computeFoAlarmBias(bias);
		el.style.color = (alarm==2) ? colAlarm : (alarm==1)?colWarning:colNormal;
		txpow = monitor.FOTxPow[k];
		el = document.getElementById("txpower_"+i);
		el.innerHTML = txpow.toFixed(1);
		alarm=computeFoAlarmTxpow(txpow);
		el.style.color = (alarm==2) ? colAlarm : (alarm==1)?colWarning:colNormal;
		rxpow = monitor.FORxPow[k];
		el = document.getElementById("rxPowTxt_"+i);
		el.innerHTML = rxpow.toFixed(1);
		sfpalarm = monitor.FOsfpAlarmMask[k];
		gtpalarm = monitor.FOgtpAlarmMask[k];
		alarm=computeFoAlarmRxpow(rxpow);
		if (gtpalarm & 0x10) {
			document.getElementById("optLossSignal_"+i).src = "/bullet_red.png";
			el.style.color = colAlarm;
		} else {
			document.getElementById("optLossSignal_"+i).src = "/bullet_green.png";
			el.style.color = alarm!=0?colAlarm:colNormal;
		}
		if (gtpalarm & 0x02) {
			document.getElementById("dataLock_"+i).src = "/bullet_red.png";
		} else {
			document.getElementById("dataLock_"+i).src = "/bullet_green.png";
		}
		if (gtpalarm & 0x04) {
			document.getElementById("dataSync_"+i).src = "/bullet_red.png";
		} else {
			document.getElementById("dataSync_"+i).src = "/bullet_green.png";
		}
		if (gtpalarm & 0x0E) {
			document.getElementById("optLossComm_"+i).src = "/bullet_red.png";
		} else {
			document.getElementById("optLossComm_"+i).src = "/bullet_green.png";
		}
		var alarm = computeFoStatAlarm(temp, volt, bias, txpow, rxpow, sfpalarm, gtpalarm);
		document.getElementById("foStatus_"+i).src = (alarm==2)?"/bullet_red.png":(alarm==1)?"/bullet_yellow.png":"/bullet_green.png";

		if (sfpalarm & 0x01) {
			document.getElementById("txFault_"+i).src = "/bullet_red.png";
		} else {
			document.getElementById("txFault_"+i).src = "/bullet_green.png";
		}
		if (gtpalarm & 0x01) {
			document.getElementById("gtpPllLock_"+i).src = "/bullet_red.png";
		} else {
			document.getElementById("gtpPllLock_"+i).src = "/bullet_green.png";
		}
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