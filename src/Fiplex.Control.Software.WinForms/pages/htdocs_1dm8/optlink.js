<!--
var linkNr, remotesNr, MaxRemotesNr, remotesMask,ne,fmask,fibermask,mmask,mode,twofibers,isRedunded,numlink,links;
var remoteindex = new Array();
function optOnLoadFunc() {
	var q = param();
	if (q['linkNr'])
		linkNr = entify(q['linkNr']);
	if (q['remotesNr'])
		remotesNr = entify(q['remotesNr']);
	if (q['MaxRemotesNr'])
		MaxRemotesNr = entify(q['MaxRemotesNr']);
	if (q['remotesMask'])
		remotesMask = entify(q['remotesMask']);
	if (q['ne'])
		ne = entify(q['ne']);
	var hdr = document.getElementById("header");
	links = linkNr.split("-");
	isRedunded = (links.length==1)?false:true;
	numlink = links[0];
	remoteindex[0] = getRemoteIndex(links[0], remotesNr, MaxRemotesNr, remotesMask);
	var title = remoteindex[0];
	if (isRedunded){
		remoteindex[1] = getRemoteIndex(links[1], remotesNr, MaxRemotesNr, remotesMask);
		title += "-"+remoteindex[1];
		if (getRxLoss(remoteindex[0])) numlink = links[1];
	}
	fmask = localStorage.getItem("fibermask_"+prjname+window.location.host);
	fibermask = fmask.split(",");
	mmask = localStorage.getItem("mode_"+prjname+window.location.host);
	mode = mmask.split(",");
	twofibers = (fibermask[numlink]==3) && (ne==0);	
	renderOpticalTable(numlink,ne);
	if (ne==0)
	{
		var nexp = Math.floor((remoteindex[0]-1)/6);
		hdr.innerHTML = "REMOTE&nbsp;LINK "+title;
		document.getElementById("colM1").innerHTML = (nexp==0) ? "MASTER" : "EXPAN."+(nexp);
		document.getElementById("colM2").innerHTML = (nexp==0) ? "MASTER" : "EXPAN."+(nexp);	
	}
	else
	{
		hdr.innerHTML = "EXPANSION&nbsp;LINK "+ne;
		document.getElementById("colR1").innerHTML = "EXPAN."+ne;
		document.getElementById("colR2").innerHTML = "EXPAN."+ne;
		document.getElementById("colM1").innerHTML = (ne==1) ? "MASTER" : "EXPAN."+(ne-1);
		document.getElementById("colM2").innerHTML = (ne==1) ? "MASTER" : "EXPAN."+(ne-1);
	}
	//renderMeters();
	optLoadStatus();
}

var tmrIdOptStat;
function renderOpticalTable(nlink,ne){
	var rootNode = document.getElementById("tableleds");
	var row = document.createElement("tr");
	rootNode.appendChild(row);	
	var hdr = document.createElement("th");
	row.appendChild(hdr);
	hdr = createHeaderId("colR1","REMOTE");
	if (twofibers) hdr.colSpan = 2;
	row.appendChild(hdr);	
	hdr = createHeaderId("colM1","MASTER");
	if (isRedunded) hdr.colSpan = 2;
	row.appendChild(hdr);
	if (twofibers){
		row = document.createElement("tr");
		rootNode.appendChild(row);
		hdr = document.createElement("th");
		row.appendChild(hdr);
		hdr = createHeader("PORT1");
		row.appendChild(hdr);		
		hdr = createHeader("PORT2");
		row.appendChild(hdr);
		if (isRedunded){
			hdr = createHeader("PORT"+remoteindex[0]);
			row.appendChild(hdr);
			hdr = createHeader("PORT"+remoteindex[1]);
			row.appendChild(hdr);			
		}
		if (mode[nlink]==0){
			row = document.createElement("tr");
			rootNode.appendChild(row);
			hdr = createHeader("Active&nbsp;Link","rht");
			row.appendChild(hdr);
			tdNode = createLedBox("optActLnk_1");
			row.appendChild(tdNode);
			tdNode = createLedBox("optActLnk_2");
			row.appendChild(tdNode);			
		}
	}
	//Loss of optical signal
	row = document.createElement("tr");
	rootNode.appendChild(row);	
	hdr = createHeader("Loss&nbsp;of&nbsp;Optical&nbsp;Signal","rht");
	row.appendChild(hdr);
	tdNode = createLedBox("optLossSignal_1");
	row.appendChild(tdNode);
	if (twofibers){
		tdNode = createLedBox("optLossSignal_2");
		row.appendChild(tdNode);	
	}	
	tdNode = createLedBox("optLossSignal_0");
	row.appendChild(tdNode);
	if (isRedunded){
		tdNode = createLedBox("optLossSignal_3");
		row.appendChild(tdNode);
	}
	//Loss of communication
	row = document.createElement("tr");
	rootNode.appendChild(row);	
	hdr = createHeader("Loss&nbsp;of&nbsp;Communications","rht");
	row.appendChild(hdr);
	tdNode = createLedBox("optLossComm_1");
	row.appendChild(tdNode);
	if (twofibers){
		tdNode = createLedBox("optLossComm_2");
		row.appendChild(tdNode);	
	}	
	tdNode = createLedBox("optLossComm_0");
	row.appendChild(tdNode);
	if (isRedunded){
		tdNode = createLedBox("optLossComm_3");
		row.appendChild(tdNode);
	}	
	//FO Transc. Status
	row = document.createElement("tr");
	rootNode.appendChild(row);	
	hdr = createHeader("FO&nbsp;Transc.&nbsp;Status","rht");
	row.appendChild(hdr);
	tdNode = createLedBox("foStatus_1");
	row.appendChild(tdNode);
	if (twofibers){
		tdNode = createLedBox("foStatus_2");
		row.appendChild(tdNode);	
	}	
	tdNode = createLedBox("foStatus_0");
	row.appendChild(tdNode);
	if (isRedunded){
		tdNode = createLedBox("foStatus_3");
		row.appendChild(tdNode);
	}
	//Sync to master
	row = document.createElement("tr");
	rootNode.appendChild(row);	
	hdr = createHeader("Sync&nbsp;to&nbsp;Master","rht");
	row.appendChild(hdr);
	tdNode = createLedBox("optFrSync_1");
	row.appendChild(tdNode);
	if (twofibers){
		tdNode = createLedBox("optFrSync_2");
		row.appendChild(tdNode);	
	}	
	//Data Lock
	row = document.createElement("tr");
	rootNode.appendChild(row);	
	hdr = createHeader("Data&nbsp;Lock","rht");
	row.appendChild(hdr);
	tdNode = createLedBox("dataLock_1");
	row.appendChild(tdNode);
	if (twofibers){
		tdNode = createLedBox("dataLock_2");
		row.appendChild(tdNode);	
	}	
	tdNode = createLedBox("dataLock_0");
	row.appendChild(tdNode);
	if (isRedunded){
		tdNode = createLedBox("dataLock_3");
		row.appendChild(tdNode);
	}
	//Data Sync
	row = document.createElement("tr");
	rootNode.appendChild(row);	
	hdr = createHeader("Data&nbsp;Sync","rht");
	row.appendChild(hdr);
	tdNode = createLedBox("dataSync_1");
	row.appendChild(tdNode);
	if (twofibers){
		tdNode = createLedBox("dataSync_2");
		row.appendChild(tdNode);	
	}	
	tdNode = createLedBox("dataSync_0");
	row.appendChild(tdNode);	
	if (isRedunded){
		tdNode = createLedBox("dataSync_3");
		row.appendChild(tdNode);
	}	
	//Desaparece ModKO
/*	row = document.createElement("tr");
	rootNode.appendChild(row);	
	hdr = createHeader("Module&nbsp;status","rht");
	row.appendChild(hdr);
	tdNode = createLedBox("optModKO_1");
	row.appendChild(tdNode);
	if (twofibers){
		tdNode = createLedBox("optModKO_2");
		row.appendChild(tdNode);	
	}		
	tdNode = createLedBox("optModKO_0");
	row.appendChild(tdNode);
	if (isRedunded){
		tdNode = createLedBox("optModKO_3");
		row.appendChild(tdNode);
	}		*/
	//FO Tx Fault
	row = document.createElement("tr");
	rootNode.appendChild(row);	
	hdr = createHeader("FO&nbsp;Tx&nbsp;Fault","rht");
	row.appendChild(hdr);	
	tdNode = createLedBox("optTxErr_1");
	row.appendChild(tdNode);
	if (twofibers){
		tdNode = createLedBox("optTxErr_2");
		row.appendChild(tdNode);	
	}		
	tdNode = createLedBox("optTxErr_0");
	row.appendChild(tdNode);	
	if (isRedunded){
		tdNode = createLedBox("optTxErr_3");
		row.appendChild(tdNode);
	}
	//Desaparece RX Error
	/*
	row = document.createElement("tr");
	rootNode.appendChild(row);	
	hdr =  createHeader("Optical&nbsp;Rx&nbsp;Error","rht");
	row.appendChild(hdr);
	tdNode = createLedBox("optRxErr_1");
	row.appendChild(tdNode);
	if (twofibers){
		tdNode = createLedBox("optRxErr_2");
		row.appendChild(tdNode);	
	}		
	tdNode = createLedBox("optRxErr_0");
	row.appendChild(tdNode);	
	if (isRedunded){
		tdNode = createLedBox("optRxErr_3");
		row.appendChild(tdNode);
	}	
	*/
	row = document.createElement("tr");
	rootNode.appendChild(row);	
	hdr =  createHeader("GTP&nbsp;PLL&nbsp;Lock","rht");
	row.appendChild(hdr);
	tdNode = createLedBox("gtpPllLock_1");
	row.appendChild(tdNode);
	if (twofibers){
		tdNode = createLedBox("gtpPllLock_2");
		row.appendChild(tdNode);	
	}		
	tdNode = createLedBox("gtpPllLock_0");
	row.appendChild(tdNode);	
	if (isRedunded){
		tdNode = createLedBox("gtpPllLock_3");
		row.appendChild(tdNode);
	}	
	//Para expansor
	if (ne>0){
		row = document.createElement("tr");
		rootNode.appendChild(row);	
		hdr =  createHeader("Temperature&nbsp;Alarm","rht");
		row.appendChild(hdr);
		tdNode = createLedBox("alarmTemp");
		row.appendChild(tdNode);
		row = document.createElement("tr");
		rootNode.appendChild(row);	
		hdr =  createHeader("Door&nbsp;Open","rht");
		row.appendChild(hdr);
		tdNode = createLedBox("doorOpen");
		row.appendChild(tdNode);		
		row = document.createElement("tr");
		rootNode.appendChild(row);	
		hdr =  createHeader("Comm.&nbsp;Error","rht");
		row.appendChild(hdr);
		tdNode = createLedBox("commError");
		row.appendChild(tdNode);			
	}
	
	rootNode = document.getElementById("tablemeas");
	row = document.createElement("tr");
	rootNode.appendChild(row);	
	hdr = document.createElement("th");
	row.appendChild(hdr);
	hdr = createHeaderId("colR2","REMOTE");
	if (twofibers) hdr.colSpan = 2;
	row.appendChild(hdr);	
	hdr = createHeaderId("colM2","MASTER");
	if (isRedunded) hdr.colSpan = 2;	
	row.appendChild(hdr);	
	if (twofibers){
		row = document.createElement("tr");
		rootNode.appendChild(row);
		hdr = document.createElement("th");
		row.appendChild(hdr);
		hdr = createHeader("PORT1");
		row.appendChild(hdr);		
		hdr = createHeader("PORT2");
		row.appendChild(hdr);
		if (isRedunded){
			hdr = createHeader("PORT"+remoteindex[0]);
			row.appendChild(hdr);			
			hdr = createHeader("PORT"+remoteindex[1]);
			row.appendChild(hdr);			
		}		
	}	
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = createHeader("Error&nbsp;count","rht");
	row.appendChild(hdr);
	tdNode = createTextBox("errors_1");
	row.appendChild(tdNode);
	if (twofibers){
		tdNode = createTextBox("errors_2");
		row.appendChild(tdNode);	
	}			
	tdNode = createTextBox("errors_0");
	row.appendChild(tdNode);
	if (isRedunded){
		tdNode = createTextBox("errors_3");
		row.appendChild(tdNode);
	}		
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = createHeader("Supply&nbsp;Voltage(V)","rht");
	row.appendChild(hdr);
	tdNode = createTextBox("voltage_1");
	row.appendChild(tdNode);
	if (twofibers){
		tdNode = createTextBox("voltage_2");
		row.appendChild(tdNode);	
	}			
	tdNode = createTextBox("voltage_0");
	row.appendChild(tdNode);
	if (isRedunded){
		tdNode = createTextBox("voltage_3");
		row.appendChild(tdNode);
	}	
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = createHeader("Bias&nbsp;Current(mA)","rht");
	row.appendChild(hdr);
	tdNode = createTextBox("bias_1");
	row.appendChild(tdNode);
	if (twofibers){
		tdNode = createTextBox("bias_2");
		row.appendChild(tdNode);	
	}		
	tdNode = createTextBox("bias_0");
	row.appendChild(tdNode);	
	if (isRedunded){
		tdNode = createTextBox("bias_3");
		row.appendChild(tdNode);
	}		
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = createHeader("Temperature(&deg;C)","rht");
	row.appendChild(hdr);
	tdNode = createTextBox("temperat_1");
	row.appendChild(tdNode);
	if (twofibers){
		tdNode = createTextBox("temperat_2");
		row.appendChild(tdNode);	
	}		
	tdNode = createTextBox("temperat_0");
	row.appendChild(tdNode);	
	if (isRedunded){
		tdNode = createTextBox("temperat_3");
		row.appendChild(tdNode);
	}	
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = createHeader("Tx&nbsp;Power(dBm)","rht");
	row.appendChild(hdr);
	tdNode = createTextBox("txpower_1");
	row.appendChild(tdNode);
	if (twofibers){
		tdNode = createTextBox("txpower_2");
		row.appendChild(tdNode);	
	}	
	tdNode = createTextBox("txpower_0");
	row.appendChild(tdNode);
	if (isRedunded){
		tdNode = createTextBox("txpower_3");
		row.appendChild(tdNode);
	}	
	row = document.createElement("tr");
	rootNode.appendChild(row);
	hdr = createHeader("Rx&nbsp;Power(dBm)","rht");
	row.appendChild(hdr);
	tdNode = createTextBox("rxPowTxt_1");
	row.appendChild(tdNode);
	if (twofibers){
		tdNode = createTextBox("rxPowTxt_2");
		row.appendChild(tdNode);	
	}	
	tdNode = createTextBox("rxPowTxt_0");
	row.appendChild(tdNode);
	if (isRedunded){
		tdNode = createTextBox("rxPowTxt_3");
		row.appendChild(tdNode);
	}	
	//Para expansor
	if (ne>0){
		row = document.createElement("tr");
		rootNode.appendChild(row);
		hdr = createHeader("Expansion&nbsp;Temperature","rht");
		row.appendChild(hdr);
		tdNode = createTextBox("boardTemp");
		row.appendChild(tdNode);
	}

}
function createLedBox(id) {
	var tdNode = document.createElement("td");
	var led = document.createElement("img");
	led.id = id;
	led.src = "/bullet_grey.png";
	led.className = "centered";
	led.align = "center";
	tdNode.appendChild(led);
	return tdNode;
}
function createHeaderId(id,val){
	var hdr = document.createElement("th");
	hdr.innerHTML = val;
	hdr.className = "thd";
	hdr.id = id;
	return hdr;
}
function createHeader(val,cl){
	var hdr = document.createElement("th");
	hdr.innerHTML = val;
	hdr.className = "thd"+cl;
	return hdr;
}
function createTextBox(id) {
	var tdNode = document.createElement("td");
	tdNode.id = id;
	tdNode.className = "tval";
	tdNode.innerHTML ="0";
	tdNode.style.minWidth = "50px";
	return tdNode;
}
function optLoadStatus() {
	var serverResponse = localStorage.getItem("stat_"+prjname+window.location.host);
	optParseStatus(serverResponse,links);
	tmrIdOptStat = setTimeout(function() { optLoadStatus(); }, 2000);
}
function optParseStatus(serverResponse, links) {
	var shift, dir, num, rxloss;
	var idx,device;
	var remotesNr = window.top.remotesNr;
	var statstrs = serverResponse.split("\t");
	var nlink = links[0]; //ojo
	var side_m;
	if (isRedunded){
		if (getRxLoss(remoteindex[0])) nlink = links[1];
	}
	if (typeof (window.top.remotesBitmask) == "undefined")
		window.top.remotesBitmask = parseRemotesBitmaskFromStatus(serverResponse);
	if (typeof (window.top.expansorNr) == "undefined")
		window.top.expansorNr = getExpansorsNrFromStatus(serverResponse);
	var expansorNr = window.top.expansorNr;	
	idx = getRemoteIndex(nlink, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
	rxloss = false;
	var sidemax = (ne>0)?2:((fibermask[nlink]==3)?3:2); //0 master, //1 and 2 remotes //3 master with remotefiberredunded
	if (isRedunded) sidemax=4;
	for (var side = 0; side < sidemax; side++) {
		side_m = side;
		if (side==3){
			side_m=0;
			if (nlink==links[1])
				idx = remoteindex[0];
			else
				idx = remoteindex[1];
		}
		if (ne==0)
		{
			if ((side_m==0))
			{
				if (idx<=6)
				{
					device=0;
					shift = 82*2 + (idx-1)*28;
				}
				else
				{
					device=Math.floor((idx-1)/6);
					shift = 4*2 + (((idx-1) % 6)-1)*28 + 28;
				}		
			}
			else
			{
				device=expansorNr+parseInt(nlink);
				shift = 18+(side_m-1)*28;
			}
		}
		else
		{
			if (side_m==0)
			{
				device = ne-1;
				shift = (ne==1) ? 360 : 204;			
			}
			else
			{
				device = ne;
				shift = 176;		
			}
		}
		if (typeof (statstrs[device]) == "undefined")
			return; 
		if (twofibers && mode[numlink]==0){
			if ((side==1) || (side==2)){
				num = parseInt(statstrs[device].substr(16,2),16)&0x1;
				if (num==0) {
					setColor("optActLnk_1","green");
					setColor("optActLnk_2","grey");
				}
				else{
					setColor("optActLnk_2","green");
					setColor("optActLnk_1","grey");
				}
			}
		}		
		side_m = side;
		if (isRedunded){
			if ((nlink==links[1])&&(side==0)) side_m=3;
			if ((nlink==links[1])&&(side==3)) side_m=0;
		}
		if ((side==1) && (ne>0)){ //Para expansor
			gtpalarm = parseInt(statstrs[device].substr(28,2),16);
			setColor("alarmTemp",(gtpalarm & 0x20)?"red":"green");
			setColor("doorOpen",(gtpalarm & 0x40)?"red":"green");
			temp = parseInt(statstrs[device].substr(6,2),16);
			setText("boardTemp",temp.toFixed(1),(gtpalarm & 0x20)?2:0);
			gtpalarm = parseInt(statstrs[device].substr(56,2),16);
			setColor("commError",(gtpalarm & 0x08)?"red":"green");
		}
		temp = to_float(parseInt(statstrs[device].substr(shift,4),16));
		shift += 4;
		setText("temperat_"+side_m,temp.toFixed(1),computeFoAlarmTemp(temp));
		volt = parseInt(statstrs[device].substr(shift,4),16) / 10000;
		shift += 4;
		setText("voltage_"+side_m,volt.toFixed(2),computeFoAlarmVolt(volt));
		bias = parseInt(statstrs[device].substr(shift,4),16) / 500;
		shift += 4;
		setText("bias_"+side_m,bias.toFixed(1),computeFoAlarmBias(bias));
		txpow = 10 * Math.log(parseInt(statstrs[device].substr(shift,4),16) + 1e-9) / Math.LN10 - 40;
		shift += 4;
		setText("txpower_"+side_m,txpow.toFixed(1),computeFoAlarmTxpow(txpow));
		var rxpow = 10 * Math.log(parseInt(statstrs[device].substr(shift,4),16) + 1e-9) / Math.LN10 - 40;
		shift += 4;
		//Desaparece condición con rxpower
		/*if (side == 0 && rxpow <= -29.5)
			rxloss = true;*/
		sfpalarm = parseInt(statstrs[device].substr(shift,2),16);
		shift += 2;
		setColor("optTxErr_"+side_m,(sfpalarm & 0x01)?"red":"green");
		//setColor("optRxErr_"+side_m,(sfpalarm & 0x02)?"red":"green");//Desaparece RX Error
		//setColor("optModKO_"+side_m,(sfpalarm & 0x04)?"red":"green");//Desaparece ModKO
		//Desaparece como condición de rxlos
		//if (side == 0 && (sfpalarm & 0x07))
		//	rxloss = true;
		
		gtpalarm = parseInt(statstrs[device].substr(shift,2),16);
		var alarm = computeFoAlarmRxpow(rxpow);
		if (gtpalarm&0x10) alarm=2; //Se comprueba loss of optical signal antes de representar texto rxpow
		setText("rxPowTxt_"+side_m,rxpow.toFixed(1),alarm);
		shift += 2;
		alarm = computeFoStatAlarm(temp, volt, bias, txpow, rxpow, sfpalarm, gtpalarm);
		setColor("foStatus_"+side_m,(alarm==2)?"red":(alarm==1)?"yellow":"green"); 
		setColor("dataLock_"+side_m,(gtpalarm & 0x02)?"red":"green");
		setColor("dataSync_"+side_m,(gtpalarm & 0x04)?"red":"green");
		setColor("gtpPllLock_"+side_m,(gtpalarm & 0x01)?"red":"green");
		setColor("optLossSignal_"+side_m,(gtpalarm & 0x10)?"red":"green");
		setColor("optLossComm_"+side_m,(gtpalarm & 0x0e)?"red":"green"); //datalock || datasync || freqsync

		if (side==0)
		{
			setColor("optFrSync_1",((gtpalarm & 0x08) != 0)?"red":"green");
			setColor("optFrSync_2",((gtpalarm & 0x08) != 0)?"red":"green");
		}
		if (side == 0 && (gtpalarm & 0x07))
			rxloss = true;
		num = parseInt(statstrs[device].substr(shift,4),16);
		setText("errors_"+side_m,num);
	}
	if (rxloss) {
		var kmax = (twofibers)?2:1;
		//Para expansor
		if (ne>0){
			setText("boardTemp","---",0);
			setColor("doorOpen","grey");
			setColor("alarmTemp","grey");
		}		
		for (k=1;k<=kmax;k++){
			if (mode[numlink]==0) setColor("optActLnk_"+k,"grey");
			setText("errors_"+k,"---",0);
			setText("temperat_"+k,"---",0);
			setText("voltage_"+k,"---",0);
			setText("bias_"+k,"---",0);
			setText("txpower_"+k,"---",0);
			setText("rxPowTxt_"+k,"---",0);
			setColor("optTxErr_"+k,"grey");
			setColor("optFrSync_"+k,"grey");
			//setColor("optRxErr_"+k,"grey");//Desaparece RX Error
			//setColor("optModKO_"+k,"grey");//Desaparece ModKO
			setColor("foStatus_"+k,"grey");
			setColor("dataLock_"+k,"grey");
			setColor("dataSync_"+k,"grey");
			setColor("optLossSignal_"+k,"grey");
			setColor("optLossComm_"+k,"grey");
			setColor("gtpPllLock_"+k,"grey");
		}
	}
}

function setText(element,text,color){ //color=0/normal, color=1/warning, color=2/alarm
	var el=document.getElementById(element);
	try{
		el.innerHTML = text;
		el.style.color = (color==2) ? "#df4040" : (color==1)?"#eeee88":"#802000";
	} catch (err) {}	
}
function setColor(element,color){
	try{
		document.getElementById(element).src = "/bullet_"+color+".png";
	} catch (err) {}
}
function getRxLoss(idx)
{
	var device, shift,num;
	var statstrs = (localStorage.getItem("stat_"+prjname+window.location.host)).split("\t");
	if (idx<=6)
	{
		device=0;
		shift = 82*2 + (idx-1)*28;
	}
	else
	{
		device=Math.floor((idx-1)/6);
		shift = 4*2 + (((idx-1) % 6)-1)*28 + 28;
	}
	//Desaparece condición con rxpower
	//num = 10 * Math.log(parseInt(statstrs[device].substr(shift+16,4),16) + 1e-9) / Math.LN10 - 40;
	//if (num <= -29.5) return true;
	//Desaparece condición con rxlos
	//num = parseInt(statstrs[device].substr(shift+20,2),16);
	//if (num & 0x06) return true;
	//se mantiene condición con datalock || datasync || gtpplllocks
	num = parseInt(statstrs[device].substr(shift+22,2),16);
	if (num & 0x07) return true;
	return false;
	
}
var foDataLimitsAlarm = {
	temperature: 	{min: -45,	max: 90	},
	voltage: 	{min: 2.7, 	max: 3.8},
	bias: 		{min: 0, 	max: 100},
	txpow: 		{min: -6, 	max: 8	},
	rxpow: 	{min: -140, 	max: 4.5}
}
var foDataLimitsWarning = {
	temperature: 	{min: -40,	max: 85	},
	voltage: 	{min: 2.8, 	max: 3.7},
	bias: 		{min: 0.1, 	max: 90	},
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
// -->