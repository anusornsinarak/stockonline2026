import React, { useState, useEffect, useMemo } from 'react';
import { Department, Product, Requisition, DepartmentInventoryItem } from '../../types';
import { supabaseService } from '../../services/supabaseService';
import LoadingScreen from '../LoadingScreen';
import PrinterIcon from '../icons/PrinterIcon';
import ShareIcon from '../icons/ShareIcon';

interface DepartmentReportViewProps {
    department: Department;
}

interface ReportItem {
    product: Product;
    requisitionedQuantity: number;
    pricePerUnit: number;
    totalValue: number;
    minStock: number | null;
    maxStock: number | null;
    currentStock: number;
    reserveRate: number | null; // Percentage
}

const DepartmentReportView: React.FC<DepartmentReportViewProps> = ({ department }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [requisitions, setRequisitions] = useState<Requisition[]>([]);
    const [inventory, setInventory] = useState<DepartmentInventoryItem[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [reqs, inv, prods] = await Promise.all([
                    supabaseService.getRequisitionsForDepartment(department.id),
                    supabaseService.getDepartmentInventory(department.id),
                    supabaseService.getProducts()
                ]);
                setRequisitions(reqs);
                setInventory(inv);
                setProducts(prods);
            } catch (err) {
                console.error(err);
                setError('ไม่สามารถโหลดข้อมูลรายงานได้');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [department.id]);

    const reportData = useMemo(() => {
        const [year, month] = selectedMonth.split('-');
        
        // Filter requisitions for the selected month and status 'Completed'
        const filteredReqs = requisitions.filter(req => {
            if (req.status !== 'Completed') return false;
            // Strictly use approvedAt for reports as per user requirement
            const reportDate = req.approvedAt ? new Date(req.approvedAt) : null;
            if (!reportDate) return false;
            return reportDate.getFullYear() === parseInt(year) && (reportDate.getMonth() + 1) === parseInt(month);
        });

        const itemMap = new Map<string, ReportItem>();

        filteredReqs.forEach(req => {
            req.items?.forEach(item => {
                if (['Approved', 'Fulfilled', 'Loaned', 'LoanFulfilled'].includes(item.status) && item.approvedQuantity && item.approvedQuantity > 0) {
                    const product = products.find(p => p.id === item.productId);
                    if (!product) return;

                    const existing = itemMap.get(item.productId);
                    const qty = item.approvedQuantity;
                    const pricePerUnit = item.pricePerUnit || product.pricePerUnit || 0;
                    const value = qty * pricePerUnit;

                    if (existing) {
                        existing.requisitionedQuantity += qty;
                        existing.totalValue += value;
                        existing.pricePerUnit = pricePerUnit; // Update to latest or keep average? Just keep latest for simplicity.
                    } else {
                        const invItem = inventory.find(i => i.productId === item.productId);
                        const currentStock = invItem?.quantity || 0;
                        const maxStock = invItem?.maxStock || null;
                        
                        let reserveRate = null;
                        if (maxStock && maxStock > 0) {
                            reserveRate = currentStock / maxStock;
                        }

                        itemMap.set(item.productId, {
                            product,
                            requisitionedQuantity: qty,
                            pricePerUnit,
                            totalValue: value,
                            minStock: invItem?.minStock || null,
                            maxStock,
                            currentStock,
                            reserveRate
                        });
                    }
                }
            });
        });

        return Array.from(itemMap.values()).sort((a, b) => a.product.name.localeCompare(b.product.name, 'th'));
    }, [requisitions, inventory, products, selectedMonth]);

    const totalReportValue = reportData.reduce((sum, item) => sum + item.totalValue, 0);

    const handlePrint = () => {
        setIsPrinting(true);
    };

    useEffect(() => {
        if (isPrinting) {
            const handleAfterPrint = () => setIsPrinting(false);
            window.addEventListener('afterprint', handleAfterPrint, { once: true });
            setTimeout(() => window.print(), 100);
            return () => window.removeEventListener('afterprint', handleAfterPrint);
        }
    }, [isPrinting]);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `รายงานการเบิกเวชภัณฑ์ - ${department.name}`,
                    text: `รายงานการเบิกเวชภัณฑ์ประจำเดือน ${selectedMonth} ของหน่วยงาน ${department.name}\nมูลค่ารวม: ฿${totalReportValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    url: window.location.href,
                });
            } catch (error) {
                console.error('Error sharing', error);
            }
        } else {
            alert('เบราว์เซอร์ของคุณไม่รองรับการแชร์โดยตรง');
        }
    };

    if (isLoading) return <LoadingScreen message="กำลังโหลดข้อมูลรายงาน..." />;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    return (
        <div className="max-w-6xl mx-auto bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg">
            <div className="no-print">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">รายงานการเบิกประจำเดือน</h2>
                        <p className="text-slate-600 dark:text-slate-300">หน่วยงาน: <span className="font-semibold">{department.name}</span></p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <input 
                            type="month" 
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                        <button
                            onClick={handlePrint}
                            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <PrinterIcon className="w-5 h-5"/>
                            <span>พิมพ์ / PDF</span>
                        </button>
                        <button
                            onClick={handleShare}
                            className="bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                        >
                            <ShareIcon className="w-5 h-5"/>
                            <span>แชร์</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Print View and Screen View */}
            <div className={`print:block ${isPrinting ? 'block' : 'block'}`}>
                <div className="text-center mb-6">
                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 print:text-black">รายงานการเบิกเวชภัณฑ์มิใช่ยา</h1>
                    <p className="text-slate-600 dark:text-slate-300 print:text-black">หน่วยงาน {department.name}</p>
                    <p className="text-slate-600 dark:text-slate-300 print:text-black">ประจำเดือน: {selectedMonth}</p>
                </div>

                {reportData.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400 print:text-black">
                        ไม่พบข้อมูลการเบิกที่เสร็จสมบูรณ์ในเดือนนี้
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse border border-slate-300 dark:border-slate-600 print:border-black text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-700 print:bg-transparent">
                                <tr>
                                    <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-center w-12">ลำดับ</th>
                                    <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-left">รายการ</th>
                                    <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-center w-20">หน่วย</th>
                                    <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-right w-24">จำนวนที่ได้รับ</th>
                                    <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-right w-28">ราคา/หน่วย</th>
                                    <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-right w-28">มูลค่า (บาท)</th>
                                    <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-center w-20">Min</th>
                                    <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-center w-20">Max</th>
                                    <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-center w-24">คงเหลือ</th>
                                    <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-center w-28">อัตราสำรองคลัง</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((item, index) => (
                                    <tr key={item.product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 print:hover:bg-transparent">
                                        <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-center">{index + 1}</td>
                                        <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2">{item.product.name}</td>
                                        <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-center">{item.product.unit}</td>
                                        <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-right font-semibold text-sky-700 dark:text-sky-400 print:text-black">{item.requisitionedQuantity.toLocaleString()}</td>
                                        <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-right">{item.pricePerUnit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-right">{item.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-center">{item.minStock ?? '-'}</td>
                                        <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-center">{item.maxStock ?? '-'}</td>
                                        <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-center font-semibold">{item.currentStock.toLocaleString()}</td>
                                        <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-center">
                                            {item.reserveRate !== null ? (
                                                <span className={`${item.reserveRate < 0.3 ? 'text-red-600 dark:text-red-400 print:text-black' : item.reserveRate > 1 ? 'text-orange-600 dark:text-orange-400 print:text-black' : 'text-emerald-600 dark:text-emerald-400 print:text-black'}`}>
                                                    {item.reserveRate.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                                </span>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-100 dark:bg-slate-700 print:bg-transparent font-bold">
                                    <td colSpan={5} className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-right">รวมมูลค่าทั้งสิ้น</td>
                                    <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2 text-right text-lg text-sky-700 dark:text-sky-400 print:text-black">
                                        ฿{totalReportValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td colSpan={4} className="border border-slate-300 dark:border-slate-600 print:border-black p-2"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
                
                <div className="mt-12 hidden print:flex justify-between px-12 text-black">
                    <div className="text-center">
                        <p className="mb-12">ลงชื่อ.......................................................ผู้รายงาน</p>
                        <p>(.......................................................)</p>
                        <p>ตำแหน่ง.......................................................</p>
                    </div>
                    <div className="text-center">
                        <p className="mb-12">ลงชื่อ.......................................................หัวหน้างาน/ผู้รับรอง</p>
                        <p>(.......................................................)</p>
                        <p>ตำแหน่ง.......................................................</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepartmentReportView;
