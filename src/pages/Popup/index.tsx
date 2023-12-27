import React from 'react';
import ReactDOM from 'react-dom/client';

import { createMemoryRouter, RouterProvider, redirect } from 'react-router-dom';

import Root from './Pages/Root';
import MyGalxe from './Pages/MyGalxe';
import Campaigns from './Pages/Campaigns';

import './index.css';
import '../../../main.css';

const router = createMemoryRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        path: '/',
        loader: async () => {
          // determine which tab (page) to load

          const badgeText = await chrome.action.getBadgeText({});

          if (badgeText === '') {
            return redirect('/galxe');
          } else {
            return redirect('/campaigns');
          }
        },
      },
      {
        path: '/galxe',
        element: <MyGalxe />,
      },
      {
        path: '/campaigns',
        element: <Campaigns />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('app')!).render(
  <RouterProvider router={router}></RouterProvider>
);
