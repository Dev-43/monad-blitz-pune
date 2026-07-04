import fs from 'fs';

const file = 'node_modules/@x402/core/dist/cjs/x402Client-CdmxbRFj.d.ts';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('type PaymentPayloadResult') || line.includes('interface PaymentPayloadResult')) {
    console.log(`Line ${idx + 1}: ${line}`);
    console.log(lines.slice(idx, idx + 10).join('\n'));
  }
});
