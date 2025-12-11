var ntab;
var nsec;
var hF = "helvetica";
function genReport(){
	ntab = 1;
	nsec = 1;
	showResultIcon(ERR_PENDING,indexHome);
	var doc = new jsPDF('p','pt','a4');
	var xHeader = 40;
	var xNormal = 60;
	var fsize=10,x,y;
	x=xHeader;
	y = addPdfHeader(doc,fsize);
	y = writeReportBasicTable(doc,y,xHeader,xNormal);
	y = writeReportAlarmStatus(doc,y,xHeader,xNormal);
	y = writeReportRfOverview(doc,y,xHeader,xNormal);
	y = writeReportFilterOverview(doc,y,xHeader,xNormal);
	y = writeCommissioningResults(doc,y,xHeader,xNormal);
	y = writeReportSpectrum(doc,y,xHeader,xNormal);
	y = writeReportAlarmLog(doc,y,xHeader,xNormal)
	doc.save('Report_'+serial+'_'+getCurrentDate(true)+'.pdf');
	setTimeout(function() {showResultIcon(ERR_OK,indexHome);}, 1);
	setTimeout(function() {showResultIcon(ERR_NONE,indexHome); }, 2000);
}

function writeReportBasicTable(doc,y,xh,xn){
	var oy,txt,k;
	doc.setFont(hF, "bold");fsize=12;x=xh;
	doc.setFontSize(fsize);
	if (y>640) y=pdfNewPage(doc,fsize);
	doc.text(nsec+'. BASIC INFORMATION TABLE',x,y);y+=fsize*1.5;nsec++;
	y+=fsize*1.5;
	doc.setFont(hF, "bold");fsize=10;x=xn;
	doc.setFontSize(fsize);
	doc.text('Table '+ntab+' - Basic Information Table',x,y);y+=fsize*1.5;ntab++;
	txt = ['Time/Date of report generation','Tag','Device Model',
		   'Device Serial Number','Device Firmware Versions'];
	oy=y;
	for (k=0;k<txt.length;k++){
		doc.rect(x-5,y-12,200,fsize*1.5);
		doc.text(txt[k],x,y);y+=fsize*1.5;
	}
	txt = [getCurrentDate(false)];
	txt.push($("#prjinfo_8").val());
	txt.push('DH7S');
	txt.push(serial);
	if (factory.ethernetModuleNotInstalled)
		txt.push('FPGA: '+version.fwStr+' Micro: '+version.swStr);
	else
		txt.push('FPGA: '+version.fwStr+' Micro: '+version.swStr+' Ethernet: '+version.ethStr);
	y=oy;x=xn+200;doc.setFont(hF, "normal");fsize=10;
	for (k=0;k<txt.length;k++){
		doc.rect(x-5,y-12,300,fsize*1.5);
		doc.text(txt[k],x,y);y+=fsize*1.5;
	}
	y+=fsize*3;
	return y;
}
function addPdfHeader(doc,fsize){
	var fs = fsize;
	y=20;
	doc.addImage(document.getElementById('mainlogo'),'JPEG',20,y);
	doc.setFillColor(0x0,0x4a,0x98);
	doc.setTextColor(0xff);
	doc.rect(20, 20, 540, 10, 'F');
	doc.rect(20, 20, 10, 100, 'F');
	doc.rect(20, 110, 540, 10, 'F');
	doc.rect(220, 20, 340, 100, 'F');
	doc.setFillColor(0x0,0x4a,0x98);
	doc.setFont(hF, "bold");fsize=16;
	doc.setFontSize(fsize);
	doc.text("Fiplex Control Software Report",280,82);
	doc.setTextColor(0x0);
	doc.setFontSize(fs);
	y+=130;
	return y;
}
function writeReportAlarmStatus(doc,y,xh,xn){
	var x,fsize;
	doc.setFont(hF, "bold");fsize=12;x=xh;
	doc.setFontSize(fsize);
	if (y>640) y=pdfNewPage(doc,fsize);
	doc.text(nsec+'. ALARM INFORMATION TABLE',x,y);y+=fsize*1.5;nsec++;
	y+=fsize*1.5;
	y = writeAlarmStatusTable(doc,y,xn);
	y = writeAlarmConfigTable(doc,y,xn);
	y = writeAlarmThresholdTable(doc,y,xn);
	return y;
}
function writeAlarmStatusTable(doc,y,xn){
	var x,fsize,txt,k,p,al;
	doc.setFont(hF, "bold");fsize=10;x=xn;
	doc.setFontSize(fsize);
	if (y>720) y=pdfNewPage(doc,fsize);
	doc.text('Table '+ntab+' - Status of Enabled Alarms. Temperature',x,y);y+=fsize*1.5;ntab++;
	txt = [];
	for (k=0;k<NFPAcfg.alarmNames[0].length;k++){
		if (NFPAcfg.alarmNames[0][k].length>0 && NFPAcfg.globalAlarmsEnabled[k]){
			al = [NFPAcfg.alarmNames[0][k],monitor.gralAlarm[k]?"Alarm":"No Alarm"];
			txt.push(al);
		}
	}
	for (p=0;p<2;p++){
		if (factory.chBandEnabled[p] || factory.adjBandEnabled[p]){
			for (k=0;k<NFPAcfg.alarmNames[1].length;k++){
				if (NFPAcfg.alarmNames[1][k].length>0 && NFPAcfg.bandAlarmsEnabled[k]){
					al = [NFPAcfg.alarmNames[1][k]+' '+factory.bandNames[p],monitor.bandAlarm[p][k]?"Alarm":"No Alarm"];
					txt.push(al);
				}
			}
		}
	}
	txt.push(['Temperature',monitor.boardTemp.toFixed(1)+"ºC"]);
	for (k=0;k<txt.length;k++){
		if (y>800) y=pdfNewPage(doc,fsize);
		for (p=0;p<2;p++){
			doc.setFont(hF, p==0?"bold":"normal");
			doc.rect(x-5+p*200,y-12,p==0?200:300,fsize*1.5);
			doc.text(txt[k][p],x+p*200,y);
		}
		y+=fsize*1.5;
	}
	y+=fsize*1.5;
	return y;
}
function writeAlarmConfigTable(doc,y,xn){
	var x,fsize,txt,k,p,al,rel,s;
	doc.setFont(hF, "bold");fsize=10;x=xn;
	doc.setFontSize(fsize);
	if (y>720) y=pdfNewPage(doc,fsize);
	doc.text('Table '+ntab+' - Alarm Configuration',x,y);y+=fsize*1.5;ntab++;
	txt = [];
	for (k=0;k<NFPAcfg.alarmNames[0].length;k++){
		if (NFPAcfg.alarmNames[0][k].length>0 && NFPAcfg.alarmNames[0][k].search("Undefined")<0){
			for (rel="",p=0;p<4;p++){
				if (NFPAcfg.relayAssignGlobalAlarm[k][p]) rel+=(p+1)+", ";
			}
			if (rel.length>2)
				rel = rel.substr(0,rel.length-2);
			else
				rel = '---';
			s = NFPAcfg.globalAlarmsEnabled[k]?"Enabled":"Disabled";
			if (k>=8 && k<12 && NFPAcfg.globalAlarmsEnabled[k]){
				s+= " (Active if level "+(NFPAcfg.externalAlarmPolarity[k-8]?"high)":"low)");
			}
			al = [NFPAcfg.alarmNames[0][k],s,"Relay: "+rel];
			txt.push(al);
		}
	}
	for (k=0;k<NFPAcfg.alarmNames[1].length;k++){
		if (NFPAcfg.alarmNames[1][k].length>0 && NFPAcfg.alarmNames[1][k].search("Undefined")<0){
			for (rel="",p=0;p<4;p++){
				if (NFPAcfg.relayAssignBandAlarm[k][p]) rel+=(p+1)+", ";
			}
			if (rel.length>2)
				rel = rel.substr(0,rel.length-2);
			else
				rel = '---';
			al = [NFPAcfg.alarmNames[1][k],NFPAcfg.bandAlarmsEnabled[k]?"Enabled":"Disabled","Relay: "+rel];
			txt.push(al);
		}
	}
	var offx = [0,200,350];
	for (k=0;k<txt.length;k++){
		if (y>800) y=pdfNewPage(doc,fsize);
		for (p=0;p<3;p++){
			doc.setFont(hF, p==0?"bold":"normal");
			doc.rect(x-5+offx[p],y-12,p==0?200:150,fsize*1.5);
			doc.text(txt[k][p],x+offx[p],y);
		}
		y+=fsize*1.5;
	}
	y+=fsize*1.5;
	return y;
}
function writeAlarmThresholdTable(doc,y,xn){
	var x,fsize,txt,k,p,r,s;
	doc.setFont(hF, "bold");fsize=10;x=xn;
	doc.setFontSize(fsize);
	if (y>720) y=pdfNewPage(doc,fsize);
	doc.text('Table '+ntab+' - Alarm Thresholds',x,y);y+=fsize*1.5;ntab++;
	txt = [];
	for (p=0;p<2;p++){
		/*if (factory.chBandEnabled[p]){	
			r = ['Squelch Threshold for narrow band filters '+factory.bandNames[p],config.sqChThreshold[0][p][1][0].toFixed(1)+'dBm'];
			txt.push(r);
		}
		if (factory.adjBandEnabled[p]){	
			r = ['Squelch Threshold for adj.BW filters '+factory.bandNames[p],config.sqChThreshold[1][p][1][0].toFixed(1)+'dBm'];
			txt.push(r);
		}*/
		if (factory.chBandEnabled[p] || factory.adjBandEnabled[p]){
			r = ['Minimum TX Power for VSWR Detection '+factory.bandNames[p],NFPAcfg.minPowerVSWR[p].toFixed(1)+'dBm'];
			txt.push(r);
			r = ['Return Loss Threshold '+factory.bandNames[p],NFPAcfg.retLossTh[p].toFixed(1)+'dBm'];
			txt.push(r);
			r = ['VSWR Alarm Sensitivity '+factory.bandNames[p],NFPAcfg.alarmNumSens[p]+' seconds'];
			txt.push(r);
			r = ['Donor Antenna Failure. Time To Trigger Alarm '+factory.bandNames[p],NFPAcfg.timeTxLowPowLow[p]+' seconds'];
			txt.push(r);
		}
	}
	r = ['Antenna Disconnection Threshold',NFPAcfg.antennaDisconnectionThreshold.toFixed(1)+'dBm'];
	txt.push(r);
	r = ['Oscillation Time Threshold',config.oscTimeThSeconds[0]+' seconds'];
	txt.push(r);
	s = config.oscActionAfterAlarm[0]==0?'Automatic Shut Down':'Run Isolation Meas.';
	r = ['Action After Oscillation Alarm',s];
	txt.push(r);
	r = ['Retry Timer After Auto PA Off',config.oscRetryTimeHours[0]+' hours'];
	txt.push(r);
	r = ['Auto UL PA Off Timer',config.autoUlPaOffTimer+' minutes'];
	txt.push(r);
	if (factory.extremeTempActionEnable){
		var extTempOpt = ['No Action','Reduce 6dB DL Power','PA OFF'];
		if (config.extremeTempAction>=0 && config.extremeTempAction<extTempOpt.length)
			s = extTempOpt[config.extremeTempAction];
		else
			s = '---';
		r = ['Extreme Temperature Action',s];
		txt.push(r);
	}
	for (p=0;p<2;p++){
		if (factory.chBandEnabled[p] || factory.isClassB(p)) {
			// if (config.squelchAdjBwMode[p])
			r = ['C/N Threshold Uplink Channels '+factory.bandNames[p], config.cn_threshold_nb[p].toFixed(1)+'dBm'];
			txt.push(r);
		}
		if (factory.adjBandEnabled[p]){
			for (k=0;k<factory.numADJFilters;k++){
				r = ['C/N Threshold Uplink Adj.Bw-'+(k+1)+' '+factory.bandNames[p], self.config.cn_threshold_adj[p][k].toFixed(1)+'dBm'];
				txt.push(r);
			}
		}
	}
	r = ['C/N UL Low Alarm Time Threshold', self.config.cnAlarmTime+' seconds'];
	txt.push(r);
	
	for (k=0;k<txt.length;k++){
		if (y>800) y=pdfNewPage(doc,fsize);
		for (p=0;p<2;p++){
			doc.setFont(hF, p==0?"bold":"normal");
			doc.rect(x-5+300*p,y-12,p==0?300:200,fsize*1.5);
			doc.text(txt[k][p],x+300*p,y);
		}
		y+=fsize*1.5;
	}
	y+=fsize*1.5;
	return y;
}
function pdfNewPage(doc,fsize){
	doc.addPage();
	return addPdfHeader(doc,fsize);
}
function writeReportRfOverview(doc,y,xh,xn){
	var x,fsize;
	doc.setFont(hF, "bold");fsize=12;x=xh;
	doc.setFontSize(fsize);
	if (y>640) y=pdfNewPage(doc,fsize);
	doc.text(nsec+'. RF OVERVIEW TABLE',x,y);y+=fsize*1.5;nsec++;
	y+=fsize*1.5;
	y = writeRfOverviewTable(doc,y,xn);
	return y;
}
function writeRfOverviewTable(doc,y,xn){
	var x,fsize,p,na,b;
	for (b=0;b<2;b++){
		doc.setFont(hF, "bold");fsize=10;x=xn;
		doc.setFontSize(fsize);
		if (y>720) y=pdfNewPage(doc,fsize);
		doc.text('Table '+ntab+' - '+factory.bandNames[b]+' RF Information Table',x,y);y+=fsize*1.5;ntab++;
		y = writeRFDetailedTable(doc,y,xn,b,p);
	}
	y+=fsize*1.5;
	return y;
}
function writeRFDetailedTable(doc,y,xn,b,p){
	var x,fsize,p,txt,r,k,cch,nach,cchExists,s,max;
	var lic = [factory.chBandEnabled[b],factory.adjBandEnabled[b]];
	txt = [];
	txt.push(['Narrow Band Filters',factory.chBandEnabled[b]?'Enabled':'No License']);
	txt.push(['Adj.BW Filters',factory.adjBandEnabled[b]?'Enabled':'No License']);
	s='';
	var nA = numEnabledFilts(b,0);
	var nB = numEnabledFilts(b,1);
	if (lic[0]) s+= 'Narrow band: ' + nA +'    ';
	if (lic[1]) s+= 'Adj.BW: ' + nB;
	if (s.length==0) s='0';
	txt.push(['Enabled Filters',s]);

	if ((lic[0] || lic[1]) && (nA>0 || nB>0)){
		cchExists = false;
		cch = config.controlChannel[b];
		if (cch>0){
			cch=cch-1;
			nach=0;
			cchExists = config.filterEnabled[0][b][1][cch];
			if (cchExists) txt.push(['Control Channel',(config.freqHz[b][1][cch]/1e6).toFixed(6)+'MHz']);
		}else if(cch<0){
			cch=-cch-1;
			nach=1;
			cchExists = config.filterEnabled[1][b][1][cch];
			if (cchExists) txt.push(['Control Channel',(config.fstartHzAdjFilter[b][1][cch]/1e6).toFixed(4)+'-'+(config.fstopHzAdjFilter[b][1][cch]/1e6).toFixed(4)+'MHz']);
		}
		s='';
		if (!cchExists){
			max=-140;
			for (var na=0;na<2;na++){
				for (var c=0;c<(na==0?2*config.CHNR:factory.numADJFilters);c++){
					if (config.filterEnabled[na][b][1][c] && monitor.level[na][b][1][c]>max){
						max=monitor.level[na][b][1][c];
						cch=c;
						nach=na;
					}
				}
			}
			var ch = nach==0?(config.freqHz[b][1][cch]/1e6).toFixed(6)+'MHz':(config.fstartHzAdjFilter[b][1][cch]/1e6).toFixed(4)+'-'+(config.fstopHzAdjFilter[b][1][cch]/1e6).toFixed(4)+'MHz';
			s += '('+ch+')';
			txt.push(['Control Channel','Not defined']);
		}
		txt.push(['Control Channel Power (or Max.RSSI CH)',monitor.level[nach][b][1][cch].toFixed(1)+'dBm '+s]);
		var pow = config.power[b][1];
		txt.push(['Configured Composite Output',pow+'dBm']);
		if (factory.chBandEnabled[b] && numEnabledFilts(b,0)>0 && factory.adjBandEnabled[b] && numEnabledFilts(b,1)>0) pow-=3;
		var n = numEnabledFilts(b,nach);
		/* se quita el factor 0.1*(n-1) de la reducción de potencia, tal como se ha hecho en el micro */
		pow -= (10*Math.log((n))/Math.LN10);
		txt.push(['Theoretical Output Power per Channel',pow.toFixed(1)+'dBm (for class '+(nach==0?'A':'B')+' filters)']);
		pow = monitor.level[nach][b][1][cch]+monitor.gain[nach][b][1][cch];
		txt.push(['Actual Output Power per Channel',pow.toFixed(1)+'dBm']);
		var pout = monitor.estTxPow[b][1];
		if (pout>-100)
			txt.push(['Actual Composite Output Power',pout.toFixed(1)+'dBm']);
		else
			txt.push(['Actual Composite Output Power','---']);
		s = monitor.maxAllowGain[b]+config.gainIsolMargin[0]+'dB';
		if (monitor.maxAllowGain[b]==factory.gainlimit[2*b]) s = '>'+s;
		txt.push(['Isolation Measurement',s]);
		txt.push(['Maximum Allowable Gain (UL and DL)',monitor.maxAllowGain[b]+'dB']);
		txt.push(['UL PA Status',monitor.statePaOn[b][0]?'On':'Off']);
		txt.push(['DL PA Status',monitor.statePaOn[b][1]?'On':'Off'])
	}
	x=xn;fsize=10;
	doc.setFontSize(fsize);
	for (k=0;k<txt.length;k++){
		if (y>760) y=pdfNewPage(doc,fsize);
		for (p=0;p<2;p++){
			doc.setFont(hF, p==0?"bold":"normal");
			doc.rect(x-5+300*p,y-12,p==0?300:200,fsize*1.5);
			doc.text(txt[k][p],x+300*p,y);
		}
		y+=fsize*1.5;
	}
	y+=fsize*1.5;
	return y;
}

function writeReportFilterOverview(doc,y,xh,xn){
	var x,fsize;
	doc.setFont(hF, "bold");fsize=12;x=xh;
	doc.setFontSize(fsize);
	if (y>640) y=pdfNewPage(doc,fsize);
	doc.text(nsec+'. FILTER OVERVIEW TABLE',x,y);y+=fsize*1.5;nsec++;
	y+=fsize*1.5;
	y = writeFilterDetailedTable(doc,y,xn);
	return y;
}
function writeCommissioningResults(doc,y,xh,xn){
	var x,fsize;
	doc.setFont(hF, "bold");fsize=12;x=xh;
	doc.setFontSize(fsize);
	y=pdfNewPage(doc,fsize);
	doc.text(nsec+'. COMMISSIONING RESULTS',x,y);y+=fsize*1.5;nsec++;
	y+=fsize*1.5;
	y = writeCommissioningTable(doc,y,xn);
	return y;
}
function writeCommissioningTable(doc,y,xn){
	var x,fsize,k,mess;
	var result = JSON.parse(localStorage.getItem("commResult"));
	x=xn;
	if (typeof(result)!=="undefined" && result!=null){
		if (result.serial.search(serial)>=0){
			var nband = ['700 BAND','800 BAND','BAND 14']
			for (k=0;k<3;k++){
				if (result.enabledBand[k]){
					doc.setFont(hF, "bold");fsize=10;x=xn;
					doc.setFontSize(fsize);
					mess = 'Table '+ntab+' - '+nband[k]+' Commissioning Results Table';
					doc.text(mess,x,y);y+=fsize*1.5;ntab++;
					y = writeCommissioningResultsTable(doc,y,xn,result,k);
				}
			}
		}else{
			mess = 'There is not stored commissioning results for this device';
			doc.text(mess,x,y);y+=fsize*1.5;
		}
	}else{
		mess = 'There is not stored commissioning results for this device';
		doc.text(mess,x,y);y+=fsize*1.5;
	}
	y+=fsize*1.5;
	return y;
}
function writeCommissioningResultsTable(doc,y,xn,result,index){
	var txt,k;
	txt = [];
	txt.push(['Commissioning Process Date and Time',result.time]);
	txt.push(['Isolation Measurement',result.isolMeas[index]+'dB']);
	txt.push(['Maximum Allowable Gain',result.maxAllowGain[index]+'dB']);
	txt.push(['RSSI Control Channel (or maximum RSSI)',result.rssiCch[index]+'dBm']);
	txt.push(['Maximum Achievable Output Power per channel',result.maxOutPow[index]+'dBm']);
	txt.push(['Actual Output Power per channel',result.actMaxOutPow[index]+'dBm']);
	/*if (result.baseStationAutoAdjustEnable[index]){
		txt.push(['Auto-configured Uplink Output Power per channel',result.ulPowerOutChComm[index]+'dBm']);
		txt.push(['Auto-configured Uplink Output Total Power',result.ulPowerOutBandComm[index]+'dBm']);
	}
	if (result.ulGainAutoAdjustEnable[index]){
		txt.push(['Auto-configured Uplink Gain',result.ulGainComm[index]+'dB']);
	}*/
	x=xn;
	for (k=0;k<txt.length;k++){
		if (y>800) y=pdfNewPage(doc,fsize);
		for (p=0;p<2;p++){
			doc.setFont(hF, p==0?"bold":"normal");
			doc.rect(x-5+300*p,y-12,p==0?300:200,fsize*1.5);
			doc.text(txt[k][p],x+300*p,y);
		}
		y+=fsize*1.5;
	}
	y+=fsize*1.5;
	return y;
}
function writeFilterDetailedTable(doc,y,xn){
	var x,fsize,p,na,b,n,fnEnab;
	var lic = [factory.chBandEnabled,factory.adjBandEnabled];
	for (b=0;b<2;b++){
		for (na=0;na<2;na++){
			if (lic[na][b]){
				for (p=0;p<2;p++){
					n = numEnabledFilts(b,na);
					fnEnab = na==1 && b==0 && config.filterEnabled[1][0][1][0] && config.firstADJisFirstNet;
					if (fnEnab) n--;
					if (n>0){
						doc.setFont(hF, "bold");fsize=10;x=xn;
						doc.setFontSize(fsize);
						if (y>720) y=pdfNewPage(doc,fsize);
						var mess = 'Table '+ntab+' - Class '+(na==0?"A":"B")+' '+factory.bandNames[b]+' '+(p==0?"Up":"Down")+'link Filter Information Table';
						mess+= ' (Enabled Filters: '+n+')';
						doc.text(mess,x,y);y+=fsize*1.5;ntab++;
						y = writeSingleFilterDetailedTable(doc,y,xn,na,b,p,fnEnab,false);
					}
				}
			}
		}
	}
	if (lic[1][0] && config.filterEnabled[1][0][1][0] && config.firstADJisFirstNet){
		for (p=0;p<2;p++){
			doc.setFont(hF, "bold");fsize=10;x=xn;
			doc.setFontSize(fsize);
			if (y>720) y=pdfNewPage(doc,fsize);
			var mess = 'Table '+ntab+' - BAND 14 '+(p==0?"Up":"Down")+'link Filter Information Table';
			doc.text(mess,x,y);y+=fsize*1.5;ntab++;
			y = writeSingleFilterDetailedTable(doc,y,xn,1,0,p,true,true);
		}
	}
	for (b=0;b<2;b++){
		if (!lic[0][b] && lic[1][b] && config.squelchAdjBwMode[b]){
			n = numEnabledFilts(b,0);
			for (p=0;p<2;p++){
				if (!(n>0)) continue;
				doc.setFont(hF, "bold");fsize=10;x=xn;
				doc.setFontSize(fsize);
				if (y>720) y=pdfNewPage(doc,fsize);
				var mess = 'Table '+ntab+' - Narrow Band '+factory.bandNames[b]+' '+
					(p==0?"Up":"Down")+'link Filter for Filters-Based Adj.BW Squelch';
				mess+= ' (Enabled Filters: '+n+')';
				doc.text(mess,x,y);y+=fsize*1.5;ntab++;
				y = writeSingleFilterDetailedTableAdjBwSq(doc,y,xn,0,b,p,false,false);
			}
		}
	}
	y+=fsize*1.5;
	return y;
}
function writeSingleFilterDetailedTable(doc,y,xn,na,b,ud,fnEnab,isFn){
	pageAdv.init(factory,config);
	var x,fsize,p,txt,r,k,w,wacc;
	txt = [];
	x=xn;fsize=10;doc.setFontSize(fsize);
	w= [20,90,90,40,50,80,80,50];
	wacc = 0;
	if (na==0){
		r = ['Nr','Freq','BW/Delay','Gain','Squelch','Input Power','Output Power','AGC'];txt.push(r);
		for (k=0;k<2*config.CHNR;k++){
			if (config.filterEnabled[na][b][1][k]){
				r=[];
				r.push((k+1)+'');
				r.push((config.freqHz[b][ud][k]/1e6).toFixed(6)+'MHz');
				r.push(config.bwKHz[b][ud][k]+'KHz/'+FilterTypes[config.bwIndex[b][ud][k]]['data'][3]+"us");
				r.push((config.gain[b][ud]+config.fineGainFilter[na][b][ud][k])+"dB");
				var c = k;
				if (ud==0 && na==0) c = 0;
				if (config.sqChEnabled[na][b][ud][c])
					r.push(config.sqChThreshold[na][b][ud][c]+"dBm");
				else
					r.push("OFF");
				r.push(monitor.level[na][b][ud][k].toFixed(1)+'dBm');
				var agc = config.gain[b][ud]+config.fineGainFilter[na][b][ud][k]-monitor.gain[na][b][ud][k];
				if (agc<0) agc=0;
				var pout = (monitor.level[na][b][ud][k]+monitor.gain[na][b][ud][k]).toFixed(1)+'dBm';
				if (!pageAdv.computeChInOn(ud, k, b, na, monitor)){
					pout='OFF';
					agc=0;
				}
				r.push(pout);
				r.push(agc.toFixed(1)+'dB');
				txt.push(r);
			}
		}
	}else{
		r = ['Nr','Freq Start','Freq Stop','Gain','Squelch','Input Power','Output Power','AGC'];txt.push(r);
		var inik = fnEnab?1:0;
		var endk = factory.numADJFilters;
		if (isFn){
			inik = 0;
			endk = 1;
		}
		var lic = [factory.chBandEnabled,factory.adjBandEnabled];
		var filtersBased = "Filter Based";
		for (k=inik;k<endk;k++){
			if (config.filterEnabled[na][b][1][k]){
				r=[];
				r.push((k+1)+'');
				r.push((config.fstartHzAdjFilter[b][ud][k]/1e6).toFixed(6)+'MHz');
				r.push((config.fstopHzAdjFilter[b][ud][k]/1e6).toFixed(6)+'MHz');
				r.push((config.gain[b][ud]+config.fineGainFilter[na][b][ud][k])+"dB");
				if (config.sqChEnabled[na][b][ud][k]){
					if (!lic[0][b] && lic[1][b] && config.squelchAdjBwMode[b]){
						r.push(filtersBased);
					}else{
						r.push(config.sqChThreshold[na][b][ud][k]+"dBm");
					}
				}else{
					r.push("OFF");
				}
				r.push(monitor.level[na][b][ud][k].toFixed(1)+'dBm');
				var agc = config.gain[b][ud]+config.fineGainFilter[na][b][ud][k]-monitor.gain[na][b][ud][k];
				if (agc<0) agc=0;
				var pout = (monitor.level[na][b][ud][k]+monitor.gain[na][b][ud][k]).toFixed(1)+'dBm';
				if (!pageAdv.computeChInOn(ud, k, b, na, monitor)){
					pout='OFF';
					agc=0;
				}
				r.push(pout);
				r.push(agc.toFixed(1)+'dB');
				txt.push(r);
			}
		}
	}
	for (k=0;k<txt.length;k++){
		wacc = 0;
		if (y>760) y=pdfNewPage(doc,fsize);
		for (p=0;p<8;p++){
			doc.setFont(hF, (p==0 || k==0)?"bold":"normal");
			doc.setFillColor(k==0?0xC0:0x00);
			doc.rect(x-5+wacc,y-12,w[p],fsize*1.5,k==0?'DF':'S');
			if (txt[k][p] == filtersBased){
				fsize=8;doc.setFontSize(fsize);
			}
			doc.text(txt[k][p],x+wacc,y);
			if (txt[k][p] == filtersBased){
				fsize=10;doc.setFontSize(fsize);
			}
			wacc+=w[p];
		}
		y+=fsize*1.5;
	}
	y+=fsize*1.5;
	return y;
}
function writeSingleFilterDetailedTableAdjBwSq(doc,y,xn,na,b,ud,fnEnab,isFn){
	na = 0;
	isFn = false;

	pageAdv.init(factory,config);
	var x,fsize,p,txt,r,k,w,wacc;
	txt = [];
	x=xn;fsize=10;doc.setFontSize(fsize);
	w= [20,90,90,50,80];
	wacc = 0;

	r = ['Nr','Freq','BW/Delay','Squelch','Input Power'];txt.push(r);
	for (k=0;k<2*config.CHNR;k++){
		if (config.filterEnabled[na][b][1][k]){
			r=[];
			r.push((k+1)+'');
			r.push((config.freqHz[b][ud][k]/1e6).toFixed(6)+'MHz');
			r.push(config.bwKHz[b][ud][k]+'KHz/'+FilterTypes[config.bwIndex[b][ud][k]]['data'][3]+"us");
			var c = k;
			if (ud==0 && na==0) c = 0;
			r.push(config.sqChThreshold[na][b][ud][c]+"dBm");
			r.push(monitor.level[na][b][ud][k].toFixed(1)+'dBm');
			txt.push(r);
		}
	}

	for (k=0;k<txt.length;k++){
		wacc = 0;
		if (y>760) y=pdfNewPage(doc,fsize);
		for (p=0;p<5;p++){
			doc.setFont(hF, (p==0 || k==0)?"bold":"normal");
			doc.setFillColor(k==0?0xC0:0x00);
			doc.rect(x-5+wacc,y-12,w[p],fsize*1.5,k==0?'DF':'S');
			doc.text(txt[k][p],x+wacc,y);
			wacc+=w[p];
		}
		y+=fsize*1.5;
	}
	y+=fsize*1.5;
	return y;
}

function writeReportSpectrum(doc,y,xh,xn){
	var x,fsize,k,n=[];
	doc.setFont(hF, "bold");fsize=12;x=xh;
	doc.setFontSize(fsize);
	y=pdfNewPage(doc,fsize);
	doc.text(nsec+'. SPECTRUM PLOTS',x,y);y+=fsize*1.5;nsec++;
	for (k=1;k<=4;k++){
		var ns = localStorage.getItem("imgserial"+k); 
		if (serial.search(ns)>=0){
			var img = localStorage.getItem("img"+k);
			if (img!=null){
				if(img.length>10){
					n.push(k);
				}
			}
		}
	}
	doc.setFont(hF, "bold");fsize=10;x=xn;
	doc.setFontSize(fsize);
	var lbl = ['A','B','C','D'];
	if (n.length==0){
		if (y>720) y=pdfNewPage(doc,fsize);
		doc.text('No spectrum traces found for this device serial number',x,y);y+=fsize*1.5;
	}else{
		for (k=0;k<n.length;k++){
			var img = localStorage.getItem("img"+n[k]);
			if (y>420) y=pdfNewPage(doc,fsize);
			var mess = 'Figure '+(k+1)+' - Spectrum Trace '+lbl[n[k]-1];
			doc.text(mess,x,y);y+=5;
			doc.addImage(img, 'JPEG', 20, y);y+=340;
		}
	}
	y+=fsize*1.5;
	return y;
}
function writeReportAlarmLog(doc,y,xh,xn){
	var x,fsize;
	doc.setFont(hF, "bold");fsize=12;x=xh;
	doc.setFontSize(fsize);
	y=pdfNewPage(doc,fsize);
	doc.text(nsec+'. ALARMS LOG',x,y);y+=fsize*1.5;nsec++;
	writeAlarmLogTable(doc,y,xn);
	return y;
}
function writeAlarmLogTable(doc,y,xn){
	var x,fsize,txt,k,p,r;
	doc.setFont(hF, "bold");fsize=10;x=xn;
	doc.setFontSize(fsize);
	doc.text('Table '+ntab+' - Alarm Log',x,y);y+=fsize*1.5;ntab++;
	txt = [];
	var data = eventLog.gui.getLogData("\t", false, false);
	r = ['Time Stamp','Status','Alarm'];
	txt.push(r);
	var lines = data.split("\n");
	for (k=0;k<lines.length;k++){
		r = lines[k].split("\t");
		if (r.length>1){
			while (r.length<3){
				r.push('BOOT');
				r[1]='---';
			}
			txt.push(r);
		}
	}
	w= [200,100,200];
	for (k=0;k<txt.length;k++){
		wacc = 0;
		try{
			if (y>760) y=pdfNewPage(doc,fsize);
			for (p=0;p<3;p++){
				doc.setFont(hF, (p==0 || k==0)?"bold":"normal");
				doc.setFillColor(k==0?0xC0:0x00);
				doc.rect(x-5+wacc,y-12,w[p],fsize*1.5,k==0?'DF':'S');
				doc.text(txt[k][p],x+wacc,y);
				wacc+=w[p];
			}
			y+=fsize*1.5;
		} catch (err) {
		}
	}
	y+=fsize*1.5;
	return y;
}