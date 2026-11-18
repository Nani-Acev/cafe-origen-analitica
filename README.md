# Café Origen · Motor de analítica v1.0

Motor de consola para explorar ventas de Café Origen y producir un resumen comercial. Incluye indicadores, agrupaciones, rankings, análisis de clientes y una comparación de opciones de regalo. Está implementado en JavaScript con Node.js y módulos CommonJS; no requiere dependencias externas.

## Requisitos

- Node.js LTS instalado (Node 22 o posterior).
- Git solo si se desea clonar el repositorio.
- No hace falta ejecutar `npm install`.

## Inicio rápido

Clona el repositorio e ingresa a su carpeta:

```bash
git clone https://github.com/Nani-Acev/cafe-origen-analitica.git
cd cafe-origen-analitica
```

Ejecuta el reporte con las 12 ventas de ejemplo:

```bash
node src/reporte.js
```

Para generar un historial sintético y analizar, por ejemplo, 100.000 ventas:

```bash
node src/reporte.js 100000
```

También puedes pedir el resumen de fechas concretas con los datos de ejemplo o con un conjunto generado:

```bash
node src/reporte.js 2026-09-05
node src/reporte.js 100000 2026-09-05 2026-09-07
```

El comando muestra resumen general, ventas por ciudad, unidades por producto, top 3 por valor, resumen diario, clientes recurrentes, producto estrella por ciudad, combo de regalo, cliente para cupón y mejor semana disponible. Si el historial tiene menos de siete días, la sección semanal lo indica.

## Preguntas que responde

- ¿Cuánto se vendió, cuántas unidades salieron y cuál fue la compra más grande?
- ¿Cuál es el ticket promedio de las ventas válidas?
- ¿Qué ciudades y productos generaron más ventas o unidades?
- ¿Qué productos forman un combo que suma exactamente $87.000?
- ¿Qué clientes compraron más de una vez y cuál es el primer cliente con una sola compra?
- ¿Cuál es el producto más frecuente de cada ciudad?
- ¿Cuál fue la mejor ventana de siete días consecutivos?
- ¿Qué par de productos queda más cerca de un presupuesto sin superarlo? La función está disponible para consultar desde el módulo analítico.

## Comprobaciones y mediciones

```bash
node src/explorar.js
node src/pruebas.js
node src/verificar.js
node src/ventanas.js
node src/recurrentes.js
node src/medir.js
node src/medir-rendimiento.js
node src/medir-versiones.js
```

`medir-versiones.js` compara el reporte de referencia v0.1 con v1.0 a 10.000 y 100.000 ventas, usando el mismo conjunto aleatorio por tamaño. `ventanas.js` también verifica la coincidencia de fuerza bruta y ventana deslizante con 100.000 días. Los tiempos son mediciones de una máquina y pueden variar.

## Estructura del proyecto

```text
src/
├── datos.js                 Muestra original de 12 ventas
├── catalogo.js              Catálogo y precios
├── generador.js             Generadores de ventas y totales diarios
├── analitica.js             Funciones de cálculo y optimización
├── reporte.js               Reporte final v1.0 para consola
├── reporte-v01.js            Línea base del reporte para comparación
├── explorar.js              Exploración inicial de los datos
├── pruebas.js               Pruebas de indicadores básicos
├── verificar.js             Comparación de ciclos y métodos
├── ventanas.js              Pruebas de ventanas y dos punteros
├── recurrentes.js           Comparación de clientes recurrentes
├── medir.js                 Conteo de operaciones
├── medir-rendimiento.js     Mediciones analíticas del motor
└── medir-versiones.js       Comparación del reporte v0.1 y v1.0

bitacora.md                  Diccionario, decisiones, trazas y cierre
RENDIMIENTO.md               Complejidades, mediciones y proyecciones
```

## Decisiones sobre los datos

- `datos.js` conserva la muestra tal como se exportó; las funciones normalizan textos al comparar.
- El valor de una línea es `cantidad × precio`; una línea con cantidad cero aporta cero y no entra al ticket promedio.
- Los clientes recurrentes se cuentan con `Map`, y la versión cuadrática queda como referencia de aprendizaje, no se usa en el reporte final.
- La semana se calcula sobre fechas consecutivas; los días sin ventas se completan con total cero.
- Las funciones de ordenamiento trabajan sobre copias y conservan los arreglos fuente.

El análisis completo, las trazas y las decisiones están en [`bitacora.md`](bitacora.md). La clasificación de tiempo y memoria y las mediciones están en [`RENDIMIENTO.md`](RENDIMIENTO.md).
