import React, { useState, useEffect, useMemo } from 'react';
import { User, Requisition, Product, Department } from '../types';
import { supabaseService } from '../services/supabaseService';
import LoadingScreen from './LoadingScreen';
import ChartBarIcon from './icons/ChartBarIcon';
import CurrencyDollarIcon from './icons/CurrencyDollarIcon';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';
import BuildingOfficeIcon from './icons/BuildingOfficeIcon';
import MegaphoneIcon from './icons/MegaphoneIcon';

interface DashboardOverviewProps {
    user: User;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ user }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [requisitions, setRequisitions] = useState<Requisition[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [announcement, setAnnouncement] = useState<{ content: string; enabled: boolean } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [prods, depts, reqs, activeAnnouncement] = await Promise.all([
                    supabaseService.getProducts(),
                    supabaseService.getDepartments(),
                    user.role === 'Department' && user.departmentId
                        ? supabaseService.getRequisitionsForDepartment(user.departmentId)
                        : supabaseService.getRequisitionsForAdmin(),
                    supabaseService.getAnnouncementSettings()
                ]);
                setProducts(prods);
                setDepartments(depts);
                setAnnouncement(activeAnnouncement);
                
                // Filter requests roughly for current year/month to make dashboard relevant
                const now = new Date();
                const currentMonthReqs = reqs.filter(r => {
                    const reqDate = r.approvedAt || r.submittedAt || r.createdAt;
                    if (!reqDate) return false;
                    const d = new Date(reqDate);
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                });
                // but let's show all time or limit to recent 3 months to have good stats
                const recentReqs = reqs.filter(r => {
                    const reqDate = r.approvedAt || r.submittedAt || r.createdAt;
                    if (!reqDate) return false;
                    const d = new Date(reqDate);
                    return d >= new Date(new Date().setMonth(new Date().getMonth() - 2));
                });

                setRequisitions(recentReqs);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const formatNumber = (num: number) => num.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2});

    const stats = useMemo(() => {
        const productMap = new Map<string, Product>();
        products.forEach(p => productMap.set(p.id, p));

        const deptMap = new Map<string, Department>();
        departments.forEach(d => deptMap.set(d.id, d));

        // 1. รายการที่เบิกบ่อย (Top by frequency of requests)
        const reqFrequency = new Map<string, number>();
        // 2. เวชภัณฑ์มูลค่าสูง (Top by Total Value = Qty * Price)
        const reqValue = new Map<string, number>();
        // 3. ปริมาณการเบิกเพื่อเฝ้าระวัง (Top by total quantity)
        const reqQuantity = new Map<string, number>();
        
        // 4. หน่วยงานเบิกไม่ตรงรอบบ่อย
        const offCycleDepts = new Map<string, number>();

        requisitions.forEach(req => {
            if (!['Ready', 'PartiallyApproved', 'Completed', 'Picking'].includes(req.status)) return;

            if (req.type === 'OffCycle') {
                const dept = deptMap.get(req.departmentId);
                if (dept && dept.type !== 'External') {
                    offCycleDepts.set(req.departmentId, (offCycleDepts.get(req.departmentId) || 0) + 1);
                }
            }

            req.items?.forEach(item => {
                const approvedQty = (['Completed', 'Ready'].includes(req.status) && (item.approvedQuantity ?? 0) > 0)
                            ? (item.approvedQuantity || 0)
                            : (item.quantity || 0);

                if (approvedQty > 0) {
                    const prod = productMap.get(item.productId);
                    const price = item.pricePerUnit ?? prod?.pricePerUnit ?? 0;
                    
                    reqFrequency.set(item.productId, (reqFrequency.get(item.productId) || 0) + 1);
                    reqQuantity.set(item.productId, (reqQuantity.get(item.productId) || 0) + approvedQty);
                    reqValue.set(item.productId, (reqValue.get(item.productId) || 0) + (approvedQty * price));
                }
            });
        });

        let filteredProducts = Array.from(productMap.values());
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredProducts = filteredProducts.filter(p => (p.name || '').toLowerCase().includes(query));
        }
        
        const filteredProductIds = new Set(filteredProducts.map(p => p.id));

        const topFrequent = Array.from(reqFrequency.entries())
            .filter(([id]) => filteredProductIds.has(id))
            .map(([id, count]) => ({ product: productMap.get(id), count }))
            .filter(x => x.product)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const topValue = Array.from(reqValue.entries())
            .filter(([id]) => filteredProductIds.has(id))
            .map(([id, value]) => ({ product: productMap.get(id), value }))
            .filter(x => x.product)
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
        
        const topQuantityWatch = Array.from(reqQuantity.entries())
            .filter(([id]) => filteredProductIds.has(id))
            .map(([id, qty]) => ({ product: productMap.get(id), qty }))
            .filter(x => x.product)
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);

        const topOffCycle = Array.from(offCycleDepts.entries())
            .map(([id, count]) => ({ dept: deptMap.get(id), count }))
            .filter(x => x.dept)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const totalCostThisPeriod = Array.from(reqValue.values()).reduce((sum, v) => sum + v, 0);

        return { topFrequent, topValue, topQuantityWatch, topOffCycle, totalCostThisPeriod };

    }, [requisitions, products, departments, searchQuery]);

    if (isLoading) return <LoadingScreen message="กำลังโหลดข้อมูลแดชบอร์ด..." />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">ภาพรวมระบบ</h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อเวชภัณฑ์..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg w-full md:w-64 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <svg className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-sky-500 to-indigo-600 p-6 rounded-2xl text-white shadow-md">
                    <h3 className="font-semibold text-sky-100 flex items-center gap-2 mb-2">
                        <CurrencyDollarIcon className="w-5 h-5" /> มูลค่าการเบิกจ่าย (3 เดือนล่าสุด)
                    </h3>
                    <p className="text-3xl font-bold">{formatNumber(stats.totalCostThisPeriod)} <span className="text-lg font-normal">บาท</span></p>
                </div>
                <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 rounded-2xl text-white shadow-md">
                    <h3 className="font-semibold text-rose-100 flex items-center gap-2 mb-2">
                        <ChartBarIcon className="w-5 h-5" /> จำนวนรายการเบิกทั้งหมด (3 เดือนล่าสุด)
                    </h3>
                    <p className="text-3xl font-bold">{requisitions.filter(r => ['Ready', 'PartiallyApproved', 'Completed', 'Picking'].includes(r.status)).length} <span className="text-lg font-normal">บิล</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5 text-sky-500" />
                        5 อันดับ รายการที่เบิกบ่อยที่สุด
                    </h3>
                    <div className="space-y-3">
                        {stats.topFrequent.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300 flex items-center justify-center font-bold text-sm">
                                        {idx + 1}
                                    </div>
                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.product?.name}</div>
                                </div>
                                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.count} <span className="font-normal text-slate-500">ครั้ง</span></div>
                            </div>
                        ))}
                        {stats.topFrequent.length === 0 && <p className="text-center text-slate-500 py-4">ไม่มีข้อมูล</p>}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <CurrencyDollarIcon className="w-5 h-5 text-emerald-500" />
                        5 อันดับ เวชภัณฑ์มูลค่าสูง (เบิกเยอะสุด)
                    </h3>
                    <div className="space-y-3">
                        {stats.topValue.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                                        {idx + 1}
                                    </div>
                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.product?.name}</div>
                                </div>
                                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatNumber(item.value)} <span className="font-normal text-slate-500">บาท</span></div>
                            </div>
                        ))}
                        {stats.topValue.length === 0 && <p className="text-center text-slate-500 py-4">ไม่มีข้อมูล</p>}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
                        รายการที่มีปริมาณเบิกสูง (ควรเฝ้าระวัง)
                    </h3>
                    <div className="space-y-3">
                        {stats.topQuantityWatch.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold text-sm">
                                        {idx + 1}
                                    </div>
                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.product?.name}</div>
                                </div>
                                <div className="text-sm font-bold text-amber-600 dark:text-amber-400">{item.qty.toLocaleString()} <span className="font-normal text-slate-500">{item.product?.unit}</span></div>
                            </div>
                        ))}
                        {stats.topQuantityWatch.length === 0 && <p className="text-center text-slate-500 py-4">ไม่มีข้อมูล</p>}
                    </div>
                </div>

                {user.role !== 'Department' && (
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <BuildingOfficeIcon className="w-5 h-5 text-purple-500" />
                        การเบิกนอกยอด/ไม่ตรงรอบ (บ่อยที่สุด)
                    </h3>
                    <div className="space-y-3">
                        {stats.topOffCycle.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-sm">
                                        {idx + 1}
                                    </div>
                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.dept?.name}</div>
                                </div>
                                <div className="text-sm font-bold text-purple-600 dark:text-purple-400">{item.count} <span className="font-normal text-slate-500">บิล</span></div>
                            </div>
                        ))}
                        {stats.topOffCycle.length === 0 && <p className="text-center text-slate-500 py-4">เดือนนี้ไม่มีการเบิกนอกยอด</p>}
                    </div>
                </div>
                )}

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <MegaphoneIcon className="w-5 h-5 text-purple-500" />
                        ประกาศ / สถานะการเบิกเวชภัณฑ์
                    </h3>
                    <div className="space-y-3">
                        {announcement && announcement.enabled ? (
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[100px] flex items-center justify-center">
                                <div className="prose dark:prose-invert prose-sm max-w-none text-slate-700 dark:text-slate-200 w-full text-center" dangerouslySetInnerHTML={{ __html: announcement.content }} />
                            </div>
                        ) : (
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[100px] flex items-center justify-center">
                                <p className="text-center text-slate-500">ไม่มีประกาศในขณะนี้</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
