const { generarVentas } = require('./generador');
const {
  totalVendidoInstrumentado,
  ventaMayorInstrumentada,
  totalPorCiudadInstrumentado,
  primeraVentaInstrumentada,
} = require('./instrumentadas');

const tamanos = [100, 1000, 10000, 100000];
const resultados = [];

for (const n of tamanos) {
  const ventas = generarVentas(n);
  const contadorTotal = { operaciones: 0 };
  const contadorMayor = { operaciones: 0 };
  const contadorCiudad = { operaciones: 0 };
  const contadorPrimera = { operaciones: 0 };

  totalVendidoInstrumentado(ventas, contadorTotal);
  ventaMayorInstrumentada(ventas, contadorMayor);
  totalPorCiudadInstrumentado(ventas, contadorCiudad);
  primeraVentaInstrumentada(ventas, contadorPrimera);

  resultados.push({
    n,
    totalVendido: contadorTotal.operaciones,
    ventaMayor: contadorMayor.operaciones,
    totalPorCiudad: contadorCiudad.operaciones,
    primeraVenta: contadorPrimera.operaciones,
  });
}

console.log('Operaciones contadas: una visita, comparación o acceso contabilizado.');
console.table(resultados);
