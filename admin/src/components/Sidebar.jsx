import React from 'react'
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar'
import { Link, useLocation } from 'react-router-dom'
import { PlusCircle, List, Package, LayoutDashboard, Users, Ticket, Layers, History, ListTree, Image, MessageSquare, Zap } from 'lucide-react'

const ALL_NAV_ITEMS = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard', roles: ['Admin'], group: 'CORE' },
  { to: '/employees', icon: <Users size={18} />, label: 'Employees', roles: ['Admin'], group: 'CORE' },
  { to: '/customers', icon: <Users size={18} />, label: 'Customers', roles: ['Admin'], group: 'CORE' },

  { to: '/categories', icon: <Layers size={18} />, label: 'Categories', roles: ['Admin', 'Employee'], group: 'CATALOG' },
  { to: '/sub-categories', icon: <ListTree size={18} />, label: 'Sub-Categories', roles: ['Admin', 'Employee'], group: 'CATALOG' },
  { to: '/add', icon: <PlusCircle size={18} />, label: 'Add Items', roles: ['Admin', 'Employee'], group: 'CATALOG' },
  { to: '/list', icon: <List size={18} />, label: 'List Items', roles: ['Admin', 'Employee'], group: 'CATALOG' },
  { to: '/banners', icon: <Image size={18} />, label: 'Banners', roles: ['Admin', 'Employee'], group: 'CATALOG' },
  { to: '/reviews', icon: <MessageSquare size={18} />, label: 'Reviews', roles: ['Admin', 'Employee'], group: 'CATALOG' },

  { to: '/import-batch', icon: <Package size={18} />, label: 'Imports Hub', roles: ['Admin', 'Employee'], group: 'COMMERCE' },
  { to: '/bulk-operation', icon: <Zap size={18} />, label: 'Smart Ops', roles: ['Admin'], group: 'COMMERCE' },
  { to: '/vouchers', icon: <Ticket size={18} />, label: 'Vouchers', roles: ['Admin'], group: 'COMMERCE' },
  { to: '/orders', icon: <Package size={18} />, label: 'Orders', roles: ['Admin', 'Employee'], group: 'COMMERCE' },
  { to: '/audit-logs', icon: <History size={18} />, label: 'Audit Logs', roles: ['Admin'], group: 'COMMERCE' },
]

const NAV_GROUPS = ['CORE', 'CATALOG', 'COMMERCE']

const SidebarComponent = () => {
  const location = useLocation()
  
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
        height: 'calc(100vh - 98px)',
        borderRight: '1px solid var(--admin-border)',
        background: 'var(--admin-glass)',
        backdropFilter: 'blur(22px)',
        width: '244px',
        boxShadow: '12px 0 30px rgba(15, 23, 42, 0.03)',
      }}
    >
      <div className='admin-scrollbar h-full overflow-y-auto py-3'>
        {NAV_GROUPS.map((group) => {
          const items = navItems.filter((item) => item.group === group)
          if (!items.length) return null

          return (
            <div key={group} className='mb-4'>
              <div className='px-5 pb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--admin-tertiary)]/80'>
                {group}
              </div>
              <Menu
                menuItemStyles={{
                  button: ({ active }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '11px 18px',
                    margin: '5px 12px',
                    borderRadius: '16px',
                    fontSize: '13.5px',
                    fontWeight: active ? '600' : '500',
                    color: active ? 'var(--admin-text)' : 'var(--admin-muted)',
                    background: active ? 'var(--admin-surface-soft)' : 'transparent',
                    border: active ? '1px solid var(--admin-border)' : '1px solid transparent',
                    boxShadow: active ? '0 12px 26px rgba(15, 23, 42, 0.06)' : 'none',
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
                {items.map(({ to, icon, label }) => (
                  <MenuItem
                    key={to}
                    icon={icon}
                    component={<Link to={to} />}
                    active={isItemActive(to)}
                  >
                    {label}
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
