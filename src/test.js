const Tail = require('tail').Tail;

let lines = [];

const status = {
    stats : {

    },
    logs : {
        openpvpn : {
            status : {},
            logs : lines
        }
    }
}

const tailFile = (file) => {
    
    const tail = new Tail(file);

    tail.on('line', (data)=> {
        lines.push(data);
        console.log(status.logs.openpvpn.logs);
        console.log(lines);
    });

    tail.on('error', (error)=> console.log(error));
}
tailFile('/home/mrcoggsworth85/code/javascript/firestation-server/src/test.log');
