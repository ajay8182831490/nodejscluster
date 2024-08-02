import express from 'express';
import cluster from 'cluster';
import os from 'os';

const app = express();
const cpuCount = os.cpus().length;

if (cluster.isMaster) {
    console.log(`Primary ${process.pid} is running`);


    for (let i = 0; i < cpuCount; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {

        // console.log(worker)
        console.log(`Worker ${worker.process.pid} exited with code: ${code}, signal: ${signal}`);


        if (code !== 0) {
            console.log(`Worker ${worker.process.pid} crashed and will be restarted...`);
        } else {
            console.log(`Worker ${worker.process.pid} completed its task gracefully.`);
        }


        const newWorker = cluster.fork();
        console.log(`New worker ${newWorker.process.pid} started`);
    });

    // Handle termination signals
    const shutdown = () => {
        console.log('Shutting down the cluster...');
        for (const id in cluster.workers) {
            console.log(`Sending shutdown signal to worker ${id}`);
            cluster.workers[id].send('shutdown');
        }
        setTimeout(() => {
            console.log('Forcing shutdown...');
            process.exit(0);
        }, 5000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
} else {

    app.get('/', (req, res) => {
        res.send(`Hello from worker ${process.pid}`);
    });

    app.listen(3000, () => {
        console.log(`Worker ${process.pid} started`);
    });

    // Handle shutdown message from primary process
    // process.on('message', (msg) => {
    //     if (msg === 'shutdown') {
    //         console.log(`Worker ${process.pid} shutting down...`);
    //         process.exit(0);
    //     }
    // });
}
