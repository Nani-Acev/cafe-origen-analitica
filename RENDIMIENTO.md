# Rendimiento del motor Café Origen · v1.0

## Alcance y método

Este informe clasifica las funciones de `src/analitica.js` y las operaciones principales de generación, instrumentación y reporte. `n` representa el número de ventas; `c`, productos del catálogo; `d`, ciudades distintas; `p`, productos distintos; `g`, pares ciudad-producto distintos; `u`, clientes únicos; `r`, clientes recurrentes; `k`, el límite del ranking; y `q`, fechas solicitadas. Se excluye el arreglo de entrada al calcular espacio y se incluye cualquier arreglo u objeto auxiliar o devuelto.

Las mediciones analíticas heredadas se tomaron en Node.js con una muestra aleatoria de 10.000 ventas de `generarVentas`. Para las funciones analíticas se calentó una vez y se promediaron tres ejecuciones con `performance.now()`. Los helpers escalares se llamaron 10.000 veces. Las comparaciones completas de reporte se midieron después con `node src/medir-versiones.js`: mismo arreglo aleatorio para las dos versiones, una ejecución de calentamiento y mediana de cinco mediciones de generación y validación del texto; no incluye escritura a stdout. Los tiempos y contadores varían entre equipos y muestras; son evidencia de ejecuciones concretas, no garantías de latencia.

## Funciones analíticas

| Función | Qué hace | Tiempo | Espacio | Justificación del código | Evidencia con 10.000 ventas |
|---|---|---|---|---|---|
| `limpiarTexto` | Recorta y normaliza un texto | O(s) | O(s) | Examina y devuelve una cadena de longitud s | 10.000 llamadas: 0,935 ms |
| `claveTexto` | Normaliza texto para compararlo | O(s) | O(s) | Limpia, convierte y quita marcas sobre s caracteres | 10.000 llamadas: 3,010 ms |
| `tieneTildes` | Comprueba si un texto conserva tildes | O(s) | O(s) | Normaliza y recorre la cadena | 10.000 llamadas: 2,315 ms |
| `formatearNombreLugar` | Da formato visible a un lugar | O(s) | O(s) | Divide el texto en palabras y crea una lista temporal | 10.000 llamadas: 3,066 ms |
| `cantidadDe` | Lee y valida cantidad | O(1) | O(1) | Opera sobre un campo | 10.000 llamadas: 0,186 ms |
| `precioDe` | Lee y valida precio | O(1) | O(1) | Opera sobre un campo | 10.000 llamadas: 0,199 ms |
| `esVentaValida` | Comprueba que cantidad sea positiva | O(1) | O(1) | Una validación por venta recibida | 10.000 llamadas: 0,309 ms |
| `valorVenta` | Calcula cantidad por precio | O(1) | O(1) | Combina dos lecturas y una multiplicación | 10.000 llamadas: 0,265 ms |
| `contarVentasValidas` | Cuenta ventas con cantidad positiva | O(n) | O(1) | Un `for...of`, un contador escalar | 10.000 registros: 0,020 ms |
| `totalVendido` | Suma valor de ventas | O(n) | O(1) | Una visita por registro y un acumulador | 10.000 registros: 0,096 ms; 10.000 visitas instrumentadas |
| `unidadesVendidas` | Suma unidades | O(n) | O(1) | Una visita por registro y un acumulador | 10.000 registros: 0,116 ms |
| `ventaMayor` | Devuelve la venta válida de mayor valor | O(n) | O(1) | Una pasada y dos variables para el máximo | 10.000 registros: 0,034 ms; 49.999 operaciones instrumentadas |
| `ticketPromedio` | Promedia ventas válidas | O(n) | O(1) | Una pasada, suma y contador; evita dividir por cero | 10.000 registros: 0,042 ms |
| `ventasPorCiudad` | Suma ventas de una ciudad | O(n) | O(1) | Una pasada y un acumulador; normaliza cada ciudad | 10.000 registros: 3,434 ms |
| `totalCiudadCadena` | Suma una ciudad con métodos encadenados | O(n) | O(n) | `map`, `filter`, `map`, `reduce`; crea tres arreglos intermedios y objetos por venta | 10.000 registros, Bogotá: 3,519 ms |
| `totalCiudadUnaPasada` | Suma una ciudad con un solo ciclo | O(n) | O(1) | Un `for...of`, una clave y un acumulador | 10.000 registros, Bogotá: 3,183 ms |
| `totalVendidoM` | Suma valores con métodos | O(n) | O(n) | `map` materializa n valores; `reduce` suma | 10.000 registros: 0,391 ms |
| `unidadesVendidasM` | Suma cantidades con métodos | O(n) | O(n) | `map` crea un arreglo temporal de n cantidades | 10.000 registros: 0,243 ms |
| `ventasPorCiudadM` | Filtra una ciudad y suma valores | O(n) | O(n) | `filter` y `map` crean arreglos de hasta n elementos | 10.000 registros, Bogotá: 3,167 ms |
| `totalPorCiudad` | Agrupa dinero por ciudad | O(n + d) = O(n) | O(d), peor O(n) | `reduce` visita n ventas; el diccionario y la conversión final guardan d ciudades | 10.000 registros: 10,646 ms; 30.008 operaciones instrumentadas |
| `agruparPorProducto` (interna) | Agrupa valor y unidades por producto | O(n + p) = O(n) | O(p), peor O(n) | `reduce` visita n ventas y guarda p grupos distintos | 10.000 visitas; su costo está incluido en las funciones siguientes |
| `unidadesPorProducto` | Suma unidades por producto | O(n + p) = O(n) | O(p), peor O(n) | Agrupa n ventas y crea el objeto de salida con p productos | 10.000 registros: 5,274 ms |
| `topProductosPorValor` | Ordena productos por valor y devuelve k | O(n + p log p) | O(p + k) = O(p) si k ≤ p | Agrupa n ventas, copia p grupos, ordena esa copia y corta con `slice` | 10.000 registros, top 3: 5,368 ms |
| `ventasOrdenadasPorValor` | Devuelve ventas ordenadas por valor | O(n log n) | O(n) | `[...ventas]` copia n elementos y `sort` los ordena | 10.000 registros: 1,818 ms |
| `esFechaValida` | Valida una fecha | O(s) | O(s) | Comprueba formato y crea una cadena/fecha auxiliar; s es longitud de fecha | 10.000 llamadas: 8,529 ms |
| `ventasDelDia` | Resume las ventas de una fecha | O(n) | O(n) | `filter` crea una lista de hasta n ventas; luego calcula sus indicadores | 10.000 registros: 0,892 ms |
| `clientesRecurrentes` | Encuentra clientes con más de una compra | O(n³) peor caso | O(r), peor O(n) | Ciclos de pares O(n²) y `includes` puede recorrer hasta r clientes en cada coincidencia | 10.000 registros: 388,951 ms; en 100.000: 58,632 s |
| `clientesRecurrentesSet` | Devuelve los clientes vistos más de una vez | O(n) esperado | O(u + r) = O(u) | Dos Set guardan vistos y recurrentes; una pasada revisa las ventas | 10.000 registros: 0,721 ms; 100.000: 20,411 ms |
| `comprasPorCliente` | Cuenta compras por código de cliente | O(n) esperado | O(u) | Un recorrido actualiza el Map de clientes únicos | 10.000 registros: 0,563 ms; se usa como base de la versión Map |
| `clientesRecurrentesMap` | Deriva recurrentes del Map de conteos | O(n + u) = O(n) esperado | O(u + r) = O(u) | Cuenta n ventas y recorre u entradas para seleccionar las recurrentes | 10.000 registros: 0,620 ms; 100.000: 10,222 ms |
| `comboRegaloBruta` | Busca dos productos cuya suma sea un precio objetivo | O(c²) | O(1) | Dos ciclos prueban cada pareja del catálogo | Catálogo de 8 productos: 0,006 ms |
| `comboRegalo` | Busca el complemento del precio con Map | O(c) esperado | O(c) | Un recorrido y búsquedas promedio constantes de complemento | Catálogo de 8 productos: 0,001 ms |
| `productoEstrellaPorCiudad` | Cuenta y selecciona el producto más vendido por ciudad | O(n + g) esperado = O(n) | O(g), peor O(n) | Un recorrido crea Maps anidados; un recorrido por los grupos selecciona máximos | 10.000 ventas: 8,497 ms |
| `primerClienteUnico` | Devuelve el primer cliente con una compra | O(n + u) esperado = O(n) | O(u) | Primer recorrido cuenta en Map; segundo respeta el orden de ventas | 10.000 ventas: 0,558 ms |
| `mejorSemanaBruta` | Encuentra la ventana de k días con mayor suma | O((n-k+1)k), peor O(nk) | O(1) | Vuelve a sumar k días para cada inicio | 100.000 días, k=7: 1,804 ms |
| `mejorSemana` | Encuentra la ventana de k días con mayor suma | O(n) | O(1) | Suma una vez la ventana inicial y actualiza con el elemento entrante y saliente | 100.000 días, k=7: 0,850 ms |
| `parMasCercano` | Busca el par bajo presupuesto cuya suma es máxima | O(n log n) | O(n) | Ordena una copia y después la recorre con dos punteros en O(n) | Catálogo de 8 productos; validado con 3 presupuestos |

`s` es el largo del texto de entrada. Para una venta cuyo tamaño de campo no crece con el historial, esos helpers son O(1) respecto a n. En `topProductosPorValor`, `p` puede llegar a n; con el catálogo actual p es pequeño y acotado.

## Instrumentación y generación

| Función | Qué hace | Tiempo | Espacio | Justificación | Evidencia con 10.000 ventas |
|---|---|---|---|---|---|
| `enteroAleatorio` | Escoge un entero en un rango | O(1) | O(1) | Cálculo escalar | No depende de n |
| `generarVentas` | Crea n ventas de prueba | O(n) | O(n) | Un ciclo crea y almacena cada registro de salida | 10.000 ventas: 1,140 ms |
| `contarOperacion` | Incrementa un contador compartido | O(1) | O(1) | Actualiza una propiedad numérica | Una operación por llamada |
| `totalVendidoInstrumentado` | Suma y cuenta visitas | O(n) | O(1) | Un ciclo; una visita contada por registro | 10.000 operaciones; 0,288 ms |
| `ventaMayorInstrumentada` | Busca máximo y cuenta visitas/comparaciones | O(n) | O(1) | Un ciclo y variables escalares | 49.999 operaciones; 0,416 ms |
| `totalPorCiudadInstrumentado` | Agrupa ciudades y cuenta el trabajo | O(n + d) | O(d) | Un ciclo más el diccionario de d ciudades | 30.008 operaciones; 4,311 ms |
| `primeraVentaInstrumentada` | Accede al primer registro y cuenta el acceso | O(1) | O(1) | Comprueba longitud y accede al índice cero | 2 operaciones; <0,001 ms |

## Ensamblado del reporte v1.0

El reporte es una ruta de ejecución que llama a las funciones analíticas, no otra fórmula de negocio. Para que su costo también tenga evidencia, se midieron sus dos puntos de entrada:

| Función | Tiempo | Espacio | Justificación y medición con 10.000 ventas |
|---|---|---|---|
| `generarReporte` | O(n + d log d + qn + p log p), esperado | O(n + g + p + u + L) = O(n + L) | Agrupa fechas/ciudades/productos y ordena las tablas pequeñas; hace q recorridos por fechas consultadas. Mantiene conteos Map y el texto L. |
| `revisarReporte` | O(n + L) | O(d) | Busca marcadores en el texto de largo L y reagrupa ciudades para validar que no se dupliquen. |
| `sumarPorFecha` (reporte) | O(n + d log d) | O(d) | Un Map acumula n ventas por fecha; ordenar las d fechas cuesta d log d y se rellena el calendario diario. |
| Sección clientes recurrentes | O(n + u) esperado | O(u) | Un Map cuenta clientes; un recorrido conserva los diez mayores en una lista de tamaño constante. |
| Sección producto estrella por ciudad | O(n + g) esperado | O(g) | Map anidado cuenta apariciones de cada par ciudad-producto y elige máximos. |
| Sección combo de regalo | O(c) esperado | O(c) | Busca el complemento con Map sobre el catálogo. |
| Sección cliente de cupón | O(n) esperado | O(u) | Map de frecuencias y segundo recorrido en orden para el primer singleton. |
| Sección mejor semana | O(d) después de agrupar fechas | O(d) | La ventana deslizante actualiza la suma en O(1) por día; rellena huecos con cero. |

Los formateadores (`pesos`, `numero`, `porcentaje`, `titulo`, `dato`, `describirVenta`) son O(1) respecto a n por llamada. `tabla` ocupa O(f) para f filas. `seccionResumen` ocupa O(n) memoria temporal por la lista de fechas; las otras tablas guardan sus filas O(d), O(p), O(u) o O(g). `seccionDias` hace O(qn) trabajo si se consultan q fechas; q=2 por defecto. Ninguna función que se ejecuta en el reporte final usa ciclos anidados de crecimiento n×n; los diccionarios Map/Set tienen costo promedio constante por acceso.

## Comparación de versiones completas

La línea base `src/reporte-v01.js` conserva el reporte v0.1 previo a los MiniRetos 9–12. El script mide para ambas versiones la construcción del texto y la validación, sobre el mismo historial aleatorio por tamaño. Son medianas de cinco ejecuciones después de calentar, excluyendo la escritura del texto a la terminal:

| Ventas | Reporte v0.1 | Reporte v1.0 | Diferencia de tiempo | Observación |
|---:|---:|---:|---:|---|
| 10.000 | 39,42 ms | 47,80 ms | +21,3 % | v1.0 calcula y presenta las secciones nuevas además del reporte base. |
| 100.000 | 355,00 ms | 441,82 ms | +24,5 % | Incluye recurrentes, estrella por ciudad, cliente único y semana; sigue bajo cinco segundos. |

El total de v1.0 es mayor porque hace más trabajo útil que la línea base. La ejecución completa del comando `node src/reporte.js 100000`, incluyendo arranque de Node y escritura del reporte a `/dev/null`, tardó **0,54 s** en esta máquina. La evidencia de optimización está en el algoritmo de clientes recurrentes: el original de pares era O(n²) con costo adicional de `includes` (peor O(n³)); las versiones Map/Set son O(n) esperado y la versión final usa un Map de conteos. La comparación no atribuye una mejora artificial al total del reporte: mide el producto completo con su funcionalidad ampliada.

## Proyección a 1.000.000 de ventas

Las proyecciones lineales multiplican el tiempo de n=10.000 por 100. Para O(n log n), el factor es aproximadamente 150: `(1.000.000 log 1.000.000) / (10.000 log 10.000)`. Se mantienen las fechas predeterminadas del reporte (`q = 2`) y el catálogo actual. Para la versión original de clientes recurrentes se usa la medición real de 100.000 y el crecimiento observado; para Set y Map se proyecta linealmente desde las mediciones de 100.000. No se ejecutaron funciones con un millón de registros.

| Operación / reporte | Evidencia de 10.000 | Modelo de proyección | Estimación para 1.000.000 |
|---|---:|---|---:|
| Resumen: `totalVendido` | 0,096 ms | O(n), ×100 | 9,6 ms |
| Unidades: `unidadesVendidas` | 0,116 ms | O(n), ×100 | 11,6 ms |
| Máximo: `ventaMayor` | 0,034 ms | O(n), ×100 | 3,4 ms |
| Ticket promedio | 0,042 ms | O(n), ×100 | 4,2 ms |
| Total de una ciudad, cadena | 3,519 ms | O(n), ×100 | 352 ms |
| Total de una ciudad, una pasada | 3,183 ms | O(n), ×100 | 318 ms |
| Total de todas las ciudades | 10,646 ms | O(n), ×100 | 1,065 s |
| Unidades por producto | 5,274 ms | O(n), ×100 | 527 ms |
| Top 3 productos | 5,368 ms | O(n + p log p), catálogo fijo, ×100 | 537 ms |
| Ordenar ventas | 1,818 ms | O(n log n), ×150 | 273 ms |
| Resumen de un día | 0,892 ms | O(n), ×100 por fecha | 89 ms por fecha |
| Reporte completo (dos fechas) | 26,324 ms | O(n log n), ×150 | 3,95 s |
| Reporte v1.0 completo (dos fechas) | 441,82 ms con 100.000 | O(n log n), ×12 desde 100.000 | 5,30 s |
| Validación del reporte | 10,826 ms | O(n), ×100 | 1,08 s |
| Generar un millón de filas sintéticas | 1,140 ms para 10.000 | O(n), ×100 | 114 ms |
| Clientes recurrentes original (referencia) | 58,632 s para 100.000 | O(n²) observado en este generador, ×100 | 97,7 min |
| Clientes recurrentes con Set | 20,411 ms para 100.000 | O(n) esperado, ×10 | 204 ms |
| Clientes recurrentes con Map | 10,222 ms para 100.000 | O(n) esperado, ×10 | 102 ms |

La proyección de la versión original de clientes recurrentes es especialmente incierta: los datos generados no cubren todas las distribuciones posibles y el peor caso es O(n³) por `includes`. Por eso 97,7 minutos es una estimación del patrón observado, no un límite superior ni un SLA. Set y Map respondieron en 20,411 ms y 10,222 ms con 100.000 ventas generadas; sus proyecciones son inferiores a un segundo, aunque deben volver a medirse con datos representativos del marketplace.

## Riesgos, de mayor a menor

El orden considera primero el peor crecimiento temporal, luego la memoria auxiliar y, finalmente, la medición en datos generados. Las proyecciones describen esta ejecución; las clases Big O describen cómo puede crecer el código.

1. **`clientesRecurrentes` original — riesgo crítico si se invoca.** Se conserva como referencia; su peor caso es O(n³) por repetir `includes` dentro de los pares. Ya tardó 58,632 s con 100.000 ventas. En el flujo de producción debe usarse `clientesRecurrentesMap` o `clientesRecurrentesSet`, ambos O(n) esperado.
2. **`generarReporte` — riesgo alto de CPU y memoria.** Ordena n fechas, procesa los registros para distintos indicadores y filtra una vez por cada fecha solicitada. También mantiene arrays y líneas del reporte; la medición proyecta unos 4,10 s y memoria O(n) con un millón.
3. **`ventasOrdenadasPorValor` — riesgo alto de memoria.** Ordenar requiere O(n log n) tiempo y la copia `[...ventas]` usa O(n) memoria adicional.
4. **Cadenas de métodos y filtros diarios — riesgo de memoria.** `totalCiudadCadena`, `ventasPorCiudadM`, `totalVendidoM`, `unidadesVendidasM` y `ventasDelDia` materializan arreglos O(n). Su tiempo es lineal, pero hay más objetos vivos y presión sobre el recolector.
5. **Agrupaciones y rankings — riesgo medio.** `totalPorCiudad`, `unidadesPorProducto` y `topProductosPorValor` guardan grupos y copias O(d) u O(p). Con el catálogo actual los grupos son pocos; con catálogos abiertos pueden acercarse a n.
6. **Recorridos escalares y `totalCiudadUnaPasada` — riesgo bajo.** Son O(n) en tiempo y O(1) en espacio; no retienen colecciones proporcionales al historial.

## Plan de optimización

La prioridad era `clientesRecurrentes`: comparaba cada venta contra las posteriores y, al encontrar coincidencias, volvía a buscar el cliente en `recurrentes` con `includes`. Ese trabajo se repetía y podía escanear una lista creciente. El MiniReto 9 implementó el plan: `comprasPorCliente` cuenta una vez cada código con un Map y `clientesRecurrentesMap` filtra los conteos mayores a uno; la alternativa Set conserva dos conjuntos de pertenencia. En las mediciones de 100.000 ventas, ambas terminaron por debajo de un segundo. La versión recomendada para producir el reporte es Map porque ya entrega los conteos por cliente si el marketplace los solicita; la función original queda solo para comparar.

## Fuentes reproducibles en el repositorio

- `node src/medir.js`: operaciones contadas para n = 100, 1.000, 10.000 y 100.000.
- `node src/medir-rendimiento.js`: promedios de tiempo con 10.000 ventas para las funciones analíticas y el reporte, más sus contadores instrumentados.
- `node src/recurrentes.js`: compara original, Set y Map en 1.000, 10.000 y 100.000 ventas; omite la original a 100.000 por su tiempo previo de 58,6 s.
- `node src/reporte.js`: reporte integrado y comprobaciones contra `NaN`, `undefined` y ciudades duplicadas.
- `node src/verificar.js`: equivalencia de ciclos y métodos y conservación del arreglo original.
- `node src/ventanas.js`: compara semana bruta y deslizante con septiembre y 100.000 días; prueba pares por presupuesto.
- `node src/medir-versiones.js`: compara las medianas del reporte v0.1 guardado en `src/reporte-v01.js` y v1.0 con los mismos datos de 10.000 y 100.000 ventas.
