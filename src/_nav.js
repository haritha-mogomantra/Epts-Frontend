import React from 'react'
import CIcon from '@coreui/icons-react'

import {
  cilBell,
  cilCalculator,
  cilChartPie,
  cilCursor,
  cilDescription,
  cilDrop,
  cilExternalLink,
  cilNotes,
  cilPencil,
  cilPuzzle,
  cilSpeedometer,
  cilStar,
  cilUser,

} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavGroup,
    name: 'Admin',
    to: '',
    items: [
      {
        component: CNavItem,
        name: 'Dashboard',
        to: '/dashboard',
        icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,

      },
      {
        component: CNavGroup,
        name: 'Employee',
        to: '',
        icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
        items: [
          {
            component: CNavItem,
            name: 'Employee details',
            to: '/base/employeedetails',
          },

          {
            component: CNavItem,
            name: 'Employee Performance ',
            to: '/base/employeeperformance',
          },
          {
            component: CNavItem,
            name: 'Employee credentials',
            to: '/base/cards',


          },


        ],
      },
      {
        component: CNavItem,
        name: 'Reports',
        to: '/buttons',
        icon: <CIcon icon={cilCursor} customClassName="nav-icon" />,

      },


    ]

  },


  {
    component: CNavItem,
    name: 'Login',
    to: '/login',
  },


  {
    component: CNavGroup,
    name: 'Employee',
    to: "",
    items: [
      {
        component: CNavGroup,
        name: 'Employee Module',
        to: '',
        icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
        items: [
          {
            component: CNavItem,
            name: 'Employee Dashboard',
            to: '/base/collapses',
          },

          {
            component: CNavItem,
            name: 'Employee Performance ',
            to: '/base/carousels',
          },
        ],
      },

    ]

  },





]

export default _nav
