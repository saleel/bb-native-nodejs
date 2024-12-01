import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
// import pako from 'pako';
import { CompiledCircuit, InputMap, Noir } from '@noir-lang/noir_js';
import { splitHonkProof } from '@aztec/bb.js';

async function generateProof(inputs: InputMap, bbPath: string, circuitJsonPath: string, witnessOutputPath: string, proofOutputPath: string) {
    // const circuit = fs.readFileSync(circuitPath, 'utf8');
    // const noir = new Noir(JSON.parse(circuit) as CompiledCircuit);
    // const { witness } = await noir.execute(inputs);
    // const witnessGz = await pako.gzip(witness); // THIS IS NOT WORKING
    // await fs.writeFileSync(witnessOutputPath, witnessGz);

    // Generate witness using nargo
    // Write inputs to Prover.toml
    const toml = `x = ${inputs.x}\ny = ${inputs.y}`;
    await fs.writeFileSync(path.join(__dirname, '../circuits/Prover.toml'), toml);
    const nargoProcess = spawn('nargo', ['execute'], { cwd: path.join(__dirname, '../circuits') });

    nargoProcess.stdout.on('data', (data: string) => {
      console.log(`stdout: ${data}`);
    });

    await new Promise((resolve, reject) => {
      nargoProcess.on('close', resolve);
    });

    const args = [
      'prove_ultra_honk',
      '-b', path.normalize(circuitJsonPath),
      '-w', path.normalize(witnessOutputPath),
      '-o', path.normalize(proofOutputPath)
    ];

    const bbProcess = spawn(path.normalize(bbPath), args);
    bbProcess.stdout.on('data', (data: string) => {
      console.log(`stdout: ${data}`);
    });

    bbProcess.stderr.on('data', (data: string) => {
      console.error(`stderr: ${data}`);
    });

    await new Promise((resolve, reject) => {
      bbProcess.on('close', (code: number) => {
        if (code === 0) {
          resolve(0);
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });
    });

    bbProcess.on('error', (err) => {
      throw new Error(`Failed to start process: ${err.message}`);
    });
}

const pathToBB = process.env.BB_PATH || path.join(process.env.HOME as string, '.bb/bb');
const circuitPath = path.join(__dirname, '../circuits/target/noir_bb_sample.json');
const witnessOutputPath = path.join(__dirname, '../circuits/target/noir_bb_sample.gz');
const proofOutputPath = path.join(__dirname, '../circuits/target/proof');

const inputs = { x: "3", y: "3" };

generateProof(inputs, pathToBB, circuitPath, witnessOutputPath, proofOutputPath)
  .then(() => {
    console.log('Proof generated successfully')

    const proofRaw = fs.readFileSync(proofOutputPath);
    const proofWithPublicInputs = splitHonkProof(proofRaw);
    console.log(proofWithPublicInputs);

  })
  .catch((err) => console.error('Error generating proof:', err));
