function limpiarTexto(texto) {
  if (typeof texto !== 'string') return '';
  return texto.normalize('NFC').trim().replace(/\s+/g, ' ');
}

function claveTexto(texto) {
  return limpiarTexto(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function tieneTildes(texto) {
  return /[\u0300-\u036f]/.test(limpiarTexto(texto).normalize('NFD'));
}

function formatearNombreLugar(texto) {
  const conectores = ['de', 'del', 'la', 'las', 'los', 'y', 'e'];
  const limpio = limpiarTexto(texto).toLowerCase();
  if (limpio === '') return '';

  const palabras = [];
  let posicion = 0;
  for (const palabra of limpio.split(' ')) {
    const esConector = posicion > 0 && conectores.includes(palabra);
    palabras.push(esConector ? palabra : palabra.charAt(0).toUpperCase() + palabra.slice(1));
    posicion++;
  }
  return palabras.join(' ');
}

function cantidadDe(venta) {
  if (!venta) return 0;
  const cantidad = Number(venta.cantidad);
  return Number.isFinite(cantidad) ? cantidad : 0;
}

function precioDe(venta) {
  if (!venta) return 0;
  const precio = Number(venta.precio);
  return Number.isFinite(precio) ? precio : 0;
}

function valorVenta(venta) {
  return cantidadDe(venta) * precioDe(venta);
}

function esVentaValida(venta) {
  return cantidadDe(venta) > 0;
}

function contarVentasValidas(ventas) {
  let validas = 0;
  for (const venta of ventas) {
    if (esVentaValida(venta)) validas++;
  }
  return validas;
}

function totalVendido(ventas) {
  let total = 0;
  for (const venta of ventas) {
    total += valorVenta(venta);
  }
  return total;
}

function unidadesVendidas(ventas) {
  let unidades = 0;
  for (const venta of ventas) {
    unidades += cantidadDe(venta);
  }
  return unidades;
}

function ventaMayor(ventas) {
  let mayor = null;
  let valorMayor = 0;
  for (const venta of ventas) {
    if (!esVentaValida(venta)) continue;
    const valor = valorVenta(venta);
    if (mayor === null || valor > valorMayor) {
      mayor = venta;
      valorMayor = valor;
    }
  }
  return mayor;
}

function ticketPromedio(ventas) {
  let total = 0;
  let validas = 0;
  for (const venta of ventas) {
    if (!esVentaValida(venta)) continue;
    total += valorVenta(venta);
    validas++;
  }
  if (validas === 0) return 0;
  return total / validas;
}

function ventasPorCiudad(ventas, ciudad) {
  const buscada = claveTexto(ciudad);
  if (buscada === '') return 0;

  let total = 0;
  for (const venta of ventas) {
    if (venta && claveTexto(venta.ciudad) === buscada) {
      total += valorVenta(venta);
    }
  }
  return total;
}

function totalVendidoM(ventas) {
  let total = 0;
  for (const venta of ventas) total += valorVenta(venta);
  return total;
}

function unidadesVendidasM(ventas) {
  let unidades = 0;
  for (const venta of ventas) unidades += cantidadDe(venta);
  return unidades;
}

function ventasPorCiudadM(ventas, ciudad) {
  const buscada = claveTexto(ciudad);
  if (buscada === '') return 0;

  let total = 0;
  for (const venta of ventas) {
    if (venta && claveTexto(venta.ciudad) === buscada) total += valorVenta(venta);
  }
  return total;
}

function totalPorCiudad(ventas) {
  const grupos = {};
  for (const venta of ventas) {
    if (!venta) continue;
    const clave = claveTexto(venta.ciudad);
    const nombre = clave === '' ? 'Sin ciudad' : formatearNombreLugar(venta.ciudad);

    if (!grupos[clave]) {
      grupos[clave] = { nombre, total: 0 };
    } else if (!tieneTildes(grupos[clave].nombre) && tieneTildes(nombre)) {
      grupos[clave].nombre = nombre;
    }
    grupos[clave].total += valorVenta(venta);
  }

  const resultado = {};
  for (const clave of Object.keys(grupos)) {
    const grupo = grupos[clave];
    resultado[grupo.nombre] = grupo.total;
  }
  return resultado;
}

function agruparPorProducto(ventas) {
  const grupos = {};
  for (const venta of ventas) {
    if (!venta) continue;
    const clave = claveTexto(venta.producto);
    if (!grupos[clave]) {
      grupos[clave] = {
        producto: limpiarTexto(venta.producto) || 'Sin producto',
        unidades: 0,
        valor: 0,
      };
    }
    grupos[clave].unidades += cantidadDe(venta);
    grupos[clave].valor += valorVenta(venta);
  }
  return grupos;
}

function unidadesPorProducto(ventas) {
  const grupos = agruparPorProducto(ventas);
  const resultado = {};
  for (const clave of Object.keys(grupos)) {
    const grupo = grupos[clave];
    resultado[grupo.producto] = grupo.unidades;
  }
  return resultado;
}

function topProductosPorValor(ventas, k = 3) {
  const limite = Number(k);
  if (!Number.isInteger(limite) || limite <= 0) return [];

  const grupos = agruparPorProducto(ventas);
  const productos = [];
  for (const clave of Object.keys(grupos)) productos.push({ ...grupos[clave] });
  productos.sort((a, b) => b.valor - a.valor || a.producto.localeCompare(b.producto, 'es'));
  return productos.slice(0, limite);
}

function ventasOrdenadasPorValor(ventas) {
  return [...ventas].sort((a, b) => valorVenta(b) - valorVenta(a));
}

function esFechaValida(fecha) {
  const texto = limpiarTexto(fecha);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const fechaReal = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(fechaReal.getTime()) && fechaReal.toISOString().slice(0, 10) === texto;
}

function ventasDelDia(ventas, fecha) {
  const buscada = limpiarTexto(fecha);
  const delDia = [];
  for (const venta of ventas) {
    if (venta && limpiarTexto(venta.fecha) === buscada) delDia.push(venta);
  }
  const validas = contarVentasValidas(delDia);

  return {
    fecha: buscada,
    fechaValida: esFechaValida(buscada),
    registros: delDia.length,
    ventasValidas: validas,
    unidades: unidadesVendidas(delDia),
    total: totalVendido(delDia),
    ticketPromedio: ticketPromedio(delDia),
    ventaMayor: ventaMayor(delDia),
    hayVentas: validas > 0,
  };
}

module.exports = {
  limpiarTexto,
  claveTexto,
  tieneTildes,
  formatearNombreLugar,
  cantidadDe,
  precioDe,
  esVentaValida,
  contarVentasValidas,
  valorVenta,
  totalVendido,
  unidadesVendidas,
  ventaMayor,
  ticketPromedio,
  ventasPorCiudad,
  totalVendidoM,
  unidadesVendidasM,
  ventasPorCiudadM,
  totalPorCiudad,
  unidadesPorProducto,
  topProductosPorValor,
  ventasOrdenadasPorValor,
  esFechaValida,
  ventasDelDia,
};


