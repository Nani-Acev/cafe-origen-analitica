function totalVentasPorProducto(ventas, c){
    let total = 0;
    for (const venta of ventas) { c.ops++; total += valorVenta(venta); }
    return total;
} 