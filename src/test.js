const Tail = require('tail').Tail;
// const { exec, spawn } = require('child-process-async');
const fs = require('fs-extra');

let lines = [];

const status = {
    stats : {
        openpvpn: {
            active: null
        }

    },
    logs : {
        openpvpn : {
            status : {},
            logs : lines
        }
    },
    sysd :{
        vpnStatus: {
            build: {},
            on: null
        }
    }
}

const readServicFile = async (cmd) => {
    const serviceStatus = await runCmd(cmd);
    status.sysd.vpnStatus.build = serviceStatus;
    // serviceStatus.search(regex1) ? status.sysd.vpnStatus.on = true : status.sysd.vpnStatus.on = false;
    console.log(status);
}

const { exec, spawn, fork, execFile } = require('promisify-child-process');

exec('find . -type f | wc -l', (err, stdout, stderr) => {
  if (err) {
    console.error(`exec error: ${err}`);
    return;
  }

  console.log(`Number of files ${stdout}`);
});

const runCmd = async(cmd) => {
    const child = exec(cmd);
    const {stdout, stderr} = await child
    
    if (stderr) {
        console.log(stderr)
    } else {
        const sshStatus = stdout;
        console.log(sshStatus);
        return sshStatus;
    }
    
}
// runCmd('ls /home');
readServicFile('systemctl status ssh');