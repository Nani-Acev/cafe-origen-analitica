const { generarVentas } = require('./generador');
const { generarReporte, revisarReporte } = require('./reporte');
const reporteV01 = require('./reporte-v01');

const repeticiones = 5;

function medir(funcion, datos) {
  funcion(datos);
  const tiempos = [];
  let longitud = 0;
  for (let vuelta = 0; vuelta < repeticiones; vuelta++) {
    const inicio = process.hrtime.bigint();
    const reporte = funcion(datos);
    tiempos.push(Number(process.hrtime.bigint() - inicio) / 1e6);
    longitud = reporte.length;
  }
  tiempos.sort((a, b) => a - b);
  return { ms: Number(tiempos[Math.floor(tiempos.length / 2)].toFixed(2)), longitud };
}

const filas = [];
for (const n of [10_000, 100_000]) {
  const datos = generarVentas(n);
  const versionAnterior = medir((ventas) => {
    const texto = reporteV01.generarReporte(ventas);
    reporteV01.revisarReporte(texto, ventas);
    return texto;
  }, datos);
  const versionActual = medir((ventas) => {
    const texto = generarReporte(ventas);
    revisarReporte(texto, ventas);
    return texto;
  }, datos);
  filas.push({
    ventas: n,
    'v0.1 (ms)': versionAnterior.ms,
    'v1.0 (ms)': versionActual.ms,
    'mejora (%)': Number((((versionAnterior.ms - versionActual.ms) / versionAnterior.ms) * 100).toFixed(1)),
    'caracteres v1.0': versionActual.longitud,
  });
}

console.log(`Mediana de ${repeticiones} ejecuciones; incluye generar y validar el texto, excluye escritura a stdout.`);
console.log('Línea base: src/reporte-v01.js (reporte previo); ambas versiones usan el mismo arreglo por tamaño.');
console.table(filas);
