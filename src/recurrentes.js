const { performance } = require('node:perf_hooks');
const { ventas: ventasMuestra } = require('./datos');
const { generarVentas } = require('./generador');
const {
  clientesRecurrentes,
  clientesRecurrentesSet,
  comprasPorCliente,
  clientesRecurrentesMap,
} = require('./analitica');

function ordenar(clientes) {
  return [...clientes].sort();
}

function verificarIguales(nombre, ventas) {
  const esperado = ordenar(clientesRecurrentes(ventas));
  const conSet = ordenar(clientesRecurrentesSet(ventas));
  const conMap = ordenar(clientesRecurrentesMap(ventas));
  if (
    JSON.stringify(esperado) !== JSON.stringify(conSet) ||
    JSON.stringify(esperado) !== JSON.stringify(conMap)
  ) {
    throw new Error(`Las versiones no coinciden: ${nombre}.`);
  }
  console.log(`OK: las tres versiones coinciden para ${nombre} (${esperado.length} clientes).`);
}

verificarIguales('los datos del Día 1', ventasMuestra);
verificarIguales('5.000 ventas generadas', generarVentas(5000));
verificarIguales('arreglo vacío', []);
verificarIguales('un cliente repetido varias veces', [
  { cliente: 'C01' },
  { cliente: 'C01' },
  { cliente: 'C01' },
]);

const conteosEjemplo = comprasPorCliente([
  { cliente: 'C01' },
  { cliente: 'C02' },
  { cliente: 'C01' },
]);
if (conteosEjemplo.get('C01') !== 2 || conteosEjemplo.get('C02') !== 1) {
  throw new Error('comprasPorCliente no produjo los conteos esperados.');
}

function medir(nombre, funcion, ventas) {
  const etiqueta = `${nombre} n=${ventas.length}`;
  console.time(etiqueta);
  const inicio = performance.now();
  const resultado = funcion(ventas);
  const ms = performance.now() - inicio;
  console.timeEnd(etiqueta);
  return { version: nombre, n: ventas.length, milisegundos: Number(ms.toFixed(3)), clientes: resultado.length };
}

const resultados = [];
for (const n of [1000, 10000, 100000]) {
  const ventas = generarVentas(n);
  if (n <= 10000) resultados.push(medir('original', clientesRecurrentes, ventas));
  else {
    resultados.push({
      version: 'original',
      n,
      milisegundos: 'omitido (58,6 s medidos anteriormente)',
      clientes: '—',
    });
  }

  resultados.push(medir('Set', clientesRecurrentesSet, ventas));
  resultados.push(medir('Map', clientesRecurrentesMap, ventas));
}

console.log('\nComparación de rendimiento:');
console.table(resultados);
