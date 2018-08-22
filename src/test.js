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

app.post('/vpn', (request, response) => {
    const { ca, cert, key, ta } = request.body;
    
    (async()=> {
      const confFileConstruction = await readSysFile('/home/mrcoggsworth85/code/javascript/firestation-server/src/client-conf').then(data => {
        const conf = data.toString();
        const newConf = conf.replace('number1', `<ca>${ca}</ca>`);
        const newConf2 = newConf.replace('number2', `<cert>${cert}</cert>`);
        const newConf3 = newConf2.replace('number3', `<key>${key}</key>`);
        const newConf4 = newConf3.replace('number4', `<ta>${ta}</ta>`);
        return newConf4
      }).catch(err => {
        console.log(err)
      });
      console.log(confFileConstruction);
      writeSysFile('/home/mrcoggsworth85/code/javascript/firestation-server/src/client.conf', confFileConstruction);
    })();
  
    response.json('conf file complete.....')
    
  });

  app.post('/vpn', async(request, response) => {
    const { ca, cert, key, ta } = request.body;
    try {
        const data = readSysFile('/home/mrcoggsworth85/code/javascript/firestation-server/src/client-conf')
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
  