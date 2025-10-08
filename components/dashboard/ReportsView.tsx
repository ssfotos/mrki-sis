// Fix: Create the ReportsView component.
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Table from '../ui/Table';
import * as XLSX from 'xlsx';

const ReportsView: React.FC = () => {
    const { sales, products, purchases, suppliers, clients } = useApp();
    
    // Default date range: start of the current month to today
    const getMonthStart = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const getToday = () => new Date().toISOString().split('T')[0];

    const [startDate, setStartDate] = useState<string>(getMonthStart());
    const [endDate, setEndDate] = useState<string>(getToday());
    
    const clientMap = useMemo(() => {
        return new Map(clients.map(client => [client.id, client.name]));
    }, [clients]);

    const { filteredSales, filteredPurchases } = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const fs = sales.filter(s => {
            const saleDate = new Date(s.date);
            return saleDate >= start && saleDate <= end;
        });
        const fp = purchases.filter(p => {
            const purchaseDate = new Date(p.date);
            return purchaseDate >= start && purchaseDate <= end;
        })
        return { filteredSales: fs, filteredPurchases: fp };
    }, [sales, purchases, startDate, endDate]);

    const completedSales = useMemo(() => {
        return filteredSales.filter(s => s.status !== 'cancelled');
    }, [filteredSales]);
    
    const totalRevenue = completedSales.reduce((sum, s) => sum + s.total, 0);
    const totalPurchaseCost = filteredPurchases.reduce((sum, p) => sum + p.total, 0);
    
    const detailedSalesReport = useMemo(() => {
        return filteredSales.flatMap(sale =>
            sale.items.map(item => {
                const product = products.find(p => p.id === item.productId);
                const revenue = item.quantity * item.price;
                const cost = item.quantity * (item.costPrice || 0); // Use stored cost price
                const profit = revenue - cost;
                const customerName = sale.clientId ? clientMap.get(sale.clientId) : sale.customerName;

                return {
                    saleId: sale.id,
                    saleDate: sale.date,
                    customerName: customerName || sale.customerName, // Fallback
                    productName: product ? product.name : 'Producto Eliminado',
                    quantity: item.quantity,
                    sellingPrice: item.price,
                    revenue,
                    cost,
                    profit,
                    status: sale.status,
                };
            })
        ).sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
    }, [filteredSales, products, clientMap]);
    
    const totalProfit = detailedSalesReport
        .filter(item => item.status !== 'cancelled')
        .reduce((sum, item) => sum + item.profit, 0);

     const detailedPurchasesReport = useMemo(() => {
        return filteredPurchases.flatMap(purchase =>
            purchase.items.map(item => {
                const product = products.find(p => p.id === item.productId);
                const supplier = suppliers.find(s => s.id === purchase.supplierId);
                return {
                    "ID Compra": purchase.id,
                    "Fecha": new Date(purchase.date).toLocaleDateString(),
                    "Proveedor": supplier?.name || 'N/A',
                    "Producto": product?.name || 'N/A',
                    "Cantidad": item.quantity,
                    "Costo Unitario": item.cost,
                    "Costo Total": item.quantity * item.cost
                };
            })
        ).sort((a, b) => new Date(b.Fecha).getTime() - new Date(a.Fecha).getTime());
    }, [filteredPurchases, products, suppliers]);

    const lowStockProductsReport = useMemo(() => {
        return products
            .filter(p => p.stock >= 0 && p.stock <= p.lowStockThreshold)
            .map(p => ({
                "Producto": p.name,
                "SKU": p.sku || 'N/A',
                "Stock Actual": p.stock,
                "Umbral Stock Bajo": p.lowStockThreshold,
            }));
    }, [products]);

    const negativeStockProductsReport = useMemo(() => {
        return products
            .filter(p => p.stock < 0)
            .map(p => ({
                "Producto": p.name,
                "SKU": p.sku || 'N/A',
                "Stock Actual": p.stock,
            }));
    }, [products]);

    const stockValuationReport = useMemo(() => {
        return products.map(p => ({
            "Producto": p.name,
            "SKU": p.sku || 'N/A',
            "Stock Actual": p.stock,
            "Precio de Costo": p.costPrice,
            "Valor Total": p.stock * p.costPrice
        }));
    }, [products]);
    
    const totalStockValue = useMemo(() => {
        return stockValuationReport.reduce((sum, item) => sum + item["Valor Total"], 0);
    }, [stockValuationReport]);

    const exportToExcel = (data: any[], fileName: string) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
        XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const formattedSalesReport = detailedSalesReport.map(item => ({
        "ID Venta": `#${item.saleId.slice(-6)}`,
        "Fecha": new Date(item.saleDate).toLocaleDateString(),
        "Cliente": item.customerName,
        "Producto": item.productName,
        "Cantidad": item.quantity,
        "P/U Venta": item.sellingPrice.toFixed(2),
        "Ingresos": item.revenue.toFixed(2),
        "Costo": item.cost.toFixed(2),
        "Ganancia": item.profit.toFixed(2),
        "Estado": item.status === 'cancelled' ? 'Anulada' : 'Completada',
    }));


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Reportes</h1>

             <Card title="Filtro por Fechas (Ventas y Compras)">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Desde"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <Input
                        label="Hasta"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Ingresos Totales (Ventas)">
                    <p className="text-3xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
                </Card>
                <Card title="Costos Totales (Compras)">
                    <p className="text-3xl font-bold text-yellow-600">${totalPurchaseCost.toFixed(2)}</p>
                </Card>
                <Card title="Ganancia Bruta (Ventas - Costo)">
                    <p className="text-3xl font-bold text-blue-600">${totalProfit.toFixed(2)}</p>
                </Card>
            </div>

            <Card title="Reporte de Ventas Detallado" actions={<Button size="sm" variant="secondary" onClick={() => exportToExcel(formattedSalesReport, 'reporte_ventas_detallado')}>Exportar a Excel</Button>}>
                 <div className="overflow-x-auto">
                    <Table headers={['ID Venta', 'Fecha', 'Cliente', 'Producto', 'Cant.', 'P/U Venta', 'Ingresos', 'Costo', 'Ganancia', 'Estado']}>
                        {formattedSalesReport.map((item, index) => (
                            <tr key={index} className={item.Estado === 'Anulada' ? 'bg-red-50 text-gray-500 line-through' : ''}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item['ID Venta']}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.Fecha}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{item.Cliente}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.Producto}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{item.Cantidad}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${item['P/U Venta']}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">${item.Ingresos}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-700">${item.Costo}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-700">${item.Ganancia}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        item.Estado === 'Anulada' 
                                        ? 'bg-red-100 text-red-800' 
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                        {item.Estado}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </Table>
                </div>
                 {detailedSalesReport.length === 0 && <p className="text-center text-gray-500 py-4">No hay datos de ventas para mostrar en el rango de fechas seleccionado.</p>}
            </Card>
            
            <Card title="Reporte de Valorización de Stock" actions={<Button size="sm" variant="secondary" onClick={() => exportToExcel(stockValuationReport, 'reporte_valorizacion_stock')}>Exportar a Excel</Button>}>
                <div className="p-4 border-b">
                    <h3 className="text-lg font-medium">Valor Total del Inventario (Costo)</h3>
                    <p className="text-2xl font-bold text-indigo-600">${totalStockValue.toFixed(2)}</p>
                </div>
                <div className="overflow-x-auto">
                    <Table headers={['Producto', 'SKU', 'Stock Actual', 'Precio de Costo', 'Valor Total']}>
                        {stockValuationReport.map((item, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.Producto}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.SKU}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">{item['Stock Actual']}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${item['Precio de Costo'].toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">${item['Valor Total'].toFixed(2)}</td>
                            </tr>
                        ))}
                    </Table>
                </div>
                {stockValuationReport.length === 0 && <p className="text-center text-gray-500 py-4">No hay productos en el inventario para valorar.</p>}
            </Card>

            <Card title="Reporte de Compras Detallado" actions={<Button size="sm" variant="secondary" onClick={() => exportToExcel(detailedPurchasesReport, 'reporte_compras')}>Exportar a Excel</Button>}>
                <div className="overflow-x-auto">
                    <Table headers={['Fecha', 'Proveedor', 'Producto', 'Cantidad', 'Costo Unitario', 'Costo Total']}>
                        {detailedPurchasesReport.map((item, index) => (
                            <tr key={`${item["ID Compra"]}-${index}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.Fecha}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.Proveedor}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.Producto}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{item.Cantidad}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${item['Costo Unitario'].toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">${item['Costo Total'].toFixed(2)}</td>
                            </tr>
                        ))}
                    </Table>
                </div>
                 {detailedPurchasesReport.length === 0 && <p className="text-center text-gray-500 py-4">No hay datos de compras para mostrar en el rango de fechas seleccionado.</p>}
            </Card>
            
            <Card title="Reporte de Productos con Stock Bajo" actions={<Button size="sm" variant="secondary" onClick={() => exportToExcel(lowStockProductsReport, 'reporte_stock_bajo')}>Exportar a Excel</Button>}>
                <div className="overflow-x-auto">
                    <Table headers={['Producto', 'SKU', 'Stock Actual', 'Umbral Stock Bajo']}>
                        {lowStockProductsReport.map((item, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.Producto}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.SKU}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-yellow-700">{item['Stock Actual']}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item['Umbral Stock Bajo']}</td>
                            </tr>
                        ))}
                    </Table>
                </div>
                {lowStockProductsReport.length === 0 && <p className="text-center text-gray-500 py-4">No hay productos con stock bajo en este momento.</p>}
            </Card>

            <Card title="Reporte de Productos con Stock Negativo" actions={<Button size="sm" variant="secondary" onClick={() => exportToExcel(negativeStockProductsReport, 'reporte_stock_negativo')}>Exportar a Excel</Button>}>
                <div className="overflow-x-auto">
                    <Table headers={['Producto', 'SKU', 'Stock Actual']}>
                        {negativeStockProductsReport.map((item, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.Producto}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.SKU}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">{item['Stock Actual']}</td>
                            </tr>
                        ))}
                    </Table>
                </div>
                {negativeStockProductsReport.length === 0 && <p className="text-center text-gray-500 py-4">¡Excelente! No hay productos con stock negativo.</p>}
            </Card>

        </div>
    );
};

export default ReportsView;