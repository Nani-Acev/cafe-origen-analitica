const assert = require('node:assert/strict');
const { catalogo } = require('./catalogo');
const { generarVentasDiarias } = require('./generador');
const { mejorSemanaBruta, mejorSemana, parMasCercano } = require('./analitica');

const ventasDiariasSeptiembre = [
  320, 410, 280, 390, 510, 620, 700, 300, 290, 450,
  480, 530, 610, 680, 350, 330, 420, 470, 560, 640,
  710, 380, 360, 440, 500, 590, 650, 720, 400, 370,
];

function medir(nombre, funcion) {
  const inicio = process.hrtime.bigint();
  const resultado = funcion();
  const milisegundos = Number(process.hrtime.bigint() - inicio) / 1e6;
  return { nombre, milisegundos: Number(milisegundos.toFixed(3)), resultado };
}

const semanaBrutaSeptiembre = mejorSemanaBruta(ventasDiariasSeptiembre, 7);
const semanaSeptiembre = mejorSemana(ventasDiariasSeptiembre, 7);
assert.deepEqual(semanaSeptiembre, semanaBrutaSeptiembre);
console.log('Mejor semana de septiembre (miles de COP):');
console.table([semanaSeptiembre]);

const diasAleatorios = generarVentasDiarias(100_000);
const medicionBruta = medir('Fuerza bruta', () => mejorSemanaBruta(diasAleatorios, 7));
const medicionVentana = medir('Ventana deslizante', () => mejorSemana(diasAleatorios, 7));
assert.deepEqual(medicionVentana.resultado, medicionBruta.resultado);
console.log('\nComparación con 100.000 días aleatorios (k = 7):');
console.table([
  { version: medicionBruta.nombre, milisegundos: medicionBruta.milisegundos },
  { version: medicionVentana.nombre, milisegundos: medicionVentana.milisegundos },
]);
console.log('Resultados coinciden: OK');

const preciosOriginales = catalogo.map((producto) => producto.precio).join(',');
const pruebasPresupuesto = [100_000, 140_000, 40_000].map((presupuesto) => {
  const resultado = parMasCercano(catalogo, presupuesto);
  assert.ok(resultado === null || resultado.total <= presupuesto);
  return {
    presupuesto,
    productos: resultado ? resultado.productos.map((p) => p.producto).join(' + ') : 'Sin combinación',
    total: resultado ? resultado.total : null,
  };
});
assert.equal(catalogo.map((producto) => producto.precio).join(','), preciosOriginales);
assert.equal(pruebasPresupuesto[2].productos, 'Sin combinación');
console.log('\nPares dentro del presupuesto:');
console.table(pruebasPresupuesto);

const casosBorde = [
  ['k mayor que los días', mejorSemana([100, 200], 3) === null],
  ['k igual a 1', mejorSemana([100, 200, 150], 1).total === 200],
  ['arreglo vacío', mejorSemana([], 1) === null],
  ['presupuesto insuficiente', parMasCercano(catalogo, 40_000) === null],
];
for (const [caso, correcto] of casosBorde) {
  console.log(`${correcto ? 'OK' : 'FALLO'}: ${caso}`);
  assert.ok(correcto, caso);
}
