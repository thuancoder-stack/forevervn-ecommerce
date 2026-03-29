import React from 'react'
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar'
import { Link, useLocation } from 'react-router-dom'
import { PlusCircle, List, Package, LayoutDashboard, Users } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard'  },
  { to: '/customers', icon: <Users size={18} />,           label: 'Customers'  },
  { to: '/add',       icon: <PlusCircle size={18} />,      label: 'Add Items'  },
  { to: '/list',      icon: <List size={18} />,            label: 'List Items' },
  { to: '/orders',    icon: <Package size={18} />,         label: 'Orders'     },
]

const SidebarComponent = () => {
  const location = useLocation()

  return (
    <Sidebar
      rootStyles={{
        height: '100vh',
        borderRight: '1px solid #f0f0f0',
        backgroundColor: '#ffffff',
      }}
    >
      <Menu
        menuItemStyles={{
          button: ({ active }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 20px',
            margin: '4px 12px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: active ? '600' : '400',
            color: active ? '#ec4899' : '#6b7280',
            backgroundColor: active ? '#fdf2f8' : 'transparent',
            border: active ? '1px solid #fbcfe8' : '1px solid transparent',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: '#fdf2f8',
              color: '#ec4899',
            },
          }),
        }}
      >
        {navItems.map(({ to, icon, label }) => (
          <MenuItem
            key={to}
            icon={icon}
            component={<Link to={to} />}
            active={location.pathname === to}
          >
            {label}
          </MenuItem>
        ))}
      </Menu>
    </Sidebar>
  )
}

export default SidebarComponent