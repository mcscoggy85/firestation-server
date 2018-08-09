const Tail = require('tail').Tail;
const execute = require('child_process').exec

let lines = [];

const status = {
    stats : {
        openpvpn: {
            active: Boolean
        }

    },
    logs : {
        openpvpn : {
            status : {},
            logs : lines
        }
    }
}

// const tailFile = (file) => {
    
//     const tail = new Tail(file);

//     tail.on('line', (data)=> {
//         lines.push(data);
//         console.log(status.logs.openpvpn.logs);
//         console.log(lines);
//     });

//     tail.on('error', (error)=> console.log(error));
// }
// tailFile('/home/mrcoggsworth85/code/javascript/firestation-server/src/test.log');

// Run shell command
const file = '/tmp/test'

const execCommand = (cmd) => {
    execute(cmd, (err, stdout, stderr) => {
        process.stdout.write(stdout);
    }); 
}

execCommand('systemctl status ssh > '+file);

