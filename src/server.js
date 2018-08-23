const fs = require('fs-extra');
// const csv = require('csvtojson');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Tail } = require('tail');
const cp = require('child-process-es6-promise');
const ip = require('ip');
const os = require('os');
const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();

let vpnLogs =[];
let syslog = [];
const buttons = [
    'start', 
    'stop', 
    'restart',
    'status', 
    'try', 
    'explain'
];

const status = {
  
  sysd: {
    vpnStatus: {
        build: {},
        on: null,
    },
    deviceStatus: {
        build: {},
        on: null
    },
    firewall: {
        build: {},
        on: null
    }
  },
  
  logs: {
    openvpn: {
        stats: {},
        logs: vpnLogs
    },
    systems: {
        sysLog: syslog
    }
  },
  
  systemInfo: {
      interfaceInfo : null,
      hostName: {},
      cores: {},
      toatsMem: {},
      usedMem: {},
      freeMem: {},
      upTime: null,
      cpuinfo: null,
      laodAverage: null,
      release: {}
  },

  firehol: {
      buttons: buttons,
      ipTables: {},
      config: {}
  }

};

app.listen(3001, ()=>{
    console.log('The server is running on port 3001....')
});

app.use(bodyParser.json());

app.use(cors());

// ROUTES:
//================
// sign-in == /
// status == /status ****complete for version 1****
// vpnForm == /vpn ****complete for version 1****
// firewallForm == /firewall ****complete for version 1****
// homepage == /home

// Sign in and get started
app.post('/', async(request, response)=> {
  let db = new sqlite3.Database(':memory:', (err)=> {
    if (err) {
      return console.error(err.message);
    }
    console.log('Connected to the in-memory SQlite database.');
  });
});

// Send response object to the status page for front end to use to create data
app.get('/status',(request, response) => {
  constructObj();
  response.json(status);

});

// Send a response to the home page
app.get('/home', (request, response) => {
    // This function is only in place as a fillabuster for now to send a response to the home page
    // using /etc/issue as an example to set object vpn status to true or false
    const setVpnSystemdStatus = (file, response) => {
        fs.readFile(file).then(data => {
            data = data.toString();
            status.sysd.vpnStatus.build = data;
            status.sysd.vpnStatus.on = data.includes('Linux Mint');
            const vpnSystemdStatus = status.sysd.vpnStatus.on;
            console.log(vpnSystemdStatus);
            response.json(vpnSystemdStatus);
        }).catch(err => console.log(err));        
        
      };
    setVpnSystemdStatus('/etc/issue', response);
    
});

// get form request from body, read the temp openvpn conf file, place body into temp file, write to final conf file
app.post('/vpn', async(request, response) => {
  const { ca, cert, key, ta } = request.body;
  try {
        const data = await readSysFile('/home/mrcoggsworth85/code/javascript/firestation-server/src/client-conf')
        const newConf = data.toString()
          .replace('number1', `<ca>${ca}</ca>`)
          .replace('number2', `<cert>${cert}</cert>`)
          .replace('number3', `<key>${key}</key>`)
          .replace('number4', `<ta>${ta}</ta>`);
        writeSysFile('/home/mrcoggsworth85/code/javascript/firestation-server/src/client.conf', newConf);
        response.json({
          response: "Form is complete...."
      });        
      } catch(err) {
          response.json({
              response: "Form completion failed...."
          });
          console.log(err);
          }
});

// get form request from body, read the temp firehol conf file, place body into temp file, write to final conf file
app.post('/firewall', async(request, response) => {
  const { localNets, proxyNets, localIP, openVpnIP } = request.body;
  try {
    const data = await readSysFile('/home/mrcoggsworth85/code/javascript/firestation-server/src/firehol-conf')
    const newConf = data.toString()
      .replace('local_Nets', `"${localNets}"`)
      .replace('proxy_Nets', `"${proxyNets}"`)
      .replace('local_IP', localIP)
      .replace('openVpn_IP', openVpnIP);
    writeSysFile('/home/mrcoggsworth85/code/javascript/firestation-server/src/firehol.conf', newConf);
    response.json({
      response: "Firehol is complete...."
  });        
  } catch(err) {
      response.json({
          response: "Firehol completion failed...."
      });
      console.log(err);
      }
});

const readSysFile = async (file) => {
  try {
    const confFile = await fs.readFile(file);
    return confFile
  } catch(err) {
    console.log(err, 'file or folder does not exist...')
  }
  
}

const writeSysFile = async (file, contents) => {
  try{
    const newFile = await fs.outputFile(file, contents);
  }catch(err){
    console.log(err);
  }
}


// Read OpenVPN Status logs from csv, place them into status Object
const readCsvLogs = async(file) => {
    const vpnStatusLogs = await fs.readFile(file);
    status.logs.openvpn.stats = vpnStatusLogs.toString();
}

// Read the firewall config file called firehol.conf
const readFirewallConfig = async(file) => {
    const fwConfig = await fs.readFile(file);
    status.firehol.config = fwConfig.toString();
}

// Run shell command
const runCmd = async(cmd) => {
    try {
        const {stdout, stderr} = await cp.exec(cmd);
        // console.log(stdout);
        return stdout;
    } catch(err) {
        if (err.code === 3){
            return err.stdout;
        }
        
    }
}

// execute system control status command
const sysdStatus = async(service) => {
    try {
        const {stdout, stderr} = await cp.exec(`systemctl status ${service}`);
        return stdout.includes('\(running\)');

    } catch(err) {
        if (err.code === 3){
            const build = "He's dead Jim...";
            return build;
        }
        
    }
}

// keep track of openpvn logs to view
const tailOpenVpn = (file) => {
    const tail = new Tail(file);

    tail.on('line', (data)=> {
        vpnLogs.push(data);
        if (vpnLogs.length >= 50) {
            vpnLogs.shift();
        }

    });

    tail.on('error', (error)=> console.log(error));
}

const tailSysLog = (file) => {
  const tail = new Tail(file);

  tail.on('line', (data)=> {
      syslog.push(data);
      if (syslog.length >= 50) {
          syslog.shift();
      }

  });

  tail.on('error', (error)=> console.log(error));
}

const sysdStatusChecker = async(statusObj) => {
    if (statusObj.build === true) {
        statusObj.on = true
    } else {
        statusObj.on = false;
    }
}

const systemsInformation = async(statusObj) => {
  const hostname = await os.hostname();
  const uptime = await os.uptime();
  const loadavg = await os.loadavg();
  const release = await os.release();
  const totalMemory = await os.totalmem();
  const cpuInfo = await os.cpus();
  const freeMemory = await os.freemem();
  const freeMemGB = parseFloat(((((freeMemory/2014)/1024)/1024))).toFixed(2);
  const usedMemory = parseFloat((((totalMemory/1024)/1024)/1024)-(((freeMemory/2014)/1024)/1024)).toFixed(2);
  
  console.log(hostname, uptime, loadavg, release,usedMemory,freeMemGB,cpuInfo.length);
  
  statusObj.hostName = hostname;
  statusObj.uptime = uptime;
  statusObj.laodAverage = loadavg;
  statusObj.cores = cpuInfo.length;
  statusObj.release = release;
  statusObj.usedMem = usedMemory;
  statusObj.freeMem = freeMemGB;
  statusObj.toatsMem = totalMemory;
  statusObj.cpuinfo = cpuInfo;

}

// Construct the array to send as a response to the client
const constructObj = async() => {
    const vpnstat = status.sysd.vpnStatus
    const fwStat = status.sysd.firewall
    const sysStatusInfo = status.systemInfo
    
    // await tailSysLog('/var/log/syslog');
    // await tailOpenVpn('/home/mrcoggsworth85/code/javascript/firestation-server/src/openvpn.log');
    await readCsvLogs('/home/mrcoggsworth85/code/javascript/firestation-server/src/openvpn-status.log');
    
    vpnstat.build = await sysdStatus('ssh');
    fwStat.build = await sysdStatus('firehol');
    
    await sysdStatusChecker(vpnstat);
    await sysdStatusChecker(fwStat);
    
    let allIps = [] 
    allIps.push(os.networkInterfaces());
    status.systemInfo.interfaceInfo = allIps;
    
    await readFirewallConfig('/etc/firehol/firehol.conf')
    status.firehol.ipTables = await runCmd('sudo iptables -L');

    await systemsInformation(sysStatusInfo);

}
tailSysLog('/var/log/syslog');
tailOpenVpn('/home/mrcoggsworth85/code/javascript/firestation-server/src/openvpn.log');