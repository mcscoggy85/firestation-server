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

// const readServicFile = async (cmd) => {
//     const serviceStatus = await runCmd(cmd);
//     status.sysd.vpnStatus.build = serviceStatus;
//     // serviceStatus.search(regex1) ? status.sysd.vpnStatus.on = true : status.sysd.vpnStatus.on = false;
//     console.log(status);
// }

// const { exec, spawn, fork, execFile } = require('promisify-child-process');

// exec('find . -type f | wc -l', (err, stdout, stderr) => {
//   if (err) {
//     console.error(`exec error: ${err}`);
//     return;
//   }

//   console.log(`Number of files ${stdout}`);
// });

//original
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

// new promis-child-process
const exec = require('child-process-promise').exec

const runCmd2 = async(cmd) => {
    exec(cmd).then(result => {
        const stdout = result.stdout;
        const stderr = result.stderr;
        console.log(stdout);
        return stdout
    }).catch(err => {
        console.error('STDERR',err.stderr, err.code);
        return err.code
    });
}

const serviceStatus = async(service) => {
    exec(`systemctl status ${service}`).then(result => {
        const stdout = result.stdout;
        const stderr = result.stderr;
        console.log(stdout);
        return stdout
    }).catch(err => {
        console.error('STDERR', err.code);
        return err.code
    });
}
// runCmd('ls /home');
// readServicFile('systemctl status ssh');
runCmd2('ls /home');
serviceStatus('ssh');