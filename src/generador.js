const productos = [
  { producto: 'Origen Huila 500 g', precio: 42000 },
  { producto: 'Origen Nariño 250 g', precio: 26000 },
  { producto: 'Prensa francesa', precio: 95000 },
  { producto: 'Origen Sierra 500 g', precio: 45000 },
  { producto: 'Molino manual', precio: 120000 },
];

const ciudades = ['Medellín', 'Bogotá', 'Cali', 'Pereira'];

function enteroAleatorio(minimo, maximo) {
  return Math.floor(Math.random() * (maximo - minimo + 1)) + minimo;
}

function generarVentas(n) {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError('La cantidad de ventas debe ser un entero mayor o igual a 0.');
  }

  const cantidadClientes = Math.max(1, Math.floor(n / 3));
  const ventas = [];

  for (let indice = 1; indice <= n; indice++) {
    const productoElegido = productos[enteroAleatorio(0, productos.length - 1)];
    ventas.push({
      id: indice,
      fecha: `2026-09-${String(enteroAleatorio(1, 30)).padStart(2, '0')}`,
      cliente: `C${String(enteroAleatorio(1, cantidadClientes)).padStart(2, '0')}`,
      producto: productoElegido.producto,
      ciudad: ciudades[enteroAleatorio(0, ciudades.length - 1)],
      cantidad: enteroAleatorio(1, 5),
      precio: productoElegido.precio,
    });
  }

  return ventas;
}

module.exports = { generarVentas };
