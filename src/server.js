const fs = require('fs-extra');
// const csv = require('csvtojson');
const cors = require('cors');
const bodyParser = require('body-parser');
const Tail = require('tail').Tail;
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
  }
};

app.listen(3000, ()=>{
    console.log('The server is running on port 3000....')
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
    // setInterval(()=> {
    //     constructObj(response);
    // }, 3000);
    response.json(status);

});

// Read OpenVPN Status logs from csv, place them into status Object
const readCsvLogs = async(file) => {
    const vpnStatusLogs = await fs.readFile(file);
    status.logs.openvpn.stats = vpnStatusLogs.toString();
}
// Get SystemD Status of Openvpn, using /etc/issue right now as placeholder
const setVpnSystemdStatus = async (file) => {
    const contents = await fs.readFile(file);
    const data = await contents.toString();
    status.sysd.vpnStatus.build = data;
    status.sysd.vpnStatus.on = data.includes('Linux Mint');
}

// Run shell command
const execCommand = (cmd) => {
    shell.exec(cmd);
}

// run shell command Tail
const tailFile = (file) => {
    const tail = new Tail(file);

    tail.on('line', (data)=> {
        vpnLogs.push(data);
        console.log(vpnLogs);
    });

    tail.on('error', (error)=> console.log(error));
}

// append logs to status obj
// const getVpnLogs = (file) => {
//     tail(file).then(data => {
//         status.logs.openvpn.log = data
//         console.log(status.logs.openvpn.log);
//     }).catch(err => console.log(err));

// }

// Construct the array to send as a response to the client
const constructObj = async() => {
    await tailFile('/home/mrcoggsworth85/code/javascript/firestation-server/src/openvpn.log');
    // await tailFile('/home/mrcoggsworth85/code/javascript/firestation-server/src/openvpn-status.log');
    await setVpnSystemdStatus('/etc/issue');
    await readCsvLogs('/home/mrcoggsworth85/code/javascript/firestation-server/src/openvpn-status.log');
    // await response.json(status);
    // getVpnLogs('/home/mrcoggsworth85/code/javascript/firestation-server/src/openvpn-status.log');
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