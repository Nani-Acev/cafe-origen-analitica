const { performance } = require('node:perf_hooks');
const { ventas: ventasMuestra } = require('./datos');
const { generarVentas } = require('./generador');
const { clientesRecurrentes } = require('./analitica');

const esperados = ['C01', 'C02', 'C03'];
const encontrados = clientesRecurrentes(ventasMuestra);
console.log('Clientes recurrentes en la muestra:', encontrados);
if (JSON.stringify(encontrados) !== JSON.stringify(esperados)) {
  throw new Error(`Se esperaba ${esperados.join(', ')}.`);
}

const tamanos = process.argv.length > 2
  ? process.argv.slice(2).map(Number)
  : [1000, 2000, 4000, 8000, 16000];
if (tamanos.some((n) => !Number.isInteger(n) || n < 1)) {
  throw new RangeError('Los tamaños deben ser enteros positivos.');
}
const resultados = [];

for (const n of tamanos) {
  const ventas = generarVentas(n);
  const etiqueta = `clientesRecurrentes n=${n}`;
  console.time(etiqueta);
  const inicio = performance.now();
  clientesRecurrentes(ventas);
  const milisegundos = performance.now() - inicio;
  console.timeEnd(etiqueta);
  resultados.push({ n, milisegundos: Number(milisegundos.toFixed(3)) });
}

console.log('\nResumen de tiempos (ms):');
console.table(resultados);
