# Bitácora · Café Origen Analítica

Registro de análisis, decisiones y pruebas del proyecto. Cada sección corresponde a un MiniReto.

---

## MiniReto 1 · Primer tueste: el repositorio y los datos

### Qué representa cada registro

Cada objeto del arreglo `ventas` es una **línea de venta**: un cliente compró, en una fecha y una ciudad, cierta cantidad de un producto a un precio unitario. Un mismo cliente puede tener varias líneas (varias compras en días distintos).

Lo observado en la muestra: 12 registros, fechas del 2026-09-01 al 2026-09-06 (dos registros por día), 8 clientes distintos, 5 productos y 4 ciudades reales.

### Diccionario de datos

| Propiedad | Tipo | Significado | Ejemplo |
|---|---|---|---|
| `id` | number (entero) | Identificador único del registro. Va del 1 al 12, sin saltos ni repetidos. | `1` |
| `fecha` | string (`AAAA-MM-DD`) | Día de la venta. Es texto, no un objeto `Date`; el formato ISO permite compararlas y ordenarlas como texto. | `"2026-09-01"` |
| `cliente` | string | Código anónimo del cliente (C01 a C08). Se repite entre registros. | `"C01"` |
| `producto` | string | Nombre comercial del producto vendido. | `"Origen Huila 500 g"` |
| `ciudad` | string | Ciudad donde se registró la venta. Es texto libre, sin estandarizar. | `"Medellín"` |
| `cantidad` | number (entero) | Unidades vendidas en esa línea. | `2` |
| `precio` | number (entero, COP) | Precio **unitario** en pesos colombianos, sin decimales. | `42000` |

Campo derivado (no viene en los datos): **valor de la venta = cantidad × precio**. No existe un campo de total; hay que calcularlo. Con la muestra completa, la suma de esos valores es 985.000.

### Posición frente a índice

El reto pide el producto del registro "en la posición 4". La **posición** es conteo humano (1.º, 2.º, 3.º, 4.º) y el **índice** de un arreglo en JavaScript empieza en 0. Por eso:

| Posición (humano) | Índice (JS) | Registro | Producto |
|---|---|---|---|
| 1 | `ventas[0]` | id 1 | Origen Huila 500 g |
| 4 | `ventas[3]` | id 4 | **Origen Huila 500 g** |
| 5 | `ventas[4]` | id 5 | Origen Sierra 500 g |
| 12 (última) | `ventas[ventas.length - 1]` = `ventas[11]` | id 12 | Origen Nariño 250 g |

Regla: `índice = posición − 1`. Confundirlos es un error típico "por uno" (off-by-one): `ventas[4]` devuelve el quinto registro, no el cuarto, y `ventas[ventas.length]` devuelve `undefined`.

### Casos borde detectados

| # | Problema | Dónde | Riesgo | Decisión |
|---|---|---|---|---|
| 1 | Ciudad escrita de forma inconsistente | id 5: `"medellín"` (minúscula) frente a `"Medellín"` | Al agrupar aparecerían dos Medellín y una búsqueda por `"Medellín"` omitiría 135.000. | No se corrige en `datos.js`. Se normaliza al comparar y agrupar (quitar espacios sobrantes, minúsculas, sin tildes en la clave) y se muestra con la regla de negocio: primera letra en mayúscula y el resto en minúscula. |
| 2 | Cantidad en cero | id 8: C06, Cali, Origen Huila 500 g, `cantidad: 0`, `precio: 42000` | Si se cuenta como venta, infla el número de ventas y baja el ticket promedio. Puede ser una venta anulada o un error de captura. | Se conserva el registro. Aporta 0 al total y a las unidades, pero **no** es una venta válida: se excluye del ticket promedio y de la venta mayor. El reporte lo muestra como "registro sin unidades". |
| 3 | Clientes repetidos | C01 en ids 1, 4 y 11; C02 en ids 2 y 7; C03 en ids 3 y 9 | 12 registros no son 12 clientes (son 8). Confundir "ventas" con "clientes" daría un gasto por cliente incorrecto. | El ticket promedio se calcula por compra (registro válido), no por cliente. Si se pide gasto por cliente, se agrupa por `cliente`. |
| 4 | No hay total por registro | Todos | Sumar `precio` directamente ignora la cantidad (daría 646.000 y no 985.000). | Un único cálculo: `valorVenta(venta) = cantidad × precio`, usado por todas las funciones. |
| 5 | La fecha es texto | Todos | Comparar con formatos distintos (`"4/9/2026"`) no encontraría nada; restar fechas como texto no funciona. | Se compara el texto exacto (sin espacios sobrantes) y se valida el formato `AAAA-MM-DD` al consultar un día. |
| 6 | Espacios sobrantes en textos | No aparece en la muestra, pero es común al exportar | `"Bogotá"` y `"Bogotá "` serían ciudades distintas. | `trim()` y colapsar espacios internos antes de comparar. (El error reportado en el MiniReto 4 confirma este riesgo.) |

---

## MiniReto 2 · Los números del día: recorrer, filtrar y acumular

### Plan en pseudocódigo

Función auxiliar de normalización usada en las comparaciones:

```
normalizar(texto)
  quitar espacios al inicio y al final; dejar un solo espacio entre palabras
  pasar a minúsculas; quitar tildes
```

```
valorVenta(venta)
  RETORNAR venta.cantidad × venta.precio      (si falta un número, usar 0)

totalVendido(ventas)                           patrón ACUMULADOR
  total ← 0
  PARA CADA venta EN ventas
    total ← total + valorVenta(venta)
  RETORNAR total

unidadesVendidas(ventas)                       patrón ACUMULADOR
  unidades ← 0
  PARA CADA venta EN ventas
    unidades ← unidades + venta.cantidad
  RETORNAR unidades

ventaMayor(ventas)                             patrón MÁXIMO
  mayor ← null                                 (todavía no hay candidata)
  PARA CADA venta EN ventas
    SI venta.cantidad <= 0 → pasar a la siguiente
    SI mayor es null O valorVenta(venta) > valorVenta(mayor)
      mayor ← venta                            (se guarda el registro completo)
  RETORNAR mayor

ticketPromedio(ventas)                         ACUMULADOR + CONTADOR
  total ← 0 ; validas ← 0
  PARA CADA venta EN ventas
    SI venta.cantidad > 0
      total ← total + valorVenta(venta)
      validas ← validas + 1
  SI validas = 0 → RETORNAR 0                  (evita 0 / 0 = NaN)
  RETORNAR total / validas

ventasPorCiudad(ventas, ciudad)                ACUMULADOR con condición
  buscada ← normalizar(ciudad)
  SI buscada está vacía → RETORNAR 0
  total ← 0
  PARA CADA venta EN ventas
    SI normalizar(venta.ciudad) = buscada
      total ← total + valorVenta(venta)
  RETORNAR total
```

| Función | Qué recorre | Condición | Qué acumula | Valor inicial |
|---|---|---|---|---|
| `totalVendido` | todas las ventas | ninguna | valor de cada venta | `0` |
| `unidadesVendidas` | todas las ventas | ninguna | cantidad de cada venta | `0` |
| `ventaMayor` | todas las ventas | cantidad > 0 y valor mayor que el actual | el registro de mayor valor | `null` |
| `ticketPromedio` | todas las ventas | cantidad > 0 | valor total y número de ventas válidas | `0` y `0` |
| `ventasPorCiudad` | todas las ventas | ciudad normalizada = ciudad buscada | valor de cada venta que cumple | `0` |

### Comportamiento con el arreglo vacío (decisión documentada)

| Función | Con `[]` devuelve | Por qué |
|---|---|---|
| `totalVendido` | `0` | No se vendió nada. |
| `unidadesVendidas` | `0` | No salió ninguna unidad. |
| `ventaMayor` | `null` | No hay ningún registro que devolver; inventar uno sería falso. Quien la use debe revisar si es `null`. También devuelve `null` si todas las ventas tienen cantidad 0. |
| `ticketPromedio` | `0` | Dividir entre 0 ventas da `NaN`. Se decide que `0` significa "sin ventas válidas". |
| `ventasPorCiudad` | `0` | No hay ventas en ninguna ciudad. Una ciudad vacía también devuelve `0`. |
| `valorVenta(undefined)` | `0` | Un registro ausente no aporta valor. |

En empate de la venta mayor gana la primera encontrada (se usa `>` y no `>=`).

### Pruebas con tres entradas

Se ejecutan con `node src/pruebas.js` (incluye 17 comprobaciones automáticas). Como arreglo de un elemento se usa `[ventas[0]]`.

| Función | Completo (12) | Un elemento | Vacío |
|---|---|---|---|
| `totalVendido` | 985.000 | 84.000 | 0 |
| `unidadesVendidas` | 21 | 2 | 0 |
| `ventaMayor` | id 10 (168.000) | id 1 (84.000) | `null` |
| `ticketPromedio` | 89.545,45 | 84.000 | 0 |
| `ventasPorCiudad(…, "Medellín")` | 356.000 | 84.000 | 0 |

### Traza manual 1 · `totalVendido(ventas)`

| Iteración | id | cantidad × precio | valorVenta | total acumulado |
|---|---|---|---|---|
| inicio | | | | 0 |
| 1 | 1 | 2 × 42.000 | 84.000 | 84.000 |
| 2 | 2 | 1 × 26.000 | 26.000 | 110.000 |
| 3 | 3 | 1 × 95.000 | 95.000 | 205.000 |
| 4 | 4 | 1 × 42.000 | 42.000 | 247.000 |
| 5 | 5 | 3 × 45.000 | 135.000 | 382.000 |
| 6 | 6 | 2 × 26.000 | 52.000 | 434.000 |
| 7 | 7 | 1 × 120.000 | 120.000 | 554.000 |
| 8 | 8 | 0 × 42.000 | 0 | 554.000 |
| 9 | 9 | 2 × 45.000 | 90.000 | 644.000 |
| 10 | 10 | 4 × 42.000 | 168.000 | 812.000 |
| 11 | 11 | 1 × 95.000 | 95.000 | 907.000 |
| 12 | 12 | 3 × 26.000 | 78.000 | **985.000** |

Resultado del programa: `985000`. **Coincide.**

### Traza manual 2 · `ventasPorCiudad(ventas, "Medellín")`

`buscada = normalizar("Medellín") = "medellin"`

| id | ciudad original | normalizada | ¿coincide? | valorVenta | total |
|---|---|---|---|---|---|
| inicio | | | | | 0 |
| 1 | Medellín | medellin | sí | 84.000 | 84.000 |
| 2 | Bogotá | bogota | no | | 84.000 |
| 3 | Cali | cali | no | | 84.000 |
| 4 | Medellín | medellin | sí | 42.000 | 126.000 |
| 5 | **medellín** | medellin | **sí** | 135.000 | 261.000 |
| 6 | Bogotá | bogota | no | | 261.000 |
| 7 | Bogotá | bogota | no | | 261.000 |
| 8 | Cali | cali | no | | 261.000 |
| 9 | Cali | cali | no | | 261.000 |
| 10 | Pereira | pereira | no | | 261.000 |
| 11 | Medellín | medellin | sí | 95.000 | 356.000 |
| 12 | Bogotá | bogota | no | | **356.000** |

Resultado del programa: `356000`. **Coincide**, y confirma que la venta escrita como "medellín" se incluye.

### Traza manual 3 · `ventaMayor(ventas)`

| id | valor | ¿válida? | ¿mayor que el actual? | mayor después |
|---|---|---|---|---|
| inicio | | | | `null` |
| 1 | 84.000 | sí | sí (no había) | id 1 |
| 2 | 26.000 | sí | no | id 1 |
| 3 | 95.000 | sí | sí | id 3 |
| 4 | 42.000 | sí | no | id 3 |
| 5 | 135.000 | sí | sí | id 5 |
| 6 | 52.000 | sí | no | id 5 |
| 7 | 120.000 | sí | no | id 5 |
| 8 | 0 | **no** (cantidad 0) | se salta | id 5 |
| 9 | 90.000 | sí | no | id 5 |
| 10 | 168.000 | sí | sí | id 10 |
| 11 | 95.000 | sí | no | id 10 |
| 12 | 78.000 | sí | no | **id 10** |

Resultado del programa: registro con `id 10` (Origen Huila 500 g, Pereira, 4 × 42.000 = 168.000). **Coincide.**

Ticket promedio a mano: 985.000 ÷ 11 ventas válidas = 89.545,45. Resultado del programa: `89545.45454545454`. **Coincide.**

---

## MiniReto 3 · Del ciclo al método: rankings y agrupaciones

### Equivalencia ciclo ↔ método

`node src/verificar.js` compara cada par con tres conjuntos de datos (completo, un elemento y vacío) y siete búsquedas de ciudad (`"Medellín"`, `"  medellín "`, `"BOGOTÁ"`, `"Cali"`, `"Pereira"`, `"Cartagena"` y `""`). Resultado: **27/27 pares en OK** y 8/8 criterios adicionales en OK.

Por qué dan exactamente lo mismo:

- Las dos versiones usan las mismas funciones auxiliares (`valorVenta`, `cantidadDe`, `claveTexto`), así que no hay dos fórmulas distintas que puedan divergir.
- Todo `reduce` recibe valor inicial `0`. Sin valor inicial, `reduce` sobre `[]` lanza `TypeError` y sobre un arreglo de objetos sumaría objetos en lugar de números.
- Las dos versiones de `ventasPorCiudad` devuelven `0` ante una ciudad vacía antes de recorrer.

### Las cinco preguntas por función

| Función | ¿Qué recorro? | ¿Qué filtro? | ¿Qué transformo? | ¿Qué acumulo? | ¿Cómo agrupo? |
|---|---|---|---|---|---|
| `totalVendidoM` | `ventas` | nada | cada venta en su valor | suma de valores (`reduce`, inicio 0) | no agrupa |
| `unidadesVendidasM` | `ventas` | nada | cada venta en su cantidad | suma de unidades (`reduce`, inicio 0) | no agrupa |
| `ventasPorCiudadM` | `ventas` | ciudad normalizada = buscada (`filter`) | cada venta en su valor (`map`) | suma de valores (`reduce`, inicio 0) | no agrupa: es una sola ciudad |
| `totalPorCiudad` | `ventas` | nada (ciudad vacía va a "Sin ciudad") | ciudad en clave normalizada y nombre formateado; venta en valor | total por ciudad | objeto diccionario con clave = ciudad normalizada |
| `unidadesPorProducto` | `ventas` | nada | producto en clave normalizada; venta en cantidad | unidades por producto | objeto diccionario con clave = producto normalizado |
| `topProductosPorValor` | `ventas` y luego las entradas del diccionario (`Object.entries`) | nada; `slice(0, k)` se queda con los k primeros | cada grupo en `{ producto, unidades, valor }` | valor por producto | por producto; después ordena de mayor a menor (`sort` con función de comparación) |
| `ventasOrdenadasPorValor` | una copia `[...ventas]` | nada | nada | nada | no agrupa: solo ordena la copia |

### Regla de negocio para los nombres de ciudad

1. **Clave interna** (para comparar y agrupar): `normalize('NFC')`, `trim()`, colapsar espacios internos, `toLowerCase()` y quitar tildes. `"Medellín"`, `"medellín"`, `" MEDELLÍN "` y `"Medellin"` producen `"medellin"`.
2. **Nombre visible**: primera letra en mayúscula y el resto en minúscula, conservando tildes y ñ. `"medellín"` → `"Medellín"`, `"BOGOTÁ"` → `"Bogotá"`, `"ábrego"` → `"Ábrego"` (`toUpperCase` también convierte letras con tilde).
3. **Ciudades de varias palabras**: la regla se aplica a cada palabra, porque son nombres propios (`"santa   marta"` → `"Santa Marta"`). Los conectores `de, del, la, las, los, y, e` quedan en minúscula si no son la primera palabra (`"cartagena DE indias"` → `"Cartagena de Indias"`).
4. **Con y sin tilde**: si la misma ciudad llega como `"Medellin"` y `"Medellín"`, se agrupa una sola vez y se muestra la variante con tilde, sin importar cuál apareció primero.
5. **Unicode**: una "í" puede venir como un solo carácter o como "i" + tilde combinante (dos códigos). Se ven iguales pero `===` las considera distintas. `normalize('NFC')` las unifica antes de comparar.
6. **Vacía o no texto**: se agrupa como `"Sin ciudad"` para no perder dinero en el total.
7. **Limitación conocida**: al quitar las marcas en la clave, la ñ se iguala a la n (`"Peñol"` y `"Penol"` serían la misma clave). Se acepta para ciudades colombianas, donde no hay pares reales que se confundan.

### Ordenar sin modificar el original

`sort` modifica el arreglo sobre el que se llama. Por eso:

- `topProductosPorValor` ordena un arreglo **nuevo** creado con `Object.entries(...)` y `map`, nunca `ventas`.
- `ventasOrdenadasPorValor` copia con el operador de propagación (`[...ventas]`) antes de ordenar.
- `verificar.js` guarda los `id` antes de llamar las funciones y comprueba que el orden sea el mismo después.

### Resultados con la muestra

| Ciudad | Total |
|---|---|
| Medellín | 356.000 |
| Bogotá | 276.000 |
| Cali | 185.000 |
| Pereira | 168.000 |
| **Suma** | **985.000** (igual a `totalVendido`) |

| Puesto | Producto | Unidades | Valor |
|---|---|---|---|
| 1 | Origen Huila 500 g | 7 | 294.000 |
| 2 | Origen Sierra 500 g | 5 | 225.000 |
| 3 | Prensa francesa | 2 | 190.000 |

Unidades por producto: Origen Huila 500 g 7, Origen Nariño 250 g 6, Origen Sierra 500 g 5, Prensa francesa 2, Molino manual 1 (suma 21, igual a `unidadesVendidas`).

---

## MiniReto 4 · Analítica v0.1: el primer reporte

El reporte se genera con `node src/reporte.js`. La gerente puede pasar las fechas que quiera consultar: `node src/reporte.js 2026-09-05`. Los dos errores se reproducen y se prueban con `node src/reproducir-errores.js`.

### Error 1 · "Bogotá apareció dos veces"

- **Síntoma**: en el total por ciudad, Bogotá aparece en dos filas, cada una con una parte del monto.
- **Entrada que lo produce**: registros de la misma ciudad escritos de forma distinta. Se reprodujo con una copia de la muestra en la que la venta 12 llega como `"Bogotá "` (espacio al final), algo típico al exportar desde una hoja de cálculo. Con la muestra original ocurre lo mismo con `"Medellín"` y `"medellín"`.
- **Hipótesis**: el prototipo usa `venta.ciudad` tal cual como clave del objeto. Para JavaScript, `"Bogotá"` y `"Bogotá "` son claves distintas.
- **Prueba realizada**: se ejecutó la versión defectuosa (`totalPorCiudadDefectuoso`) y se imprimieron las claves con `console.log(JSON.stringify(clave))`, que deja ver el espacio que en pantalla es invisible:

  | Clave | Total |
  |---|---|
  | `"Medellín"` | 221.000 |
  | `"Bogotá"` | 198.000 |
  | `"Cali"` | 185.000 |
  | `"medellín"` | 135.000 |
  | `"Pereira"` | 168.000 |
  | `"Bogotá "` | 78.000 |

  Seis grupos para cuatro ciudades. La hipótesis se confirma.
- **Causa**: la clave de agrupación no se normaliza.
- **Corrección**: `totalPorCiudad` agrupa por `claveTexto(ciudad)` (sin espacios sobrantes, minúsculas, sin tildes) y muestra el nombre con `formatearNombreLugar`. Con la misma entrada, la v0.1 devuelve 4 ciudades y Bogotá suma 276.000 (198.000 + 78.000). Hay una prueba automática que lo comprueba.

### Error 2 · El ticket promedio daba `NaN` al filtrar un día sin ventas

- **Síntoma**: al consultar un día sin ventas, el reporte mostraba `NaN` en el ticket promedio.
- **Entrada que lo produce**: filtrar el 2026-09-07, que no tiene registros, y calcular el ticket sobre ese resultado (`[]`).
- **Hipótesis**: el prototipo calcula `total / ventas.length`; con un arreglo vacío eso es `0 / 0`, que en JavaScript es `NaN`.
- **Prueba realizada**: con `console.log` antes de dividir se vio `total = 0` y `length = 0`; la versión defectuosa devolvió `NaN` (`Number.isNaN(...) === true`).
- **Causa**: la división no valida el divisor. Además, divide entre todos los registros y no entre las ventas válidas.
- **Corrección**: `ticketPromedio` cuenta solo ventas con cantidad mayor que 0 y devuelve `0` si no hay ninguna. `ventasDelDia(ventas, fecha)` reutiliza esa función y devuelve todos los indicadores en 0, `ventaMayor: null` y `hayVentas: false`. El reporte muestra el mensaje "No se registraron ventas este día." junto con los valores en cero.
- **Hallazgo adicional**: el mismo defecto daba un valor **incorrecto pero no visible** el 2026-09-04: 120.000 ÷ 2 registros = 60.000, porque contaba la venta con cantidad 0. El valor correcto es 120.000 ÷ 1 venta válida = 120.000. Es el tipo de error que no salta a la vista y solo aparece al revisar los datos.

### Verificación final

| Comando | Resultado |
|---|---|
| `node src/explorar.js` | 12 registros, primero, último, producto de la posición 4 y tabla completa. |
| `node src/pruebas.js` | 17/17 comprobaciones correctas. |
| `node src/verificar.js` | 35/35 verificaciones en OK. |
| `node src/reporte.js` | Cinco secciones, sin `NaN`, sin `undefined` y sin ciudades duplicadas (el propio reporte lo verifica al final). |
| `node src/reproducir-errores.js` | Los dos errores se reproducen con la versión defectuosa y quedan corregidos en la v0.1. |

El reporte también se probó con un arreglo vacío (todas las secciones muestran "No hay ventas registradas" o valores en cero) y con una fecha inválida (`2026-13-01`), que muestra un mensaje que indica el formato correcto.

---

## MiniReto 5 · Generador y crecimiento de operaciones

### Predicción previa a medir

Antes de ejecutar `node src/medir.js`, la predicción es que las tres funciones que recorren todas las ventas tendrán crecimiento lineal. Al multiplicar `n` por 10, sus operaciones deben multiplicarse aproximadamente por 10. `primeraVentaInstrumentada` solo consulta la longitud y el primer elemento, así que su contador debe permanecer constante.

| Función | Predicción si `n` × 10 | Complejidad esperada |
|---|---:|---|
| `totalVendidoInstrumentado` | operaciones × 10 | O(n) |
| `ventaMayorInstrumentada` | operaciones × 10 aproximadamente | O(n) |
| `totalPorCiudadInstrumentado` | operaciones × 10 aproximadamente | O(n) |
| `primeraVentaInstrumentada` | no cambia | O(1) |

El generador escoge al azar entre cinco productos con su precio, cuatro ciudades, fechas de septiembre de 2026 y cantidades de 1 a 5. Usa como máximo `floor(n / 3)` códigos de cliente distintos, con un mínimo de uno para que `generarVentas(1)` también pueda producir un cliente. Cada venta conserva las siete propiedades de la muestra: `id`, `fecha`, `cliente`, `producto`, `ciudad`, `cantidad` y `precio`.

### Qué cuenta el contador

Las funciones reciben el mismo objeto `{ operaciones: 0 }` por referencia y lo incrementan en cada visita de registro, comparación explícita o acceso contabilizado. No se cuentan las operaciones internas de JavaScript ni la contabilidad que hace el propio contador.

- `totalVendidoInstrumentado`: una visita por registro, `n` operaciones.
- `ventaMayorInstrumentada`: por venta generada cuenta la visita, la comprobación de registro, la validación de cantidad y la comprobación del máximo; después del primer registro añade una comparación de valor. Como el generador crea cantidades positivas, el total observado es `5n - 1`.
- `totalPorCiudadInstrumentado`: por venta cuenta visita, comprobación del registro y existencia del grupo; por ciudad distinta cuenta la comparación para elegir el nombre y una visita al formar el objeto de salida. En la medición aparecieron las cuatro ciudades, así que fueron `3n + 8` operaciones.
- `primeraVentaInstrumentada`: una comprobación de longitud y un acceso al índice cero; son 2 operaciones para todos los tamaños positivos medidos.

### Resultados y comparación con la predicción

Salida de `node src/medir.js`:

| `n` | `totalVendido` | `ventaMayor` | `totalPorCiudad` | `primeraVenta` |
|---:|---:|---:|---:|---:|
| 100 | 100 | 499 | 308 | 2 |
| 1.000 | 1.000 | 4.999 | 3.008 | 2 |
| 10.000 | 10.000 | 49.999 | 30.008 | 2 |
| 100.000 | 100.000 | 499.999 | 300.008 | 2 |

Al multiplicar `n` por 10, `totalVendido` multiplica sus operaciones exactamente por 10. `ventaMayor` pasa de 499 a 4.999, luego a 49.999 y a 499.999: el factor se acerca a 10 porque la fórmula es `5n - 1`. `totalPorCiudad` pasa de 308 a 3.008, 30.008 y 300.008; el pequeño término fijo de ocho operaciones (cuatro ciudades) hace que la razón se acerque a 10. `primeraVenta` conserva 2 operaciones.

### Clasificación Big O

| Función | Clasificación | Justificación en el código y la medición |
|---|---|---|
| `totalVendidoInstrumentado` | O(n) | Un ciclo visita cada venta una vez; los resultados fueron `n` operaciones. |
| `ventaMayorInstrumentada` | O(n) | Un ciclo revisa cada venta y compara contra el máximo actual; `5n - 1` crece linealmente. |
| `totalPorCiudadInstrumentado` | O(n) | Recorre ventas y luego las ciudades agrupadas. El conjunto de ciudades está acotado a cuatro, así que el término final es constante; el total crece como `3n + 2d`, donde `d ≤ 4`. |
| `primeraVentaInstrumentada` | O(1) | No recorre el arreglo; solo comprueba su longitud y accede a `ventas[0]`. La cuenta se mantiene en 2. |

No aparece O(n²): ninguna función tiene un ciclo anidado que recorra todas las ventas por cada venta. La medición cuenta operaciones algorítmicas, no tiempo de reloj; por eso permite comparar el crecimiento sin depender del equipo.

---

## MiniReto 6 · Clientes recurrentes y crecimiento cuadrático

### Verificación con la muestra

Se agregó `clientesRecurrentes(ventas)` a `src/analitica.js`, conservando el algoritmo del compañero: compara pares con dos ciclos y usa `includes` para no repetir clientes en el resultado. Con las 12 ventas del Día 1 devuelve, en orden, `['C01', 'C02', 'C03']`.

### Traza manual con cinco registros

Entrada en este orden: `[C01, C02, C01, C03, C02]`. Se cuentan comparaciones de cliente entre pares; un par distinto se compara una vez, no dos.

| `i` | Cliente de `i` | `j` visitados | Resultado de pares / `includes` |
|---:|---|---|---|
| 0 | C01 | 1, 2, 3, 4 | C01≠C02; C01=C01, `includes([])` hace 0 comparaciones y se agrega C01; C01≠C03; C01≠C02 |
| 1 | C02 | 2, 3, 4 | C02≠C01; C02≠C03; C02=C02, `includes([C01])` hace 1 comparación y se agrega C02 |
| 2 | C01 | 3, 4 | C01≠C03; C01≠C02 |
| 3 | C03 | 4 | C03≠C02 |

Los ciclos comparan cada par una vez: `4 + 3 + 2 + 1 = 10`, que generaliza a `n(n - 1) / 2`. En esta traza `includes` añade una comparación (la consulta sobre el arreglo vacío no visita elementos y la consulta `[C01]` revisa uno). La función devuelve `[C01, C02]`.

### Predicción antes de medir

El ciclo interior realiza `n(n - 1) / 2` comparaciones, así que predigo que al duplicar `n` el tiempo se acercará a cuatro veces el anterior. La prueba con los tamaños pedidos está en `node src/recurrentes.js`; el script genera datos con `generarVentas` y mide solamente la función usando `console.time`/`console.timeEnd`.

| Ventas | Tiempo observado (ms) | Factor frente al tamaño anterior |
|---:|---:|---:|
| 1.000 | 4,386 | — |
| 2.000 | 15,140 | 3,45× |
| 4.000 | 58,097 | 3,84× |
| 8.000 | 261,859 | 4,51× |
| 16.000 | 959,501 | 3,66× |

Hay variación por el azar del generador y el entorno, especialmente en el tamaño pequeño. Desde 2.000 ventas, los factores se acercan a 4; concuerda con el crecimiento cuadrático O(n²) del ciclo de pares. Los resultados no son una promesa de duración exacta en otro equipo.

### Estimaciones y medición de 100.000

Extrapolando desde 16.000 con el modelo cuadrático, 100.000 ventas se estimaban en `0,959501 × (100.000 / 16.000)² ≈ 37,5 s`, por debajo del límite de dos minutos. Por eso se ejecutó la medición autorizada: `node src/recurrentes.js 100000` tardó **58,632 s** en este entorno.

Para 1.000.000, se extrapola desde esa medición por un factor de `10² = 100`: `58,632 × 100 ≈ 5.863 s`, es decir, aproximadamente **97,7 minutos** (1 h 37 min 43 s). Es una estimación para datos generados con esta distribución; no se ejecutó el tamaño de un millón.

### Costo oculto de `includes`

`includes` recorre `recurrentes` hasta encontrar el cliente o llegar al final. Su costo puede ser O(n). Una cota conservadora para el código tal como está escrito es O(n³): hay O(n²) pares y cada consulta a `includes` podría revisar O(n) elementos. Esa cota sí puede alcanzarse: primero se pueden colocar muchos clientes repetidos para llenar `recurrentes`, y después muchas filas de un nuevo cliente. Cada par de ese último cliente vuelve a llamar a `includes` y recorre una lista larga.

Con la distribución del generador (hasta `n/3` clientes), las mediciones se comportaron aproximadamente como O(n²), porque la cantidad de coincidencias y el tamaño de la búsqueda en `includes` crecieron juntos como una constante proporcional a `n`. El caso peor depende de cómo se distribuyan y ordenen los clientes; el tiempo real medido no elimina esa posibilidad.

### Conclusión para la gerente

El reporte tarda porque compara cada compra con muchas otras para descubrir quién volvió a comprar. Cuando el historial crece diez veces, esa revisión puede tardar cerca de cien veces más; además, buscar si el cliente ya está en la lista de recurrentes añade trabajo. Con un millón de ventas, la estimación ronda una hora y 38 minutos en este equipo. Conviene reemplazar esta búsqueda repetida por un conteo agrupado de clientes antes de usar el reporte con todo el año.

---

## MiniReto 7 · Complejidad espacial por ciudad

### Dos formas de sumar una ciudad

Se agregaron `totalCiudadCadena(ventas, ciudad)` y `totalCiudadUnaPasada(ventas, ciudad)` a `src/analitica.js`. Ambas normalizan con `claveTexto` y suman `cantidad × precio` para la ciudad consultada.

Con `generarVentas(10000)`, las dos versiones devolvieron exactamente el mismo valor para Medellín, Bogotá y una ciudad sin ventas. En esa ejecución Bogotá sumó **480.538.000**; el generador es aleatorio, así que el monto puede cambiar en otra ejecución.

| Versión | Recorridos completos | Arreglos intermedios creados | Tiempo | Espacio adicional |
|---|---:|---:|---|---|
| `totalCiudadCadena` | 4: `map`, `filter`, `map`, `reduce` | 3: el primer `map`, `filter` y segundo `map` | O(4n) = O(n) | O(n) |
| `totalCiudadUnaPasada` | 1: `for...of` | 0 | O(n) | O(1) |

El primer `map` también crea un objeto temporal por venta con la ciudad normalizada y la venta. `filter` recorre los n elementos y deja m coincidencias; el segundo `map` y `reduce` recorren esas m, donde `m ≤ n`. El trabajo es `n + n + m + m`, acotado por `4n`. En Big O se eliminan las constantes multiplicativas: O(4n) se simplifica a O(n). El ciclo único también es O(n), pero guarda solo la ciudad buscada y el total acumulado; no materializa colecciones intermedias.

**Decisión para el motor:** se mantiene `totalCiudadUnaPasada` como la versión recomendada para producción, porque el servidor tiene memoria limitada y solo necesita un total. `totalCiudadCadena` queda disponible como comparación didáctica: expresa bien la transformación de la colección, pero usa O(n) memoria temporal. Para construir todos los grupos de ciudad sigue siendo apropiado `totalPorCiudad`, que necesita almacenar sus resultados.

### Convenciones para clasificar memoria

En la tabla siguiente, `n` es el número de ventas; `d` es la cantidad de ciudades distintas; `p`, productos distintos; `r`, clientes recurrentes; `k`, el límite del top; y `q`, fechas consultadas. Se excluye el arreglo de entrada, pero se cuentan los resultados y arreglos auxiliares creados por la función. En funciones de texto, `s` es el largo del texto; como cada campo tiene un tamaño acotado frente a `n`, su espacio es O(1) respecto al historial.

### Funciones de `analitica.js`

| Funciones | Espacio adicional | Motivo |
|---|---|---|
| `limpiarTexto`, `claveTexto`, `tieneTildes`, `formatearNombreLugar` | O(s), O(1) respecto a n | Trabajan con un campo de texto; `formatearNombreLugar` guarda temporalmente las palabras. |
| `cantidadDe`, `precioDe`, `valorVenta`, `esVentaValida`, `contarVentasValidas` | O(1) | Variables escalares; el ciclo de conteo no guarda elementos. |
| `totalVendido`, `unidadesVendidas`, `ventaMayor`, `ticketPromedio`, `ventasPorCiudad`, `totalCiudadUnaPasada` | O(1) | Acumuladores, máximo y claves escalares; no crean arreglos proporcionales a n. |
| `totalVendidoM`, `unidadesVendidasM` | O(n) | `map` crea un arreglo con un resultado por venta y `reduce` devuelve un escalar. |
| `ventasPorCiudadM` | O(n) | `filter` y `map` crean arreglos nuevos con hasta n elementos cada uno. |
| `totalCiudadCadena` | O(n) | Crea tres arreglos intermedios; el primero además guarda un objeto temporal por venta. |
| `totalPorCiudad` | O(d), O(n) en el peor caso | El diccionario de grupos, `Object.entries`, el arreglo de `map` y el objeto final crecen con las ciudades distintas. |
| `agruparPorProducto` | O(p), O(n) en el peor caso | Devuelve un diccionario con una entrada por producto distinto. |
| `unidadesPorProducto` | O(p), O(n) en el peor caso | Mantiene los grupos, el arreglo de `Object.entries`, el arreglo de `map` y el objeto de salida. |
| `topProductosPorValor` | O(p), O(n) en el peor caso | Copia los grupos para ordenar, guarda las entradas y el resultado de hasta k productos; `p` puede crecer hasta n. |
| `ventasOrdenadasPorValor` | O(n) | `[...ventas]` crea una copia completa antes de ordenar. |
| `esFechaValida` | O(1) respecto a n | Valida una sola cadena de fecha de tamaño acotado. |
| `ventasDelDia` | O(n) | `filter` crea el arreglo de ventas del día, que en el peor caso contiene todas las ventas. |
| `clientesRecurrentes` | O(r), O(n) en el peor caso | El arreglo de salida guarda cada cliente recurrente una sola vez; `includes` no crea otro arreglo. |

### Generador, instrumentación y reporte

| Funciones | Espacio adicional | Motivo |
|---|---|---|
| `enteroAleatorio` | O(1) | Solo calcula un número. |
| `generarVentas` | O(n) | El arreglo de ventas generado es la salida solicitada. |
| `contarOperacion`, `totalVendidoInstrumentado`, `ventaMayorInstrumentada`, `primeraVentaInstrumentada` | O(1) | Contador y acumuladores escalares. |
| `totalPorCiudadInstrumentado` | O(d), O(n) en el peor caso | Retiene el diccionario de grupos y el objeto de salida. |
| `pesos`, `numero`, `porcentaje`, `titulo`, `dato`, `describirVenta` | O(1) respecto a n | Crean cadenas pequeñas asociadas a un dato. |
| `tabla` | O(f) | Copia y construye filas de texto para f filas de salida. |
| `seccionResumen` | O(n) | Crea con `map` un arreglo de fechas para ordenarlo. |
| `seccionCiudades` | O(d) | Mantiene agrupaciones, entradas, filas ordenadas y líneas de salida por ciudad. |
| `seccionProductos`, `seccionTop` | O(p) | Agrupan y forman filas por producto; el top ordena una copia. |
| `seccionDias` | O(n + q) en el peor caso | Cada consulta filtra ventas; además conserva líneas para q fechas. |
| `generarReporte` | O(n + d + p + q) en el peor caso | Conserva las líneas del informe; el resumen crea temporalmente una lista de fechas de tamaño n. |
| `revisarReporte` | O(d) | `map` y `Set` guardan una clave por ciudad distinta. |

La clasificación cuenta espacio adicional, no tiempo. Por eso tanto la cadena como el ciclo único son O(n) en tiempo, pero difieren en espacio: O(n) frente a O(1). Para un cálculo de un solo total en un servidor con memoria limitada, el recorrido único es la opción elegida.

---

## MiniReto 8 · Informe de rendimiento v0.2

### Revisión técnica independiente

Un revisor técnico independiente encontró correctas las clases de complejidad, los conteos instrumentados y las proyecciones. Su observación fue que los tiempos de 10.000 ventas no se podían reproducir desde el repositorio: `medir.js` contaba operaciones y `recurrentes.js` medía solo clientes recurrentes.

**Respuesta y cambio aplicado:** añadí `src/medir-rendimiento.js`, que crea 10.000 ventas, calienta las funciones una vez, promedia tres ejecuciones con `performance.now()` y muestra una tabla con las funciones analíticas, utilidades y reporte. También reproduce los contadores instrumentados y comprueba que las dos versiones de total por ciudad coincidan. En una segunda pasada, el revisor señaló que mediciones menores a 0,001 ms podían redondearse a cero; ajusté la salida del script para mostrarlas como `<0.001`. El informe indica que los tiempos pueden variar porque cada corrida genera otra muestra aleatoria. Para reproducirlo se ejecuta `node src/medir-rendimiento.js`.

La observación mejoró la evidencia: quien revise el documento ahora puede volver a ejecutar el benchmark en el mismo repositorio y comparar el orden de magnitud, sin depender de cifras presentadas como universales.

---

## MiniReto 9 · Optimización de clientes recurrentes

### 1. Entender el problema

- **Entrada:** arreglo de ventas; cada registro tiene un código `cliente`.
- **Salida:** arreglo de códigos de cliente que aparecen en más de una venta, sin duplicados.
- **Restricciones:** conservar el significado de la versión original; no modificar las ventas; responder con 100.000 ventas en menos de un segundo; el orden de los resultados no es requisito.

### 2. Ejemplos y casos borde

| Entrada de clientes | Salida esperada | Motivo |
|---|---|---|
| `[]` | `[]` | No hay compras. |
| `[C01]` | `[]` | Una compra no es recurrencia. |
| `[C01, C02, C01, C03, C02]` | `[C01, C02]` | Ambos aparecen más de una vez y se listan una sola vez. |
| Datos del Día 1 | `[C01, C02, C03]` | Son los tres códigos repetidos en la muestra. |

### 3. Fuerza bruta

`clientesRecurrentes` compara cada pareja `(i, j)`, con `j > i`, por lo que realiza `n(n - 1) / 2` comparaciones: O(n²). Cuando encuentra una pareja igual, `includes` busca el cliente en el arreglo de salida; esa búsqueda puede ser O(r). El peor caso del código puede llegar a O(n³) cuando hay O(n²) coincidencias y `includes` recorre un arreglo O(n). Con datos generados ya se había medido 58,632 segundos para 100.000 ventas.

### 4. Idea de optimización

Guardar en una estructura hash la información ya vista evita comparar una compra con todas las demás. En la alternativa con Set, `vistos` detecta la segunda compra y `recurrentes` evita repetir el código de salida. En la alternativa con Map, `comprasPorCliente` acumula el número de compras de cada cliente y una pasada por ese Map selecciona los conteos mayores que uno. Las operaciones de `Set` y `Map` tienen costo promedio O(1), de modo que el tiempo esperado es O(n). Se paga memoria adicional proporcional a los clientes únicos.

### 5. Implementación

Se añadieron a `src/analitica.js`:

- `clientesRecurrentesSet(ventas)`: un Set de vistos y otro de recurrentes.
- `comprasPorCliente(ventas)`: Map de cliente a cantidad de compras.
- `clientesRecurrentesMap(ventas)`: deriva la lista recurrente del Map de conteos.

La fuerza bruta se conserva como referencia para comparar su resultado y su costo.

### 6. Pruebas y mediciones

`node src/recurrentes.js` compara las tres versiones ordenando copias de sus resultados. Las tres coincidieron con los datos del Día 1, con 5.000 ventas generadas, con el arreglo vacío y con un solo cliente repetido varias veces. En el conjunto generado de 5.000 ventas se encontraron 1.318 clientes recurrentes.

Tiempos medidos con `console.time` en una ejecución de Node.js:

| Ventas | Fuerza bruta original | Set | Map |
|---:|---:|---:|---:|
| 1.000 | 5,346 ms | 0,108 ms | 0,080 ms |
| 10.000 | 440,892 ms | 0,993 ms | 0,987 ms |
| 100.000 | No ejecutada; había tardado 58,632 s en una medición previa | 13,741 ms | 9,510 ms |

Con 100.000 ventas, Set y Map quedaron ampliamente por debajo del límite de un segundo. Los tiempos cambian con el equipo, el motor de JavaScript y la muestra aleatoria; la tendencia sí coincide con las pasadas lineales del nuevo código. La tabla compara una única corrida por versión y tamaño, no una garantía de latencia.

### Intercambio entre tiempo y memoria

La versión original conserva solo el arreglo de salida, O(r) memoria, pero repite búsquedas. La versión Set mantiene `vistos`, `recurrentes` y el arreglo devuelto; la versión Map mantiene los conteos y el arreglo de salida. Ambas optimizadas usan O(u + r), que queda en O(u) porque `r ≤ u`; en el peor caso u puede crecer hasta n. Se acepta esa memoria adicional para reducir el trabajo esperado de cuadrático/cúbico a lineal.

---

## MiniReto 10 · Complementos, productos estrella y cliente único

### 1. Entender

- `comboRegalo(catalogo, valor)` recibe productos con `producto` y `precio`; devuelve dos productos distintos cuya suma es el valor o `null`. El Map solo debe contener elementos anteriores al actual para no usar el mismo producto dos veces.
- `productoEstrellaPorCiudad(ventas)` recibe las líneas de venta y devuelve por ciudad el producto con más apariciones. Se cuentan registros, no unidades; cada línea es una aparición.
- `primerClienteUnico(ventas)` devuelve el primer código, según el orden de entrada, que aparece exactamente una vez, o `null` si nadie cumple.
- Restricciones comunes: no cambiar los arreglos de entrada; agrupar ciudades con la normalización existente; resolver empates de forma estable y documentada.

El catálogo de campaña está en `src/catalogo.js` y conserva nombre y precio en cada objeto.

### 2. Ejemplos y casos borde

| Caso | Resultado |
|---|---|
| Combo de 87.000 | Origen Huila 500 g (42.000) + Origen Sierra 500 g (45.000) |
| Combo de 61.000 | Origen Nariño 250 g (26.000) + Taza de cerámica (35.000) |
| Combo de 100.000 | `null`, no hay pareja en el catálogo |
| Catálogo vacío o ventas vacías | `comboRegalo` devuelve `null`; las funciones de ventas devuelven `[]` y `null`, respectivamente |
| Empate en una ciudad | Gana el primer producto que apareció en esa ciudad |
| Todos los clientes repiten | `primerClienteUnico` devuelve `null` |

### 3. Fuerza bruta y complejidad

`comboRegaloBruta` prueba cada pareja de índices con `j > i`. Para c productos hace `c(c - 1) / 2` sumas/comparaciones en el peor caso: tiempo O(c²), memoria adicional O(1), aparte del arreglo de dos productos devuelto.

### 4. Idea optimizada

Para cada precio p, solo hace falta preguntar si `valor - p` apareció antes. El Map de precios vistos resuelve esa consulta en tiempo promedio O(1), así que un recorrido cuesta O(c) esperado y guarda hasta c precios: O(c) de memoria. La búsqueda se hace antes de insertar el producto actual; así se garantiza que los dos productos sean distintos.

Para frecuencias, un Map anidado agrupa ciudad → producto → apariciones. Para cliente único, el primer recorrido cuenta compras con Map y el segundo recorre las ventas en su orden original buscando el primer conteo igual a uno.

### 5. Traza optimizada para 87.000

Se recorre el catálogo en el orden de `src/catalogo.js`:

| Producto actual | Precio | Complemento buscado | Map antes de revisar | Acción |
|---|---:|---:|---|---|
| Origen Nariño 250 g | 26.000 | 61.000 | vacío | No existe; guardar 26.000 → Nariño |
| Origen Huila 500 g | 42.000 | 45.000 | 26.000 → Nariño | No existe; guardar 42.000 → Huila |
| Origen Sierra 500 g | 45.000 | 42.000 | 26.000 → Nariño; 42.000 → Huila | Sí existe; devolver Huila + Sierra |

La búsqueda se detiene en el tercer producto. En el caso de 61.000, al llegar a Taza (35.000), el complemento 26.000 ya está en el Map y se devuelve Nariño + Taza. Con 100.000 se recorre todo el catálogo y se devuelve `null`.

### 6. Implementación y verificación

Las funciones están en `src/analitica.js`: `comboRegaloBruta`, `comboRegalo`, `productoEstrellaPorCiudad` y `primerClienteUnico`. Los resultados con las ventas del Día 1 son:

| Ciudad | Producto estrella | Apariciones | Regla aplicada |
|---|---|---:|---|
| Medellín | Origen Huila 500 g | 2 | Mayor frecuencia |
| Bogotá | Origen Nariño 250 g | 3 | Mayor frecuencia |
| Cali | Prensa francesa | 1 | Empate; fue la primera observada en Cali |
| Pereira | Origen Huila 500 g | 1 | Única venta de la ciudad |

`primerClienteUnico(ventas)` devuelve `C04`: C01, C02 y C03 vuelven a aparecer; C04 es el primer código cuyo total es uno. Se conserva el orden de entrada para resolver “primero”.

### Complejidad y espacio

| Función | Tiempo | Espacio adicional | Justificación |
|---|---|---|---|
| `comboRegaloBruta` | O(c²) | O(1) | Prueba todas las parejas. |
| `comboRegalo` | O(c) esperado | O(c) | Un recorrido y un Map de precios vistos. |
| `productoEstrellaPorCiudad` | O(n) esperado | O(g) | Un recorrido crea g combinaciones ciudad-producto y luego se examinan esos grupos una vez; g ≤ n. |
| `primerClienteUnico` | O(n) esperado | O(u) | Dos recorridos y un Map con u clientes únicos. |

### Pruebas realizadas

Se compararon `comboRegaloBruta` y `comboRegalo` para valores 87.000, 61.000 y 100.000; ambas versiones encontraron parejas equivalentes para los dos primeros y devolvieron `null` para el tercero. También se comprobó que el producto estrella coincide con las cuatro filas de la tabla y que el primer cliente único es C04. Los casos sin datos devuelven `null` o arreglos vacíos sin error.

---

## MiniReto 11 · Ventana deslizante y dos punteros

### 1. Mejor semana: fuerza bruta y ventana deslizante

`mejorSemanaBruta(dias, k)` suma desde cero cada bloque posible de k días. Con n días realiza hasta `(n - k + 1) × k` sumas: O(nk), que es O(n²) si k crece junto con n. Usa O(1) memoria adicional.

`mejorSemana(dias, k)` suma primero los k días iniciales. Al avanzar, resta el día que sale y suma el nuevo día. Solo hay un cálculo inicial y una actualización por posición: O(n) tiempo y O(1) espacio. Si `k` no es entero positivo o supera el número de días, ambas funciones devuelven `null`; en empates se conserva la semana más temprana.

Las tres primeras ventanas de septiembre (k = 7), en miles de pesos:

```text
Días 1–7:  320 + 410 + 280 + 390 + 510 + 620 + 700 = 3.230
Días 2–8:  3.230 - 320 + 300 = 3.210
Días 3–9:  3.210 - 410 + 290 = 3.090
```

La mejor semana es **del día 24 al 30**, con **3.670 miles de pesos** ($3.670.000). La versión bruta y la de ventana devolvieron el mismo inicio, fin y total.

### 2. Comprobación y tiempos

Se compararon ambas funciones con los 30 valores de septiembre y con 100.000 valores diarios generados aleatoriamente (k = 7); `assert.deepEqual` confirmó resultados idénticos en ambos conjuntos. Una medición local con Node.js dio:

| Conjunto | Fuerza bruta | Ventana deslizante |
|---|---:|---:|
| Septiembre, 30 días | mismo resultado | mismo resultado |
| 100.000 días aleatorios | 1,804 ms | 0,850 ms |

Los milisegundos dependen del equipo y de la ejecución. Como k se mantiene fijo en esta prueba, ambas hacen trabajo O(n); la fuerza bruta vuelve a sumar k días en cada posición, mientras la ventana mantiene una suma acumulada.

### 3. Par más cercano al presupuesto

`parMasCercano(precios, presupuesto)` copia y ordena por precio ascendente con comparador numérico, luego usa dos punteros. Devuelve `{ productos, total }` con la suma máxima que no supera el presupuesto, o `null` si no hay dos productos elegibles. No modifica el catálogo original.

Resultados probados:

| Presupuesto | Productos | Total |
|---:|---|---:|
| 100.000 | Filtros de papel x100 + Origen Huila 1 kg | 97.000 |
| 140.000 | Origen Sierra 500 g + Prensa francesa | 140.000 |
| 40.000 | Sin combinación | `null` |

Traza para 100.000. Precios ordenados: 18.000, 26.000, 35.000, 42.000, 45.000, 79.000, 95.000, 120.000. `I` señala el menor y `D` el mayor precio restante:

| I | D | Suma | Decisión |
|---:|---:|---:|---|
| 18.000 | 120.000 | 138.000 | Supera el presupuesto; mover D a 95.000 |
| 18.000 | 95.000 | 113.000 | Supera; mover D a 79.000 |
| 18.000 | 79.000 | 97.000 | Cabe; guardar como mejor y mover I a 26.000 |
| 26.000 | 79.000 | 105.000 | Supera; mover D a 45.000 |
| 26.000 | 45.000 | 71.000 | Cabe; no mejora 97.000; mover I |
| 35.000 | 45.000 | 80.000 | Cabe; no mejora; mover I |
| 42.000 | 45.000 | 87.000 | Cabe; no mejora; mover I; termina |

Cuando la suma supera el presupuesto, se mueve el puntero derecho porque hay que reducir el precio. Cuando cabe, se mueve el izquierdo para intentar mejorar la suma con un precio mayor; el mejor total se actualiza solo si aumenta.

### 4. Complejidad y verificación

| Función | Tiempo | Espacio adicional | Justificación |
|---|---|---|---|
| `mejorSemanaBruta(dias, k)` | O((n-k+1)k), peor O(nk) | O(1) | Vuelve a sumar k elementos por cada ventana. |
| `mejorSemana(dias, k)` | O(n) | O(1) | Suma una ventana inicial y actualiza cada posición en tiempo constante. |
| `parMasCercano(precios, presupuesto)` | O(n log n) | O(n) | Ordena una copia en O(n log n); el recorrido con dos punteros cuesta O(n), y la copia ordenada usa O(n) espacio. |

La comprobación reproducible está en `node src/ventanas.js`: muestra el máximo de septiembre, compara tiempos y salidas para 100.000 días, valida los tres presupuestos y revisa ventanas inválidas y arreglos vacíos. Todas las aserciones pasaron.
