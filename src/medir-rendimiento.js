const { performance } = require('node:perf_hooks');
const analitica = require('./analitica');
const { generarVentas } = require('./generador');
const instrumentadas = require('./instrumentadas');
const reporte = require('./reporte');

const n = 10000;
const ventas = generarVentas(n);
const fechaEjemplo = '2026-09-01';
const textoReporte = reporte.generarReporte(ventas);

function medirPromedio(tarea, repeticiones = 3) {
  tarea(); // calentamiento del motor de JavaScript
  const inicio = performance.now();
  for (let i = 0; i < repeticiones; i++) tarea();
  const promedio = (performance.now() - inicio) / repeticiones;
  return promedio < 0.001 ? '<0.001' : Number(promedio.toFixed(3));
}

const mediciones = [
  ['limpiarTexto (10k llamadas)', () => { for (const venta of ventas) analitica.limpiarTexto(venta.ciudad); }],
  ['claveTexto (10k llamadas)', () => { for (const venta of ventas) analitica.claveTexto(venta.ciudad); }],
  ['tieneTildes (10k llamadas)', () => { for (const venta of ventas) analitica.tieneTildes(venta.ciudad); }],
  ['formatearNombreLugar (10k llamadas)', () => { for (const venta of ventas) analitica.formatearNombreLugar(venta.ciudad); }],
  ['cantidadDe (10k llamadas)', () => { for (const venta of ventas) analitica.cantidadDe(venta); }],
  ['precioDe (10k llamadas)', () => { for (const venta of ventas) analitica.precioDe(venta); }],
  ['esVentaValida (10k llamadas)', () => { for (const venta of ventas) analitica.esVentaValida(venta); }],
  ['valorVenta (10k llamadas)', () => { for (const venta of ventas) analitica.valorVenta(venta); }],
  ['contarVentasValidas', () => analitica.contarVentasValidas(ventas)],
  ['totalVendido', () => analitica.totalVendido(ventas)],
  ['unidadesVendidas', () => analitica.unidadesVendidas(ventas)],
  ['ventaMayor', () => analitica.ventaMayor(ventas)],
  ['ticketPromedio', () => analitica.ticketPromedio(ventas)],
  ['ventasPorCiudad', () => analitica.ventasPorCiudad(ventas, 'Bogotá')],
  ['totalCiudadCadena', () => analitica.totalCiudadCadena(ventas, 'Bogotá')],
  ['totalCiudadUnaPasada', () => analitica.totalCiudadUnaPasada(ventas, 'Bogotá')],
  ['totalVendidoM', () => analitica.totalVendidoM(ventas)],
  ['unidadesVendidasM', () => analitica.unidadesVendidasM(ventas)],
  ['ventasPorCiudadM', () => analitica.ventasPorCiudadM(ventas, 'Bogotá')],
  ['totalPorCiudad', () => analitica.totalPorCiudad(ventas)],
  ['unidadesPorProducto', () => analitica.unidadesPorProducto(ventas)],
  ['topProductosPorValor', () => analitica.topProductosPorValor(ventas, 3)],
  ['ventasOrdenadasPorValor', () => analitica.ventasOrdenadasPorValor(ventas)],
  ['esFechaValida (10k llamadas)', () => { for (let i = 0; i < n; i++) analitica.esFechaValida(fechaEjemplo); }],
  ['ventasDelDia', () => analitica.ventasDelDia(ventas, fechaEjemplo)],
  ['clientesRecurrentes', () => analitica.clientesRecurrentes(ventas)],
  ['clientesRecurrentesSet', () => analitica.clientesRecurrentesSet(ventas)],
  ['comprasPorCliente', () => analitica.comprasPorCliente(ventas)],
  ['clientesRecurrentesMap', () => analitica.clientesRecurrentesMap(ventas)],
  ['totalVendidoInstrumentado', () => instrumentadas.totalVendidoInstrumentado(ventas, { operaciones: 0 })],
  ['ventaMayorInstrumentada', () => instrumentadas.ventaMayorInstrumentada(ventas, { operaciones: 0 })],
  ['totalPorCiudadInstrumentado', () => instrumentadas.totalPorCiudadInstrumentado(ventas, { operaciones: 0 })],
  ['primeraVentaInstrumentada', () => instrumentadas.primeraVentaInstrumentada(ventas, { operaciones: 0 })],
  ['generarVentas', () => generarVentas(n)],
  ['generarReporte (fechas predeterminadas)', () => reporte.generarReporte(ventas)],
  ['revisarReporte', () => reporte.revisarReporte(textoReporte, ventas)],
];

const resultados = [];
for (const [funcion, tarea] of mediciones) {
  resultados.push({ funcion, promedioMs: medirPromedio(tarea) });
}

console.log('Muestra aleatoria de 10.000 ventas; promedio de 3 ejecuciones tras una de calentamiento.');
console.table(resultados);

const contadores = {
  totalVendido: { operaciones: 0 },
  ventaMayor: { operaciones: 0 },
  totalPorCiudad: { operaciones: 0 },
  primeraVenta: { operaciones: 0 },
};
instrumentadas.totalVendidoInstrumentado(ventas, contadores.totalVendido);
instrumentadas.ventaMayorInstrumentada(ventas, contadores.ventaMayor);
instrumentadas.totalPorCiudadInstrumentado(ventas, contadores.totalPorCiudad);
instrumentadas.primeraVentaInstrumentada(ventas, contadores.primeraVenta);
console.log('Contadores instrumentados para 10.000 ventas:');
console.table(Object.entries(contadores).map(([funcion, contador]) => ({
  funcion,
  operaciones: contador.operaciones,
})));

const totalesCiudad = {
  cadena: analitica.totalCiudadCadena(ventas, 'Bogotá'),
  unaPasada: analitica.totalCiudadUnaPasada(ventas, 'Bogotá'),
};
if (totalesCiudad.cadena !== totalesCiudad.unaPasada) {
  throw new Error('Las dos versiones de total de ciudad no coinciden.');
}
console.log('Coincidencia de totalCiudad (Bogotá, 10.000 ventas):', totalesCiudad.cadena);
