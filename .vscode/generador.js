function generarVentas() {
    const clientes = Math.max(1, Math.floor(n / 3)); 
    const ventas = [];
    for (let i = 1; i <= n; i++) {
        const productoId = Math.floor(Math.random() * productos) + 1;
        ventas.push({
            id: i,
            productoId,
            cantidad: Math.floor(Math.random() * 10) + 1,
            precio: parseFloat((Math.random() * 100).toFixed(2)),
            ciudad: ciudades[Math.floor(Math.random() * ciudades.length)],
            fecha: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
        });
    }
      const clienteId = Math.floor(Math.random() * clientes) + 1;
}