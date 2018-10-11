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
const axios = require('axios');
const jwt = require('jsonwebtoken');

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

const user = {
    usersloggedIn : [],
    validEmail : [
      'chris.scogin@dsisolutions.biz', 
      'charlie.stamp@dsisolutions.biz', 
      'ben.cramer@dsisolutions.biz']
};


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
        logs: vpnLogs,
        testlog: {}
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
  const pubKey = await readSysFile('/home/mrcoggsworth85/code/javascript/firestation-server/src/pub.key')
  const userToken = await verifyToken(request, response);
  
  jwt.verify(userToken, pubKey, (err, decode) => {
    response.json({
      response: decode
    });
  });
  
  
});

// Send response object to the status page for front end to use to create data
app.get('/status',(request, response) => {
  constructObj();
  
  response.json(status);

});

// Send a response to the home page
app.post('/login', async(request, response) => {
  const pvk = await readSysFile('/home/mrcoggsworth85/code/javascript/firestation-server/src/pub.key');
  
  const { userData, tokenData } = request.body;
  console.log(request.body);
  
  if (request.body === ''){
    return
  } else {
    user.usersloggedIn.push(request.body); 
  };

  console.log(userData.email);

  if (user.validEmail.includes(userData.email)){
    console.log('Continue....')
    axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${tokenData.id_token}`)
    .then(res => {
      console.log(res.data.email_verified);
      console.log(res.data.hd);
      if (res.data.email_verified && res.data.hd === 'dsisolutions.biz') {
        console.log('Keep going...');
        
        // const pub = await readSysFile('./pub.key');
        try {
          const payload = {
            id : userData.googleId,
            userName : userData.email,
            googleToken : tokenData.id_token 
          };

          jwt.sign({payload}, pvk, 
            { 
              expiresIn: '1h'
             }, (err, fsToken)=> {
              response.json({
                token: fsToken
              });
          });
        }catch(err){
          response.json({
            response: 'error'
          });
        };
        
      };
    }).catch(err => console.log(err));
  };
});

// get form request from body, read the temp openvpn conf file, place body into temp file, write to final conf file
app.post('/vpn', async(request, response) => {
  const { ipaddr, ca, cert, key, ta } = request.body;
  try {
        const data = await readSysFile('/etc/openvpn/client-conf')
        const newConf = data.toString()
          .replace('Public-IP', ipaddr )
          .replace('CertificatAuthority', `<ca>\n${ca}\n</ca>`)
          .replace('ClientCertificate', `<cert>\n${cert}\n</cert>`)
          .replace('ClientKey', `<key>\n${key}\n</key>`)
          .replace('TLS-Authentication', `<ta>\n${ta}\n</ta>`);
        console.log(newConf);
        writeSysFile('/etc/openvpn/client.conf', newConf);
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
    const data = await readSysFile('/etc/firehol/firehol-conf')
    const newConf = data.toString()
      .replace('local_Nets', `"${localNets}"`)
      .replace('proxy_Nets', `"${proxyNets}"`)
      .replace('local_IP', localIP)
      .replace('openVpn_IP', openVpnIP);
    console.log(newConf);
    writeSysFile('/etc/firehol/firehol.conf', newConf);
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

const verifyToken = (req, res) => {
  const bearerHeader = req.headers['authorization'];
  console.log('TOKEN-HEADERS >>>> ',req.headers);
  console.log('BEARERHEADER >>> ',bearerHeader)
  console.log(typeof bearerHeader);
  if (typeof bearerHeader !== 'undefined'){

  } else {
    return res.sendStatus(403)
  }
  const bearer = bearerHeader.split(' ');
  const userToken = bearer[1];
  return userToken

  

};

const readSysFile = async (file) => {
  try {
    const confFile = await fs.readFile(file);
    return confFile
  } catch(err) {
    console.log(err, 'file or folder does not exist...')
  }
  
};

const writeSysFile = async (file, contents) => {
  try{
    const newFile = await fs.outputFile(file, contents);
  }catch(err){
    console.log(err);
  }
};


// Read OpenVPN Status logs from csv, place them into status Object
const readCsvLogs = async(file) => {
    const vpnStatusLogs = await fs.readFile(file);
    status.logs.openvpn.stats = vpnStatusLogs.toString();
};

// Read the firewall config file called firehol.conf
const readFirewallConfig = async(file) => {
    const fwConfig = await fs.readFile(file);
    status.firehol.config = fwConfig.toString();
};

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
};

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
};

// keep track of openpvn logs to view
const tailOpenVpn = (file) => {
    const tail = new Tail(file);

    tail.on('line', (data)=> {
        vpnLogs.push(data);
        console.log(vpnLogs);
        if (vpnLogs.length >= 50) {
            vpnLogs.shift();
        }

    });

    tail.on('error', (error)=> console.log(error));
};

const tailSysLog = (file) => {
  const tail = new Tail(file);

  tail.on('line', (data)=> {
      syslog.push(data);
      if (syslog.length >= 50) {
          syslog.shift();
      }

  });

  tail.on('error', (error)=> console.log(error));
};

const sysdStatusChecker = async(statusObj) => {
    if (statusObj.build === true) {
        statusObj.on = true
    } else {
        statusObj.on = false;
    }
};

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
    const vpnstat = status.sysd.vpnStatus;
    const fwStat = status.sysd.firewall;
    const sysStatusInfo = status.systemInfo;
    
    // await tailSysLog('/var/log/syslog');
    // await tailOpenVpn('/home/mrcoggsworth85/code/javascript/firestation-server/src/openvpn.log');
    await readCsvLogs('/var/log/openvpn/openvpn-status.log');
    
    vpnstat.build = await sysdStatus('ssh');
    fwStat.build = await sysdStatus('firehol');
    
    await sysdStatusChecker(vpnstat);
    await sysdStatusChecker(fwStat);
    
    let allIps = [];
    allIps.push(os.networkInterfaces());
    status.systemInfo.interfaceInfo = allIps;
    
    await readFirewallConfig('/etc/firehol/firehol.conf');
    status.firehol.ipTables = await runCmd('sudo iptables -L');

    await systemsInformation(sysStatusInfo);

};
tailSysLog('/var/log/syslog');
tailOpenVpn('/var/log/openvpn/openvpn.log');