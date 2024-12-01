echo "Compiling circuit..."
if ! nargo compile; then
    echo "Compilation failed. Exiting..."
    exit 1
fi

echo "Gate count:"
bb gates -b target/noir_bb_sample.json | jq  '.functions[0].circuit_size'

# Create version-specific directory
mkdir -p "../ui/assets"

echo "Copying circuit.json to app/assets..."
cp target/noir_bb_sample.json "../ui/assets/circuit.json"

echo "Generating vkey..."
bb write_vk_ultra_honk -b ./target/noir_bb_sample.json -o ./target/vk

echo "Generating vkey.json to app/assets..."
node -e "const fs = require('fs'); fs.writeFileSync('../ui/assets/circuit-vkey.json', JSON.stringify(Array.from(Uint8Array.from(fs.readFileSync('./target/vk')))));"

echo "Done"
