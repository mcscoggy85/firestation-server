const fs = require('fs-extra');
// const csv = require('csvtojson');
const cors = require('cors');
const bodyParser = require('body-parser');
const Tail = require('tail').Tail;
const cp = require('child-process-es6-promise');
const ip = require('ip');
const os = require('os');
const express = require('express');
const app = express();

let vpnLogs =[];
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
      firehole: {
          iptables: {}
      },
      systems: {
          sysLog: {}
      }
  },
  
  systemInfo: {
      interfaceInfo : null
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
// status == /status
// vpnForm == /vpn
// firewallForm == /firewall
// homepage == /home

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

// Send response object to the status page for front end to use to create data
app.get('/status',(request, response) => {
    response.json(status);

});

// Read OpenVPN Status logs from csv, place them into status Object
const readCsvLogs = async(file) => {
    const vpnStatusLogs = await fs.readFile(file);
    status.logs.openvpn.stats = vpnStatusLogs.toString();
}

// Run shell command
const runCmd = async(cmd) => {
    try {
        const {stdout, stderr} = await cp.exec(cmd);
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
// need to add logic to only show so many lines at one time
const tailFile = (file) => {
    const tail = new Tail(file);

    tail.on('line', (data)=> {
        vpnLogs.push(data);
        if (vpnLogs.length >= 50) {
            console.log('more than 50');
        }

    });

    tail.on('error', (error)=> console.log(error));
}

const getHostIp = async() => {
    return await ip.address();
}

// Construct the array to send as a response to the client
const constructObj = async() => {
    await tailFile('/home/mrcoggsworth85/code/javascript/firestation-server/src/openvpn.log');
    await readCsvLogs('/home/mrcoggsworth85/code/javascript/firestation-server/src/openvpn-status.log');
    status.sysd.vpnStatus.build = await sysdStatus('ssh');
    
    if (status.sysd.vpnStatus.build === true) {
        status.sysd.vpnStatus.on = true
    } else {
        status.sysd.vpnStatus.on = false;
    }
    
    let allIps = [] 
    allIps.push(os.networkInterfaces());
    status.systemInfo.interfaceInfo = allIps;

    console.log(vpnLogs.length);

}

// run construct function to build object
setInterval(()=>{
    constructObj();
}, 3000);


// Wanted to save function even though this has been replaced at the moment
// I decided to just send the file in csv format inside the status Object

// const readVpnStatusLogs = async(file) => {
//     const vpnStatusLog = await csv().fromFile(file);
//     await console.log('Reading csv as object:');
//     const newStatusLog = await vpnStatusLog.map(row => Object.values(row).join(' '));
//     status.logs.openvpn.stats = newStatusLog;
//     await status.logs.openvpn.stats.forEach(element => {
//         console.log(element);
//     });

// }