import React from 'react'
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar'
import { Link, useLocation } from 'react-router-dom'
import { PlusCircle, List, Package, LayoutDashboard, Users, Ticket, Layers, History, ListTree, Image, MessageSquare, Zap } from 'lucide-react'

const ALL_NAV_ITEMS = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard', roles: ['Admin']  },
  { to: '/employees', icon: <Users size={18} />,           label: 'Employees', roles: ['Admin']  },
  { to: '/import-batch', icon: <Package size={18} />,       label: 'Imports Hub', roles: ['Admin', 'Employee'] },
  { to: '/bulk-operation', icon: <Zap size={18} />,         label: 'Smart Ops', roles: ['Admin'] },
  { to: '/categories', icon: <Layers size={18} />,          label: 'Categories', roles: ['Admin', 'Employee'] },
  { to: '/sub-categories', icon: <ListTree size={18} />,    label: 'Sub-Categories', roles: ['Admin', 'Employee'] },
  { to: '/customers', icon: <Users size={18} />,           label: 'Customers', roles: ['Admin']  },
  { to: '/vouchers',  icon: <Ticket size={18} />,          label: 'Vouchers', roles: ['Admin']   },
  { to: '/add',       icon: <PlusCircle size={18} />,      label: 'Add Items', roles: ['Admin', 'Employee']  },
  { to: '/list',      icon: <List size={18} />,            label: 'List Items', roles: ['Admin', 'Employee'] },
  { to: '/orders',    icon: <Package size={18} />,         label: 'Orders', roles: ['Admin', 'Employee']     },
  { to: '/banners',   icon: <Image size={18} />,           label: 'Banners', roles: ['Admin', 'Employee']    },
  { to: '/reviews',   icon: <MessageSquare size={18} />,    label: 'Reviews', roles: ['Admin', 'Employee']    },
  { to: '/audit-logs', icon: <History size={18} />,         label: 'Audit Logs', roles: ['Admin'] },
]

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
        height: '100vh',
        borderRight: '1px solid #e7ddcf',
        background: 'rgba(255,251,247,0.82)',
        backdropFilter: 'blur(18px)',
        width: '244px',
      }}
    >
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
            color: active ? '#1f1a17' : '#746b61',
            backgroundColor: active ? '#f8f1e8' : 'transparent',
            border: active ? '1px solid #dfcfbc' : '1px solid transparent',
            boxShadow: active ? '0 10px 24px rgba(31, 26, 23, 0.06)' : 'none',
            '&:hover': {
              backgroundColor: '#fbf6ef',
              color: '#1f1a17',
            },
          }),
          icon: ({ active }) => ({
            color: active ? '#8a6a1f' : '#8b7c6e',
          }),
        }}
      >
        {navItems.map(({ to, icon, label }) => (
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
    </Sidebar>
  )
}

export default SidebarComponent
