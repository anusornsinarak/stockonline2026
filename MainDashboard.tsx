
import React, { useState, useEffect } from 'react';
import { User, AppView } from './types';
import DashboardItem from './components/DashboardItem';
import Modal from './components/Modal';
// Icons
import ClipboardDocumentListIcon from './components/icons/ClipboardDocumentListIcon';
import DocumentChartBarIcon from './components/icons/DocumentChartBarIcon';
import DocumentTextIcon from './components/icons/DocumentTextIcon';
import ChartBarIcon from './components/icons/ChartBarIcon';
import CubeIcon from './components/icons/CubeIcon';
import ShoppingCartIcon from './components/icons/ShoppingCartIcon';
import InboxArrowDownIcon from './components/icons/InboxArrowDownIcon';
import BuildingOfficeIcon from './components/icons/BuildingOfficeIcon';
import UsersIcon from './components/icons/UsersIcon';
import MegaphoneIcon from './components/icons/MegaphoneIcon';
import ArchiveBoxIcon from './components/icons/ArchiveBoxIcon';
import CogIcon from './components/icons/CogIcon';
import HomeIcon from './components/icons/HomeIcon';
import ClipboardDocumentCheckIcon from './components/icons/ClipboardDocumentCheckIcon';
import CalculatorIcon from './components/icons/CalculatorIcon';
import CalendarDaysIcon from './components/icons/CalendarDaysIcon';
import ListBulletIcon from './components/icons/ListBulletIcon';
import UserGroupIcon from './components/icons/UserGroupIcon';
import ArchiveBoxArrowDownIcon from './components/icons/ArchiveBoxArrowDownIcon';
import PaperAirplaneIcon from './components/icons/PaperAirplaneIcon';
import SpeakerWaveIcon from './components/icons/SpeakerWaveIcon';
import DocumentPlusIcon from './components/icons/DocumentPlusIcon';
import QrCodeIcon from './components/icons/QrCodeIcon';

interface MainDashboardProps {
  user: User;
  onNavigate: (view: AppView) => void;
}

interface DashboardItemConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
  view: AppView;
}

const MainDashboard: React.FC<MainDashboardProps> = ({ user, onNavigate }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [hiddenItems, setHiddenItems] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(`dashboard_hidden_${user.id}`);
    if (saved) {
      try {
        setHiddenItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse hidden items', e);
      }
    }
  }, [user.id]);

  const toggleItem = (label: string) => {
    const newHidden = hiddenItems.includes(label)
      ? hiddenItems.filter(l => l !== label)
      : [...hiddenItems, label];
    setHiddenItems(newHidden);
    localStorage.setItem(`dashboard_hidden_${user.id}`, JSON.stringify(newHidden));
  };

  const resetSettings = () => {
    setHiddenItems([]);
    localStorage.removeItem(`dashboard_hidden_${user.id}`);
  };

  const getDashboardItems = (): DashboardItemConfig[] => {
    switch (user.role) {
      case 'Department':
        return [
          { label: 'เบิกเวชภัณฑ์', icon: <ClipboardDocumentListIcon className="w-full h-full p-2" />, color: 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-400', view: { type: 'department', payload: 'requisition' } },
          { label: 'รายการค้างจ่าย/ยืม', icon: <ArchiveBoxArrowDownIcon className="w-full h-full p-2" />, color: 'bg-purple-500 hover:bg-purple-600 focus:ring-purple-400', view: { type: 'department', payload: 'backorders' } },
          { label: 'แบบสำรวจประจำปี', icon: <DocumentTextIcon className="w-full h-full p-2" />, color: 'bg-green-500 hover:bg-green-600 focus:ring-green-400', view: { type: 'department', payload: 'survey' } },
          { label: 'คลังของฉัน', icon: <ArchiveBoxIcon className="w-full h-full p-2" />, color: 'bg-teal-500 hover:bg-teal-600 focus:ring-teal-400', view: { type: 'department', payload: 'inventory' } },
          { label: 'สแกนใช้', icon: <QrCodeIcon className="w-full h-full p-2" />, color: 'bg-rose-500 hover:bg-rose-600 focus:ring-rose-400', view: { type: 'department', payload: 'usage_scanner' } },
          { label: 'รายงานการเบิก', icon: <DocumentChartBarIcon className="w-full h-full p-2" />, color: 'bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-400', view: { type: 'department', payload: 'report' } },
          { label: 'ตั้งค่าการแจ้งเตือน', icon: <MegaphoneIcon className="w-full h-full p-2" />, color: 'bg-slate-600 hover:bg-slate-700 focus:ring-slate-500', view: { type: 'department', payload: 'settings' } },
        ];
      case 'Warehouse':
        const warehouseItems: DashboardItemConfig[] = [
          { label: 'ใบเบิก', icon: <ClipboardDocumentListIcon className="w-full h-full p-3" />, color: 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-400', view: { type: 'warehouse', payload: 'requisitions' } },
        ];
        
        if (user.permissions?.canManageReceipts) {
            warehouseItems.push({ label: 'รับของ', icon: <InboxArrowDownIcon className="w-full h-full p-3" />, color: 'bg-cyan-500 hover:bg-cyan-600 focus:ring-cyan-400', view: { type: 'warehouse', payload: 'receipts' } });
        }
        if (user.permissions?.canViewStockCard) {
            warehouseItems.push({ label: 'คลัง', icon: <CubeIcon className="w-full h-full p-3" />, color: 'bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-400', view: { type: 'warehouse', payload: 'stockCard' } });
        }
        
        warehouseItems.push({ label: 'สร้างแทน', icon: <DocumentPlusIcon className="w-full h-full p-3" />, color: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500', view: { type: 'warehouse', payload: 'create_for_dept' } });
        warehouseItems.push({ label: 'ระบบยืม', icon: <ClipboardDocumentCheckIcon className="w-full h-full p-3" />, color: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500', view: { type: 'warehouse', payload: 'loanSystem' } });

        if (user.permissions?.canViewReports) {
            warehouseItems.push({ label: 'รายงาน', icon: <ChartBarIcon className="w-full h-full p-3" />, color: 'bg-red-500 hover:bg-red-600 focus:ring-red-400', view: { type: 'warehouse', payload: 'reports' } });
        }
        return warehouseItems;
      case 'Admin':
        return [
          // Workflow / Operations
          { label: 'ภาพรวม', icon: <HomeIcon className="w-full h-full p-3" />, color: 'bg-sky-500 hover:bg-sky-600 focus:ring-sky-400', view: { type: 'admin', payload: 'summary' } },
          { label: 'ผลรายหน่วยงาน', icon: <DocumentTextIcon className="w-full h-full p-2" />, color: 'bg-green-500 hover:bg-green-600 focus:ring-green-400', view: { type: 'admin', payload: 'departments' } },
          { label: 'วางแผนจัดซื้อ', icon: <CalculatorIcon className="w-full h-full p-2" />, color: 'bg-lime-500 hover:bg-lime-600 focus:ring-lime-400', view: { type: 'admin', payload: 'purchasePlan' } },
          { label: 'รายการเบิก', icon: <ClipboardDocumentListIcon className="w-full h-full p-2" />, color: 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-400', view: { type: 'admin', payload: 'requisitions' } },
          { label: 'ระบบยืม-คืนสินค้า', icon: <ClipboardDocumentCheckIcon className="w-full h-full p-2" />, color: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500', view: { type: 'admin', payload: 'loanSystem' } },
          { label: 'สร้างใบเบิกแทน', icon: <DocumentPlusIcon className="w-full h-full p-2" />, color: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500', view: { type: 'admin', payload: 'create_for_dept' } },
          { label: 'จัดซื้อ', icon: <ShoppingCartIcon className="w-full h-full p-2" />, color: 'bg-teal-500 hover:bg-teal-600 focus:ring-teal-400', view: { type: 'admin', payload: 'purchaseOrder' } },
          { label: 'รับของ', icon: <InboxArrowDownIcon className="w-full h-full p-2" />, color: 'bg-cyan-500 hover:bg-cyan-600 focus:ring-cyan-400', view: { type: 'admin', payload: 'receipts' } },
          { label: 'คลังและสต็อกการ์ด', icon: <CubeIcon className="w-full h-full p-2" />, color: 'bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-400', view: { type: 'admin', payload: 'stockCard' } },
          { label: 'สินค้าใกล้หมดอายุ', icon: <CalendarDaysIcon className="w-full h-full p-2" />, color: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400', view: { type: 'admin', payload: 'expiringStock' } },
          { label: 'จัดการรายการ/บริษัท', icon: <ListBulletIcon className="w-full h-full p-2" />, color: 'bg-purple-500 hover:bg-purple-600 focus:ring-purple-400', view: { type: 'admin', payload: 'manageItems' } },
          { label: 'จัดการ Min/Max Stock', icon: <CogIcon className="w-full h-full p-2" />, color: 'bg-pink-500 hover:bg-pink-600 focus:ring-pink-400', view: { type: 'admin', payload: 'manageStockLevels' } },
          { label: 'จัดการหน่วยงาน', icon: <BuildingOfficeIcon className="w-full h-full p-2" />, color: 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-400', view: { type: 'admin', payload: 'manageDepts' } },
          { label: 'จัดการผู้ใช้', icon: <UsersIcon className="w-full h-full p-2" />, color: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400', view: { type: 'admin', payload: 'manageUsers' } },
          { label: 'จัดการบุคลากร', icon: <UserGroupIcon className="w-full h-full p-2" />, color: 'bg-fuchsia-500 hover:bg-fuchsia-600 focus:ring-fuchsia-400', view: { type: 'admin', payload: 'managePersonnel' } },
          { label: 'จัดการประกาศข่าว', icon: <SpeakerWaveIcon className="w-full h-full p-2" />, color: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500', view: { type: 'admin', payload: 'manageAnnouncements' } },
          { label: 'ส่งการแจ้งเตือน', icon: <PaperAirplaneIcon className="w-full h-full p-2" />, color: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400', view: { type: 'admin', payload: 'notifications' } },
          { label: 'ตั้งค่าการแจ้งเตือน', icon: <MegaphoneIcon className="w-full h-full p-2" />, color: 'bg-green-600 hover:bg-green-700 focus:ring-green-500', view: { type: 'admin', payload: 'accountSettings' } },
          { label: 'รายงาน', icon: <ChartBarIcon className="w-full h-full p-2" />, color: 'bg-red-500 hover:bg-red-600 focus:ring-red-400', view: { type: 'admin', payload: 'reports' } },
          { label: 'ตั้งค่าเอกสาร', icon: <CogIcon className="w-full h-full p-2" />, color: 'bg-slate-500 hover:bg-slate-600 focus:ring-slate-400', view: { type: 'admin', payload: 'documentSettings' } },
          { label: 'สำรอง/กู้คืน', icon: <ArchiveBoxIcon className="w-full h-full p-2" />, color: 'bg-gray-700 hover:bg-gray-800 focus:ring-gray-600', view: { type: 'admin', payload: 'system' } },
          { label: 'ประวัติระบบ', icon: <ClipboardDocumentCheckIcon className="w-full h-full p-2" />, color: 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-400', view: { type: 'admin', payload: 'logs' } },
        ];
      default:
        return [];
    }
  };

  const allItems = getDashboardItems();
  const visibleItems = allItems.filter(item => !hiddenItems.includes(item.label));

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 relative">
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm font-medium"
        >
          <CogIcon className="w-4 h-4" />
          <span>ตั้งค่าแดชบอร์ด</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {visibleItems.map(item => (
          <DashboardItem
            key={item.label}
            label={item.label}
            icon={item.icon}
            color={item.color}
            onClick={() => onNavigate(item.view)}
          />
        ))}
      </div>

      {visibleItems.length === 0 && (
        <div className="text-center py-20">
          <p className="text-slate-500 dark:text-slate-400 mb-4">คุณซ่อนไอคอนทั้งหมดไว้</p>
          <button
            onClick={() => setShowSettings(true)}
            className="text-sky-600 dark:text-sky-400 font-medium hover:underline"
          >
            เปิดการตั้งค่าเพื่อเลือกแสดงไอคอน
          </button>
        </div>
      )}

      {showSettings && (
        <Modal
          isOpen={showSettings}
          title="ตั้งค่าการแสดงผลแดชบอร์ด"
          onClose={() => setShowSettings(false)}
          size="2xl"
        >
          <div className="p-1">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              เลือกไอคอนที่คุณต้องการให้แสดงบนหน้าแดชบอร์ดของคุณ
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {allItems.map(item => {
                const isHidden = hiddenItems.includes(item.label);
                return (
                  <label
                    key={item.label}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      !isHidden 
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20' 
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      checked={!isHidden}
                      onChange={() => toggleItem(item.label)}
                    />
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${item.color.split(' ')[0]}`}>
                      {React.cloneElement(item.icon as React.ReactElement, { className: 'w-5 h-5' })}
                    </div>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
                  </label>
                );
              })}
            </div>

            <div className="mt-8 flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={resetSettings}
                className="text-sm text-slate-500 hover:text-red-500 transition-colors"
              >
                ล้างการตั้งค่าทั้งหมด
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold transition-all shadow-md shadow-sky-200 dark:shadow-none"
              >
                ตกลง
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MainDashboard;
