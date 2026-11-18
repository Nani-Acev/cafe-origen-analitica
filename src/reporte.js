const { ventas: ventasReales } = require('./datos');
const { generarVentas } = require('./generador');
const { catalogo } = require('./catalogo');
const {
  claveTexto,
  valorVenta,
  contarVentasValidas,
  totalVendido,
  unidadesVendidas,
  ventaMayor,
  ticketPromedio,
  totalPorCiudad,
  unidadesPorProducto,
  topProductosPorValor,
  ventasDelDia,
  comprasPorCliente,
  productoEstrellaPorCiudad,
  comboRegalo,
  primerClienteUnico,
  mejorSemana,
} = require('./analitica');

const ANCHO = 64;
const FECHAS_POR_DEFECTO = ['2026-09-04', '2026-09-07'];

function pesos(valor) {
  return Number(valor).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function numero(valor) {
  return Number(valor).toLocaleString('es-CO');
}

function porcentaje(parte, total) {
  if (total === 0) return '0,0 %';
  return `${((parte / total) * 100).toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
}

function titulo(texto) {
  return ['', texto, '─'.repeat(ANCHO)];
}

function dato(etiqueta, valor) {
  return `  ${`${etiqueta} `.padEnd(34, '.')} ${valor}`;
}

function tabla(columnas, filas, pie) {
  const todas = pie ? [...filas, pie] : filas;
  const anchos = columnas.map((col) =>
    Math.max(col.titulo.length, ...todas.map((fila) => String(fila[col.clave]).length))
  );
  const celda = (texto, i) =>
    columnas[i].derecha ? String(texto).padStart(anchos[i]) : String(texto).padEnd(anchos[i]);
  const linea = (fila) => `  ${columnas.map((col, i) => celda(fila[col.clave], i)).join('   ')}`;
  const separador = `  ${anchos.map((ancho) => '-'.repeat(ancho)).join('   ')}`;

  const resultado = [`  ${columnas.map((col, i) => celda(col.titulo, i)).join('   ')}`, separador];
  for (const fila of filas) resultado.push(linea(fila));
  if (pie) resultado.push(separador, linea(pie));
  return resultado;
}

function describirVenta(venta) {
  if (venta === null) return 'Sin ventas válidas';
  return `#${venta.id} · ${venta.producto} · ${pesos(valorVenta(venta))}`;
}

function seccionResumen(datos) {
  let primeraFecha = null;
  let ultimaFecha = null;
  for (const venta of datos) {
    if (!venta || !venta.fecha) continue;
    if (primeraFecha === null || venta.fecha < primeraFecha) primeraFecha = venta.fecha;
    if (ultimaFecha === null || venta.fecha > ultimaFecha) ultimaFecha = venta.fecha;
  }
  const periodo = primeraFecha === null ? 'Sin datos' : `${primeraFecha} a ${ultimaFecha}`;
  const validas = contarVentasValidas(datos);

  return [
    ...titulo('1. RESUMEN GENERAL'),
    dato('Periodo', periodo),
    dato('Registros', numero(datos.length)),
    dato('Ventas válidas (cantidad > 0)', numero(validas)),
    dato('Registros sin unidades', numero(datos.length - validas)),
    dato('Unidades vendidas', numero(unidadesVendidas(datos))),
    dato('Total vendido', pesos(totalVendido(datos))),
    dato('Ticket promedio', pesos(ticketPromedio(datos))),
    dato('Venta más grande', describirVenta(ventaMayor(datos))),
  ];
}

function seccionCiudades(datos) {
  const total = totalVendido(datos);
  const filas = Object.entries(totalPorCiudad(datos))
    .sort(([, a], [, b]) => b - a)
    .map(([ciudad, valor]) => ({ ciudad, valor: pesos(valor), part: porcentaje(valor, total) }));

  if (filas.length === 0)
    return [...titulo('2. VENTAS POR CIUDAD'), '  No hay ventas registradas.'];
  return [
    ...titulo('2. VENTAS POR CIUDAD'),
    ...tabla(
      [
        { titulo: 'Ciudad', clave: 'ciudad' },
        { titulo: 'Total', clave: 'valor', derecha: true },
        { titulo: 'Participación', clave: 'part', derecha: true },
      ],
      filas,
      { ciudad: 'TOTAL', valor: pesos(total), part: porcentaje(total, total) }
    ),
  ];
}

function seccionProductos(datos) {
  const filas = Object.entries(unidadesPorProducto(datos))
    .sort(([prodA, a], [prodB, b]) => b - a || prodA.localeCompare(prodB, 'es'))
    .map(([producto, unidades]) => ({ producto, unidades: numero(unidades) }));

  if (filas.length === 0)
    return [...titulo('3. UNIDADES POR PRODUCTO'), '  No hay ventas registradas.'];
  return [
    ...titulo('3. UNIDADES POR PRODUCTO'),
    ...tabla(
      [
        { titulo: 'Producto', clave: 'producto' },
        { titulo: 'Unidades', clave: 'unidades', derecha: true },
      ],
      filas,
      { producto: 'TOTAL', unidades: numero(unidadesVendidas(datos)) }
    ),
  ];
}

function seccionTop(datos) {
  const filas = topProductosPorValor(datos, 3).map((item, i) => ({
    puesto: `${i + 1}.`,
    producto: item.producto,
    unidades: numero(item.unidades),
    valor: pesos(item.valor),
  }));

  if (filas.length === 0)
    return [...titulo('4. TOP 3 PRODUCTOS POR VALOR'), '  No hay ventas registradas.'];
  return [
    ...titulo('4. TOP 3 PRODUCTOS POR VALOR'),
    ...tabla(
      [
        { titulo: '#', clave: 'puesto' },
        { titulo: 'Producto', clave: 'producto' },
        { titulo: 'Unidades', clave: 'unidades', derecha: true },
        { titulo: 'Valor', clave: 'valor', derecha: true },
      ],
      filas
    ),
  ];
}

function seccionDias(datos, fechas) {
  const lineas = [...titulo('5. RESUMEN POR DÍA')];
  for (const fecha of fechas) {
    const dia = ventasDelDia(datos, fecha);
    lineas.push('', `  Día ${dia.fecha || '(sin fecha)'}`);

    if (!dia.fechaValida) {
      lineas.push(
        `  Fecha no válida. Use el formato AAAA-MM-DD, por ejemplo ${FECHAS_POR_DEFECTO[0]}.`
      );
      continue;
    }
    if (!dia.hayVentas) {
      lineas.push('  No se registraron ventas este día.');
    }
    lineas.push(
      dato('Registros', numero(dia.registros)),
      dato('Ventas válidas', numero(dia.ventasValidas)),
      dato('Unidades vendidas', numero(dia.unidades)),
      dato('Total vendido', pesos(dia.total)),
      dato('Ticket promedio', pesos(dia.ticketPromedio)),
      dato('Venta más grande', describirVenta(dia.ventaMayor))
    );
  }
  return lineas;
}

function seccionClientesRecurrentes(datos) {
  const conteos = comprasPorCliente(datos);
  const principales = [];
  let totalRecurrentes = 0;
  for (const [cliente, cantidad] of conteos) {
    if (cantidad <= 1) continue;
    totalRecurrentes++;
    const candidato = { cliente, cantidad };
    const posicion = principales.findIndex((actual) =>
      candidato.cantidad > actual.cantidad ||
      (candidato.cantidad === actual.cantidad && candidato.cliente.localeCompare(actual.cliente) < 0)
    );
    if (posicion >= 0 && posicion < 10) principales.splice(posicion, 0, candidato);
    else if (principales.length < 10) principales.push(candidato);
    if (principales.length > 10) principales.pop();
  }
  const filas = principales.map(({ cliente, cantidad }) => ({ cliente, compras: numero(cantidad) }));
  return [
    ...titulo('6. CLIENTES RECURRENTES'),
    `  Clientes recurrentes: ${numero(totalRecurrentes)}${totalRecurrentes > 10 ? ' (muestra de los 10 con más compras)' : ''}`,
    ...(filas.length
      ? tabla(
          [{ titulo: 'Cliente', clave: 'cliente' }, { titulo: 'Compras', clave: 'compras', derecha: true }],
          filas.slice(0, 10)
        )
      : ['  No hay clientes con más de una compra.']),
  ];
}

function seccionEstrellaPorCiudad(datos) {
  const estrellas = productoEstrellaPorCiudad(datos);
  return [
    ...titulo('7. PRODUCTO ESTRELLA POR CIUDAD'),
    ...(estrellas.length
      ? tabla([
          { titulo: 'Ciudad', clave: 'ciudad' },
          { titulo: 'Producto', clave: 'producto' },
          { titulo: 'Ventas', clave: 'apariciones', derecha: true },
        ], estrellas)
      : ['  No hay ventas registradas.']),
  ];
}

function seccionComboRegalo() {
  const combo = comboRegalo(catalogo, 87000);
  const productos = combo
    ? combo.map((item) => `${item.producto} (${pesos(item.precio)})`).join(' + ')
    : 'No hay dos productos que sumen $87.000.';
  return [
    ...titulo('8. COMBO DE REGALO SUGERIDO'),
    `  Presupuesto de tarjeta: ${pesos(87000)}`,
    `  ${productos}`,
    ...(combo ? [`  Total: ${pesos(combo.reduce((suma, item) => suma + item.precio, 0))}`] : []),
  ];
}

function seccionClienteCupon(datos) {
  const cliente = primerClienteUnico(datos);
  return [
    ...titulo('9. CLIENTE PARA CUPÓN DE REGRESO'),
    `  ${cliente || 'No hay clientes con una sola compra.'}`,
  ];
}

function sumarPorFecha(datos) {
  const totales = new Map();
  for (const venta of datos) {
    if (!venta || !/^\d{4}-\d{2}-\d{2}$/.test(venta.fecha)) continue;
    totales.set(venta.fecha, (totales.get(venta.fecha) || 0) + valorVenta(venta));
  }
  const fechas = [...totales.keys()].sort();
  if (fechas.length === 0) return [];

  const fecha = new Date(`${fechas[0]}T00:00:00Z`);
  const ultima = fechas[fechas.length - 1];
  const dias = [];
  const fechasContinuas = [];
  while (fecha.toISOString().slice(0, 10) <= ultima) {
    const texto = fecha.toISOString().slice(0, 10);
    fechasContinuas.push(texto);
    dias.push(totales.get(texto) || 0);
    fecha.setUTCDate(fecha.getUTCDate() + 1);
  }
  return { dias, fechas: fechasContinuas };
}

function seccionMejorSemana(datos) {
  const serie = sumarPorFecha(datos);
  const semana = serie.dias ? mejorSemana(serie.dias, 7) : null;
  if (!semana) {
    return [...titulo('10. MEJOR SEMANA'), '  Se requieren al menos siete días consecutivos de historial.'];
  }
  const inicio = serie.fechas[semana.diaInicio - 1];
  const fin = serie.fechas[semana.diaFin - 1];
  return [
    ...titulo('10. MEJOR SEMANA'),
    dato('Periodo', `${inicio} a ${fin}`),
    dato('Total vendido', pesos(semana.total)),
  ];
}

function generarReporte(datos, fechas = FECHAS_POR_DEFECTO) {
  const lineas = [
    '═'.repeat(ANCHO),
    '  CAFÉ ORIGEN · Reporte de ventas · v1.0',
    `  Generado: ${new Date().toLocaleDateString('es-CO')}`,
    '═'.repeat(ANCHO),
    ...seccionResumen(datos),
    ...seccionCiudades(datos),
    ...seccionProductos(datos),
    ...seccionTop(datos),
    ...seccionDias(datos, fechas),
    ...seccionClientesRecurrentes(datos),
    ...seccionEstrellaPorCiudad(datos),
    ...seccionComboRegalo(),
    ...seccionClienteCupon(datos),
    ...seccionMejorSemana(datos),
    '',
    '═'.repeat(ANCHO),
  ];
  return lineas.join('\n');
}

function revisarReporte(texto, datos) {
  const problemas = [];
  if (texto.includes('NaN')) problemas.push('El reporte contiene NaN.');
  if (texto.includes('undefined')) problemas.push('El reporte contiene undefined.');

  const claves = Object.keys(totalPorCiudad(datos)).map((ciudad) => claveTexto(ciudad));
  if (new Set(claves).size !== claves.length) problemas.push('Hay ciudades duplicadas.');
  return problemas;
}

if (require.main === module) {
  const argumentos = process.argv.slice(2);
  let datos = ventasReales;
  let fechas = FECHAS_POR_DEFECTO;
  if (argumentos[0] && /^\d+$/.test(argumentos[0])) {
    const cantidad = Number(argumentos.shift());
    if (!Number.isSafeInteger(cantidad)) {
      console.error('La cantidad debe ser un entero seguro.');
      process.exitCode = 1;
      return;
    }
    datos = generarVentas(cantidad);
  }
  if (argumentos.length > 0) fechas = argumentos;

  const reporte = generarReporte(datos, fechas);
  console.log(reporte);

  const problemas = revisarReporte(reporte, datos);
  if (problemas.length === 0) {
    console.log('  Verificación: sin NaN, sin undefined y sin ciudades duplicadas.\n');
  } else {
    console.log('  Verificación con problemas:');
    for (const problema of problemas) console.log(`  - ${problema}`);
    process.exitCode = 1;
  }
}

module.exports = { generarReporte, revisarReporte };
