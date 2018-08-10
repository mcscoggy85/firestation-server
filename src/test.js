const Tail = require('tail').Tail;
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

// es6 promise-child-process-lib
const cp = require('child-process-es6-promise');

const runCmd4 = async(cmd) => {
    try {
        const {stdout, stderr} = await cp.exec(cmd)
        return stdout
    } catch(err) {
        if (err.code === 3){
            const build = "He's dead Jim..."
            return build
        }
        
    }
}

(async() => {
    // const test = 
    // console.log(test);
    status.sysd.vpnStatus.build = await runCmd4('systemctl status ssh');
    console.log(status.sysd.vpnStatus.build);
    status.sysd.vpnStatus.on = status.sysd.vpnStatus.build.includes('\(running\)')
    console.log(status.sysd.vpnStatus.on);
})();
// serviceStatus('ssh');

// (async()=>{
//     status.sysd.openpvpn.build = runCmd2('ls /home');
//     console.log(status.sysd.openpvpn.build);
// })();