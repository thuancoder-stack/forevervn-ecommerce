import React from 'react'
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar'
import { Link, useLocation } from 'react-router-dom'
import { PlusCircle, List, Package, LayoutDashboard, Users, Ticket, Layers, History, ListTree, Image, MessageSquare, Zap } from 'lucide-react'
import { useAdminLocale } from '../lib/adminLocale'

const ALL_NAV_ITEMS = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, labelKey: 'dashboard', roles: ['Admin'], group: 'CORE' },
  { to: '/employees', icon: <Users size={18} />, labelKey: 'employees', roles: ['Admin'], group: 'CORE' },
  { to: '/customers', icon: <Users size={18} />, labelKey: 'customers', roles: ['Admin'], group: 'CORE' },

  { to: '/categories', icon: <Layers size={18} />, labelKey: 'categories', roles: ['Admin', 'Employee'], group: 'CATALOG' },
  { to: '/sub-categories', icon: <ListTree size={18} />, labelKey: 'subCategories', roles: ['Admin', 'Employee'], group: 'CATALOG' },
  { to: '/add', icon: <PlusCircle size={18} />, labelKey: 'add', roles: ['Admin', 'Employee'], group: 'CATALOG' },
  { to: '/list', icon: <List size={18} />, labelKey: 'list', roles: ['Admin', 'Employee'], group: 'CATALOG' },
  { to: '/banners', icon: <Image size={18} />, labelKey: 'banners', roles: ['Admin', 'Employee'], group: 'CATALOG' },
  { to: '/reviews', icon: <MessageSquare size={18} />, labelKey: 'reviews', roles: ['Admin', 'Employee'], group: 'CATALOG' },

  { to: '/import-batch', icon: <Package size={18} />, labelKey: 'importBatch', roles: ['Admin', 'Employee'], group: 'COMMERCE' },
  { to: '/bulk-operation', icon: <Zap size={18} />, labelKey: 'bulkOperation', roles: ['Admin'], group: 'COMMERCE' },
  { to: '/vouchers', icon: <Ticket size={18} />, labelKey: 'vouchers', roles: ['Admin'], group: 'COMMERCE' },
  { to: '/orders', icon: <Package size={18} />, labelKey: 'orders', roles: ['Admin', 'Employee'], group: 'COMMERCE' },
  { to: '/returns', icon: <History size={18} />, labelKey: 'returns', roles: ['Admin', 'Employee'], group: 'COMMERCE' },
  { to: '/audit-logs', icon: <History size={18} />, labelKey: 'auditLogs', roles: ['Admin'], group: 'COMMERCE' },
]

const NAV_GROUPS = ['CORE', 'CATALOG', 'COMMERCE']

const SidebarComponent = () => {
  const location = useLocation()
  const { t } = useAdminLocale()
  
  let role = 'Admin';
  try {
     const token = localStorage.getItem('token');
     if (token) {
         const payload = JSON.parse(atob(token.split('.')[1]));
         if (payload.role) role = payload.role;
     }
  } catch(e) { }

  const navItems = ALL_NAV_ITEMS.filter(item => item.roles.includes(role));

  const isItemActive = (to) => {
    if (to === '/add') {
      return ['/add', '/add-item', '/add-items'].includes(location.pathname)
    }
    return location.pathname === to
  }

  return (
    <Sidebar
      rootStyles={{
        width: '220px',
        height: 'auto',
        minHeight: '100%',
        borderRight: '1px solid var(--admin-border)',
        background: 'var(--admin-glass)',
        backdropFilter: 'blur(22px)',
        boxShadow: '8px 0 22px rgba(15, 23, 42, 0.03)',
      }}
    >
      <div className='py-2 sticky top-[96px]'>
        {NAV_GROUPS.map((group) => {
          const items = navItems.filter((item) => item.group === group)
          if (!items.length) return null

          return (
            <div key={group} className='mb-3'>
              <div className='px-5 pb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--admin-tertiary)]/80'>
                {t(`sidebar.groups.${group}`, group)}
              </div>
              <Menu
                menuItemStyles={{
                  button: ({ active }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 14px',
                    margin: '4px 10px',
                    borderRadius: '14px',
                    fontSize: '13px',
                    fontWeight: active ? '600' : '500',
                    color: active ? 'var(--admin-text)' : 'var(--admin-muted)',
                    background: active ? 'var(--admin-surface-soft)' : 'transparent',
                    border: active ? '1px solid var(--admin-border)' : '1px solid transparent',
                    boxShadow: active ? '0 10px 22px rgba(15, 23, 42, 0.05)' : 'none',
                    '&:hover': {
                      backgroundColor: 'var(--admin-surface-soft)',
                      color: 'var(--admin-text)',
                    },
                  }),
                  icon: ({ active }) => ({
                    color: active ? 'var(--admin-tertiary)' : 'var(--admin-muted)',
                  }),
                }}
              >
                {items.map(({ to, icon, labelKey }) => (
                  <MenuItem
                    key={to}
                    icon={icon}
                    component={<Link to={to} />}
                    active={isItemActive(to)}
                  >
                    {t(`sidebar.items.${labelKey}`, labelKey)}
                  </MenuItem>
                ))}
              </Menu>
            </div>
          )
        })}
      </div>
    </Sidebar>
  )
}

export default SidebarComponent
