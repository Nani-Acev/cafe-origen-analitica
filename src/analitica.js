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

function totalCiudadCadena(ventas, ciudad) {
  const buscada = claveTexto(ciudad);
  if (buscada === '') return 0;

  return ventas
    .map((venta) => ({ ciudad: claveTexto(venta.ciudad), venta }))
    .filter((item) => item.ciudad === buscada)
    .map((item) => valorVenta(item.venta))
    .reduce((total, valor) => total + valor, 0);
}

function totalCiudadUnaPasada(ventas, ciudad) {
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
  return ventas
    .map((venta) => valorVenta(venta))
    .reduce((total, valor) => total + valor, 0);
}

function unidadesVendidasM(ventas) {
  return ventas
    .map((venta) => cantidadDe(venta))
    .reduce((unidades, cantidad) => unidades + cantidad, 0);
}

function ventasPorCiudadM(ventas, ciudad) {
  const buscada = claveTexto(ciudad);
  if (buscada === '') return 0;

  return ventas
    .filter((venta) => Boolean(venta) && claveTexto(venta.ciudad) === buscada)
    .map((venta) => valorVenta(venta))
    .reduce((total, valor) => total + valor, 0);
}

function totalPorCiudad(ventas) {
  const grupos = ventas.reduce((acumulado, venta) => {
    if (!venta) return acumulado;
    const clave = claveTexto(venta.ciudad);
    const nombre = clave === '' ? 'Sin ciudad' : formatearNombreLugar(venta.ciudad);

    if (!acumulado[clave]) {
      acumulado[clave] = { nombre, total: 0 };
    } else if (!tieneTildes(acumulado[clave].nombre) && tieneTildes(nombre)) {
      acumulado[clave].nombre = nombre;
    }
    acumulado[clave].total += valorVenta(venta);
    return acumulado;
  }, {});

  return Object.fromEntries(
    Object.entries(grupos).map(([, grupo]) => [grupo.nombre, grupo.total])
  );
}

function agruparPorProducto(ventas) {
  return ventas.reduce((grupos, venta) => {
    if (!venta) return grupos;
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
    return grupos;
  }, {});
}

function unidadesPorProducto(ventas) {
  return Object.fromEntries(
    Object.entries(agruparPorProducto(ventas)).map(([, grupo]) => [grupo.producto, grupo.unidades])
  );
}

function topProductosPorValor(ventas, k = 3) {
  const limite = Number(k);
  if (!Number.isInteger(limite) || limite <= 0) return [];

  return Object.entries(agruparPorProducto(ventas))
    .map(([, grupo]) => ({ ...grupo }))
    .sort((a, b) => b.valor - a.valor || a.producto.localeCompare(b.producto, 'es'))
    .slice(0, limite);
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
  const delDia = ventas.filter(
    (venta) => Boolean(venta) && limpiarTexto(venta.fecha) === buscada
  );
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

function clientesRecurrentes(ventas) {
  const recurrentes = [];
  for (let i = 0; i < ventas.length; i++) {
    for (let j = i + 1; j < ventas.length; j++) {
      if (
        ventas[i].cliente === ventas[j].cliente &&
        !recurrentes.includes(ventas[i].cliente)
      ) {
        recurrentes.push(ventas[i].cliente);
      }
    }
  }
  return recurrentes;
}

function clientesRecurrentesSet(ventas) {
  const vistos = new Set();
  const recurrentes = new Set();

  for (const venta of ventas) {
    const cliente = venta.cliente;
    if (vistos.has(cliente)) {
      recurrentes.add(cliente);
    } else {
      vistos.add(cliente);
    }
  }

  const resultado = new Array(recurrentes.size);
  let indice = 0;
  for (const cliente of recurrentes) resultado[indice++] = cliente;
  return resultado;
}

function comprasPorCliente(ventas) {
  const compras = new Map();

  for (const venta of ventas) {
    const cliente = venta.cliente;
    if (compras.has(cliente)) {
      compras.set(cliente, compras.get(cliente) + 1);
    } else {
      compras.set(cliente, 1);
    }
  }

  return compras;
}

function clientesRecurrentesMap(ventas) {
  const compras = comprasPorCliente(ventas);
  const recurrentes = [];

  for (const [cliente, cantidad] of compras) {
    if (cantidad > 1) recurrentes.push(cliente);
  }

  return recurrentes;
}

function comboRegaloBruta(catalogo, valor) {
  for (let i = 0; i < catalogo.length; i++) {
    for (let j = i + 1; j < catalogo.length; j++) {
      if (catalogo[i].precio + catalogo[j].precio === valor) {
        return [catalogo[i], catalogo[j]];
      }
    }
  }
  return null;
}

function comboRegalo(catalogo, valor) {
  const productosPorPrecio = new Map();

  for (const producto of catalogo) {
    const complemento = valor - producto.precio;
    if (productosPorPrecio.has(complemento)) {
      return [productosPorPrecio.get(complemento), producto];
    }
    productosPorPrecio.set(producto.precio, producto);
  }

  return null;
}

function productoEstrellaPorCiudad(ventas) {
  const conteosPorCiudad = new Map();

  for (const venta of ventas) {
    const claveCiudad = claveTexto(venta.ciudad);
    const claveProducto = claveTexto(venta.producto);
    let ciudad = conteosPorCiudad.get(claveCiudad);

    if (!ciudad) {
      ciudad = {
        nombre: claveCiudad ? formatearNombreLugar(venta.ciudad) : 'Sin ciudad',
        productos: new Map(),
      };
      conteosPorCiudad.set(claveCiudad, ciudad);
    }

    const producto = ciudad.productos.get(claveProducto);
    if (producto) {
      producto.apariciones++;
    } else {
      ciudad.productos.set(claveProducto, {
        nombre: limpiarTexto(venta.producto) || 'Sin producto',
        apariciones: 1,
      });
    }
  }

  const estrellas = [];
  for (const [ciudad, conteos] of conteosPorCiudad) {
    let estrella = null;
    for (const producto of conteos.productos.values()) {
      // En empate se conserva el primer producto encontrado en esa ciudad.
      if (estrella === null || producto.apariciones > estrella.apariciones) {
        estrella = producto;
      }
    }
    if (estrella !== null) {
      estrellas.push({
        ciudad: conteos.nombre || (ciudad ? formatearNombreLugar(ciudad) : 'Sin ciudad'),
        producto: estrella.nombre,
        apariciones: estrella.apariciones,
      });
    }
  }

  return estrellas;
}

function primerClienteUnico(ventas) {
  const comprasPorCliente = new Map();

  for (const venta of ventas) {
    const cliente = venta.cliente;
    const compras = comprasPorCliente.get(cliente) || 0;
    comprasPorCliente.set(cliente, compras + 1);
  }

  for (const venta of ventas) {
    if (comprasPorCliente.get(venta.cliente) === 1) return venta.cliente;
  }

  return null;
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
  totalCiudadCadena,
  totalCiudadUnaPasada,
  totalVendidoM,
  unidadesVendidasM,
  ventasPorCiudadM,
  totalPorCiudad,
  unidadesPorProducto,
  topProductosPorValor,
  ventasOrdenadasPorValor,
  esFechaValida,
  ventasDelDia,
  clientesRecurrentes,
  clientesRecurrentesSet,
  comprasPorCliente,
  clientesRecurrentesMap,
  comboRegaloBruta,
  comboRegalo,
  productoEstrellaPorCiudad,
  primerClienteUnico,
};


