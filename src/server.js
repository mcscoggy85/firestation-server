const fs = require('fs-extra');
// const csv = require('csvtojson');
const cors = require('cors');
const bodyParser = require('body-parser');
const Tail = require('tail').Tail;
const { exec, spawn, fork, execFile } = require('promisify-child-process');
const ip = require('ip');
const os = require('os');
const express = require('express');
const app = express();

let vpnLogs =[];

const status = {
  sysd: {
    vpnStatus: {
        build: {},
        on: null,

    },
    deviceStatus: {

    }
  },
  logs: {
      openvpn: {
          stats: {},
          logs: vpnLogs
      },
      firehole: {
          iptables: {}
      }
  },
  systemInfo: {
      interfaceInfo : null
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
// Get SystemD Status of Openvpn, using /etc/issue right now as placeholder
const setVpnBuild = async (cmd) => {
    const serviceStatus = await runCmd(cmd);
    status.sysd.vpnStatus.build = serviceStatus;
    console.log(status);
}

// Run shell command
const runCmd = async(cmd) => {
    try {
        const {stdout, stderr, code, exitCode} = await exec(cmd)
        console.log(exitCode);
        return stdout;
        
    } catch(err) {
        console.log(err.code);
        if (err.code === 3){
            console.log('pooop')
        }
        return err.stdout;
    }
}

// keep track of openpvn logs to view
// need to add logic to only show so many lines at one time
const tailFile = (file) => {
    const tail = new Tail(file);

    tail.on('line', (data)=> {
        vpnLogs.push(data);
        // console.log(vpnLogs);
    });

    tail.on('error', (error)=> console.log(error));
}

const getHostIp = async() => {
    return await ip.address();
}

const getAllInterfaceIP = async() => {
    return os.networkInterfaces();
}
// Construct the array to send as a response to the client
const constructObj = async() => {
    await tailFile('/home/mrcoggsworth85/code/javascript/firestation-server/src/openvpn.log');
    await readCsvLogs('/home/mrcoggsworth85/code/javascript/firestation-server/src/openvpn-status.log');
    await setVpnBuild('systemctl status ssh');
    const ipaddr = await getHostIp();
    // console.log(ipaddr);

    let allIps = [] 
    allIps.push(os.networkInterfaces());
    status.systemInfo.interfaceInfo = allIps;
    // console.log(status.systemInfo.interfaceInfo[0]);
    

    const regex1 = new RegExp('\(running\)');
    if (status.sysd.vpnStatus.build.search(regex1)) {
        status.sysd.vpnStatus.on = true
    }
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