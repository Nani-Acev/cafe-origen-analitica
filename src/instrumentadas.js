const { claveTexto, formatearNombreLugar, valorVenta } = require('./analitica');

function contarOperacion(contador) {
  if (!contador || typeof contador !== 'object') {
    throw new TypeError('Debes pasar un objeto contador.');
  }
  if (!Number.isFinite(contador.operaciones)) contador.operaciones = 0;
  contador.operaciones++;
}

function totalVendidoInstrumentado(ventas, contador) {
  let total = 0;
  for (const venta of ventas) {
    contarOperacion(contador); // visita de un registro
    total += valorVenta(venta);
  }
  return total;
}

function ventaMayorInstrumentada(ventas, contador) {
  let mayor = null;
  let valorMayor = 0;

  for (const venta of ventas) {
    contarOperacion(contador); // visita de un registro
    contarOperacion(contador); // comparación de existencia del registro
    if (!venta) continue;
    contarOperacion(contador); // comparación de cantidad > 0
    if (!(Number(venta.cantidad) > 0)) continue;

    const valor = valorVenta(venta);
    contarOperacion(contador); // comparación con null para inicializar el máximo
    if (mayor === null) {
      mayor = venta;
      valorMayor = valor;
      continue;
    }

    contarOperacion(contador); // comparación con el máximo actual
    if (valor > valorMayor) {
      mayor = venta;
      valorMayor = valor;
    }
  }

  return mayor;
}

function totalPorCiudadInstrumentado(ventas, contador) {
  const grupos = {};

  for (const venta of ventas) {
    contarOperacion(contador); // visita de un registro
    contarOperacion(contador); // comparación de existencia del registro
    if (!venta) continue;

    const clave = claveTexto(venta.ciudad);
    contarOperacion(contador); // comprobación de si el grupo ya existe
    if (!Object.prototype.hasOwnProperty.call(grupos, clave)) {
      contarOperacion(contador); // comparación para elegir el nombre visible
      grupos[clave] = {
        nombre: clave === '' ? 'Sin ciudad' : formatearNombreLugar(venta.ciudad),
        total: 0,
      };
    }
    grupos[clave].total += valorVenta(venta);
  }

  const resultado = {};
  for (const clave of Object.keys(grupos)) {
    contarOperacion(contador); // visita de un grupo para formar el resultado
    resultado[grupos[clave].nombre] = grupos[clave].total;
  }
  return resultado;
}

function primeraVentaInstrumentada(ventas, contador) {
  contarOperacion(contador); // comparación de longitud con cero
  if (ventas.length === 0) return null;
  contarOperacion(contador); // acceso al primer elemento
  return ventas[0];
}

module.exports = {
  totalVendidoInstrumentado,
  ventaMayorInstrumentada,
  totalPorCiudadInstrumentado,
  primeraVentaInstrumentada,
};
