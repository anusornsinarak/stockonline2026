
import React, { useState } from 'react';
import { User, AppView } from './types';
import DashboardItem from './components/DashboardItem';
// Icons
import ClipboardDocumentListIcon from './components/icons/ClipboardDocumentListIcon';
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

  const getDashboardItems = (): DashboardItemConfig[] => {
    switch (user.role) {
      case 'Department':
        return [
          { label: 'เบิกเวชภัณฑ์', icon: <ClipboardDocumentListIcon className="w-full h-full p-2" />, color: 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-400', view: { type: 'department', payload: 'requisition' } },
          { label: 'รายการค้างจ่าย/ยืม', icon: <ArchiveBoxArrowDownIcon className="w-full h-full p-2" />, color: 'bg-purple-500 hover:bg-purple-600 focus:ring-purple-400', view: { type: 'department', payload: 'backorders' } },
          { label: 'แบบสำรวจประจำปี', icon: <DocumentTextIcon className="w-full h-full p-2" />, color: 'bg-green-500 hover:bg-green-600 focus:ring-green-400', view: { type: 'department', payload: 'survey' } },
          { label: 'คลังของฉัน', icon: <ArchiveBoxIcon className="w-full h-full p-2" />, color: 'bg-teal-500 hover:bg-teal-600 focus:ring-teal-400', view: { type: 'department', payload: 'inventory' } },
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
          { label: 'ค้างจ่าย/ยืม', icon: <ArchiveBoxArrowDownIcon className="w-full h-full p-2" />, color: 'bg-slate-700 hover:bg-slate-800 focus:ring-slate-600', view: { type: 'admin', payload: { tab: 'requisitions', subTab: 'backorders_loans' } } },
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

  const items = getDashboardItems();

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 relative">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {items.map(item => (
          <DashboardItem
            key={item.label}
            label={item.label}
            icon={item.icon}
            color={item.color}
            onClick={() => onNavigate(item.view)}
          />
        ))}
      </div>
    </div>
  );
};

export default MainDashboard;
