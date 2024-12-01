const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { splitHonkProof } = require('@aztec/bb.js');

async function generateProof(bbPath, bytecodeJsonPath, witnessPath, proofOutputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      'prove_ultra_honk',
      '-b', path.normalize(bytecodeJsonPath),
      '-w', path.normalize(witnessPath),
      '-o', path.normalize(proofOutputPath)
    ];

    const process = spawn(path.normalize(bbPath), args);
    process.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    process.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    process.on('error', (err) => {
      reject(new Error(`Failed to start process: ${err.message}`));
    });
  });
}

const pathToBB = process.env.BB_PATH || path.join(process.env.HOME, '.bb/bb');
const circuitPath = path.join(__dirname, '../circuits/target/noir_bb_sample.json');
const witnessPath = path.join(__dirname, '../circuits/target/noir_bb_sample.gz');
const proofOutputPath = path.join(__dirname, '../circuits/target/proof');

generateProof(pathToBB, circuitPath, witnessPath, proofOutputPath)
  .then(() => {
    console.log('Proof generated successfully')

    const proofRaw = fs.readFileSync(proofOutputPath);
    const proofWithPublicInputs = splitHonkProof(proofRaw);
    console.log(proofWithPublicInputs);

  })
  .catch((err) => console.error('Error generating proof:', err));
